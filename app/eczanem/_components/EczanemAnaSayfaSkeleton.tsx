export function EczanemBannerSkeleton() {
  return <div aria-hidden="true" className="aspect-[1930/300] w-full animate-pulse rounded-[18px] bg-[var(--tema-iskelet-baslik)] motion-reduce:animate-none" />;
}

export function EczanemRaflarSkeleton() {
  return <div role="status" aria-busy="true" aria-label="Öğrenme içerikleri yükleniyor" className="flex flex-col gap-6">
    <div aria-hidden="true" className="flex flex-col gap-6 animate-pulse motion-reduce:animate-none">
      <div className="h-9 w-full rounded-lg bg-[var(--tema-iskelet-satir)]" />
      {[0, 1, 2].map(raf => <div key={raf}>
        <div className="mb-3 h-6 w-52 max-w-full rounded bg-[var(--tema-iskelet-baslik)]" />
        <div className="flex gap-2.5 overflow-hidden px-1 pb-2 pt-1">
          {[0, 1, 2, 3, 4, 5].map(kart => <div key={kart} className="w-full shrink-0 sm:w-44 md:w-52">
            <div className="overflow-hidden rounded-xl bg-[var(--tema-iskelet-kart)] shadow-sm">
              <div className="aspect-video bg-[var(--tema-iskelet-baslik)]" />
              <div className="h-32" />
            </div>
            <div className="mt-2 h-4 w-3/4 rounded bg-[var(--tema-iskelet-satir)]" />
          </div>)}
        </div>
      </div>)}
    </div>
    <span className="sr-only">Öğrenme içerikleri hazırlanıyor.</span>
  </div>;
}

export default function EczanemAnaSayfaSkeleton() {
  return <div aria-busy="true" aria-label="Eczanem ana sayfa yükleniyor" className="min-h-full bg-[var(--tema-iskelet-sayfa)] pb-20 md:pb-8">
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-3 py-4 md:gap-5 md:px-6 md:py-6">
      <div aria-hidden="true" className="animate-pulse motion-reduce:animate-none">
        <div className="h-7 w-64 max-w-full rounded-lg bg-[var(--tema-iskelet-baslik)]" />
        <div className="mt-2 h-4 w-96 max-w-full rounded bg-[var(--tema-iskelet-satir)]" />
      </div>
      <EczanemBannerSkeleton />
      <div aria-hidden="true" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[0, 1, 2].map(kart => <div key={kart} className="h-28 animate-pulse rounded-2xl bg-[var(--tema-iskelet-kart)] motion-reduce:animate-none" />)}
      </div>
      <EczanemRaflarSkeleton />
    </div>
  </div>;
}
