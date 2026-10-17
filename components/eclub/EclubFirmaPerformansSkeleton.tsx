export default function EclubFirmaPerformansSkeleton() {
  return <div className="min-h-full bg-[var(--tema-iskelet-sayfa)] pb-20 md:pb-8" aria-busy="true" aria-label="Yayın tamamlama performansı yükleniyor">
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-3 py-4 md:gap-5 md:px-6 md:py-6">
      <div className="flex animate-pulse flex-col gap-4 md:gap-5" aria-hidden="true">
        <div className="h-4 w-28 rounded bg-[var(--tema-iskelet-satir)]" />
        <div className="h-8 w-48 rounded bg-[var(--tema-iskelet-baslik)]" />
        <div className="h-10 rounded bg-[var(--tema-iskelet-satir)]" />
        <div className="h-10 w-96 max-w-full rounded bg-[var(--tema-iskelet-satir)]" />
        <div className="h-8 w-72 max-w-full rounded bg-[var(--tema-iskelet-baslik)]" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">{[0, 1, 2].map(i => <div key={i} className="h-28 rounded-2xl bg-[var(--tema-iskelet-kart)]" />)}</div>
        <div className="h-80 rounded-2xl bg-[var(--tema-iskelet-kart)]" />
        <div className="h-48 rounded-2xl bg-[var(--tema-iskelet-kart)]" />
      </div>
      <span className="sr-only">Performans verileri hazırlanıyor.</span>
    </div>
  </div>;
}

export function EclubPerformansIcerikSkeleton() {
  return <div className="flex animate-pulse flex-col gap-4" role="status" aria-label="Performans verileri yükleniyor">
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-hidden="true">{[0, 1, 2].map(i => <div key={i} className="h-28 rounded-2xl bg-[var(--tema-iskelet-satir)]" />)}</div>
    <div className="h-80 rounded-2xl bg-[var(--tema-iskelet-satir)]" aria-hidden="true" />
    <div className="h-48 rounded-2xl bg-[var(--tema-iskelet-satir)]" aria-hidden="true" />
    <span className="sr-only">Performans yükleniyor…</span>
  </div>;
}
