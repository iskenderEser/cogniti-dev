import { NextRequest, NextResponse } from "next/server";
import { bolisBaglami, uuidGecerliMi } from "@/lib/bolis/sunucu";
import type { BolisHedefRol, BolisKayitTipi, BolisSecenek } from "@/lib/bolis/tipler";

export interface BolisRaporKatilimci {
  oturum_id: string;
  katilimci_sira: number;
  katilimci_etiketi: string;
  ad: string | null;
  soyad: string | null;
  eposta: string | null;
  telefon: string | null;
  rol_grubu: BolisHedefRol | null;
  takim_adi: string | null;
  bolge_adi: string | null;
  eczane_adi: string | null;
  toplam_puan: number;
  maksimum_puan: number;
  basari_yuzdesi: number;
  dogru_sayisi: number;
  yanlis_sayisi: number;
  bos_sayisi: number;
  teslim_at: string | null;
}

export interface BolisRaporSoruAnalizi {
  soru_id: string;
  sira: number;
  soru_metni: string;
  dogru_secenek: string;
  puan: number;
  dogru_sayisi: number;
  yanlis_sayisi: number;
  bos_sayisi: number;
  cevaplanan_sayisi: number;
  dogru_orani: number;
  secenek_dagilimi: { anahtar: string; metin: string; adet: number }[];
}

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
      return NextResponse.json({ hata: "Bu rapora erişim yetkiniz bulunmuyor." }, { status: 403 });
    }

    const { data: sinav, error: sinavHata } = await b.db
      .from("bolis_sinavlari")
      .select(
        "sinav_id, erisim_kodu, baslik, aciklama, hedef_roller, yayin_araci, sure_dakika, baslangic_at, bitis_at, kayit_tipi, durum",
      )
      .eq("sinav_id", sinavId)
      .eq("firma_id", b.firmaId)
      .maybeSingle();

    if (sinavHata) {
      return NextResponse.json({ hata: "Sınav raporu okunamadı." }, { status: 503 });
    }
    if (!sinav) {
      return NextResponse.json({ hata: "Sınav bulunamadı." }, { status: 404 });
    }

    const [{ data: sorular }, { data: oturumlar }] = await Promise.all([
      b.db
        .from("bolis_sorulari")
        .select("soru_id, sira, soru_metni, secenekler, dogru_secenek, puan")
        .eq("sinav_id", sinavId)
        .order("sira", { ascending: true }),
      b.db
        .from("bolis_oturumlari")
        .select(
          "oturum_id, katilimci_sira, katilimci_etiketi, ad, soyad, eposta, telefon, rol_grubu, takim_adi, bolge_adi, eczane_adi, toplam_puan, maksimum_puan, dogru_sayisi, yanlis_sayisi, bos_sayisi, teslim_at",
        )
        .eq("sinav_id", sinavId)
        .eq("durum", "tamamlandi")
        .order("toplam_puan", { ascending: false })
        .order("teslim_at", { ascending: true }),
    ]);

    const anonimMi = (sinav.kayit_tipi as BolisKayitTipi) === "anonim";
    const oturumIdleri = (oturumlar ?? []).map((o) => o.oturum_id as string);

    const { data: cevaplar } =
      oturumIdleri.length > 0
        ? await b.db
            .from("bolis_cevaplari")
            .select("oturum_id, soru_id, secilen_secenek, dogru_mu")
            .in("oturum_id", oturumIdleri)
        : { data: [] };

    const maksimumPuan = (sorular ?? []).reduce((t, s) => t + Number(s.puan ?? 0), 0);

    const katilimcilar: BolisRaporKatilimci[] = (oturumlar ?? []).map((o) => {
      const toplam = Number(o.toplam_puan ?? 0);
      const maks = Number(o.maksimum_puan ?? maksimumPuan);
      return {
        oturum_id: o.oturum_id as string,
        katilimci_sira: Number(o.katilimci_sira),
        katilimci_etiketi: anonimMi
          ? `Katılımcı ${Number(o.katilimci_sira)}`
          : (o.katilimci_etiketi as string),
        ad: anonimMi ? null : ((o.ad as string | null) ?? null),
        soyad: anonimMi ? null : ((o.soyad as string | null) ?? null),
        eposta: anonimMi ? null : ((o.eposta as string | null) ?? null),
        telefon: anonimMi ? null : ((o.telefon as string | null) ?? null),
        rol_grubu: anonimMi ? null : ((o.rol_grubu as BolisHedefRol | null) ?? null),
        takim_adi: anonimMi ? null : ((o.takim_adi as string | null) ?? null),
        bolge_adi: anonimMi ? null : ((o.bolge_adi as string | null) ?? null),
        eczane_adi: anonimMi ? null : ((o.eczane_adi as string | null) ?? null),
        toplam_puan: toplam,
        maksimum_puan: maks,
        basari_yuzdesi: maks > 0 ? Math.round((toplam / maks) * 100) : 0,
        dogru_sayisi: Number(o.dogru_sayisi ?? 0),
        yanlis_sayisi: Number(o.yanlis_sayisi ?? 0),
        bos_sayisi: Number(o.bos_sayisi ?? 0),
        teslim_at: (o.teslim_at as string | null) ?? null,
      };
    });

    const katilimciSayisi = katilimcilar.length;
    const ortalamaPuan =
      katilimciSayisi > 0
        ? Math.round(
            (katilimcilar.reduce((t, k) => t + k.toplam_puan, 0) / katilimciSayisi) * 100,
          ) / 100
        : 0;
    const ortalamaBasari =
      katilimciSayisi > 0
        ? Math.round(
            katilimcilar.reduce((t, k) => t + k.basari_yuzdesi, 0) / katilimciSayisi,
          )
        : 0;
    const enYuksekPuan =
      katilimciSayisi > 0 ? Math.max(...katilimcilar.map((k) => k.toplam_puan)) : 0;
    const enDusukPuan =
      katilimciSayisi > 0 ? Math.min(...katilimcilar.map((k) => k.toplam_puan)) : 0;

    // Cevapları soruya göre grupla
    const cevapHaritasi = new Map<
      string,
      { secilen_secenek: string | null; dogru_mu: boolean | null }[]
    >();
    for (const c of cevaplar ?? []) {
      const sId = c.soru_id as string;
      const mevcut = cevapHaritasi.get(sId) ?? [];
      mevcut.push({
        secilen_secenek: (c.secilen_secenek as string | null) ?? null,
        dogru_mu: typeof c.dogru_mu === "boolean" ? c.dogru_mu : null,
      });
      cevapHaritasi.set(sId, mevcut);
    }

    const soruAnalizleri: BolisRaporSoruAnalizi[] = (sorular ?? []).map((s) => {
      const sId = s.soru_id as string;
      const kayitlar = cevapHaritasi.get(sId) ?? [];
      let dogru = 0;
      let yanlis = 0;
      let bos = 0;
      const secenekAdet = new Map<string, number>();

      for (const k of kayitlar) {
        if (!k.secilen_secenek) {
          bos++;
        } else {
          secenekAdet.set(k.secilen_secenek, (secenekAdet.get(k.secilen_secenek) ?? 0) + 1);
          if (k.dogru_mu) dogru++;
          else yanlis++;
        }
      }

      // Oturumu olup bu soruya kayıt atılmamış varsa boş say
      const eksikBos = Math.max(0, katilimciSayisi - (dogru + yanlis + bos));
      bos += eksikBos;

      const cevaplanan = dogru + yanlis;
      const secenekler = (s.secenekler as BolisSecenek[]) ?? [];

      return {
        soru_id: sId,
        sira: Number(s.sira),
        soru_metni: s.soru_metni as string,
        dogru_secenek: s.dogru_secenek as string,
        puan: Number(s.puan),
        dogru_sayisi: dogru,
        yanlis_sayisi: yanlis,
        bos_sayisi: bos,
        cevaplanan_sayisi: cevaplanan,
        dogru_orani: katilimciSayisi > 0 ? Math.round((dogru / katilimciSayisi) * 100) : 0,
        secenek_dagilimi: secenekler.map((opt) => ({
          anahtar: opt.anahtar,
          metin: opt.metin,
          adet: secenekAdet.get(opt.anahtar) ?? 0,
        })),
      };
    });

    const secEnYuksek = (alan: keyof Pick<BolisRaporSoruAnalizi, "dogru_sayisi" | "yanlis_sayisi" | "bos_sayisi" | "cevaplanan_sayisi">) => {
      if (soruAnalizleri.length === 0 || katilimciSayisi === 0) return null;
      const sirali = [...soruAnalizleri].sort((a, b) => b[alan] - a[alan] || a.sira - b.sira);
      return sirali[0][alan] > 0 ? sirali[0] : null;
    };

    return NextResponse.json({
      sinav,
      ozet: {
        katilimciSayisi,
        maksimumPuan,
        ortalamaPuan,
        ortalamaBasari,
        enYuksekPuan,
        enDusukPuan,
        soruSayisi: soruAnalizleri.length,
      },
      oneCikanlar: {
        enCokDogru: secEnYuksek("dogru_sayisi"),
        enCokYanlis: secEnYuksek("yanlis_sayisi"),
        enCokBos: secEnYuksek("bos_sayisi"),
        enCokCevaplanan: secEnYuksek("cevaplanan_sayisi"),
      },
      soruAnalizleri,
      katilimcilar,
    });
  } catch {
    return NextResponse.json({ hata: "Sınav raporu okunamadı." }, { status: 503 });
  }
}
