// app/profil/page.tsx
"use client";

import { createClient } from "@/lib/supabase/client";
import { TUKETICI_ROLLER, eclubKisiRolEtiketi } from "@/lib/utils/roller";
import { useEffect, useState, useRef } from "react";
import { HataMesajiContainer, useHataMesaji } from "@/components/HataMesaji";
import { useAuth } from "@/app/providers/AuthProvider";
import { logoGorseliniOptimizeEt } from "@/lib/firma/logoOptimizasyonIstemci";
import { profilFotoGirisDogrula, profilFotoCiktiDogrula } from "@/lib/profil/fotoDogrula";

interface Profil {
  kullanici_id: string;
  ad: string;
  soyad: string;
  eposta: string;
  rol: string;
  firma_adi: string | null;
  takim_adi: string | null;
  bolge_adi: string | null;
  fotograf_url: string | null;
  telefon?: string | null;
  eczane_adi?: string | null;
}

interface Izleme {
  haftalik: number;
  aylik: number;
  ytd: number;
}

interface PuanDagilimi {
  izleme_puani: number;
  cevaplama_puani: number;
  oneri_puani: number;
  extra_puani: number;
  eclub_puani: number;
}

interface Siralama {
  firma_sirasi: number | null;
  takim_sirasi: number | null;
  bolge_sirasi: number | null;
}

export default function ProfilPage() {
  const { kullanici, yukleniyor: authYukleniyor } = useAuth();
  const [profil, setProfil] = useState<Profil | null>(null);
  const [izleme, setIzleme] = useState<Izleme | null>(null);
  const [puanDagilimi, setPuanDagilimi] = useState<PuanDagilimi | null>(null);
  const [siralama, setSiralama] = useState<Siralama | null>(null);
  const [loading, setLoading] = useState(true);
  const [fotografLoading, setFotografLoading] = useState(false);
  const [sifreLoading, setSifreLoading] = useState(false);
  const [mevcutSifre, setMevcutSifre] = useState("");
  const [yeniSifre, setYeniSifre] = useState("");
  const [yeniSifreTekrar, setYeniSifreTekrar] = useState("");
  const dosyaInputRef = useRef<HTMLInputElement>(null);
  const { mesajlar, hata, basari } = useHataMesaji();

  useEffect(() => {
    if (!kullanici) return;
    const veriCek = async () => {
      setLoading(true);
      const res = await fetch("/profil/api");
      const data = await res.json();
      if (!res.ok) { hata(data.hata ?? "Profil yüklenemedi.", data.adim, data.detay); }
      else {
        setProfil(data.profil);
        if (data.izleme) setIzleme(data.izleme);
        if (data.puan_dagilimi) setPuanDagilimi(data.puan_dagilimi);
        if (data.siralama) setSiralama(data.siralama);
      }
      setLoading(false);
    };
    veriCek();
  }, [kullanici]);

  const handleFotografSec = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const dosya = e.target.files?.[0];
    if (!dosya) return;
    if (!kullanici) return;

    // 1. Optimizasyon öncesi giriş dosyası boyut ve format doğrulaması (maks 10 MB, JPG/PNG/WebP)
    const girisKontrol = profilFotoGirisDogrula(dosya);
    if (!girisKontrol.gecerli) {
      hata(girisKontrol.hata!, "dosya kontrolü", undefined);
      if (e.target) e.target.value = "";
      return;
    }

    setFotografLoading(true);
    try {
      // 2. Büyük dosyaları yüklemeden önce istemci tarafında optimize et (400x400 px, yüksek kalite, hafif boyut)
      const optimizeDosya = await logoGorseliniOptimizeEt(dosya, {
        maxWidth: 400,
        maxHeight: 400,
        kalite: 0.88,
      });

      // 3. Optimizasyon sonrası çıktı boyutu doğrulaması (maks 500 KB) ve başarısızlık kontrolü
      const ciktiKontrol = profilFotoCiktiDogrula(dosya, optimizeDosya);
      if (!ciktiKontrol.gecerli) {
        hata(ciktiKontrol.hata!, "optimizasyon doğrulama", undefined);
        return;
      }

      const supabase = createClient();
      const uzanti = optimizeDosya.type === "image/jpeg" ? "jpg" : optimizeDosya.type === "image/webp" ? "webp" : "png";
      const dosyaAdi = `${kullanici.id}-${Date.now()}.${uzanti}`;
      const { error: uploadError } = await supabase.storage.from("profil-fotograflari").upload(dosyaAdi, optimizeDosya, { upsert: true });
      if (uploadError) {
        hata("Fotoğraf yüklenemedi.", "storage upload", uploadError.message);
        return;
      }
      const { data: urlData } = supabase.storage.from("profil-fotograflari").getPublicUrl(dosyaAdi);
      const fotograf_url = urlData.publicUrl;
      const res = await fetch("/profil/api", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fotograf_url }),
      });
      const data = await res.json();
      if (!res.ok) {
        hata(data.hata ?? "Fotoğraf kaydedilemedi.", data.adim, data.detay);
      } else {
        basari("Fotoğraf güncellendi.");
        setProfil(prev => prev ? { ...prev, fotograf_url } : prev);
      }
    } catch (err: unknown) {
      hata("Fotoğraf optimize edilirken veya yüklenirken bir sorun oluştu.", "fotoğraf yükleme", err instanceof Error ? err.message : undefined);
    } finally {
      setFotografLoading(false);
      if (e.target) {
        e.target.value = "";
      }
    }
  };

  const handleFotografSil = async () => {
    if (!profil?.fotograf_url) return;
    setFotografLoading(true);
    const supabase = createClient();
    const dosyaAdi = profil.fotograf_url.split("/").pop();
    if (dosyaAdi) await supabase.storage.from("profil-fotograflari").remove([dosyaAdi]);
    const res = await fetch("/profil/api", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fotograf_url: null }),
    });
    const data = await res.json();
    if (!res.ok) { hata(data.hata ?? "Fotoğraf silinemedi.", data.adim, data.detay); }
    else { basari("Fotoğraf silindi."); setProfil(prev => prev ? { ...prev, fotograf_url: null } : prev); }
    setFotografLoading(false);
  };

  const handleSifreDegistir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (yeniSifre !== yeniSifreTekrar) { hata("Yeni şifreler eşleşmiyor.", "şifre eşleşme kontrolü", undefined); return; }
    if (yeniSifre.length < 6) { hata("Yeni şifre en az 6 karakter olmalıdır.", "şifre uzunluk kontrolü", undefined); return; }
    setSifreLoading(true);
    const res = await fetch("/profil/api", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mevcut_sifre: mevcutSifre, yeni_sifre: yeniSifre }),
    });
    const data = await res.json();
    if (!res.ok) { hata(data.hata ?? "Şifre değiştirilemedi.", data.adim, data.detay); }
    else { basari("Şifre başarıyla güncellendi."); setMevcutSifre(""); setYeniSifre(""); setYeniSifreTekrar(""); }
    setSifreLoading(false);
  };

  const isUTT = TUKETICI_ROLLER.includes((kullanici?.rol ?? "").toLowerCase());
  const isEclubKisi = kullanici?.kimlik_turu === "eclub_kisi";

  if (authYukleniyor || !kullanici || loading) {
    return (
      <div className="min-h-screen bg-[var(--tema-yerel-hesap-sayfa-zemini-01)] flex items-center justify-center">
        <svg className="animate-spin w-6 h-6 text-[var(--tema-yerel-hesap-yardimci-metin-02)]" fill="none" viewBox="0 0 24 24">
          <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  const SolPanel = () => (
    <div className={`w-full flex-shrink-0 p-6 flex flex-col border-b md:border-b-0 border-[var(--tema-yerel-hesap-cizgi-03)] ${isEclubKisi ? "md:w-full" : "md:w-72"}`}>
      <div className="text-sm font-semibold text-[var(--tema-yerel-hesap-ana-metin-01)] mb-5">Profil Ayarları</div>

      {/* Fotoğraf + bilgiler */}
      <div className="flex flex-col items-center gap-2 mb-6">
        <div className="relative">
          {profil?.fotograf_url ? (
            <img
              src={profil.fotograf_url}
              alt="profil"
              className="w-20 h-20 rounded-full object-cover"
              style={{ border: "3px solid var(--tema-yerel-hesap-cizgi-06)" }}
            />
          ) : (
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
              style={{ background: "var(--tema-yerel-hesap-secim-zemin-02)", border: "3px solid var(--tema-yerel-hesap-cizgi-06)", color: "var(--tema-yerel-hesap-eylem-metin-02)" }}
            >
              {profil?.ad?.[0]}{profil?.soyad?.[0]}
            </div>
          )}
          {!isEclubKisi && (
            <>
              <div
                onClick={() => dosyaInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center border-2 border-[var(--tema-yerel-hesap-cizgi-07)]"
                style={{
                  background: fotografLoading ? "var(--tema-yerel-hesap-sayfa-zemini-02)" : "var(--tema-yerel-hesap-eylem-zemin-02)",
                  cursor: fotografLoading ? "wait" : "pointer",
                }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--tema-yerel-hesap-ters-metin-02)" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <input ref={dosyaInputRef} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={handleFotografSec} className="hidden" />
            </>
          )}
        </div>

        {!isEclubKisi && profil?.fotograf_url && (
          <div
            onClick={handleFotografSil}
            className="text-xs underline cursor-pointer"
            style={{ color: "var(--tema-yerel-hesap-islevsel-metin-03)" }}
          >
            Fotoğrafı sil
          </div>
        )}

        <div className="text-center">
          <div className="text-sm font-semibold text-[var(--tema-yerel-hesap-ana-metin-01)]">{profil?.ad} {profil?.soyad}</div>
          <div className="text-xs text-[var(--tema-yerel-hesap-yardimci-metin-02)] mt-0.5">{profil?.eposta}</div>
        </div>

        <div
          className="text-[10px] px-3 py-0.5 rounded-full"
          style={{ background: "var(--tema-yerel-hesap-islevsel-zemin-03)", color: "var(--tema-yerel-hesap-vurgu-metin-01)", border: "0.5px solid var(--tema-yerel-hesap-islevsel-cizgi-03)" }}
        >
          {profil?.rol ? eclubKisiRolEtiketi(profil.rol) : ""}
        </div>

        <div className="w-full flex flex-col gap-2 mt-1">
          {profil?.firma_adi && (
            <div className="flex justify-between gap-4">
              <span className="text-xs text-[var(--tema-yerel-hesap-yardimci-metin-02)]">Firma</span>
              <span className="text-xs font-semibold text-[var(--tema-yerel-hesap-ana-metin-01)] text-right">{profil.firma_adi}</span>
            </div>
          )}
          {profil?.eczane_adi && (
            <div className="flex justify-between gap-4">
              <span className="text-xs text-[var(--tema-yerel-hesap-yardimci-metin-02)]">Eczane</span>
              <span className="text-xs font-semibold text-[var(--tema-yerel-hesap-ana-metin-01)] text-right">{profil.eczane_adi}</span>
            </div>
          )}
          {profil?.telefon && (
            <div className="flex justify-between gap-4">
              <span className="text-xs text-[var(--tema-yerel-hesap-yardimci-metin-02)]">Telefon</span>
              <span className="text-xs font-semibold text-[var(--tema-yerel-hesap-ana-metin-01)]">{profil.telefon}</span>
            </div>
          )}
          {profil?.takim_adi && (
            <div className="flex justify-between">
              <span className="text-xs text-[var(--tema-yerel-hesap-yardimci-metin-02)]">Takım</span>
              <span className="text-xs font-semibold text-[var(--tema-yerel-hesap-ana-metin-01)]">{profil.takim_adi}</span>
            </div>
          )}
          {profil?.bolge_adi && (
            <div className="flex justify-between">
              <span className="text-xs text-[var(--tema-yerel-hesap-yardimci-metin-02)]">Bölge</span>
              <span className="text-xs font-semibold text-[var(--tema-yerel-hesap-ana-metin-01)]">{profil.bolge_adi}</span>
            </div>
          )}
        </div>
      </div>

      {/* Fotoğraf kuralları */}
      {!isEclubKisi && <div className="border-t border-[var(--tema-yerel-hesap-cizgi-03)] pt-5 mb-6">
        <div className="text-xs font-semibold text-[var(--tema-yerel-hesap-ana-metin-01)] mb-2">Fotoğraf kuralları</div>
        <div className="flex flex-col gap-1">
          {["300×300 piksel veya üzeri", "Beyaz veya şeffaf arka plan", "Maksimum 2 MB", "JPG veya PNG formatı", "Yüz net görünmeli"].map(k => (
            <div key={k} className="text-xs text-[var(--tema-yerel-hesap-yardimci-metin-02)]">• {k}</div>
          ))}
        </div>
      </div>}

      {/* Şifre değiştir */}
      <div className="border-t border-[var(--tema-yerel-hesap-cizgi-03)] pt-5 flex-1 flex flex-col">
        <div className="text-xs font-semibold text-[var(--tema-yerel-hesap-ana-metin-01)] mb-3">Şifre Değiştir</div>
        <form onSubmit={handleSifreDegistir} className="flex flex-col gap-2 flex-1">
          {[
            { label: "Mevcut şifre", value: mevcutSifre, onChange: setMevcutSifre },
            { label: "Yeni şifre", value: yeniSifre, onChange: setYeniSifre },
            { label: "Şifre tekrar", value: yeniSifreTekrar, onChange: setYeniSifreTekrar },
          ].map(({ label, value, onChange }) => (
            <div key={label} className="flex border border-[var(--tema-yerel-hesap-cizgi-01)] rounded-lg overflow-hidden">
              <div
                className="text-xs font-semibold flex items-center px-2 flex-shrink-0 border-r border-[var(--tema-yerel-hesap-cizgi-01)]"
                style={{ background: "var(--tema-yerel-hesap-secim-zemin-03)", color: "var(--tema-yerel-hesap-eylem-metin-02)", minWidth: "100px", fontFamily: "'Nunito', sans-serif" }}
              >
                {label}
              </div>
              <input
                type="password"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder="••••••••"
                required
                className="flex-1 border-none outline-none px-2 py-2 text-xs bg-[var(--tema-yerel-hesap-kart-01)]"
                style={{ fontFamily: "'Nunito', sans-serif" }}
              />
            </div>
          ))}
          <div className="flex-1" />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sifreLoading}
              className="text-[var(--tema-yerel-hesap-ters-metin-01)] border-none rounded-lg px-4 py-2 text-xs font-semibold"
              style={{
                background: "var(--tema-yerel-hesap-eylem-zemin-02)",
                cursor: "pointer",
                opacity: sifreLoading ? 0.6 : 1,
                fontFamily: "'Nunito', sans-serif",
              }}
            >
              {sifreLoading ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const SagPanel = () => (
    <div className="flex-1 p-6 flex flex-col">
      <div className="text-sm font-semibold text-[var(--tema-yerel-hesap-ana-metin-01)] mb-5">HB Performansım</div>

      {isUTT && izleme ? (
        <>
          {/* İzleme sayıları */}
          <div className="mb-6">
            <div className="text-xs text-[var(--tema-yerel-hesap-yardimci-metin-01)] font-light mb-2">İzleme sayıları</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { baslik: "Haftalık", deger: izleme.haftalik },
                { baslik: "Aylık", deger: izleme.aylik },
                { baslik: "YTD", deger: izleme.ytd },
              ].map(({ baslik, deger }) => (
                <div key={baslik} className="bg-[var(--tema-yerel-hesap-sayfa-zemini-01)] rounded-xl p-3 md:p-5">
                  <div className="text-xs text-[var(--tema-yerel-hesap-yardimci-metin-02)] mb-2">{baslik}</div>
                  <div className="text-2xl md:text-3xl font-semibold text-[var(--tema-yerel-hesap-ana-metin-01)]">{deger}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Puan dağılımı */}
          {puanDagilimi && (
            <div className="border-t border-[var(--tema-yerel-hesap-cizgi-03)] pt-6 mb-6">
              <div className="text-xs text-[var(--tema-yerel-hesap-yardimci-metin-01)] font-light mb-2">Puan Dağılımı</div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {[
                  { baslik: "∑ İzleme", deger: puanDagilimi.izleme_puani },
                  { baslik: "∑ Cevaplama", deger: puanDagilimi.cevaplama_puani },
                  { baslik: "∑ Öneri", deger: puanDagilimi.oneri_puani },
                  { baslik: "∑ Extra", deger: puanDagilimi.extra_puani },
                  { baslik: "∑ E-Club", deger: puanDagilimi.eclub_puani },
                ].map(({ baslik, deger }) => (
                  <div key={baslik} className="bg-[var(--tema-yerel-hesap-sayfa-zemini-01)] rounded-xl p-3 md:p-5">
                    <div className="text-xs text-[var(--tema-yerel-hesap-yardimci-metin-02)] mb-2">{baslik}</div>
                    <div className="text-xl md:text-2xl font-semibold" style={{ color: "var(--tema-yerel-hesap-eylem-metin-03)" }}>{deger}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sıralamam */}
          {siralama && (
            <div className="border-t border-[var(--tema-yerel-hesap-cizgi-03)] pt-6 flex-1 flex flex-col">
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-xs font-semibold text-[var(--tema-yerel-hesap-ana-metin-01)]">Sıralamam</span>
                <span className="hidden md:inline text-xs font-light italic text-[var(--tema-yerel-hesap-yardimci-metin-01)]">toplam izleme puanına göre sıralamadır</span>
              </div>
              <div className="flex flex-col gap-2 flex-1">
                {[
                  { baslik: "Firma sırası", deger: siralama.firma_sirasi },
                  { baslik: "Takım sırası", deger: siralama.takim_sirasi },
                  { baslik: "Bölge sırası", deger: siralama.bolge_sirasi },
                ].map(({ baslik, deger }) => (
                  <div key={baslik} className="flex items-center justify-between px-4 py-3 bg-[var(--tema-yerel-hesap-sayfa-zemini-01)] rounded-xl">
                    <span className="text-xs text-[var(--tema-yerel-hesap-yardimci-metin-02)]">{baslik}</span>
                    <span className="text-base font-semibold" style={{ color: "var(--tema-yerel-hesap-eylem-metin-03)" }}>{deger ? `#${deger}` : "—"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-sm text-[var(--tema-yerel-hesap-yardimci-metin-01)]">
          Performans verisi sadece UTT rolü için görüntülenir.
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--tema-yerel-hesap-sayfa-zemini-01)]" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <div className={`${isEclubKisi ? "max-w-xl" : "max-w-5xl"} mx-auto px-3 py-3 pb-20 md:px-6 md:py-6 md:pb-6`}>
        <div className="bg-[var(--tema-yerel-hesap-kart-01)] rounded-xl border border-[var(--tema-yerel-hesap-cizgi-01)] overflow-hidden flex flex-col md:flex-row md:min-h-[600px]">
          {SolPanel()}
          {!isEclubKisi && <div className="hidden md:block w-px bg-[var(--tema-yerel-hesap-sayfa-zemini-03)] flex-shrink-0" />}
          {!isEclubKisi && SagPanel()}
        </div>
      </div>

      <HataMesajiContainer mesajlar={mesajlar} />
    </div>
  );
}
