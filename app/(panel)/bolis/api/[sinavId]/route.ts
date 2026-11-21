import { NextRequest, NextResponse } from "next/server";
import {
  bolisBaglami,
  bolisSinavDogrula,
  davetKoduUret,
  uuidGecerliMi,
} from "@/lib/bolis/sunucu";
import { BOLIS_DURUMLARI, type BolisSinavDurumu } from "@/lib/bolis/tipler";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sinavId: string }> },
) {
  const { sinavId } = await params;
  if (!uuidGecerliMi(sinavId)) {
    return NextResponse.json({ hata: "Geçersiz sınav kimliği." }, { status: 400 });
  }

  try {
    const b = await bolisBaglami();
    if (!b || !b.yoneticiMi || !b.firmaId) {
      return NextResponse.json({ hata: "Bu sınava erişim yetkiniz bulunmuyor." }, { status: 403 });
    }

    const { data: sinav, error: sinavHata } = await b.db
      .from("bolis_sinavlari")
      .select("*")
      .eq("sinav_id", sinavId)
      .eq("firma_id", b.firmaId)
      .maybeSingle();

    if (sinavHata) {
      return NextResponse.json({ hata: "Sınav bilgisi okunamadı." }, { status: 503 });
    }
    if (!sinav) {
      return NextResponse.json({ hata: "Sınav bulunamadı." }, { status: 404 });
    }

    const [{ data: sorular }, { data: davetliler }, { count: tamamlananSayisi }] = await Promise.all([
      b.db
        .from("bolis_sorulari")
        .select("soru_id, sira, soru_metni, secenekler, dogru_secenek, puan")
        .eq("sinav_id", sinavId)
        .order("sira", { ascending: true }),
      b.db
        .from("bolis_davetlileri")
        .select("davetli_id, davet_kodu, ad, soyad, eposta, telefon, rol_grubu, takim_adi, bolge_adi, eczane_adi")
        .eq("sinav_id", sinavId)
        .order("olusturuldu_at", { ascending: true }),
      b.db
        .from("bolis_oturumlari")
        .select("oturum_id", { count: "exact", head: true })
        .eq("sinav_id", sinavId),
    ]);

    return NextResponse.json({
      sinav,
      sorular: sorular ?? [],
      davetliler: davetliler ?? [],
      katilimBasladiMi: (tamamlananSayisi ?? 0) > 0,
    });
  } catch {
    return NextResponse.json({ hata: "Sınav bilgisi okunamadı." }, { status: 503 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ sinavId: string }> },
) {
  const { sinavId } = await params;
  if (!uuidGecerliMi(sinavId)) {
    return NextResponse.json({ hata: "Geçersiz sınav kimliği." }, { status: 400 });
  }

  try {
    const b = await bolisBaglami();
    if (!b || !b.yoneticiMi || !b.firmaId) {
      return NextResponse.json({ hata: "Bu sınavı düzenleme yetkiniz bulunmuyor." }, { status: 403 });
    }

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ hata: "Geçersiz istek gövdesi." }, { status: 400 });
    }

    const dogrulama = bolisSinavDogrula(body);
    if (!dogrulama.ok) {
      return NextResponse.json({ hata: dogrulama.hata }, { status: 400 });
    }
    const v = dogrulama.veri;

    const { data: mevcut } = await b.db
      .from("bolis_sinavlari")
      .select("sinav_id, erisim_kodu")
      .eq("sinav_id", sinavId)
      .eq("firma_id", b.firmaId)
      .maybeSingle();

    if (!mevcut) {
      return NextResponse.json({ hata: "Sınav bulunamadı." }, { status: 404 });
    }

    const { count: oturumSayisi } = await b.db
      .from("bolis_oturumlari")
      .select("oturum_id", { count: "exact", head: true })
      .eq("sinav_id", sinavId);

    const { error: guncelleHata } = await b.db
      .from("bolis_sinavlari")
      .update({
        baslik: v.baslik,
        aciklama: v.aciklama,
        hedef_roller: v.hedef_roller,
        yayin_araci: v.yayin_araci,
        yayin_video_guid: v.yayin_video_guid,
        yayin_dosya_yolu: v.yayin_dosya_yolu,
        yayin_viva_etkinlik_id: v.yayin_viva_etkinlik_id,
        yayin_baslik: v.yayin_baslik,
        sure_modu: v.sure_modu,
        sure_dakika: v.sure_dakika,
        baslangic_at: v.baslangic_at,
        bitis_at: v.bitis_at,
        kayit_tipi: v.kayit_tipi,
        durum: v.durum,
        guncellendi_at: new Date().toISOString(),
      })
      .eq("sinav_id", sinavId)
      .eq("firma_id", b.firmaId);

    if (guncelleHata) {
      return NextResponse.json({ hata: "Sınav güncellenemedi." }, { status: 503 });
    }

    // Katılım başlamadıysa soruları ve davetli listesini güvenle yenile
    if ((oturumSayisi ?? 0) === 0) {
      await b.db.from("bolis_sorulari").delete().eq("sinav_id", sinavId);
      if (v.sorular.length > 0) {
        const { error: soruHata } = await b.db.from("bolis_sorulari").insert(
          v.sorular.map((s) => ({
            sinav_id: sinavId,
            sira: s.sira,
            soru_metni: s.soru_metni,
            secenekler: s.secenekler,
            dogru_secenek: s.dogru_secenek,
            puan: s.puan,
          })),
        );
        if (soruHata) {
          return NextResponse.json({ hata: "Sorular kaydedilemedi." }, { status: 503 });
        }
      }

      await b.db.from("bolis_davetlileri").delete().eq("sinav_id", sinavId);
      if (v.kayit_tipi === "hazir_liste" && v.davetliler.length > 0) {
        const { error: davetHata } = await b.db.from("bolis_davetlileri").insert(
          v.davetliler.map((d) => ({
            sinav_id: sinavId,
            davet_kodu: davetKoduUret(),
            ad: d.ad,
            soyad: d.soyad,
            eposta: d.eposta,
            telefon: d.telefon,
            rol_grubu: d.rol_grubu,
            takim_adi: d.takim_adi,
            bolge_adi: d.bolge_adi,
            eczane_adi: d.eczane_adi,
          })),
        );
        if (davetHata) {
          return NextResponse.json({ hata: "Davetli listesi kaydedilemedi." }, { status: 503 });
        }
      }
    }

    return NextResponse.json({
      sinav_id: sinavId,
      erisim_kodu: mevcut.erisim_kodu,
      durum: v.durum,
    });
  } catch {
    return NextResponse.json({ hata: "Sınav güncellenemedi." }, { status: 503 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sinavId: string }> },
) {
  const { sinavId } = await params;
  if (!uuidGecerliMi(sinavId)) {
    return NextResponse.json({ hata: "Geçersiz sınav kimliği." }, { status: 400 });
  }

  try {
    const b = await bolisBaglami();
    if (!b || !b.yoneticiMi || !b.firmaId) {
      return NextResponse.json({ hata: "Bu işlem için yetkiniz bulunmuyor." }, { status: 403 });
    }

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const durum =
      typeof body?.durum === "string" && (BOLIS_DURUMLARI as readonly string[]).includes(body.durum)
        ? (body.durum as BolisSinavDurumu)
        : null;
    if (!durum) {
      return NextResponse.json({ hata: "Geçersiz sınav durumu." }, { status: 400 });
    }

    if (durum === "yayinda") {
      const { count: soruSayisi } = await b.db
        .from("bolis_sorulari")
        .select("soru_id", { count: "exact", head: true })
        .eq("sinav_id", sinavId);
      if ((soruSayisi ?? 0) === 0) {
        return NextResponse.json(
          { hata: "Sınavı yayınlamak için en az 1 soru eklemelisiniz." },
          { status: 400 },
        );
      }
    }

    const { error } = await b.db
      .from("bolis_sinavlari")
      .update({ durum, guncellendi_at: new Date().toISOString() })
      .eq("sinav_id", sinavId)
      .eq("firma_id", b.firmaId);

    if (error) {
      return NextResponse.json({ hata: "Sınav durumu güncellenemedi." }, { status: 503 });
    }

    return NextResponse.json({ sinav_id: sinavId, durum });
  } catch {
    return NextResponse.json({ hata: "Sınav durumu güncellenemedi." }, { status: 503 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ sinavId: string }> },
) {
  const { sinavId } = await params;
  if (!uuidGecerliMi(sinavId)) {
    return NextResponse.json({ hata: "Geçersiz sınav kimliği." }, { status: 400 });
  }

  try {
    const b = await bolisBaglami();
    if (!b || !b.yoneticiMi || !b.firmaId) {
      return NextResponse.json({ hata: "Bu sınavı silme yetkiniz bulunmuyor." }, { status: 403 });
    }

    const { error } = await b.db
      .from("bolis_sinavlari")
      .delete()
      .eq("sinav_id", sinavId)
      .eq("firma_id", b.firmaId);

    if (error) {
      return NextResponse.json({ hata: "Sınav silinemedi." }, { status: 503 });
    }

    return NextResponse.json({ silindi: true });
  } catch {
    return NextResponse.json({ hata: "Sınav silinemedi." }, { status: 503 });
  }
}
