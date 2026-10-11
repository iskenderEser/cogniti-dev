export default function EclubAnaSayfaSkeleton() {
  return (
    <div
      className="min-h-full bg-[#f7f9fc] pb-20 md:pb-8"
      aria-busy="true"
      aria-label="E-Club ana sayfa yükleniyor"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-3 py-4 md:gap-5 md:px-6 md:py-6">
        <div className="flex flex-col gap-4 animate-pulse md:gap-5" aria-hidden="true">
          <div>
            <div className="h-7 w-64 max-w-full rounded-lg bg-[#dfe8f2]" />
            <div className="mt-2 h-4 w-96 max-w-full rounded bg-[#e8eef5]" />
          </div>
          <div className="aspect-[1932/480] w-full rounded-2xl bg-[#dfe8f2]" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-28 rounded-2xl border border-[#dfe7f1] bg-white" />
            ))}
          </div>
          <div className="h-72 rounded-2xl bg-white shadow-sm" />
        </div>
      </div>
      <span className="sr-only">Veriler hazırlanıyor.</span>
    </div>
  );
}
