"use client";
import type { BannerProforma } from "@/lib/satinAlma/bannerProforma";
import type { ProformaTarafi } from "@/lib/satinAlma/esnekProforma";
import local from "./esnek-proforma.module.css";

const para = (n: number) => `${n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
const tarih = (deger: string) => new Date(deger).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul" });
function Taraf({ baslik, veri }: { baslik: string; veri: ProformaTarafi }) {
  return <div><h4>{baslik}</h4><strong>{veri.unvan || "—"}</strong>
    <p>Adres: {veri.adres || "—"}</p><p>Vergi Dairesi / Vergi No: {veri.vergi_dairesi || "—"} / {veri.vergi_numarasi || "—"}</p>
  </div>;
}
export default function BannerProformaBelgesi({ veri }: { veri: BannerProforma }) {
  const b = veri.belge;
  if(!b)return null;
  return <section className={local.belge} aria-label="Banner aylık proforma faturası">
    <div className={local.belgeBaslik}><div><h3>PROFORMA FATURA</h3><p>Banner Alımı</p></div>
      <div className={local.referans}><strong>{b.belge_no}</strong><p>{new Date(b.tarih).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul" })}</p></div>
    </div>
    <div className={local.taraflar}><Taraf baslik="DÜZENLEYEN" veri={b.duzenleyen} /><Taraf baslik="ALICI" veri={b.alici} /></div>
    <div className={local.kalemAlani}><table className={local.kalemler} aria-label="Proforma kalemleri">
      <thead><tr><th>İşlem Tarihi</th><th>Yayın Başlangıcı</th><th>Süre</th><th>Haftalık Token</th><th>Toplam Token</th><th>İşlem</th><th>Toplam Tutar</th></tr></thead>
      <tbody>{b.satirlar.map(s => <tr key={s.tuketim_id}>
        <td>{tarih(s.tarih)}</td>
        <td>{s.baslangic ? tarih(s.baslangic) : "—"}</td>
        <td>{s.hafta_sayisi} hafta</td>
        <td>{s.haftalik_token?.toLocaleString("tr-TR") ?? "—"}</td>
        <td>{s.token_adedi.toLocaleString("tr-TR")}</td>
        <td>{s.islem_turu === "banner_iptal" || s.alan === "İptal Bedeli" ? "İptal Bedeli" : "Banner Alımı"}
          {s.test_kaydi && <p>SİLİNECEK TEST KAYDI</p>}</td>
        <td>{para(s.tutar)}</td>
      </tr>)}</tbody>
    </table></div>
    <dl className={local.toplamlar}><div><dt>Toplam Tutar</dt><dd>{para(b.toplam_tutar)}</dd></div>
      <div><dt>KDV (%20)</dt><dd>{para(b.kdv)}</dd></div><div className={local.genel}><dt>Genel Tutar</dt><dd>{para(b.genel_tutar)}</dd></div>
    </dl>
    <div className={local.notlar}>
      <p>Alım Ayı: {new Date(`${b.donem}-01T00:00:00+03:00`).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul", month: "long", year: "numeric" })}.</p>
      {veri.onay ? <><p>{veri.onay.tur === "admin" ? "Admin" : "Firma"} tarafından onaylandı.</p>
        <p>Onaylayan: {veri.onay.onaylayan} · {new Date(veri.onay.tarih).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}</p>
        {veri.onay.aciklama && <p className={local.aciklama}>Açıklama: {veri.onay.aciklama}</p>}
      </> : <p>Firma onayı bekleniyor.</p>}
      <p>Bilgi amaçlıdır, resmi belge yerine geçmez.</p>
    </div>
  </section>;
}
