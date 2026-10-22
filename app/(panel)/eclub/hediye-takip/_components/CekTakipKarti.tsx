import { CEK_TALEP_DURUM_META } from "@/lib/eclub/store/eclubStoreTipler";
import {
  cekTakipTeslimatiTamamlandiMi,
  type CekTakipIslemi,
  type CekTakipTalebi,
} from "@/lib/eclub/hediyeTakip/cekTakip";
import { eclubKisiRolEtiketi } from "@/lib/utils/roller";
import { ogrenmeAraciMetinleri } from "@/lib/ogrenmeAraci/etiketler";

function tarihFormatla(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function kosulMetni(talep: CekTakipTalebi): string {
  if (talep.odul_kosulu.siparis_tipi === "siparissiz_cek") return "Siparişsiz çek";
  if (!talep.odul_kosulu.siparis_verildi_mi) return "Sipariş verilmedi";
  return `${talep.odul_kosulu.siparis_adet} + ${talep.odul_kosulu.siparis_mal_fazlasi}`;
}

function teslimatSunumu(talep: CekTakipTalebi): { etiket: string; sinif: string } {
  if (talep.durum === "iptal") {
    return { etiket: "Uygulanmaz", sinif: "border-[var(--tema-cek-teslimat-uygulanmaz-cizgi)] bg-[var(--tema-cek-teslimat-uygulanmaz-zemin)] text-[var(--tema-cek-teslimat-uygulanmaz-metin)]" };
  }
  const kanallar = [talep.teslimat.eposta, talep.teslimat.push];
  const toplam = kanallar.reduce((sayac, kanal) => sayac + kanal.toplam, 0);
  const tamamlanan = kanallar.reduce((sayac, kanal) => sayac + kanal.tamamlanan, 0);
  const basarisiz = kanallar.reduce((sayac, kanal) => sayac + kanal.basarisiz, 0);
  const isleniyor = kanallar.reduce((sayac, kanal) => sayac + kanal.isleniyor, 0);

  if (toplam === 0) return { etiket: "Henüz başlamadı", sinif: "border-[var(--tema-cek-teslimat-baslamadi-cizgi)] bg-[var(--tema-cek-teslimat-baslamadi-zemin)] text-[var(--tema-cek-teslimat-baslamadi-metin)]" };
  if (basarisiz > 0) return { etiket: "Teslimat başarısız", sinif: "border-[var(--tema-cek-teslimat-hata-cizgi)] bg-[var(--tema-cek-teslimat-hata-zemin)] text-[var(--tema-cek-teslimat-hata-metin)]" };
  if (cekTakipTeslimatiTamamlandiMi(talep)) return { etiket: "Teslim edildi", sinif: "border-[var(--tema-cek-teslimat-tamam-cizgi)] bg-[var(--tema-cek-teslimat-tamam-zemin)] text-[var(--tema-cek-teslimat-tamam-metin)]" };
  if (tamamlanan > 0) return { etiket: "Kısmen teslim edildi", sinif: "border-[var(--tema-cek-teslimat-kismi-cizgi)] bg-[var(--tema-cek-teslimat-kismi-zemin)] text-[var(--tema-cek-teslimat-kismi-metin)]" };
  if (isleniyor > 0) return { etiket: "Gönderiliyor", sinif: "border-[var(--tema-cek-teslimat-isleniyor-cizgi)] bg-[var(--tema-cek-teslimat-isleniyor-zemin)] text-[var(--tema-cek-teslimat-isleniyor-metin)]" };
  return { etiket: "Gönderim bekliyor", sinif: "border-[var(--tema-cek-teslimat-bekliyor-cizgi)] bg-[var(--tema-cek-teslimat-bekliyor-zemin)] text-[var(--tema-cek-teslimat-bekliyor-metin)]" };
}

export function CekTakipTeslimatOzeti({ talep }: { talep: CekTakipTalebi }) {
  const sunum = teslimatSunumu(talep);
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${sunum.sinif}`}>
      {sunum.etiket}
    </span>
  );
}

export function CekTakipTeslimTarihi({ talep }: { talep: CekTakipTalebi }) {
  return <span className="whitespace-nowrap font-bold text-[var(--tema-yerel-eclub-ana-metin-02)]">{tarihFormatla(talep.teslimat.basarili_eposta?.tamamlanma_tarihi ?? null)}</span>;
}

export function CekTakipTeslimEdilen({ talep }: { talep: CekTakipTalebi }) {
  const alici = talep.teslimat.basarili_eposta;
  if (!alici) return <span className="text-[var(--tema-yerel-eclub-yardimci-metin-16)]">—</span>;
  return (
    <span className="block min-w-0">
      <strong className="block text-[var(--tema-yerel-eclub-ana-metin-02)]">{alici.alici_ad_soyad}</strong>
      <span className="mt-0.5 block break-all text-[11px] font-semibold text-[var(--tema-yerel-eclub-yardimci-metin-11)]">{alici.alici_eposta}</span>
    </span>
  );
}

export function CekTakipDurumRozeti({ talep }: { talep: CekTakipTalebi }) {
  const meta = CEK_TALEP_DURUM_META[talep.durum];
  const etiket = talep.utt && talep.durum === "bm_onayinda" ? "BM Onayı Bekliyor"
    : talep.utt && talep.durum === "tm_onayinda" ? "TM Onayı Bekliyor" : meta.etiket;
  return (
    <span aria-label={`Talep durumu: ${etiket}`} className="inline-flex rounded-full border px-2.5 py-1 text-[10px] font-extrabold" style={{ color: meta.metin, backgroundColor: meta.arka, borderColor: meta.kenar }}>
      {etiket}
    </span>
  );
}

export { tarihFormatla, kosulMetni };

export function CekTakipIslemButonu({
  talep,
  islemde,
  onIslem,
}: {
  talep: CekTakipTalebi;
  islemde: boolean;
  onIslem: (talepId: string, islem: CekTakipIslemi) => void;
}) {
  const islem = talep.izin_verilen_islemler.includes("tm_onayla") ? "tm_onayla" : talep.izin_verilen_islemler.includes("bm_onayla") ? "bm_onayla" : "bm_onayina_gonder";
  if (!talep.izin_verilen_islemler.includes(islem)) return <span className="text-[var(--tema-yerel-eclub-yardimci-metin-16)]">—</span>;
  return (
    <button
      type="button"
      onClick={() => onIslem(talep.talep_id, islem)}
      disabled={islemde}
      className={`inline-flex items-center justify-center whitespace-nowrap border font-extrabold transition disabled:cursor-not-allowed disabled:opacity-60 ${islem !== "bm_onayina_gonder" ? "rounded-full px-2.5 py-1 text-[10px] border-[var(--tema-yerel-eclub-cizgi-17)] bg-[var(--tema-yerel-eclub-eylem-zemin-01)] text-[var(--tema-yerel-eclub-ters-metin-01)] hover:bg-[var(--tema-yerel-eclub-eylem-zemin-02)]" : "min-h-9 rounded-xl px-3 text-[11px] border-[var(--tema-yerel-eclub-cizgi-02)] bg-[var(--tema-yerel-eclub-secim-zemin-01)] text-[var(--tema-yerel-eclub-eylem-metin-02)] hover:bg-[var(--tema-yerel-eclub-secim-zemin-02)]"}`}
    >
      {islemde ? "İşleniyor..." : islem === "tm_onayla" ? "Onayla" : islem === "bm_onayla" ? "Onayla ve TM’ye Gönder" : "BM Onayına Gönder"}
    </button>
  );
}

export default function CekTakipKarti({
  talep,
  islemde,
  onIslem,
  uttAdi,
  saltOkunur = false,
}: {
  talep: CekTakipTalebi;
  islemde: boolean;
  onIslem: (talepId: string, islem: CekTakipIslemi) => void;
  uttAdi?: string;
  saltOkunur?: boolean;
}) {
  return (
    <article aria-busy={islemde} className={`min-w-0 max-w-full overflow-hidden rounded-2xl border border-[var(--tema-yerel-eclub-cizgi-03)] bg-[var(--tema-yerel-eclub-kart-01)] p-4 shadow-[0_5px_16px_var(--tema-yerel-eclub-golge-04)] ${islemde ? "opacity-70" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 title={talep.urun.urun_adi} className="break-words text-sm font-extrabold text-[var(--tema-yerel-eclub-ana-metin-06)] [overflow-wrap:anywhere]">{talep.urun.urun_adi}</h3>
          <p className="mt-0.5 font-mono text-[10px] font-semibold text-[var(--tema-yerel-eclub-yardimci-metin-11)]">{talep.urun.gorunen_urun_id}</p>
        </div>
        <CekTakipDurumRozeti talep={talep} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 text-xs">
        {uttAdi && <div className="col-span-2"><dt className="text-[9px] font-extrabold uppercase tracking-[0.05em] text-[var(--tema-yerel-eclub-yardimci-metin-17)]">UTT Adı</dt><dd className="mt-1 font-extrabold text-[var(--tema-yerel-eclub-ana-metin-02)]">{uttAdi}</dd></div>}
        <div><dt className="text-[9px] font-extrabold uppercase tracking-[0.05em] text-[var(--tema-yerel-eclub-yardimci-metin-17)]">Talep Tarihi</dt><dd className="mt-1 font-bold text-[var(--tema-yerel-eclub-ana-metin-02)]">{tarihFormatla(talep.created_at)}</dd></div>
        <div><dt className="text-[9px] font-extrabold uppercase tracking-[0.05em] text-[var(--tema-yerel-eclub-yardimci-metin-17)]">Çek Tutarı</dt><dd className="mt-1 font-black text-[var(--tema-yerel-eclub-islevsel-metin-08)]">{talep.cek.tutar_tl.toLocaleString("tr-TR")} TL</dd></div>
        <div className="col-span-2 min-w-0"><dt className="text-[9px] font-extrabold uppercase tracking-[0.05em] text-[var(--tema-yerel-eclub-yardimci-metin-17)]">Öğrenme Aracı</dt><dd className="mt-1 font-bold text-[var(--tema-yerel-eclub-ana-metin-02)]">{ogrenmeAraciMetinleri(talep.ogrenme_araci.tur).ad}</dd><dd className="break-all font-mono text-[10px] text-[var(--tema-yerel-eclub-yardimci-metin-11)]">{talep.ogrenme_araci.yayin_kodu ?? "—"}</dd></div>
        <div><dt className="text-[9px] font-extrabold uppercase tracking-[0.05em] text-[var(--tema-yerel-eclub-yardimci-metin-17)]">Satış Koşulu</dt><dd className="mt-1 font-bold text-[var(--tema-yerel-eclub-ana-metin-02)]">{kosulMetni(talep)}</dd></div>
        <div><dt className="text-[9px] font-extrabold uppercase tracking-[0.05em] text-[var(--tema-yerel-eclub-yardimci-metin-17)]">Kullanılan Puan</dt><dd className="mt-1 font-black tabular-nums text-[var(--tema-yerel-eclub-ana-metin-02)]">{talep.puan.kullanilan.toLocaleString("tr-TR")}</dd></div>
        <div className="col-span-2 min-w-0"><dt className="text-[9px] font-extrabold uppercase tracking-[0.05em] text-[var(--tema-yerel-eclub-yardimci-metin-17)]">Talep Eden Eczane</dt><dd className="mt-1 break-words font-bold text-[var(--tema-yerel-eclub-ana-metin-02)] [overflow-wrap:anywhere]">{talep.eczane.eczane_adi}</dd><dd className="break-words text-[11px] text-[var(--tema-yerel-eclub-yardimci-metin-11)] [overflow-wrap:anywhere]">{talep.uye.ad_soyad} · {eclubKisiRolEtiketi(talep.uye.rol)}</dd></div>
        <div><dt className="text-[9px] font-extrabold uppercase tracking-[0.05em] text-[var(--tema-yerel-eclub-yardimci-metin-17)]">Çek Teslimatı</dt><dd className="mt-1"><CekTakipTeslimatOzeti talep={talep} /></dd></div>
        <div><dt className="text-[9px] font-extrabold uppercase tracking-[0.05em] text-[var(--tema-yerel-eclub-yardimci-metin-17)]">Teslim Tarihi</dt><dd className="mt-1"><CekTakipTeslimTarihi talep={talep} /></dd></div>
        <div className="col-span-2"><dt className="text-[9px] font-extrabold uppercase tracking-[0.05em] text-[var(--tema-yerel-eclub-yardimci-metin-17)]">Teslim Edilen</dt><dd className="mt-1"><CekTakipTeslimEdilen talep={talep} /></dd></div>
        {!saltOkunur && <div className="col-span-2"><dt className="text-[9px] font-extrabold uppercase tracking-[0.05em] text-[var(--tema-yerel-eclub-yardimci-metin-17)]">İşlem</dt><dd className="mt-1"><CekTakipIslemButonu talep={talep} islemde={islemde} onIslem={onIslem} /></dd></div>}
      </dl>
    </article>
  );
}
