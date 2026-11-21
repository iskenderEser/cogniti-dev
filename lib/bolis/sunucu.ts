import "server-only";
import { randomBytes } from "crypto";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { rolCozucu } from "@/lib/utils/rolCozucu";
import {
  BOLIS_DURUMLARI,
  BOLIS_HEDEF_ROLLER,
  BOLIS_KAYIT_TIPLERI,
  BOLIS_YAYIN_ARACLARI,
  bolisYoneticiMi,
  type BolisHedefRol,
  type BolisKayitTipi,
  type BolisSecenek,
  type BolisSinavDurumu,
  type BolisYayinAraci,
} from "@/lib/bolis/tipler";

export const UUID_DESEN =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export function uuidGecerliMi(deger: unknown): deger is string {
  return typeof deger === "string" && UUID_DESEN.test(deger.trim());
}

export function erisimKoduUret(): string {
  return randomBytes(6).toString("base64url").replace(/[^a-zA-Z0-9]/g, "").slice(0, 10).toUpperCase();
}

export function davetKoduUret(): string {
  return randomBytes(12).toString("base64url").replace(/[^a-zA-Z0-9]/g, "").slice(0, 16);
}

export async function bolisBaglami() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;

  const db = createAdminClient();
  const rol = await rolCozucu(db, user.id);
  const { data: kullanici } = await db
    .from("kullanicilar")
    .select("firma_id")
    .eq("kullanici_id", user.id)
    .maybeSingle();

  const firmaId = typeof kullanici?.firma_id === "string" ? kullanici.firma_id : null;
  return {
    db,
    authId: user.id,
    rol,
    firmaId,
    yoneticiMi: bolisYoneticiMi(rol),
  };
}

export interface DogrulanmisSoru {
  sira: number;
  soru_metni: string;
  secenekler: BolisSecenek[];
  dogru_secenek: string;
  puan: number;
}

export interface DogrulanmisDavetli {
  ad: string;
  soyad: string;
  eposta: string | null;
  telefon: string | null;
  rol_grubu: BolisHedefRol | null;
  takim_adi: string | null;
  bolge_adi: string | null;
  eczane_adi: string | null;
}

export interface DogrulanmisSinavGirdisi {
  baslik: string;
  aciklama: string;
  hedef_roller: BolisHedefRol[];
  yayin_araci: BolisYayinAraci;
  yayin_video_guid: string | null;
  yayin_dosya_yolu: string | null;
  yayin_viva_etkinlik_id: string | null;
  yayin_baslik: string | null;
  sure_modu: "sabit_pencere";
  sure_dakika: number;
  baslangic_at: string;
  bitis_at: string;
  kayit_tipi: BolisKayitTipi;
  durum: BolisSinavDurumu;
  sorular: DogrulanmisSoru[];
  davetliler: DogrulanmisDavetli[];
}

function metinTemizle(deger: unknown, maks: number): string {
  return typeof deger === "string" ? deger.trim().slice(0, maks) : "";
}

function opsiyonelMetin(deger: unknown, maks: number): string | null {
  const s = metinTemizle(deger, maks);
  return s.length > 0 ? s : null;
}

function tarihIsoCoz(deger: unknown): string | null {
  if (typeof deger !== "string" || !deger.trim()) return null;
  const ms = Date.parse(deger.trim());
  if (!Number.isFinite(ms)) return null;
  return new Date(ms).toISOString();
}

export function bolisSinavDogrula(
  body: Record<string, unknown>,
): { ok: true; veri: DogrulanmisSinavGirdisi } | { ok: false; hata: string } {
  const baslik = metinTemizle(body.baslik, 200);
  if (baslik.length < 2) {
    return { ok: false, hata: "Sınav başlığı en az 2 karakter olmalıdır." };
  }

  const aciklama = metinTemizle(body.aciklama, 2000);

  const hamHedefler = Array.isArray(body.hedef_roller) ? body.hedef_roller : [];
  const hedefSeti = new Set<BolisHedefRol>();
  for (const r of hamHedefler) {
    if (typeof r === "string" && (BOLIS_HEDEF_ROLLER as readonly string[]).includes(r)) {
      hedefSeti.add(r as BolisHedefRol);
    }
  }
  const hedef_roller = BOLIS_HEDEF_ROLLER.filter((r) => hedefSeti.has(r));
  if (hedef_roller.length === 0) {
    return { ok: false, hata: "En az bir hedef kitle seçmelisiniz." };
  }

  const yayin_araci =
    typeof body.yayin_araci === "string" &&
    (BOLIS_YAYIN_ARACLARI as readonly string[]).includes(body.yayin_araci)
      ? (body.yayin_araci as BolisYayinAraci)
      : "yayin_yok";

  let yayin_video_guid: string | null = null;
  let yayin_dosya_yolu: string | null = null;
  const yayin_viva_etkinlik_id: string | null = null;
  const yayin_baslik = opsiyonelMetin(body.yayin_baslik, 240);

  if (yayin_araci === "video") {
    const guid = metinTemizle(body.yayin_video_guid, 64);
    if (!guid || !uuidGecerliMi(guid)) {
      return { ok: false, hata: "Video aracı için bir video yükleyin veya mevcut yayın seçin." };
    }
    yayin_video_guid = guid;
  } else if (yayin_araci === "podcast" || yayin_araci === "gorsel" || yayin_araci === "flip_pdf") {
    const yol = opsiyonelMetin(body.yayin_dosya_yolu, 500);
    if (!yol) {
      return { ok: false, hata: "Seçilen yayın aracı için dosya yükleyin veya mevcut yayın seçin." };
    }
    yayin_dosya_yolu = yol;
  }

  const baslangic_at = tarihIsoCoz(body.baslangic_at);
  const bitis_at = tarihIsoCoz(body.bitis_at);
  if (!baslangic_at || !bitis_at) {
    return {
      ok: false,
      hata: "Sınav tarihi, başlangıç saati ve bitiş saatini eksiksiz girmelisiniz.",
    };
  }
  const farkDk = Math.round((Date.parse(bitis_at) - Date.parse(baslangic_at)) / 60_000);
  if (farkDk < 1 || farkDk > 480) {
    return {
      ok: false,
      hata: "Bitiş saati başlangıç saatinden sonra olmalı ve sınav süresi 1–480 dakika aralığında olmalıdır.",
    };
  }
  const sure_modu = "sabit_pencere" as const;
  const sure_dakika = farkDk;

  const kayit_tipi =
    typeof body.kayit_tipi === "string" &&
    (BOLIS_KAYIT_TIPLERI as readonly string[]).includes(body.kayit_tipi)
      ? (body.kayit_tipi as BolisKayitTipi)
      : "kendi_kaydi";

  const durum =
    typeof body.durum === "string" &&
    (BOLIS_DURUMLARI as readonly string[]).includes(body.durum)
      ? (body.durum as BolisSinavDurumu)
      : "taslak";

  const hamSorular = Array.isArray(body.sorular) ? body.sorular : [];
  if (hamSorular.length > 100) {
    return { ok: false, hata: "Bir sınavda en fazla 100 soru bulunabilir." };
  }
  if (durum === "yayinda" && hamSorular.length === 0) {
    return { ok: false, hata: "Sınavı yayınlamak için en az 1 çoktan seçmeli soru eklemelisiniz." };
  }

  const sorular: DogrulanmisSoru[] = [];
  for (let i = 0; i < hamSorular.length; i++) {
    const s = hamSorular[i] as Record<string, unknown> | null;
    if (!s || typeof s !== "object") {
      return { ok: false, hata: `${i + 1}. soru biçimi geçersiz.` };
    }
    const soru_metni = metinTemizle(s.soru_metni, 2000);
    if (!soru_metni) {
      return { ok: false, hata: `${i + 1}. sorunun metni boş olamaz.` };
    }
    const puan = Math.round(Number(s.puan) * 100) / 100;
    if (!Number.isFinite(puan) || puan <= 0 || puan > 10000) {
      return { ok: false, hata: `${i + 1}. sorunun puanı 0’dan büyük olmalıdır.` };
    }
    const hamSecenekler = Array.isArray(s.secenekler) ? s.secenekler : [];
    if (hamSecenekler.length < 2 || hamSecenekler.length > 10) {
      return { ok: false, hata: `${i + 1}. soruda 2 ile 10 arasında seçenek olmalıdır.` };
    }
    const secenekler: BolisSecenek[] = [];
    const anahtarlar = new Set<string>();
    for (let j = 0; j < hamSecenekler.length; j++) {
      const opt = hamSecenekler[j] as Record<string, unknown> | null;
      const anahtar = metinTemizle(opt?.anahtar, 8) || String.fromCharCode(65 + j);
      const metin = metinTemizle(opt?.metin, 500);
      if (!metin) {
        return { ok: false, hata: `${i + 1}. sorunun ${anahtar} seçeneği boş olamaz.` };
      }
      if (anahtarlar.has(anahtar)) {
        return { ok: false, hata: `${i + 1}. soruda yinelenen seçenek anahtarı var.` };
      }
      anahtarlar.add(anahtar);
      secenekler.push({ anahtar, metin });
    }
    const dogru_secenek = metinTemizle(s.dogru_secenek, 8);
    if (!anahtarlar.has(dogru_secenek)) {
      return { ok: false, hata: `${i + 1}. soru için doğru seçenek seçmelisiniz.` };
    }
    sorular.push({
      sira: i + 1,
      soru_metni,
      secenekler,
      dogru_secenek,
      puan,
    });
  }

  const hamDavetliler = Array.isArray(body.davetliler) ? body.davetliler : [];
  const davetliler: DogrulanmisDavetli[] = [];
  for (const item of hamDavetliler) {
    if (!item || typeof item !== "object") continue;
    const d = item as Record<string, unknown>;
    const ad = metinTemizle(d.ad, 100);
    const soyad = metinTemizle(d.soyad, 100);
    if (!ad || !soyad) continue;
    const rolHam = typeof d.rol_grubu === "string" ? d.rol_grubu.trim().toLowerCase() : "";
    const rol_grubu = (BOLIS_HEDEF_ROLLER as readonly string[]).includes(rolHam)
      ? (rolHam as BolisHedefRol)
      : null;
    davetliler.push({
      ad,
      soyad,
      eposta: opsiyonelMetin(d.eposta, 200)?.toLowerCase() ?? null,
      telefon: opsiyonelMetin(d.telefon, 40),
      rol_grubu,
      takim_adi: opsiyonelMetin(d.takim_adi, 120),
      bolge_adi: opsiyonelMetin(d.bolge_adi, 120),
      eczane_adi: opsiyonelMetin(d.eczane_adi, 160),
    });
  }

  if (durum === "yayinda" && kayit_tipi === "hazir_liste" && davetliler.length === 0) {
    return {
      ok: false,
      hata: "Hazır liste modunda sınavı yayınlamak için en az 1 katılımcı eklemelisiniz.",
    };
  }

  return {
    ok: true,
    veri: {
      baslik,
      aciklama,
      hedef_roller,
      yayin_araci,
      yayin_video_guid,
      yayin_dosya_yolu,
      yayin_viva_etkinlik_id,
      yayin_baslik,
      sure_modu,
      sure_dakika,
      baslangic_at,
      bitis_at,
      kayit_tipi,
      durum,
      sorular,
      davetliler,
    },
  };
}
