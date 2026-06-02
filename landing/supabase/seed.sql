-- Arc Suite pilot seed data.
-- Safe to rerun: records are upserted by primary key.

insert into workspaces (id, name, mode, created_at, updated_at) values
  ('wrk_arc_demo', 'Arc Pilot Workspace', 'pilot', '2026-06-02T01:40:00Z', '2026-06-02T01:40:00Z')
on conflict (id) do update set name = excluded.name, mode = excluded.mode, updated_at = excluded.updated_at;

insert into agents (id, workspace_id, name, address, status, network, balance_usdc, monthly_budget_usdc, monthly_spent_usdc, daily_limit_usdc, daily_spent_usdc, tx_count, tags, created_at, last_active_at) values
  ('agt_01', 'wrk_arc_demo', 'DataHarvester-Pro', '0x1a2b...9f3c', 'active', 'Arc', 847.32, 1000, 152.68, 50, 12.4, 1847, array['data','scraping','production'], '2025-03-01T00:00:00Z', '2026-06-01T10:42:00Z'),
  ('agt_02', 'wrk_arc_demo', 'TradeBot-Alpha', '0x4d5e...2a1b', 'alert', 'Arc', 23.11, 500, 476.89, 30, 29.8, 4291, array['trading','defi','production'], '2025-01-15T00:00:00Z', '2026-06-01T10:40:00Z'),
  ('agt_03', 'wrk_arc_demo', 'ContentGen-v2', '0x7f8a...5c4d', 'active', 'Ethereum', 312.5, 400, 87.5, 20, 4.2, 623, array['content','ai','staging'], '2025-04-10T00:00:00Z', '2026-06-01T10:38:00Z'),
  ('agt_04', 'wrk_arc_demo', 'ResearchAssist', '0x3c9d...8e7f', 'paused', 'Arc', 150, 200, 50, 15, 0, 289, array['research','analysis'], '2025-02-20T00:00:00Z', '2026-05-29T10:00:00Z'),
  ('agt_05', 'wrk_arc_demo', 'IoT-Gateway-01', '0x6b1c...4d2e', 'active', 'Arc', 1240, 2000, 760, 100, 38.5, 18432, array['iot','sensors','production'], '2024-12-01T00:00:00Z', '2026-06-01T10:41:30Z'),
  ('agt_06', 'wrk_arc_demo', 'AuditBot-Corp', '0x9e2f...1a3b', 'idle', 'Arc', 82.5, 300, 0, 25, 0, 0, array['audit','compliance','dev'], '2025-05-28T00:00:00Z', null)
on conflict (id) do update set
  status = excluded.status,
  balance_usdc = excluded.balance_usdc,
  monthly_budget_usdc = excluded.monthly_budget_usdc,
  monthly_spent_usdc = excluded.monthly_spent_usdc,
  daily_limit_usdc = excluded.daily_limit_usdc,
  daily_spent_usdc = excluded.daily_spent_usdc,
  tx_count = excluded.tx_count,
  last_active_at = excluded.last_active_at;

insert into api_providers (id, name, verified) values
  ('prv_01', 'ChainData Labs', true),
  ('prv_02', 'ModelStack', true),
  ('prv_03', 'Atmo API', true),
  ('prv_04', 'ComputeGrid', false),
  ('prv_05', 'OracleHub', true)
on conflict (id) do update set name = excluded.name, verified = excluded.verified;

insert into api_listings (id, provider_id, name, category, price_usdc, pricing_unit, uptime_pct, request_count, min_reputation_score) values
  ('api_01', 'prv_01', 'Realtime Price Feed', 'Finance', 0.003, 'request', 99.98, 5800000, 700),
  ('api_02', 'prv_02', 'GPT-4o Proxy', 'AI / LLM', 0.012, '1k tokens', 99.82, 7200000, 850),
  ('api_03', 'prv_03', 'Weather Feed', 'Data feeds', 0.002, 'request', 99.91, 3100000, 600),
  ('api_04', 'prv_04', 'A100 Burst Compute', 'Compute', 0.08, 'minute', 98.72, 1200000, 820),
  ('api_05', 'prv_05', 'Risk Oracle', 'Oracles', 0.006, 'request', 99.67, 2500000, 760)
on conflict (id) do update set
  price_usdc = excluded.price_usdc,
  uptime_pct = excluded.uptime_pct,
  request_count = excluded.request_count,
  min_reputation_score = excluded.min_reputation_score;

insert into reputation_profiles (agent_id, score, score_change_30d, tier, payment_reliability, volume_consistency, response_time, dispute_history, account_age, updated_at) values
  ('agt_01', 961, 14, 'Platinum', 98, 94, 96, 99, 91, '2026-06-01T10:42:00Z'),
  ('agt_05', 944, 8, 'Platinum', 97, 93, 92, 99, 88, '2026-06-01T10:41:30Z'),
  ('agt_02', 812, -23, 'Gold', 82, 74, 89, 78, 84, '2026-06-01T10:40:00Z'),
  ('agt_03', 789, 31, 'Gold', 80, 81, 79, 82, 73, '2026-06-01T10:38:00Z'),
  ('agt_04', 634, 5, 'Silver', 67, 62, 64, 72, 58, '2026-05-29T10:00:00Z'),
  ('agt_06', 150, 150, 'New', 20, 10, 15, 25, 5, '2026-06-01T08:00:00Z')
on conflict (agent_id) do update set
  score = excluded.score,
  score_change_30d = excluded.score_change_30d,
  tier = excluded.tier,
  updated_at = excluded.updated_at;

insert into budget_alerts (id, workspace_id, agent_id, type, severity, message, created_at, resolved_at) values
  ('alrt_01', 'wrk_arc_demo', 'agt_02', 'monthly_limit', 'critical', 'Monthly budget 95% used', '2026-06-01T10:30:00Z', null),
  ('alrt_02', 'wrk_arc_demo', 'agt_02', 'low_balance', 'critical', 'Wallet balance critically low', '2026-06-01T10:30:00Z', null),
  ('alrt_03', 'wrk_arc_demo', 'agt_02', 'daily_limit', 'warning', 'Daily limit nearly reached', '2026-06-01T09:00:00Z', null),
  ('alrt_04', 'wrk_arc_demo', 'agt_05', 'unusual_spend', 'warning', 'Spending 2.4x higher than 7-day average', '2026-05-31T22:00:00Z', '2026-06-01T07:00:00Z')
on conflict (id) do update set severity = excluded.severity, message = excluded.message, resolved_at = excluded.resolved_at;

insert into transactions (id, workspace_id, agent_id, amount_usdc, category, description, status, occurred_at, tx_hash, network, recipient) values
  ('tx_001', 'wrk_arc_demo', 'agt_01', 0.003, 'api_call', 'Weather API realtime data fetch', 'completed', '2026-06-01T10:42:00Z', '0xabc1...ef01', 'Arc', '0xWeatherAPI'),
  ('tx_002', 'wrk_arc_demo', 'agt_05', 0.001, 'data_feed', 'Sensor stream temperature batch', 'completed', '2026-06-01T10:41:30Z', '0xdef2...ab02', 'Arc', '0xSensorHub'),
  ('tx_003', 'wrk_arc_demo', 'agt_02', 12.5, 'swap', 'USDC to ETH swap via DEX', 'completed', '2026-06-01T10:40:00Z', '0xghi3...cd03', 'Arc', '0xUniswap'),
  ('tx_004', 'wrk_arc_demo', 'agt_03', 0.05, 'compute', 'LLM inference 10k tokens', 'completed', '2026-06-01T10:38:00Z', '0xjkl4...ef04', 'Ethereum', '0xOpenAI'),
  ('tx_005', 'wrk_arc_demo', 'agt_01', 0.002, 'api_call', 'CoinGecko price feed', 'completed', '2026-06-01T10:35:00Z', '0xmno5...gh05', 'Arc', '0xCoinGecko'),
  ('tx_006', 'wrk_arc_demo', 'agt_02', 8.75, 'swap', 'ETH to USDC rebalance', 'pending', '2026-06-01T10:32:00Z', '0xpqr6...ij06', 'Arc', '0xCurve'),
  ('tx_007', 'wrk_arc_demo', 'agt_05', 0.001, 'storage', 'IPFS pin sensor snapshot', 'completed', '2026-06-01T10:30:00Z', '0xstu7...kl07', 'Arc', '0xIPFS'),
  ('tx_008', 'wrk_arc_demo', 'agt_03', 0.08, 'api_call', 'Perplexity search research query', 'completed', '2026-06-01T10:28:00Z', '0xvwx8...mn08', 'Ethereum', '0xPerplexity'),
  ('tx_009', 'wrk_arc_demo', 'agt_01', 0.015, 'bridge', 'USDC bridge Arc to Ethereum', 'failed', '2026-06-01T10:25:00Z', '0xyza9...op09', 'Arc', '0xCCTP'),
  ('tx_010', 'wrk_arc_demo', 'agt_05', 0.001, 'data_feed', 'Air quality index stream', 'completed', '2026-06-01T10:22:00Z', '0xbcd0...qr10', 'Arc', '0xAQI'),
  ('tx_011', 'wrk_arc_demo', 'agt_02', 4.2, 'api_call', 'Bloomberg market data premium tier', 'completed', '2026-06-01T09:55:00Z', '0xcde1...st11', 'Arc', '0xBloomberg'),
  ('tx_012', 'wrk_arc_demo', 'agt_01', 0.004, 'api_call', 'Twitter API v2 filtered stream', 'completed', '2026-06-01T09:50:00Z', '0xefg2...uv12', 'Arc', '0xTwitter')
on conflict (id) do update set status = excluded.status, occurred_at = excluded.occurred_at;
