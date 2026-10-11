export default function EclubFirmaCekTakibiSkeleton() {
  return <div className="mx-auto flex w-full max-w-6xl animate-pulse flex-col gap-4 px-3 py-4 md:gap-5 md:px-6 md:py-6" role="status" aria-label="Hediye çeki takibi yükleniyor" aria-busy="true">
    <div className="h-8 w-56 rounded bg-[#dfe8f2]" aria-hidden="true" />
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-hidden="true">{[0, 1, 2].map(i => <div key={i} className="h-28 rounded-2xl bg-[#e8eef5]" />)}</div>
    <div className="h-10 rounded bg-[#e8eef5]" aria-hidden="true" />
    <div className="h-10 w-96 max-w-full rounded bg-[#e8eef5]" aria-hidden="true" />
    <div className="h-32 rounded-2xl bg-[#e8eef5]" aria-hidden="true" />
    {[0, 1].map(i => <div key={i} className="h-48 rounded-2xl bg-[#e8eef5]" aria-hidden="true" />)}
    <span className="sr-only">Çek talepleri hazırlanıyor.</span>
  </div>;
}
