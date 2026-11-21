"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Clock, EyeOff, Plus, Power, Radio, Trash2 } from "lucide-react";
import { HEDEF_ROL_TASARIM } from "@/app/(panel)/talepler/_types";
import { AgoraRafOklari } from "@/components/agora/AgoraRafOklari";
import rafStyles from "@/components/agora/AgoraVitrini.module.css";
import PartnerKabugu from "@/components/agora/PartnerKabugu";
import { HataMesajiContainer, useHataMesaji } from "@/components/HataMesaji";
import {
  SadeFormSecimi,
  SadeKapsulFiltre,
  SadeKontrolButonu,
  SadeKontrolGrubu,
} from "@/components/kontrol/SadeKontroller";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { YenileButonu } from "@/components/ui/yenile-butonu";
import MobilYayinAkisi from "@/components/yayin/MobilYayinAkisi";
import {
  CANLI_YAYIN_KAPASITELERI,
  CANLI_YAYIN_KATEGORILERI,
  CANLI_YAYIN_SURELERI,
  CANLI_YAYIN_TAMPON_DAKIKA,
  canliHakedisOzetiHesapla,
  canliIlkMusaitSaatiSec,
  canliOturumTamponCakisiyorMu,
  canliSaatSecenekleriniHesapla,
  type CanliYayinKapasitesi,
  type CanliYayinKategoriKodu,
  type CanliYayinSuresi,
} from "@/lib/agora/partnerCanliYayin";
import { CanliYayinSaatSecimi } from "./CanliYayinSaatSecimi";
import { CanliYayinAgoraOnizleme, type CanliOnizlemeOturumu } from "./CanliYayinAgoraOnizleme";
import {
  TL_BICIMI,
  type CanliEgitimKaydi,
  type CanliOturumKaydi,
} from "./CanliYayinHoykKabugu";
import { PartnerCanliYayinKarti } from "./PartnerCanliYayinKarti";
import { VARSAYILAN_PARTNER_KOMISYON_ORANI, partnerKomisyonOraniGecerli } from "@/lib/agora/komisyon";
import { partnerKelimeSayisi } from "@/lib/agora/partnerEgitimFormu";
import { ROL_ADLARI, TUM_HEDEF_ROLLER, type HedefRol } from "@/lib/utils/roller";

interface TaslakSlot {
  id: string;
  tarih: string;
  saat: string;
  baslangicIso: string;
  baslangicMs: number;
}

type DurumFiltresi = "tumu" | "musait" | "siparis_verildi" | "pasif";

const TARIH_SAAT_BICIMI = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Istanbul",
});

function bugunIstanbulTarihi(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default function PartnerCanliYayinAlani({
  sirketAdi,
  logoSurumu,
  gorunum = "planlama",
}: {
  sirketAdi: string;
  logoSurumu?: number;
  gorunum?: "planlama" | "agora_yayinlar" | "pasif_yayinlar";
}) {
  const router = useRouter();
  const raf = useRef<HTMLDivElement>(null);
  const duzenleParamIslendi = useRef(false);
  const kaydedildiBildirimiGosterildi = useRef(false);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [cikiliyor, setCikiliyor] = useState(false);
  const [hata, setHata] = useState("");
  const { mesajlar: bildirimler, basari: bildirimBasari } = useHataMesaji();
  const [egitimler, setEgitimler] = useState<CanliEgitimKaydi[]>([]);
  const [oturumlar, setOturumlar] = useState<CanliOturumKaydi[]>([]);
  const [komisyonOrani, setKomisyonOrani] = useState<number>(VARSAYILAN_PARTNER_KOMISYON_ORANI);

  // Sol Sütun: Yeni canlı eğitim / düzenleme + fiyat + yayın zamanı slotları
  const [duzenlenenEgitimId, setDuzenlenenEgitimId] = useState<string | null>(null);
  const [egitimAdi, setEgitimAdi] = useState("");
  const [kategori, setKategori] = useState<CanliYayinKategoriKodu | "">("");
  const [hedefRoller, setHedefRoller] = useState<HedefRol[]>([]);
  const [aciklama, setAciklama] = useState("");
  const [sureDakika, setSureDakika] = useState<CanliYayinSuresi>(60);
  const [kapasite, setKapasite] = useState<CanliYayinKapasitesi>(25);
  const [fiyatTl, setFiyatTl] = useState("");
  const [taslakTarih, setTaslakTarih] = useState("");
  const [taslakSaat, setTaslakSaat] = useState("14:00");
  const [taslakSlotlar, setTaslakSlotlar] = useState<TaslakSlot[]>([]);
  const [egitimKaydediliyor, setEgitimKaydediliyor] = useState(false);

  // Sağ Sütun: Agora'daki Canlı Yayınlar
  const [durumFiltresi, setDurumFiltresi] = useState<DurumFiltresi>(
    gorunum === "pasif_yayinlar" ? "pasif" : "tumu",
  );
  const [hedefFiltresi, setHedefFiltresi] = useState<HedefRol | "">("");
  const [aramaMetni, setAramaMetni] = useState("");
  const [arama, setArama] = useState("");
  const [pasifOturumAdayi, setPasifOturumAdayi] = useState<{
    oturumId: string;
    egitimAdi: string;
    baslangicAt: string;
  } | null>(null);
  const [pasifeAlinanOturumId, setPasifeAlinanOturumId] = useState<string | null>(null);
  const [aktifeAlinanOturumId, setAktifeAlinanOturumId] = useState<string | null>(null);
  const [duzenleKaynak, setDuzenleKaynak] = useState<"pasif" | "agora" | null>(null);
  const [egitimSilAdayi, setEgitimSilAdayi] = useState<CanliEgitimKaydi | null>(null);
  const [egitimSiliniyor, setEgitimSiliniyor] = useState(false);
  const [durumDegisenEgitimId, setDurumDegisenEgitimId] = useState<string | null>(null);
  const [baslatilanId, setBaslatilanId] = useState<string | null>(null);
  const [simdiMs, setSimdiMs] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setSimdiMs(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const verileriYukle = useCallback(async () => {
    setYukleniyor(true);
    setHata("");
    try {
      const r = await fetch("/partner/api/canli-yayinlar", { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) {
        setHata(d.hata ?? "Canlı yayın verileri yüklenemedi.");
        return;
      }
      const liste: CanliEgitimKaydi[] = d.egitimler ?? [];
      setEgitimler(liste);
      setOturumlar(d.oturumlar ?? []);
      if (partnerKomisyonOraniGecerli(d.komisyon_orani)) {
        setKomisyonOrani(d.komisyon_orani);
      }
    } catch {
      setHata("Canlı yayın verileri yüklenemedi.");
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useEffect(() => {
    void verileriYukle();
  }, [verileriYukle]);

  useEffect(() => {
    if (gorunum !== "agora_yayinlar" || kaydedildiBildirimiGosterildi.current) return;
    const params = new URLSearchParams(window.location.search);
    const kayitDurumu = params.get("kaydedildi");
    if (!kayitDurumu) return;
    kaydedildiBildirimiGosterildi.current = true;
    if (kayitDurumu === "guncellendi" || kayitDurumu === "guncellendi_oturum") {
      const eklenen = Number(params.get("adet") ?? "0");
      bildirimBasari(
        eklenen > 0
          ? `Canlı yayın eğitimi güncellendi ve ${eklenen} yeni yayın saati eklendi.`
          : "Canlı yayın eğitimi bilgileri güncellendi.",
      );
    } else if (kayitDurumu === "oturum_eklendi") {
      const eklenen = Number(params.get("adet") ?? "0");
      bildirimBasari(
        eklenen > 0
          ? `Canlı yayın eğitimi ve ${eklenen} yayın saati oluşturularak Agora’da siparişe açıldı.`
          : "Canlı yayın eğitimi oluşturuldu.",
      );
    } else {
      bildirimBasari("Canlı yayın eğitimi oluşturuldu.");
    }
    window.history.replaceState(window.history.state, "", "/partner/canli-yayinlar/agora");
  }, [gorunum, bildirimBasari]);

  const cikis = async () => {
    setCikiliyor(true);
    await fetch("/partner/api/cikis", { method: "POST" }).catch(() => {});
    router.push("/partner");
  };

  const fiyatOzeti = useMemo(() => {
    const n = Number(fiyatTl.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) return null;
    return canliHakedisOzetiHesapla(n, komisyonOrani);
  }, [fiyatTl, komisyonOrani]);

  const kelimeSayisi = useMemo(() => partnerKelimeSayisi(aciklama), [aciklama]);

  const egitimHaritasi = useMemo(
    () => new Map(egitimler.map((e) => [e.canli_egitim_id, e])),
    [egitimler],
  );

  const aktifOturumAraliklari = useMemo(() => {
    return oturumlar
      .filter((o) => o.durum === "musait" || o.durum === "siparis_verildi")
      .map((o) => {
        const eg = egitimHaritasi.get(o.canli_egitim_id);
        return {
          baslangicMs: Date.parse(o.baslangic_at),
          sureDakika: eg?.sure_dakika ?? 60,
        };
      });
  }, [oturumlar, egitimHaritasi]);

  const taslakAraliklari = useMemo(
    () => taslakSlotlar.map((s) => ({ baslangicMs: s.baslangicMs, sureDakika })),
    [taslakSlotlar, sureDakika],
  );

  const duzenlenenEgitim = duzenlenenEgitimId
    ? egitimHaritasi.get(duzenlenenEgitimId)
    : undefined;

  const minTarih = useMemo(() => bugunIstanbulTarihi(), []);

  const taslakSaatSecenekleri = useMemo(
    () =>
      canliSaatSecenekleriniHesapla(
        taslakTarih,
        sureDakika,
        [...aktifOturumAraliklari, ...taslakAraliklari],
        simdiMs,
      ),
    [taslakTarih, sureDakika, aktifOturumAraliklari, taslakAraliklari, simdiMs],
  );

  const etkinTaslakSaat = useMemo(
    () => canliIlkMusaitSaatiSec(taslakSaatSecenekleri, taslakSaat),
    [taslakSaatSecenekleri, taslakSaat],
  );

  const yeniTaslakGecmisMi = useMemo(() => {
    if (!taslakTarih) return false;
    if (taslakTarih < minTarih) return true;
    if (!etkinTaslakSaat) return taslakSaatSecenekleri.every((s) => s.gecmis);
    const baslangicMs = Date.parse(`${taslakTarih}T${etkinTaslakSaat}:00+03:00`);
    return Number.isFinite(baslangicMs) && baslangicMs <= simdiMs;
  }, [taslakTarih, minTarih, etkinTaslakSaat, taslakSaatSecenekleri, simdiMs]);

  const yeniTaslakCakisma = useMemo(() => {
    if (!taslakTarih || yeniTaslakGecmisMi) return false;
    if (!etkinTaslakSaat) return true;
    const baslangicMs = Date.parse(`${taslakTarih}T${etkinTaslakSaat}:00+03:00`);
    if (!Number.isFinite(baslangicMs)) return false;
    return canliOturumTamponCakisiyorMu(
      { baslangicMs, sureDakika },
      [...aktifOturumAraliklari, ...taslakAraliklari],
    );
  }, [taslakTarih, yeniTaslakGecmisMi, etkinTaslakSaat, sureDakika, aktifOturumAraliklari, taslakAraliklari]);

  const onizlemeOturumlari = useMemo<CanliOnizlemeOturumu[]>(() => {
    const harita = new Map<number, CanliOnizlemeOturumu>();
    if (duzenlenenEgitimId) {
      const kayitliOturumlar = oturumlar.filter((o) => o.canli_egitim_id === duzenlenenEgitimId);
      const pasifSecili =
        duzenleKaynak === "pasif" &&
        kayitliOturumlar.some((o) => o.durum === "iptal");
      for (const o of kayitliOturumlar) {
        if (pasifSecili ? o.durum === "iptal" : o.durum !== "iptal") {
          const baslangicMs = Date.parse(o.baslangic_at);
          if (Number.isFinite(baslangicMs)) {
            harita.set(baslangicMs, {
              id: o.oturum_id,
              baslangicMs,
              durum: o.durum,
              satin_alan_firma_adi: o.satin_alan_firma_adi,
            });
          }
        }
      }
      if (harita.size === 0) {
        for (const o of kayitliOturumlar) {
          const baslangicMs = Date.parse(o.baslangic_at);
          if (Number.isFinite(baslangicMs)) {
            harita.set(baslangicMs, {
              id: o.oturum_id,
              baslangicMs,
              durum: o.durum,
              satin_alan_firma_adi: o.satin_alan_firma_adi,
            });
          }
        }
      }
    }
    for (const slot of taslakSlotlar) {
      harita.set(slot.baslangicMs, { id: slot.id, baslangicMs: slot.baslangicMs });
    }
    if (taslakTarih && etkinTaslakSaat && !yeniTaslakGecmisMi && !yeniTaslakCakisma) {
      const baslangicMs = Date.parse(`${taslakTarih}T${etkinTaslakSaat}:00+03:00`);
      if (Number.isFinite(baslangicMs) && !harita.has(baslangicMs)) {
        harita.set(baslangicMs, { id: `taslak-${baslangicMs}`, baslangicMs });
      }
    }
    return Array.from(harita.values()).sort((a, b) => a.baslangicMs - b.baslangicMs);
  }, [
    duzenlenenEgitimId,
    duzenleKaynak,
    oturumlar,
    taslakSlotlar,
    taslakTarih,
    etkinTaslakSaat,
    yeniTaslakGecmisMi,
    yeniTaslakCakisma,
  ]);

  const duzenlenenEgitimOturumlari = useMemo(() => {
    if (!duzenlenenEgitimId) return [];
    return oturumlar
      .filter((o) => o.canli_egitim_id === duzenlenenEgitimId)
      .sort((a, b) => Date.parse(a.baslangic_at) - Date.parse(b.baslangic_at));
  }, [duzenlenenEgitimId, oturumlar]);

  const duzenlenenSiparisVar = useMemo(
    () =>
      duzenlenenEgitimOturumlari.some(
        (o) => o.durum === "siparis_verildi" || o.durum === "tamamlandi",
      ),
    [duzenlenenEgitimOturumlari],
  );

  const egitimGruplari = useMemo(() => {
    const pasifSayfa = gorunum === "pasif_yayinlar" || durumFiltresi === "pasif";
    const harita = new Map<string, CanliOturumKaydi[]>();
    const pasifOturumEgitimIdleri = new Set<string>();
    const toplamOturumEgitimIdleri = new Set<string>();
    for (const o of oturumlar) {
      toplamOturumEgitimIdleri.add(o.canli_egitim_id);
      if (o.durum === "iptal") {
        pasifOturumEgitimIdleri.add(o.canli_egitim_id);
        if (!pasifSayfa) continue;
      }
      if (!pasifSayfa) {
        const eg = egitimHaritasi.get(o.canli_egitim_id);
        if (!eg?.aktif_mi) continue;
        if (durumFiltresi === "musait" && o.durum !== "musait") continue;
        if (durumFiltresi === "siparis_verildi" && o.durum !== "siparis_verildi") continue;
      } else if (o.durum !== "iptal") {
        const eg = egitimHaritasi.get(o.canli_egitim_id);
        if (eg?.aktif_mi) continue;
      }
      const mevcut = harita.get(o.canli_egitim_id) ?? [];
      mevcut.push(o);
      harita.set(o.canli_egitim_id, mevcut);
    }

    const sorgu = arama.trim().toLocaleLowerCase("tr-TR");
    return egitimler
      .filter((eg) => {
        if (pasifSayfa) {
          if (eg.aktif_mi && !pasifOturumEgitimIdleri.has(eg.canli_egitim_id)) {
            return false;
          }
        } else {
          if (!eg.aktif_mi) return false;
          const grupOturum = harita.get(eg.canli_egitim_id) ?? [];
          if (
            grupOturum.length === 0 &&
            toplamOturumEgitimIdleri.has(eg.canli_egitim_id)
          ) {
            return false;
          }
        }
        if (hedefFiltresi && !eg.hedef_roller.includes(hedefFiltresi)) return false;
        if (!sorgu) return true;
        const grupOturum = harita.get(eg.canli_egitim_id) ?? [];
        const firmaEslesir = grupOturum.some((o) =>
          (o.satin_alan_firma_adi ?? "").toLocaleLowerCase("tr-TR").includes(sorgu),
        );
        return (
          firmaEslesir ||
          `${eg.egitim_adi} ${eg.partner_egitim_id ?? ""} ${eg.kategori} ${eg.fiyat_tl}`
            .toLocaleLowerCase("tr-TR")
            .includes(sorgu)
        );
      })
      .map((eg) => ({
        egitim:
          pasifSayfa && eg.aktif_mi
            ? { ...eg, aktif_mi: false }
            : eg,
        oturumlar: [...(harita.get(eg.canli_egitim_id) ?? [])].sort(
          (a, b) => Date.parse(a.baslangic_at) - Date.parse(b.baslangic_at),
        ),
      }))
      .filter(
        (grup) =>
          pasifSayfa ||
          durumFiltresi === "tumu" ||
          grup.oturumlar.length > 0,
      );
  }, [egitimler, oturumlar, gorunum, durumFiltresi, hedefFiltresi, arama, egitimHaritasi]);

  const rolSeciminiDegistir = (rol: HedefRol) => {
    setHedefRoller((onceki) =>
      onceki.includes(rol) ? onceki.filter((r) => r !== rol) : [...onceki, rol],
    );
  };

  const formuSifirla = () => {
    setDuzenlenenEgitimId(null);
    setDuzenleKaynak(null);
    setEgitimAdi("");
    setAciklama("");
    setFiyatTl("");
    setHedefRoller([]);
    setKategori("");
    setSureDakika(60);
    setKapasite(25);
    setTaslakTarih("");
    setTaslakSlotlar([]);
    if (gorunum === "planlama" && typeof window !== "undefined" && window.location.search.includes("duzenle=")) {
      window.history.replaceState(window.history.state, "", "/partner/canli-yayinlar");
    }
  };

  const egitimDuzenlemeyeAl = useCallback((eg: CanliEgitimKaydi) => {
    setHata("");
    setDuzenlenenEgitimId(eg.canli_egitim_id);
    setEgitimAdi(eg.egitim_adi);
    const bulunanKat = CANLI_YAYIN_KATEGORILERI.find(
      (k) => k.kod === eg.kategori_kodu || k.kategori === eg.kategori || k.ad === eg.kategori,
    );
    setKategori(bulunanKat ? bulunanKat.kod : (eg.kategori_kodu as CanliYayinKategoriKodu));
    setHedefRoller(eg.hedef_roller);
    setAciklama(eg.aciklama);
    setSureDakika(eg.sure_dakika);
    setKapasite(eg.kapasite);
    setFiyatTl(String(eg.fiyat_tl));
    setTaslakTarih("");
    setTaslakSlotlar([]);
  }, []);

  useEffect(() => {
    if (gorunum !== "planlama" || yukleniyor || duzenleParamIslendi.current) return;
    const params = new URLSearchParams(window.location.search);
    const duzenleId = params.get("duzenle");
    const kaynak = params.get("kaynak");
    if (!duzenleId) {
      duzenleParamIslendi.current = true;
      return;
    }
    const hedef = egitimler.find((eg) => eg.canli_egitim_id === duzenleId);
    duzenleParamIslendi.current = true;
    if (hedef) {
      setDuzenleKaynak(kaynak === "pasif" ? "pasif" : "agora");
      egitimDuzenlemeyeAl(hedef);
    }
  }, [gorunum, yukleniyor, egitimler, egitimDuzenlemeyeAl]);

  const taslakSlotEkle = () => {
    setHata("");
    if (!taslakTarih || !etkinTaslakSaat) {
      setHata("Saat eklemek için yayın tarihi ve müsait bir başlangıç saati seçin.");
      return;
    }
    const baslangicMs = Date.parse(`${taslakTarih}T${etkinTaslakSaat}:00+03:00`);
    if (!Number.isFinite(baslangicMs)) {
      setHata("Geçerli bir yayın tarihi ve saati seçin.");
      return;
    }
    if (baslangicMs <= Date.now()) {
      setHata("Canlı yayın başlangıcı gelecekte bir tarih ve saat olmalıdır.");
      return;
    }
    if (yeniTaslakCakisma) {
      setHata(
        `Seçilen saat başka bir yayınınızla veya iki oturum arasındaki zorunlu ${CANLI_YAYIN_TAMPON_DAKIKA} dakikalık ara süreyle çakışıyor.`,
      );
      return;
    }
    const baslangicIso = new Date(baslangicMs).toISOString();
    setTaslakSlotlar((onceki) =>
      [
        ...onceki,
        {
          id: `${baslangicMs}`,
          tarih: taslakTarih,
          saat: etkinTaslakSaat,
          baslangicIso,
          baslangicMs,
        },
      ].sort((a, b) => a.baslangicMs - b.baslangicMs),
    );
    setTaslakTarih("");
  };

  const taslakSlotSil = (id: string) => {
    setTaslakSlotlar((onceki) => onceki.filter((s) => s.id !== id));
  };

  const canliEgitimOlustur = async (e: FormEvent) => {
    e.preventDefault();
    setHata("");

    // Eğer kullanıcı tarih/saat alanını doldurmuş ama "+ Saat Ekle"ye basmadan doğrudan formu göndermişse onu da dahil et
    const eklenecekSlotlar: TaslakSlot[] = [...taslakSlotlar];
    if (taslakTarih) {
      if (!etkinTaslakSaat) {
        setHata("Seçilen tarih için müsait bir yayın saati bulunmuyor.");
        return;
      }
      const baslangicMs = Date.parse(`${taslakTarih}T${etkinTaslakSaat}:00+03:00`);
      if (!Number.isFinite(baslangicMs)) {
        setHata("Geçerli bir yayın tarihi ve saati seçin.");
        return;
      }
      if (baslangicMs <= Date.now()) {
        setHata("Canlı yayın başlangıcı gelecekte bir tarih ve saat olmalıdır.");
        return;
      }
      const cakisiyor = canliOturumTamponCakisiyorMu(
        { baslangicMs, sureDakika },
        [
          ...aktifOturumAraliklari,
          ...eklenecekSlotlar.map((s) => ({ baslangicMs: s.baslangicMs, sureDakika })),
        ],
      );
      if (cakisiyor) {
        setHata(
          `Seçilen saat başka bir yayınınızla veya iki oturum arasındaki zorunlu ${CANLI_YAYIN_TAMPON_DAKIKA} dakikalık ara süreyle çakışıyor.`,
        );
        return;
      }
      eklenecekSlotlar.push({
        id: `${baslangicMs}`,
        tarih: taslakTarih,
        saat: etkinTaslakSaat,
        baslangicIso: new Date(baslangicMs).toISOString(),
        baslangicMs,
      });
    }

    // Süre sonradan değiştirildiyse taslak slotların kendi aralarında ve mevcutlarla çakışmasını kontrol et
    const birikimliAraliklar = [...aktifOturumAraliklari];
    for (const slot of eklenecekSlotlar) {
      if (canliOturumTamponCakisiyorMu({ baslangicMs: slot.baslangicMs, sureDakika }, birikimliAraliklar)) {
        setHata(
          `Eklenen yayın saatlerinden biri mevcut yayınlarınızla veya iki oturum arasındaki zorunlu ${CANLI_YAYIN_TAMPON_DAKIKA} dakikalık ara süreyle çakışıyor.`,
        );
        return;
      }
      birikimliAraliklar.push({ baslangicMs: slot.baslangicMs, sureDakika });
    }

    setEgitimKaydediliyor(true);
    try {
      let hedefEgitimId: string | undefined = duzenlenenEgitimId ?? undefined;

      if (!duzenlenenEgitimId || !duzenlenenSiparisVar) {
        const r = await fetch("/partner/api/canli-yayinlar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            islem: duzenlenenEgitimId ? "egitim_guncelle" : "egitim_olustur",
            canli_egitim_id: duzenlenenEgitimId ?? undefined,
            egitim_adi: egitimAdi,
            kategori,
            hedef_roller: hedefRoller,
            aciklama,
            sure_dakika: sureDakika,
            kapasite,
            fiyat_tl: fiyatTl,
          }),
        });
        const d = await r.json();
        if (!r.ok) {
          setHata(
            d.hata ??
              (duzenlenenEgitimId ? "Canlı eğitim güncellenemedi." : "Canlı eğitim oluşturulamadı."),
          );
          return;
        }
        hedefEgitimId = duzenlenenEgitimId ?? d.egitim?.canli_egitim_id;
      }

      let eklenenOturumSayisi = 0;
      const oturumHatalari: string[] = [];

      if (hedefEgitimId && eklenecekSlotlar.length > 0) {
        for (const slot of eklenecekSlotlar) {
          const or = await fetch("/partner/api/canli-yayinlar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              islem: "oturum_ekle",
              canli_egitim_id: hedefEgitimId,
              baslangic_at: slot.baslangicIso,
            }),
          });
          const od = await or.json().catch(() => ({}));
          if (or.ok) {
            eklenenOturumSayisi++;
          } else {
            oturumHatalari.push(od.hata ?? "Oturum eklenemedi.");
          }
        }
      }

      const duzenlemeModuydu = !!duzenlenenEgitimId;
      formuSifirla();

      if (oturumHatalari.length > 0) {
        setHata(
          `${duzenlemeModuydu ? "Canlı eğitim güncellendi" : "Canlı eğitim oluşturuldu"} ancak bazı saatler eklenemedi: ${oturumHatalari[0]}`,
        );
        await verileriYukle();
        return;
      }

      const kayitQuery = duzenlemeModuydu
        ? eklenenOturumSayisi > 0
          ? `kaydedildi=guncellendi_oturum&adet=${eklenenOturumSayisi}`
          : "kaydedildi=guncellendi"
        : eklenenOturumSayisi > 0
          ? `kaydedildi=oturum_eklendi&adet=${eklenenOturumSayisi}`
          : "kaydedildi=olusturuldu";
      router.push(`/partner/canli-yayinlar/agora?${kayitQuery}`);
    } catch {
      setHata("Canlı eğitim kaydedilemedi.");
    } finally {
      setEgitimKaydediliyor(false);
    }
  };

  const oturumPasifeAl = async (oturumId: string) => {
    setHata("");
    setPasifeAlinanOturumId(oturumId);
    try {
      const r = await fetch("/partner/api/canli-yayinlar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ islem: "oturum_pasif", oturum_id: oturumId }),
      });
      const d = await r.json();
      if (!r.ok) {
        setHata(d.hata ?? "Oturum pasife alınamadı.");
        return;
      }
      bildirimBasari("Oturum pasife alındı.");
      setPasifOturumAdayi(null);
      await verileriYukle();
    } catch {
      setHata("Oturum pasife alınamadı.");
    } finally {
      setPasifeAlinanOturumId(null);
    }
  };

  const oturumAktifeAl = async (oturumId: string) => {
    setHata("");
    setAktifeAlinanOturumId(oturumId);
    try {
      const r = await fetch("/partner/api/canli-yayinlar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ islem: "oturum_aktif", oturum_id: oturumId }),
      });
      const d = await r.json();
      if (!r.ok) {
        setHata(d.hata ?? "Oturum aktife alınamadı.");
        return;
      }
      bildirimBasari("Oturum yeniden aktife alındı.");
      await verileriYukle();
    } catch {
      setHata("Oturum aktife alınamadı.");
    } finally {
      setAktifeAlinanOturumId(null);
    }
  };

  const egitimDurumDegistir = async (eg: CanliEgitimKaydi) => {
    setHata("");
    setDurumDegisenEgitimId(eg.canli_egitim_id);
    try {
      const yeniAktifMi = !eg.aktif_mi;
      const r = await fetch("/partner/api/canli-yayinlar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          islem: "egitim_durum_degistir",
          canli_egitim_id: eg.canli_egitim_id,
          aktif_mi: yeniAktifMi,
        }),
      });
      const d = await r.json();
      if (!r.ok) {
        setHata(d.hata ?? "Canlı eğitim durumu değiştirilemedi.");
        return;
      }
      bildirimBasari(
        d.mesaj ??
          (yeniAktifMi ? "Canlı eğitim yeniden aktife alındı." : "Canlı eğitim pasife alındı."),
      );
      await verileriYukle();
    } catch {
      setHata("Canlı eğitim durumu değiştirilemedi.");
    } finally {
      setDurumDegisenEgitimId(null);
    }
  };

  const egitimSil = async (canliEgitimId: string) => {
    setHata("");
    setEgitimSiliniyor(true);
    try {
      const r = await fetch("/partner/api/canli-yayinlar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          islem: "egitim_sil",
          canli_egitim_id: canliEgitimId,
        }),
      });
      const d = await r.json();
      if (!r.ok) {
        setHata(d.hata ?? "Canlı eğitim silinemedi.");
        return;
      }
      if (duzenlenenEgitimId === canliEgitimId) {
        formuSifirla();
      }
      setEgitimSilAdayi(null);
      bildirimBasari("Canlı eğitim silindi.");
      if (gorunum === "planlama") {
        router.push("/partner/canli-yayinlar/agora");
        return;
      }
      await verileriYukle();
    } catch {
      setHata("Canlı eğitim silinemedi.");
    } finally {
      setEgitimSiliniyor(false);
    }
  };

  const yayiniBaslat = async (oturumId: string) => {
    setHata("");
    setBaslatilanId(oturumId);
    try {
      const r = await fetch("/partner/api/canli-yayinlar/katil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oturum_id: oturumId }),
      });
      const d = await r.json();
      if (!r.ok || typeof d.url !== "string") {
        setHata(d.hata ?? "Canlı yayın odası başlatılamadı.");
        return;
      }
      window.open(d.url, "_blank", "noopener,noreferrer");
    } catch {
      setHata("Canlı yayın odası başlatılamadı.");
    } finally {
      setBaslatilanId(null);
    }
  };

  const bitisSaatiFormatla = (baslangicMs: number, sure: number) => {
    const bitis = new Date(baslangicMs + sure * 60_000);
    return new Intl.DateTimeFormat("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Istanbul",
    }).format(bitis);
  };

  return (
    <PartnerKabugu
      firmaAdi={sirketAdi}
      onCikis={() => void cikis()}
      onAnaSayfa={() => router.push("/partner/egitimler")}
      engelli={cikiliyor}
    >
      <HataMesajiContainer mesajlar={bildirimler} />
      <AlertDialog
        open={!!pasifOturumAdayi}
        onOpenChange={(open) => {
          if (!open && !pasifeAlinanOturumId) {
            setPasifOturumAdayi(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Canlı Yayın Oturumunu Pasife Al</AlertDialogTitle>
            <AlertDialogDescription>
              {pasifOturumAdayi
                ? `“${pasifOturumAdayi.egitimAdi}” eğitiminin ${TARIH_SAAT_BICIMI.format(new Date(pasifOturumAdayi.baslangicAt))} tarihli oturumunu pasife almak istediğinize emin misiniz? Oturum Agora satış listesinden kaldırılacaktır.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!pasifeAlinanOturumId}>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[var(--tema-hata)] text-[var(--tema-kontrol-eylem-metin)] hover:bg-[var(--tema-hata)] hover:brightness-95"
              disabled={!!pasifeAlinanOturumId}
              onClick={(e) => {
                e.preventDefault();
                if (pasifOturumAdayi) {
                  void oturumPasifeAl(pasifOturumAdayi.oturumId);
                }
              }}
            >
              {pasifeAlinanOturumId ? "Pasife Alınıyor…" : "Oturumu Pasife Al"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!egitimSilAdayi}
        onOpenChange={(open) => {
          if (!open && !egitimSiliniyor) {
            setEgitimSilAdayi(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Canlı Eğitimi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              {egitimSilAdayi
                ? `“${egitimSilAdayi.egitim_adi}” canlı eğitimini ve varsa henüz sipariş verilmemiş takvim saatlerini tamamen silmek istediğinize emin misiniz?`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={egitimSiliniyor}>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[var(--tema-hata)] text-[var(--tema-kontrol-eylem-metin)] hover:bg-[var(--tema-hata)] hover:brightness-95"
              disabled={egitimSiliniyor}
              onClick={(e) => {
                e.preventDefault();
                if (egitimSilAdayi) {
                  void egitimSil(egitimSilAdayi.canli_egitim_id);
                }
              }}
            >
              {egitimSiliniyor ? "Siliniyor…" : "Eğitimi Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6">
        {/* Üst Başlık ve Özet Metrikler */}
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--tema-cizgi)] pb-4">
          <div>
            <p className="m-0 text-[11px] font-bold uppercase tracking-[1.4px] text-[var(--tema-kontrol-eylem)]">
              COGNITI VIVA &amp; AGORA
            </p>
            <h1 className="m-0 mt-1 text-2xl font-bold text-[var(--tema-baslik)]">
              {gorunum === "pasif_yayinlar"
                ? "Pasif Yayınlar"
                : gorunum === "agora_yayinlar"
                  ? "Agora Canlı Yayınlar"
                  : "Canlı Yayın Planlama"}
            </h1>
            <p className="m-0 mt-1 text-xs text-[var(--tema-ikincil-metin)]">
              {gorunum === "pasif_yayinlar"
                ? "Pasife aldığınız canlı yayın eğitimleriniz ve takvim saatleriniz."
                : gorunum === "agora_yayinlar"
                  ? "Eğitim bazında gruplanmış aktif ve geçmiş canlı yayın oturumlarınız."
                  : "Yayın detaylarını, süresini, katılımcı sayısını, fiyatını ve zamanını planlayın."}
            </p>
          </div>

          {gorunum === "agora_yayinlar" && (
            <Button
              type="button"
              size="sm"
              onClick={() => router.push("/partner/canli-yayinlar")}
            >
              <Plus size={14} aria-hidden="true" />
              Yeni Canlı Yayın Planla
            </Button>
          )}
        </div>

        {hata && (
          <div
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {hata}
          </div>
        )}

        {gorunum === "planlama" ? (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            <section className="rounded-2xl border border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)] p-5 shadow-sm lg:col-span-7">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--tema-cizgi)] pb-3">
              <div className="flex items-center gap-2">
                <Radio size={18} className="text-[var(--tema-kontrol-eylem)]" aria-hidden="true" />
                <h2 className="m-0 text-base font-bold text-[var(--tema-baslik)]">
                  Canlı Yayın Planlama
                </h2>
              </div>
            </div>

            <form onSubmit={canliEgitimOlustur} className="space-y-5">
              {/* BÖLÜM 1: YAYIN DETAYLARI */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--tema-kontrol-eylem)]">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--tema-kontrol-eylem)] text-xs text-white">
                    1
                  </span>
                  Yayın Detayları
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-end">
                  <div className="sm:col-span-7">
                    <label
                      htmlFor="canli-egitim-adi"
                      className="mb-1.5 block text-xs font-semibold text-[var(--tema-ikincil-metin)]"
                    >
                      Eğitim / Konu Adı
                    </label>
                    <Input
                      id="canli-egitim-adi"
                      required
                      minLength={3}
                      maxLength={200}
                      value={egitimAdi}
                      onChange={(e) => setEgitimAdi(e.target.value)}
                      placeholder="Örn. Eczanede Etkili İletişim Teknikleri"
                    />
                  </div>

                  <div className="sm:col-span-5">
                    <label
                      htmlFor="canli-kategori"
                      className="mb-1.5 block text-xs font-semibold text-[var(--tema-ikincil-metin)]"
                    >
                      Kategori
                    </label>
                    <SadeFormSecimi
                      id="canli-kategori"
                      aria-label="Kategori"
                      className="[&_select]:!h-9"
                      required
                      value={kategori}
                      onChange={(e) => setKategori(e.target.value as CanliYayinKategoriKodu | "")}
                    >
                      <option value="">Kategori seçin</option>
                      {CANLI_YAYIN_KATEGORILERI.map((k) => (
                        <option key={k.kod} value={k.kod}>
                          {k.ad}
                        </option>
                      ))}
                    </SadeFormSecimi>
                  </div>
                </div>

                {/* Süre ve Katılımcı Sayısı (Chip Seçiciler) */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-[var(--tema-cizgi)] bg-[var(--tema-zemin)] p-3">
                    <span className="mb-1.5 block text-xs font-semibold text-[var(--tema-ikincil-metin)]">
                      Yayın Süresi (Dakika)
                    </span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {CANLI_YAYIN_SURELERI.map((s) => {
                        const secili = sureDakika === s;
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setSureDakika(s)}
                            className={`rounded-lg border py-1.5 text-xs font-semibold transition ${
                              secili
                                ? "border-[var(--tema-kontrol-eylem)] bg-[var(--tema-kontrol-eylem)] text-white"
                                : "border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)] text-[var(--tema-metin)] hover:border-[var(--tema-kontrol-eylem)]"
                            }`}
                          >
                            {s} dk
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-xl border border-[var(--tema-cizgi)] bg-[var(--tema-zemin)] p-3">
                    <span className="mb-1.5 block text-xs font-semibold text-[var(--tema-ikincil-metin)]">
                      Katılımcı Sayısı (Kapasite)
                    </span>
                    <div className="grid grid-cols-6 gap-1">
                      {CANLI_YAYIN_KAPASITELERI.map((k) => {
                        const secili = kapasite === k;
                        return (
                          <button
                            key={k}
                            type="button"
                            onClick={() => setKapasite(k)}
                            className={`rounded-lg border py-1.5 text-xs font-semibold transition ${
                              secili
                                ? "border-[var(--tema-kontrol-eylem)] bg-[var(--tema-kontrol-eylem)] text-white"
                                : "border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)] text-[var(--tema-metin)] hover:border-[var(--tema-kontrol-eylem)]"
                            }`}
                          >
                            {k}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div>
                  <span className="mb-1.5 block text-xs font-semibold text-[var(--tema-ikincil-metin)]">
                    Hedef Kitle (Birden fazla seçilebilir)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {TUM_HEDEF_ROLLER.map((rol) => {
                      const secili = hedefRoller.includes(rol);
                      return (
                        <button
                          key={rol}
                          type="button"
                          onClick={() => rolSeciminiDegistir(rol)}
                          className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                            secili
                              ? "border-[var(--tema-kontrol-eylem)] bg-[var(--tema-kontrol-eylem)] text-white"
                              : "border-[var(--tema-cizgi)] bg-[var(--tema-zemin)] text-[var(--tema-metin)]"
                          }`}
                        >
                          {rol === "eczanem" ? "Eczanem" : (ROL_ADLARI[rol] ?? rol)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <label
                      htmlFor="canli-aciklama"
                      className="font-semibold text-[var(--tema-ikincil-metin)]"
                    >
                      Eğitim İçeriği / Açıklama (En fazla 500 kelime)
                    </label>
                    <span className="text-[var(--tema-ikincil-metin)]">
                      {kelimeSayisi} / 500 Kelime
                    </span>
                  </div>
                  <textarea
                    id="canli-aciklama"
                    required
                    rows={3}
                    value={aciklama}
                    onChange={(e) => setAciklama(e.target.value)}
                    placeholder="Canlı yayında ele alınacak başlıkları ve kazanımları özetleyin..."
                    className="w-full rounded-lg border border-[var(--tema-kontrol-cizgi)] bg-[var(--tema-yuzey)] p-3 text-sm text-[var(--tema-metin)]"
                  />
                </div>
              </div>

              {/* BÖLÜM 2: FİYAT VE NET HAK EDİŞ */}
              <div className="space-y-3 border-t border-[var(--tema-cizgi)] pt-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--tema-kontrol-eylem)]">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--tema-kontrol-eylem)] text-xs text-white">
                    2
                  </span>
                  Fiyat ve Hak Ediş
                </div>

                <div className="rounded-xl border border-[var(--tema-cizgi)] bg-[var(--tema-zemin)] px-3.5 pt-3.5 pb-2">
                  <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-12">
                  <div className="sm:col-span-4">
                    <label
                      htmlFor="canli-fiyat"
                      className="mb-1 block text-xs font-semibold text-[var(--tema-ikincil-metin)]"
                    >
                      Teklif Edilen Fiyat (TL)
                    </label>
                    <Input
                      id="canli-fiyat"
                      required
                      inputMode="decimal"
                      value={fiyatTl}
                      onChange={(e) => setFiyatTl(e.target.value)}
                      placeholder="Örn. 5000"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-t border-[var(--tema-cizgi)] pt-2.5 text-xs sm:col-span-8 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                    <div>
                      <div className="text-[var(--tema-ikincil-metin)]">Satış Fiyatı</div>
                      <div className="mt-0.5 text-sm font-bold text-[var(--tema-baslik)]">
                        {fiyatOzeti ? TL_BICIMI.format(fiyatOzeti.fiyatTl) : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[var(--tema-ikincil-metin)]">%{komisyonOrani.toLocaleString("tr-TR")} Hizmet Bedeli</div>
                      <div className="mt-0.5 text-sm font-semibold text-[var(--tema-baslik)]">
                        {fiyatOzeti ? TL_BICIMI.format(fiyatOzeti.hizmetBedeliTl) : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[var(--tema-ikincil-metin)]">Hak Edişiniz</div>
                      <div
                        className={`mt-0.5 text-sm font-extrabold ${
                          fiyatOzeti && fiyatOzeti.netHakedisTl > 0
                            ? "text-emerald-700"
                            : "text-[var(--tema-ikincil-metin)]"
                        }`}
                      >
                        {fiyatOzeti ? TL_BICIMI.format(fiyatOzeti.netHakedisTl) : "—"}
                      </div>
                    </div>
                  </div>
                  </div>
                  <p className="m-0 mt-3 text-right text-[10px] italic leading-none text-[var(--tema-ikincil-metin)]">
                    Tüm fiyatlarda KDV hariçtir.
                  </p>
                </div>
              </div>

              {/* BÖLÜM 3: YAYIN ZAMANI (TARİH VE SAATLER) */}
              <div className="space-y-3 border-t border-[var(--tema-cizgi)] pt-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--tema-kontrol-eylem)]">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--tema-kontrol-eylem)] text-xs text-white">
                      3
                    </span>
                    Yayın Zamanı (Tarih ve Saatler)
                  </div>
                  <span className="text-xs text-[var(--tema-ikincil-metin)]">
                    İki oturum arası en az {CANLI_YAYIN_TAMPON_DAKIKA} dk süre olmalıdır
                  </span>
                </div>

                <div className="space-y-3 rounded-xl border border-[var(--tema-cizgi)] bg-[var(--tema-zemin)] p-3.5">
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="min-w-[140px] flex-1">
                      <label
                        htmlFor="taslak-tarih"
                        className="mb-1 block text-xs font-semibold text-[var(--tema-ikincil-metin)]"
                      >
                        Yayın Tarihi
                      </label>
                      <Input
                        id="taslak-tarih"
                        type="date"
                        min={minTarih}
                        value={taslakTarih}
                        onChange={(e) => setTaslakTarih(e.target.value)}
                      />
                    </div>
                    <div className="w-36">
                      <label
                        htmlFor="taslak-saat"
                        className="mb-1 block text-xs font-semibold text-[var(--tema-ikincil-metin)]"
                      >
                        Başlangıç (TR)
                      </label>
                      <CanliYayinSaatSecimi
                        id="taslak-saat"
                        value={etkinTaslakSaat}
                        secenekler={taslakSaatSecenekleri}
                        onChange={setTaslakSaat}
                        disabled={Boolean(taslakTarih && taslakTarih < minTarih)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={taslakSlotEkle}
                      disabled={!taslakTarih || !etkinTaslakSaat || yeniTaslakCakisma || yeniTaslakGecmisMi}
                    >
                      <Plus size={14} aria-hidden="true" />
                      Saat Ekle
                    </Button>
                  </div>

                  {yeniTaslakGecmisMi && (
                    <p className="m-0 text-xs font-medium text-red-600">
                      Canlı yayın başlangıcı gelecekte bir tarih ve saat olmalıdır.
                    </p>
                  )}
                  {!yeniTaslakGecmisMi && yeniTaslakCakisma && (
                    <p className="m-0 text-xs font-medium text-red-600">
                      Bu tarihte iki oturum arası en az {CANLI_YAYIN_TAMPON_DAKIKA} dk kuralına uygun müsait saat kalmadı.
                    </p>
                  )}

                  {duzenlenenEgitimOturumlari.length > 0 && (
                    <div className="space-y-2 border-t border-[var(--tema-cizgi)] pt-2.5 text-xs">
                      <div className="font-semibold text-[var(--tema-ikincil-metin)]">
                        Mevcut Yayın Saatleri
                      </div>
                      {duzenlenenEgitimOturumlari.map((o) => {
                        const basMs = Date.parse(o.baslangic_at);
                        return (
                          <div
                            key={o.oturum_id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)] px-3 py-2"
                          >
                            <div className="flex flex-wrap items-center gap-2 font-semibold text-[var(--tema-baslik)]">
                              <Clock size={12} aria-hidden="true" />
                              <span>
                                {TARIH_SAAT_BICIMI.format(new Date(basMs))}–
                                {bitisSaatiFormatla(basMs, sureDakika)}
                              </span>
                              {o.durum === "iptal" && (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                  Pasif
                                </span>
                              )}
                              {o.durum === "siparis_verildi" && (
                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                  Sipariş Verildi{o.satin_alan_firma_adi ? ` (${o.satin_alan_firma_adi})` : ""}
                                </span>
                              )}
                              {o.durum === "tamamlandi" && (
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                                  Tamamlandı
                                </span>
                              )}
                            </div>
                            {o.durum === "musait" && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={pasifeAlinanOturumId === o.oturum_id}
                                onClick={() => {
                                  setHata("");
                                  setPasifOturumAdayi({
                                    oturumId: o.oturum_id,
                                    egitimAdi: duzenlenenEgitim?.egitim_adi || egitimAdi,
                                    baslangicAt: o.baslangic_at,
                                  });
                                }}
                              >
                                <EyeOff size={13} aria-hidden="true" />
                                Pasife Al
                              </Button>
                            )}
                            {o.durum === "iptal" && (
                              <Button
                                type="button"
                                size="sm"
                                className="bg-[var(--tema-kontrol-eylem)] text-white hover:bg-[var(--tema-kontrol-eylem)] hover:brightness-95"
                                disabled={aktifeAlinanOturumId === o.oturum_id}
                                onClick={() => void oturumAktifeAl(o.oturum_id)}
                              >
                                <Power size={13} aria-hidden="true" />
                                {aktifeAlinanOturumId === o.oturum_id ? "Alınıyor…" : "Aktife Al"}
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {taslakSlotlar.length > 0 && (
                    <div className="space-y-2 border-t border-[var(--tema-cizgi)] pt-2.5 text-xs">
                      {duzenlenenEgitimOturumlari.length > 0 && (
                        <div className="font-semibold text-[var(--tema-ikincil-metin)]">
                          Eklenecek Yeni Yayın Saatleri
                        </div>
                      )}
                      {taslakSlotlar.map((slot) => (
                        <div
                          key={slot.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)] px-3 py-2"
                        >
                          <div className="flex items-center gap-1.5 font-semibold text-[var(--tema-baslik)]">
                            <Clock size={12} aria-hidden="true" />
                            <span>
                              {TARIH_SAAT_BICIMI.format(new Date(slot.baslangicMs))}–
                              {bitisSaatiFormatla(slot.baslangicMs, sureDakika)}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => taslakSlotSil(slot.id)}
                            aria-label="Saati kaldır"
                          >
                            <Trash2 size={13} aria-hidden="true" />
                            Kaldır
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--tema-cizgi)] pt-3">
                <div className="flex flex-wrap items-center gap-2">
                  {duzenlenenEgitim && !duzenlenenSiparisVar && (
                    <>
                      <Button
                        type="button"
                        variant={duzenlenenEgitim.aktif_mi ? "outline" : "default"}
                        className={
                          duzenlenenEgitim.aktif_mi
                            ? undefined
                            : "bg-[var(--tema-kontrol-eylem)] text-white hover:bg-[var(--tema-kontrol-eylem)] hover:brightness-95"
                        }
                        disabled={
                          egitimKaydediliyor ||
                          durumDegisenEgitimId === duzenlenenEgitim.canli_egitim_id
                        }
                        onClick={() => void egitimDurumDegistir(duzenlenenEgitim)}
                      >
                        {duzenlenenEgitim.aktif_mi ? (
                          <>
                            <EyeOff size={14} aria-hidden="true" />
                            Pasife Al
                          </>
                        ) : (
                          <>
                            <Power size={14} aria-hidden="true" />
                            Aktife Al
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        disabled={egitimKaydediliyor || egitimSiliniyor}
                        onClick={() => {
                          setHata("");
                          setEgitimSilAdayi(duzenlenenEgitim);
                        }}
                      >
                        <Trash2 size={14} aria-hidden="true" />
                        Sil
                      </Button>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {duzenlenenEgitimId && (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={egitimKaydediliyor}
                      onClick={formuSifirla}
                    >
                      Vazgeç
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={
                      egitimKaydediliyor ||
                      yukleniyor ||
                      yeniTaslakCakisma ||
                      yeniTaslakGecmisMi ||
                      (Boolean(duzenlenenEgitimId) &&
                        duzenlenenSiparisVar &&
                        taslakSlotlar.length === 0 &&
                        !taslakTarih)
                    }
                  >
                    {egitimKaydediliyor
                      ? "Kaydediliyor..."
                      : duzenlenenEgitimId
                        ? duzenlenenSiparisVar
                          ? "Yeni Saatleri Kaydet"
                          : taslakSlotlar.length > 0 || taslakTarih
                            ? "Değişiklikleri ve Yeni Saatleri Kaydet"
                            : "Değişiklikleri Kaydet"
                        : taslakSlotlar.length > 0 || taslakTarih
                          ? "Canlı Eğitimi ve Seçili Saatleri Agora’da Yayınla"
                          : "Canlı Eğitimi Oluştur"}
                  </Button>
                </div>
              </div>
            </form>
            </section>
            <div className="lg:col-span-5">
              <CanliYayinAgoraOnizleme
                sirketAdi={sirketAdi}
                logoSurumu={logoSurumu}
                egitimAdi={egitimAdi}
                aciklama={aciklama}
                sureDakika={sureDakika}
                kapasite={kapasite}
                hedefRoller={hedefRoller}
                fiyatTl={fiyatOzeti ? fiyatOzeti.fiyatTl : null}
                aktifMi={
                  duzenlenenEgitim
                    ? duzenleKaynak === "pasif"
                      ? false
                      : duzenlenenEgitim.aktif_mi
                    : true
                }
                partnerEgitimId={duzenlenenEgitim?.partner_egitim_id}
                oturumlar={onizlemeOturumlari}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 3-B: Hedef Kitle Yatay Şeridi */}
            <div className="max-w-full overflow-x-auto py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="w-max min-w-full">
                <SadeKontrolGrubu tur="sekme" aria-label="Hedef kitle">
                  <SadeKontrolButonu
                    aria-pressed={hedefFiltresi === ""}
                    onClick={() => setHedefFiltresi("")}
                  >
                    Tüm Hedef Kitleler
                  </SadeKontrolButonu>
                  {TUM_HEDEF_ROLLER.map((r) => (
                    <SadeKontrolButonu
                      key={r}
                      aria-pressed={hedefFiltresi === r}
                      onClick={() => setHedefFiltresi(r)}
                    >
                      {r === "eczanem"
                        ? "Eczanem (Eczane Danışanı)"
                        : HEDEF_ROL_TASARIM[r].tamEtiket}
                    </SadeKontrolButonu>
                  ))}
                </SadeKontrolGrubu>
              </div>
            </div>

            {/* 3-B: Durum Kapsül Filtresi + Arama + Yenile */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                {gorunum !== "pasif_yayinlar" && (
                  <SadeKapsulFiltre
                    etiket="Yayın Durumu"
                    deger={durumFiltresi}
                    onDegistir={(v) => setDurumFiltresi(v as DurumFiltresi)}
                    secenekler={[
                      { deger: "tumu", etiket: "Tümü" },
                      { deger: "musait", etiket: "Siparişe Açık" },
                      { deger: "siparis_verildi", etiket: "Sipariş Verilen" },
                    ]}
                  />
                )}
                {!yukleniyor && (
                  <span className="whitespace-nowrap text-xs text-[var(--tema-kontrol-ikincil-metin)]">
                    {egitimGruplari.length} Yayın
                  </span>
                )}
              </div>

              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                <form
                  role="search"
                  aria-label="Yayın Arama"
                  className="flex min-w-0 flex-1 items-center gap-2 sm:flex-initial"
                  onSubmit={(ev) => {
                    ev.preventDefault();
                    setArama(aramaMetni.trim());
                  }}
                >
                  <label htmlFor="partner-canli-arama" className="sr-only">
                    Yayın Adı, PE Kodu veya Fiyat
                  </label>
                  <input
                    id="partner-canli-arama"
                    type="search"
                    placeholder="Yayın adı, PE kodu veya fiyat"
                    maxLength={200}
                    value={aramaMetni}
                    onChange={(ev) => {
                      const deger = ev.target.value;
                      setAramaMetni(deger);
                      if (!deger.trim()) {
                        setArama("");
                      }
                    }}
                    className="h-9 w-full min-w-0 rounded-md border border-[var(--tema-kontrol-cizgi)] bg-[var(--tema-yuzey)] px-3 text-xs text-[var(--tema-metin)] sm:w-64"
                  />
                  <Button type="submit" size="sm" className="h-9 shrink-0">
                    Ara
                  </Button>
                </form>
                <YenileButonu yenileniyor={yukleniyor} onYenile={() => void verileriYukle()} />
              </div>
            </div>

            {yukleniyor && egitimler.length === 0 ? (
              <p role="status" className="m-0 py-6 text-sm text-[var(--tema-ikincil-metin)]">
                Yükleniyor...
              </p>
            ) : egitimGruplari.length === 0 ? (
              <section className="rounded-2xl border border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)] p-6 text-sm text-[var(--tema-ikincil-metin)] shadow-sm">
                {egitimler.length === 0
                  ? "Henüz tanımlanmış bir canlı yayın eğitiminiz bulunmuyor."
                  : durumFiltresi === "pasif" && !arama && !hedefFiltresi
                    ? "Pasif durumda canlı yayınınız bulunmuyor."
                    : "Seçilen filtreye uygun canlı yayın bulunmuyor."}
              </section>
            ) : (
              (() => {
                const kartOlustur = (
                  grup: { egitim: CanliEgitimKaydi; oturumlar: CanliOturumKaydi[] },
                  idOnEki: string,
                ) => {
                  const eg = grup.egitim;
                  return (
                    <PartnerCanliYayinKarti
                      key={`${idOnEki}-${eg.canli_egitim_id}`}
                      egitim={eg}
                      oturumlar={grup.oturumlar}
                      sirketAdi={sirketAdi}
                      logoSurumu={logoSurumu}
                      simdiMs={simdiMs}
                      baslatilanId={baslatilanId}
                      onDuzenle={() =>
                        router.push(
                          `/partner/canli-yayinlar?duzenle=${encodeURIComponent(eg.canli_egitim_id)}${gorunum === "pasif_yayinlar" || durumFiltresi === "pasif" ? "&kaynak=pasif" : ""}`,
                        )
                      }
                      onYayiniBaslat={(oturumId) => void yayiniBaslat(oturumId)}
                    />
                  );
                };

                const filtreAnahtari = `${durumFiltresi}:${hedefFiltresi}:${arama}`;
                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="m-0 text-base font-bold text-[var(--tema-baslik)]">
                        {gorunum === "pasif_yayinlar"
                          ? "Pasif Canlı Yayınlar"
                          : "Agora’daki Canlı Yayınlar"}
                      </h2>
                    </div>

                    <MobilYayinAkisi
                      kayitlar={egitimGruplari}
                      kayitAnahtari={(g) => g.egitim.canli_egitim_id}
                      renderKart={(g) => kartOlustur(g, "mobil")}
                      sayacGoster={false}
                      sifirlamaAnahtari={filtreAnahtari}
                      masaustuIcerik={
                        <div className={rafStyles.rafAlani}>
                          <AgoraRafOklari
                            raf={raf}
                            baslik={
                              gorunum === "pasif_yayinlar"
                                ? "Pasif Canlı Yayınlar"
                                : "Agora’daki Canlı Yayınlar"
                            }
                          />
                          <div key={filtreAnahtari} ref={raf} className={rafStyles.kaydir}>
                            {egitimGruplari.map((g) => (
                              <div
                                key={g.egitim.canli_egitim_id}
                                className="w-[320px] min-w-0 shrink-0 snap-start"
                              >
                                {kartOlustur(g, "masaustu")}
                              </div>
                            ))}
                          </div>
                        </div>
                      }
                    />
                  </div>
                );
              })()
            )}
          </div>
        )}
      </div>
    </PartnerKabugu>
  );
}
