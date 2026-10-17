export default function EclubLigiSkeleton() {
  return (
    <div className="min-h-full animate-pulse overflow-x-hidden bg-[var(--tema-iskelet-lig-sayfa)] px-3 py-3" aria-label="E-Club Ligi yükleniyor" role="status">
      <div className="mx-auto max-w-[1360px]">
        <div className="h-8 w-40 rounded-lg bg-[var(--tema-iskelet-lig-satir)]" />
        <div className="mt-2 h-4 w-72 max-w-full rounded bg-[var(--tema-iskelet-lig-satir)]" />
        <div className="mt-5 aspect-[1932/480] w-full rounded-[18px] bg-[var(--tema-iskelet-lig-banner)]" />
        <div className="mt-4 flex gap-2">
          <div className="h-11 min-w-0 flex-1 rounded-[14px] bg-[var(--tema-iskelet-kart)]" />
          <div className="h-11 w-20 rounded-[14px] bg-[var(--tema-iskelet-kart)]" />
          <div className="h-11 w-20 rounded-[14px] bg-[var(--tema-iskelet-kart)]" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-28 rounded-2xl bg-[var(--tema-iskelet-kart)]" />
          ))}
        </div>
        <div className="mt-4 h-64 rounded-[18px] bg-[var(--tema-iskelet-kart)]" />
      </div>
    </div>
  );
}
