import Link from "next/link"

const variants = [
  {
    name: "01 / Kestrel Cyan",
    note: "Independent K monogram with a directional flight path.",
    color: "#5fbfff",
    rx: 20,
  },
  {
    name: "02 / Core Blue",
    note: "Slightly deeper blue for stronger contrast.",
    color: "#4d8ee9",
    rx: 20,
  },
  {
    name: "03 / Sky",
    note: "Brighter, cleaner app-icon direction.",
    color: "#62cfff",
    rx: 22,
  },
  {
    name: "04 / Deep Blue",
    note: "Darker and more serious.",
    color: "#2f86dd",
    rx: 18,
  },
  {
    name: "05 / Soft Square",
    note: "More rounded, friendlier product mark.",
    color: "#5fbfff",
    rx: 26,
  },
  {
    name: "06 / Circle",
    note: "Circular badge version.",
    color: "#5fbfff",
    rx: 38,
  },
]

function BlueLogo({ color, rx }: { color: string; rx: number }) {
  return (
    <svg viewBox="0 0 96 96" aria-hidden="true">
      <rect x="8" y="8" width="80" height="80" rx={rx} fill={color} />
      <text x="48" y="70" textAnchor="middle" className="logo-svg-a blue-a-full">
        K
      </text>
    </svg>
  )
}

export default function LogoOptionsPage() {
  return (
    <main className="logo-lab">
      <section className="logo-lab-hero">
        <p className="kicker">Logo exploration</p>
        <h1>Kestrel independent identity.</h1>
        <p>
          A standalone product mark. Arc remains the underlying network and appears only
          in the supporting “Built on Arc” relationship line.
        </p>
        <Link className="button secondary" href="/">Back to landing</Link>
      </section>

      <section className="logo-grid" aria-label="Kestrel logo options">
        {variants.map((variant) => (
          <article className="logo-card" key={variant.name}>
            <div className="logo-preview">
              <BlueLogo color={variant.color} rx={variant.rx} />
            </div>
            <div>
              <h2>{variant.name}</h2>
              <p>{variant.note}</p>
              <div className="logo-wordmark">
                <span>
                  <BlueLogo color={variant.color} rx={variant.rx} />
                </span>
                <strong>Kestrel · Built on Arc</strong>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  )
}
