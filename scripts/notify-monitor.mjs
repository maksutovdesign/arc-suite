import { randomUUID } from "node:crypto"
import { readFile } from "node:fs/promises"

const OUTPUT_LIMIT = 8_000
const SLACK_SNIPPET_LIMIT = 2_400

const config = {
  dryRun: process.env.ARC_NOTIFY_DRY_RUN === "true",
  outputFile: process.env.ARC_MONITOR_OUTPUT_FILE ?? "monitor-output.log",
  sentryDsn: firstPresent(process.env.ARC_SENTRY_DSN, process.env.SENTRY_DSN),
  slackWebhookUrl: firstPresent(process.env.ARC_SLACK_WEBHOOK_URL, process.env.SLACK_WEBHOOK_URL),
  strict: process.env.ARC_NOTIFY_STRICT === "true",
}

const context = buildGithubContext()
const output = await readMonitorOutput(config.outputFile)
const monitorResult = extractMonitorResult(output)
const failures = []

if (!config.slackWebhookUrl && !config.sentryDsn) {
  console.log("No alert sinks configured. Set ARC_SLACK_WEBHOOK_URL and/or ARC_SENTRY_DSN GitHub secrets.")
  process.exit(0)
}

if (config.slackWebhookUrl) {
  try {
    await notifySlack(config.slackWebhookUrl, context, output, monitorResult)
    console.log(config.dryRun ? "Slack alert dry-run complete." : "Slack alert sent.")
  } catch (error) {
    failures.push(`Slack alert failed: ${safeError(error)}`)
  }
}

if (config.sentryDsn) {
  try {
    await notifySentry(config.sentryDsn, context, output, monitorResult)
    console.log(config.dryRun ? "Sentry alert dry-run complete." : "Sentry alert sent.")
  } catch (error) {
    failures.push(`Sentry alert failed: ${safeError(error)}`)
  }
}

for (const failure of failures) {
  console.error(failure)
}

if (failures.length > 0 && config.strict) {
  process.exit(1)
}

function buildGithubContext() {
  const serverUrl = process.env.GITHUB_SERVER_URL ?? "https://github.com"
  const repository = process.env.GITHUB_REPOSITORY ?? "maksutovdesign/arc-suite"
  const runId = process.env.GITHUB_RUN_ID
  const sha = process.env.GITHUB_SHA ?? "local"

  return {
    actor: process.env.GITHUB_ACTOR ?? "local",
    eventName: process.env.GITHUB_EVENT_NAME ?? "local",
    job: process.env.GITHUB_JOB ?? "monitor",
    ref: process.env.GITHUB_REF_NAME ?? process.env.GITHUB_REF ?? "local",
    repository,
    runAttempt: process.env.GITHUB_RUN_ATTEMPT ?? "1",
    runUrl: runId ? `${serverUrl}/${repository}/actions/runs/${runId}` : undefined,
    sha,
    shortSha: sha.slice(0, 7),
    status: process.env.ARC_MONITOR_STATUS ?? "failure",
    workflow: process.env.GITHUB_WORKFLOW ?? "Arc Suite Production Monitor",
  }
}

async function readMonitorOutput(path) {
  try {
    return truncate(await readFile(path, "utf8"), OUTPUT_LIMIT)
  } catch {
    return "Monitor output file was not available."
  }
}

function extractMonitorResult(text) {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean)

  for (const line of lines.reverse()) {
    if (!line.startsWith("{") || !line.endsWith("}")) continue
    try {
      const parsed = JSON.parse(line)
      if (parsed?.status) return parsed
    } catch {
      // Keep scanning for the structured monitor result line.
    }
  }

  return undefined
}

async function notifySlack(webhookUrl, context, output, monitorResult) {
  const failureList = Array.isArray(monitorResult?.failures)
    ? monitorResult.failures.map((failure) => `- ${failure.name}: ${failure.message}`).join("\n")
    : output

  const payload = {
    text: `Arc Suite production monitor failed in ${context.repository}`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "Arc Suite production monitor failed",
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: [
            `*Repository:* ${context.repository}`,
            `*Workflow:* ${context.workflow}`,
            `*Branch:* ${context.ref}`,
            `*Commit:* ${context.shortSha}`,
            `*Event:* ${context.eventName}`,
          ].join("\n"),
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Monitor output:*\n\`\`\`${truncate(failureList, SLACK_SNIPPET_LIMIT)}\`\`\``,
        },
      },
      ...(context.runUrl
        ? [
            {
              type: "actions",
              elements: [
                {
                  type: "button",
                  text: {
                    type: "plain_text",
                    text: "Open GitHub run",
                  },
                  url: context.runUrl,
                },
              ],
            },
          ]
        : []),
    ],
  }

  if (config.dryRun) {
    console.log(JSON.stringify({ payload, sink: "slack" }, null, 2))
    return
  }

  const response = await fetch(webhookUrl, {
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  })

  if (!response.ok) {
    throw new Error(`webhook returned ${response.status}`)
  }
}

async function notifySentry(dsn, context, output, monitorResult) {
  const parsed = parseSentryDsn(dsn)
  const timestamp = new Date().toISOString()
  const event = {
    culprit: context.workflow,
    environment: process.env.ARC_SENTRY_ENVIRONMENT ?? process.env.SENTRY_ENVIRONMENT ?? "production",
    event_id: randomUUID().replaceAll("-", ""),
    extra: {
      monitor_output: output,
      monitor_result: monitorResult,
      run_url: context.runUrl,
    },
    contexts: {
      github: {
        actor: context.actor,
        event_name: context.eventName,
        job: context.job,
        ref: context.ref,
        repository: context.repository,
        run_attempt: context.runAttempt,
        run_url: context.runUrl,
        sha: context.sha,
        workflow: context.workflow,
      },
    },
    level: "error",
    message: "Arc Suite production monitor failed",
    platform: "node",
    release: context.sha,
    tags: {
      app: "arc-suite",
      event_name: context.eventName,
      monitor: "production",
      repository: context.repository,
      workflow: context.workflow,
    },
    timestamp,
  }

  const body = [
    JSON.stringify({ dsn }),
    JSON.stringify({ type: "event" }),
    JSON.stringify(event),
  ].join("\n")

  if (config.dryRun) {
    console.log(JSON.stringify({ endpoint: parsed.envelopeUrl, event, sink: "sentry" }, null, 2))
    return
  }

  const response = await fetch(parsed.envelopeUrl, {
    body,
    headers: { "Content-Type": "application/x-sentry-envelope" },
    method: "POST",
  })

  if (!response.ok) {
    throw new Error(`envelope returned ${response.status}`)
  }
}

function parseSentryDsn(dsn) {
  const url = new URL(dsn)
  const projectId = url.pathname.split("/").filter(Boolean).at(-1)

  if (!url.username || !projectId) {
    throw new Error("Sentry DSN is missing public key or project id")
  }

  return {
    envelopeUrl: `${url.protocol}//${url.host}/api/${projectId}/envelope/`,
  }
}

function firstPresent(...values) {
  return values.find((value) => typeof value === "string" && value.trim().length > 0)
}

function safeError(error) {
  return error instanceof Error ? error.message : String(error)
}

function truncate(value, limit) {
  if (value.length <= limit) return value
  return `${value.slice(0, limit - 24)}\n... truncated ...`
}
