import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { rolCozucu } from "@/lib/utils/rolCozucu";
import {
  bolisYoneticiMi,
  kullaniciRolundenBolisHedefi,
  type BolisSinavOzeti,
} from "@/lib/bolis/tipler";
import {
  bolisBaglami,
  bolisSinavDogrula,
  davetKoduUret,
  erisimKoduUret,
} from "@/lib/bolis/sunucu";
import {
  bolisHazirListeDavetEpostalariGonder,
  bolisSiteAdresiCoz,
} from "@/lib/bolis/eposta";

function tabloEksikMi(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    Boolean(error.message?.includes("bolis_sinavlari"))
  );
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ hata: "Oturum bulunamadı." }, { status: 401 });
    }

    const db = createAdminClient();
    const rol = await rolCozucu(db, user.id);
    const yoneticiMi = bolisYoneticiMi(rol);

    const { data: kullanici } = await db
      .from("kullanicilar")
      .select("firma_id")
      .eq("kullanici_id", user.id)
      .maybeSingle();

    const firmaId = typeof kullanici?.firma_id === "string" ? kullanici.firma_id : null;

    if (yoneticiMi) {
      if (!firmaId) {
        return NextResponse.json({ yoneticiMi: true, sinavlar: [], kurulumBekliyor: false });
      }

      const { data: sinavlar, error: sinavHata } = await db
        .from("bolis_sinavlari")
        .select(
          "sinav_id, erisim_kodu, baslik, aciklama, hedef_roller, yayin_araci, sure_modu, sure_dakika, baslangic_at, bitis_at, kayit_tipi, durum, olusturuldu_at",
        )
        .eq("firma_id", firmaId)
        .order("olusturuldu_at", { ascending: false });

      if (sinavHata) {
        if (tabloEksikMi(sinavHata)) {
          return NextResponse.json({ yoneticiMi: true, sinavlar: [], kurulumBekliyor: true });
        }
        return NextResponse.json({ hata: "BOLIS sınavları okunamadı." }, { status: 503 });
      }

      const sinavIdleri = (sinavlar ?? []).map((s) => s.sinav_id as string);
      const soruSayisiHaritasi = new Map<string, number>();
      const katilimciSayisiHaritasi = new Map<string, number>();

      if (sinavIdleri.length > 0) {
        const [{ data: sorular }, { data: oturumlar }] = await Promise.all([
          db.from("bolis_sorulari").select("sinav_id").in("sinav_id", sinavIdleri),
          db
            .from("bolis_oturumlari")
            .select("sinav_id")
            .in("sinav_id", sinavIdleri)
            .eq("durum", "tamamlandi"),
        ]);

        for (const s of sorular ?? []) {
          const id = s.sinav_id as string;
          soruSayisiHaritasi.set(id, (soruSayisiHaritasi.get(id) ?? 0) + 1);
        }
        for (const o of oturumlar ?? []) {
          const id = o.sinav_id as string;
          katilimciSayisiHaritasi.set(id, (katilimciSayisiHaritasi.get(id) ?? 0) + 1);
        }
      }

      const ozetler: BolisSinavOzeti[] = (sinavlar ?? []).map((s) => ({
        sinav_id: s.sinav_id as string,
        erisim_kodu: s.erisim_kodu as string,
        baslik: s.baslik as string,
        aciklama: (s.aciklama as string) ?? "",
        hedef_roller: (s.hedef_roller as BolisSinavOzeti["hedef_roller"]) ?? [],
        yayin_araci: s.yayin_araci as BolisSinavOzeti["yayin_araci"],
        sure_dakika: Number(s.sure_dakika),
        baslangic_at: (s.baslangic_at as string | null) ?? null,
        bitis_at: (s.bitis_at as string | null) ?? null,
        kayit_tipi: s.kayit_tipi as BolisSinavOzeti["kayit_tipi"],
        durum: s.durum as BolisSinavOzeti["durum"],
        soru_sayisi: soruSayisiHaritasi.get(s.sinav_id as string) ?? 0,
        katilimci_sayisi: katilimciSayisiHaritasi.get(s.sinav_id as string) ?? 0,
        olusturuldu_at: s.olusturuldu_at as string,
      }));

      return NextResponse.json({
        yoneticiMi: true,
        sinavlar: ozetler,
        kurulumBekliyor: false,
      });
    }

    // Katılımcı görünümü: kendi hedef rolüne veya davetine açık yayındaki sınavlar
    const hedefRol = kullaniciRolundenBolisHedefi(rol);
    const { data: sinavlar, error: sinavHata } = await db
      .from("bolis_sinavlari")
      .select(
        "sinav_id, firma_id, erisim_kodu, baslik, aciklama, hedef_roller, yayin_araci, sure_modu, sure_dakika, baslangic_at, bitis_at, kayit_tipi, durum, olusturuldu_at",
      )
      .eq("durum", "yayinda")
      .order("olusturuldu_at", { ascending: false });

    if (sinavHata) {
      if (tabloEksikMi(sinavHata)) {
        return NextResponse.json({ yoneticiMi: false, sinavlar: [], kurulumBekliyor: true });
      }
      return NextResponse.json({ hata: "BOLIS sınavları okunamadı." }, { status: 503 });
    }

    const { data: kullaniciOturumlari } = await db
      .from("bolis_oturumlari")
      .select("sinav_id, durum, toplam_puan, maksimum_puan")
      .eq("kullanici_id", user.id);

    const oturumHaritasi = new Map<
      string,
      { durum: string; toplam_puan: number; maksimum_puan: number }
    >();
    for (const o of kullaniciOturumlari ?? []) {
      oturumHaritasi.set(o.sinav_id as string, {
        durum: o.durum as string,
        toplam_puan: Number(o.toplam_puan ?? 0),
        maksimum_puan: Number(o.maksimum_puan ?? 0),
      });
    }

    const { data: davetler } = await db
      .from("bolis_davetlileri")
      .select("sinav_id")
      .eq("kullanici_id", user.id);
    const davetliSinavSeti = new Set((davetler ?? []).map((d) => d.sinav_id as string));

    const uygunlar = (sinavlar ?? []).filter((s) => {
      const sinavId = s.sinav_id as string;
      if (davetliSinavSeti.has(sinavId)) return true;
      if (firmaId && s.firma_id !== firmaId) return false;
      const roller = (s.hedef_roller as string[]) ?? [];
      return hedefRol !== null && roller.includes(hedefRol);
    });

    const ozetler: BolisSinavOzeti[] = uygunlar.map((s) => {
      const id = s.sinav_id as string;
      const oturum = oturumHaritasi.get(id);
      return {
        sinav_id: id,
        erisim_kodu: s.erisim_kodu as string,
        baslik: s.baslik as string,
        aciklama: (s.aciklama as string) ?? "",
        hedef_roller: (s.hedef_roller as BolisSinavOzeti["hedef_roller"]) ?? [],
        yayin_araci: s.yayin_araci as BolisSinavOzeti["yayin_araci"],
        sure_dakika: Number(s.sure_dakika),
        baslangic_at: (s.baslangic_at as string | null) ?? null,
        bitis_at: (s.bitis_at as string | null) ?? null,
        kayit_tipi: s.kayit_tipi as BolisSinavOzeti["kayit_tipi"],
        durum: s.durum as BolisSinavOzeti["durum"],
        soru_sayisi: 0,
        katilimci_sayisi: 0,
        olusturuldu_at: s.olusturuldu_at as string,
        katildi_mi: oturum?.durum === "tamamlandi",
        kullanici_puani: oturum?.durum === "tamamlandi" ? oturum.toplam_puan : null,
        maksimum_puan: oturum?.durum === "tamamlandi" ? oturum.maksimum_puan : null,
      };
    });

    return NextResponse.json({
      yoneticiMi: false,
      sinavlar: ozetler,
      kurulumBekliyor: false,
    });
  } catch {
    return NextResponse.json({ hata: "BOLIS sınavları okunamadı." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const b = await bolisBaglami();
    if (!b || !b.yoneticiMi || !b.firmaId) {
      return NextResponse.json(
        { hata: "Sınav oluşturma yetkiniz bulunmuyor." },
        { status: 403 },
      );
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

    const erisimKodu = erisimKoduUret();
    const { data: olusan, error: ekleHata } = await b.db
      .from("bolis_sinavlari")
      .insert({
        firma_id: b.firmaId,
        olusturan_id: b.authId,
        erisim_kodu: erisimKodu,
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
      })
      .select("sinav_id, erisim_kodu, durum")
      .single();

    if (ekleHata || !olusan) {
      return NextResponse.json({ hata: "Sınav kaydedilemedi." }, { status: 503 });
    }

    const sinavId = olusan.sinav_id as string;

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
        await b.db.from("bolis_sinavlari").delete().eq("sinav_id", sinavId);
        return NextResponse.json({ hata: "Sorular kaydedilemedi." }, { status: 503 });
      }
    }

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
        await b.db.from("bolis_sinavlari").delete().eq("sinav_id", sinavId);
        return NextResponse.json({ hata: "Davetli listesi kaydedilemedi." }, { status: 503 });
      }
    }

    if (v.durum === "yayinda" && v.kayit_tipi === "hazir_liste") {
      try {
        await bolisHazirListeDavetEpostalariGonder(
          b.db,
          sinavId,
          bolisSiteAdresiCoz(new URL(request.url).origin),
        );
      } catch {
        // Sınav kaydı e-posta hatasından bağımsızdır.
      }
    }

    return NextResponse.json(olusan, { status: 201 });
  } catch {
    return NextResponse.json({ hata: "Sınav kaydedilemedi." }, { status: 503 });
  }
}
