"use client";

import EczanemSayfaBanner from "@/components/eczanem/EczanemSayfaBanner";
import { SadeKontrolButonu, SadeKontrolGrubu } from "@/components/kontrol/SadeKontroller";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { bildirimRozetleriniYenile } from "@/lib/bildirimler/rozet";
import { CheckCircle2, CircleAlert, ClipboardCheck, ClipboardList, Clock3, History, XCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { EczanemBosDurum, EczanemEczaneBaslik, EczanemOzetKarti, EczanemPanel, EczanemSayfalama, EczanemYukleniyor } from "./EczanemEczaneArayuz";

interface Siparis {
  siparis_id: string;
  musteri_bas_harfleri: string | null;
  musteri_maskeli: string;
  urun_adi: string;
  adet: number;
  kullanilan_puan: number;
  indirim_tl: number;
  satis_fiyati: number | null;
  indirimli_fiyat: number | null;
  durum: string;
  islem_kodu: string | null;
  onay_tarihi: string | null;
  karar_tarihi: string | null;
  islem_yapan: string | null;
  sonuc_durumu: "bekliyor" | "onaylandi" | "onaylanmadi" | "iptal_edildi";
  created_at: string;
  gorunum_testi_mi?: boolean;
}

interface SiparisVerisi {
  bekleyen: Siparis[];
  gecmis: Siparis[];
  ozet: { bekleyen: number; bugun_onaylanan: number; gecmis: number };
  sayfalama: {
    bekleyen: { sayfa: number; toplam: number; toplam_sayfa: number };
    gecmis: { sayfa: number; toplam: number; toplam_sayfa: number };
  };
}

interface Props { hata: (mesaj: string, adim?: string) => void; basari: (mesaj: string) => void; gorunumTesti?: boolean; }
interface VeriHatasi { mesaj: string; adim?: string; detay?: string; }

const BOS_VERI: SiparisVerisi = { bekleyen: [], gecmis: [], ozet: { bekleyen: 0, bugun_onaylanan: 0, gecmis: 0 }, sayfalama: { bekleyen: { sayfa: 1, toplam: 0, toplam_sayfa: 1 }, gecmis: { sayfa: 1, toplam: 0, toplam_sayfa: 1 } } };

const tarihYaz = (deger: string | null) => deger ? new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(deger)) : "—";
const paraYaz = (deger: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(deger);

const ORNEK_SIPARIS_IDLERI = new Set(["ornek-indirim-001", "ornek-indirim-002", "ornek-indirim-003", "ornek-indirim-004", "ornek-indirim-005", "ornek-indirim-006"]);

function ornekSiparisleriOlustur(): Siparis[] {
  const simdi = new Date().toISOString();
  return [
    { siparis_id: "ornek-indirim-001", musteri_bas_harfleri: "A. Y.", musteri_maskeli: "••• ••• 0101", urun_adi: "Örnek Ürün A", adet: 2, kullanilan_puan: 200, indirim_tl: 40, satis_fiyati: 180, indirimli_fiyat: 140, durum: "bekliyor", islem_kodu: null, onay_tarihi: null, karar_tarihi: null, islem_yapan: null, sonuc_durumu: "bekliyor", created_at: simdi, gorunum_testi_mi: true },
    { siparis_id: "ornek-indirim-002", musteri_bas_harfleri: "B. D.", musteri_maskeli: "••• ••• 0202", urun_adi: "Örnek Ürün B", adet: 1, kullanilan_puan: 125, indirim_tl: 25, satis_fiyati: 95, indirimli_fiyat: 70, durum: "onaylandi", islem_kodu: "ORNEK-002", onay_tarihi: simdi, karar_tarihi: simdi, islem_yapan: "Örnek personel", sonuc_durumu: "onaylandi", created_at: simdi, gorunum_testi_mi: true },
    { siparis_id: "ornek-indirim-003", musteri_bas_harfleri: "C. K.", musteri_maskeli: "••• ••• 0303", urun_adi: "Örnek Ürün C", adet: 3, kullanilan_puan: 300, indirim_tl: 60, satis_fiyati: 240, indirimli_fiyat: 180, durum: "dustu", islem_kodu: null, onay_tarihi: null, karar_tarihi: simdi, islem_yapan: "Örnek personel", sonuc_durumu: "onaylanmadi", created_at: simdi, gorunum_testi_mi: true },
    { siparis_id: "ornek-indirim-004", musteri_bas_harfleri: "D. A.", musteri_maskeli: "••• ••• 0404", urun_adi: "Örnek Ürün D", adet: 1, kullanilan_puan: 80, indirim_tl: 16, satis_fiyati: 90, indirimli_fiyat: 74, durum: "bekliyor", islem_kodu: null, onay_tarihi: null, karar_tarihi: null, islem_yapan: null, sonuc_durumu: "bekliyor", created_at: simdi, gorunum_testi_mi: true },
    { siparis_id: "ornek-indirim-005", musteri_bas_harfleri: "E. T.", musteri_maskeli: "••• ••• 0505", urun_adi: "Örnek Ürün E", adet: 4, kullanilan_puan: 400, indirim_tl: 80, satis_fiyati: 320, indirimli_fiyat: 240, durum: "bekliyor", islem_kodu: null, onay_tarihi: null, karar_tarihi: null, islem_yapan: null, sonuc_durumu: "bekliyor", created_at: simdi, gorunum_testi_mi: true },
    { siparis_id: "ornek-indirim-006", musteri_bas_harfleri: "F. S.", musteri_maskeli: "••• ••• 0606", urun_adi: "Örnek Ürün F", adet: 2, kullanilan_puan: 175, indirim_tl: 35, satis_fiyati: 150, indirimli_fiyat: 115, durum: "bekliyor", islem_kodu: null, onay_tarihi: null, karar_tarihi: null, islem_yapan: null, sonuc_durumu: "bekliyor", created_at: simdi, gorunum_testi_mi: true },
  ];
}

export default function EczanemSiparisKuyrugu({ hata, basari, gorunumTesti = false }: Props) {
  const [veri, setVeri] = useState<SiparisVerisi>(BOS_VERI);
  const [ornekSiparisler, setOrnekSiparisler] = useState<Siparis[]>(() => gorunumTesti ? ornekSiparisleriOlustur() : []);
  const [sekme, setSekme] = useState<"bekleyen" | "gecmis">("bekleyen");
  const [bekleyenSayfa, setBekleyenSayfa] = useState(1);
  const [gecmisSayfa, setGecmisSayfa] = useState(1);
  const [durum, setDurum] = useState("tumu");
  const [ilkYukleme, setIlkYukleme] = useState(true);
  const [veriHazir, setVeriHazir] = useState(false);
  const [veriHatasi, setVeriHatasi] = useState<VeriHatasi | null>(null);
  const [yenileniyor, setYenileniyor] = useState(false);
  const [isliyor, setIsliyor] = useState(false);
  const [onayHedefi, setOnayHedefi] = useState<{ siparis: Siparis; aksiyon: "onayla" | "reddet" } | null>(null);
  const istekRef = useRef<AbortController | null>(null);
  const hataGosterildiRef = useRef(false);

  const cek = useCallback(async (elle = false, sessiz = false) => {
    istekRef.current?.abort();
    const controller = new AbortController();
    istekRef.current = controller;
    if (elle) setYenileniyor(true);
    const params = new URLSearchParams({ bekleyen_sayfa: String(bekleyenSayfa), gecmis_sayfa: String(gecmisSayfa), durum, limit: "20" });
    try {
      const res = await fetch(`/eczanem/eczane/api/siparisler?${params}`, { cache: "no-store", signal: controller.signal });
      const data = await res.json();
      if (!res.ok) {
        const yeniHata: VeriHatasi = {
          mesaj: data.hata ?? "Siparişler yüklenemedi.",
          adim: data.adim ?? "sipariş kuyruğu",
          detay: data.detay,
        };
        setVeriHatasi(yeniHata);
        if (elle || !sessiz || !hataGosterildiRef.current) hata(yeniHata.mesaj, yeniHata.adim);
        hataGosterildiRef.current = true;
        return;
      }
      setVeri(data);
      setVeriHazir(true);
      setVeriHatasi(null);
      hataGosterildiRef.current = false;
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        const yeniHata = { mesaj: "Siparişler yüklenemedi.", adim: "sipariş kuyruğu" };
        setVeriHatasi(yeniHata);
        if (elle || !sessiz || !hataGosterildiRef.current) hata(yeniHata.mesaj, yeniHata.adim);
        hataGosterildiRef.current = true;
      }
    } finally {
      if (istekRef.current === controller) { setIlkYukleme(false); setYenileniyor(false); }
    }
  }, [bekleyenSayfa, durum, gecmisSayfa, hata]);

  useEffect(() => { void cek(); return () => istekRef.current?.abort(); }, [cek]);
  useEffect(() => {
    const zamanlayici = window.setInterval(() => { if (document.visibilityState === "visible" && !isliyor) void cek(false, true); }, 30000);
    return () => window.clearInterval(zamanlayici);
  }, [cek, isliyor]);

  const islem = async () => {
    if (!onayHedefi) return;
    const { siparis, aksiyon } = onayHedefi;
    if (gorunumTesti && siparis.gorunum_testi_mi && ORNEK_SIPARIS_IDLERI.has(siparis.siparis_id)) {
      const simdi = new Date().toISOString();
      setOrnekSiparisler((mevcut) => mevcut.map((ornek) => ornek.siparis_id === siparis.siparis_id
        ? { ...ornek, durum: aksiyon === "onayla" ? "onaylandi" : "dustu", sonuc_durumu: aksiyon === "onayla" ? "onaylandi" : "onaylanmadi", islem_kodu: aksiyon === "onayla" ? `ORNEK-${ornek.siparis_id.slice(-3)}` : null, onay_tarihi: aksiyon === "onayla" ? simdi : null, karar_tarihi: simdi, islem_yapan: "Örnek personel" }
        : ornek));
      setOnayHedefi(null);
      basari("Örnek işlem ekranda sonuçlandırıldı; gerçek sipariş ve puan değişmedi.");
      return;
    }
    setIsliyor(true); setOnayHedefi(null);
    try {
      const res = await fetch("/eczanem/eczane/api/siparisler", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ siparis_id: siparis.siparis_id, aksiyon }) });
      const data = await res.json();
      if (!res.ok) { hata(data.hata ?? "Sipariş işlemi tamamlanamadı.", "sipariş"); return; }
      basari(aksiyon === "onayla" ? `Sipariş onaylandı — ${paraYaz(Number(data.indirim_tl))} indirim (${data.islem_kodu}).` : "İndirim talebi iptal edildi.");
      await cek(true);
      bildirimRozetleriniYenile();
    } catch { hata("Sipariş işlemi tamamlanamadı.", "sipariş"); }
    finally { setIsliyor(false); }
  };

  const ornekBekleyen = ornekSiparisler.filter((siparis) => siparis.durum === "bekliyor");
  const ornekGecmis = ornekSiparisler.filter((siparis) => siparis.durum !== "bekliyor" && (durum === "tumu" || siparis.durum === durum));
  const bekleyen = bekleyenSayfa === 1 ? [...veri.bekleyen, ...ornekBekleyen] : veri.bekleyen;
  const gecmis = gecmisSayfa === 1 ? [...ornekGecmis, ...veri.gecmis] : veri.gecmis;

  return (
    <>
      <EczanemEczaneBaslik
        ikon={ClipboardList}
        baslik="İndirim Onayı"
        ustBilgiGoster={false}
        rehberAnahtar="eczanem-eczane-siparisler"
        aciklama="Üyelerden gelen indirim taleplerini ve işlem geçmişini inceleyebilirsiniz"
      />

      <EczanemSayfaBanner alan="indirim-onayi" />

    {veriHazir && <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <EczanemOzetKarti ikon={Clock3} etiket="Onay bekleyen" deger={veri.ozet.bekleyen + ornekBekleyen.length} detay="En eski talep önce" renk="#b7791f" zemin="#fff7e8" />
      <EczanemOzetKarti ikon={ClipboardCheck} etiket="Bugün onaylanan" deger={veri.ozet.bugun_onaylanan + ornekSiparisler.filter((siparis) => siparis.durum === "onaylandi").length} detay="Kesinleşen işlem" renk="#16865f" zemin="#edf9f4" />
      <EczanemOzetKarti ikon={History} etiket="İşlem geçmişi" deger={veri.ozet.gecmis + ornekGecmis.length} detay="Seçili durum kapsamı" renk="#6550b9" zemin="#f2effc" />
    </section>}

    {gorunumTesti && veriHazir && <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-800"><span><strong>(F)</strong> ile işaretli altı kayıt yalnız ekran örneğidir; gerçek sipariş veya puan oluşturmaz.</span><Button type="button" size="sm" variant="outline" onClick={() => setOrnekSiparisler(ornekSiparisleriOlustur())} className="h-7 border-red-200 bg-white text-xs text-red-700 hover:bg-red-100">Örnekleri sıfırla</Button></div>}

    <EczanemPanel>
      {veriHatasi && veriHazir && <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f1d3d3] bg-[#fff7f7] px-4 py-3 text-[#a74646] md:px-5"><div className="flex min-w-0 items-start gap-2"><CircleAlert className="mt-0.5 size-4 shrink-0" /><div><p className="text-xs font-extrabold">Güncel sipariş verisi alınamadı; son başarılı kayıtlar gösteriliyor.</p><p className="mt-0.5 text-[10px] font-semibold opacity-80">{veriHatasi.mesaj}{veriHatasi.adim ? ` · ${veriHatasi.adim}` : ""}</p></div></div><Button type="button" size="sm" variant="outline" onClick={() => void cek(true)} disabled={yenileniyor || isliyor} className="h-8 border-[#e8bcbc] bg-white text-xs font-extrabold text-[#a74646] hover:bg-[#fff1f1] hover:text-[#913737]">Tekrar dene</Button></div>}
        {veriHazir && <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e7edf4] bg-[#fbfcfe] p-2">
        <SadeKontrolGrubu tur="sekme"><SadeKontrolButonu type="button" onClick={() => setSekme("bekleyen")} aria-pressed={sekme === "bekleyen"}><Clock3 /> Onay Bekleyenler <Badge className="ml-1 bg-white/20 text-white">{veri.ozet.bekleyen + ornekBekleyen.length}</Badge></SadeKontrolButonu><SadeKontrolButonu type="button" onClick={() => setSekme("gecmis")} aria-pressed={sekme === "gecmis"}><History /> Sipariş Geçmişleri</SadeKontrolButonu></SadeKontrolGrubu>
      </div>}

      {ilkYukleme ? <EczanemYukleniyor metin="Siparişler yükleniyor…" /> : !veriHazir && veriHatasi ? <div className="px-5 py-12 text-center"><span className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-[#fff0f0] text-[#b84444]"><CircleAlert className="size-5" /></span><h3 className="mt-3 text-sm font-extrabold text-[#8f3636]">Sipariş kuyruğu görüntülenemedi</h3><p className="mx-auto mt-1 max-w-lg text-xs font-semibold leading-5 text-[#9a6969]">{veriHatasi.mesaj}</p>{veriHatasi.adim && <p className="mt-1 text-[10px] font-bold text-[#ad7b7b]">Adım: {veriHatasi.adim}</p>}<Button type="button" size="sm" onClick={() => void cek(true)} disabled={yenileniyor} className="mt-4 bg-[#237ac8] text-xs font-extrabold hover:bg-[#1d69ad]">Tekrar dene</Button></div> : sekme === "bekleyen" ? <>
        {bekleyen.length === 0 ? (
          <EczanemBosDurum ikon={CheckCircle2} baslik="Onay bekleyen sipariş yok" aciklama="Yeni bir kasa talebi geldiğinde otomatik olarak bu listede görünecek." />
        ) : (
          <Table className="tabular-nums [&_th]:px-4 [&_th]:py-3 [&_th]:text-[10px] [&_th]:font-extrabold [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-[#8090a4]">
              <TableHeader className="bg-[#f6f9fc] text-[10px] font-extrabold uppercase tracking-wide text-[#8090a4]">
                <TableRow>
                  <TableHead scope="col" className="px-4 py-3">Ürün adı</TableHead>
                  <TableHead scope="col" className="px-4 py-3 text-center">Satış fiyatı</TableHead>
                  <TableHead scope="col" className="px-4 py-3 text-center">ÜYE</TableHead>
                  <TableHead scope="col" className="px-4 py-3 text-center">Satış tarihi</TableHead>
                  <TableHead scope="col" className="px-4 py-3 text-center">Satılan kutu<br />adedi</TableHead>
                  <TableHead scope="col" className="px-4 py-3 text-center">Toplam tutar</TableHead>
                  <TableHead scope="col" className="px-4 py-3 text-center">Kullanılan puan</TableHead>
                  <TableHead scope="col" className="px-4 py-3 text-center">İndirim tutarı</TableHead>
                  <TableHead scope="col" className="px-4 py-3 text-center">İndirimli satış<br />fiyatı</TableHead>
                  <TableHead scope="col" className="px-4 py-3 text-center">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-[#e7edf4]">
                {bekleyen.map((siparis) => {
                  const toplamTutar = siparis.satis_fiyati == null ? null : Math.round(siparis.adet * siparis.satis_fiyati * 100) / 100;
                  const indirimliSatisFiyati = toplamTutar == null ? null : Math.max(0, Math.round((toplamTutar - siparis.indirim_tl) * 100) / 100);
                  return (
                    <TableRow key={siparis.siparis_id} className="text-xs text-[#405976]">
                      <TableCell className="px-4 py-4 align-middle whitespace-normal"><strong className="break-words text-sm text-[#263e5b]">{siparis.urun_adi}{siparis.gorunum_testi_mi && <span className="ml-1 font-black text-red-600">(F)</span>}</strong></TableCell>
                      <TableCell className="px-4 py-4 align-middle font-bold text-center">{siparis.satis_fiyati == null ? "—" : paraYaz(siparis.satis_fiyati)}</TableCell>
                      <TableCell className="px-4 py-4 align-middle text-center"><strong className="block text-[#263e5b]">{siparis.musteri_bas_harfleri ?? "Müşteri"}</strong><span className="mt-1 block whitespace-nowrap text-[11px] text-[#71859d]">{siparis.musteri_maskeli}</span></TableCell>
                      <TableCell className="px-4 py-4 align-middle font-semibold text-[#71859d] text-center">{tarihYaz(siparis.created_at)}</TableCell>
                      <TableCell className="px-4 py-4 align-middle font-bold text-center">{siparis.adet}</TableCell>
                      <TableCell className="px-4 py-4 align-middle font-bold text-center">{toplamTutar == null ? "—" : paraYaz(toplamTutar)}</TableCell>
                      <TableCell className="px-4 py-4 align-middle font-bold text-center">{siparis.kullanilan_puan.toLocaleString("tr-TR")}</TableCell>
                      <TableCell className="px-4 py-4 align-middle font-bold text-[#16865f] text-center">{paraYaz(siparis.indirim_tl)}</TableCell>
                      <TableCell className="px-4 py-4 align-middle font-extrabold text-[#263e5b] text-center">{indirimliSatisFiyati == null ? "—" : paraYaz(indirimliSatisFiyati)}</TableCell>
                      <TableCell className="px-4 py-4 align-middle"><div className="flex justify-center gap-2"><Button type="button" size="sm" disabled={isliyor} onClick={() => setOnayHedefi({ siparis, aksiyon: "onayla" })} className="bg-[#16865f] px-2.5 text-xs font-extrabold hover:bg-[#116d4d]">Onay</Button><Button type="button" size="sm" variant="outline" disabled={isliyor} onClick={() => setOnayHedefi({ siparis, aksiyon: "reddet" })} className="border-[#efd1d1] px-2.5 text-xs font-extrabold text-[#b84444] hover:bg-[#fff5f5] hover:text-[#a33434]">İptal</Button></div></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
          </Table>
        )}
        <EczanemSayfalama sayfa={veri.sayfalama.bekleyen.sayfa} toplamSayfa={veri.sayfalama.bekleyen.toplam_sayfa} onDegistir={setBekleyenSayfa} disabled={yenileniyor || isliyor} />
      </> : <>
          <Table className="tabular-nums [&_th]:px-4 [&_th]:py-3 [&_th]:text-[10px] [&_th]:font-extrabold [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-[#8090a4]">
              <TableHeader className="bg-[#f6f9fc] text-[10px] font-extrabold uppercase tracking-wide text-[#8090a4]">
                <TableRow>
                  <TableHead scope="col" className="px-4 py-3">Ürün adı</TableHead>
                  <TableHead scope="col" className="px-4 py-3 text-center">Satış fiyatı</TableHead>
                  <TableHead scope="col" className="px-4 py-3 text-center">ÜYE</TableHead>
                  <TableHead scope="col" className="px-4 py-3 text-center">Satış tarihi</TableHead>
                  <TableHead scope="col" className="px-4 py-3 text-center">Satılan kutu<br />adedi</TableHead>
                  <TableHead scope="col" className="px-4 py-3 text-center">Toplam tutar</TableHead>
                  <TableHead scope="col" className="px-4 py-3 text-center">Kullanılan puan</TableHead>
                  <TableHead scope="col" className="px-4 py-3 text-center">İndirim tutarı</TableHead>
                  <TableHead scope="col" className="px-4 py-3 text-center">İndirimli satış<br />fiyatı</TableHead>
                  <TableHead scope="col" className="px-4 py-3 text-center">Onay veren</TableHead>
                  <TableHead scope="col" className="px-4 py-3 text-center">
                    <Select value={durum} onValueChange={(deger) => { setDurum(deger); setGecmisSayfa(1); }}>
                      <SelectTrigger aria-label="Sonuç filtresi" className="mx-auto h-auto w-auto gap-1 border-0 bg-transparent p-0 text-[10px] font-extrabold uppercase tracking-wide text-[#8090a4] shadow-none">Sonuç</SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tumu">Tümü</SelectItem>
                        <SelectItem value="onaylandi">Onay</SelectItem>
                        <SelectItem value="dustu">İptal</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-[#e7edf4]">
                {gecmis.length === 0 && <TableRow><TableCell colSpan={11} className="p-0"><EczanemBosDurum ikon={History} baslik="İşlem geçmişi bulunamadı" aciklama="Seçtiğiniz duruma ait sonuç bulunmuyor." /></TableCell></TableRow>}
                {gecmis.map((siparis) => {
                  const toplamTutar = siparis.satis_fiyati == null ? null : Math.round(siparis.adet * siparis.satis_fiyati * 100) / 100;
                  const indirimliSatisFiyati = toplamTutar == null ? null : Math.max(0, Math.round((toplamTutar - siparis.indirim_tl) * 100) / 100);
                  return (
                    <TableRow key={siparis.siparis_id} className="text-xs text-[#405976]">
                      <TableCell className="px-4 py-4 align-middle whitespace-normal"><strong className="break-words text-sm text-[#263e5b]">{siparis.urun_adi}{siparis.gorunum_testi_mi && <span className="ml-1 font-black text-red-600">(F)</span>}</strong></TableCell>
                      <TableCell className="px-4 py-4 align-middle font-bold text-center">{siparis.satis_fiyati == null ? "—" : paraYaz(siparis.satis_fiyati)}</TableCell>
                      <TableCell className="px-4 py-4 align-middle text-center"><strong className="block text-[#263e5b]">{siparis.musteri_bas_harfleri ?? "Müşteri"}</strong><span className="mt-1 block whitespace-nowrap text-[11px] text-[#71859d]">{siparis.musteri_maskeli}</span></TableCell>
                      <TableCell className="px-4 py-4 align-middle font-semibold text-[#71859d] text-center">{tarihYaz(siparis.created_at)}</TableCell>
                      <TableCell className="px-4 py-4 align-middle font-bold text-center">{siparis.adet}</TableCell>
                      <TableCell className="px-4 py-4 align-middle font-bold text-center">{toplamTutar == null ? "—" : paraYaz(toplamTutar)}</TableCell>
                      <TableCell className="px-4 py-4 align-middle font-bold text-center">{siparis.kullanilan_puan.toLocaleString("tr-TR")}</TableCell>
                      <TableCell className="px-4 py-4 align-middle font-bold text-[#16865f] text-center">{paraYaz(siparis.indirim_tl)}</TableCell>
                      <TableCell className="px-4 py-4 align-middle font-extrabold text-[#263e5b] text-center">{indirimliSatisFiyati == null ? "—" : paraYaz(indirimliSatisFiyati)}</TableCell>
                      <TableCell className="px-4 py-4 align-middle text-center font-semibold">{siparis.islem_yapan ?? (siparis.sonuc_durumu === "iptal_edildi" ? "Müşteri" : "—")}</TableCell>
                      <TableCell className="px-4 py-4 align-middle text-center">
                        {siparis.sonuc_durumu === "onaylandi"
                          ? <Badge className="border border-[#bde5d5] bg-[#edf9f4] font-bold text-[#157254]"><CheckCircle2 /> Onay</Badge>
                          : <Badge variant="outline" className="border-[#efd1d1] bg-[#fff5f5] font-bold text-[#a74646]"><XCircle /> İptal</Badge>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
          </Table>
        <EczanemSayfalama sayfa={veri.sayfalama.gecmis.sayfa} toplamSayfa={veri.sayfalama.gecmis.toplam_sayfa} onDegistir={setGecmisSayfa} disabled={yenileniyor || isliyor} />
      </>}
    </EczanemPanel>

    <AlertDialog open={!!onayHedefi} onOpenChange={(acik) => { if (!acik && !isliyor) setOnayHedefi(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{onayHedefi?.aksiyon === "onayla" ? "Siparişi onaylamak istediğinize emin misiniz?" : "İndirim talebini iptal etmek istediğinize emin misiniz?"}</AlertDialogTitle><AlertDialogDescription>{onayHedefi?.siparis.urun_adi ?? "Sipariş"} için {onayHedefi?.siparis.adet ?? 0} kutu ve {paraYaz(onayHedefi?.siparis.indirim_tl ?? 0)} indirim talebi. {onayHedefi?.siparis.gorunum_testi_mi ? "Bu yalnız ekran örneğidir; gerçek sipariş ve puan değişmez." : onayHedefi?.aksiyon === "onayla" ? "Onayla birlikte müşterinin kullanılabilir puanı atomik olarak düşer ve fiş kesinleşir." : "Talep iptal edilir; müşterinin puanı değişmeden kalır."}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Vazgeç</AlertDialogCancel><AlertDialogAction onClick={(event) => { event.preventDefault(); void islem(); }} className={onayHedefi?.aksiyon === "onayla" ? "bg-[#16865f] hover:bg-[#116d4d]" : "bg-[#b84444] hover:bg-[#9f3636]"}>{onayHedefi?.aksiyon === "onayla" ? <CheckCircle2 /> : <XCircle />} {onayHedefi?.aksiyon === "onayla" ? "Siparişi onayla" : "Talebi iptal et"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </>
  );
}
