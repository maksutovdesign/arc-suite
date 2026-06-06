type BrandMarkProps = {
  idPrefix?: string
}

export function BrandMark({ idPrefix: _idPrefix }: BrandMarkProps) {
  return (
    <span className="brand-mark" aria-hidden="true" data-brand-id={_idPrefix}>
      <svg viewBox="0 0 48 48" role="img">
        <rect x="3" y="3" width="42" height="42" rx="14" fill="#5fbfff" />
        <text x="24" y="38.5" textAnchor="middle" className="brand-mark-letter">
          a
        </text>
      </svg>
    </span>
  )
}
