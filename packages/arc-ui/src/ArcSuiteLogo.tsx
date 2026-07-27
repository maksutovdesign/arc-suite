import Image from "next/image"

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ""

export function ArcSuiteLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-2" aria-label="Kestrel — Built on Arc">
      <Image
        alt=""
        className={compact ? "h-5 w-5" : "h-7 w-7"}
        height={48}
        src={`${basePath}/kestrel-mark.svg`}
        unoptimized
        width={48}
      />
      {!compact && <span className="text-sm font-semibold tracking-[-0.02em] text-white">Kestrel</span>}
      {!compact && <span className="text-[8px] font-medium uppercase tracking-[0.12em] text-[#7f94aa]">Built on Arc</span>}
    </span>
  )
}
