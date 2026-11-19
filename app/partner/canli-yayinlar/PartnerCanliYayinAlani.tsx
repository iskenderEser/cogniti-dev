"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Clock, Plus, Radio, Trash2, Users, X } from "lucide-react";
import PartnerKabugu from "@/components/agora/PartnerKabugu";
import { SadeFormSecimi } from "@/components/kontrol/SadeKontroller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CANLI_YAYIN_KAPASITELERI,
  CANLI_YAYIN_KATEGORILERI,
  CANLI_YAYIN_SURELERI,
  CANLI_YAYIN_TAMPON_DAKIKA,
  canliHakedisOzetiHesapla,
  canliOturumTamponCakisiyorMu,
  type CanliYayinKapasitesi,
  type CanliYayinKategoriKodu,
  type CanliYayinSuresi,
} from "@/lib/agora/partnerCanliYayin";
import { partnerKelimeSayisi } from "@/lib/agora/partnerEgitimFormu";
import { ROL_ADLARI, TUM_HEDEF_ROLLER, type HedefRol } from "@/lib/utils/roller";

interface CanliEgitimKaydi {
  canli_egitim_id: string;
  partner_egitim_id?: string;
  egitim_adi: string;
  kategori_kodu: string;
  kategori: string;
  hedef_roller: HedefRol[];
  aciklama: string;
  sure_dakika: CanliYayinSuresi;
  kapasite: CanliYayinKapasitesi;
  fiyat_tl: number;
  viva_maliyeti_tl: number;
  hizmet_bedeli_tl: number;
  net_hakedis_tl: number;
  aktif_mi: boolean;
}

interface CanliOturumKaydi {
  oturum_id: string;
  canli_egitim_id: string;
  baslangic_at: string;
  bitis_at: string;
  durum: "musait" | "rezerve" | "tamamlandi" | "iptal";
  satin_alan_firma_id: string | null;
  satin_alan_firma_adi: string | null;
}

interface TaslakSlot {
  id: string;
  tarih: string;
  saat: string;
  baslangicIso: string;
  baslangicMs: number;
}

type DurumFiltresi = "tumu" | "musait" | "rezerve";

const TL_BICIMI = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  minimumFractionDigits: 2,
});

const TARIH_SAAT_BICIMI = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Istanbul",
});

export default function PartnerCanliYayinAlani({ sirketAdi }: { sirketAdi: string }) {
  const router = useRouter();
  const [yukleniyor, setYukleniyor] = useState(true);
  const [cikiliyor, setCikiliyor] = useState(false);
  const [hata, setHata] = useState("");
  const [mesaj, setMesaj] = useState("");
  const [egitimler, setEgitimler] = useState<CanliEgitimKaydi[]>([]);
  const [oturumlar, setOturumlar] = useState<CanliOturumKaydi[]>([]);

  // Sol Sütun: Yeni canlı eğitim + fiyat + yayın zamanı slotları
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

  // Sağ Sütun: Agora'daki Canlı Yayınlar & mevcut eğitime yeni saat açma
  const [durumFiltresi, setDurumFiltresi] = useState<DurumFiltresi>("tumu");
  const [saatAcilanEgitimId, setSaatAcilanEgitimId] = useState<string | null>(null);
  const [oturumTarihi, setOturumTarihi] = useState("");
  const [oturumSaati, setOturumSaati] = useState("14:00");
  const [oturumKaydediliyor, setOturumKaydediliyor] = useState(false);
  const [iptalEdilenId, setIptalEdilenId] = useState<string | null>(null);
  const [baslatilanId, setBaslatilanId] = useState<string | null>(null);

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
    } catch {
      setHata("Canlı yayın verileri yüklenemedi.");
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useEffect(() => {
    void verileriYukle();
  }, [verileriYukle]);

  const cikis = async () => {
    setCikiliyor(true);
    await fetch("/partner/api/cikis", { method: "POST" }).catch(() => {});
    router.push("/partner");
  };

  const fiyatOzeti = useMemo(() => {
    const n = Number(fiyatTl.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) return null;
    return canliHakedisOzetiHesapla(n);
  }, [fiyatTl]);

  const kelimeSayisi = useMemo(() => partnerKelimeSayisi(aciklama), [aciklama]);

  const egitimHaritasi = useMemo(
    () => new Map(egitimler.map((e) => [e.canli_egitim_id, e])),
    [egitimler],
  );

  const aktifOturumAraliklari = useMemo(() => {
    return oturumlar
      .filter((o) => o.durum === "musait" || o.durum === "rezerve")
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

  const yeniTaslakCakisma = useMemo(() => {
    if (!taslakTarih || !taslakSaat) return false;
    const baslangicMs = Date.parse(`${taslakTarih}T${taslakSaat}:00+03:00`);
    if (!Number.isFinite(baslangicMs)) return false;
    return canliOturumTamponCakisiyorMu(
      { baslangicMs, sureDakika },
      [...aktifOturumAraliklari, ...taslakAraliklari],
    );
  }, [taslakTarih, taslakSaat, sureDakika, aktifOturumAraliklari, taslakAraliklari]);

  const mevcutEgitimSaatCakismasi = useMemo(() => {
    if (!saatAcilanEgitimId || !oturumTarihi || !oturumSaati) return false;
    const eg = egitimHaritasi.get(saatAcilanEgitimId);
    if (!eg) return false;
    const baslangicMs = Date.parse(`${oturumTarihi}T${oturumSaati}:00+03:00`);
    if (!Number.isFinite(baslangicMs)) return false;
    return canliOturumTamponCakisiyorMu(
      { baslangicMs, sureDakika: eg.sure_dakika },
      aktifOturumAraliklari,
    );
  }, [saatAcilanEgitimId, oturumTarihi, oturumSaati, egitimHaritasi, aktifOturumAraliklari]);

  const istatistikler = useMemo(() => {
    let satista = 0;
    let rezerve = 0;
    for (const o of oturumlar) {
      if (o.durum === "musait") satista++;
      else if (o.durum === "rezerve") rezerve++;
    }
    return { egitimSayisi: egitimler.length, satista, rezerve };
  }, [egitimler.length, oturumlar]);

  const egitimGruplari = useMemo(() => {
    const harita = new Map<string, CanliOturumKaydi[]>();
    for (const o of oturumlar) {
      if (durumFiltresi === "musait" && o.durum !== "musait") continue;
      if (durumFiltresi === "rezerve" && o.durum !== "rezerve") continue;
      const mevcut = harita.get(o.canli_egitim_id) ?? [];
      mevcut.push(o);
      harita.set(o.canli_egitim_id, mevcut);
    }
    return egitimler
      .map((eg) => ({
        egitim: eg,
        oturumlar: harita.get(eg.canli_egitim_id) ?? [],
      }))
      .filter((grup) => durumFiltresi === "tumu" || grup.oturumlar.length > 0);
  }, [egitimler, oturumlar, durumFiltresi]);

  const rolSeciminiDegistir = (rol: HedefRol) => {
    setHedefRoller((onceki) =>
      onceki.includes(rol) ? onceki.filter((r) => r !== rol) : [...onceki, rol],
    );
  };

  const taslakSlotEkle = () => {
    setHata("");
    if (!taslakTarih || !taslakSaat) {
      setHata("Saat eklemek için yayın tarihi ve başlangıç saati seçin.");
      return;
    }
    const baslangicMs = Date.parse(`${taslakTarih}T${taslakSaat}:00+03:00`);
    if (!Number.isFinite(baslangicMs)) {
      setHata("Geçerli bir yayın tarihi ve saati seçin.");
      return;
    }
    if (yeniTaslakCakisma) {
      setHata(
        `Seçilen saat başka bir yayınınızla veya ${CANLI_YAYIN_TAMPON_DAKIKA} dakikalık ara tamponuyla çakışıyor.`,
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
          saat: taslakSaat,
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
    setMesaj("");

    // Eğer kullanıcı tarih/saat alanını doldurmuş ama "+ Saat Slotu Ekle"ye basmadan doğrudan formu göndermişse onu da dahil et
    const eklenecekSlotlar: TaslakSlot[] = [...taslakSlotlar];
    if (taslakTarih && taslakSaat) {
      const baslangicMs = Date.parse(`${taslakTarih}T${taslakSaat}:00+03:00`);
      if (!Number.isFinite(baslangicMs)) {
        setHata("Geçerli bir yayın tarihi ve saati seçin.");
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
          `Seçilen saat başka bir yayınınızla veya ${CANLI_YAYIN_TAMPON_DAKIKA} dakikalık ara tamponuyla çakışıyor.`,
        );
        return;
      }
      eklenecekSlotlar.push({
        id: `${baslangicMs}`,
        tarih: taslakTarih,
        saat: taslakSaat,
        baslangicIso: new Date(baslangicMs).toISOString(),
        baslangicMs,
      });
    }

    // Süre sonradan değiştirildiyse taslak slotların kendi aralarında ve mevcutlarla çakışmasını kontrol et
    const birikimliAraliklar = [...aktifOturumAraliklari];
    for (const slot of eklenecekSlotlar) {
      if (canliOturumTamponCakisiyorMu({ baslangicMs: slot.baslangicMs, sureDakika }, birikimliAraliklar)) {
        setHata(
          `Eklenen yayın saatlerinden biri mevcut yayınlarınızla veya ${CANLI_YAYIN_TAMPON_DAKIKA} dakikalık ara tamponla çakışıyor.`,
        );
        return;
      }
      birikimliAraliklar.push({ baslangicMs: slot.baslangicMs, sureDakika });
    }

    setEgitimKaydediliyor(true);
    try {
      const r = await fetch("/partner/api/canli-yayinlar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          islem: "egitim_olustur",
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
        setHata(d.hata ?? "Canlı eğitim oluşturulamadı.");
        return;
      }

      const yeniEgitimId: string | undefined = d.egitim?.canli_egitim_id;
      let eklenenOturumSayisi = 0;
      const oturumHatalari: string[] = [];

      if (yeniEgitimId && eklenecekSlotlar.length > 0) {
        for (const slot of eklenecekSlotlar) {
          const or = await fetch("/partner/api/canli-yayinlar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              islem: "oturum_ekle",
              canli_egitim_id: yeniEgitimId,
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

      setEgitimAdi("");
      setAciklama("");
      setFiyatTl("");
      setHedefRoller([]);
      setKategori("");
      setTaslakTarih("");
      setTaslakSlotlar([]);

      if (oturumHatalari.length > 0) {
        setHata(`Canlı eğitim oluşturuldu ancak bazı saatler eklenemedi: ${oturumHatalari[0]}`);
      } else if (eklenenOturumSayisi > 0) {
        setMesaj(
          `Canlı yayın eğitimi ve ${eklenenOturumSayisi} yayın saati oluşturularak Agora’da satışa açıldı.`,
        );
      } else {
        setMesaj(
          "Canlı yayın eğitimi oluşturuldu. Sağdaki listeden '+ Yeni Saat Aç' ile istediğiniz zaman oturum ekleyebilirsiniz.",
        );
      }

      await verileriYukle();
    } catch {
      setHata("Canlı eğitim kaydedilemedi.");
    } finally {
      setEgitimKaydediliyor(false);
    }
  };

  const mevcutEgitimeOturumEkle = async (e: FormEvent, canliEgitimId: string) => {
    e.preventDefault();
    setHata("");
    setMesaj("");
    if (!canliEgitimId || !oturumTarihi || !oturumSaati) {
      setHata("Lütfen yayın tarihi ve başlangıç saati seçin.");
      return;
    }
    if (mevcutEgitimSaatCakismasi) {
      setHata(
        `Seçilen saat başka bir yayınınızla veya ${CANLI_YAYIN_TAMPON_DAKIKA} dakikalık ara tamponuyla çakışıyor.`,
      );
      return;
    }

    setOturumKaydediliyor(true);
    try {
      const baslangicIso = new Date(`${oturumTarihi}T${oturumSaati}:00+03:00`).toISOString();
      const r = await fetch("/partner/api/canli-yayinlar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          islem: "oturum_ekle",
          canli_egitim_id: canliEgitimId,
          baslangic_at: baslangicIso,
        }),
      });
      const d = await r.json();
      if (!r.ok) {
        setHata(d.hata ?? "Takvim oturumu eklenemedi.");
        return;
      }
      setMesaj("Yeni canlı yayın saati takvime eklendi ve Agora’da satışa açıldı.");
      setOturumTarihi("");
      setSaatAcilanEgitimId(null);
      await verileriYukle();
    } catch {
      setHata("Takvim oturumu eklenemedi.");
    } finally {
      setOturumKaydediliyor(false);
    }
  };

  const oturumIptalEt = async (oturumId: string) => {
    setHata("");
    setMesaj("");
    setIptalEdilenId(oturumId);
    try {
      const r = await fetch("/partner/api/canli-yayinlar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ islem: "oturum_iptal", oturum_id: oturumId }),
      });
      const d = await r.json();
      if (!r.ok) {
        setHata(d.hata ?? "Oturum iptal edilemedi.");
        return;
      }
      setMesaj("Oturum iptal edildi.");
      await verileriYukle();
    } catch {
      setHata("Oturum iptal edilemedi.");
    } finally {
      setIptalEdilenId(null);
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
      <div className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6">
        {/* Üst Başlık ve Özet Metrikler */}
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--tema-cizgi)] pb-4">
          <div>
            <p className="m-0 text-[11px] font-bold uppercase tracking-[1.4px] text-[var(--tema-kontrol-eylem)]">
              COGNITI VIVA &amp; AGORA
            </p>
            <h1 className="m-0 mt-1 text-2xl font-bold text-[var(--tema-baslik)]">
              Canlı Yayınlarım
            </h1>
            <p className="m-0 mt-1 text-xs text-[var(--tema-ikincil-metin)]">
              Yayın detaylarını, süresini, kapasitesini, fiyatını ve takvim saatlerini tek ekrandan yönetin.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="rounded-xl border border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)] px-3 py-2">
              <span className="text-[var(--tema-ikincil-metin)]">Tanımlı Eğitim:</span>
              <strong className="ml-1 font-bold text-[var(--tema-baslik)]">
                {istatistikler.egitimSayisi}
              </strong>
            </div>
            <div className="rounded-xl border border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)] px-3 py-2">
              <span className="text-[var(--tema-ikincil-metin)]">Agora’da Satışta:</span>
              <strong className="ml-1 font-bold text-blue-700">
                {istatistikler.satista} Oturum
              </strong>
            </div>
            <div className="rounded-xl border border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)] px-3 py-2">
              <span className="text-[var(--tema-ikincil-metin)]">Satın Alınan (Rezerve):</span>
              <strong className="ml-1 font-bold text-emerald-700">
                {istatistikler.rezerve} Oturum
              </strong>
            </div>
          </div>
        </div>

        {hata && (
          <div
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {hata}
          </div>
        )}
        {mesaj && (
          <div
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
            role="status"
          >
            {mesaj}
          </div>
        )}

        {/* 2 Sütunlu Stüdyo Düzeni (Seçenek A) */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          {/* SOL SÜTUN (7 KOLON): 1. Yayın Detayları -> 2. Fiyat -> 3. Yayın Zamanı */}
          <section className="rounded-2xl border border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)] p-5 shadow-sm lg:col-span-7">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--tema-cizgi)] pb-3">
              <div className="flex items-center gap-2">
                <Radio size={18} className="text-[var(--tema-kontrol-eylem)]" aria-hidden="true" />
                <div>
                  <h2 className="m-0 text-base font-bold text-[var(--tema-baslik)]">
                    Yeni Canlı Yayın Paketi Oluştur
                  </h2>
                  <p className="m-0 text-xs text-[var(--tema-ikincil-metin)]">
                    1. Yayın Detayları &rarr; 2. Fiyat &amp; Hak Ediş &rarr; 3. Yayın Zamanı
                  </p>
                </div>
              </div>
              <span className="rounded-full border border-[var(--tema-cizgi)] bg-[var(--tema-zemin)] px-2.5 py-1 text-xs font-semibold text-[var(--tema-metin)]">
                Tek Adımda Yayınla
              </span>
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

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
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
                    <SadeFormSecimi
                      etiket="Kategori"
                      id="canli-kategori"
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
                  Fiyat ve Net Hak Ediş
                </div>

                <div className="grid grid-cols-1 items-center gap-3 rounded-xl border border-[var(--tema-cizgi)] bg-[var(--tema-zemin)] p-3.5 sm:grid-cols-12">
                  <div className="sm:col-span-4">
                    <label
                      htmlFor="canli-fiyat"
                      className="mb-1 block text-xs font-semibold text-[var(--tema-ikincil-metin)]"
                    >
                      Satış Fiyatı (TL)
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
                      <div className="text-[var(--tema-ikincil-metin)]">%15 Hizmet Bedeli</div>
                      <div className="mt-0.5 text-sm font-semibold text-[var(--tema-baslik)]">
                        {fiyatOzeti ? TL_BICIMI.format(fiyatOzeti.hizmetBedeliTl) : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[var(--tema-ikincil-metin)]">Net Hak Edişiniz</div>
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
                    İki oturum arası en az {CANLI_YAYIN_TAMPON_DAKIKA} dk tampon korunur
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
                        value={taslakTarih}
                        onChange={(e) => setTaslakTarih(e.target.value)}
                      />
                    </div>
                    <div className="w-32">
                      <label
                        htmlFor="taslak-saat"
                        className="mb-1 block text-xs font-semibold text-[var(--tema-ikincil-metin)]"
                      >
                        Başlangıç (TR)
                      </label>
                      <Input
                        id="taslak-saat"
                        type="time"
                        value={taslakSaat}
                        onChange={(e) => setTaslakSaat(e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={taslakSlotEkle}
                      disabled={!taslakTarih || !taslakSaat || yeniTaslakCakisma}
                    >
                      <Plus size={14} aria-hidden="true" />
                      Saat Ekle
                    </Button>
                  </div>

                  {yeniTaslakCakisma && (
                    <p className="m-0 text-xs font-medium text-red-600">
                      Bu tarih/saat mevcut bir yayınınızla veya iki yayın arasındaki zorunlu{" "}
                      {CANLI_YAYIN_TAMPON_DAKIKA} dakikalık ara tamponuyla çakışıyor.
                    </p>
                  )}

                  {taslakSlotlar.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {taslakSlotlar.map((slot) => (
                        <span
                          key={slot.id}
                          className="inline-flex items-center gap-2 rounded-lg border border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)] px-2.5 py-1 text-xs font-medium text-[var(--tema-baslik)]"
                        >
                          <Clock size={12} className="text-[var(--tema-kontrol-eylem)]" aria-hidden="true" />
                          <span>
                            {TARIH_SAAT_BICIMI.format(new Date(slot.baslangicMs))}–
                            {bitisSaatiFormatla(slot.baslangicMs, sureDakika)}
                          </span>
                          <button
                            type="button"
                            onClick={() => taslakSlotSil(slot.id)}
                            aria-label="Saati kaldır"
                            className="text-[var(--tema-ikincil-metin)] hover:text-red-600"
                          >
                            <X size={13} aria-hidden="true" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end border-t border-[var(--tema-cizgi)] pt-3">
                <Button type="submit" disabled={egitimKaydediliyor || yukleniyor || yeniTaslakCakisma}>
                  {egitimKaydediliyor
                    ? "Kaydediliyor..."
                    : taslakSlotlar.length > 0 || taslakTarih
                      ? "Canlı Eğitimi ve Seçili Saatleri Agora’da Yayınla"
                      : "Canlı Eğitimi Oluştur"}
                </Button>
              </div>
            </form>
          </section>

          {/* SAĞ SÜTUN (5 KOLON): AGORA'DAKİ CANLI YAYINLAR */}
          <section className="space-y-4 rounded-2xl border border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)] p-5 shadow-sm lg:col-span-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--tema-cizgi)] pb-3">
              <div>
                <h2 className="m-0 text-base font-bold text-[var(--tema-baslik)]">
                  Agora’daki Canlı Yayınlar
                </h2>
                <p className="m-0 text-xs text-[var(--tema-ikincil-metin)]">
                  Eğitim bazında gruplanmış aktif ve geçmiş oturumlarınız
                </p>
              </div>
            </div>

            {/* Durum Filtre Sekmeleri */}
            <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setDurumFiltresi("tumu")}
                className={`rounded-lg px-2.5 py-1 transition ${
                  durumFiltresi === "tumu"
                    ? "bg-[var(--tema-kontrol-eylem)] text-white"
                    : "border border-[var(--tema-cizgi)] bg-[var(--tema-zemin)] text-[var(--tema-metin)]"
                }`}
              >
                Tümü ({oturumlar.length})
              </button>
              <button
                type="button"
                onClick={() => setDurumFiltresi("musait")}
                className={`rounded-lg px-2.5 py-1 transition ${
                  durumFiltresi === "musait"
                    ? "bg-[var(--tema-kontrol-eylem)] text-white"
                    : "border border-[var(--tema-cizgi)] bg-[var(--tema-zemin)] text-[var(--tema-metin)]"
                }`}
              >
                Satışta ({istatistikler.satista})
              </button>
              <button
                type="button"
                onClick={() => setDurumFiltresi("rezerve")}
                className={`rounded-lg px-2.5 py-1 transition ${
                  durumFiltresi === "rezerve"
                    ? "bg-[var(--tema-kontrol-eylem)] text-white"
                    : "border border-[var(--tema-cizgi)] bg-[var(--tema-zemin)] text-[var(--tema-metin)]"
                }`}
              >
                Satın Alındı ({istatistikler.rezerve})
              </button>
            </div>

            {yukleniyor ? (
              <p className="m-0 text-sm text-[var(--tema-ikincil-metin)]">Yükleniyor...</p>
            ) : egitimGruplari.length === 0 ? (
              <p className="m-0 text-sm text-[var(--tema-ikincil-metin)]">
                {egitimler.length === 0
                  ? "Henüz tanımlanmış bir canlı yayın eğitiminiz bulunmuyor. Soldaki formdan ilk canlı yayınınızı oluşturabilirsiniz."
                  : "Seçilen filtreye uygun canlı yayın oturumu bulunmuyor."}
              </p>
            ) : (
              <div className="space-y-3">
                {egitimGruplari.map(({ egitim: eg, oturumlar: grupOturumlari }) => {
                  const saatEkleAcik = saatAcilanEgitimId === eg.canli_egitim_id;
                  return (
                    <div
                      key={eg.canli_egitim_id}
                      className="space-y-3 rounded-xl border border-[var(--tema-cizgi)] bg-[var(--tema-zemin)] p-3.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[11px] font-semibold text-[var(--tema-kontrol-eylem)]">
                            {eg.partner_egitim_id ? `${eg.partner_egitim_id} · ` : ""}
                            {eg.kategori}
                          </span>
                          <h3 className="m-0 text-sm font-bold text-[var(--tema-baslik)]">
                            {eg.egitim_adi}
                          </h3>
                          <p className="m-0 mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-[var(--tema-ikincil-metin)]">
                            <span className="inline-flex items-center gap-1">
                              <Users size={12} aria-hidden="true" />
                              {eg.sure_dakika} dk · {eg.kapasite} katılımcı
                            </span>
                            <span>·</span>
                            <span>Satış {TL_BICIMI.format(eg.fiyat_tl)}</span>
                            <span>·</span>
                            <strong className="text-emerald-700">
                              Net {TL_BICIMI.format(eg.net_hakedis_tl)}
                            </strong>
                          </p>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setHata("");
                            setSaatAcilanEgitimId(saatEkleAcik ? null : eg.canli_egitim_id);
                          }}
                        >
                          <CalendarPlus size={13} aria-hidden="true" />
                          {saatEkleAcik ? "Vazgeç" : "+ Yeni Saat Aç"}
                        </Button>
                      </div>

                      {/* Mevcut eğitime hızlı yeni saat açma çekmecesi */}
                      {saatEkleAcik && (
                        <form
                          onSubmit={(ev) => void mevcutEgitimeOturumEkle(ev, eg.canli_egitim_id)}
                          className="space-y-2.5 rounded-lg border border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)] p-3"
                        >
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label
                                htmlFor={`oturum-tarih-${eg.canli_egitim_id}`}
                                className="mb-1 block text-xs font-semibold text-[var(--tema-ikincil-metin)]"
                              >
                                Yayın Tarihi
                              </label>
                              <Input
                                id={`oturum-tarih-${eg.canli_egitim_id}`}
                                type="date"
                                required
                                value={oturumTarihi}
                                onChange={(e) => setOturumTarihi(e.target.value)}
                              />
                            </div>
                            <div>
                              <label
                                htmlFor={`oturum-saat-${eg.canli_egitim_id}`}
                                className="mb-1 block text-xs font-semibold text-[var(--tema-ikincil-metin)]"
                              >
                                Başlangıç (TR)
                              </label>
                              <Input
                                id={`oturum-saat-${eg.canli_egitim_id}`}
                                type="time"
                                required
                                value={oturumSaati}
                                onChange={(e) => setOturumSaati(e.target.value)}
                              />
                            </div>
                          </div>

                          {mevcutEgitimSaatCakismasi && (
                            <p className="m-0 text-xs font-medium text-red-600">
                              Seçilen saat başka bir yayınınızla veya{" "}
                              {CANLI_YAYIN_TAMPON_DAKIKA} dakikalık ara tamponla çakışıyor.
                            </p>
                          )}

                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] text-[var(--tema-ikincil-metin)]">
                              {CANLI_YAYIN_TAMPON_DAKIKA} dk ara tampon uygulanır
                            </span>
                            <Button
                              type="submit"
                              size="sm"
                              disabled={oturumKaydediliyor || mevcutEgitimSaatCakismasi}
                            >
                              {oturumKaydediliyor ? "Ekleniyor..." : "Takvime Ekle & Yayınla"}
                            </Button>
                          </div>
                        </form>
                      )}

                      {/* Bu eğitime bağlı oturum saatleri */}
                      <div className="space-y-2 border-t border-[var(--tema-cizgi)] pt-2.5 text-xs">
                        {grupOturumlari.length === 0 ? (
                          <p className="m-0 text-xs text-[var(--tema-ikincil-metin)]">
                            Henüz bu eğitim için açılmış bir takvim saati yok. &ldquo;+ Yeni Saat Aç&rdquo; ile ekleyebilirsiniz.
                          </p>
                        ) : (
                          grupOturumlari.map((o) => (
                            <div
                              key={o.oturum_id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)] px-3 py-2"
                            >
                              <div>
                                <div className="flex items-center gap-1.5 font-semibold text-[var(--tema-baslik)]">
                                  <Clock size={12} aria-hidden="true" />
                                  {TARIH_SAAT_BICIMI.format(new Date(o.baslangic_at))}
                                </div>
                                {o.durum === "musait" && (
                                  <div className="text-blue-700">Agora’da Satışta (Müsait)</div>
                                )}
                                {o.durum === "rezerve" && (
                                  <div className="font-medium text-emerald-700">
                                    Satın Alındı
                                    {o.satin_alan_firma_adi ? ` · ${o.satin_alan_firma_adi}` : ""}
                                  </div>
                                )}
                                {o.durum === "tamamlandi" && (
                                  <div className="text-slate-600">Tamamlandı</div>
                                )}
                                {o.durum === "iptal" && (
                                  <div className="text-red-600">İptal Edildi</div>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5">
                                {o.durum === "musait" && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={iptalEdilenId === o.oturum_id}
                                    onClick={() => void oturumIptalEt(o.oturum_id)}
                                  >
                                    <Trash2 size={13} aria-hidden="true" />
                                    İptal Et
                                  </Button>
                                )}
                                {o.durum === "rezerve" && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    disabled={baslatilanId === o.oturum_id}
                                    onClick={() => void yayiniBaslat(o.oturum_id)}
                                  >
                                    <Radio size={13} aria-hidden="true" />
                                    {baslatilanId === o.oturum_id ? "Açılıyor..." : "Yayını Başlat"}
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </PartnerKabugu>
  );
}
