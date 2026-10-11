export default function EclubFirmaYayinlarSkeleton() {
  return <div className="min-h-full bg-[#f7f9fc] pb-20 md:pb-8" aria-busy="true" aria-label="Firma yayınları yükleniyor">
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-3 py-4 md:gap-5 md:px-6 md:py-6">
      <div className="flex flex-col gap-4 animate-pulse md:gap-5" aria-hidden="true">
        <div className="h-4 w-28 rounded bg-[#e8eef5]" />
        <div className="h-8 w-48 rounded-lg bg-[#dfe8f2]" />
        <div className="aspect-[1932/480] rounded-2xl bg-[#dfe8f2] md:aspect-[1932/320]" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-28 rounded-2xl bg-white" />)}
        </div>
        <div className="h-10 rounded-lg bg-[#e8eef5]" />
        <div className="h-10 w-96 max-w-full rounded-lg bg-[#e8eef5]" />
        <div className="h-56 rounded-2xl bg-white" />
      </div>
      <span className="sr-only">Veriler hazırlanıyor.</span>
    </div>
  </div>;
}
