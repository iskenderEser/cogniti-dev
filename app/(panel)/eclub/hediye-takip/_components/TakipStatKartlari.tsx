import { CheckCircle2, Clock3, Gift, ShoppingBag, Truck } from "lucide-react";
import type { CekTakipStatlari } from "@/lib/eclub/hediyeTakip/cekTakip";
import type { SiparisTakipStatlari } from "@/lib/eclub/hediyeTakip/siparisTakip";
import type { HediyeTakipTuru } from "./HediyeTakipToggle";

const CEK_STATLARI = [
  { etiket: "Toplam Talep", detay: "Tüm çek talepleri", ikon: Gift, renk: "var(--tema-yerel-eclub-islevsel-metin-12)", zemin: "var(--tema-yerel-eclub-islevsel-zemin-11)" },
  { etiket: "Onay Sürecinde", detay: "Onay adımlarındaki talepler", ikon: Clock3, renk: "var(--tema-yerel-eclub-islevsel-metin-01)", zemin: "var(--tema-yerel-eclub-islevsel-zemin-01)" },
  { etiket: "Teslimat Sürecinde", detay: "Kod ve teslimat bekleyenler", ikon: Truck, renk: "var(--tema-yerel-eclub-islevsel-metin-13)", zemin: "var(--tema-yerel-eclub-islevsel-zemin-12)" },
  { etiket: "Tamamlanan", detay: "Teslim edilen çekler", ikon: CheckCircle2, renk: "var(--tema-yerel-eclub-islevsel-metin-02)", zemin: "var(--tema-yerel-eclub-islevsel-zemin-02)" },
] as const;

const SIPARIS_STATLARI = [
  { etiket: "Sipariş Verilen", detay: "Takibe alınan siparişler", ikon: ShoppingBag, renk: "var(--tema-yerel-eclub-islevsel-metin-12)", zemin: "var(--tema-yerel-eclub-islevsel-zemin-11)" },
  { etiket: "UTT İncelemesi Bekliyor", detay: "Henüz UTT onayı olmayanlar", ikon: Clock3, renk: "var(--tema-yerel-eclub-islevsel-metin-01)", zemin: "var(--tema-yerel-eclub-islevsel-zemin-01)" },
  { etiket: "BM Onayı Bekliyor", detay: "UTT tarafından kontrol edilenler", ikon: Clock3, renk: "var(--tema-yerel-eclub-islevsel-metin-13)", zemin: "var(--tema-yerel-eclub-islevsel-zemin-12)" },
  { etiket: "BM Onayladı", detay: "BM tarafından onaylanan siparişler", ikon: CheckCircle2, renk: "var(--tema-yerel-eclub-islevsel-metin-02)", zemin: "var(--tema-yerel-eclub-islevsel-zemin-02)" },
] as const;

export default function TakipStatKartlari({
  takipTuru,
  cekStatlari,
  siparisStatlari,
}: {
  takipTuru: HediyeTakipTuru;
  cekStatlari?: CekTakipStatlari;
  siparisStatlari?: SiparisTakipStatlari;
}) {
  const statlar = takipTuru === "cek" ? CEK_STATLARI : SIPARIS_STATLARI;
  const degerler = takipTuru === "cek" && cekStatlari
    ? [cekStatlari.toplam, cekStatlari.onay_surecinde, cekStatlari.teslimat_surecinde, cekStatlari.tamamlanan]
    : takipTuru === "siparis" && siparisStatlari
      ? [siparisStatlari.toplam, siparisStatlari.inceleme_bekliyor, siparisStatlari.utt_onayladi, siparisStatlari.bm_onayladi]
      : null;

  return (
    <section aria-label={`${takipTuru === "cek" ? "Çek" : "Sipariş"} takip özeti`} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {statlar.map(({ etiket, detay, ikon: Icon, renk, zemin }, index) => (
        <article
          key={etiket}
          className="flex min-w-0 items-start justify-between gap-3 rounded-2xl border border-[var(--tema-yerel-eclub-cizgi-03)] bg-[var(--tema-yerel-eclub-kart-01)] p-4 shadow-[0_6px_18px_var(--tema-yerel-eclub-golge-04)]"
          style={{ borderLeft: `4px solid ${renk}` }}
        >
          <div className="min-w-0">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-[var(--tema-yerel-eclub-yardimci-metin-15)]">{etiket}</span>
            <strong className="mt-1 block text-2xl font-black tracking-tight text-[var(--tema-yerel-eclub-ana-metin-11)]">{degerler ? degerler[index].toLocaleString("tr-TR") : "—"}</strong>
            <span className="mt-1 hidden truncate text-xs font-semibold text-[var(--tema-yerel-eclub-yardimci-metin-18)] sm:block">{detay}</span>
          </div>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl" style={{ color: renk, backgroundColor: zemin }}>
            <Icon size={20} />
          </span>
        </article>
      ))}
    </section>
  );
}
