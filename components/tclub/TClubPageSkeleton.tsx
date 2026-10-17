export default function TClubPageSkeleton({
  aktifSayfa,
}: {
  aktifSayfa: "lig" | "rapor";
}) {
  return (
    <div
      className="min-h-full bg-[linear-gradient(135deg,var(--tema-iskelet-tclub-ilk)_0%,var(--tema-iskelet-tclub-orta)_48%,var(--tema-iskelet-tclub-son)_100%)] px-3 py-3 md:px-5"
      aria-busy="true"
      aria-label={`${aktifSayfa === "lig" ? "T-Club Ligi" : "T-Club Raporları"} yükleniyor`}
    >
      <div className="mx-auto max-w-[1280px]">
        <div className="animate-pulse">
          {aktifSayfa === "lig" ? (
            <>
              <div className="mb-3 h-7 w-44 rounded-lg bg-[var(--tema-iskelet-baslik)]" />
              <div className="mb-4 aspect-[1932/480] w-full rounded-2xl bg-[var(--tema-iskelet-baslik)]" />
              <div className="mb-4 flex flex-wrap justify-end gap-2">
                <div className="h-9 w-44 rounded-[14px] bg-[var(--tema-iskelet-satir)]" />
                <div className="h-9 w-72 max-w-full rounded-[14px] bg-[var(--tema-iskelet-satir)]" />
                <div className="h-9 w-20 rounded-xl bg-[var(--tema-iskelet-satir)]" />
              </div>
              <div className="h-72 rounded-2xl bg-[var(--tema-iskelet-kart)] shadow-sm" />
            </>
          ) : (
            <>
              <div className="mb-3 h-7 w-44 rounded-lg bg-[var(--tema-iskelet-baslik)]" />
              <div className="mb-4 h-4 w-64 max-w-[80%] rounded bg-[var(--tema-iskelet-satir)]" />
              <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[0, 1, 2].map((item) => <div key={item} className="h-28 rounded-2xl bg-[var(--tema-iskelet-kart)] shadow-sm" />)}
              </div>
              <div className="h-72 rounded-2xl bg-[var(--tema-iskelet-kart)] shadow-sm" />
            </>
          )}
        </div>
      </div>
      <span className="sr-only">Veriler hazırlanıyor.</span>
    </div>
  );
}
