import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { adminGirisKontrol } from "@/lib/utils/adminGirisKontrol";
import { hataYaniti, sunucuHatasi, validasyonHatasi } from "@/lib/utils/hataIsle";
import { uuidGecerliMi } from "@/lib/uretim/rpc";
import {
  SOSYAL_IKON_BUCKET,
  SOSYAL_LINKLER_TABLO,
  sosyalIkonDosyaKontrol,
  sosyalLinkAdNormalizeEt,
  sosyalLinkKurulumuEksik,
  sosyalLinkUrlNormalizeEt,
} from "@/lib/sosyalLinkler";
import { adminSosyalLinkleriniOku } from "@/lib/sosyalLinklerSunucu";

const kurulumYaniti = () =>
  NextResponse.json(
    {
      hata: "Sosyal medya ve link ekleme alanını etkinleştirmek için scripts/sql/cogniti_sosyal_linkler.sql kurulumunu çalıştırın.",
      kurulumGerekli: true,
    },
    { status: 503 },
  );

function anaSayfaYenile() {
  revalidatePath("/");
  revalidatePath("/welcome");
}

function linkNesnesi(
  admin: ReturnType<typeof createAdminClient>,
  satir: { id: string; ad: string; url: string; ikon_yolu: string; sira: number; gorunur: boolean; created_at?: string },
) {
  return {
    id: satir.id,
    ad: satir.ad,
    url: satir.url,
    ikonUrl: admin.storage.from(SOSYAL_IKON_BUCKET).getPublicUrl(satir.ikon_yolu).data.publicUrl,
    sira: satir.sira,
    gorunur: satir.gorunur,
    createdAt: satir.created_at,
  };
}

export async function GET() {
  try {
    const kontrol = await adminGirisKontrol();
    if (!kontrol.gecerli) return kontrol.yanit;

    const admin = createAdminClient();
    const sonuc = await adminSosyalLinkleriniOku(admin);
    if (sonuc.error) {
      return hataYaniti("Sosyal medya linkleri yüklenemedi.", "Sosyal link SELECT", sonuc.error);
    }
    return NextResponse.json(
      { linkler: sonuc.linkler, kurulumHazir: sonuc.kurulumHazir },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return sunucuHatasi(error, "GET /admin/api/sosyal-linkler");
  }
}

export async function POST(request: Request) {
  try {
    const kontrol = await adminGirisKontrol();
    if (!kontrol.gecerli) return kontrol.yanit;

    const form = await request.formData();
    const ad = sosyalLinkAdNormalizeEt(String(form.get("ad") ?? ""));
    const url = sosyalLinkUrlNormalizeEt(String(form.get("url") ?? ""));
    const ikon = form.get("ikon");

    if (!ad) return validasyonHatasi("Başlık / platform adı 1 ile 80 karakter arasında olmalıdır.", ["ad"]);
    if (!url) return validasyonHatasi("Geçerli bir bağlantı adresi girin (örn. https://www.linkedin.com/...).", ["url"]);
    if (!(ikon instanceof File)) return validasyonHatasi("İkon dosyası seçin.", ["ikon"]);

    const ikonSonuc = await sosyalIkonDosyaKontrol(ikon);
    if (!ikonSonuc.gecerli) return validasyonHatasi(ikonSonuc.hata, ["ikon"]);

    const admin = createAdminClient();
    const { data: sonSatir, error: siraHatasi } = await admin
      .from(SOSYAL_LINKLER_TABLO)
      .select("sira")
      .order("sira", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sosyalLinkKurulumuEksik(siraHatasi)) return kurulumYaniti();
    if (siraHatasi) return hataYaniti("Sıra bilgisi okunamadı.", "Sosyal link sira SELECT", siraHatasi);

    const yeniSira = (typeof sonSatir?.sira === "number" ? sonSatir.sira : 0) + 1;
    const depo = admin.storage.from(SOSYAL_IKON_BUCKET);
    const yol = `sosyal-ikonlar/${crypto.randomUUID()}.${ikonSonuc.uzanti}`;

    const { error: yuklemeHatasi } = await depo.upload(yol, ikon, {
      contentType: ikonSonuc.mime,
      upsert: false,
    });
    if (yuklemeHatasi) {
      return hataYaniti("İkon dosyası yüklenemedi.", "Sosyal ikon Storage upload", yuklemeHatasi);
    }

    const { data: eklenen, error: eklemeHatasi } = await admin
      .from(SOSYAL_LINKLER_TABLO)
      .insert({
        ad,
        url,
        ikon_yolu: yol,
        sira: yeniSira,
        gorunur: true,
      })
      .select("id, ad, url, ikon_yolu, sira, gorunur, created_at")
      .single();

    if (eklemeHatasi || !eklenen) {
      await depo.remove([yol]);
      if (sosyalLinkKurulumuEksik(eklemeHatasi)) return kurulumYaniti();
      return hataYaniti("Sosyal medya linki kaydedilemedi.", "Sosyal link INSERT", eklemeHatasi);
    }

    anaSayfaYenile();
    return NextResponse.json({ link: linkNesnesi(admin, eklenen) }, { status: 201 });
  } catch (error) {
    return sunucuHatasi(error, "POST /admin/api/sosyal-linkler");
  }
}

export async function PATCH(request: Request) {
  try {
    const kontrol = await adminGirisKontrol();
    if (!kontrol.gecerli) return kontrol.yanit;

    const icerikTipi = request.headers.get("content-type") ?? "";
    let id = "";
    let adHam: unknown;
    let urlHam: unknown;
    let gorunurHam: unknown;
    let yonHam: unknown;
    let ikonDosyasi: File | null = null;

    if (icerikTipi.includes("multipart/form-data")) {
      const form = await request.formData();
      id = String(form.get("id") ?? "");
      if (form.has("ad")) adHam = form.get("ad");
      if (form.has("url")) urlHam = form.get("url");
      if (form.has("gorunur")) gorunurHam = form.get("gorunur") === "true";
      const dosya = form.get("ikon");
      if (dosya instanceof File && dosya.size > 0) ikonDosyasi = dosya;
    } else {
      const veri = await request.json().catch(() => null);
      if (!veri || typeof veri !== "object") return validasyonHatasi("Geçersiz istek gövdesi.", ["body"]);
      id = typeof veri.id === "string" ? veri.id : "";
      adHam = veri.ad;
      urlHam = veri.url;
      gorunurHam = veri.gorunur;
      yonHam = veri.yon;
    }

    if (!uuidGecerliMi(id)) return validasyonHatasi("Geçersiz bağlantı kimliği.", ["id"]);

    const admin = createAdminClient();
    const { data: mevcut, error: okumaHatasi } = await admin
      .from(SOSYAL_LINKLER_TABLO)
      .select("id, ad, url, ikon_yolu, sira, gorunur, created_at")
      .eq("id", id)
      .maybeSingle();

    if (sosyalLinkKurulumuEksik(okumaHatasi)) return kurulumYaniti();
    if (okumaHatasi) return hataYaniti("Bağlantı okunamadı.", "Sosyal link SELECT", okumaHatasi);
    if (!mevcut) return NextResponse.json({ hata: "Bağlantı bulunamadı." }, { status: 404 });

    if (yonHam === "yukari" || yonHam === "asagi") {
      const { data: tumu, error: listeHatasi } = await admin
        .from(SOSYAL_LINKLER_TABLO)
        .select("id, sira")
        .order("sira", { ascending: true })
        .order("created_at", { ascending: true });

      if (listeHatasi) return hataYaniti("Sıralama okunamadı.", "Sosyal link reorder SELECT", listeHatasi);
      const sirali = (tumu ?? []).map((satir, idx) => ({ id: satir.id as string, sira: idx + 1 }));
      const indeks = sirali.findIndex((satir) => satir.id === id);
      const hedefIndeks = yonHam === "yukari" ? indeks - 1 : indeks + 1;
      if (indeks >= 0 && hedefIndeks >= 0 && hedefIndeks < sirali.length) {
        const gecici = sirali[indeks];
        sirali[indeks] = sirali[hedefIndeks];
        sirali[hedefIndeks] = gecici;
      }

      const simdi = new Date().toISOString();
      for (let i = 0; i < sirali.length; i++) {
        const { error: siraGuncelleHatasi } = await admin
          .from(SOSYAL_LINKLER_TABLO)
          .update({ sira: i + 1, updated_at: simdi })
          .eq("id", sirali[i].id);
        if (siraGuncelleHatasi) {
          return hataYaniti("Sıralama güncellenemedi.", "Sosyal link reorder UPDATE", siraGuncelleHatasi);
        }
      }

      anaSayfaYenile();
      const guncelListe = await adminSosyalLinkleriniOku(admin);
      if (guncelListe.error) return hataYaniti("Güncel liste okunamadı.", "Sosyal link SELECT", guncelListe.error);
      return NextResponse.json({ linkler: guncelListe.linkler });
    }

    const guncellenecek: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (adHam !== undefined) {
      const ad = sosyalLinkAdNormalizeEt(String(adHam));
      if (!ad) return validasyonHatasi("Başlık / platform adı 1 ile 80 karakter arasında olmalıdır.", ["ad"]);
      guncellenecek.ad = ad;
    }

    if (urlHam !== undefined) {
      const url = sosyalLinkUrlNormalizeEt(String(urlHam));
      if (!url) return validasyonHatasi("Geçerli bir bağlantı adresi girin (örn. https://www.linkedin.com/...).", ["url"]);
      guncellenecek.url = url;
    }

    if (gorunurHam !== undefined) {
      if (typeof gorunurHam !== "boolean") return validasyonHatasi("Geçerli bir görünürlük değeri seçin.", ["gorunur"]);
      guncellenecek.gorunur = gorunurHam;
    }

    const depo = admin.storage.from(SOSYAL_IKON_BUCKET);
    let yeniIkonYolu: string | null = null;

    if (ikonDosyasi) {
      const ikonSonuc = await sosyalIkonDosyaKontrol(ikonDosyasi);
      if (!ikonSonuc.gecerli) return validasyonHatasi(ikonSonuc.hata, ["ikon"]);
      yeniIkonYolu = `sosyal-ikonlar/${crypto.randomUUID()}.${ikonSonuc.uzanti}`;
      const { error: yuklemeHatasi } = await depo.upload(yeniIkonYolu, ikonDosyasi, {
        contentType: ikonSonuc.mime,
        upsert: false,
      });
      if (yuklemeHatasi) {
        return hataYaniti("Yeni ikon dosyası yüklenemedi.", "Sosyal ikon Storage upload", yuklemeHatasi);
      }
      guncellenecek.ikon_yolu = yeniIkonYolu;
    }

    if (Object.keys(guncellenecek).length <= 1) {
      return validasyonHatasi("Güncellenecek alan bulunamadı.", ["body"]);
    }

    const { data: guncel, error: guncelleHatasi } = await admin
      .from(SOSYAL_LINKLER_TABLO)
      .update(guncellenecek)
      .eq("id", id)
      .select("id, ad, url, ikon_yolu, sira, gorunur, created_at")
      .single();

    if (guncelleHatasi || !guncel) {
      if (yeniIkonYolu) await depo.remove([yeniIkonYolu]);
      return hataYaniti("Sosyal medya linki güncellenemedi.", "Sosyal link UPDATE", guncelleHatasi);
    }

    if (yeniIkonYolu && mevcut.ikon_yolu && mevcut.ikon_yolu !== yeniIkonYolu) {
      await depo.remove([mevcut.ikon_yolu]);
    }

    anaSayfaYenile();
    return NextResponse.json({ link: linkNesnesi(admin, guncel) });
  } catch (error) {
    return sunucuHatasi(error, "PATCH /admin/api/sosyal-linkler");
  }
}

export async function DELETE(request: Request) {
  try {
    const kontrol = await adminGirisKontrol();
    if (!kontrol.gecerli) return kontrol.yanit;

    const id = new URL(request.url).searchParams.get("id") ?? "";
    if (!uuidGecerliMi(id)) return validasyonHatasi("Geçersiz bağlantı kimliği.", ["id"]);

    const admin = createAdminClient();
    const { data: mevcut, error: okumaHatasi } = await admin
      .from(SOSYAL_LINKLER_TABLO)
      .select("id, ikon_yolu")
      .eq("id", id)
      .maybeSingle();

    if (sosyalLinkKurulumuEksik(okumaHatasi)) return kurulumYaniti();
    if (okumaHatasi) return hataYaniti("Bağlantı okunamadı.", "Sosyal link DELETE SELECT", okumaHatasi);
    if (!mevcut) return NextResponse.json({ ok: true });

    const { error: silmeHatasi } = await admin
      .from(SOSYAL_LINKLER_TABLO)
      .delete()
      .eq("id", id);

    if (silmeHatasi) return hataYaniti("Bağlantı silinemedi.", "Sosyal link DELETE", silmeHatasi);

    const { error: dosyaHatasi } = await admin.storage.from(SOSYAL_IKON_BUCKET).remove([mevcut.ikon_yolu]);
    if (dosyaHatasi) {
      console.error("[Sosyal link silme] İkon dosyası silinemedi:", dosyaHatasi);
    }

    anaSayfaYenile();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return sunucuHatasi(error, "DELETE /admin/api/sosyal-linkler");
  }
}
