export default function EclubFirmalarSkeleton() {
  return (
    <div className="min-h-full bg-[#f7f9fc] pb-20 md:pb-8" aria-busy="true" aria-label="Firmalar yükleniyor">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-3 py-4 md:gap-5 md:px-6 md:py-6">
        <div className="animate-pulse" aria-hidden="true">
          <div className="h-8 w-32 rounded-lg bg-[#dfe8f2]" />
          <div className="mt-2 h-4 w-96 max-w-full rounded bg-[#e8eef5]" />
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center gap-4 rounded-2xl border border-[#dfe7f1] bg-white p-5">
                <div className="h-28 w-full rounded-xl bg-[#e8eef5]" />
                <div className="h-5 w-28 rounded bg-[#e8eef5]" />
              </div>
            ))}
          </div>
        </div>
        <span className="sr-only">Veriler hazırlanıyor.</span>
      </div>
    </div>
  );
}
