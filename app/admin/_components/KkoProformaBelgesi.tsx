"use client";
import type { KkoProformaKaydi, ProformaTarafi } from "@/lib/satinAlma/kkoProforma";
import local from "./esnek-proforma.module.css";

const para = (n: number) => `${n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
function Taraf({ baslik, veri }: { baslik: string; veri: ProformaTarafi }) {
  return <div><h4>{baslik}</h4><strong>{veri.unvan || "—"}</strong>
    <p>Adres: {veri.adres || "—"}</p><p>Vergi Dairesi / Vergi No: {veri.vergi_dairesi || "—"} / {veri.vergi_numarasi || "—"}</p>
  </div>;
}
export default function KkoProformaBelgesi({ kayit }: { kayit: KkoProformaKaydi }) {
  const b = kayit.proforma;
  return <section className={local.belge} aria-label="KKÖ proforma faturası">
    <div className={local.belgeBaslik}><div><h3>PROFORMA FATURA</h3><p>Kullandığın Kadar Öde</p></div>
      <div className={local.referans}><strong>{b.belge_no}</strong><p>{new Date(b.tarih).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul" })}</p></div>
    </div>
    <div className={local.taraflar}><Taraf baslik="DÜZENLEYEN" veri={b.duzenleyen} /><Taraf baslik="ALICI" veri={b.alici} /></div>
    <div className={local.kalemAlani}><table className={local.kalemler} aria-label="Proforma kalemleri">
      <thead><tr><th>Mal / Hizmet</th><th>Miktar</th><th>Birim</th><th>Birim Fiyat</th><th>KDV Hariç Tutar</th></tr></thead>
      <tbody><tr><td>Kullandığın Kadar Öde</td><td>{b.token_adedi.toLocaleString("tr-TR")}</td><td>Token</td><td>{para(b.birim_fiyat)}</td><td>{para(b.toplam_tutar)}</td></tr></tbody>
    </table></div>
    <dl className={local.toplamlar}><div><dt>Toplam Tutar</dt><dd>{para(b.toplam_tutar)}</dd></div>
      <div><dt>KDV (%20)</dt><dd>{para(b.kdv)}</dd></div><div className={local.genel}><dt>Genel Tutar</dt><dd>{para(b.toplam_tutar + b.kdv)}</dd></div>
    </dl>
    <div className={local.notlar}>
      {b.test_notu && <p><strong>{b.test_notu}</strong></p>}
      <p>Dönem: {new Date(`${b.donem}T00:00:00+03:00`).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul", month: "long", year: "numeric" })}. Tutar gerçekleşen token tüketimi üzerinden hesaplanır.</p>
      {kayit.onay ? <><p>{kayit.onay.tur === "admin" ? "Admin" : "Firma"} tarafından onaylandı.</p>
        <p>Onaylayan: {kayit.onay.onaylayan} · {new Date(kayit.onay.tarih).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}</p>
        {kayit.onay.aciklama && <p className={local.aciklama}>Açıklama: {kayit.onay.aciklama}</p>}
      </> : <p>Firma onayı bekleniyor.</p>}
      <p>Bilgi amaçlıdır, resmi belge yerine geçmez.</p>
    </div>
  </section>;
}
