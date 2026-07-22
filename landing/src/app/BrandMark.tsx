type BrandMarkProps = {
  idPrefix?: string
}

export function BrandMark({ idPrefix: _idPrefix }: BrandMarkProps) {
  return (
    <span className="brand-mark" data-brand-id={_idPrefix}>
      <img className="brand-mark-logo" src="/kestrel-mark.svg" alt="" aria-hidden="true" />
      <span className="brand-wordmark">Kestrel</span>
      <span className="brand-built">Built on Arc</span>
    </span>
  )
}
