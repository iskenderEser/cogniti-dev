# Yanlış UTT hesap seçimi — geri alma

Kullanıcı 9 Kasım 2026 tarihinde UTT'nin dağıtıcı rol olduğunu, yayına bağlı token hesabını seçemeyeceğini netleştirdi ve yanlış SQL bağlantısının kaldırılmasını istedi.

SQL: `scripts/sql/eclub_utt_hesap_secimi_geri_al.sql`. Yanlış `cogniti_esnek_eclub_gonder(uuid,text,uuid[],uuid[],uuid)` RPC'si DROP edilir; mevcut E-Club öneri tüketim tetikleyicisindeki UTT hesap bağlamından Esnek tüketen dal kaldırılıp önceki tetikleyici tanımına dönülür. CASCADE, tablo silme, token/işlem geçmişi silme veya iade yoktur. Saha yayın açılışı ve ortak PM/Medikal Eczanem bağlantıları değiştirilmez.

Bu dosya üreticinin seçtiği hesapla E-Club dağıtımını henüz kurmaz. Uygulamanın mevcut yeni anlık gönderim ucu kaldırılan RPC'yi çağırdığı için bu yeni yol çalışmaz; API'ye eski firma hesabına otomatik geçiş eklenmedi. Önceden var olan eski öneri/plan tüketim yolu korunur. UTT ekranı/istemci bağlantısını doğru üretici hesabı kurgusuna çevirmek ayrı düzeltmedir; bu teslim yalnız istenen SQL geri almasıdır.

**Durum:** 9 Kasım 2026 tarihinde kullanıcı `eclub_utt_hesap_secimi_kaldirildi = true` sonucuyla geri alma SQL kurulumunu doğruladı. Yanlış RPC kaldırıldı; üreticinin seçtiği hesaba doğru E-Club tüketim bağlantısı henüz kurulmadı. Gerçek kullanıcı/tarayıcı testi yapılmadı; commit/push yapılmadı.

**Test:** Gerçek yerel PostgreSQL'de önce Adım 4 SQL'i kurulur, ardından geri alma SQL'i iki kez çalıştırılır. Yanlış RPC'nin olmaması, tetikleyicide hesap bağlamının kalkması, tek tetikleyicinin korunması, yükleme/tüketim/istek geçmişinin değişmemesi ve service_role'un artık yanlış RPC'yi çağıramaması sınanır. Sahte temel tablolar, yalnız /tmp Unix socket; Supabase veya gerçek kullanıcı testi değildir. Sonuç: `ECLUB_UTT_HESAP_SECIMI_GERI_AL_TEST_SONUCLARI.json`.

## Ortak üretici açılış tüketimi — yeni uygulama (9 Kasım 2026)

Kullanıcı E-Club yayınlarının üretici çıkışında kapsamdaki kayıtlı üye sayısı kadar, üreticinin seçtiği hesaptan tüketilmesini onayladı. UTT/BM ve E-Club yayınları aynı alıcı kaynağı/tüketim motoruna bağlandı; UTT'nin hesap seçimi ekran/API bağlantısı kaldırıldı, yeni yayının UTT dağıtımında ikinci tüketim yoktur. İK E-Club'a kapalıdır; saha yayınlarında ortak motoru kullanır. Eczanem ve geçmiş yayınların davranışı korunur. Yeni plan hesabı kaydeder, gerçek aktivasyonda tüketir; rezervasyon ayrı kalan iştir. Kod/SQL ve yerel testler hazır; kullanıcı `cogniti_ortak_yayin_anlik_tuketim_kuruldu = true` sonucuyla SQL kurulumunu doğruladı. Gerçek kullanıcıyla canlı gönderim testi henüz yapılmadı. Ayrıntı: `COGNITI_ORTAK_YAYIN_ANLIK_TUKETIM.md`. SQL: `scripts/sql/cogniti_ortak_yayin_anlik_tuketim.sql`.
