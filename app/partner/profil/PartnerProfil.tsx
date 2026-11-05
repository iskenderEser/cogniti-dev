"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { AlertCircle, CheckCircle2, Loader2, Save } from "lucide-react";
import PartnerLogoAlani from "./PartnerLogoAlani";
import PartnerIbanAlani from "./PartnerIbanAlani";
import CognitiLogo from "@/components/marka/CognitiLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SadeFormSecimi } from "@/components/kontrol/SadeKontroller";
import { ilSecenekleri, ilinIlceleri } from "@/lib/firma/konumReferansi";
import { ilinVergiDaireleri } from "@/lib/firma/vergiDairesiReferansi";
import { PARTNER_LOGO_BOYUTU, partnerProfilDogrula, type PartnerKayitliProfil } from "@/lib/agora/partnerProfil";
import type { PartnerProfilKimligi } from "@/lib/agora/partnerOturumu";
import styles from "../partner.module.css";

const bos = { sirket_adi: "", il_id: "", ilce_id: "", adres: "", vergi_dairesi_kodu: "", vergi_no: "", iban: "TR" };
export default function PartnerProfil({ partner }: { partner: PartnerProfilKimligi }) {
  const [form, setForm] = useState(bos);
  const [profil, setProfil] = useState<PartnerKayitliProfil | null>(null);
  const [uyelik, setUyelik] = useState("profil_bekliyor");
  const [logo, setLogo] = useState<File | null>(null);
  const [hata, setHata] = useState("");
  const [mesaj, setMesaj] = useState("");
  const [okundu, setOkundu] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [cikiliyor, setCikiliyor] = useState(false);
  const kilit = useRef(false), dosyaInput = useRef<HTMLInputElement>(null);

  const oku = useCallback(async (signal?: AbortSignal) => {
    setYukleniyor(true); setHata(""); setOkundu(false);
    try {
      const r = await fetch("/partner/api/profil", { cache: "no-store", signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000) });
      if (r.status === 401) { window.location.replace("/partner"); return; }
      const data = await r.json();
      if (!r.ok) throw new Error(data.hata || "Profil okunamadı.");
      const p: PartnerKayitliProfil | null = data.profil;
      if (!signal?.aborted) {
        setProfil(p); setUyelik(data.uyelik_durumu);
        setForm(p ? { sirket_adi: p.sirket_adi, il_id: String(p.il_id), ilce_id: String(p.ilce_id), adres: p.adres, vergi_dairesi_kodu: p.vergi_dairesi_kodu, vergi_no: p.vergi_no, iban: p.iban } : bos);
        setOkundu(true);
      }
    } catch (e) { if (!signal?.aborted) setHata(e instanceof Error ? e.message : "Profil okunamadı. Yeniden deneyin."); }
    finally { if (!signal?.aborted) setYukleniyor(false); }
  }, []);
  useEffect(() => { const c = new AbortController(); void oku(c.signal); return () => c.abort(); }, [oku]);

  function durumaOdaklan() {
    requestAnimationFrame(() => document.getElementById("profil-kayit-durumu")?.focus());
  }
  async function kaydet(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (kilit.current || !okundu) return;
    setHata(""); setMesaj("");
    const d = partnerProfilDogrula({ ...form, il_id: Number(form.il_id), ilce_id: Number(form.ilce_id) });
    if (!d.ok) { setHata(d.hata); durumaOdaklan(); return; }
    if (!logo && !profil?.logo_yolu) { setHata("Logo yükleyin."); durumaOdaklan(); return; }
    kilit.current = true; setKaydediliyor(true);
    try {
      const body = new FormData();
      Object.entries(form).forEach(([k,v]) => body.set(k,v));
      body.set("surum", String(profil?.surum ?? 0));
      if (logo) body.set("logo",logo);
      const r = await fetch("/partner/api/profil", { method: "POST", body, signal: AbortSignal.timeout(45000) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.hata || "Profil kaydedilemedi.");
      setMesaj(data.mesaj); setLogo(null);
      if (dosyaInput.current) dosyaInput.current.value = "";
      await oku();
    } catch (e) { setHata(e instanceof Error ? e.message : "Kayıt sonucu doğrulanamadı. Sayfayı yenileyip kontrol edin."); }
    finally { kilit.current = false; setKaydediliyor(false); durumaOdaklan(); }
  }
  async function cikis() {
    if (kilit.current) return;
    setHata(""); setCikiliyor(true);
    try {
      const r = await fetch("/partner/api/cikis", { method: "POST", signal: AbortSignal.timeout(15000) });
      if (!r.ok) throw new Error();
      window.location.replace("/partner");
    } catch { setHata("Çıkış tamamlanamadı. Lütfen yeniden deneyin."); setCikiliyor(false); }
  }
  const disabled = !okundu || yukleniyor || kaydediliyor || cikiliyor || uyelik === "onaylandi";
  const kayitAyni = !!profil && !logo && Object.keys(bos).every(k => String(form[k as keyof typeof form]) === String(profil[k as keyof typeof bos]));
  const ibanHatali = hata.includes("IBAN");
  return <main className={styles.page}><div className={`${styles.content} ${styles.profilContent}`}>
    <CognitiLogo className={styles.logo} />
    <header className={styles.header}><h1>Profil Tamamlama</h1></header>
    <section className={styles.card} aria-label="İş partneri profil bilgileri">
      <p className={styles.notice}>{uyelik === "onay_bekliyor" ? "Profiliniz kaydedildi. Üyelik onayı bekleniyor." : uyelik === "onaylandi" ? "Üyeliğiniz onaylandı." : "İlk girişiniz onaylandı. Devam etmek için şirket bilgilerinizi tamamlayın."}</p>
      <form className={styles.form} noValidate onSubmit={kaydet}>
        <div className={styles.profilGrid}>
          {[["ad", "Ad Soyad", partner.ad_soyad], ["eposta", "E-Posta", partner.eposta], ["telefon", "Cep Telefonu", partner.cep_telefonu]].map(([id, label, value]) => <div key={id} className={styles.field}><label htmlFor={`profil-${id}`}>{label}</label><Input id={`profil-${id}`} value={value} readOnly /></div>)}
        </div>
        <p className={styles.description}>Şirket bilgilerinin tümü ve logo zorunludur.</p>
        <fieldset disabled={disabled} className={styles.profilGrid}>
          <div className={`${styles.field} ${styles.tamSatir}`}><label htmlFor="profil-sirket">Şirket Adı</label><Input id="profil-sirket" required minLength={2} maxLength={200} autoComplete="organization" value={form.sirket_adi} onChange={e => setForm({ ...form, sirket_adi: e.target.value })} /></div>
          <SadeFormSecimi etiket="İl" id="profil-il" required value={form.il_id} onChange={e => setForm({ ...form, il_id: e.target.value, ilce_id: "", vergi_dairesi_kodu: "" })}><option value="">İl seçin</option>{ilSecenekleri.map(o => <option key={o.deger} value={o.deger}>{o.etiket}</option>)}</SadeFormSecimi>
          <SadeFormSecimi etiket="İlçe" id="profil-ilce" required disabled={!form.il_id} value={form.ilce_id} onChange={e => setForm({ ...form, ilce_id: e.target.value })}><option value="">İlçe seçin</option>{ilinIlceleri(Number(form.il_id)).map(o => <option key={o.deger} value={o.deger}>{o.etiket}</option>)}</SadeFormSecimi>
          <div className={`${styles.field} ${styles.tamSatir}`}><label htmlFor="profil-adres">Adres</label><textarea id="profil-adres" required minLength={10} maxLength={1000} autoComplete="street-address" rows={3} value={form.adres} onChange={e => setForm({ ...form, adres: e.target.value })} /></div>
          <SadeFormSecimi etiket="Vergi Dairesi" id="profil-vergi-dairesi" required disabled={!form.il_id} value={form.vergi_dairesi_kodu} onChange={e => setForm({ ...form, vergi_dairesi_kodu: e.target.value })}><option value="">Vergi dairesi seçin</option>{ilinVergiDaireleri(Number(form.il_id)).map(o => <option key={o.deger} value={o.deger}>{o.etiket}</option>)}</SadeFormSecimi>
          <div className={styles.field}><label htmlFor="profil-vergi-no">Vergi Numarası</label><Input id="profil-vergi-no" required inputMode="numeric" pattern="[0-9]{10}" maxLength={10} value={form.vergi_no} onChange={e => setForm({ ...form, vergi_no: e.target.value })} /></div>
          <div className={`${styles.field} ${styles.tamSatir}`}><label htmlFor="profil-iban">IBAN</label><PartnerIbanAlani value={form.iban} hatali={ibanHatali} onChange={iban => setForm(onceki => ({ ...onceki, iban }))} />{ibanHatali && <p id="profil-iban-hata" className={styles.alanHatasi}>{hata}</p>}</div>
          <div className={`${styles.field} ${styles.tamSatir}`}><label htmlFor="profil-logo">Logo</label>
            <PartnerLogoAlani dosya={logo} kayitliLogo={profil?.logo_yolu ? `/partner/api/logo?v=${profil.surum}` : null} inputRef={dosyaInput} onChange={e => { const f = e.target.files?.[0] ?? null; if (f && (f.size > PARTNER_LOGO_BOYUTU || !["image/png", "image/jpeg", "image/webp"].includes(f.type))) { setHata("PNG, JPEG veya WebP logo seçin; en fazla 5 MB."); e.target.value = ""; setLogo(null); } else { setLogo(f); setHata(""); } }} />
            <p className={styles.description} id="profil-logo-bilgi">PNG, JPEG veya WebP · En fazla 5 MB{profil?.logo_yolu ? " · Dosya seçmezseniz mevcut logo korunur." : ""}</p>
          </div>
        </fieldset>
        <div id="profil-kayit-durumu" tabIndex={-1} className={`${styles.kayitDurumu} ${hata ? styles.kayitHata : kayitAyni ? styles.kayitBasari : ""}`} role={hata ? "alert" : "status"} aria-live={hata ? "assertive" : "polite"}>
          {hata ? <AlertCircle aria-hidden="true" /> : kaydediliyor || yukleniyor ? <Loader2 className={styles.donenSimge} aria-hidden="true" /> : kayitAyni ? <CheckCircle2 aria-hidden="true" /> : <Save aria-hidden="true" />}
          <div><strong>{hata ? "Kaydedilemedi" : kaydediliyor ? "Profil kaydediliyor…" : yukleniyor ? "Profil yükleniyor…" : kayitAyni ? "Kaydedildi" : "Değişiklikler henüz kaydedilmedi"}</strong>
            <p>{hata || (kaydediliyor ? "Lütfen bekleyin. İşlem tamamlanınca sonuç burada görünecek." : kayitAyni ? (mesaj || "Bilgileriniz kayıtlı. Üyelik onayı bekleniyor.") : yukleniyor ? "Bilgileriniz okunuyor." : "Bilgilerinizi kaydetmek için aşağıdaki düğmeye basın.")}</p>
          </div>
        </div>
        <Button className={styles.kaydetButonu} type="submit" disabled={disabled || kayitAyni} aria-busy={kaydediliyor}>
          {kaydediliyor ? <Loader2 className={styles.donenSimge} aria-hidden="true" /> : kayitAyni ? <CheckCircle2 aria-hidden="true" /> : <Save aria-hidden="true" />}
          {kaydediliyor ? "Kaydediliyor…" : kayitAyni ? "Kaydedildi" : "Profili Kaydet"}
        </Button>
        {!okundu && !yukleniyor && <Button type="button" onClick={() => void oku()}>Yeniden Dene</Button>}
        <Button type="button" variant="outline" onClick={() => void cikis()} disabled={cikiliyor || kaydediliyor}>{cikiliyor ? "Çıkılıyor…" : "Çıkış"}</Button>
      </form>
    </section>
  </div></main>;
}
