"use client";

import Link from "next/link";
import styles from "./viva.module.css";
import formStyles from "./viva-form.module.css";
import detayStyles from "./viva-detay.module.css";
import odaStyles from "./viva-oda.module.css";
import VivaDetayIcerigi from "./VivaDetayIcerigi";
import { vivaDetayBolumu, vivaDetayYolu, type VivaDetayBolumu } from "@/lib/viva/detay";
import { YenileButonu } from "@/components/ui/yenile-butonu";
import VivaOdaAlani from "./VivaOdaAlani";
import VivaEpostaAlani from "./VivaEpostaAlani";
import { vivaEpostalariAyir } from "@/lib/viva/eposta";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, ChevronRight, Plus, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SayfaYenileBasligi } from "@/components/ui/sayfa-yenile-basligi";
import { SadeCokluAliciSecimi, SadeKapsulFiltre, SadeTarihAlani } from "@/components/kontrol/SadeKontroller";
import { vivaGoogleTakvim, vivaOutlookTakvim } from "@/lib/viva/takvim";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { VIVA_DURUMLARI, vivaFormDogrula, vivaTarih, vivaTarihGirdisi, vivaYerelZamaniUtc, type VivaBaglam, type VivaDavetEpostaGirdisi, type VivaDetay, type VivaEtkinlik } from "@/lib/viva/sozlesme";

export type VivaGorunum = "liste" | "yeni" | "detay" | "duzenle" | "oda";
export async function vivaIstek<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, cache: "no-store" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.hata ?? "İşlem tamamlanamadı.");
  return data as T;
}
function Ozet({ e }: { e: VivaEtkinlik }) {
  return <div className="space-y-3 break-words">
    <p className="text-sm font-medium text-primary">{VIVA_DURUMLARI[e.durum]} · {e.firma_adi} · {e.yonetebilir ? "Düzenlediğiniz etkinlik" : "Davet edildiğiniz etkinlik"}</p>
    <h2 className="text-xl font-semibold">{e.baslik}</h2>
    <p className="whitespace-pre-wrap text-sm text-muted-foreground">{e.aciklama}</p>
    <p className="flex items-start gap-2 text-sm"><CalendarDays className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><span>{vivaTarih(e.baslangic)} – {vivaTarih(e.bitis)} <span className="text-muted-foreground">(Türkiye saati)</span></span></p>
    <p className="text-sm text-muted-foreground">Düzenleyen: {e.sahip_adi}</p>
  </div>;
}
function EtkinlikFormu({ baglam, detay, onKaydet, ilkTur }: { ilkTur?: "anlik" | "planli"; baglam: VivaBaglam; detay: VivaDetay | null; onKaydet: (d: VivaDetay, anlik: boolean) => void }) {
  const e = detay?.etkinlik;
  const [baslik, setBaslik] = useState(e?.baslik ?? "");
  const [aciklama, setAciklama] = useState(e?.aciklama ?? "");
  const [tur, setTur] = useState(e ? "planli" : ilkTur ?? "");
  const [tarih, setTarih] = useState(e ? vivaTarihGirdisi(e.baslangic).slice(0, 10) : "");
  const [saat, setSaat] = useState(e ? vivaTarihGirdisi(e.baslangic).slice(11) : "");
  const [sure, setSure] = useState(e ? String(Math.max(1, Math.round((Date.parse(e.bitis) - Date.parse(e.baslangic)) / 60_000))) : "60");
  const [secili, setSecili] = useState((detay?.katilimcilar ?? []).map(k => `${k.tur}:${k.id}`));
  const [davetEpostalari, setDavetEpostalari] = useState<string[]>(() =>
    (detay?.eposta_davetleri ?? []).filter(d => !d.iptal && d.durum !== "iptal").map(d => d.eposta));
  const [epostaGirdisi, setEpostaGirdisi] = useState("");
  const [hata, setHata] = useState("");
  const [busy, setBusy] = useState(false);
  const kilit = useRef(false);
  const anahtar = useRef<string | null>(null);
  const girdiOzeti = useRef("");
  const secenekler = baglam.kisiler.map(k => ({ deger: `${k.tur}:${k.id}`, etiket: k.ad, altBilgi: `${k.tur === "eclub" ? "EClub" : "Firma içi"} · ${k.alt}` }));
  const firmaSecenekleri = secenekler.filter(k => k.deger.startsWith("ic:"));
  const eclubSecenekleri = secenekler.filter(k => k.deger.startsWith("eclub:"));
  const eclubDavetEdilebilir = baglam.eclub_davet_edebilir ?? eclubSecenekleri.length > 0;
  const firmaSecili = secili.filter(k => k.startsWith("ic:"));
  const eclubSecili = secili.filter(k => k.startsWith("eclub:"));
  const eskiSecimler = secili.filter(k => !secenekler.some(s => s.deger === k));
  async function kaydet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (kilit.current) return;
    setHata("");
    try {
      const epostalar = vivaEpostalariAyir(epostaGirdisi, davetEpostalari, true);
      setDavetEpostalari(epostalar.adresler);
      setEpostaGirdisi(epostalar.girdi);
      if (epostalar.hatali) throw Error("Hatalı veya tamamlanmamış e-posta adreslerini düzeltin.");
      if (!["anlik", "planli"].includes(tur)) throw Error("Şimdi başlat veya Yayın planla seçeneğini seçin.");
      const sureDakika = Number(sure);
      if (!Number.isInteger(sureDakika) || sureDakika < 1 || sureDakika > 1440) throw Error("Yayın süresi 1–1440 dakika olmalıdır.");
      const taslak = (event.nativeEvent as SubmitEvent).submitter?.getAttribute("value") === "taslak";
      const anlik = tur === "anlik";
      if (anlik && taslak) throw Error("Taslak için Yayın planla seçeneğini kullanın.");
      const baslangic = anlik ? null : vivaYerelZamaniUtc(`${tarih}T${saat}`);
      const v: Record<string, unknown> & VivaDavetEpostaGirdisi = { baslik, aciklama, yayin_turu: tur, durum: taslak ? "taslak" : "planlandi",
        ...(baslangic ? { baslangic, bitis: new Date(Date.parse(baslangic) + sureDakika * 60_000).toISOString() } : { sure_dakika: sureDakika }),
        davet_epostalari: epostalar.adresler,
        katilimcilar: secili.map(k => { const [tur, id] = k.split(":"); return { tur, id }; }) };
      const mesaj = vivaFormDogrula(v);
      if (mesaj) throw new Error(mesaj);
      if (eskiSecimler.length) throw new Error("Artık kapsamınızda olmayan seçimleri kaldırın.");
      // Yanıt kaybında aynı form aynı anahtarla yeniden gönderilir.
      const ozet = JSON.stringify(v);
      if (!anahtar.current || (girdiOzeti.current && girdiOzeti.current !== ozet)) anahtar.current = crypto.randomUUID();
      girdiOzeti.current = ozet;
      kilit.current = true; setBusy(true);
      onKaydet(await vivaIstek<VivaDetay>("/viva/api", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...v, islem: e ? "kaydet" : "olustur", etkinlik_id: e?.etkinlik_id ?? anahtar.current, ...(e ? { surum: e.surum } : {}) }) }), anlik);
    } catch (err) { setHata(err instanceof Error ? err.message : "Kaydedilemedi."); }
    finally { kilit.current = false; setBusy(false); }
  }
  let onizlemeTarihi = "Tarih seçilmedi";
  if (tarih) {
    try { onizlemeTarihi = new Intl.DateTimeFormat("tr-TR", { dateStyle: "long", timeZone: "Europe/Istanbul" }).format(new Date(vivaYerelZamaniUtc(`${tarih}T12:00`))); }
    catch { onizlemeTarihi = "Geçerli bir tarih seçin"; }
  }
  return <div className={formStyles.layout}>
    <Card className={formStyles.formCard}>
      <form onSubmit={kaydet} aria-label="Viva etkinlik formu" aria-busy={busy}>
        <fieldset disabled={busy} className={formStyles.fields}>
          <section className={formStyles.section} aria-labelledby="viva-bilgi-baslik">
            <h2 id="viva-bilgi-baslik"><span aria-hidden="true">01</span>Yayın bilgileri</h2>
            {!e && <div className={formStyles.field}><p className={formStyles.legend}>Yayın türü *</p><SadeKapsulFiltre etiket="Yayın türü" deger={tur} onDegistir={setTur} secenekler={[
              { deger: "anlik", etiket: "Şimdi başlat" }, { deger: "planli", etiket: "Yayın planla" },
            ]} /></div>}
            {e?.durum === "taslak" && <p className={formStyles.draftNote}>Taslak · Yalnız size görünür</p>}
            <div className={formStyles.field}><Label htmlFor="viva-baslik">Yayın başlığı *</Label><Input id="viva-baslik" required maxLength={160} value={baslik} onChange={x => setBaslik(x.target.value)} placeholder="Örn. Ekibimizle haftalık buluşma" /></div>
            <div className={formStyles.field}><Label htmlFor="viva-aciklama">Açıklama</Label><textarea id="viva-aciklama" maxLength={4000} value={aciklama} onChange={x => setAciklama(x.target.value)} placeholder="Yayın hakkında kısa bilgi verebilirsiniz." aria-describedby="viva-aciklama-yardim" /><p id="viva-aciklama-yardim" className={formStyles.help}>Katılımcılar etkinlik detayında bu açıklamayı görür.</p></div>
          </section>
          {tur && <section className={formStyles.section} aria-labelledby="viva-zaman-baslik">
            <h2 id="viva-zaman-baslik"><span aria-hidden="true">02</span>{tur === "anlik" ? "Yayın süresi" : "Tarih ve saat"}</h2>
            {tur === "planli" && <p className={formStyles.sectionDescription}>Tarih ve saati ayrı ayrı seçin. Bugün daha sonraki bir saati de planlayabilirsiniz.</p>}
            <div className={formStyles.timeGrid}>
              {tur === "planli" && <>
                <div className={formStyles.field}><Label htmlFor="viva-tarih">Başlangıç tarihi *</Label><SadeTarihAlani id="viva-tarih" required value={tarih} onChange={x => setTarih(x.target.value)} /></div>
                <div className={formStyles.field}><Label htmlFor="viva-saat">Başlangıç saati *</Label><Input id="viva-saat" type="time" required step={60} value={saat} onChange={x => setSaat(x.target.value)} /></div>
              </>}
              <div className={formStyles.field}><Label htmlFor="viva-sure">Süre (dakika) *</Label><Input id="viva-sure" type="number" required min={1} max={1440} step={1} value={sure} onChange={x => setSure(x.target.value)} /></div>
            </div>
          </section>}
          <section className={formStyles.section} aria-labelledby="viva-katilimci-baslik">
            <h2 id="viva-katilimci-baslik"><span aria-hidden="true">{tur ? "03" : "02"}</span>Davetliler</h2>
            <div className={formStyles.inviteSelectors}>
              <SadeCokluAliciSecimi secenekler={firmaSecenekleri} degerler={firmaSecili} onDegistir={degerler => setSecili(onceki => [...onceki.filter(k => !k.startsWith("ic:")), ...degerler])} etiket="Firmanız" aliciAdi="davetli" placeholder="Firmanız" className="w-full min-w-0" disabled={busy} />
              {eclubDavetEdilebilir && <SadeCokluAliciSecimi secenekler={eclubSecenekleri} degerler={eclubSecili} onDegistir={degerler => setSecili(onceki => [...onceki.filter(k => !k.startsWith("eclub:")), ...degerler])} etiket="E-Club Üyeleri" aliciAdi="davetli" placeholder="E-Club Üyeleri" className="w-full min-w-0" disabled={busy} />}
            </div>
            {secili.length > 0 && <ul className={formStyles.selectedChips} aria-label="Seçili katılımcılar">{secili.map(k => <li key={k} className={eskiSecimler.includes(k) ? formStyles.invalidChip : undefined}>{secenekler.find(x => x.deger === k)?.etiket ?? detay?.katilimcilar.find(x => `${x.tur}:${x.id}` === k)?.ad ?? "Kapsam dışı katılımcı"}</li>)}</ul>}
            {eskiSecimler.length > 0 && <div role="alert" className={formStyles.invalidSelection}><p>{eskiSecimler.length} seçim artık kapsamınızda bulunmuyor.</p><Button type="button" variant="outline" onClick={() => setSecili(x => x.filter(k => !eskiSecimler.includes(k)))}>Geçersiz seçimleri kaldır</Button></div>}
            <VivaEpostaAlani adresler={davetEpostalari} girdi={epostaGirdisi} onAdresler={setDavetEpostalari} onGirdi={setEpostaGirdisi} disabled={busy} />
          </section>
        </fieldset>
        {hata && <p role="alert" className={formStyles.formError}>{hata}</p>}
        <div className={formStyles.formActions}>
          <Button asChild variant="outline"><Link href={e ? `/viva/${e.etkinlik_id}` : "/viva"}>Vazgeç</Link></Button>
          {tur === "planli" && e?.durum !== "planlandi" && <Button type="submit" value="taslak" variant="outline" disabled={busy} className={formStyles.push}>Taslak olarak kaydet</Button>}
          <Button type="submit" disabled={busy || !tur} className={tur !== "planli" || e?.durum === "planlandi" ? formStyles.push : undefined}>{busy ? "Kaydediliyor…" : e && e.durum !== "taslak" ? "Değişiklikleri kaydet" : tur === "anlik" ? "Yayını başlat" : "Etkinliği planla"}<ArrowRight aria-hidden="true" /></Button>
        </div>
      </form>
    </Card>
    <aside className={formStyles.aside} aria-label="Etkinlik hazırlığı">
      <Card className={formStyles.helpCard}><h2>Buluşmanızı hazırlarken</h2><ul>
        <li>Net bir başlık ve kısa bir açıklama, ekibinizin hazırlanmasını kolaylaştırır.</li>
        <li>Planlı yayını daha sonra Google veya Outlook takviminize ekleyebilirsiniz.</li>
        <li>Taslaklar yalnız size görünür; hazır olduğunuzda planlayabilirsiniz.</li>
      </ul></Card>
      <Card className={formStyles.preview} aria-label="Etkinlik önizlemesi">
        <p className={formStyles.kicker}>ETKİNLİK ÖNİZLEMESİ</p><h3>{baslik.trim() || "Buluşmanızın başlığı"}</h3>
        <p>{tur === "anlik" ? "Şimdi başlayacak" : tur === "planli" ? <>{onizlemeTarihi}{saat && ` · ${saat}`}</> : "Yayın türü seçilmedi"}</p>
        <p>{sure || "—"} dakika · {secili.length} katılımcı</p>
        <p>{e ? `${e.sahip_adi} · ${e.firma_adi}` : baglam.kapsam}</p>
      </Card>
    </aside>
  </div>;
}

function TakvimDugmeleri({ e }: { e: VivaEtkinlik }) {
  if (e.durum !== "planlandi" || e.yayin_turu === "anlik" || !e.oda_acik) return null;
  return <div className="flex flex-wrap gap-3" aria-label="Yayını takvime ekle">
    <Button variant="outline" onClick={() => window.open(vivaGoogleTakvim(e, window.location.origin), "_blank", "noopener,noreferrer")}>Google Takvim’e ekle</Button>
    <Button variant="outline" onClick={() => {
      const url = URL.createObjectURL(new Blob([vivaOutlookTakvim(e, window.location.origin)], { type: "text/calendar;charset=utf-8" }));
      const a = document.createElement("a"); a.href = url; a.download = `viva-${e.etkinlik_id}.ics`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }}>Outlook Takvim’e ekle</Button>
  </div>;
}
const epostaDurumYazisi = {
  taslak: "Taslak", bekliyor: "Gönderim bekliyor", gonderiliyor: "Gönderiliyor",
  gonderildi: "Gönderildi", hata: "Gönderilemedi", kontrol: "Gönderim kontrolü gerekli", iptal: "İptal edildi",
} as const;
function DavetYonetimi({ detay, onDegis }: { detay: VivaDetay; onDegis: (d: VivaDetay) => void }) {
  const [ad, setAd] = useState(""); const [eposta, setEposta] = useState("");
  const [link, setLink] = useState(""); const [hata, setHata] = useState(""); const [mesaj, setMesaj] = useState("");
  const [busy, setBusy] = useState(false); const kilit = useRef(false);
  const e = detay.etkinlik;
  async function islem(islem: string, ek: Record<string, unknown>) {
    if (kilit.current) return;
    kilit.current = true; setBusy(true); setHata(""); setMesaj(""); setLink("");
    try {
      const d = await vivaIstek<VivaDetay & { davet_yolu?: string; uyari?: string }>("/viva/api", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ islem, etkinlik_id: e.etkinlik_id, surum: e.surum, ...ek }) });
      onDegis(d.eposta_davetleri ? d : { ...d, eposta_davetleri: detay.eposta_davetleri });
      if (d.davet_yolu) { setLink(`${window.location.origin}${d.davet_yolu}`); setAd(""); setEposta(""); }
      else setMesaj(d.uyari ?? (islem === "davet_yeniden_dene" ? "Davet yeniden gönderim kuyruğuna alındı." : "Davet iptal edildi."));
    } catch (err) { setHata(err instanceof Error ? err.message : "İşlem tamamlanamadı."); }
    finally { kilit.current = false; setBusy(false); }
  }
  return <section className={detayStyles.invites} aria-labelledby="viva-davet-baslik">
    <h2 id="viva-davet-baslik" className="text-lg font-semibold">Özel davetliler</h2>
    <p className="text-sm text-muted-foreground">Misafir, bağlantıyla davetteki e-posta adresini doğrular. Erişimi bu etkinliğin bitişiyle sona erer. Aynı adrese yeni davet oluşturmak eski bağlantıyı kapatır.</p>
    {e.durum === "planlandi" && e.oda_acik && <form onSubmit={x => { x.preventDefault(); void islem("davet_ekle", { ad, eposta }); }} className={detayStyles.inviteForm}>
      <div className="space-y-2"><Label htmlFor="viva-misafir-ad">Ad soyad</Label><Input id="viva-misafir-ad" required maxLength={120} value={ad} disabled={busy} onChange={x => setAd(x.target.value)} /></div>
      <div className="space-y-2"><Label htmlFor="viva-misafir-mail">E-posta</Label><Input id="viva-misafir-mail" required type="email" maxLength={254} value={eposta} disabled={busy} onChange={x => setEposta(x.target.value)} /></div>
      <Button type="submit" disabled={busy} className="md:col-span-2 md:w-fit">Davet bağlantısı oluştur</Button>
    </form>}
    {link && <div className={detayStyles.linkBox}><Label htmlFor="viva-davet-link">Davet bağlantısı — bu ekrandayken kopyalayın</Label><Input id="viva-davet-link" readOnly value={link} onFocus={x => x.target.select()} /><Button variant="outline" onClick={async () => {
      try { await navigator.clipboard.writeText(link); setMesaj("Bağlantı kopyalandı."); }
      catch { setMesaj("Bağlantıyı seçip kopyalayabilirsiniz."); }
    }}>Bağlantıyı kopyala</Button></div>}
    {hata && <p role="alert" className="text-sm text-destructive">{hata}</p>}{mesaj && <p role="status" className="text-sm">{mesaj}</p>}
    <h3 className={detayStyles.subheading}>Davet listesi <span className={detayStyles.pill}>Yalnız izleyici</span></h3>
    {!detay.davetler.length && <p className={detayStyles.emptyText}>Henüz özel davetli bulunmuyor.</p>}
    <ul className={detayStyles.dataList}>{detay.davetler.map(d => {
      const otomatik = detay.eposta_davetleri?.find(x => x.davet_id === d.davet_id);
      const yenidenDenenebilir = e.yonetebilir && !d.iptal && e.oda_acik && ["planlandi", "canli"].includes(e.durum)
        && otomatik && ["bekliyor", "hata"].includes(otomatik.durum) && otomatik.deneme_sayisi < 5;
      return <li key={d.davet_id} className={detayStyles.dataRow}><div className={detayStyles.identity}><span className={detayStyles.avatar} aria-hidden="true">{d.ad.trim().split(/\s+/).slice(0, 2).map(n => n[0]).join("")}</span><div><strong>{d.ad}</strong><span>{d.eposta} · {d.iptal ? "İptal edildi" : otomatik ? epostaDurumYazisi[otomatik.durum] : "İzleyici"}</span></div></div>
        <div className="flex flex-wrap gap-2">{yenidenDenenebilir && <Button variant="outline" disabled={busy} onClick={() => void islem("davet_yeniden_dene", { davet_id: d.davet_id })}>Yeniden dene</Button>}
        {!d.iptal && e.oda_acik && ["planlandi", "canli"].includes(e.durum) && <AlertDialog><AlertDialogTrigger asChild><Button variant="outline" disabled={busy}>Daveti iptal et</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Davet iptal edilsin mi?</AlertDialogTitle><AlertDialogDescription>{d.ad} adlı misafirin bağlantısı ve etkinliğe erişimi kapatılacak.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Vazgeç</AlertDialogCancel><AlertDialogAction onClick={() => void islem("davet_iptal", { davet_id: d.davet_id })}>Daveti iptal et</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>}</div></li>;
    })}</ul>
  </section>;
}

export default function VivaEkrani({ gorunum, etkinlikId, onizleme = false, anlikBaslat = false, ilkTur, ilkBolum = "ozet" }: { ilkBolum?: VivaDetayBolumu; ilkTur?: "anlik" | "planli"; gorunum: VivaGorunum; etkinlikId?: string; onizleme?: boolean; anlikBaslat?: boolean }) {
  const router = useRouter();
  const [okunuyor, setOkunuyor] = useState(true);
  const [bolum, setBolum] = useState(vivaDetayBolumu(ilkBolum));
  useEffect(() => setBolum(vivaDetayBolumu(ilkBolum)), [ilkBolum]);
  const [data, setData] = useState<{ baglam: VivaBaglam; detay: VivaDetay | null; etkinlikler: VivaEtkinlik[]; devam: boolean } | null>(null);
  const [uyari, setUyari] = useState("");
  const [hata, setHata] = useState(""); const [busy, setBusy] = useState(false); const [yenileme, setYenileme] = useState(0);
  const yukle = useCallback(async (signal: AbortSignal) => {
    const [baglam, sonuc] = await Promise.all([
      vivaIstek<VivaBaglam>("/viva/api?islem=baglam", { signal }),
      gorunum === "yeni" ? Promise.resolve(null) : etkinlikId
        ? vivaIstek<VivaDetay>(`/viva/api?islem=detay&etkinlik_id=${encodeURIComponent(etkinlikId)}`, { signal })
        : vivaIstek<{ etkinlikler: VivaEtkinlik[]; devam_var: boolean }>("/viva/api", { signal }),
    ]);
    if (signal.aborted) return;
    const detay = sonuc && "etkinlik" in sonuc ? sonuc : null;
    const liste = sonuc && "etkinlikler" in sonuc ? sonuc : null;
    setData({ baglam, detay, etkinlikler: liste?.etkinlikler ?? [], devam: liste?.devam_var ?? false }); setHata("");
  }, [etkinlikId, gorunum]);
  useEffect(() => {
    const kontrol = new AbortController(); setOkunuyor(true);
    void yukle(kontrol.signal).catch(e => { if (!kontrol.signal.aborted) { setData(null); setHata(e instanceof Error ? e.message : "Viva açılamadı."); } }).finally(() => { if (!kontrol.signal.aborted) setOkunuyor(false); });
    return () => kontrol.abort();
  }, [yukle, yenileme]);
  // İptal/üyelik değişiminde açık oda eski erişimle kalmasın; erişim kapanınca görüşme bileşeni kaldırılır.
  useEffect(() => {
    if (!etkinlikId || gorunum === "duzenle") return;
    const yenile = () => { if (document.visibilityState === "visible") setYenileme(n => n + 1); };
    const timer = window.setInterval(yenile, 30_000);
    document.addEventListener("visibilitychange", yenile);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", yenile); };
  }, [etkinlikId, gorunum]);
  const guncelle = (detay: VivaDetay) => setData(d => d ? { ...d, detay } : d);
  async function katilimciCikar(kisi: { id: string; tur: string }) {
    if (!e || busy) return;
    setBusy(true); setHata("");
    try {
      const sonuc = await vivaIstek<{ mesaj: string; tekrar_gerekli?: boolean }>("/viva/api/yasam", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ islem: "katilimci_cikar", etkinlik_id: e.etkinlik_id, surum: e.surum, kisi_id: kisi.id, tur: kisi.tur }) });
      setUyari(sonuc.tekrar_gerekli ? sonuc.mesaj : ""); setYenileme(n => n + 1);
    } catch (err) { setHata(err instanceof Error ? err.message : "Katılımcı çıkarılamadı."); }
    finally { setBusy(false); }
  }
  async function iptal() {
    if (!data?.detay || busy) return;
    setBusy(true); setHata("");
    try { const r = await vivaIstek<VivaDetay & { uyari?: string }>("/viva/api", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ islem: "iptal", etkinlik_id: etkinlikId, surum: data.detay.etkinlik.surum }) }); guncelle(r); setUyari(r.uyari ?? ""); }
    catch (err) { setHata(err instanceof Error ? err.message : "İptal edilemedi."); }
    finally { setBusy(false); }
  }
  const e = data?.detay?.etkinlik;
  if (gorunum === "yeni" || gorunum === "duzenle") {
    const duzenle = gorunum === "duzenle";
    const baslik = duzenle ? "Etkinliği düzenle" : "Etkinlik oluştur";
    const yetkili = data?.baglam.olusturabilir && (!duzenle || (e?.yonetebilir && e.yayin_turu !== "anlik" && ["taslak", "planlandi"].includes(e.durum)));
    return <main className={formStyles.screen}>
      <SayfaYenileBasligi ustBilgi={<nav className={formStyles.breadcrumb} aria-label="İçerik konumu"><span>Cogniti</span><ChevronRight aria-hidden="true" /><Link href="/viva">Viva</Link><ChevronRight aria-hidden="true" /><span aria-current="page">{baslik}</span></nav>}
        baslik={<h1 className={formStyles.pageTitle}>{baslik}</h1>}
        aciklama={duzenle ? <p className={formStyles.description}>Buluşmanızın bilgilerini ve katılımcılarını güncelleyin.</p> : undefined} />
      {hata && <div className={formStyles.loadError} role="alert"><p>{hata}</p><Button variant="outline" onClick={() => setYenileme(n => n + 1)}>Yeniden dene</Button></div>}
      {!data && !hata && <div role="status" className={formStyles.loading}>Etkinlik formu yükleniyor…</div>}
      {data && (yetkili
        ? <EtkinlikFormu key={`${etkinlikId ?? "yeni"}-${yenileme}`} baglam={data.baglam} detay={data.detay} ilkTur={ilkTur} onKaydet={(d, anlik) => { guncelle(d); router.push(`/viva/${d.etkinlik.etkinlik_id}${anlik ? "/oda?baslat=1" : ""}`); }} />
        : <Card className={formStyles.loadError}><p role="alert">Bu etkinliği oluşturma veya düzenleme yetkiniz yok.</p></Card>)}
      <Link className={formStyles.backLink} href="/viva"><ArrowLeft aria-hidden="true" />Viva etkinliklerine dön</Link>
    </main>;
  }
  if (gorunum === "detay") return <main className={detayStyles.screen}>
    <SayfaYenileBasligi ustBilgi={<nav className={detayStyles.breadcrumb} aria-label="İçerik konumu"><span>Cogniti</span><ChevronRight aria-hidden="true" /><Link href="/viva">Viva</Link><ChevronRight aria-hidden="true" /><span aria-current="page">Etkinlik detayları</span></nav>}
      baslik={<h1 className={detayStyles.pageTitle}>Etkinlik detayları</h1>}
      aksiyon={<YenileButonu yenileniyor={okunuyor} disabled={busy} onYenile={() => setYenileme(n => n + 1)} />} />
    {hata && <p role="alert" className={detayStyles.error}>{hata}</p>}{uyari && <p role="status" className={detayStyles.note}>{uyari}</p>}
    {!data && !hata && <p role="status" className={detayStyles.loading}>Etkinlik yükleniyor…</p>}
    {data?.detay && e && <VivaDetayIcerigi key={e.etkinlik_id} detay={data.detay} yenilemeSayaci={yenileme} bolum={bolum} onBolum={v => { setBolum(v); router.replace(vivaDetayYolu(e.etkinlik_id, v), { scroll: false }); }} busy={busy}
      onIptal={() => void iptal()} onCikar={k => void katilimciCikar(k)} takvim={<TakvimDugmeleri e={e} />}
      davetler={<DavetYonetimi detay={data.detay} onDegis={guncelle} />} />}
  </main>;
  if (gorunum === "oda") return <main className={odaStyles.screen}>
    <header className={odaStyles.pageHeader}><div><Link href={etkinlikId ? `/viva/${etkinlikId}` : "/viva"} className={odaStyles.backLink}><ArrowLeft aria-hidden="true" />Etkinlik bilgileri</Link><h1>{e?.baslik ?? "Yayın odası"}</h1>{e && <p className={odaStyles.headingSub}>{vivaTarih(e.baslangic)} – {vivaTarih(e.bitis)} · {e.firma_adi} · {VIVA_DURUMLARI[e.durum]}</p>}</div><YenileButonu yenileniyor={okunuyor} onYenile={() => setYenileme(n => n + 1)} /></header>
    {hata && <p role="alert" className={odaStyles.error}>{hata}</p>}{uyari && <p role="status" className={odaStyles.note}>{uyari}</p>}
    {!data && !hata && <p role="status" className={odaStyles.loading}>Yayın odası yükleniyor…</p>}
    {e && (e.oda_acik ? <VivaOdaAlani key={e.etkinlik_id} etkinlikId={e.etkinlik_id} surum={e.surum} yonetebilir={e.yonetebilir} onizleme={onizleme && e.yonetebilir} otomatikKatil={anlikBaslat && e.yonetebilir && e.yayin_turu === "anlik"} /> : <section className={odaStyles.closedRoom} role="status"><span className={odaStyles.stateIcon}><VideoOff aria-hidden="true" /></span><h2>{e.durum === "iptal" ? "Etkinlik iptal edildi" : e.durum === "sona_erdi" ? "Buluşma sona erdi" : "Yayın odası kapalı"}</h2><p>Etkinliğin yayın odası kapalı. Etkinlik bilgilerini ve erişiminiz olan arşiv bölümlerini detay sayfasında görebilirsiniz.</p><Button asChild variant="outline"><Link href={`/viva/${e.etkinlik_id}`}>Etkinlik detayları</Link></Button></section>)}
  </main>;
  return <main className={`${styles.screen} mx-auto w-full max-w-5xl space-y-6 p-4 pb-12 text-foreground md:p-8`}>
    <header className="flex flex-wrap items-center justify-between gap-4"><div><Link href="/viva" className="text-sm font-semibold text-primary">Cogniti · Viva</Link><h1 className="mt-2 text-2xl font-bold">Viva</h1>{gorunum === "liste" && <p className="mt-2 text-sm text-muted-foreground">Etkinliklerinizi planlayın, ekibinizle buluşun.</p>}</div>
      <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setYenileme(n => n + 1)}>Yenile</Button>{gorunum === "liste" && data?.baglam.olusturabilir && <Button asChild><Link href="/viva/yeni"><Plus aria-hidden="true" />Etkinlik oluştur</Link></Button>}{gorunum !== "liste" && <Button asChild variant="outline"><Link href="/viva">Viva’ya dön</Link></Button>}</div>
    </header>
    {hata && <p role="alert" className="rounded-lg border border-destructive/40 p-4 text-sm text-destructive">{hata}</p>}
    {uyari && <p role="status" className="text-sm text-muted-foreground">{uyari}</p>}
    {!data && !hata && <p role="status">Viva yükleniyor…</p>}
    {data && gorunum === "liste" && <div className="space-y-4">
      {data.etkinlikler.length === 0 && <Card><CardContent className="text-center text-sm text-muted-foreground">Henüz etkinlik bulunmuyor. Oluşturduğunuz veya davet edildiğiniz etkinlikler burada görünecek.</CardContent></Card>}
      {data.etkinlikler.map(x => <Card key={x.etkinlik_id}><CardContent className="space-y-4"><Ozet e={x} /><Button asChild variant="outline"><Link href={`/viva/${x.etkinlik_id}`}>Etkinliği aç</Link></Button></CardContent></Card>)}
      {data.devam && <Button disabled={busy} variant="outline" onClick={async () => { setBusy(true); try {
        const sonuc = await vivaIstek<{ etkinlikler: VivaEtkinlik[]; devam_var: boolean }>(`/viva/api?offset=${data.etkinlikler.length}`);
        setData(d => d ? { ...d, etkinlikler: [...d.etkinlikler, ...sonuc.etkinlikler.filter(x => !d.etkinlikler.some(y => y.etkinlik_id === x.etkinlik_id))], devam: sonuc.devam_var } : d);
      } catch (err) { setHata(err instanceof Error ? err.message : "Liste alınamadı."); } finally { setBusy(false); } }}>Daha fazla göster</Button>}
    </div>}

  </main>;
}
