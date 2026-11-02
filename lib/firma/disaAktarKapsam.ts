export const DISA_AKTAR_KAPSAM = [
  {
    "key": "firma",
    "ad": "Firma Bilgileri",
    "alanlar": [
      "firma_id",
      "firma_adi",
      "adres",
      "il_id",
      "ilce_id",
      "vergi_dairesi",
      "vergi_numarasi",
      "sorumlu_ad_soyad",
      "sorumlu_eposta",
      "sorumlu_telefon",
      "logo_url",
      "aktif",
      "hbstore_aktif",
      "cc_aktif",
      "eclub_aktif",
      "eczanem_aktif",
      "created_at"
    ]
  },
  {
    "key": "kullanicilar",
    "ad": "Kullanıcılar",
    "alanlar": [
      "kullanici_id",
      "ad",
      "soyad",
      "eposta",
      "rol",
      "firma_id",
      "takim_id",
      "bolge_id",
      "aktif_mi",
      "created_at",
      "fotograf_url",
      "yetki_kullanici_yonetim",
      "yetki_aktif_pasif",
      "telefon"
    ]
  },
  {
    "key": "takimlar",
    "ad": "Takımlar",
    "alanlar": [
      "takim_id",
      "firma_id",
      "takim_adi",
      "created_at"
    ]
  },
  {
    "key": "bolgeler",
    "ad": "Takım-Bölge",
    "alanlar": [
      "bolge_id",
      "takim_id",
      "bolge_adi",
      "created_at"
    ]
  },
  {
    "key": "urunler",
    "ad": "Ürünler",
    "alanlar": [
      "urun_id",
      "firma_id",
      "takim_id",
      "urun_adi",
      "created_at",
      "barkod"
    ]
  },
  {
    "key": "teknikler",
    "ad": "Teknikler",
    "alanlar": [
      "teknik_id",
      "firma_id",
      "teknik_adi",
      "created_at"
    ]
  },
  {
    "key": "talepler",
    "ad": "Talepler",
    "alanlar": [
      "talep_id",
      "uretici_id",
      "urun_adi",
      "teknik_adi",
      "aciklama",
      "created_at",
      "takim_id",
      "dosya_urls",
      "hazir_video",
      "hazir_video_url",
      "urun_id",
      "teknik_id",
      "hazir_soru_seti",
      "soru_seti_buyuklugu",
      "video_basi_soru_sayisi",
      "egitim_turu",
      "icerik_turu",
      "firma_id",
      "talep_no",
      "secenek_sayisi",
      "hedef_roller",
      "egitim_id",
      "talep_no_goster",
      "yayin_oncesi_silme_durumu",
      "yayin_oncesi_silen_id",
      "yayin_oncesi_silme_tarihi",
      "ogrenme_araci_turu",
      "ogrenme_araci_tercihleri",
      "taslak_mi",
      "updated_at"
    ]
  },
  {
    "key": "yayinlar",
    "ad": "Yayınlar",
    "alanlar": [
      "yayin_id",
      "soru_seti_durum_id",
      "durum",
      "yayin_tarihi",
      "durdurma_tarihi",
      "urun_adi",
      "teknik_adi",
      "takim_id",
      "uretici_id",
      "video_basi_soru_sayisi",
      "soru_seti_buyuklugu",
      "video_url",
      "thumbnail_url",
      "video_puani",
      "soru_puani",
      "senaryo_id",
      "senaryo_durum_id",
      "video_durum_id",
      "soru_seti_id",
      "icerik_turu",
      "talep_no",
      "firma_adi",
      "egitim_turu",
      "firma_id",
      "hedef_roller",
      "video_suresi_saniye",
      "arac_id",
      "arac_durum_id",
      "arac_turu",
      "ogrenme_araci_puani",
      "arac_metadata_dogrulandi",
      "arac_dosya_yolu",
      "arac_kapak_yolu",
      "arac_mime_type",
      "arac_dosya_boyutu",
      "arac_checksum_sha256",
      "arac_sure_saniye",
      "arac_sayfa_sayisi",
      "arac_genislik",
      "arac_yukseklik"
    ]
  },
  {
    "key": "kosullar",
    "ad": "Yayın Koşulları",
    "alanlar": [
      "yayin_id",
      "soru_seti_durum_id",
      "uretici_id",
      "durum",
      "yayin_tarihi",
      "durdurma_tarihi",
      "created_at",
      "ileri_sarma_acik",
      "extra_puan",
      "hedef_roller",
      "tekrar_periyot_gun",
      "arac_durum_id",
      "satis_sarti_tipi",
      "gizli_sart_katlama_orani",
      "barem_tablosu",
      "karsilik_puan",
      "karsilik_tl",
      "cek_karsiligi_var_mi",
      "saha_puan_modeli",
      "eczanem_kazanim_modeli"
    ]
  },
  {
    "key": "kazanc",
    "ad": "Saha Puan Hareketleri",
    "alanlar": [
      "kazanilan_puan_id",
      "kullanici_id",
      "yayin_id",
      "izleme_id",
      "puan_turu",
      "puan",
      "created_at",
      "urun_id"
    ]
  },
  {
    "key": "ileri",
    "ad": "Saha İleri Sarma",
    "alanlar": [
      "kayit_id",
      "yayin_id",
      "kullanici_id",
      "izleme_id",
      "atlanan_sure",
      "atlama_baslangic",
      "atlama_bitis",
      "kaybedilen_puan",
      "created_at",
      "urun_id",
      "olay_id"
    ]
  },
  {
    "key": "yanlis",
    "ad": "Saha Yanlış Cevap",
    "alanlar": [
      "kayit_id",
      "kullanici_id",
      "yayin_id",
      "izleme_id",
      "soru_index",
      "kaybedilen_puan",
      "created_at",
      "urun_id"
    ]
  },
  {
    "key": "oneri_kayip",
    "ad": "Saha Öneri Kaybı",
    "alanlar": [
      "kayit_id",
      "kullanici_id",
      "yayin_id",
      "oneri_id",
      "kaybedilen_puan",
      "created_at",
      "urun_id"
    ]
  },
  {
    "key": "cc_kazanc",
    "ad": "BM Puan Hareketleri",
    "alanlar": [
      "puan_id",
      "bm_id",
      "yayin_id",
      "puan_turu",
      "puan",
      "izleme_id",
      "challenge_id",
      "created_at"
    ]
  },
  {
    "key": "cc_ileri",
    "ad": "BM İleri Sarma",
    "alanlar": [
      "kayit_id",
      "bm_id",
      "yayin_id",
      "izleme_id",
      "atlama_baslangic",
      "atlama_bitis",
      "atlanan_sure",
      "kaybedilen_puan",
      "created_at"
    ]
  },
  {
    "key": "cc_yanlis",
    "ad": "BM Yanlış Cevap",
    "alanlar": [
      "kayit_id",
      "bm_id",
      "yayin_id",
      "izleme_id",
      "soru_index",
      "verilen_cevap",
      "dogru_cevap",
      "kaybedilen_puan",
      "created_at"
    ]
  },
  {
    "key": "cc_kayip",
    "ad": "BM Challenge Kaybı",
    "alanlar": [
      "kayit_id",
      "kullanici_id",
      "yayin_id",
      "challenge_id",
      "urun_id",
      "kaybedilen_puan",
      "created_at"
    ]
  },
  {
    "key": "eclub_utt",
    "ad": "UTT E-Club Puanları",
    "alanlar": [
      "utt_puan_id",
      "utt_id",
      "kisi_id",
      "yayin_id",
      "izleme_id",
      "oneri_id",
      "urun_id",
      "puan",
      "created_at"
    ]
  },
  {
    "key": "izlemeler",
    "ad": "Saha Öğrenme",
    "alanlar": [
      "izleme_id",
      "yayin_id",
      "kullanici_id",
      "izleme_turu",
      "tamamlandi_mi",
      "izleme_baslangic",
      "izleme_bitis",
      "created_at",
      "oneri_id",
      "gercek_oynatma_mi",
      "soru_hakki_var_mi",
      "soru_hakki_nedeni",
      "video_suresi_saniye",
      "baslat_olay_id",
      "arac_turu",
      "ilerleme_durumu",
      "soru_erisimi_acik_mi"
    ]
  },
  {
    "key": "cc_izlemeler",
    "ad": "BM Öğrenme",
    "alanlar": [
      "izleme_id",
      "bm_id",
      "yayin_id",
      "izleme_turu",
      "challenge_id",
      "tamamlandi_mi",
      "ileri_sarildi_mi",
      "izleme_baslangic",
      "izleme_bitis",
      "created_at",
      "video_suresi_saniye",
      "cevaplandi_mi",
      "arac_turu",
      "ilerleme_durumu",
      "soru_erisimi_acik_mi",
      "arac_id"
    ]
  },
  {
    "key": "oneriler",
    "ad": "BM Öneri Gönderileri",
    "alanlar": [
      "oneri_id",
      "yayin_id",
      "oneren_id",
      "kullanici_id",
      "oneri_baslangic",
      "oneri_bitis",
      "izlendi_mi",
      "created_at"
    ]
  },
  {
    "key": "challenges",
    "ad": "Challenge Gönderileri",
    "alanlar": [
      "challenge_id",
      "gonderen_id",
      "alan_id",
      "yayin_id",
      "izlendi_mi",
      "son_tarih",
      "created_at",
      "arac_id",
      "arac_turu"
    ]
  },
  {
    "key": "eczane_puan",
    "ad": "E-Club Puan Hareketleri",
    "alanlar": [
      "kazanilan_puan_id",
      "kisi_id",
      "yayin_id",
      "izleme_id",
      "puan_turu",
      "puan",
      "created_at",
      "urun_id",
      "cek_karsiligi_var_mi",
      "eczane_id"
    ]
  },
  {
    "key": "eczane_kayip",
    "ad": "E-Club Puan Kayıpları",
    "alanlar": [
      "kayit_id",
      "olay_id",
      "izleme_id",
      "kisi_id",
      "yayin_id",
      "urun_id",
      "atlama_baslangic",
      "atlama_bitis",
      "atlanan_sure",
      "kaybedilen_puan",
      "created_at",
      "cek_karsiligi_var_mi"
    ]
  },
  {
    "key": "eczane_izleme",
    "ad": "E-Club Öğrenme",
    "alanlar": [
      "izleme_id",
      "yayin_id",
      "kisi_id",
      "izleme_turu",
      "tamamlandi_mi",
      "izleme_baslangic",
      "izleme_bitis",
      "created_at",
      "oneri_id",
      "soru_hakki_var_mi",
      "soru_hakki_nedeni",
      "video_suresi_saniye",
      "arac_turu",
      "ilerleme_durumu",
      "soru_erisimi_acik_mi"
    ]
  },
  {
    "key": "eczane_gonderi",
    "ad": "E-Club Gönderileri",
    "alanlar": [
      "oneri_id",
      "yayin_id",
      "oneren_id",
      "kisi_id",
      "oneri_baslangic",
      "oneri_bitis",
      "izlendi_mi",
      "created_at",
      "video_id",
      "arac_id",
      "arac_turu"
    ]
  },
  {
    "key": "devirler",
    "ad": "E-Club Devir Geçmişi",
    "alanlar": [
      "devir_id",
      "eczane_id",
      "yayin_id",
      "kaynak_donem_kodu",
      "hedef_donem_kodu",
      "puan",
      "kaynak_talep_id",
      "kullanildi_mi",
      "kullanilan_talep_id",
      "iptal_edildi",
      "created_at",
      "guncellenme_at"
    ]
  },
  {
    "key": "store_siparis",
    "ad": "FirmaStore Siparişleri",
    "alanlar": [
      "siparis_id",
      "firma_id",
      "cek_birim_tl",
      "toplam_tl",
      "kullanici_id",
      "urun_id",
      "adet",
      "puan_birim_fiyat",
      "toplam_puan",
      "durum",
      "kargo_firmasi",
      "kargo_takip_no",
      "iptal_sebebi",
      "created_at",
      "guncellenme_at",
      "teslim_alma_at",
      "kaynak_ceyrek_baslangici"
    ]
  },
  {
    "key": "store_harcama",
    "ad": "FirmaStore Harcama ve İade",
    "alanlar": [
      "harcama_id",
      "kullanici_id",
      "siparis_id",
      "puan_miktari",
      "tur",
      "created_at"
    ]
  },
  {
    "key": "eczane_dagitim",
    "ad": "Eczanem Eczane Dağıtımı",
    "alanlar": [
      "gonderim_id",
      "yayin_id",
      "eczane_id",
      "gonderen_utt_id",
      "created_at",
      "arac_id",
      "arac_turu"
    ]
  },
  {
    "key": "uye_dagitim",
    "ad": "Eczanem Üye Dağıtımı",
    "alanlar": [
      "gonderim_id",
      "yayin_id",
      "eczane_id",
      "musteri_id",
      "gonderen_kisi_id",
      "created_at",
      "arac_id",
      "arac_turu"
    ]
  },
  {
    "key": "uye_izleme",
    "ad": "Eczanem Öğrenme",
    "alanlar": [
      "izleme_id",
      "gonderim_id",
      "musteri_id",
      "yayin_id",
      "tamamlandi_mi",
      "izleme_baslangic",
      "izleme_bitis",
      "video_suresi_saniye",
      "cevaplandi_mi",
      "son_konum_saniye",
      "arac_turu",
      "ilerleme_durumu",
      "soru_erisimi_acik_mi"
    ]
  },
  {
    "key": "tarifeler",
    "ad": "Eczanem Tarifeleri",
    "alanlar": [
      "tarife_id",
      "urun_id",
      "puan",
      "tl",
      "gecerlilik_baslangic",
      "olusturan_id",
      "created_at",
      "satis_fiyati"
    ]
  },
  {
    "key": "uye_siparis",
    "ad": "Eczanem İndirim İşlemleri",
    "alanlar": [
      "siparis_id",
      "musteri_id",
      "musteri_etiket",
      "eczane_id",
      "urun_id",
      "adet",
      "kullanilan_puan",
      "indirim_tl",
      "tarife_snapshot",
      "durum",
      "islem_kodu",
      "onay_tarihi",
      "created_at",
      "islem_yapan_kisi_id",
      "karar_tarihi"
    ]
  },
  {
    "key": "uyelikler",
    "ad": "Eczanem Üyelikleri",
    "alanlar": [
      "uyelik_id",
      "musteri_id",
      "eczane_id",
      "aktif_mi",
      "created_at",
      "son_islem_yapan_kisi_id",
      "son_islem_tarihi"
    ]
  },
  {
    "key": "eczaneler",
    "ad": "Eczaneler",
    "alanlar": [
      "eczane_id",
      "gln",
      "created_at"
    ]
  },
  {
    "key": "eczane_kisiler",
    "ad": "E-Club Üyeleri",
    "alanlar": [
      "kisi_id",
      "rol",
      "ad",
      "soyad",
      "eposta",
      "telefon",
      "created_at"
    ]
  },
  {
    "key": "eczane_baglar",
    "ad": "E-Club Üyelikleri",
    "alanlar": [
      "id",
      "kisi_id",
      "eczane_id",
      "aktif_mi",
      "baslangic_tarihi",
      "bitis_tarihi",
      "created_at"
    ]
  },
  {
    "key": "uye_kisiler",
    "ad": "Eczanem Üyeleri",
    "alanlar": [
      "musteri_id",
      "telefon",
      "ad_soyad",
      "aktif_mi",
      "created_at",
      "ad",
      "soyad"
    ]
  },
  {
    "key": "eczane_utt",
    "ad": "Eczane Temsilci Bağları",
    "alanlar": [
      "id",
      "eczane_firma_id",
      "utt_id",
      "aktif_mi",
      "created_at",
      "bitis_tarihi"
    ]
  },
  {
    "key": "indirim_kaynak",
    "ad": "İndirim Puan Kaynakları",
    "alanlar": [
      "kaynak_id",
      "eczanem_indirim_onay_id",
      "yayin_id",
      "arac_id",
      "arac_turu",
      "teknik_adi",
      "pm_ogrenme_puani",
      "kullanilan_puan"
    ]
  },
  {
    "key": "master",
    "ad": "Eczane Bilgileri",
    "alanlar": [
      "gln",
      "eczane_adi",
      "il",
      "ilce",
      "kaynak",
      "onay_durumu",
      "ekleyen_utt_id",
      "created_at"
    ]
  },
  {
    "key": "firma_eczaneler",
    "ad": "Firma Eczane Bağları",
    "alanlar": [
      "id",
      "eczane_id",
      "firma_id",
      "baglayan_utt_id",
      "aktif_mi",
      "created_at"
    ]
  },
  {
    "key": "cekler",
    "ad": "E-Club Çek Talepleri",
    "alanlar": [
      "talep_id",
      "eczane_id",
      "firma_id",
      "yayin_id",
      "talep_eden_kisi_id",
      "toplanan_puan",
      "talep_edilen_cek_tl",
      "siparis_tipi",
      "siparis_verildi_mi",
      "siparis_adet",
      "siparis_mal_fazlasi",
      "durum",
      "utt_id",
      "bm_id",
      "bm_onay_tarihi",
      "cek_kodu",
      "cek_gonderim_tarihi",
      "devreden_puan",
      "donem_kodu",
      "created_at",
      "guncellenme_at",
      "tm_id",
      "tm_onay_tarihi"
    ]
  },
  {
    "key": "uye_puan",
    "ad": "Eczanem Puan Hareketleri",
    "alanlar": [
      "kayit_id",
      "musteri_id",
      "eczane_id",
      "firma_id",
      "urun_id",
      "izleme_id",
      "puan_turu",
      "puan",
      "kalan_puan",
      "created_at"
    ]
  },
  {
    "key": "silinmeler",
    "ad": "E-Club Dönem Kapanışları",
    "alanlar": [
      "eczane_id",
      "yayin_id",
      "donem_kodu",
      "satis_sarti_tipi",
      "silinen_puan",
      "neden",
      "kapanis_at"
    ]
  },
  {
    "key": "planlar",
    "ad": "Planlı Gönderiler",
    "alanlar": [
      "plan_id",
      "utt_id",
      "kisi_id",
      "yayin_id",
      "urun_id",
      "hedef_gonderim_at",
      "durum",
      "oneri_id",
      "gerceklesti_at",
      "son_hata_kodu",
      "created_at"
    ]
  },
  {
    "key": "onaylar",
    "ad": "Eczanem İndirim Onayları",
    "alanlar": [
      "eczanem_indirim_onay_id",
      "kaynak_siparis_id",
      "eczane_id",
      "eczane_adi",
      "firma_id",
      "takim_id",
      "urun_id",
      "urun_adi",
      "onay_tarihi",
      "kullanilan_puan",
      "indirim_tl",
      "tarife_puan",
      "tarife_tl",
      "satis_fiyati"
    ]
  },
  {
    "key": "mutabakat",
    "ad": "Eczanem Mutabakatlar",
    "alanlar": [
      "mutabakat_id",
      "onay_durumu",
      "utt_karar",
      "utt_karar_veren_id",
      "utt_karar_tarihi",
      "utt_gonderim_tarihi",
      "bm_id",
      "bm_karar",
      "bm_karar_veren_id",
      "bm_karar_tarihi",
      "bm_onay_tarihi",
      "tm_id",
      "tm_karar",
      "tm_karar_veren_id",
      "tm_karar_tarihi",
      "tm_onay_tarihi"
    ]
  },
  {
    "key": "kararlar_utt",
    "ad": "UTT Mutabakat Geçmişi",
    "alanlar": [
      "karar_id",
      "mutabakat_id",
      "surum",
      "karar",
      "karar_veren_id",
      "karar_tarihi"
    ]
  },
  {
    "key": "kararlar_bm",
    "ad": "BM Mutabakat Geçmişi",
    "alanlar": [
      "karar_id",
      "mutabakat_id",
      "surum",
      "karar",
      "karar_veren_id",
      "karar_tarihi"
    ]
  },
  {
    "key": "kararlar_tm",
    "ad": "TM Mutabakat Geçmişi",
    "alanlar": [
      "karar_id",
      "mutabakat_id",
      "surum",
      "karar",
      "karar_veren_id",
      "karar_tarihi"
    ]
  },
  {
    "key": "viva",
    "ad": "Viva Etkinlikleri",
    "alanlar": [
      "etkinlik_id",
      "sahip_id",
      "firma_id",
      "baslik",
      "aciklama",
      "baslangic",
      "bitis",
      "durum",
      "created_at"
    ]
  },
  {
    "key": "viva_davetli",
    "ad": "Viva Davetlileri",
    "alanlar": [
      "etkinlik_id",
      "tur",
      "kullanici_id",
      "kisi_id"
    ]
  },
  {
    "key": "viva_kullanim",
    "ad": "Viva Kullanımı",
    "alanlar": [
      "etkinlik_id",
      "sahip_id",
      "kapanis",
      "durum",
      "katilim_sayisi",
      "oturum_sayisi",
      "toplam_saniye",
      "token",
      "kko_asim",
      "donem",
      "tamamlandi"
    ]
  },
  {
    "key": "token_hesap",
    "ad": "Token Hesabı",
    "alanlar": [
      "firma_id",
      "paket_turu",
      "aylik_paket_miktari",
      "asim_borcu",
      "token_pasif_at",
      "token_pasif_neden"
    ]
  },
  {
    "key": "token_yukleme",
    "ad": "Token Yüklemeleri",
    "alanlar": [
      "yukleme_id",
      "yukleme_turu",
      "miktar",
      "kalan",
      "son_kullanim_at",
      "aciklama",
      "created_at"
    ]
  },
  {
    "key": "token_tuketim",
    "ad": "Token Tüketimleri",
    "alanlar": [
      "tuketim_id",
      "gonderen_turu",
      "gonderen_id",
      "alici_turu",
      "alici_kimligi",
      "islem_turu",
      "kaynak_id",
      "miktar",
      "asim_miktari",
      "created_at"
    ]
  },
  {
    "key": "hediye_urun",
    "ad": "FirmaStore Çekleri",
    "alanlar": [
      "urun_id",
      "ad",
      "aciklama",
      "gorsel_url",
      "minimum_siparis_tl",
      "stok",
      "aktif_mi",
      "created_at",
      "updated_at"
    ]
  },
  {
    "key": "store_cek_tanimlari",
    "ad": "FirmaStore Çek Tanımları",
    "alanlar": ["firma_id", "urun_id", "aktif_mi", "baz_puan", "updated_at"]
  }
] as const;
