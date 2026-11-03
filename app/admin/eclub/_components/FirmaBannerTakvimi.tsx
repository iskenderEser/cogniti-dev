"use client";
import { useEffect, useRef, useState } from "react";
import { useFirmaSaltOkunur } from "@/app/admin/_components/FirmaYonetimYetkisi";
import { ECZANEM_BANNER_ALANLARI, type BannerAlani } from "@/lib/eclub/banner";
import { trGunu, trGunEkle } from "@/lib/zaman/kontrol";
import styles from "../../admin.module.css";

type Gorsel = { hafta_no: number; url: string; baslangic_at: string };
type Kayit = { rezervasyon_id: string; sira: number; baslangic: string; baslangic_at: string; bitis_at: string; hafta_sayisi: number; durum: string; ucret_islendi: boolean; gorseller: Gorsel[]; son_hata: string | null };
type Takvim = { simdi: string; uygun: boolean; onerilen: string | null; manuel_engel: boolean; rezervasyonlar: Kayit[]; mevcut_bannerlar: { sira: number; kaynak: string; url: string }[] };
function gelecekPazartesi() {
  const gun = trGunu();
  const haftaGunu = new Date(`${gun}T12:00:00+03:00`).getUTCDay();
  return trGunEkle(gun, (8 - haftaGunu) % 7 || 7);
}
const gunEkle = trGunEkle;
const tarih = (v: string) => new Date(v.length === 10 ? `${v}T12:00:00+03:00` : v).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul" });
const durumAdi: Record<string, string> = { rezerve: "Rezerve", yayinda: "Yayında", tamamlandi: "Tamamlandı", iptal: "İptal edildi", kaldirildi: "Yayından kaldırıldı", suresi_gecti: "Yayın süresi geçti" };
export default function FirmaBannerTakvimi({ firmaId, firmaAdi, alan }: { firmaId: string; firmaAdi: string; alan: BannerAlani }) {
  const saltOkunur = useFirmaSaltOkunur();
  const [bas, setBas] = useState(gelecekPazartesi), [sira, setSira] = useState(1), [hafta, setHafta] = useState(1);
  const [veri, setVeri] = useState<Takvim | null>(null), [hata, setHata] = useState(""), [mesaj, setMesaj] = useState("");
  const [busy, setBusy] = useState(false), [loading, setLoading] = useState(true), [yenileme, setYenileme] = useState(0);
  const [onay, setOnay] = useState<string | null>(null), [dosyalar, setDosyalar] = useState<Record<number, File>>({});
  const kilit = useRef(false), canli = useRef(true);
  const endpoint = "/admin/api/eclub/banner-takvim";
  useEffect(() => { canli.current = true; return () => { canli.current = false; }; }, []);
  useEffect(() => { const t = setInterval(() => setYenileme(n => n + 1), 60000); return () => clearInterval(t); }, []);
  useEffect(() => {
    const c = new AbortController(); setLoading(true); setHata(""); setVeri(null);
    const q = new URLSearchParams({ firma_id: firmaId, alan, sira: String(sira), bas, hafta: String(hafta) });
    void (async () => {
      try { const r = await fetch(`${endpoint}?${q}`, { cache: "no-store", signal: c.signal }); const d = await r.json(); if (!r.ok) throw new Error(d.hata || "Takvim alınamadı."); if (!c.signal.aborted) setVeri(d); }
      catch (e) { if (!c.signal.aborted) setHata(e instanceof Error ? e.message : "Takvim alınamadı."); }
      finally { if (!c.signal.aborted) setLoading(false); }
    })();
    return () => c.abort();
  }, [firmaId, alan, sira, bas, hafta, yenileme]);
  async function isle(is: () => Promise<Response>) {
    if (kilit.current || saltOkunur) return;
    kilit.current = true; setBusy(true); setHata(""); setMesaj("");
    try { const r = await is(); const d = await r.json(); if (!r.ok) throw new Error(d.hata || "İşlem tamamlanamadı."); if (canli.current) { setMesaj(d.mesaj || "Kaydedildi."); setYenileme(n => n + 1); setOnay(null); } }
    catch (e) { if (canli.current) setHata(e instanceof Error ? e.message : "İşlem tamamlanamadı."); }
    finally { kilit.current = false; if (canli.current) setBusy(false); }
  }
  function rezerve() {
    if (!veri?.uygun || Array.from({ length: hafta }, (_, i) => dosyalar[i]).some(d => !d)) return;
    const f = new FormData(); f.set("firma_id", firmaId); f.set("alan", alan); f.set("sira", String(sira)); f.set("bas", bas); f.set("hafta", String(hafta)); f.set("rezervasyon_id", crypto.randomUUID());
    for (let i = 0; i < hafta; i++) f.set(`gorsel_${i}`, dosyalar[i]);
    void isle(() => fetch(endpoint, { method: "POST", body: f }));
  }
  function gorselDegistir(r: Kayit, h: Gorsel, dosya?: File) {
    if (!dosya) return;
    const f = new FormData(); f.set("firma_id", firmaId); f.set("alan", alan); f.set("islem", "gorsel"); f.set("rezervasyon_id", r.rezervasyon_id); f.set("hafta_no", String(h.hafta_no)); f.set("gorsel_0", dosya);
    void isle(() => fetch(endpoint, { method: "POST", body: f }));
  }
  const alanAdi = alan === "firma" ? "Eclub Firma ve Yayınları" : `Eczanem · ${ECZANEM_BANNER_ALANLARI[alan]}`;
  return <section className={styles.card}>
    <div className={styles.cardHeader}><div><h2>{firmaAdi} · {alanAdi}</h2><p>Pazartesi–Pazar · Haftalık 200 token</p></div><button type="button" className={styles.button} disabled={busy || loading} onClick={() => setYenileme(n => n + 1)}>Yenile</button></div>
    <div className={styles.cardBody}>
      {hata && <p role="alert" className={styles.notice}>{hata}</p>}{mesaj && <p role="status" className={styles.notice}>{mesaj}</p>}
      <div className={styles.formGrid}>
        <label className={styles.field}>Banner alanı<select className={styles.input} value={sira} disabled={busy} onChange={e => { setSira(Number(e.target.value)); setOnay(null); }}><option value={1}>Birinci banner</option><option value={2}>İkinci banner</option><option value={3}>Üçüncü banner</option></select></label>
        <label className={styles.field}>Başlangıç pazartesisi<input className={styles.input} type="date" value={bas} min={gelecekPazartesi()} step={7} disabled={busy} onChange={e => { if (e.target.value) { setBas(e.target.value); setOnay(null); } }} /></label>
        <label className={styles.field}>Yayın süresi<select className={styles.input} value={hafta} disabled={busy} onChange={e => { setHafta(Number(e.target.value)); setOnay(null); }}><option value={1}>1 hafta · 200 token</option><option value={2}>2 hafta · 400 token</option></select></label>
      </div>
      <p>Aynı alanda en fazla iki ardışık hafta; ardından en az bir hafta ara verilir.</p>
      <div className={styles.actions} aria-label="Yayın haftaları">{Array.from({ length: 8 }, (_, i) => gunEkle(gelecekPazartesi(), i * 7)).map(g => <button type="button" key={g} className={styles.button} aria-pressed={bas === g} disabled={busy} onClick={() => { setBas(g); setOnay(null); }}>{tarih(g)}</button>)}</div>
      {loading && <p role="status">Takvim yükleniyor…</p>}
      {veri && <>
        <p role="status">{veri.uygun ? `${tarih(bas)} – ${tarih(gunEkle(bas, hafta * 7 - 1))} uygun.` : veri.manuel_engel ? "Bu alan mevcut bir bannerla dolu. Banner kaldırılmadan rezervasyon yapılamaz." : "Seçilen hafta dolu veya ardışık iki hafta sınırına takılıyor."}</p>
        {!veri.uygun && veri.onerilen && <button type="button" className={styles.button} disabled={busy} onClick={() => { setBas(veri.onerilen!); setOnay(null); }}>En yakın uygun hafta: {tarih(veri.onerilen)}</button>}
        {!saltOkunur && <fieldset disabled={busy || loading || !veri.uygun} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
          <div className={styles.formGrid}>{Array.from({ length: hafta }, (_, i) => <label className={styles.field} key={i}>{tarih(gunEkle(bas, i * 7))} haftasının görseli{dosyalar[i] && <span>{dosyalar[i].name}</span>}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => setDosyalar(d => ({ ...d, [i]: e.target.files?.[0] as File }))} /></label>)}</div>
          <p>Toplam {hafta * 200} token ilk hafta başladığında birlikte işlenir. Bakiye yetmezse eksik kısım firmanın borcuna yazılır.</p>
          <p>Başlangıca en az 24 saat varsa iptal ücretsizdir. Son 24 saatte iptalde bedelin tamamı kesilir. Yayın başladıktan sonra iade yapılmaz.</p>
          <button type="button" className={`${styles.button} ${styles.primary}`} disabled={busy || Array.from({ length: hafta }, (_, i) => dosyalar[i]).some(d => !d)} onClick={rezerve}>Onayla ve rezerve et · {hafta * 200} token</button>
        </fieldset>}
        {veri.mevcut_bannerlar.length > 0 && <><h3>Mevcut bannerlar</h3>{veri.mevcut_bannerlar.map(b => <div key={`${b.sira}/${b.kaynak}`}><p>{b.sira}. alan · {b.kaynak === "cogniti" ? "Cogniti bannerı" : "Önceki banner"}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.url} alt={`${b.sira}. mevcut banner`} style={{ width: "100%", maxWidth: 480 }} />
          {!saltOkunur && b.kaynak === "firma" && <button type="button" className={styles.button} disabled={busy} onClick={() => setOnay(`eski:${b.sira}`)}>Kaldır</button>}
          {onay === `eski:${b.sira}` && <button type="button" className={styles.button} disabled={busy} onClick={() => void isle(() => fetch(`/admin/api/eclub/bannerlar?${new URLSearchParams({ firma_id: firmaId, alan, kaynak: "firma", sira: String(b.sira) })}`, { method: "DELETE" }))}>Onayla, mevcut bannerı kaldır</button>}
        </div>)}</>}
        <h3>Yayınlar ve rezervasyonlar</h3>
        {!veri.rezervasyonlar.length && <p>Rezervasyon bulunmuyor.</p>}
        {veri.rezervasyonlar.map(r => {
          const simdi = Date.parse(veri.simdi), basMs = Date.parse(r.baslangic_at), acik = ["rezerve", "yayinda"].includes(r.durum), bedel = r.hafta_sayisi * 200;
          const kesinti = r.ucret_islendi || simdi > basMs - 86400000;
          return <section key={r.rezervasyon_id} className={styles.card}>
            <div className={styles.cardHeader}><h3>{r.sira}. alan · {tarih(r.baslangic)} – {tarih(gunEkle(r.baslangic, r.hafta_sayisi * 7 - 1))}</h3><span>{durumAdi[r.durum]}</span></div>
            <div className={styles.cardBody}><p>{bedel} token · {r.ucret_islendi ? "İşlendi" : "Henüz işlenmedi"}</p>{r.son_hata && <p role="alert">{r.son_hata}</p>}
              <div className={styles.formGrid}>{r.gorseller.map(h => <div key={h.hafta_no}><p>{h.hafta_no + 1}. hafta · {tarih(h.baslangic_at)}</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={h.url} alt={`${h.hafta_no + 1}. hafta bannerı`} style={{ width: "100%", maxWidth: 480 }} />
                {!saltOkunur && acik && simdi < Date.parse(h.baslangic_at) && <label className={styles.field}>Görseli ücretsiz değiştir<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={e => gorselDegistir(r, h, e.target.files?.[0])} /></label>}
              </div>)}</div>
              {!saltOkunur && acik && (onay === r.rezervasyon_id ? <div><p>{kesinti ? `${bedel} token bedel uygulanır; iade yapılmaz.` : "Rezervasyon ücretsiz iptal edilecek."}</p><button type="button" className={`${styles.button} ${styles.danger}`} disabled={busy} onClick={() => void isle(() => fetch(`${endpoint}?${new URLSearchParams({ firma_id: firmaId, rezervasyon_id: r.rezervasyon_id, beklenen_kesinti: String(kesinti ? bedel : 0) })}`, { method: "DELETE" }))}>Onayla</button><button type="button" className={styles.button} disabled={busy} onClick={() => setOnay(null)}>Vazgeç</button></div> : <button type="button" className={styles.button} disabled={busy} onClick={() => setOnay(r.rezervasyon_id)}>{simdi >= basMs ? "Yayından kaldır" : "Rezervasyonu iptal et"}</button>)}
            </div>
          </section>;
        })}
      </>}
    </div>
  </section>;
}
