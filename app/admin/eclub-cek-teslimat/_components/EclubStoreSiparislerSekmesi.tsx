"use client";
import { cekKoduGecerli, cekBaglantisiGecerli } from "@/lib/eclub/store/teslimat";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, Building2, Download, RefreshCw, Search } from "lucide-react";
import { ECLUB_ADMIN_DURUMLARI, type EclubAdminFirma, type EclubAdminKesit, type EclubAdminTalep } from "@/lib/eclub/store/adminFirmaTalepleri";
import { KatalogPenceresi } from "../../store/_components/KatalogFormlari";
import s from "../../store/_components/katalog.module.css";
const endpoint = "/admin/eclub-cek-teslimat/api/cek-talepleri";
const n = (v: number) => Number(v || 0).toLocaleString("tr-TR", { maximumFractionDigits: 2 });
const tarih = (v: string | null) => v ? new Date(v).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" }) : "—";
async function oku(url: string, signal?: AbortSignal) { const r = await fetch(url, { cache: "no-store", signal }); const d = await r.json(); if (!r.ok) throw new Error(d.hata || "Çek talepleri alınamadı."); return d; }
export default function EclubStoreSiparislerSekmesi() {
 const [firmalar, setFirmalar] = useState<EclubAdminFirma[]>([]), [firma, setFirma] = useState<EclubAdminFirma | null>(null);
 const [loading, setLoading] = useState(true), [hata, setHata] = useState(""), [arama, setArama] = useState("");
 const istek = useRef<AbortController | null>(null);
 const yenile = useCallback(async () => {
  istek.current?.abort(); const c = new AbortController(); istek.current = c; setLoading(true); setHata("");
  try { const d = await oku(endpoint, c.signal); if (!Array.isArray(d.firmalar)) throw new Error("Firma listesi alınamadı."); if (!c.signal.aborted) setFirmalar(d.firmalar); }
  catch (e) { if (!c.signal.aborted) setHata(e instanceof Error ? e.message : "Firma listesi alınamadı."); }
  finally { if (!c.signal.aborted) setLoading(false); }
 }, []);
 useEffect(() => { void yenile(); return () => istek.current?.abort(); }, [yenile]);
 if (firma) return <FirmaTalepleri key={firma.firma_id} firma={firma} onBack={() => { setFirma(null); void yenile(); }} />;
 const liste = firmalar.filter(f => f.firma_adi.toLocaleLowerCase("tr-TR").includes(arama.trim().toLocaleLowerCase("tr-TR")));
 return <section className={s.card} aria-labelledby="eclub-admin-firmalar"><div className={s.header}><div><h2 id="eclub-admin-firmalar">Firma bazında çek talepleri</h2><p>Takip ve teslimat için bir firma seçin. TM son onayına ulaşan talepler gösterilir.</p></div><button type="button" className={s.button} disabled={loading} onClick={() => void yenile()}><RefreshCw />Yenile</button></div>
  <div className={s.form}><label className={s.field}>Firma ara<input type="search" className={s.input} value={arama} onChange={e => setArama(e.target.value)} placeholder="Firma adı" /></label>
  {hata ? <p role="alert" className={`${s.feedback} ${s.error}`}>{hata}</p> : loading ? <p role="status">Firmalar yükleniyor…</p> : !liste.length ? <p>Firma bulunamadı.</p> : <div className={s.firmaGrid}>{liste.map(f => <button type="button" key={f.firma_id} className={s.firmaCard} onClick={() => setFirma(f)} aria-label={`${f.firma_adi} çek taleplerini aç`}>
   <div className={s.firmaTitle}><Building2 /><strong>{f.firma_adi}</strong><span>{!f.aktif ? "Firma pasif" : !f.eclub_aktif ? "E-Club kapalı" : ""}</span></div>
   <div className={s.firmaCounts}><span><b>{n(f.bekleyen)}</b>Kod bekleyen</span><span><b>{n(f.teslimatta)}</b>Teslimatta</span><span><b>{n(f.tamamlanan)}</b>Tamamlanan</span></div>
   <p>İptal dışı toplam: <strong>{n(f.tl)} TL</strong> · {n(f.puan)} Puan</p><span className={s.openFirma}>Firma taleplerini aç →</span>
  </button>)}</div>}</div>
 </section>;
}
function FirmaTalepleri({ firma, onBack }: { firma: EclubAdminFirma; onBack: () => void }) {
 const [draft, setDraft] = useState({ arama: "", durum: "", bas: "", son: "" }), [filtre, setFiltre] = useState(draft);
 const [sayfa, setSayfa] = useState(1), [revision, setRevision] = useState(0);
 const [sonuc, setSonuc] = useState<{ anahtar: string; data: EclubAdminKesit | null; hata: string } | null>(null), [mesaj, setMesaj] = useState("");
 const [modal, setModal] = useState<{ talep: EclubAdminTalep; islem: "detay" | "cek_kodu_teslim" | "iptal" } | null>(null);
 const url = useMemo(() => `${endpoint}?${new URLSearchParams({ firma: firma.firma_id, ...filtre, sayfa: String(sayfa) })}`, [firma.firma_id, filtre, sayfa]);
 const anahtar = `${url}#${revision}`;
 const data = sonuc?.anahtar === anahtar ? sonuc.data : null;
 const hata = sonuc?.anahtar === anahtar ? sonuc.hata : "";
 const loading = sonuc?.anahtar !== anahtar;
 useEffect(() => {
  const c = new AbortController();
  void oku(url, c.signal).then(d => {
   if (d.firma?.firma_id !== firma.firma_id || !Array.isArray(d.talepler) || d.talepler.some((t: EclubAdminTalep) => t.firma_id !== firma.firma_id)) throw new Error("Firma kapsamı doğrulanamadı.");
   if (!c.signal.aborted) setSonuc({ anahtar, data: d, hata: "" });
  }).catch(e => { if (!c.signal.aborted) setSonuc({ anahtar, data: null, hata: e instanceof Error ? e.message : "Talepler alınamadı." }); });
  return () => c.abort();
 }, [url, firma.firma_id, anahtar]);
 function ac(talep: EclubAdminTalep, islem: "detay" | "cek_kodu_teslim" | "iptal") { if (talep.firma_id === firma.firma_id) setModal({ talep, islem }); }
 return <div className={s.panel}>
  <div className={s.header}><div><button type="button" className={s.button} onClick={onBack}><ArrowLeft />Firmalara dön</button><h2 className={s.selectedFirma}>{firma.firma_adi}</h2><p>Özetler, talepler ve işlemler yalnız seçilen firmayı kapsar.</p></div><div className={s.actions}><button type="button" className={s.button} disabled={loading} onClick={() => setRevision(v => v+1)}><RefreshCw />Yenile</button>{data && !loading && !hata && data.toplam>0 && <a className={s.button} href={`${url}&export=1`}><Download />Excel indir</a>}</div></div>
  {mesaj && <p role="status" className={s.feedback}>{mesaj}</p>}
  <form className={s.firmaFilters} onSubmit={e => { e.preventDefault(); setMesaj(""); setSayfa(1); setFiltre({ ...draft }); }}>
   <label className={s.field}>Eczane, kişi veya ürün ara<input className={s.input} value={draft.arama} maxLength={200} onChange={e => setDraft({ ...draft, arama: e.target.value })} /></label>
   <label className={s.field}>Durum<select className={s.select} value={draft.durum} onChange={e => setDraft({ ...draft, durum: e.target.value })}><option value="">Tümü</option>{Object.entries(ECLUB_ADMIN_DURUMLARI).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select></label>
   <label className={s.field}>Başlangıç<input type="date" className={s.input} value={draft.bas} onChange={e => setDraft({ ...draft, bas: e.target.value })} /></label>
   <label className={s.field}>Bitiş<input type="date" className={s.input} value={draft.son} min={draft.bas || undefined} onChange={e => setDraft({ ...draft, son: e.target.value })} /></label>
   <button className={`${s.button} ${s.primary}`}><Search />Uygula</button>
  </form>
  {hata ? <p role="alert" className={`${s.feedback} ${s.error}`}>{hata}</p> : loading ? <p role="status" className={s.feedback}>Talepler yükleniyor…</p> : data && <>
   <div className={s.stats}><div className={s.stat}><strong>{n(data.ozet.bekleyen)}</strong><span>Kod bekleyen</span></div><div className={s.stat}><strong>{n(data.ozet.teslimatta)}</strong><span>Teslimatta</span></div><div className={s.stat}><strong>{n(data.ozet.tamamlanan)}</strong><span>Tamamlanan</span></div></div>
   <p className={s.feedback}>{n(data.toplam)} talep · İptal: {n(data.ozet.iptal)} · İptal dışı toplam: <strong>{n(data.ozet.puan)} Puan · {n(data.ozet.tl)} TL</strong></p>
   {data.urun_ozeti.length>0 && <details className={s.card}><summary className={s.header}>Ürün bazında toplamlar</summary><div className={s.tableWrap}><table className={s.table}><thead><tr><th>Ürün</th><th>Talep</th><th>Puan</th><th>Tutar</th></tr></thead><tbody>{data.urun_ozeti.map(u => <tr key={u.urun_adi}><td>{u.urun_adi}</td><td>{n(u.adet)}</td><td>{n(u.puan)}</td><td>{n(u.tl)} TL</td></tr>)}</tbody></table></div></details>}
   <section className={s.card} aria-label={`${firma.firma_adi} çek talepleri`}>
    {!data.talepler.length ? <div className={s.empty}><strong>Bu kapsamda talep yok</strong><p>TM son onayı tamamlanmamış talepler burada gösterilmez.</p></div> : <div className={s.tableWrap}><table className={`${s.table} ${s.talepTable}`}><thead><tr><th>Eczane / GLN</th><th>Talep eden</th><th>Ürün / Yayın</th><th>UTT / BM / TM</th><th>Puan / Tutar</th><th>Tarih</th><th>Durum / Teslimat</th><th>İşlemler</th></tr></thead><tbody>{data.talepler.map(t => <tr key={t.talep_id}>
     <td><strong>{t.eczane_adi}</strong><small className={s.stock}>GLN: {t.gln || "—"}</small></td><td>{t.talep_eden}<small className={s.stock}>{t.rol}</small></td>
     <td>{t.urun_adi}<small className={s.stock}>Yayın {t.talep_no ?? "—"}</small><small className={s.stock}>{t.siparis_verildi_mi ? `${n(t.siparis_adet)} adet + ${n(t.siparis_mal_fazlasi)} MF` : "Siparişsiz"}</small></td>
     <td>UTT: {t.utt_adi}<small className={s.stock}>BM: {t.bm_adi}</small><small className={s.stock}>TM: {t.tm_adi}</small></td>
     <td><strong>{n(t.toplanan_puan)} Puan</strong><small className={s.stock}>{n(t.talep_edilen_cek_tl)} TL</small></td><td>{tarih(t.created_at)}<small className={s.stock}>TM: {tarih(t.tm_onay_tarihi)}</small></td>
     <td><span className={s.badge}>{ECLUB_ADMIN_DURUMLARI[t.durum]}</span><small className={s.stock}><TeslimatOzeti talep={t} /></small></td>
     <td><div className={s.actions}><button type="button" className={s.button} onClick={() => ac(t,"detay")}>Detay</button>{t.durum==="onaylandi" && <><button type="button" className={`${s.button} ${s.primary}`} onClick={() => ac(t,"cek_kodu_teslim")}>Kod / bağlantı gir</button><button type="button" className={`${s.button} ${s.danger}`} onClick={() => ac(t,"iptal")}>İptal</button></>}</div></td>
    </tr>)}</tbody></table></div>}
    <div className={s.footer}><span>{n(data.toplam)} kayıt · Sayfa {sayfa} / {Math.max(1,Math.ceil(data.toplam/50))}</span><div className={s.actions}><button type="button" className={s.button} disabled={sayfa<=1} onClick={() => setSayfa(v => v-1)}>Önceki</button><button type="button" className={s.button} disabled={sayfa*50>=data.toplam} onClick={() => setSayfa(v => v+1)}>Sonraki</button></div></div>
   </section>
  </>}
  {modal && <TalepPenceresi key={`${firma.firma_id}/${modal.talep.talep_id}/${modal.islem}`} firma={firma} {...modal} onClose={() => setModal(null)} onSaved={m => { setModal(null); setMesaj(m); setRevision(v => v+1); }} />}
 </div>;
}
function TeslimatOzeti({ talep }: { talep: EclubAdminTalep }) {
 if (talep.durum==="iptal") return <>Uygulanmaz</>;
 const kanal = (k: string) => {
  const rows = talep.teslimat.filter(x => x.kanal===k), total = rows.reduce((a,r) => a+r.adet,0), done = rows.filter(x => x.durum==="tamamlandi").reduce((a,r) => a+r.adet,0);
  return !total ? "Başlamadı" : rows.some(x => x.durum==="basarisiz") ? "Hata var" : done===total ? "Tamamlandı" : `${done}/${total} tamamlandı`;
 };
 return <>E-posta: {kanal("eposta")}<br />Push: {kanal("push")}</>;
}
function TalepPenceresi({ firma, talep, islem, onClose, onSaved }: { firma: EclubAdminFirma; talep: EclubAdminTalep; islem: "detay" | "cek_kodu_teslim" | "iptal"; onClose: () => void; onSaved: (m: string) => void }) {
 const [kod,setKod] = useState(""), [link,setLink] = useState(""), [busy,setBusy] = useState(false), [hata,setHata] = useState(""); const kilit = useRef(false);
 async function kaydet(e: FormEvent) {
  e.preventDefault(); if (kilit.current || islem==="detay" || talep.firma_id!==firma.firma_id) return;
  if (islem==="cek_kodu_teslim" && (!cekKoduGecerli(kod) || !cekBaglantisiGecerli(link))) { setHata("Geçerli çek kodu ve varsa HTTPS kullanım bağlantısı girin."); return; }
  kilit.current=true; setBusy(true); setHata("");
  try { const r=await fetch(endpoint,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({firma_id:firma.firma_id,talep_id:talep.talep_id,action:islem,...(islem==="cek_kodu_teslim"?{cek_kodu:kod.trim(),kullanim_linki:link}:{})})});const d=await r.json();if(!r.ok)throw new Error(d.hata||"İşlem tamamlanamadı.");onSaved(d.mesaj); }
  catch(e){setHata(e instanceof Error?e.message:"İşlem tamamlanamadı.");}
  finally{kilit.current=false;setBusy(false);}
 }
 return <KatalogPenceresi title={islem==="detay"?"Çek talebi detayı":islem==="iptal"?"Talebi iptal et":"Çek kodunu teslim et"} description={`${firma.firma_adi} · ${talep.eczane_adi} · ${n(talep.toplanan_puan)} Puan / ${n(talep.talep_edilen_cek_tl)} TL`} busy={busy} onClose={onClose}>
  <form className={s.form} onSubmit={kaydet} noValidate><p>{talep.urun_adi} · {talep.talep_eden}</p><p className={s.hint}>Talep: {talep.talep_id}</p>
   {islem==="detay" ? <><p>Durum: {ECLUB_ADMIN_DURUMLARI[talep.durum]}</p><p>Çek kodu: <strong className={s.cekKodu}>{talep.cek_kodu || "Henüz girilmedi"}</strong></p>{talep.kullanim_linki && cekBaglantisiGecerli(talep.kullanim_linki) && <a className={s.button} href={talep.kullanim_linki} target="_blank" rel="noopener noreferrer">Kullanım bağlantısını aç</a>}<p>Teslim tarihi: {tarih(talep.cek_gonderim_tarihi)}</p><p><TeslimatOzeti talep={talep}/></p>{talep.teslimat_ayrintilari?.map((i,index)=><p className={s.hint} key={index}>{i.kanal==="eposta"?"E-posta":"Push"}: {i.durum} · Deneme {i.deneme}/{i.max_deneme}{i.son_hata?` · ${i.son_hata}`:""}{i.tamamlanma_at?` · ${tarih(i.tamamlanma_at)}`:""}</p>)}</> : islem==="iptal" ? <p className={s.feedback}>Talep iptal edilecek ve bağlı puan kullanımı kaldırılacak. Teslimatı başlamış talepler iptal edilemez.</p> : <><label className={s.field}>Çek kodu<input className={s.input} value={kod} onChange={e=>setKod(e.target.value)} minLength={3} maxLength={200} disabled={busy} autoComplete="off" required /></label><label className={s.field}>Kullanım bağlantısı (isteğe bağlı)<input type="url" className={s.input} value={link} onChange={e=>setLink(e.target.value)} maxLength={2048} disabled={busy} placeholder="https://" /></label></>}
   {hata && <p role="alert" className={`${s.feedback} ${s.error}`}>{hata}</p>}
   <div className={s.formFooter}><button type="button" className={s.button} disabled={busy} onClick={onClose}>{islem==="detay"?"Kapat":"Vazgeç"}</button>{islem!=="detay" && <button className={`${s.button} ${islem==="iptal"?s.danger:s.primary}`} disabled={busy}>{busy?"İşleniyor…":islem==="iptal"?"Talebi iptal et":"Kodu teslim et"}</button>}</div>
  </form>
 </KatalogPenceresi>;
}
