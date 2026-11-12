"use client";
import type { VivaProforma } from "@/lib/satinAlma/vivaProforma";
import type { ProformaTarafi } from "@/lib/satinAlma/esnekProforma";
import local from "./esnek-proforma.module.css";

const para = (n: number) => `${n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
function Taraf({ baslik, veri }: { baslik: string; veri: ProformaTarafi }) {
  return <div><h4>{baslik}</h4><strong>{veri.unvan || "—"}</strong>
    <p>Adres: {veri.adres || "—"}</p><p>Vergi Dairesi / Vergi No: {veri.vergi_dairesi || "—"} / {veri.vergi_numarasi || "—"}</p>
  </div>;
}
export default function VivaProformaBelgesi({ veri }: { veri: VivaProforma }) {
  const b = veri.belge;
  if(!b)return null;
  return <section className={local.belge} aria-label="Viva aylık proforma faturası">
    <div className={local.belgeBaslik}><div><h3>PROFORMA FATURA</h3><p>Viva Kullanımı</p></div>
      <div className={local.referans}><strong>{b.belge_no}</strong><p>{new Date(b.tarih).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul" })}</p></div>
    </div>
    <div className={local.taraflar}><Taraf baslik="DÜZENLEYEN" veri={b.duzenleyen} /><Taraf baslik="ALICI" veri={b.alici} /></div>
    <div className={local.kalemAlani}><table className={local.kalemler} aria-label="Proforma kalemleri">
      <thead><tr><th>Yayın Tarihi</th><th>Yayın Adı</th><th>Düzenleyen</th><th>Katılımcı Sayısı</th><th>Toplam Kişi-Dakika</th><th>Birim Fiyat</th><th>Tutar</th></tr></thead>
      <tbody>{b.satirlar.map(s=><tr key={s.etkinlik_id}><td>{new Date(s.yayin_tarihi).toLocaleDateString('tr-TR',{timeZone:'Europe/Istanbul'})}</td><td>{s.yayin_adi}</td><td>{s.duzenleyen}</td><td>{s.katilimci_sayisi.toLocaleString('tr-TR')}</td><td>{s.kisi_dakika.toLocaleString('tr-TR',{maximumFractionDigits:4})}</td><td>{para(s.birim_fiyat)}</td><td>{para(s.tutar)}</td></tr>)}</tbody>
    </table></div>
    <dl className={local.toplamlar}><div><dt>Toplam Tutar</dt><dd>{para(b.toplam_tutar)}</dd></div>
      <div><dt>KDV (%20)</dt><dd>{para(b.kdv)}</dd></div><div className={local.genel}><dt>Genel Tutar</dt><dd>{para(b.toplam_tutar + b.kdv)}</dd></div>
    </dl>
    <div className={local.notlar}>
      <p>Kullanım Ayı: {new Date(`${b.donem}-01T00:00:00+03:00`).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul", month: "long", year: "numeric" })}. Tutar gerçekleşen kişi-dakika kullanımı üzerinden hesaplanır.</p>
      {veri.onay ? <><p>{veri.onay.tur === "admin" ? "Admin" : "Firma"} tarafından onaylandı.</p>
        <p>Onaylayan: {veri.onay.onaylayan} · {new Date(veri.onay.tarih).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}</p>
        {veri.onay.aciklama && <p className={local.aciklama}>Açıklama: {veri.onay.aciklama}</p>}
      </> : <p>Firma onayı bekleniyor.</p>}
      <p>Bilgi amaçlıdır, resmi belge yerine geçmez.</p>
    </div>
  </section>;
}
