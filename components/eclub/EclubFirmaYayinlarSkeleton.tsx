export default function EclubFirmaYayinlarSkeleton() {
  return <div className="min-h-full bg-[var(--tema-iskelet-sayfa)] pb-20 md:pb-8" aria-busy="true" aria-label="Firma yayınları yükleniyor">
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-3 py-4 md:gap-5 md:px-6 md:py-6">
      <div className="flex flex-col gap-4 animate-pulse md:gap-5" aria-hidden="true">
        <div className="h-4 w-28 rounded bg-[var(--tema-iskelet-satir)]" />
        <div className="h-8 w-48 rounded-lg bg-[var(--tema-iskelet-baslik)]" />
        <div className="aspect-[1932/480] rounded-2xl bg-[var(--tema-iskelet-baslik)] md:aspect-[1932/320]" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-28 rounded-2xl bg-[var(--tema-iskelet-kart)]" />)}
        </div>
        <div className="h-10 rounded-lg bg-[var(--tema-iskelet-satir)]" />
        <div className="h-10 w-96 max-w-full rounded-lg bg-[var(--tema-iskelet-satir)]" />
        <div className="h-56 rounded-2xl bg-[var(--tema-iskelet-kart)]" />
      </div>
      <span className="sr-only">Veriler hazırlanıyor.</span>
    </div>
  </div>;
}
