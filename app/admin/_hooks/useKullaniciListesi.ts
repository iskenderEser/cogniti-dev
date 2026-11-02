// app/admin/_hooks/useKullaniciListesi.ts
//
// Kullanıcı listesi sekmesinin state + handler'ları: arama, rol/aktif/yetki
// toggle'ları, silme onayı, toplu seçim/silme/pasife alma. useAdminPanel shell'den
// seciliFirma, kullanicilar, refreshKullanicilar, hata, basari prop'larını alır.
// seciliFirma değişince arama + işlem state'leri sıfırlanır.

"use client";

import { useState, useMemo, useEffect } from "react";
import type { Firma, Kullanici } from "../_types";
import { ROL_ADLARI } from "@/lib/utils/roller";
import { telefonBicimle } from "@/lib/admin/telefonBicim";

export const KULLANICI_SUTUNLARI = [
  ["kullanici", "Kullanıcı"], ["rol", "Rol"], ["eposta", "E-posta"],
  ["telefon", "Cep Telefonu"], ["takim", "Takım"], ["bolge", "Bölge"], ["durum", "Durum"],
] as const;
export type KullaniciSutunu = (typeof KULLANICI_SUTUNLARI)[number][0];
type SutunFiltreleri = Record<KullaniciSutunu, string>;
const BOS_SUTUN_FILTRELERI: SutunFiltreleri = { kullanici:"", rol:"", eposta:"", telefon:"", takim:"", bolge:"", durum:"" };
function sutunSecenegi(k: Kullanici, sutun: KullaniciSutunu): { deger: string; etiket: string } {
  switch (sutun) {
    case "kullanici": return { deger:k.kullanici_id, etiket:`${k.ad} ${k.soyad}` };
    case "rol": return { deger:k.rol, etiket:ROL_ADLARI[k.rol] ?? k.rol };
    case "eposta": return { deger:k.eposta || "__bos__", etiket:k.eposta || "—" };
    case "telefon": return { deger:k.telefon ? telefonBicimle(k.telefon) : "__bos__", etiket:k.telefon ? telefonBicimle(k.telefon) : "Telefon eksik" };
    case "takim": return { deger:k.takim_id || "__bos__", etiket:k.takim_adi || "—" };
    case "bolge": return { deger:k.bolge_id || "__bos__", etiket:k.bolge_adi || "—" };
    case "durum": return { deger:k.aktif_mi ? "aktif" : "pasif", etiket:k.aktif_mi ? "Aktif" : "Pasif" };
  }
}

interface UseKullaniciListesiProps {
  seciliFirma: Firma | null;
  kullanicilar: Kullanici[];
  refreshKullanicilar: () => void;
  hata: (mesaj: string, adim?: string, detay?: string) => void;
  basari: (mesaj: string) => void;
}

export function useKullaniciListesi({ seciliFirma, kullanicilar, refreshKullanicilar, hata, basari }: UseKullaniciListesiProps) {
  // Arama
  const [aramaMetni, setAramaMetni] = useState("");
  const [arananMetin, setArananMetin] = useState("");
  const [sutunFiltreleri, setSutunFiltreleri] = useState<SutunFiltreleri>(BOS_SUTUN_FILTRELERI);

  // İşlem state'leri
  const [acikRolId, setAcikRolId] = useState<string | null>(null);
  const [rolDegistirLoading, setRolDegistirLoading] = useState<string | null>(null);
  const [aktifToggleLoading, setAktifToggleLoading] = useState<string | null>(null);
  const [silOnayId, setSilOnayId] = useState<string | null>(null);
  const [silLoading, setSilLoading] = useState<string | null>(null);
  const [seciliKullanicilar, setSeciliKullanicilar] = useState<Set<string>>(new Set());
  const [topluSilOnay, setTopluSilOnay] = useState(false);
  const [topluIslemLoading, setTopluIslemLoading] = useState(false);
  const [yetkiLoading, setYetkiLoading] = useState<string | null>(null);

  const sutunSecenekleri = useMemo(() => Object.fromEntries(KULLANICI_SUTUNLARI.map(([sutun]) => {
    const tekil = new Map(kullanicilar.map(k => { const s = sutunSecenegi(k, sutun); return [s.deger, s] as const; }));
    return [sutun, [...tekil.values()].sort((a,b) => a.etiket.localeCompare(b.etiket, "tr-TR"))];
  })) as Record<KullaniciSutunu, { deger:string; etiket:string }[]>, [kullanicilar]);

  const filtrelenmisKullanicilar = useMemo(() => {
    const arama = arananMetin.toLocaleLowerCase("tr-TR");
    return kullanicilar.filter(k => (arama === "" || [k.ad, k.soyad, k.eposta, k.rol, k.takim_adi, k.bolge_adi]
      .some(v => v?.toLocaleLowerCase("tr-TR").includes(arama))) &&
      KULLANICI_SUTUNLARI.every(([sutun]) => !sutunFiltreleri[sutun] || sutunSecenegi(k, sutun).deger === sutunFiltreleri[sutun]));
  }, [kullanicilar, arananMetin, sutunFiltreleri]);

  const handleSutunFiltrele = (sutun: KullaniciSutunu, deger: string) => setSutunFiltreleri(prev => ({ ...prev, [sutun]:deger }));

  const handleAra = () => setArananMetin(aramaMetni.trim());

  const tumSeciliMi = filtrelenmisKullanicilar.length > 0 &&
    filtrelenmisKullanicilar.every(k => seciliKullanicilar.has(k.kullanici_id));

  const sifirlaIslemler = () => {
    setAcikRolId(null);
    setSilOnayId(null);
    setSeciliKullanicilar(new Set());
    setTopluSilOnay(false);
  };

  // seciliFirma değişince arama + işlem state'leri sıfırla
  useEffect(() => {
    setAramaMetni("");
    setArananMetin("");
    setSutunFiltreleri(BOS_SUTUN_FILTRELERI);
    sifirlaIslemler();
  }, [seciliFirma?.firma_id]);

  // Kullanıcı düzenleme (25.07): modal tekil giriş kartıyla aynı alanları taşır,
  // kullanici_id sabit kalır — üretilen puan/içerik etkilenmez.
  const handleKullaniciGuncelle = async (kullanici_id: string, veri: Record<string, unknown>) => {
    if (!seciliFirma) return;
    setDuzenleLoading(true);
    try {
      const res = await fetch(`/admin/api/firmalar/${seciliFirma.firma_id}/kullanicilar`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kullanici_id, ...veri }),
      });
      const data = await res.json();
      if (!res.ok) { hata(data.hata ?? "Kullanıcı güncellenemedi.", data.adim, data.detay); }
      else { basari(data.mesaj ?? "Kullanıcı güncellendi."); setDuzenlenenId(null); refreshKullanicilar(); }
    } catch (err) {
      hata("Kullanıcı güncellenemedi — bağlantı hatası.", "handleKullaniciGuncelle", String(err));
    } finally {
      setDuzenleLoading(false);
    }
  };

  const handleRolDegistir = async (kullanici_id: string, yeniRol: string) => {
    if (!seciliFirma) return;
    setAcikRolId(null);
    setRolDegistirLoading(kullanici_id);
    try {
      const res = await fetch(`/admin/api/firmalar/${seciliFirma.firma_id}/kullanicilar`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kullanici_id, rol: yeniRol }),
      });
      const data = await res.json();
      if (!res.ok) { hata(data.hata ?? "Rol güncellenemedi.", data.adim, data.detay); }
      else { basari("Rol güncellendi."); refreshKullanicilar(); }
    } catch (err) {
      // B-32: ağ hatasında yükleme durumu takılı kalmaz.
      hata("Rol güncellenemedi — bağlantı hatası.", "handleRolDegistir", String(err));
    } finally {
      setRolDegistirLoading(null);
    }
  };

  const handleAktifToggle = async (kullanici_id: string, mevcutDurum: boolean) => {
    if (!seciliFirma) return;
    setAktifToggleLoading(kullanici_id);
    try {
      const res = await fetch(`/admin/api/firmalar/${seciliFirma.firma_id}/kullanicilar`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kullanici_id, aktif_mi: !mevcutDurum }),
      });
      const data = await res.json();
      if (!res.ok) { hata(data.hata ?? "Durum güncellenemedi.", data.adim, data.detay); }
      else { basari(mevcutDurum ? "Pasife alındı." : "Aktif edildi."); refreshKullanicilar(); }
    } catch (err) {
      hata("Durum güncellenemedi — bağlantı hatası.", "handleAktifToggle", String(err));
    } finally {
      setAktifToggleLoading(null);
    }
  };

  const handleYetkiDegistir = async (kullanici_id: string, alan: "yetki_kullanici_yonetim" | "yetki_aktif_pasif", mevcutDeger: boolean) => {
    if (!seciliFirma) return;
    setYetkiLoading(kullanici_id + alan);
    try {
      const res = await fetch(`/admin/api/firmalar/${seciliFirma.firma_id}/kullanicilar`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kullanici_id, [alan]: !mevcutDeger }),
      });
      const data = await res.json();
      if (!res.ok) { hata(data.hata ?? "Yetki güncellenemedi.", data.adim, data.detay); }
      else { basari(mevcutDeger ? "Yetki kaldırıldı." : "Yetki tanımlandı."); refreshKullanicilar(); }
    } catch (err) {
      hata("Yetki güncellenemedi — bağlantı hatası.", "handleYetkiDegistir", String(err));
    } finally {
      setYetkiLoading(null);
    }
  };

  // K-A6 tamamlama akışı: eksik bilgili kullanıcıya rol değişmeden
  // takım ya da bölge atanır (PUT — mevcut rolün kurallarıyla çözülür).
  const [eksikTamamlaLoading, setEksikTamamlaLoading] = useState<string | null>(null);
  const handleEksikTamamla = async (kullanici_id: string, atama: { takim_id?: string; bolge_id?: string }) => {
    if (!seciliFirma) return;
    setEksikTamamlaLoading(kullanici_id);
    try {
      const res = await fetch(`/admin/api/firmalar/${seciliFirma.firma_id}/kullanicilar`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kullanici_id, ...atama }),
      });
      const data = await res.json();
      if (!res.ok) { hata(data.hata ?? "Atama yapılamadı.", data.adim, data.detay); }
      else { basari("Eksik bilgi tamamlandı."); refreshKullanicilar(); }
    } catch (err) {
      hata("Atama yapılamadı — bağlantı hatası.", "handleEksikTamamla", String(err));
    } finally {
      setEksikTamamlaLoading(null);
    }
  };

  // Telefonu boş (kolon öncesi) mevcut kullanıcıya tekil telefon ekleme —
  // PUT normalize/benzersizlik kurallarını uygular, hata Türkçe döner.
  const [telefonEkleLoading, setTelefonEkleLoading] = useState<string | null>(null);
  const [duzenlenenId, setDuzenlenenId] = useState<string | null>(null);
  const [duzenleLoading, setDuzenleLoading] = useState(false);
  const handleTelefonEkle = async (kullanici_id: string, telefon: string) => {
    if (!seciliFirma) return;
    setTelefonEkleLoading(kullanici_id);
    try {
      const res = await fetch(`/admin/api/firmalar/${seciliFirma.firma_id}/kullanicilar`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kullanici_id, telefon }),
      });
      const data = await res.json();
      if (!res.ok) { hata(data.hata ?? "Telefon kaydedilemedi.", data.adim, data.detay); }
      else { basari("Telefon kaydedildi."); refreshKullanicilar(); }
    } catch (err) {
      hata("Telefon kaydedilemedi — bağlantı hatası.", "handleTelefonEkle", String(err));
    } finally {
      setTelefonEkleLoading(null);
    }
  };

  const handleSil = async (kullanici_id: string) => {
    if (!seciliFirma) return;
    setSilLoading(kullanici_id);
    setSilOnayId(null);
    try {
      const res = await fetch(`/admin/api/firmalar/${seciliFirma.firma_id}/kullanicilar`, {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kullanici_id }),
      });
      const data = await res.json();
      if (!res.ok) { hata(data.hata ?? "Kullanıcı silinemedi.", data.adim, data.detay); }
      else { basari("Silme işlemi başarılı."); refreshKullanicilar(); }
    } catch (err) {
      hata("Kullanıcı silinemedi — bağlantı hatası.", "handleSil", String(err));
    } finally {
      setSilLoading(null);
    }
  };

  // B-19: toplu işlemler satır yanıtlarını OKUR ve dürüst raporlar —
  // kısmi başarısızlıkta hangi kullanıcıda ne hata olduğu söylenir.
  const topluIslemKos = async (
    hedefIdler: string[],
    istek: (kullanici_id: string) => Promise<Response>,
    basariMesaji: (adet: number) => string,
    hataBasligi: string
  ) => {
    if (!seciliFirma || hedefIdler.length === 0) return;
    setTopluIslemLoading(true);
    try {
    let basarili = 0;
    const hatalar: string[] = [];
    for (const kullanici_id of hedefIdler) {
      const k = kullanicilar.find(x => x.kullanici_id === kullanici_id);
      const kimlik = k ? `${k.ad} ${k.soyad}` : kullanici_id;
      try {
        const res = await istek(kullanici_id);
        const data = await res.json().catch(() => ({}));
        if (res.ok) basarili++;
        else hatalar.push(`${kimlik}: ${data.hata ?? "işlem başarısız"}`);
      } catch {
        hatalar.push(`${kimlik}: ağ hatası`);
      }
    }
    if (hatalar.length === 0) {
      basari(basariMesaji(basarili));
      setSeciliKullanicilar(new Set());
    } else {
      // Başarısız kalanlar seçili bırakılır — admin görebilsin/yeniden deneyebilsin.
      hata(`${hataBasligi}: ${basarili} başarılı, ${hatalar.length} başarısız.`, "toplu işlem", hatalar.join(" | "));
      setSeciliKullanicilar(new Set(hedefIdler.filter(id => hatalar.some(h => {
        const k = kullanicilar.find(x => x.kullanici_id === id);
        return h.startsWith(k ? `${k.ad} ${k.soyad}` : id);
      }))));
    }
    setTopluSilOnay(false);
    refreshKullanicilar();
    } finally {
      // B-32: her koşulda yükleme durumu kapanır.
      setTopluIslemLoading(false);
    }
  };

  const handleTopluPasif = async () => {
    if (!seciliFirma) return;
    const hedefler = Array.from(seciliKullanicilar).filter(id => {
      const k = kullanicilar.find(x => x.kullanici_id === id);
      return k && k.aktif_mi;
    });
    await topluIslemKos(
      hedefler,
      (kullanici_id) => fetch(`/admin/api/firmalar/${seciliFirma.firma_id}/kullanicilar`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kullanici_id, aktif_mi: false }),
      }),
      (adet) => `${adet} kullanıcı pasife alındı.`,
      "Pasife alma"
    );
  };

  const handleTopluSil = async () => {
    if (!seciliFirma) return;
    await topluIslemKos(
      Array.from(seciliKullanicilar),
      (kullanici_id) => fetch(`/admin/api/firmalar/${seciliFirma.firma_id}/kullanicilar`, {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kullanici_id }),
      }),
      (adet) => `${adet} kullanıcı silindi.`,
      "Silme"
    );
  };

  const toggleSecim = (kullanici_id: string, secildi: boolean) => {
    const yeni = new Set(seciliKullanicilar);
    secildi ? yeni.add(kullanici_id) : yeni.delete(kullanici_id);
    setSeciliKullanicilar(yeni);
  };

  const toggleTumSecim = (secildi: boolean) => {
    const yeni = new Set(seciliKullanicilar);
    filtrelenmisKullanicilar.forEach(k => secildi ? yeni.add(k.kullanici_id) : yeni.delete(k.kullanici_id));
    setSeciliKullanicilar(yeni);
  };

  return {
    // Arama
    aramaMetni, setAramaMetni, handleAra,

    sutunFiltreleri, sutunSecenekleri, handleSutunFiltrele,

    // Görünen kayıtlar
    filtrelenmisKullanicilar,
    tumSeciliMi,

    // İşlem state'leri
    acikRolId, setAcikRolId,
    rolDegistirLoading,
    aktifToggleLoading,
    silOnayId, setSilOnayId,
    silLoading,
    seciliKullanicilar,
    topluSilOnay, setTopluSilOnay,
    topluIslemLoading,
    yetkiLoading,

    // Handler'lar
    eksikTamamlaLoading,
    handleEksikTamamla,
    telefonEkleLoading,
    handleTelefonEkle,
    duzenlenenId, setDuzenlenenId,
    duzenleLoading,
    handleKullaniciGuncelle,
    handleRolDegistir,
    handleAktifToggle,
    handleYetkiDegistir,
    handleSil,
    handleTopluPasif,
    handleTopluSil,
    toggleSecim,
    toggleTumSecim,
  };
}