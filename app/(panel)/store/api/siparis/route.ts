// app/store/api/siparis/route.ts
//
// FirmaStore sipariş endpoint'i.
//
// POST   → Yeni sipariş oluştur. Body: { urun_id, adet, beklenen_baz_puan, beklenen_birim_tl }
// PATCH  → Mevcut sipariş üzerinde işlem:
//          - { siparis_id, action: 'iptal', sebep? } — kullanıcı kendi siparişini iptal eder
//          - { siparis_id, action: 'teslim_aldim' } — kullanıcı teslim aldı onayı
//
// Tüm iş mantığı RPC'lerde:
//   - store_siparis_olustur (atomik stok + bakiye + sipariş + harcama)
//   - store_siparis_iptal (yetki + 12 saat + stok iade + puan iade)
//   - store_teslim_aldim (durum geçişi onayı)
//
// Firma modül ve ürün erişimi store_siparis_olustur güvenlik sarmalayıcısında
// yeniden doğrulanır; istemci vitrinini aşan doğrudan istek sipariş oluşturamaz.

import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import {
  hataYaniti,
  sunucuHatasi,
  yetkiHatasi,
  rolHatasi,
  validasyonHatasi,
  isKuraluHatasi,
} from "@/lib/utils/hataIsle";
import { bazPuanGecerliMi, minimumSiparisTlGecerliMi } from "@/lib/tclub/store/katalog";
import { cokluTalebiDogrula } from "@/lib/tclub/store/cokluTalep";
import { uuidGecerliMi } from "@/lib/uretim/rpcTemel";
import { STORE_ALABILEN_ROLLER } from "@/lib/utils/roller";
import {
  siparisOlustur,
  siparisIptal,
} from "@/lib/tclub/store/siparis";
import { rolCozucu } from "@/lib/utils/rolCozucu";
import {
  hbstoreSiparisAcikMi,
  hbstoreTakvimDurumu,
} from "@/lib/tclub/store/takvim";


// ─── GET: Kullanıcının kendi siparişleri ─────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return yetkiHatasi();

    const adminSupabase = createAdminClient();
    const rol = await rolCozucu(adminSupabase, user.id);
    if (!STORE_ALABILEN_ROLLER.includes(rol)) {
      return rolHatasi("Sipariş geçmişi yetkiniz yok.");
    }


    const { searchParams } = new URL(request.url);
    const durum = searchParams.get("durum");

    const { data, error } = await adminSupabase.rpc("store_kullanici_siparis_listesi", { p_kullanici_id: user.id, p_durum: durum });
    if (error) {
      if (["PGRST202", "42883"].includes(error.code)) return NextResponse.json({ hata: "FirmaStore 12 saatlik bekleme SQL kurulumu bekleniyor." }, { status: 503 });
      return hataYaniti("Siparişler alınamadı.", "FirmaStore kullanıcı talepleri", error);
    }
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return sunucuHatasi(err, "GET /store/api/siparis");
  }
}

// ─── POST: Yeni sipariş ──────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return yetkiHatasi();

    const adminSupabase = createAdminClient();
    const rol = await rolCozucu(adminSupabase, user.id);
    if (!STORE_ALABILEN_ROLLER.includes(rol)) {
      return rolHatasi("Sipariş verme yetkiniz yok.");
    }

    // Sipariş dönemi kontrolü (FirmaStore Günleri)
    if (!hbstoreSiparisAcikMi()) {
      const durum = hbstoreTakvimDurumu();
      return isKuraluHatasi(
        `FirmaStore şu an siparişe kapalıdır. Siparişler yalnızca FirmaStore Günleri'nde (${durum.sonrakiDonemEtiketi}) verilebilir.`
      );
    }

    let body;
    try { body = await request.json(); } catch { return validasyonHatasi("Geçerli bir talep gönderin.", ["body"]); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return validasyonHatasi("Geçerli bir talep gönderin.", ["body"]);
    if ("cekler" in body) {
      const kontrol = cokluTalebiDogrula(body.cekler, body.talep_anahtari);
      if (!kontrol.gecerli) return validasyonHatasi(kontrol.hata, ["cekler"]);
      const { data, error } = await adminSupabase.rpc("store_coklu_cek_talep_olustur", {
        p_kullanici_id: user.id, p_cekler: kontrol.cekler, p_talep_anahtari: kontrol.anahtar,
      });
      if (error) {
        if (["PGRST202", "42883"].includes(error.code)) return NextResponse.json({ hata: "Çoklu çek talebi SQL kurulumu bekleniyor." }, { status: 503 });
        return hataYaniti("Çek talepleri kaydedilemedi.", "FirmaStore çoklu talep", error);
      }
      const sonuc = Array.isArray(data) ? data[0] : null;
      if (!sonuc?.ok) return isKuraluHatasi(sonuc?.hata ?? "Çek talepleri kaydedilemedi.");
      return NextResponse.json({ mesaj: "Çek talepleri alındı.", siparis_ids: sonuc.siparis_ids }, { status: 201 });
    }
    const { urun_id, adet, beklenen_baz_puan, beklenen_birim_tl } = body;

    // Validasyon
    if (!uuidGecerliMi(urun_id)) {
      return validasyonHatasi("urun_id zorunludur.", ["urun_id"]);
    }
    const adetSayi = Number(adet);
    if (!Number.isInteger(adetSayi) || adetSayi <= 0 || adetSayi > 2147483647) {
      return validasyonHatasi("adet pozitif tam sayı olmalı.", ["adet"]);
    }

    if (!bazPuanGecerliMi(beklenen_baz_puan) || !minimumSiparisTlGecerliMi(beklenen_birim_tl)) {
      return validasyonHatasi("Onaylanan çekin puan ve TL karşılığı geçersiz.", ["beklenen_baz_puan", "beklenen_birim_tl"]);
    }

    // Güncel firma fiyatı RPC içinde doğrulanır; istemcinin gönderdiği tutar fiyat belirleyemez.
    const sonuc = await siparisOlustur(adminSupabase, {
      kullanici_id: user.id,
      urun_id,
      adet: adetSayi,
      beklenen_baz_puan,
      beklenen_birim_tl,
    });

    if (!sonuc.ok) {
      return isKuraluHatasi(sonuc.hata ?? "Sipariş oluşturulamadı.");
    }

    return NextResponse.json(
      {
        mesaj: "Sipariş alındı.",
        siparis_id: sonuc.siparis_id,
      },
      { status: 201 }
    );
  } catch (err) {
    return sunucuHatasi(err, "POST /store/api/siparis");
  }
}

// ─── PATCH: İptal veya Teslim Aldım ──────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return yetkiHatasi();

    const adminSupabase = createAdminClient();
    const rol = await rolCozucu(adminSupabase, user.id);
    if (!STORE_ALABILEN_ROLLER.includes(rol)) {
      return rolHatasi("Sipariş işlemi yetkiniz yok.");
    }


    const body = await request.json();
    const { siparis_id, action, sebep } = body;

    if (!siparis_id || typeof siparis_id !== "string") {
      return validasyonHatasi("siparis_id zorunludur.", ["siparis_id"]);
    }

    if (action === "iptal") {
      const sonuc = await siparisIptal(adminSupabase, {
        siparis_id,
        iptal_eden_id: user.id,
        is_admin: false, // bu endpoint kullanıcı iptal akışı; admin için ayrı admin route'u olacak
        sebep: sebep ?? null,
      });

      if (!sonuc.ok) {
        return isKuraluHatasi(sonuc.error ?? "Sipariş iptal edilemedi.");
      }

      return NextResponse.json({ mesaj: "Sipariş iptal edildi." }, { status: 200 });
    }

    return validasyonHatasi(
      `Geçersiz action: ${action} (geçerli: 'iptal')`,
      ["action"]
    );
  } catch (err) {
    return sunucuHatasi(err, "PATCH /store/api/siparis");
  }
}
