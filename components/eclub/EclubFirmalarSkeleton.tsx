export default function EclubFirmalarSkeleton() {
  return (
    <div className="min-h-full bg-[var(--tema-iskelet-sayfa)] pb-20 md:pb-8" aria-busy="true" aria-label="Firmalar yükleniyor">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-3 py-4 md:gap-5 md:px-6 md:py-6">
        <div className="animate-pulse" aria-hidden="true">
          <div className="h-8 w-32 rounded-lg bg-[var(--tema-iskelet-baslik)]" />
          <div className="mt-2 h-4 w-96 max-w-full rounded bg-[var(--tema-iskelet-satir)]" />
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col rounded-[26px] border border-[var(--tema-iskelet-cizgi)] bg-[var(--tema-iskelet-kart)] p-3.5">
                <div className="aspect-[2.3/1] w-full rounded-[20px] bg-[var(--tema-iskelet-satir)]" />
                <div className="my-3 h-6 w-28 self-center rounded bg-[var(--tema-iskelet-satir)]" />
                <div className="grid grid-cols-2 gap-2 border-t border-[var(--tema-iskelet-ic-cizgi)] pt-3">
                  <div className="h-24 rounded-2xl bg-[var(--tema-iskelet-satir)]" />
                  <div className="h-24 rounded-2xl bg-[var(--tema-iskelet-satir)]" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <span className="sr-only">Veriler hazırlanıyor.</span>
      </div>
    </div>
  );
}
