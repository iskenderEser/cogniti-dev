"use client";

import EczanemSayfaBanner from "@/components/eczanem/EczanemSayfaBanner";
import { HataMesajiContainer, useHataMesaji } from "@/components/HataMesaji";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { YenileButonu } from "@/components/ui/yenile-butonu";
import { SUREC11_TOAST } from "@/lib/bildirimler/toastMesajlari";
import { CheckCircle2, Clock, Info, Link2, Mail, Pencil, Phone, Plus, Search, Send, ShieldCheck, Trash2, UserCheck, UserPlus, Users, UserX, X } from "lucide-react";
import { useCallback, useDeferredValue, useEffect, useRef, useState } from "react";
import { EczanemBosDurum, EczanemEczaneBaslik, EczanemEczaneSayfa, EczanemOzetKarti, EczanemPanel, EczanemSayfalama, EczanemYukleniyor } from "../_components/EczanemEczaneArayuz";

interface MusteriSatiri {
  musteri_id: string;
  ad: string;
  soyad: string;
  ad_soyad: string;
  telefon: string;
  eposta: string | null;
  aktif_mi: boolean;
  davet_bekliyor: boolean;
  davet_gonderildi: boolean;
  baglama_onayi_bekliyor?: boolean;
  created_at: string;
}

interface MusteriVerisi {
  musteriler: MusteriSatiri[];
  ozet: { toplam: number; aktif: number; davet_bekliyor: number; pasif: number; bu_ay_eklenen: number };
  sayfalama: { sayfa: number; limit: number; toplam: number; toplam_sayfa: number };
}

type Gorunum = "liste" | "bagla" | "yeni";
type BaglaSonucu = "kayitli" | "yeni" | "zaten_bagli" | "onay_bekliyor" | null;

const BOS_VERI: MusteriVerisi = {
  musteriler: [],
  ozet: { toplam: 0, aktif: 0, davet_bekliyor: 0, pasif: 0, bu_ay_eklenen: 0 },
  sayfalama: { sayfa: 1, limit: 20, toplam: 0, toplam_sayfa: 1 },
};

function adYaz(ad: string): string {
  return ad.split(/\s+/).filter(Boolean).map((kelime) =>
    kelime.charAt(0).toLocaleUpperCase("tr-TR") + kelime.slice(1).toLocaleLowerCase("tr-TR")
  ).join(" ");
}

function tarihYaz(tarih: string): string {
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(tarih));
}

export default function EczanemDanisanlarimPage() {
  const { mesajlar, hata, basari } = useHataMesaji();
  const [veri, setVeri] = useState<MusteriVerisi>(BOS_VERI);
  const [gorunum, setGorunum] = useState<Gorunum>("liste");
  const [arama, setArama] = useState("");
  const aramaGecikmeli = useDeferredValue(arama);
  const [durum, setDurum] = useState("tumu");
  const [sayfa, setSayfa] = useState(1);
  const [ilkYukleme, setIlkYukleme] = useState(true);
  const [yenileniyor, setYenileniyor] = useState(false);
  const [islenenMusteri, setIslenenMusteri] = useState<string | null>(null);
  const [silHedefi, setSilHedefi] = useState<MusteriSatiri | null>(null);
  const [davetIptalHedefi, setDavetIptalHedefi] = useState<MusteriSatiri | null>(null);
  const [davetDuzenleHedefi, setDavetDuzenleHedefi] = useState<MusteriSatiri | null>(null);
  const [dAd, setDAd] = useState("");
  const [dSoyad, setDSoyad] = useState("");
  const [dEposta, setDEposta] = useState("");
  const istekRef = useRef<AbortController | null>(null);

  const [baglaTel, setBaglaTel] = useState("");
  const [baglaSonucu, setBaglaSonucu] = useState<BaglaSonucu>(null);
  const [sorgulaniyor, setSorgulaniyor] = useState(false);
  const [baglaniyor, setBaglaniyor] = useState(false);
  const [baglaBilgisiAcik, setBaglaBilgisiAcik] = useState(true);
  const [kAd, setKAd] = useState("");
  const [kSoyad, setKSoyad] = useState("");
  const [kTel, setKTel] = useState("");
  const [kEposta, setKEposta] = useState("");
  const [kGonderiliyor, setKGonderiliyor] = useState(false);

  const musterileriCek = useCallback(async (elle = false) => {
    istekRef.current?.abort();
    const controller = new AbortController();
    istekRef.current = controller;
    if (elle) setYenileniyor(true);
    const params = new URLSearchParams({ sayfa: String(sayfa), limit: "20", durum });
    if (aramaGecikmeli.trim()) params.set("q", aramaGecikmeli.trim());
    try {
      const res = await fetch(`/eczanem/eczane/api/musteriler?${params}`, { cache: "no-store", signal: controller.signal });
      const data = await res.json();
      if (!res.ok) { hata(data.hata ?? "Üyeler yüklenemedi.", "üye listesi"); return; }
      setVeri(data);
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) hata("Üyeler yüklenemedi.", "üye listesi");
    } finally {
      if (istekRef.current === controller) { setIlkYukleme(false); setYenileniyor(false); }
    }
  }, [aramaGecikmeli, durum, hata, sayfa]);

  useEffect(() => {
    void musterileriCek();
    return () => istekRef.current?.abort();
  }, [musterileriCek]);

  const kayitliMusteriyiSorgula = async () => {
    setSorgulaniyor(true); setBaglaSonucu(null);
    try {
      const res = await fetch("/eczanem/eczane/api/musteri-ekle", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ islem: "sorgula", telefon: baglaTel }) });
      const data = await res.json();
      if (!res.ok) { hata(data.hata ?? "Üye sorgulanamadı.", "üye sorgulama"); return; }
      setBaglaSonucu(data.durum as BaglaSonucu);
    } catch { hata("Üye sorgulanamadı.", "üye sorgulama"); }
    finally { setSorgulaniyor(false); }
  };

  const kayitliMusteriyiBagla = async () => {
    setBaglaniyor(true);
    try {
      const res = await fetch("/eczanem/eczane/api/musteri-ekle", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ islem: "bagla", telefon: baglaTel }) });
      const data = await res.json();
      if (!res.ok) { hata(data.hata ?? "Bağlantı onay talebi gönderilemedi.", "kayıtlı üye bağı"); return; }
      basari(data.mesaj ?? SUREC11_TOAST.baglamaTalebiGonderildi);
      setBaglaTel(""); setBaglaSonucu(null); setGorunum("liste"); setSayfa(1);
      await musterileriCek(true);
    } catch { hata("Bağlantı onay talebi gönderilemedi.", "kayıtlı üye bağı"); }
    finally { setBaglaniyor(false); }
  };

  const musteriKaydet = async (event: React.FormEvent) => {
    event.preventDefault(); setKGonderiliyor(true);
    try {
      const res = await fetch("/eczanem/eczane/api/musteri-ekle", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ad: kAd.trim(), soyad: kSoyad.trim(), ad_soyad: `${kAd.trim()} ${kSoyad.trim()}`.trim(), telefon: kTel, eposta: kEposta }) });
      const data = await res.json();
      if (!res.ok) { hata(data.hata ?? "Üye kaydedilemedi.", "üye kaydı"); return; }
      if (data.gonderildi === false) {
        hata(data.mesaj ?? SUREC11_TOAST.uyeDavetiGonderilemedi, "davet gönderimi");
      } else {
        basari(data.mesaj ?? SUREC11_TOAST.uyeDavetiGonderildi);
      }
      setKAd(""); setKSoyad(""); setKTel(""); setKEposta(""); setGorunum("liste"); setSayfa(1);
      await musterileriCek(true);
    } catch { hata("Üye kaydedilemedi.", "üye kaydı"); }
    finally { setKGonderiliyor(false); }
  };

  const durumDegistir = async (musteri: MusteriSatiri) => {
    setIslenenMusteri(musteri.musteri_id);
    try {
      const res = await fetch("/eczanem/eczane/api/musteriler", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ musteri_id: musteri.musteri_id, aktif_mi: !musteri.aktif_mi }) });
      const data = await res.json();
      if (!res.ok) { hata(data.hata ?? "Durum güncellenemedi.", "üye durumu"); return; }
      basari(data.mesaj ?? SUREC11_TOAST.uyeDurumGuncellendi); await musterileriCek(true);
    } catch { hata("Durum güncellenemedi.", "üye durumu"); }
    finally { setIslenenMusteri(null); }
  };

  const musteriSil = async () => {
    if (!silHedefi) return;
    setIslenenMusteri(silHedefi.musteri_id);
    try {
      const res = await fetch("/eczanem/eczane/api/musteriler", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ musteri_id: silHedefi.musteri_id }) });
      const data = await res.json();
      if (!res.ok) { hata(data.hata ?? "Üye silinemedi.", "üye silme"); return; }
      basari(SUREC11_TOAST.uyeListedenSilindi); setSilHedefi(null);
      if (veri.musteriler.length === 1 && sayfa > 1) setSayfa((onceki) => onceki - 1); else await musterileriCek(true);
    } catch { hata("Üye silinemedi.", "üye silme"); }
    finally { setIslenenMusteri(null); }
  };

  const davetiYenidenGonder = async (musteri: MusteriSatiri) => {
    setIslenenMusteri(musteri.musteri_id);
    try {
      const res = await fetch("/eczanem/eczane/api/davet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ musteri_id: musteri.musteri_id }) });
      const data = await res.json();
      if (!res.ok || data.gonderildi === false) {
        hata(data.hata ?? data.mesaj ?? "Davet yeniden gönderilemedi.", "davet gönderimi");
        return;
      }
      basari(data.mesaj ?? SUREC11_TOAST.davetYenidenGonderildi);
      await musterileriCek(true);
    } catch { hata("Davet yeniden gönderilemedi.", "davet gönderimi"); }
    finally { setIslenenMusteri(null); }
  };

  const davetDuzenleAc = (musteri: MusteriSatiri) => {
    setDavetDuzenleHedefi(musteri);
    setDAd(musteri.ad || musteri.ad_soyad.split(/\s+/)[0] || "");
    setDSoyad(musteri.soyad || musteri.ad_soyad.split(/\s+/).slice(1).join(" ") || "");
    setDEposta("");
  };

  const davetiGuncelle = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!davetDuzenleHedefi) return;
    setIslenenMusteri(davetDuzenleHedefi.musteri_id);
    try {
      const res = await fetch("/eczanem/eczane/api/davet", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          musteri_id: davetDuzenleHedefi.musteri_id,
          ad: dAd.trim(),
          soyad: dSoyad.trim(),
          ...(dEposta.trim() ? { eposta: dEposta.trim() } : {}),
          yeniden_gonder: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) { hata(data.hata ?? "Davet bilgileri güncellenemedi.", "davet güncelleme"); return; }
      if (data.gonderildi === false) {
        hata(data.mesaj ?? "Bilgiler güncellendi ancak davet gönderilemedi.", "davet gönderimi");
      } else {
        basari(data.mesaj ?? SUREC11_TOAST.davetGuncellendi);
      }
      setDavetDuzenleHedefi(null);
      await musterileriCek(true);
    } catch { hata("Davet bilgileri güncellenemedi.", "davet güncelleme"); }
    finally { setIslenenMusteri(null); }
  };

  const davetiIptalEt = async () => {
    if (!davetIptalHedefi) return;
    setIslenenMusteri(davetIptalHedefi.musteri_id);
    try {
      const res = await fetch("/eczanem/eczane/api/davet", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ musteri_id: davetIptalHedefi.musteri_id }) });
      const data = await res.json();
      if (!res.ok) { hata(data.hata ?? "Bekleyen davet iptal edilemedi.", "davet iptali"); return; }
      basari(data.mesaj ?? SUREC11_TOAST.davetIptalEdildi);
      setDavetIptalHedefi(null);
      if (veri.musteriler.length === 1 && sayfa > 1) setSayfa((onceki) => onceki - 1); else await musterileriCek(true);
    } catch { hata("Bekleyen davet iptal edilemedi.", "davet iptali"); }
    finally { setIslenenMusteri(null); }
  };

  const sekmeler: Array<{ key: Gorunum; etiket: string; ikon: typeof Users }> = [
    { key: "liste", etiket: "Üye listesi", ikon: Users },
    { key: "bagla", etiket: "Kayıtlı üyeyi seç", ikon: Link2 },
    { key: "yeni", etiket: "Yeni üye kaydı", ikon: Plus },
  ];

  return (
    <EczanemEczaneSayfa>
      <HataMesajiContainer mesajlar={mesajlar} />
      <EczanemEczaneBaslik
        ikon={Users}
        baslik="Üyeler"
        rehberAnahtar="eczanem-eczane-musterilerim"
        ustBilgiGoster={false}
        aciklama="Danışanları üye yapabilir, üyeliklerini yönetebilirsiniz."
        aksiyon={<YenileButonu yenileniyor={yenileniyor} onYenile={() => musterileriCek(true)} disabled={baglaniyor || kGonderiliyor || !!islenenMusteri} />}
      />

      <EczanemSayfaBanner alan="uyeler" />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <EczanemOzetKarti ikon={Users} etiket="Toplam Üyeler" deger={veri.ozet.toplam} detay="Tüm üye sayısı" />
        <EczanemOzetKarti ikon={UserCheck} etiket="Aktif Üye" deger={veri.ozet.aktif} detay="Yayın izleyebilenler" renk="var(--tema-yerel-eczanem-islevsel-metin-02)" zemin="var(--tema-yerel-eczanem-islevsel-zemin-06)" />
        <EczanemOzetKarti ikon={Clock} etiket="Davet Bekliyor" deger={veri.ozet.davet_bekliyor} detay="Şifre oluşturması beklenenler" renk="var(--tema-yerel-eczanem-islevsel-metin-05)" zemin="var(--tema-yerel-eczanem-islevsel-zemin-07)" />
        <EczanemOzetKarti ikon={UserX} etiket="Pasife Alınan Üye" deger={veri.ozet.pasif} detay="Yayın alamayanlar" renk="var(--tema-yerel-eczanem-islevsel-metin-03)" zemin="var(--tema-yerel-eczanem-islevsel-zemin-05)" />
        <EczanemOzetKarti ikon={UserPlus} etiket="Yeni Üye" deger={veri.ozet.bu_ay_eklenen} detay="Ay içinde üye olanlar" renk="var(--tema-yerel-eczanem-eylem-metin-01)" zemin="var(--tema-yerel-eczanem-secim-zemin-01)" />
      </section>

      <EczanemPanel>
        <div className="flex gap-1 overflow-x-auto border-b border-[var(--tema-yerel-eczanem-cizgi-07)] bg-[var(--tema-yerel-eczanem-sayfa-zemini-07)] p-2">
          {sekmeler.map(({ key, etiket, ikon: Icon }) => <Button key={key} type="button" variant={gorunum === key ? "default" : "ghost"} onClick={() => setGorunum(key)} className={gorunum === key ? "bg-[var(--tema-yerel-eczanem-eylem-zemin-01)] text-xs font-extrabold hover:bg-[var(--tema-yerel-eczanem-eylem-zemin-02)]" : "text-xs font-extrabold text-[var(--tema-yerel-eczanem-yardimci-metin-26)]"}><Icon /> {etiket}</Button>)}
        </div>

        {gorunum === "liste" && <>
          <div className="flex flex-col gap-3 border-b border-[var(--tema-yerel-eczanem-cizgi-07)] p-4 md:flex-row md:items-center md:justify-between md:px-5">
            <div className="relative w-full md:max-w-md"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--tema-yerel-eczanem-yardimci-metin-14)]" /><Input value={arama} onChange={(e) => { setArama(e.target.value); setSayfa(1); }} placeholder="Ad, telefon veya e-posta ara" className="border-[var(--tema-yerel-eczanem-cizgi-10)] bg-[var(--tema-yerel-eczanem-kart-01)] pl-9" /></div>
            <Select value={durum} onValueChange={(deger) => { setDurum(deger); setSayfa(1); }}><SelectTrigger className="w-full md:w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="tumu">Tüm durumlar</SelectItem><SelectItem value="aktif">Aktif</SelectItem><SelectItem value="davet_bekliyor">Davet bekliyor</SelectItem><SelectItem value="pasif">Pasif</SelectItem></SelectContent></Select>
          </div>

          {ilkYukleme ? <EczanemYukleniyor metin="Üyeler yükleniyor…" /> : veri.musteriler.length === 0 ? <EczanemBosDurum ikon={Users} baslik={arama || durum !== "tumu" ? "Aramanızla eşleşen üye yok" : "Henüz üyeniz yok"} aciklama={arama || durum !== "tumu" ? "Arama veya durum filtresini değiştirin." : "Kayıtlı bir üyeyi bağlayabilir veya yeni üye kaydı oluşturabilirsiniz."} /> : <>
            <div className="hidden md:block"><Table><TableHeader className="bg-[var(--tema-yerel-eczanem-sayfa-zemini-08)]"><TableRow className="hover:bg-[var(--tema-yerel-eczanem-sayfa-zemini-08)]"><TableHead className="px-5 text-[10px] font-extrabold uppercase tracking-wide text-[var(--tema-yerel-eczanem-yardimci-metin-05)]">Üye</TableHead><TableHead className="text-[10px] font-extrabold uppercase tracking-wide text-[var(--tema-yerel-eczanem-yardimci-metin-05)]">İletişim</TableHead><TableHead className="text-[10px] font-extrabold uppercase tracking-wide text-[var(--tema-yerel-eczanem-yardimci-metin-05)]">Durum</TableHead><TableHead className="text-[10px] font-extrabold uppercase tracking-wide text-[var(--tema-yerel-eczanem-yardimci-metin-05)]">Kayıt</TableHead><TableHead className="px-5 text-right text-[10px] font-extrabold uppercase tracking-wide text-[var(--tema-yerel-eczanem-yardimci-metin-05)]">İşlem</TableHead></TableRow></TableHeader><TableBody>
              {veri.musteriler.map((musteri) => <TableRow key={musteri.musteri_id} className="border-[var(--tema-yerel-eczanem-cizgi-21)] hover:bg-[var(--tema-yerel-eczanem-sayfa-zemini-10)]"><TableCell className="px-5 py-4"><strong className="text-sm text-[var(--tema-yerel-eczanem-ana-metin-14)]">{adYaz(musteri.ad_soyad)}</strong></TableCell><TableCell className="py-4"><span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--tema-yerel-eczanem-yardimci-metin-26)]"><Phone className="size-3.5" /> {musteri.telefon}</span>{musteri.eposta && <span className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-[var(--tema-yerel-eczanem-yardimci-metin-10)]"><Mail className="size-3.5" /> {musteri.eposta}</span>}</TableCell><TableCell>{musteri.davet_bekliyor ? <div className="flex flex-col items-start gap-1"><Badge variant="outline" className="border-[var(--tema-yerel-eczanem-islevsel-cizgi-11)] bg-[var(--tema-yerel-eczanem-islevsel-zemin-07)] font-bold text-[var(--tema-yerel-eczanem-islevsel-metin-05)]">Davet Bekliyor</Badge>{!musteri.davet_gonderildi && <span className="text-[10px] font-semibold text-[var(--tema-yerel-eczanem-islevsel-metin-10)]">E-posta gönderilemedi</span>}</div> : <div className="flex flex-col items-start gap-1"><Badge variant="outline" className={musteri.aktif_mi ? "border-[var(--tema-yerel-eczanem-islevsel-cizgi-06)] bg-[var(--tema-yerel-eczanem-islevsel-zemin-06)] font-bold text-[var(--tema-yerel-eczanem-islevsel-metin-16)]" : "border-[var(--tema-yerel-eczanem-islevsel-cizgi-10)] bg-[var(--tema-yerel-eczanem-islevsel-zemin-21)] font-bold text-[var(--tema-yerel-eczanem-islevsel-metin-24)]"}>{musteri.aktif_mi ? "Aktif" : "Pasif"}</Badge>{!musteri.aktif_mi && musteri.baglama_onayi_bekliyor && <span className="text-[10px] font-semibold text-[var(--tema-yerel-eczanem-eylem-metin-01)]">Üye onayı bekleniyor</span>}</div>}</TableCell><TableCell className="text-xs font-semibold text-[var(--tema-yerel-eczanem-yardimci-metin-12)]">{tarihYaz(musteri.created_at)}</TableCell><TableCell className="px-5 text-right">{musteri.davet_bekliyor ? <div className="flex justify-end gap-1.5"><Button type="button" size="sm" variant="outline" disabled={islenenMusteri === musteri.musteri_id} onClick={() => davetiYenidenGonder(musteri)} className="h-8 border-[var(--tema-yerel-eczanem-cizgi-10)] text-xs font-bold"><Send className="size-3.5" /> Daveti gönder</Button><Button type="button" size="icon" variant="outline" disabled={islenenMusteri === musteri.musteri_id} onClick={() => davetDuzenleAc(musteri)} className="size-8 border-[var(--tema-yerel-eczanem-cizgi-10)]" aria-label={`${musteri.ad_soyad} davet bilgilerini düzenle`}><Pencil className="size-3.5" /></Button><Button type="button" size="icon" variant="outline" disabled={islenenMusteri === musteri.musteri_id} onClick={() => setDavetIptalHedefi(musteri)} className="size-8 border-[var(--tema-yerel-eczanem-islevsel-cizgi-05)] text-[var(--tema-yerel-eczanem-islevsel-metin-10)] hover:bg-[var(--tema-yerel-eczanem-islevsel-zemin-15)] hover:text-[var(--tema-yerel-eczanem-islevsel-metin-15)]" aria-label={`${musteri.ad_soyad} davetini iptal et`}><Trash2 /></Button></div> : <div className="flex justify-end gap-2"><Button type="button" size="sm" variant="outline" disabled={islenenMusteri === musteri.musteri_id || (!musteri.aktif_mi && !!musteri.baglama_onayi_bekliyor)} onClick={() => durumDegistir(musteri)} className="h-8 border-[var(--tema-yerel-eczanem-cizgi-10)] text-xs font-bold">{musteri.aktif_mi ? "Pasife al" : musteri.baglama_onayi_bekliyor ? "Onay bekleniyor" : "Aktifleştirme iste"}</Button><Button type="button" size="icon" variant="outline" disabled={islenenMusteri === musteri.musteri_id} onClick={() => setSilHedefi(musteri)} className="size-8 border-[var(--tema-yerel-eczanem-islevsel-cizgi-05)] text-[var(--tema-yerel-eczanem-islevsel-metin-10)] hover:bg-[var(--tema-yerel-eczanem-islevsel-zemin-15)] hover:text-[var(--tema-yerel-eczanem-islevsel-metin-15)]" aria-label={`${musteri.ad_soyad} üyesini listeden sil`}><Trash2 /></Button></div>}</TableCell></TableRow>)}
            </TableBody></Table></div>
            <div className="divide-y divide-[var(--tema-yerel-eczanem-cizgi-21)] md:hidden">{veri.musteriler.map((musteri) => <article key={musteri.musteri_id} className="p-4"><div className="flex items-start justify-between gap-3"><div><strong className="text-sm text-[var(--tema-yerel-eczanem-ana-metin-14)]">{adYaz(musteri.ad_soyad)}</strong><p className="mt-1 text-xs font-semibold text-[var(--tema-yerel-eczanem-yardimci-metin-12)]">{musteri.telefon} · {tarihYaz(musteri.created_at)}</p></div>{musteri.davet_bekliyor ? <Badge variant="outline" className="border-[var(--tema-yerel-eczanem-islevsel-cizgi-11)] bg-[var(--tema-yerel-eczanem-islevsel-zemin-07)] font-bold text-[var(--tema-yerel-eczanem-islevsel-metin-05)]">Davet Bekliyor</Badge> : <Badge variant="outline" className={musteri.aktif_mi ? "border-[var(--tema-yerel-eczanem-islevsel-cizgi-06)] bg-[var(--tema-yerel-eczanem-islevsel-zemin-06)] text-[var(--tema-yerel-eczanem-islevsel-metin-16)]" : "border-[var(--tema-yerel-eczanem-islevsel-cizgi-10)] bg-[var(--tema-yerel-eczanem-islevsel-zemin-21)] text-[var(--tema-yerel-eczanem-islevsel-metin-24)]"}>{musteri.aktif_mi ? "Aktif" : "Pasif"}</Badge>}</div>{musteri.eposta && <p className="mt-2 text-[11px] font-semibold text-[var(--tema-yerel-eczanem-yardimci-metin-10)]">{musteri.eposta}</p>}{musteri.davet_bekliyor && !musteri.davet_gonderildi && <p className="mt-1 text-[11px] font-semibold text-[var(--tema-yerel-eczanem-islevsel-metin-10)]">Davet e-postası gönderilemedi</p>}{!musteri.davet_bekliyor && !musteri.aktif_mi && musteri.baglama_onayi_bekliyor && <p className="mt-1 text-[11px] font-semibold text-[var(--tema-yerel-eczanem-eylem-metin-01)]">Üyenin yeniden aktifleştirme onayı bekleniyor</p>}{musteri.davet_bekliyor ? <div className="mt-3 flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" className="flex-1" disabled={islenenMusteri === musteri.musteri_id} onClick={() => davetiYenidenGonder(musteri)}><Send className="size-3.5" /> Daveti gönder</Button><Button type="button" size="sm" variant="outline" disabled={islenenMusteri === musteri.musteri_id} onClick={() => davetDuzenleAc(musteri)}><Pencil className="size-3.5" /> Düzenle</Button><Button type="button" size="sm" variant="outline" className="border-[var(--tema-yerel-eczanem-islevsel-cizgi-05)] text-[var(--tema-yerel-eczanem-islevsel-metin-10)]" disabled={islenenMusteri === musteri.musteri_id} onClick={() => setDavetIptalHedefi(musteri)}><Trash2 /> İptal</Button></div> : <div className="mt-3 flex gap-2"><Button type="button" size="sm" variant="outline" className="flex-1" disabled={islenenMusteri === musteri.musteri_id || (!musteri.aktif_mi && !!musteri.baglama_onayi_bekliyor)} onClick={() => durumDegistir(musteri)}>{musteri.aktif_mi ? "Pasife al" : musteri.baglama_onayi_bekliyor ? "Onay bekleniyor" : "Aktifleştirme iste"}</Button><Button type="button" size="sm" variant="outline" className="border-[var(--tema-yerel-eczanem-islevsel-cizgi-05)] text-[var(--tema-yerel-eczanem-islevsel-metin-10)]" disabled={islenenMusteri === musteri.musteri_id} onClick={() => setSilHedefi(musteri)}><Trash2 /> Sil</Button></div>}</article>)}</div>
            <EczanemSayfalama sayfa={veri.sayfalama.sayfa} toplamSayfa={veri.sayfalama.toplam_sayfa} onDegistir={setSayfa} disabled={yenileniyor} />
          </>}
        </>}

        {gorunum === "bagla" && <div className="mx-auto w-full max-w-2xl p-5 py-8 md:p-10"><span className="flex size-11 items-center justify-center rounded-2xl bg-[var(--tema-yerel-eczanem-secim-zemin-01)] text-[var(--tema-yerel-eczanem-eylem-metin-01)]"><Link2 className="size-5" /></span><h2 className="mt-4 text-lg font-extrabold text-[var(--tema-yerel-eczanem-ana-metin-05)]">Üyeyi telefonuyla sorgulayın</h2><p className="mt-1 text-xs font-semibold leading-5 text-[var(--tema-yerel-eczanem-yardimci-metin-11)]">Mevcut Eczanem kaydı bulunursa yeni hesap açmadan üyeye bağlantı onay talebi gönderebilirsiniz.</p>
          {baglaBilgisiAcik && <div className="relative mt-5 flex items-start gap-2 rounded-xl border border-[var(--tema-yerel-eczanem-cizgi-22)] bg-[var(--tema-yerel-eczanem-secim-zemin-08)] py-3 pl-3 pr-10 text-xs font-semibold leading-5 text-[var(--tema-yerel-eczanem-yardimci-metin-27)]"><Info className="mt-0.5 size-4 shrink-0 text-[var(--tema-yerel-eczanem-eylem-metin-01)]" /><span>Danışanın cep telefonunu sorgulayın. Eczanem’de mevcut kaydı varsa yeni hesap oluşturmadan onay talebi gönderebilirsiniz. Kayıt bulunamazsa yeni üye kaydı oluşturabilirsiniz.</span><button type="button" onClick={() => setBaglaBilgisiAcik(false)} aria-label="Bilgilendirmeyi kapat" className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-lg text-[var(--tema-yerel-eczanem-yardimci-metin-28)] transition hover:bg-[var(--tema-yerel-eczanem-kart-01)] hover:text-[var(--tema-yerel-eczanem-ana-metin-14)]"><X className="size-4" /></button></div>}
          <div className="mt-6 space-y-2"><Label htmlFor="bagla-telefon">Cep telefonu</Label><Input id="bagla-telefon" type="tel" inputMode="numeric" maxLength={11} value={baglaTel} onChange={(e) => { setBaglaTel(e.target.value.replace(/\D/g, "")); setBaglaSonucu(null); }} placeholder="05XXXXXXXXX" className="border-[var(--tema-yerel-eczanem-cizgi-10)]" /></div><Button type="button" onClick={kayitliMusteriyiSorgula} disabled={sorgulaniyor || baglaniyor || baglaTel.length !== 11} className="mt-5 w-full bg-[var(--tema-yerel-eczanem-eylem-zemin-01)] font-extrabold hover:bg-[var(--tema-yerel-eczanem-eylem-zemin-02)]"><Search /> {sorgulaniyor ? "Sorgulanıyor…" : "Üyeyi sorgula"}</Button>
          {baglaSonucu === "kayitli" && <div className="mt-4 rounded-xl border border-[var(--tema-yerel-eczanem-cizgi-23)] bg-[var(--tema-yerel-eczanem-sayfa-zemini-14)] p-4"><div className="flex items-center gap-2 text-sm font-extrabold text-[var(--tema-yerel-eczanem-eylem-metin-04)]"><CheckCircle2 className="size-4" /> Mevcut Eczanem kaydı bulundu</div><p className="mt-1 text-xs font-semibold leading-5 text-[var(--tema-yerel-eczanem-yardimci-metin-12)]">Üyeye bağlantı onay talebi gönderilir. Üye Cogniti hesabından onayladığında eczanenizle üyelik bağı aktifleşir.</p><Button type="button" onClick={kayitliMusteriyiBagla} disabled={baglaniyor} className="mt-3 w-full bg-[var(--tema-yerel-eczanem-islevsel-zemin-13)] font-extrabold hover:bg-[var(--tema-yerel-eczanem-islevsel-zemin-14)]"><Send className="size-4" /> {baglaniyor ? "Gönderiliyor…" : "Onay talebi gönder"}</Button></div>}
          {baglaSonucu === "onay_bekliyor" && <div className="mt-4 flex items-start gap-2 rounded-xl border border-[var(--tema-yerel-eczanem-islevsel-cizgi-11)] bg-[var(--tema-yerel-eczanem-islevsel-zemin-07)] p-4 text-xs font-semibold leading-5 text-[var(--tema-yerel-eczanem-islevsel-metin-05)]"><Clock className="mt-0.5 size-4 shrink-0" /><span>Bu üye için zaten bekleyen bir bağlantı onay talebiniz var. Üye onayladığında eczane listenizde aktifleşecektir.</span></div>}
          {baglaSonucu === "yeni" && <div className="mt-4 rounded-xl border border-[var(--tema-yerel-eczanem-islevsel-cizgi-11)] bg-[var(--tema-yerel-eczanem-islevsel-zemin-22)] p-4"><div className="flex items-center gap-2 text-sm font-extrabold text-[var(--tema-yerel-eczanem-islevsel-metin-05)]"><UserPlus className="size-4" /> Kayıt bulunamadı</div><p className="mt-1 text-xs font-semibold leading-5 text-[var(--tema-yerel-eczanem-yardimci-metin-12)]">Bu telefonla yeni bir Eczanem üye hesabı oluşturabilirsiniz.</p><Button type="button" onClick={() => { setKTel(baglaTel); setGorunum("yeni"); }} className="mt-3 w-full bg-[var(--tema-yerel-eczanem-islevsel-zemin-23)] font-extrabold hover:bg-[var(--tema-yerel-eczanem-islevsel-zemin-24)]"><UserPlus /> Yeni üye kaydı oluştur</Button></div>}
          {baglaSonucu === "zaten_bagli" && <div className="mt-4 flex items-start gap-2 rounded-xl border border-[var(--tema-yerel-eczanem-islevsel-cizgi-06)] bg-[var(--tema-yerel-eczanem-islevsel-zemin-06)] p-4 text-xs font-semibold leading-5 text-[var(--tema-yerel-eczanem-islevsel-metin-16)]"><CheckCircle2 className="mt-0.5 size-4 shrink-0" /><span>Bu üye zaten eczanenizin aktif üye listesinde bulunuyor.</span></div>}
        </div>}

        {gorunum === "yeni" && <form onSubmit={musteriKaydet} className="mx-auto w-full max-w-3xl p-5 py-8 md:p-10"><span className="flex size-11 items-center justify-center rounded-2xl bg-[var(--tema-yerel-eczanem-islevsel-zemin-07)] text-[var(--tema-yerel-eczanem-islevsel-metin-05)]"><UserPlus className="size-5" /></span><h2 className="mt-4 text-lg font-extrabold text-[var(--tema-yerel-eczanem-ana-metin-05)]">Yeni üye kayıt formu</h2><p className="mt-1 text-xs font-semibold leading-5 text-[var(--tema-yerel-eczanem-yardimci-metin-11)]">Kayıt sonrası danışanın e-posta adresine 24 saat geçerli şifre oluşturma daveti gönderilir. E-Club üyesi eczacı ve eczane teknisyenleri Eczanem üyesi olarak kaydedilemez.</p><div className="mt-6 grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label htmlFor="musteri-ad">Ad</Label><Input id="musteri-ad" value={kAd} onChange={(e) => setKAd(e.target.value)} required className="border-[var(--tema-yerel-eczanem-cizgi-10)]" /></div><div className="space-y-2"><Label htmlFor="musteri-soyad">Soyad</Label><Input id="musteri-soyad" value={kSoyad} onChange={(e) => setKSoyad(e.target.value)} required className="border-[var(--tema-yerel-eczanem-cizgi-10)]" /></div><div className="space-y-2"><Label htmlFor="musteri-telefon">Cep telefonu</Label><Input id="musteri-telefon" type="tel" inputMode="numeric" maxLength={11} value={kTel} onChange={(e) => setKTel(e.target.value.replace(/\D/g, ""))} placeholder="05XXXXXXXXX" required className="border-[var(--tema-yerel-eczanem-cizgi-10)]" /></div><div className="space-y-2"><Label htmlFor="musteri-eposta">E-posta</Label><Input id="musteri-eposta" type="email" value={kEposta} onChange={(e) => setKEposta(e.target.value)} required className="border-[var(--tema-yerel-eczanem-cizgi-10)]" /></div></div><div className="mt-5 flex items-start gap-2 rounded-xl border border-[var(--tema-yerel-eczanem-cizgi-24)] bg-[var(--tema-yerel-eczanem-sayfa-zemini-14)] p-3 text-xs font-semibold leading-5 text-[var(--tema-yerel-eczanem-yardimci-metin-26)]"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-[var(--tema-yerel-eczanem-eylem-metin-01)]" /> Üye yalnız kendi hesabını tamamen sildiğinde kişisel verileri kalıcı olarak kaldırılır. Eczane listesinden silme yalnız üyelik bağını kaldırır.</div><Button type="submit" disabled={kGonderiliyor} className="mt-5 w-full bg-[var(--tema-yerel-eczanem-eylem-zemin-01)] font-extrabold hover:bg-[var(--tema-yerel-eczanem-eylem-zemin-02)]"><UserPlus /> {kGonderiliyor ? "Kaydediliyor…" : "Üyeyi kaydet ve davet gönder"}</Button></form>}
      </EczanemPanel>

      <AlertDialog open={!!silHedefi} onOpenChange={(acik) => { if (!acik && !islenenMusteri) setSilHedefi(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Üyeyi listeden silmek istediğinize emin misiniz?</AlertDialogTitle><AlertDialogDescription>{silHedefi ? `${adYaz(silHedefi.ad_soyad)} eczane listenizden kaldırılacak.` : "Üye eczane listenizden kaldırılacak."} Bu işlem üyenin genel hesabını silmez ve eczane silme kaydı korunur.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={!!islenenMusteri}>Vazgeç</AlertDialogCancel><AlertDialogAction disabled={!!islenenMusteri} onClick={(event) => { event.preventDefault(); void musteriSil(); }} className="bg-[var(--tema-yerel-eczanem-islevsel-zemin-16)] hover:bg-[var(--tema-yerel-eczanem-islevsel-zemin-17)]"><Trash2 /> {islenenMusteri ? "Siliniyor…" : "Listeden sil"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>

      <AlertDialog open={!!davetIptalHedefi} onOpenChange={(acik) => { if (!acik && !islenenMusteri) setDavetIptalHedefi(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Bekleyen daveti iptal etmek istediğinize emin misiniz?</AlertDialogTitle><AlertDialogDescription>{davetIptalHedefi ? `${adYaz(davetIptalHedefi.ad_soyad)} için gönderilen üyelik daveti iptal edilecek.` : "Bekleyen üyelik daveti iptal edilecek."} Henüz aktifleşmemiş kayıt silinir ve aynı telefon veya e-posta ile yeniden davet açılabilir.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={!!islenenMusteri}>Vazgeç</AlertDialogCancel><AlertDialogAction disabled={!!islenenMusteri} onClick={(event) => { event.preventDefault(); void davetiIptalEt(); }} className="bg-[var(--tema-yerel-eczanem-islevsel-zemin-16)] hover:bg-[var(--tema-yerel-eczanem-islevsel-zemin-17)]"><Trash2 /> {islenenMusteri ? "İptal ediliyor…" : "Daveti iptal et"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>

      <AlertDialog open={!!davetDuzenleHedefi} onOpenChange={(acik) => { if (!acik && !islenenMusteri) setDavetDuzenleHedefi(null); }}><AlertDialogContent><form onSubmit={davetiGuncelle}><AlertDialogHeader><AlertDialogTitle>Bekleyen davet bilgilerini düzenle</AlertDialogTitle><AlertDialogDescription>Henüz şifre oluşturmamış üyenin adını, soyadını veya e-posta adresini düzeltebilirsiniz. Kaydettiğinizde güncel davet e-postası gönderilir.</AlertDialogDescription></AlertDialogHeader><div className="my-4 space-y-3"><div className="space-y-1.5"><Label htmlFor="davet-ad">Ad</Label><Input id="davet-ad" value={dAd} onChange={(e) => setDAd(e.target.value)} required className="border-[var(--tema-yerel-eczanem-cizgi-10)]" /></div><div className="space-y-1.5"><Label htmlFor="davet-soyad">Soyad</Label><Input id="davet-soyad" value={dSoyad} onChange={(e) => setDSoyad(e.target.value)} required className="border-[var(--tema-yerel-eczanem-cizgi-10)]" /></div><div className="space-y-1.5"><Label htmlFor="davet-eposta">Yeni e-posta (isteğe bağlı)</Label><Input id="davet-eposta" type="email" value={dEposta} onChange={(e) => setDEposta(e.target.value)} placeholder={davetDuzenleHedefi?.eposta ? `Mevcut: ${davetDuzenleHedefi.eposta}` : "Değiştirmek için yeni e-posta girin"} className="border-[var(--tema-yerel-eczanem-cizgi-10)]" /></div></div><AlertDialogFooter><AlertDialogCancel type="button" disabled={!!islenenMusteri}>Vazgeç</AlertDialogCancel><Button type="submit" disabled={!!islenenMusteri} className="bg-[var(--tema-yerel-eczanem-eylem-zemin-01)] font-extrabold hover:bg-[var(--tema-yerel-eczanem-eylem-zemin-02)]"><Send className="size-3.5" /> {islenenMusteri ? "Kaydediliyor…" : "Güncelle ve daveti gönder"}</Button></AlertDialogFooter></form></AlertDialogContent></AlertDialog>
    </EczanemEczaneSayfa>
  );
}
