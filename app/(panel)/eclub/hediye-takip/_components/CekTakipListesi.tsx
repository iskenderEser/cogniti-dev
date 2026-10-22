import { AlertTriangle, LoaderCircle, LockKeyhole, RefreshCw, SearchX } from "lucide-react";
import type { CekTakipIslemi, CekTakipTalebi } from "@/lib/eclub/hediyeTakip/cekTakip";
import { eclubKisiRolEtiketi } from "@/lib/utils/roller";
import CekTakipKarti, {
  CekTakipDurumRozeti,
  CekTakipIslemButonu,
  CekTakipTeslimEdilen,
  CekTakipTeslimatOzeti,
  CekTakipTeslimTarihi,
  kosulMetni,
  tarihFormatla,
} from "./CekTakipKarti";
import { ogrenmeAraciMetinleri } from "@/lib/ogrenmeAraci/etiketler";

export interface CekTakipListeHatasi {
  tur: "yetkisiz" | "api";
  mesaj: string;
}

function CekTakipDurumMesaji({
  tur,
  filtreVar,
  mesaj,
  onYenidenDene,
}: {
  tur: "yukleniyor" | "bos" | "yetkisiz" | "api";
  filtreVar: boolean;
  mesaj?: string;
  onYenidenDene: () => void;
}) {
  const Icon = tur === "yukleniyor" ? LoaderCircle : tur === "bos" ? SearchX : tur === "yetkisiz" ? LockKeyhole : AlertTriangle;
  const baslik = tur === "yukleniyor"
    ? "Çek talepleri yükleniyor"
    : tur === "bos"
      ? filtreVar ? "Filtrelere uygun çek talebi bulunamadı" : "Henüz çek talebi bulunmuyor"
      : tur === "yetkisiz"
        ? "Bu alana erişim yetkiniz bulunmuyor"
        : "Çek talepleri yüklenemedi";
  const aciklama = tur === "bos"
    ? filtreVar ? "Filtreleri değiştirerek yeniden deneyin." : "Oluşturulan çek talepleri burada görüntülenecek."
    : mesaj;

  return (
    <section aria-label={baslik} className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-[var(--tema-yerel-eclub-cizgi-03)] bg-[var(--tema-yerel-eclub-kart-01)] px-5 py-10 text-center shadow-[0_6px_18px_var(--tema-yerel-eclub-golge-04)]">
      <span className="flex size-11 items-center justify-center rounded-2xl bg-[var(--tema-yerel-eclub-sayfa-zemini-08)] text-[var(--tema-yerel-eclub-yardimci-metin-02)]">
        <Icon className={tur === "yukleniyor" ? "size-5 animate-spin" : "size-5"} />
      </span>
      <h2 className="mt-3 text-sm font-extrabold text-[var(--tema-yerel-eclub-ana-metin-06)]">{baslik}</h2>
      {aciklama && <p className="mt-1 max-w-md text-xs font-semibold leading-5 text-[var(--tema-yerel-eclub-yardimci-metin-11)]">{aciklama}</p>}
      {tur === "api" && (
        <button type="button" onClick={onYenidenDene} className="mt-4 inline-flex h-9 items-center gap-2 rounded-xl border border-[var(--tema-yerel-eclub-cizgi-02)] bg-[var(--tema-yerel-eclub-secim-zemin-01)] px-3 text-xs font-extrabold text-[var(--tema-yerel-eclub-eylem-metin-02)] hover:bg-[var(--tema-yerel-eclub-secim-zemin-02)]">
          <RefreshCw className="size-3.5" /> Yeniden Dene
        </button>
      )}
    </section>
  );
}

export default function CekTakipListesi({
  talepler,
  yukleniyor,
  hata,
  filtreVar,
  sonrakiKayitVarMi,
  dahaYukleniyor,
  islemdekiTalepId,
  onDahaFazla,
  onIslem,
  onYenidenDene,
  uttGoster = false,
  saltOkunur = false,
}: {
  talepler: CekTakipTalebi[];
  yukleniyor: boolean;
  hata: CekTakipListeHatasi | null;
  filtreVar: boolean;
  sonrakiKayitVarMi: boolean;
  dahaYukleniyor: boolean;
  islemdekiTalepId: string | null;
  onDahaFazla: () => void;
  onIslem: (talepId: string, islem: CekTakipIslemi) => void;
  onYenidenDene: () => void;
  uttGoster?: boolean;
  saltOkunur?: boolean;
}) {
  const th = "whitespace-nowrap px-3 py-3 text-[10px] font-extrabold uppercase tracking-[0.05em] text-[var(--tema-yerel-eclub-yardimci-metin-11)]";
  const td = "px-3 py-3 align-top text-xs";

  if (yukleniyor) {
    return <CekTakipDurumMesaji tur="yukleniyor" filtreVar={filtreVar} onYenidenDene={onYenidenDene} />;
  }
  if (hata) {
    return <CekTakipDurumMesaji tur={hata.tur} filtreVar={filtreVar} mesaj={hata.mesaj} onYenidenDene={onYenidenDene} />;
  }
  if (talepler.length === 0) {
    return <CekTakipDurumMesaji tur="bos" filtreVar={filtreVar} onYenidenDene={onYenidenDene} />;
  }

  return (
    <section aria-label="Çek takip listesi" className="overflow-hidden rounded-2xl border border-[var(--tema-yerel-eclub-cizgi-03)] bg-[var(--tema-yerel-eclub-kart-01)] shadow-[0_6px_18px_var(--tema-yerel-eclub-golge-04)]">
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-max table-auto border-collapse">
          <thead className="border-b border-[var(--tema-yerel-eclub-cizgi-18)] bg-[var(--tema-yerel-eclub-sayfa-zemini-05)]">
            <tr>
              {[
                ...(uttGoster ? [{ baslik: "UTT Adı", ortali: false }] : []),
                { baslik: "Talep Tarihi", ortali: true },
                { baslik: "Ürün Adı", ortali: false },
                { baslik: "Öğrenme Aracı", ortali: false },
                { baslik: "Satış Koşulu", ortali: true },
                { baslik: "Talep Eden Eczane", ortali: false },
                { baslik: "Kullanılan Puan", ortali: true },
                { baslik: "Çek Tutarı", ortali: true },
                { baslik: "Çek Talep Durumu", ortali: true },
                { baslik: "Çek Teslimatı", ortali: true },
                { baslik: "Teslim Tarihi", ortali: true },
                { baslik: "Teslim Edilen", ortali: false },
                ...(!saltOkunur ? [{ baslik: "İşlem", ortali: false }] : []),
              ].map(({ baslik, ortali }) => <th key={baslik} className={`${th} ${ortali ? "text-center" : "text-left"}`}>{baslik}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--tema-yerel-eclub-cizgi-06)]">
            {talepler.map((talep) => {
              const satirKilitli = islemdekiTalepId === talep.talep_id;
              return (
              <tr key={talep.talep_id} aria-busy={satirKilitli} className={satirKilitli ? "bg-[var(--tema-yerel-eclub-secim-zemin-08)]/70 opacity-70" : "hover:bg-[var(--tema-yerel-eclub-sayfa-zemini-09)]"}>
                {uttGoster && <td className={`${td} whitespace-nowrap font-extrabold text-[var(--tema-yerel-eclub-ana-metin-02)]`}>{talep.utt?.utt_adi ?? "—"}</td>}
                <td className={`${td} whitespace-nowrap text-center font-bold text-[var(--tema-yerel-eclub-ana-metin-02)]`}>{tarihFormatla(talep.created_at)}</td>
                <td className={`${td} max-w-[220px]`}><strong className="block break-words text-[var(--tema-yerel-eclub-ana-metin-06)]">{talep.urun.urun_adi}</strong><span className="mt-1 block font-mono text-[10px] font-semibold text-[var(--tema-yerel-eclub-yardimci-metin-11)]">{talep.urun.gorunen_urun_id}</span></td>
                <td className={`${td} max-w-[220px]`}><strong className="block text-[var(--tema-yerel-eclub-ana-metin-02)]">{ogrenmeAraciMetinleri(talep.ogrenme_araci.tur).ad}</strong><span className="mt-1 block break-words font-mono text-[10px] font-semibold text-[var(--tema-yerel-eclub-yardimci-metin-11)]">{talep.ogrenme_araci.yayin_kodu ?? "—"}</span></td>
                <td className={`${td} whitespace-nowrap text-center font-bold text-[var(--tema-yerel-eclub-ana-metin-02)]`}>{kosulMetni(talep)}</td>
                <td className={`${td} max-w-[220px]`}><strong className="block break-words text-[var(--tema-yerel-eclub-ana-metin-02)]">{talep.eczane.eczane_adi}</strong><span className="mt-0.5 block break-words text-[11px] text-[var(--tema-yerel-eclub-yardimci-metin-11)]">{talep.uye.ad_soyad} · {eclubKisiRolEtiketi(talep.uye.rol)}</span></td>
                <td className={`${td} text-center font-black tabular-nums text-[var(--tema-yerel-eclub-ana-metin-02)]`}>{talep.puan.kullanilan.toLocaleString("tr-TR")}</td>
                <td className={`${td} text-center font-black tabular-nums text-[var(--tema-yerel-eclub-islevsel-metin-08)]`}>{talep.cek.tutar_tl.toLocaleString("tr-TR")} TL</td>
                <td className={`${td} text-center`}><CekTakipDurumRozeti talep={talep} /></td>
                <td className={`${td} text-center`}><CekTakipTeslimatOzeti talep={talep} /></td>
                <td className={`${td} text-center`}><CekTakipTeslimTarihi talep={talep} /></td>
                <td className={`${td} max-w-[220px]`}><CekTakipTeslimEdilen talep={talep} /></td>
                {!saltOkunur && <td className={td}><CekTakipIslemButonu talep={talep} islemde={satirKilitli} onIslem={onIslem} /></td>}
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-3 overflow-hidden bg-[var(--tema-yerel-eclub-sayfa-zemini-05)] p-3 lg:hidden">
        {talepler.map((talep) => (
          <CekTakipKarti
            key={talep.talep_id}
            talep={talep}
            islemde={islemdekiTalepId === talep.talep_id}
            onIslem={onIslem}
            uttAdi={uttGoster ? talep.utt?.utt_adi : undefined}
            saltOkunur={saltOkunur}
          />
        ))}
      </div>

      {sonrakiKayitVarMi && (
        <div className="border-t border-[var(--tema-yerel-eclub-cizgi-18)] px-4 py-4 text-center">
          <button type="button" onClick={onDahaFazla} disabled={dahaYukleniyor} className="rounded-xl border border-[var(--tema-yerel-eclub-cizgi-19)] bg-[var(--tema-yerel-eclub-kart-01)] px-5 py-2 text-xs font-extrabold text-[var(--tema-yerel-eclub-ana-metin-10)] transition hover:bg-[var(--tema-yerel-eclub-sayfa-zemini-10)] disabled:cursor-not-allowed disabled:opacity-50">
            {dahaYukleniyor ? "Yükleniyor..." : "Daha Fazla Göster"}
          </button>
        </div>
      )}
    </section>
  );
}
