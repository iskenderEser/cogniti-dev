import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { bunnyCdnImzaliUrl } from "@/lib/ogrenmeAraci/bunnyStorage";
import {
  BOLIS_HEDEF_ROLLER,
  type BolisHedefRol,
  type BolisSecenek,
  type BolisYayinAraci,
} from "@/lib/bolis/tipler";
import { uuidGecerliMi } from "@/lib/bolis/sunucu";

function cerezAdi(sinavId: string): string {
  return `bolis_oturum_${sinavId.replace(/-/g, "")}`;
}

function medyaUrlCoz(sinav: {
  yayin_araci: BolisYayinAraci;
  yayin_video_guid: string | null;
  yayin_dosya_yolu: string | null;
}): string | null {
  if (sinav.yayin_araci === "video") {
    const lib = process.env.BUNNY_LIBRARY_ID;
    if (!lib || !sinav.yayin_video_guid || !uuidGecerliMi(sinav.yayin_video_guid)) return null;
    return `https://player.mediadelivery.net/embed/${encodeURIComponent(lib)}/${sinav.yayin_video_guid}?autoplay=false&disableIosPlayer=true`;
  }
  if (
    (sinav.yayin_araci === "podcast" ||
      sinav.yayin_araci === "gorsel" ||
      sinav.yayin_araci === "flip_pdf") &&
    sinav.yayin_dosya_yolu
  ) {
    return bunnyCdnImzaliUrl(sinav.yayin_dosya_yolu);
  }
  return null;
}

function metinTemizle(deger: unknown, maks: number): string {
  return typeof deger === "string" ? deger.trim().slice(0, maks) : "";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ kod: string }> },
) {
  const { kod } = await params;
  const temizKod = kod.trim().toUpperCase();
  if (!/^[A-Z0-9_-]{6,32}$/.test(temizKod)) {
    return NextResponse.json({ hata: "Geçersiz sınav bağlantısı." }, { status: 400 });
  }

  try {
    const db = createAdminClient();
    const { data: sinav, error: sinavHata } = await db
      .from("bolis_sinavlari")
      .select(
        "sinav_id, erisim_kodu, baslik, aciklama, hedef_roller, yayin_araci, yayin_video_guid, yayin_dosya_yolu, yayin_baslik, sure_dakika, baslangic_at, bitis_at, kayit_tipi, durum",
      )
      .eq("erisim_kodu", temizKod)
      .maybeSingle();

    if (sinavHata) {
      return NextResponse.json({ hata: "Sınav bilgisi okunamadı." }, { status: 503 });
    }
    if (!sinav) {
      return NextResponse.json({ hata: "Sınav bulunamadı." }, { status: 404 });
    }

    const { data: sorular } = await db
      .from("bolis_sorulari")
      .select("soru_id, sira, soru_metni, secenekler, puan")
      .eq("sinav_id", sinav.sinav_id)
      .order("sira", { ascending: true });

    const soruListesi = (sorular ?? []).map((s) => ({
      soru_id: s.soru_id as string,
      sira: Number(s.sira),
      soru_metni: s.soru_metni as string,
      secenekler: (s.secenekler as BolisSecenek[]) ?? [],
      puan: Number(s.puan),
    }));

    const maksimumPuan = soruListesi.reduce((t, s) => t + s.puan, 0);
    const simdiMs = Date.now();
    const basMs = sinav.baslangic_at ? Date.parse(sinav.baslangic_at as string) : null;
    const bitMs = sinav.bitis_at ? Date.parse(sinav.bitis_at as string) : null;
    const henuzBaslamadi = basMs !== null && Number.isFinite(basMs) && simdiMs < basMs;
    const suresiDoldu = bitMs !== null && Number.isFinite(bitMs) && simdiMs > bitMs;

    // Mevcut oturum çerezini kontrol et (yenilemede devam veya tamamlanan sonucu göster)
    const cerezOturumId = request.cookies.get(cerezAdi(sinav.sinav_id as string))?.value ?? "";
    let mevcutOturum: Record<string, unknown> | null = null;
    if (uuidGecerliMi(cerezOturumId)) {
      const { data: o } = await db
        .from("bolis_oturumlari")
        .select(
          "oturum_id, katilimci_etiketi, durum, bitis_siniri_at, toplam_puan, maksimum_puan, dogru_sayisi, yanlis_sayisi, bos_sayisi, teslim_at",
        )
        .eq("oturum_id", cerezOturumId)
        .eq("sinav_id", sinav.sinav_id)
        .maybeSingle();
      if (o) mevcutOturum = o;
    }

    return NextResponse.json({
      sinav: {
        sinav_id: sinav.sinav_id,
        erisim_kodu: sinav.erisim_kodu,
        baslik: sinav.baslik,
        aciklama: sinav.aciklama ?? "",
        hedef_roller: sinav.hedef_roller ?? [],
        yayin_araci: sinav.yayin_araci,
        yayin_baslik: sinav.yayin_baslik ?? null,
        sure_dakika: Number(sinav.sure_dakika),
        baslangic_at: sinav.baslangic_at ?? null,
        bitis_at: sinav.bitis_at ?? null,
        kayit_tipi: sinav.kayit_tipi,
        durum: sinav.durum,
        soru_sayisi: soruListesi.length,
        maksimum_puan: maksimumPuan,
      },
      zaman: {
        henuzBaslamadi,
        suresiDoldu,
      },
      oturum: mevcutOturum,
      medya_url:
        mevcutOturum && mevcutOturum.durum === "devam"
          ? medyaUrlCoz({
              yayin_araci: sinav.yayin_araci as BolisYayinAraci,
              yayin_video_guid: (sinav.yayin_video_guid as string | null) ?? null,
              yayin_dosya_yolu: (sinav.yayin_dosya_yolu as string | null) ?? null,
            })
          : null,
      sorular: mevcutOturum && mevcutOturum.durum === "devam" ? soruListesi : [],
    });
  } catch {
    return NextResponse.json({ hata: "Sınav bilgisi okunamadı." }, { status: 503 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ kod: string }> },
) {
  const { kod } = await params;
  const temizKod = kod.trim().toUpperCase();
  if (!/^[A-Z0-9_-]{6,32}$/.test(temizKod)) {
    return NextResponse.json({ hata: "Geçersiz sınav bağlantısı." }, { status: 400 });
  }

  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const islem = typeof body?.islem === "string" ? body.islem : "";

    const db = createAdminClient();
    const { data: sinav, error: sinavHata } = await db
      .from("bolis_sinavlari")
      .select(
        "sinav_id, erisim_kodu, baslik, hedef_roller, yayin_araci, yayin_video_guid, yayin_dosya_yolu, sure_dakika, baslangic_at, bitis_at, kayit_tipi, durum",
      )
      .eq("erisim_kodu", temizKod)
      .maybeSingle();

    if (sinavHata || !sinav) {
      return NextResponse.json({ hata: "Sınav bulunamadı." }, { status: 404 });
    }

    const sinavId = sinav.sinav_id as string;
    const cerezIsmi = cerezAdi(sinavId);

    // ─── 1. SINAVI BAŞLAT ───
    if (islem === "baslat") {
      if (sinav.durum !== "yayinda") {
        return NextResponse.json({ hata: "Bu sınav şu an katılıma açık değil." }, { status: 403 });
      }
      const simdiMs = Date.now();
      const basMs = sinav.baslangic_at ? Date.parse(sinav.baslangic_at as string) : null;
      const bitMs = sinav.bitis_at ? Date.parse(sinav.bitis_at as string) : null;
      if (basMs !== null && simdiMs < basMs) {
        return NextResponse.json({ hata: "Sınav başlangıç saati henüz gelmedi." }, { status: 403 });
      }
      if (bitMs !== null && simdiMs > bitMs) {
        return NextResponse.json({ hata: "Bu sınavın süresi dolmuştur." }, { status: 403 });
      }

      // Aynı tarayıcıdan ikinci giriş engeli (tüm kayıt tipleri için)
      const oncekiCerez = request.cookies.get(cerezIsmi)?.value ?? "";
      if (uuidGecerliMi(oncekiCerez)) {
        const { data: oncekiOturum } = await db
          .from("bolis_oturumlari")
          .select("oturum_id, durum")
          .eq("oturum_id", oncekiCerez)
          .eq("sinav_id", sinavId)
          .maybeSingle();
        if (oncekiOturum) {
          return NextResponse.json(
            {
              hata:
                oncekiOturum.durum === "tamamlandi"
                  ? "Bu sınava daha önce katıldınız. Giriş hakkı tek seferdir."
                  : "Devam eden sınav oturumunuz bulunuyor. Sayfayı yenileyin.",
            },
            { status: 409 },
          );
        }
      }

      // İç kullanıcı oturumu varsa bağla (anonim modda kimlik saklanmaz)
      let authKullaniciId: string | null = null;
      if (sinav.kayit_tipi !== "anonim") {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.id) authKullaniciId = user.id;
      }

      // Sıradaki katılımcı numarası
      const { count: mevcutSayi } = await db
        .from("bolis_oturumlari")
        .select("oturum_id", { count: "exact", head: true })
        .eq("sinav_id", sinavId);
      const katilimciSira = (mevcutSayi ?? 0) + 1;

      let tekilAnahtar = "";
      let katilimciEtiketi = `Katılımcı ${katilimciSira}`;
      let davetliId: string | null = null;
      let ad: string | null = null;
      let soyad: string | null = null;
      let eposta: string | null = null;
      let telefon: string | null = null;
      let rolGrubu: BolisHedefRol | null = null;
      let takimAdi: string | null = null;
      let bolgeAdi: string | null = null;
      let eczaneAdi: string | null = null;

      if (sinav.kayit_tipi === "hazir_liste") {
        const girilenEposta = metinTemizle(body?.eposta, 200).toLowerCase();
        const girilenTel = metinTemizle(body?.telefon, 40).replace(/\s+/g, "");
        if (!girilenEposta && !girilenTel) {
          return NextResponse.json(
            { hata: "Hazır listede doğrulama için e-posta veya telefon numaranızı girin." },
            { status: 400 },
          );
        }

        const { data: liste } = await db
          .from("bolis_davetlileri")
          .select("davetli_id, ad, soyad, eposta, telefon, rol_grubu, takim_adi, bolge_adi, eczane_adi")
          .eq("sinav_id", sinavId);

        const eslesen = (liste ?? []).find((d) => {
          const dEposta = (d.eposta as string | null)?.trim().toLowerCase() ?? "";
          const dTel = (d.telefon as string | null)?.replace(/\s+/g, "") ?? "";
          return (
            (girilenEposta && dEposta && dEposta === girilenEposta) ||
            (girilenTel && dTel && dTel === girilenTel)
          );
        });

        if (!eslesen) {
          return NextResponse.json(
            { hata: "Girdiğiniz bilgiler bu sınavın hazır katılımcı listesinde bulunamadı." },
            { status: 403 },
          );
        }

        davetliId = eslesen.davetli_id as string;
        ad = eslesen.ad as string;
        soyad = eslesen.soyad as string;
        eposta = (eslesen.eposta as string | null) ?? null;
        telefon = (eslesen.telefon as string | null) ?? null;
        rolGrubu = (eslesen.rol_grubu as BolisHedefRol | null) ?? null;
        takimAdi = (eslesen.takim_adi as string | null) ?? null;
        bolgeAdi = (eslesen.bolge_adi as string | null) ?? null;
        eczaneAdi = (eslesen.eczane_adi as string | null) ?? null;
        katilimciEtiketi = `${ad} ${soyad}`;
        tekilAnahtar = `davet:${davetliId}`;
      } else if (sinav.kayit_tipi === "kendi_kaydi") {
        ad = metinTemizle(body?.ad, 100);
        soyad = metinTemizle(body?.soyad, 100);
        telefon = metinTemizle(body?.telefon, 40).replace(/\s+/g, "");
        eposta = metinTemizle(body?.eposta, 200).toLowerCase();
        const rolHam = metinTemizle(body?.rol_grubu, 40).toLowerCase();

        if (!ad || !soyad || !telefon || !eposta) {
          return NextResponse.json(
            { hata: "Ad, soyad, telefon ve e-posta alanları zorunludur." },
            { status: 400 },
          );
        }
        if (!(BOLIS_HEDEF_ROLLER as readonly string[]).includes(rolHam)) {
          return NextResponse.json({ hata: "Geçerli bir katılımcı rolü seçin." }, { status: 400 });
        }
        rolGrubu = rolHam as BolisHedefRol;

        if (rolGrubu === "utt" || rolGrubu === "bm") {
          takimAdi = metinTemizle(body?.takim_adi, 120);
          bolgeAdi = metinTemizle(body?.bolge_adi, 120);
          if (!takimAdi || !bolgeAdi) {
            return NextResponse.json(
              { hata: "Firma çalışanları için takım adı ve bölge adı zorunludur." },
              { status: 400 },
            );
          }
        } else if (rolGrubu === "eczaci" || rolGrubu === "eczane_teknisyeni") {
          eczaneAdi = metinTemizle(body?.eczane_adi, 160);
          if (!eczaneAdi) {
            return NextResponse.json(
              { hata: "Eczane çalışanları için eczane adı zorunludur." },
              { status: 400 },
            );
          }
        }

        katilimciEtiketi = `${ad} ${soyad}`;
        tekilAnahtar = `kayit:${eposta}`;
      } else {
        // Anonim (kimliksiz)
        katilimciEtiketi = `Katılımcı ${katilimciSira}`;
        tekilAnahtar = `anon:${randomUUID()}`;
      }

      const { data: sorular } = await db
        .from("bolis_sorulari")
        .select("soru_id, sira, soru_metni, secenekler, puan")
        .eq("sinav_id", sinavId)
        .order("sira", { ascending: true });

      const soruListesi = (sorular ?? []).map((s) => ({
        soru_id: s.soru_id as string,
        sira: Number(s.sira),
        soru_metni: s.soru_metni as string,
        secenekler: (s.secenekler as BolisSecenek[]) ?? [],
        puan: Number(s.puan),
      }));
      const maksimumPuan = soruListesi.reduce((t, s) => t + s.puan, 0);

      const bitisSiniri =
        sinav.bitis_at ??
        new Date(simdiMs + Number(sinav.sure_dakika || 30) * 60_000).toISOString();

      const { data: yeniOturum, error: oturumHata } = await db
        .from("bolis_oturumlari")
        .insert({
          sinav_id: sinavId,
          davetli_id: davetliId,
          kullanici_id: authKullaniciId,
          katilimci_sira: katilimciSira,
          katilimci_etiketi: katilimciEtiketi,
          ad,
          soyad,
          eposta,
          telefon,
          rol_grubu: rolGrubu,
          takim_adi: takimAdi,
          bolge_adi: bolgeAdi,
          eczane_adi: eczaneAdi,
          tekil_anahtar: tekilAnahtar,
          durum: "devam",
          bitis_siniri_at: bitisSiniri,
          maksimum_puan: maksimumPuan,
        })
        .select("oturum_id, katilimci_etiketi, durum, bitis_siniri_at, maksimum_puan")
        .single();

      if (oturumHata || !yeniOturum) {
        if (oturumHata?.code === "23505") {
          return NextResponse.json(
            { hata: "Bu sınava daha önce katıldınız. Giriş hakkı tek seferdir." },
            { status: 409 },
          );
        }
        return NextResponse.json({ hata: "Sınav oturumu başlatılamadı." }, { status: 503 });
      }

      const yanit = NextResponse.json({
        oturum: yeniOturum,
        medya_url: medyaUrlCoz({
          yayin_araci: sinav.yayin_araci as BolisYayinAraci,
          yayin_video_guid: (sinav.yayin_video_guid as string | null) ?? null,
          yayin_dosya_yolu: (sinav.yayin_dosya_yolu as string | null) ?? null,
        }),
        sorular: soruListesi,
      });

      yanit.cookies.set(cerezIsmi, yeniOturum.oturum_id as string, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });

      return yanit;
    }

    // ─── 2. SINAVI TESLİM ET VE ANINDA PUANLA ───
    if (islem === "teslim") {
      const cerezOturumId = request.cookies.get(cerezIsmi)?.value ?? "";
      const oturumId = uuidGecerliMi(cerezOturumId)
        ? cerezOturumId
        : uuidGecerliMi(body?.oturum_id)
          ? body.oturum_id
          : "";

      if (!oturumId) {
        return NextResponse.json({ hata: "Aktif sınav oturumu bulunamadı." }, { status: 400 });
      }

      const { data: oturum } = await db
        .from("bolis_oturumlari")
        .select(
          "oturum_id, katilimci_etiketi, durum, toplam_puan, maksimum_puan, dogru_sayisi, yanlis_sayisi, bos_sayisi, teslim_at",
        )
        .eq("oturum_id", oturumId)
        .eq("sinav_id", sinavId)
        .maybeSingle();

      if (!oturum) {
        return NextResponse.json({ hata: "Sınav oturumu bulunamadı." }, { status: 404 });
      }

      if (oturum.durum === "tamamlandi") {
        return NextResponse.json({ oturum });
      }

      const { data: sorular } = await db
        .from("bolis_sorulari")
        .select("soru_id, dogru_secenek, puan")
        .eq("sinav_id", sinavId);

      const gelenCevaplar =
        body?.cevaplar && typeof body.cevaplar === "object"
          ? (body.cevaplar as Record<string, unknown>)
          : {};

      let toplamPuan = 0;
      let maksimumPuan = 0;
      let dogruSayisi = 0;
      let yanlisSayisi = 0;
      let bosSayisi = 0;

      const cevapSatirlari = (sorular ?? []).map((s) => {
        const soruId = s.soru_id as string;
        const puan = Number(s.puan);
        maksimumPuan += puan;
        const secilenHam = gelenCevaplar[soruId];
        const secilen =
          typeof secilenHam === "string" && secilenHam.trim() ? secilenHam.trim() : null;

        if (!secilen) {
          bosSayisi++;
          return {
            oturum_id: oturumId,
            soru_id: soruId,
            secilen_secenek: null,
            dogru_mu: null,
            kazanilan_puan: 0,
          };
        }

        const dogruMu = secilen === (s.dogru_secenek as string);
        if (dogruMu) {
          dogruSayisi++;
          toplamPuan += puan;
        } else {
          yanlisSayisi++;
        }

        return {
          oturum_id: oturumId,
          soru_id: soruId,
          secilen_secenek: secilen,
          dogru_mu: dogruMu,
          kazanilan_puan: dogruMu ? puan : 0,
        };
      });

      if (cevapSatirlari.length > 0) {
        await db.from("bolis_cevaplari").upsert(cevapSatirlari, {
          onConflict: "oturum_id,soru_id",
        });
      }

      const teslimAt = new Date().toISOString();
      const { data: guncelOturum, error: teslimHata } = await db
        .from("bolis_oturumlari")
        .update({
          durum: "tamamlandi",
          teslim_at: teslimAt,
          toplam_puan: Math.round(toplamPuan * 100) / 100,
          maksimum_puan: Math.round(maksimumPuan * 100) / 100,
          dogru_sayisi: dogruSayisi,
          yanlis_sayisi: yanlisSayisi,
          bos_sayisi: bosSayisi,
        })
        .eq("oturum_id", oturumId)
        .select(
          "oturum_id, katilimci_etiketi, durum, toplam_puan, maksimum_puan, dogru_sayisi, yanlis_sayisi, bos_sayisi, teslim_at",
        )
        .single();

      if (teslimHata || !guncelOturum) {
        return NextResponse.json({ hata: "Sınav sonucu kaydedilemedi." }, { status: 503 });
      }

      return NextResponse.json({ oturum: guncelOturum });
    }

    return NextResponse.json({ hata: "Geçersiz işlem." }, { status: 400 });
  } catch {
    return NextResponse.json({ hata: "İşlem tamamlanamadı." }, { status: 503 });
  }
}
