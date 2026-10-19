import type { IcerikTuru } from "@/lib/video/icerikTuru";

export interface UttVideoKategorisi {
  slug: string;
  urlSlug: string;
  icerikTuru: IcerikTuru;
  etiket: string;
  sayfaAciklamasi: string;
  rehberOzeti: string;
}

const ORTAK_SAYFA_ACIKLAMASI = "Sizin için atanmış tüm yayınları görebilirsiniz.";

export const UTT_VIDEO_KATEGORILERI = [
  {
    slug: "urun",
    urlSlug: "urun-egitimleri",
    icerikTuru: "urun",
    etiket: "Ürün Eğitimleri",
    sayfaAciklamasi: ORTAK_SAYFA_ACIKLAMASI,
    rehberOzeti: "Ürünlere dair bilgilerinizi farklı yayın tipleriyle geliştirebilirsiniz.",
  },
  {
    slug: "medikal",
    urlSlug: "medikal-egitimler",
    icerikTuru: "medikal",
    etiket: "Medikal Eğitimler",
    sayfaAciklamasi: ORTAK_SAYFA_ACIKLAMASI,
    rehberOzeti: "Medikal konulara dair bilgilerinizi farklı yayın tipleriyle geliştirebilirsiniz.",
  },
  {
    slug: "urun-medikal",
    urlSlug: "urun-medikal-egitimleri",
    icerikTuru: "urun_medikal",
    etiket: "Ürün-Medikal Eğitimleri",
    sayfaAciklamasi: ORTAK_SAYFA_ACIKLAMASI,
    rehberOzeti: "Ürünlerin medikal yönlerine dair bilgilerinizi farklı yayın tipleriyle geliştirebilirsiniz.",
  },
  {
    slug: "satis",
    urlSlug: "satis-egitimleri",
    icerikTuru: "egitim",
    etiket: "Satış Eğitimleri",
    sayfaAciklamasi: ORTAK_SAYFA_ACIKLAMASI,
    rehberOzeti: "Satış becerilerinizi farklı yayın tipleriyle geliştirebilirsiniz.",
  },
  {
    slug: "yonetim",
    urlSlug: "yonetim-egitimleri",
    icerikTuru: "yonetim",
    etiket: "Yönetim Eğitimleri",
    sayfaAciklamasi: ORTAK_SAYFA_ACIKLAMASI,
    rehberOzeti: "Yönetim becerilerinizi farklı yayın tipleriyle geliştirebilirsiniz.",
  },
  {
    slug: "ik",
    urlSlug: "ik-egitimleri",
    icerikTuru: "ik",
    etiket: "İK Eğitimleri",
    sayfaAciklamasi: ORTAK_SAYFA_ACIKLAMASI,
    rehberOzeti: "İK konularındaki bilgilerinizi farklı yayın tipleriyle geliştirebilirsiniz.",
  },
] as const satisfies ReadonlyArray<UttVideoKategorisi>;

export function uttVideoKategorisiBul(slug: string) {
  return UTT_VIDEO_KATEGORILERI.find((kategori) => kategori.urlSlug === slug);
}
