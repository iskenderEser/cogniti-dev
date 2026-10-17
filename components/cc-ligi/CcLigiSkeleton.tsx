export default function CcLigiSkeleton() {
  return (
    <div
      className="min-h-screen bg-[var(--tema-iskelet-cc-sayfa)] px-3 py-3 md:px-4 md:py-6"
      aria-busy="true"
      aria-label="C-Club Ligi yükleniyor"
    >
      <div className="mx-auto max-w-5xl animate-pulse">
        <div className="mb-4 h-4 w-20 rounded bg-[var(--tema-iskelet-cc-etiket)]" />
        <div className="mb-2 h-8 w-48 rounded-lg bg-[var(--tema-iskelet-cc-baslik)]" />
        <div className="mb-6 h-4 w-72 max-w-[80%] rounded bg-[var(--tema-iskelet-cc-aciklama)]" />

        <div className="mx-auto mb-4 w-[66.40625%] max-w-[688px] space-y-4">
          <div className="mx-auto aspect-square w-[168px] max-w-full rounded-2xl bg-[var(--tema-iskelet-cc-banner)] sm:w-[calc(28%-10px)]" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="aspect-square rounded-2xl bg-[var(--tema-iskelet-cc-banner)]" />
            ))}
          </div>
        </div>

        <div className="mb-3 h-12 w-full max-w-lg rounded-[14px] bg-[var(--tema-iskelet-kart)] shadow-sm" />
        <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="h-28 rounded-2xl bg-[var(--tema-iskelet-cc-bilgi)] sm:col-span-1" />
          <div className="h-36 rounded-2xl bg-[var(--tema-iskelet-cc-kazanim)] sm:h-28" />
          <div className="h-36 rounded-2xl bg-[var(--tema-iskelet-cc-kayip)] sm:h-28" />
        </div>
        <div className="h-72 rounded-2xl bg-[var(--tema-iskelet-kart)] shadow-sm" />
      </div>
      <span className="sr-only">C-Club verileri hazırlanıyor.</span>
    </div>
  );
}
