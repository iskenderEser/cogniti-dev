import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { uuidGecerliMi } from "@/lib/uretim/rpcTemel";
import { hataYaniti, validasyonHatasi, sunucuHatasi } from "@/lib/utils/hataIsle";

export interface AdminEczanemUye {
  musteri_id: string;
  eczane_id: string;
  ad_soyad: string;
  telefon: string;
  eposta: string | null;
  eczane_adi: string;
  gln: string;
  il: string | null;
  ilce: string | null;
  aktif_mi: boolean;
  hesap_aktif_mi: boolean;
  created_at: string;
  son_islem_tarihi: string | null;
}
export interface AdminEczanemUyeVerisi {
  uyeler: AdminEczanemUye[];
  eczaneler: Array<{ eczane_id: string; eczane_adi: string; gln: string }>;
  ozet: { toplam_uye: number; aktif_uyelik: number; pasif_uyelik: number };
  sayfalama: { sayfa: number; toplam_sayfa: number; toplam: number; limit: number };
}

type AdminKontrol = { gecerli: true; kullaniciId: string } | { gecerli: false; yanit: ReturnType<typeof hataYaniti> };
type Bagimliliklar = { kontrol: () => Promise<AdminKontrol>; admin: () => SupabaseClient };
type Baglam = { params: Promise<{ firma_id: string }> };

function rpcHatasi(error: { code?: string; message?: string }) {
  if (["PGRST202", "42883", "42P01", "PGRST205"].includes(error.code ?? "")) {
    return hataYaniti("Üye yönetimi kurulumu gerekli: scripts/sql/admin_eczanem_uye_yonetimi.sql dosyasını çalıştırın.", "Admin Eczanem kurulumu", null, 503);
  }
  const durum = error.code === "42501" ? 403 : error.code === "P0002" ? 404
    : error.code === "40001" ? 409 : ["22023", "23514"].includes(error.code ?? "") ? 400 : 500;
  return hataYaniti(durum < 500 ? error.message ?? "Üyelik işlemi reddedildi." : "Üye yönetimi işlemi tamamlanamadı.", "Admin Eczanem RPC", error, durum);
}

export function adminEczanemUyeIsleyicileri({ kontrol, admin }: Bagimliliklar) {
  return {
    async GET(request: Request, baglam: Baglam) {
      try {
        const yetki = await kontrol();
        if (!yetki.gecerli) return yetki.yanit;
        const { firma_id } = await baglam.params;
        if (!uuidGecerliMi(firma_id)) return validasyonHatasi("Geçersiz firma.", ["firma_id"]);
        const sorgu = new URL(request.url).searchParams;
        const eczaneId = sorgu.get("eczane_id") || null;
        const durum = sorgu.get("durum") ?? "tumu";
        const sayfa = Number(sorgu.get("sayfa") ?? "1");
        if ((eczaneId && !uuidGecerliMi(eczaneId)) || !["tumu", "aktif", "pasif"].includes(durum)
          || !Number.isSafeInteger(sayfa) || sayfa < 1 || sayfa > 1000000) {
          return validasyonHatasi("Geçersiz liste filtresi veya sayfa.", ["eczane_id", "durum", "sayfa"]);
        }
        const arama = (sorgu.get("q") ?? "").trim().slice(0, 80);
        const db = admin();
        const { data, error } = await db.rpc("admin_eczanem_uyeleri_oku", {
          p_firma_id: firma_id, p_eczane_id: eczaneId, p_durum: durum,
          p_arama: arama, p_sayfa: sayfa, p_limit: 20,
        });
        if (error) return rpcHatasi(error);
        if (!data) return hataYaniti("Üye listesi alınamadı.", "Admin Eczanem RPC");
        const veri = data as AdminEczanemUyeVerisi;
        const glnler = [...new Set(veri.uyeler.map((uye) => uye.gln).filter(Boolean))];
        const konumlar = new Map<string, { il: string | null; ilce: string | null }>();
        if (glnler.length > 0) {
          const { data: eczaneler, error: konumHatasi } = await db.from("eclub_eczane_master")
            .select("gln, il, ilce").in("gln", glnler);
          if (konumHatasi) return hataYaniti("Eczane il ve ilçe bilgileri alınamadı.", "Admin Eczanem eczane konumu", konumHatasi);
          for (const eczane of eczaneler ?? []) konumlar.set(eczane.gln, { il: eczane.il, ilce: eczane.ilce });
        }
        return NextResponse.json({ ...veri, uyeler: veri.uyeler.map((uye) => ({
          ...uye, telefon: `••• ••• ${uye.telefon.replace(/\D/g, "").slice(-4)}`,
          il: konumlar.get(uye.gln)?.il ?? null, ilce: konumlar.get(uye.gln)?.ilce ?? null,
        })) }, { headers: { "Cache-Control": "no-store" } });
      } catch (error) { return sunucuHatasi(error, "GET admin Eczanem üyeler"); }
    },
    async PATCH(request: Request, baglam: Baglam) {
      try {
        const yetki = await kontrol();
        if (!yetki.gecerli) return yetki.yanit;
        const { firma_id } = await baglam.params;
        let body;
        try { body = await request.json(); } catch { return validasyonHatasi("Geçerli JSON gönderin.", ["body"]); }
        if (!body || typeof body !== "object" || !uuidGecerliMi(firma_id)
          || typeof body.musteri_id !== "string" || !uuidGecerliMi(body.musteri_id)
          || typeof body.eczane_id !== "string" || !uuidGecerliMi(body.eczane_id)
          || typeof body.aktif_mi !== "boolean" || typeof body.mevcut_aktif_mi !== "boolean") {
          return validasyonHatasi("Firma, üye, eczane ve üyelik durumları zorunludur.", ["firma_id", "musteri_id", "eczane_id", "aktif_mi", "mevcut_aktif_mi"]);
        }
        const { data, error } = await admin().rpc("admin_eczanem_uyelik_durum_degistir", {
          p_admin_id: yetki.kullaniciId, p_firma_id: firma_id, p_musteri_id: body.musteri_id,
          p_eczane_id: body.eczane_id, p_aktif_mi: body.aktif_mi, p_mevcut_aktif_mi: body.mevcut_aktif_mi,
        });
        if (error) return rpcHatasi(error);
        if (!data?.ok) return hataYaniti("Üyelik durumu güncellenemedi.", "Admin Eczanem RPC");
        return NextResponse.json({ ok: true, mesaj: body.aktif_mi ? "Üyelik aktifleştirildi." : "Üyelik pasife alındı." });
      } catch (error) { return sunucuHatasi(error, "PATCH admin Eczanem üyeler"); }
    },
  };
}
