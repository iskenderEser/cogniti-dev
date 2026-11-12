"use client";
import type { ProformaTarafi } from "@/lib/satinAlma/esnekProforma";
import type { AgoraProformaKaydi } from "@/lib/satinAlma/agoraProforma";
import local from "./esnek-proforma.module.css";

const para = (n: number) => `${n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
function Taraf({ baslik, veri }: { baslik: string; veri: ProformaTarafi }) {
  return <div><h4>{baslik}</h4><strong>{veri.unvan || "—"}</strong>
    <p>Adres: {veri.adres || "—"}</p><p>Vergi Dairesi / Vergi No: {veri.vergi_dairesi || "—"} / {veri.vergi_numarasi || "—"}</p>
  </div>;
}
export default function AgoraProformaBelgesi({ kayit }: { kayit: AgoraProformaKaydi }) {
  const b = kayit.proforma;
  return <section className={local.belge} aria-label="Agora Yayını proforma faturası">
    <div className={local.belgeBaslik}><div><h3>PROFORMA FATURA</h3><p>Agora Yayını Alımı</p></div>
      <div className={local.referans}><strong>{b.belge_no}</strong><p>{new Date(b.tarih).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul" })}</p></div>
    </div>
    <div className={local.taraflar}><Taraf baslik="DÜZENLEYEN" veri={b.duzenleyen} /><Taraf baslik="ALICI" veri={b.alici} /></div>
    <div className={local.kalemAlani}><table className={local.kalemler} aria-label="Proforma kalemleri">
      <thead><tr><th>Yayın Adı</th><th>İş Ortağı</th><th>Toplam Tutar</th></tr></thead>
      <tbody><tr><td>{b.yayin_adi}</td><td>{b.is_ortagi || "—"}</td><td>{para(b.toplam_tutar)}</td></tr></tbody>
    </table></div>
    <dl className={local.toplamlar}><div><dt>Toplam Tutar</dt><dd>{para(b.toplam_tutar)}</dd></div>
      <div><dt>KDV (%20)</dt><dd>{para(b.kdv)}</dd></div><div className={local.genel}><dt>Genel Tutar</dt><dd>{para(b.toplam_tutar + b.kdv)}</dd></div>
    </dl>
    <div className={local.notlar}>
      {kayit.onay ? <><p>{kayit.onay.tur === "admin" ? "Admin" : "Firma"} tarafından onaylandı.</p>
        <p>Onaylayan: {kayit.onay.onaylayan} · {new Date(kayit.onay.tarih).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}</p>
        {kayit.onay.aciklama && <p className={local.aciklama}>Açıklama: {kayit.onay.aciklama}</p>}
      </> : <p>Firma onayı bekleniyor.</p>}
      <p>Bilgi amaçlıdır, resmi belge yerine geçmez.</p>
    </div>
  </section>;
}
