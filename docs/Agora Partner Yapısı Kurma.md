# Agora Partner Yapısı Kurma

Cogniti Agora’nın `/partner` üzerinden açılan iş partneri tarafını kurmak için yapılacaklar:

1. ✅ **Partner giriş sayfasını oluşturmak.**\
   `/partner` adresinde, mevcut firma, E-Club ve Eczanem girişlerinden ayrı bir kayıt ve giriş ekranı hazırlanacak.

2. ✅ **Üyelik kaydını oluşturmak.**\
   Eğitimci veya eğitim firması yetkilisinden ad soyad, e-posta ve cep telefonu alınacak.

3. ✅ **Admin ilk giriş onayı sonrasında test şifresiyle girişi sağlamak.**\
   Güncel kullanıcı kararı: Test ortamında gerçek e-posta gönderilmez. Admin ilk giriş onayı verirken partner için test şifresi belirler. Onaylanan partner, başvurduğu test e-postası ve bu şifreyle yalnız profil tamamlama alanına girer. Şirket profili ve ikinci üyelik onayı tamamlanmadan eğitim yönetimi açılmaz.

4. ✅ **Zorunlu profil tamamlama ekranını hazırlamak.**\
   Kayıttaki ad soyad, e-posta ve cep telefonu hazır gelecek. Ayrıca şu bilgiler istenecek:

   - Şirket adı
   - İl, ilçe ve adres
   - Vergi dairesi ve vergi numarası
   - IBAN
   - Logo

5. ✅ **Partnerin eğitim yönetim alanını oluşturmak.**\
   Partner kendi eğitimlerini listeleyebilecek, yeni eğitim ekleyebilecek ve eğitim bilgilerini yönetebilecek. Diğer partnerlerin yönetim alanına erişemeyecek.

6. ✅ **Eğitim oluşturma formunu hazırlamak.**\
   Her eğitim için kategori, eğitim adı, Cogniti hedef kitlesi, yayın aracı, 500 kelimelik açıklama ve satış fiyatı girilecek.

7. **Eğitim ve tanıtım dosyalarının yüklenmesini sağlamak.**\
   Video veya podcast eğitim içeriği ile ayrı bir **2 dakikalık tanıtım videosu** yüklenebilecek. Viva bu aşamada kapsam dışında kalacak.

8. ✅ **Eğitimin Agora’da yayımlanmasını sağlamak.**\
   Gerekli bilgileri ve dosyaları tamamlanan eğitim, önceden admin onayı gerektirmeden Agora’da listelenebilecek.

9. **Cogniti Partner Yönetimini genişletmek.**\
   Her partner firma sol sidebar’da listelenecek. Standart beş alt sayfanın her biri ayrı iş adımıdır:

   - 9.0: Partner firma listesi ve standart alt sayfa gezinmesi.
   - 9.1: Firma Bilgileri.
   - 9.2: Üyelik ve Yetkiler.
   - 9.3: Yayınlar — inceleme, aktif/pasif ve silme.
   - 9.4: Hak Edişleri — oluşan, ödenen ve bekleyen tutarlar.
   - 9.5: Raporlar — satın alınan, beğenilen ve favorilenen eğitimler.

10. **Telif ve kullanım koşullarını açıkça göstermek.**\
    Telif hakkının partnerde kaldığı; her satın almanın, tek seferde bir veya istenen sayıda kişiye yapılacak **tek yayın hakkı** verdiği belirtilecek.

11. **Kayıttan yayımlamaya kadar akışı kontrol etmek.**\
    Kayıt, geçici şifreyle giriş, profil tamamlama, eğitim ve tanıtım videosu yükleme, fiyat girme, Agora’da listelenme ve admin müdahaleleri birlikte kontrol edilecek.


## Adım 1 tamamlanma kaydı — 4 Kasım 2026

- `/partner` adresinde Cogniti Agora / Cogniti İş Partnerleri başlıklı ayrı giriş ve üyelik ekranı hazırlandı.
- Ortak Cogniti logosu, tema renkleri, form bileşenleri ve Sade Sekmeler kullanıldı. Sekmeler, klavye erişimi ve şifre göster/gizle kontrolü mevcut.
- Yalnız tam `/partner` adresi açık sayfa olarak tanımlandı; alt yollar için genel bir erişim muafiyeti eklenmedi.
- Bu adım ekran hazırlığıdır. Üyelik kaydı, hesap oluşturma, giriş doğrulaması ve geçici şifre e-postası henüz bağlanmadı; işlem düğmeleri devre dışıdır ve ekranda erişimin henüz açılmadığı belirtilir. Adım 2 ve 3 tamamlanmış değildir.
- Doğrulama: proje TypeScript kontrolü, değişen dosyaların ESLint kontrolü ve `git diff --check` başarılı. Yerel `/partner` HTTP 200 döndürdü. Dar tarayıcı görünümünde giriş/üyelik sekmeleri ve şifre göster/gizle kontrolü doğrulandı.
- Veritabanında işlem, gerçek üyelik/e-posta, commit/push veya canlı dağıtım yapılmadı.


## Adım 2 uygulama kaydı — 4 Kasım 2026

**Durum: Tamamlandı. Kod ve yerel doğrulamalar hazır; kullanıcı canlı SQL kurulumunu `agora_partner_uyelik_kaydi_hazir = true` sonucuyla doğruladı.**

- Ad soyad, e-posta ve cep telefonu formu `/partner/api/kayit` kayıt ucuna bağlandı. İş Partneri Olunuz butonu aktiftir.
- Alanlar istemci ve sunucuda doğrulanır. Türkçe adlar korunur; e-posta küçük harfe, Türkiye cep telefonu 10 haneli biçime getirilir. İletişim alanları ve ad soyad zorunludur.
- Kayıtlar ayrı `agora_is_partnerleri` tablosunda tutulur. Mevcut firma, E-Club, Eczanem veya Auth kayıtları değiştirilmez.
- E-posta ve telefon tekildir. Tekrarlı veya eşzamanlı istek ikinci üyelik oluşturamaz; mevcut kişinin bilgilerini değiştiremez. API mevcut e-posta/telefonun kayıtlı olup olmadığını açıklamaz.
- Tablo anonim/oturumlu istemcilere kapalıdır. Kayıt RPC'si yalnız sunucunun service role yetkisiyle çağrılır. API aynı origin, JSON ve en fazla 4 KB gövde kontrolü uygular; istemciden rol/firma/aktiflik bilgisi kabul etmez.
- Form çift gönderimi engeller, hata halinde bilgileri koruyup tekrar denemeye izin verir. Başarı yalnız kalıcı kayıt çağrısı doğrulanınca gösterilir. Ağ ve kurulum hatası başarı gibi gösterilmez.
- Geçici şifre, e-posta gönderimi ve giriş doğrulaması Adım 3'tedir; bu çalışmada açılmadı. Başarılı kayıt mesajı şifre gönderildiğini söylemez.

**Doğrulama:** 6/6 hedefli API/form testi, sahte kayıtlarla yerel PGlite PostgreSQL motorunda 21/21 kontrol, proje TypeScript kontrolü ve `git diff --check` başarılı. ESLint hata yok; yeni RPC eski şema snapshot'ında bulunmadığı için 1 uyarı var. SQL iki kez kuruldu; Türkçe ad, tekillik, tekrar istek, geçersiz alan ve anonim/oturumlu doğrudan erişim reddi sınandı. PGlite kontrolü iki bağımsız PostgreSQL bağlantısının yarış testi değildir. Tarayıcıda kayıt alanları ve etkin kayıt butonu görüldü; gerçek başvuru gönderilmedi.

**Kullanıcının çalıştıracağı kurulum:** `scripts/sql/agora_partner_uyelik_kaydi.sql` dosyasının tamamı tek parça çalıştırılır. Beklenen sonuç: `agora_partner_uyelik_kaydi_hazir = true`. Kurulum kendiliğinden üyelik veya e-posta oluşturmaz. Kullanıcı aşağıdaki başarı sonucunu iletti; Adım 2 bu teyitle tamamlandı işaretlendi.

Canlı veritabanında SQL, gerçek üyelik/e-posta, commit/push veya dağıtım yapılmadı.


### Adım 2 — Kullanıcı SQL sonucu

Kullanıcı `agora_partner_uyelik_kaydi_hazir = true` sonucunu paylaştı. Canlı SQL kurulum teyidi alındı ve Adım 2’ye ✅ konuldu. Önceki kurulum bekleyişi bu sonuçla kapandı. Bu teyit gerçek kullanıcıyla uçtan uca üyelik testi veya geçici şifre e-postası teslimat testi değildir; geçici şifre gönderimi Adım 3 kapsamındadır.


## Adım 3 öncesi eklenen admin onay akışı

Kullanıcı kararı: Partner kaydı doğrudan giriş ve tam üyelik açmayacak. İlk giriş onayı ve profil tamamlandıktan sonra üyelik onayı ayrı olacaktır. Ortamın tüm verileri/kullanıcıları/rolleri test kapsamındadır; partner girişleri de test e-postası ve şifresiyle sınanacaktır. Gerçek e-posta gönderimi bu aşamada yapılmayacak. Önceki Adım 3 geçici şifre/e-posta planı bu onay akışı kurulana kadar bekler.

- [x] Admin sidebar'ında üstte **COGNITI PARTNER YÖNETİMİ** sekmesi; altında **COGNITI FİRMA YÖNETİMİ** başlığı. Partner bölümü `/admin?bolum=partnerler` ile firma seçiminden bağımsız açılır.
- [x] Partner yönetim sayfasında **İlk Giriş Onayı** ve **Üyelik Onayı** sekmelerinin ekran yapısı. Merkezi admin alanıdır; firma adminine açılmaz.
- [x] Başvuruları ilk giriş onayı listesine bağlamak ve admin kararlarını kaydetmek. Kod/yerel doğrulama tamam; kullanıcı yeni SQL kurulumunu true sonucuyla doğruladı.
- [x] İlk onaydan sonra test e-postası/şifresiyle yalnız profil tamamlama erişimini sağlayan kod ve SQL kurulumunu tamamlamak. Gerçek tarayıcı kabulü aşağıda ayrıca bekler.
- [ ] Tamamlanan profili üyelik onayına getirmek; admin üyelik onayından sonra eğitim yönetimini açmak.

**Bu teslimin sınırı:** Sidebar ve iki onay sekmeli sayfa hazırdır; henüz başvuru listesi okunmaz veya onay/ret işlemi yapılmaz. Ekranlar boş liste iddiası yerine onay işlemlerinin henüz açılmadığını belirtir. Eğitimlerin doğrudan Agora'da yayımlanması kararı değişmez; bu onaylar partnerin giriş ve üyelik yetkisine ilişkindir.

**Doğrulama:** Proje TypeScript kontrolü, değişen dosyaların ESLint ve `git diff --check` kontrolleri başarılı. Gerçek React bileşenleriyle sidebar sırası, aktif sekme, firma admininden gizleme, iki onay sekmesi ve breadcrumb kontrol edildi; firma admininin global partner adresine erişim reddi ortak erişim fonksiyonuyla doğrulandı. Gerçek admin oturumuyla tarayıcı kontrolü yapılmış sayılmaz. SQL, gerçek kayıt/onay/e-posta veya dağıtım yapılmadı.


## İlk Giriş Onayı ve test girişi — uygulama kaydı

**Durum: Kullanıcı `agora_partner_ilk_giris_onayi_hazir = true` sonucuyla SQL kurulumunu doğruladı. Kod ve yerel kontroller tamamlandı; gerçek tarayıcı kabulü ayrıca izleniyor.**

- [x] Admin başvuru listesinin ve Onayla/Reddet işlemlerinin kodunu hazırlamak; bekleyen/onaylanan/reddedilen/tümü filtreleri, 20 kayıtlık sayfalama ve Yenile eklemek.
- [x] Test şifresiyle giriş, ayrı partner oturumu, profil alanı erişim kapısı ve çıkış kodunu hazırlamak.
- [x] Yerel API, şifre, oturum ve admin ekranı davranışlarını doğrulamak.
- [x] `scripts/sql/agora_partner_ilk_giris_onayi.sql` kurulumunu kullanıcı sonucuyla doğrulamak. Kullanıcının ilettiği sonuç: `agora_partner_ilk_giris_onayi_hazir = true`.
- [x] Test başvurusu → admin ilk onayı → test şifresiyle partner giriş/profil akışını gerçek tarayıcıda doğrulamak.
- [ ] Ret sonrası giriş engelini gerçek tarayıcıda ayrıca doğrulamak (yerel kontroller başarılı).

### Uygulanan davranış

Başvurular ad soyad, e-posta, cep telefonu, başvuru zamanı ve ilk giriş durumu ile merkezi adminin Partner Yönetimi alanında listelenir. Liste şifre veya şifre özeti döndürmez. Admin Onayla seçtiğinde en az 6, en fazla 128 karakterlik test şifresini girer. Reddet işlemi giriş hakkını kapatır. Karar veren, zaman, önceki/yeni durum ve sürüm tarihçeye kaydedilir. Eski ekran sürümüyle karar reddedilir; aynı başvuruda mükerrer/eşzamanlı işlem iki karar oluşturmaz. Ret mevcut partner oturumlarını da kaldırır. Diğer roller/firma admini işlemi yapamaz; API ve SQL ayrı admin kontrolleri uygular.

Partner şifresi salt+scrypt özetiyle tutulur. E-posta gönderilmez, Supabase Auth hesabı veya mevcut kullanıcı rolü oluşturulmaz/değiştirilmez. Partner oturumu ayrı, HttpOnly, SameSite=Lax, üretimde Secure ve `/partner` kapsamlı çerez kullanır; oturumun DB kaydında yalnız rastgele tokenın SHA-256 özeti bulunur. Süresi 8 saattir. Her profil okuması onayı, sürümü ve süreyi sunucuda doğrular. Onaysız/reddedilmiş kullanıcı giriş yapamaz; yanlış girişler 15 dakikalık pencerede beş denemeyle sınırlandırılır.

Başarılı giriş yalnız `/partner/profil` alanına gider. Burada kayıtlı üç kimlik alanı salt okunur gösterilir ve çıkış yapılabilir. Şirket/vergi/adres/IBAN/logo alanlarının kaydı bu teslimde açılmadı; bu, profil tamamlama kapısının ilk ekranıdır. İkinci üyelik onayı ve eğitim yönetimi açılmadı.

### Doğrulama ve sınırlar

- 9/9 hedefli uygulama testi: üyelik regresyonu, form doğrulama/çift tıklama/tekrar, şifre özeti, istek origin ve boyut kapıları, gerçek admin React bileşeninde liste/karar/yenileme.
- Ayrı yerel PGlite PostgreSQL motorunda değiştirilmemiş iki SQL ile 75/75 kontrol: kurulum/tekrar kurulum, admin ve sekiz yetkisiz rol durumu, onaysız giriş, onaylı giriş, şifre/hash/çerez izolasyonu, oturum ömrü/çıkış/ret, deneme sınırı, eski sürüm ve iki karar çakışması, sayfalama, SQL erişim izinleri. Gerçek API handlerları sahte Supabase/cookie bağlayıcısıyla çalıştırıldı. Bu kontrol iki bağımsız PostgreSQL bağlantısıyla yarış testi değildir.
- Proje TypeScript kontrolü ve `git diff --check` başarılı. ESLint hata yok; yeni RPC'lerin eski şema snapshot'ında bulunmaması nedeniyle 7 uyarı var.
- Canlı SQL, gerçek başvuru/onay/test hesabı, gerçek e-posta, commit/push veya dağıtım yapılmadı. Gerçek admin/partner oturumuyla tarayıcı kabulü kurulum sonrasında yapılacak.

SQL yalnız yapı ve işlevleri kurar; mevcut başvurular varsayılan olarak ilk giriş onayı bekler. Hiçbir partnere kendiliğinden şifre, onay veya üyelik vermez. SQL başarı teyidinden önce işlevler canlıda tamamlandı sayılmaz.


### İlk giriş onayı — kullanıcı kurulum sonucu

Kullanıcı `agora_partner_ilk_giris_onayi_hazir = true` sonucunu paylaştı. Yukarıdaki yeni SQL kurulumu bekleyişi bu teyitle kapandı. Kod ve kurulum maddeleri check ile işaretlendi; gerçek tarayıcıda başvuru/onay/giriş kabulü ve şirket profilinin tamamlanması henüz bitmiş sayılmaz.


### Adım 3 — Tarayıcı kabulü tamamlandı

Test başvurusu admin listesinde görüldü. Kullanıcı admin ekranından test şifresini belirleyip ilk giriş onayını kaydetti; ekrandaki başarı mesajı doğrulandı. Kullanıcı test hesabıyla giriş yaptı. Tarayıcıda `/partner/profil` açıldığı, Agora Test Partneri hesabının kayıtlı ad/e-posta/telefon bilgilerinin gösterildiği ve eğitim yönetiminin henüz açılmadığı doğrulandı. Adım 3 bu akış için ✅ işaretlendi. Gerçek e-posta gönderilmedi. Ret sonrası erişim engelinin gerçek tarayıcı kontrolü ayrıca bekler; bu kontrol yapılmış sayılmaz. Sonraki iş adımı 4: şirket bilgileriyle zorunlu profil tamamlama formu.


### Partner test hesabı düzenlemesi — 4 Kasım 2026

Kullanıcı kararı: Test giriş e-postası `ali@testpartner.com`, şifresi `123456`. Partner giriş ve admin test şifresi alanlarının istemci/sunucu alt sınırı 6 karaktere indirildi; scrypt doğrulaması korunuyor. `scripts/sql/agora_partner_test_hesabi_guncelle.sql` yalnız mevcut onaylı Agora Test Partneri kaydını günceller, ilk giriş/üyelik onay durumunu değiştirmez, eski oturumları kapatır. ✅ Kullanıcı `agora_partner_test_hesabi_guncellendi = true` sonucuyla SQL güncellemesini doğruladı. Güncel test hesabı: `ali@testpartner.com` / `123456`. Bu yeni bilgilerle tarayıcı giriş kontrolü henüz yapılmadı.


## Adım 4 — Zorunlu şirket profili (kurulum bekliyor)

Kayıtlı ad soyad/e-posta/telefon hazır ve salt okunur gelir. Şirket adı, il/ilçe, adres, vergi dairesi/numarası, Türkiye IBAN ve PNG/JPEG/WebP logo zorunludur. Mevcut Cogniti konum/vergi listeleri kullanılır. Logo en fazla 5 MB, özel depoda ve yalnız partner oturumuyla erişilir. Profil sunucuda doğrulanır ve kaydedilir; kullanıcı kimliği formdan alınmaz. Kayıt üyelik onayı bekler; otomatik üyelik veya eğitim yönetimi açılmaz.

- [x] Form, sunucu kayıt/okuma ve özel logo erişimini hazırlamak.
- [x] Yerel doğrulamaları tamamlamak: 44/44 gerçek SQL/API kontrolü (ayrı yerel PGlite, sahte Storage/çerez), mevcut 9/9 partner uygulama testi, TypeScript ve diff kontrolü başarılı. ESLint 0 hata, yeni RPC’lerin eski şema snapshot’ında olmamasından kaynaklanan 2 uyarı.
- [x] Kullanıcı `agora_partner_profil_tamamlama_hazir = true` sonucuyla SQL kurulumunu doğruladı.
- [x] Test partneriyle profil kaydını, kayıt sonrası sunucudan yeniden okumayı ve kayıtlı logonun gösterimini tarayıcıda doğrulamak.

Belirsiz ağ sonucu sonrasında yeni yüklenen logo silinmez; kaydın tamamlanmış olma olasılığı korunur. Değiştirilen eski logolar için otomatik toplu temizlik bu adımda eklenmedi.

Tarayıcıda `ali@testpartner.com` / `123456` ile giriş ve yeni formun açılması doğrulandı. 390 ve 768 piksel genişlikte yatay taşma yok; mobil tek, tablet iki sütun. SQL henüz kurulmadığı için profil okuması hata gösterir ve form kilitli kalır; bu beklenen kurulum öncesi durumdur. Yeni profilin kaydı, özel Storage yükleme/okuma ve sayfa yenilemesinde verilerin korunması canlı tarayıcıda henüz doğrulanmadı. Ana listedeki 4. adım kurulum ve bu kabul sonrasında ✅ yapılacak.


### Adım 4 — SQL kurulum teyidi

Kullanıcı `agora_partner_profil_tamamlama_hazir = true` sonucunu iletti. Önceki kurulum bekleyişi kapandı. Test partner oturumunda profil API’si boş profil ve `profil_bekliyor` durumunu doğru döndürdü; sayfa yenilenince form etkinleşti. Test şirket/konum/adres/vergi/IBAN değerleri forma girildi, henüz kaydedilmedi. Chrome’un şifre uyarısı nedeniyle tarayıcı işlemi kullanıcıya bırakıldı. Logo yükleme, kayıt ve yeniden açma kabulü bekler; 4. adım henüz tamamlandı sayılmaz. Projedeki SQL dosyasının yalnız `c` içerdiği görüldü; daha önce yerel testten geçmiş tam kaynak dosya geri konuldu. Veritabanında SQL çalıştırılmadı.

Tarayıcı devamı: Chrome şifre uyarısı artık görünmüyor. Dosya seçicisi açıldı, ancak uzantı `Allow access to file URLs` izni bulunmadığı için `setFiles` yüklemeyi reddetti. Test formu dolu ve kaydedilmemiş durumda; kullanıcı dosya erişim iznini açtıktan sonra logo/kayıt kabulüne devam edilecek. Önceki şifre uyarısı bekleyişinin yerini bu dosya erişim engeli aldı.

- [x] 5 Kasım 2026: Kullanıcı isteğiyle logo dosya alanı yatay dikdörtgen (360 × 120 px, mobilde mevcut genişliğe uyumlu) tıklanabilir yükleme kutusuna dönüştürüldü. Logo yükleme ve son kayıt testi kullanıcı yüklemesi sonrasında yapılacak; 4. adımın kabulü bekliyor.

- [x] Logo seçiminden sonra yalnız dosya adı gösterilmesi düzeltildi: seçilen görsel dikdörtgen kutuda, oranı korunarak anında önizlenir. Dosya seçimi ile Profili Kaydet üzerinden kalıcı kayıt arasındaki durum ekranda açıkça gösterilir.

- [x] IBAN alanında TR sabit ve silinemez hale getirildi. TR sonrasına yalnız 24 rakam alınır; görünüm 2–4–4–4–4–4–2 gruplarıdır. Sunucuya mevcut sözleşmeyle boşluksuz TR + 24 rakam gönderilir; IBAN kontrol basamağı doğrulaması korunur.

- [x] Kaydet durumu belirginleştirildi: aktif kaydet düğmesi, işlem süresince kilit/spinner, kalıcı başarı veya hata paneli, kayıttan sonra değişiklik yoksa pasif Kaydedildi düğmesi. Tarayıcıda girilmiş test IBAN kontrol basamağından geçmediği için kaydın başlamadığı görüldü; IBAN hatası alanın altında da gösterilir. Form doğrulaması görünür uygulama mesajlarıyla yapılır.

- [x] Kayıt ve profil kartındaki alan başlıkları kullanıcı kararıyla Ad Soyad, E-Posta, Cep Telefonu, Şirket Adı, Vergi Dairesi ve Vergi Numarası biçimine getirildi.


### Güncel karar — Test ortamında IBAN kontrolü

Kullanıcı, matematiksel IBAN kontrolünü test ortamında askıya aldı. Önceki MOD 97 korunacak kararı bu test istisnasıyla güncellendi. TR + 24 rakam ve 2–4–4–4–4–4–2 gösterimi korunur. Uygulamadaki kontrol değiştirildi; ✅ Kullanıcı `agora_partner_iban_test_kurali_hazir = true` sonucuyla mevcut veritabanındaki matematiksel kontrolün de askıya alındığını doğruladı. AGENTS.md'ye canlı geçişinde ortak istemci/sunucu doğrulamasının ve SQL CHECK kuralının birlikte MOD 97'ye döndürülmesi notu yazıldı.


### Adım 4 — Tamamlandı

Kullanıcı profilin kaydedildiğini ve admin onayında olduğunu bildirdi. Tarayıcıda Ali Partner / ali@testpartner.com hesabının şirket bilgileri, kayıtlı logo, Kaydedildi durumu ve Üyelik onayı bekleniyor mesajı görüldü. Kayıt sonrası uygulamanın sunucudan yeniden okuduğu profil ekrana gelmiştir. 4. adım ✅ işaretlendi. İkinci üyelik onayının admin liste/karar işlemleri ve eğitim yönetimini açması henüz tamamlanmış sayılmaz. Matematiksel IBAN kontrolü test kararıyla askıdadır; canlı geçiş düzeltmesi AGENTS.md’de izlenir.


## İkinci aşama — Admin üyelik onayı (kod/kurulum kabulü izleniyor)

- [x] Üyelik Onayı sekmesinde profilini tamamlayan partnerleri listelemek; şirket/kimlik/adres/vergi/IBAN/logo bilgilerini incelemek ve onay/ret işlemini hazırlamak.
- [x] Karar tarihçesi, yetki kontrolü, profil/üyelik sürümüyle eski ekran kararını engellemek. Ret, ilk giriş hakkını silmez; partner profilini düzeltip tekrar gönderebilir.
- [x] Onaylı üyeyi `/partner/egitimler` sunucu erişim kapısına yönlendirmek; onaysız/reddedilen/oturumsuz erişimi kapatmak. Bu sayfa yalnız üyelik sonrası karşılamadır; 5. adımdaki eğitim listeleme/ekleme özellikleri henüz uygulanmadı.
- [x] Yerel doğrulamalar: 47/47 üyelik SQL/API/erişim kontrolü, mevcut 9/9 partner testi, TypeScript ve diff kontrolü başarılı. ESLint 0 hata; yeni RPC’ler şema snapshot’ında bulunmadığından 4 uyarı.
- [x] Kullanıcı `agora_partner_uyelik_onayi_hazir = true` sonucuyla SQL kurulumunu doğruladı.
- [ ] Gerçek admin ve test partneriyle üyelik onayı ve yönlendirmeyi tarayıcıda kabul etmek.

Bu SQL kendiliğinden üyelik onaylamaz; mevcut başvuruları korur. Uygulama/SQL hazırlanması canlı kurulum veya gerçek admin kararı yapılmış sayılmaz.

Üyelik onayı tarayıcı kontrolü: Gerçek admin oturumunda Üyelik Onayı sekmesi Ali Partner / hapbilgi başvurusunu Onay Bekliyor durumunda listeledi. İncele alanında şirket/iletişim/konum/vergi/IBAN bilgileri ve özel admin logo ucundan yüklenen görsel doğrulandı. Onay/ret kararı henüz verilmedi; kullanıcı kararı ve partner yönlendirmesi bekler.

- [x] Kullanıcı isteğiyle üyelik onayındaki Kararı Kaydet/Vazgeç ara adımı kaldırıldı. Üyeliği Onayla ve Üyeliği Reddet düğmeleri kararı doğrudan kaydeder; işlem sürerken düğmeler kilitlenir.

- [x] Üyelik onayı API tarafından başarıyla doğrulandıktan sonra mevcut ortak toast sistemiyle “[Ad Soyad] üyeliği onaylandı.” bildirimi eklenir; 12 saniye görünür. Başarısız veya belirsiz istek başarı toastı üretmez. Kullanıcı üyeliği onayladığını bildirdi; bu toast değişikliğinin gerçek tarayıcı kontrolü yapılmadı (kullanıcının siteden çık talimatı korunuyor).


### Plan sadeleştirmesi — 5 Kasım 2026

Kullanıcı kararıyla “Eksik profille devam edilmesini engellemek” ayrı iş adımı olmaktan çıkarıldı. Kalan ana adımlar yeniden numaralandırıldı; yeni 5. adım Partnerin eğitim yönetim alanını oluşturmak oldu. Plan 11 ana adımdan oluşur; ilk 4 adım tamamlandı, 7 adım kaldı. Zorunlu profil alanları ve admin üyelik onayı mevcut akışta devam eder.


## Adım 5 — Partner eğitim yönetimi

- [x] Üstte partner logosu/şirket adı ve Çıkış; Eğitimlerim başlığı, Yeni Eğitim Ekle düğmesi, durum filtreleri, yükleniyor/hata/boş liste ve sayfalama görünümü.
- [x] Yeni kart tasarımı yerine gerçek ortak `YayinKarti` (HOYK) bileşeni kullanıldı. Eğitim adı, mevcut kategori/yayın aracı/fiyat ve yayın durumu gösterilir; bilinmeyen bilgi için sahte değer üretilmez.
- [x] Eğitim adıyla taslak ekleme, inceleme ve taslak adını düzenleme; sunucu tarafında partner sahipliği, üyelik kapısı, sürüm çakışması ve oluşturma istek anahtarıyla mükerrer kayıt engeli.
- [x] Yerel doğrulamalar: gerçek SQL/API ile 66/66 kontrol; React yönetim ekranında boş liste, taslak oluşturma/düzenleme, çift gönderim engeli ve HOYK eşlemesi başarılı. TypeScript ve diff kontrolü başarılı; ESLint 0 hata, yeni RPC’ler şema snapshot’ında olmadığından 2 uyarı.
- [x] Kullanıcı `agora_partner_egitim_yonetimi_hazir = true` sonucuyla eğitim yönetimi SQL kurulumunu doğruladı.
- [x] Kullanıcının paylaştığı SPIN taslağı ekranıyla kayıt/liste ve inceleme alanı görüldü; kullanıcı sonrasında silme ve başarı toastını doğruladı. Düzenleme davranışı yerel React testinde doğrulandı; gerçek tarayıcıda ayrıca sınanmış sayılmaz.

Bu adım yalnız yönetim alanı ve eğitim adı taslağıdır. Kategori, hedef kitle, yayın aracı, açıklama ve fiyat girişinin tamamı 6. adımda genişletilecek; medya yükleme 7. adımda, Agora'da yayımlama 8. adımda ele alınacak. Başka partnerin kaydı okunamaz veya değiştirilemez. Kod teslimi SQL uygulanmış veya ana 5. adım kabul edilmiş anlamına gelmez.


### Adım 5 — Eğitim silme

- [x] HOYK altında Eğitimi Sil düğmesi; eğitim adıyla silme teyidi, işlem kilidi ve başarı toastı.
- [x] DELETE API ve SQL'de onaylı partner/oturum/sahiplik/sürüm kontrolü. Kayıt fiziksel olarak silinmez; listeden kaldırılır ve silinen eğitim düzenlenemez. İçerik kaydının korunması ileride satın alma hakkının korunmasına temel olur; satın alma modülü henüz uygulanmış değildir.
- [x] Yerel silme kontrolleri: 27/27 gerçek SQL/API kontrolü; React ekranında silme teyidinin iptali, silme ve boş listenin güncellenmesi başarılı. TypeScript ve diff kontrolü başarılı; ESLint 0 hata, şema snapshot’ı nedeniyle 3 RPC uyarısı.
- [x] Kullanıcı `agora_partner_egitim_silme_hazir = true` sonucuyla silme SQL kurulumunu doğruladı.
- [x] Kullanıcı “toast mesaj görüldü. eğitim silindi” sonucuyla silme ve başarı bildirimini doğruladı. Tarayıcıya girilmedi.

- [x] Eğitim silme teyidindeki tarayıcı confirm kaldırıldı; mevcut Cogniti AlertDialog modalı kullanılıyor. Modal eğitim adını gösterir; İptal kayıt değiştirmez, Sil işlemi başlatır. İşlem sürerken düğmeler kilitlidir. Kural AGENTS.md’ye kaydedildi.


### Adım 5 tamamlanma kaydı — 5 Kasım 2026

Eğitim yönetimi ve silme SQL kurulumları kullanıcı tarafından true sonuçlarıyla doğrulandı. Kullanıcı SPIN test taslağını oluşturup HOYK listesinde görüntüledi; Cogniti modalıyla silme sonrasında eğitimin kaldırıldığını ve toast mesajını gördüğünü bildirdi. Ana 5. adım ✅ işaretlendi. Sonraki 6. adım: eğitim oluşturma formunu mevcut üretici Hazır İçeriğim Var / Hazır Soru Setim Var akışına partner yetkileriyle uyarlamak; mevcut ad taslağı henüz bu tam akışa bağlı değildir.


## Adım 6 — Eğitim oluşturma formu

- [x] Eğitim kategorisi/adı, Cogniti hedef kitlesi, Video/Podcast, en fazla 500 kelime açıklama ve TL fiyat alanları eklendi. Hedef ve kategori seçenekleri mevcut ortak kaynaklardan türetilir.
- [x] Hazır soru seti için mevcut SoruSetiAyarlari, SoruIceAktar, SoruSetiFormu ve ortak taslak doğrulaması kullanılır. Soru sayısı/seçenek/doğru cevap doğrulanır; soru/cevaplar sahiplik kontrollü ayrıntı ucunda okunur, listeye taşınmaz.
- [x] Form kaydı partner oturumuna bağlıdır; mevcut firma rolü/sahipliği taklit edilmez. Üretici useTalepFormu firma oturumu ve ürün/teknik kayıtlarına bağlı olduğundan bütünü doğrudan partnerde çağrılmaz; ortak parçaları kullanılır.
- [x] Yerel doğrulama: 45/45 SQL/API/ortak doğrulama kontrolü başarılı; TypeScript geçti. ESLint 0 hata; yeni RPC’ler eski şema snapshot’ında bulunmadığından uyarılar var.
- [x] Kullanıcı `agora_partner_egitim_formu_hazir = true` sonucuyla eğitim formu SQL kurulumunu doğruladı.
- [ ] Kullanıcı form kayıt/düzenleme kontrolünü yapar.

Bu adım form ve hazır soru setinin partner taslağına kalıcı kaydıdır. Hazır video/podcast içeriğinin ve 2 dakikalık tanıtım videosunun aktarımı 7. adımdır; mevcut üretici medya altyapısıyla bağlantı henüz tamamlanmış sayılmaz. Firma üretim taleplerine otomatik kayıt açılmaz, yayın/soru işleme veya Agora yayımlama bu adımda tetiklenmez.


### Adım 6 — Üretici ekranına göre tasarım düzeltmesi

- [x] Partner eğitim formu, mevcut YeniTalepFormV2 ve YeniTalepAkordiyonu kart yerleşimi, tema değişkenleri ve ortak Sade kontrolleriyle düzenlendi. Eğitim bilgileri/yayın kitlesi, yayın ve üretim yönetimi, açıklama/fiyat ve hazır soru seti bölümleri kullanılır. Firma ürün/teknik ve içerik üretim talebi seçenekleri partnere sunulmaz.
- [x] Dar alanda tek sütun; geniş alanda üretici ekranıyla aynı kapsayıcı genişliğine bağlı sütun düzeni tanımlandı.
- [ ] Kullanıcının yeni görünümü ve kayıt akışını kabul etmesi bekleniyor; tarayıcıda görsel doğrulama yapılmadı. Ana 6. adım tamamlandı sayılmadı.


### Adım 6 — Önceki forma dönüş

- [x] Kullanıcının açık talimatıyla son üretici ekranı uyarlaması kaldırıldı; önceki partner formunun yerleşimi ve alanları geri getirildi. Mevcut kayıt ve sahiplik kontrolleri korundu.
- [ ] Ana 6. adımın kullanıcı kabulü bekleniyor. Medya yükleme tamamlandı sayılmaz.


### Adım 6 tamamlanma kaydı — 5 Kasım 2026

- [x] Kullanıcının “6 yı bitir” talimatıyla mevcut partner formunun oluşturma ve düzenleme akışı yazılım testleriyle tamamlandı. Kullanıcının geri istediği önceki form tasarımı korundu.
- [x] Gerçek React formu ve ortak bileşenler Happy DOM ortamında sınandı: boş/eksik formun engellenmesi, kategori/hedef/açıklama/fiyat ve 10 soruyla kayıt, yeniden açıldığında cevapların korunması, Podcast olarak düzenleme, doğru eğitim kimliği/sürüm gönderimi, hata görünümü, başarı geri çağrısı ve işlem kilidi, çift gönderim engeli, yayındaki kaydın düzenlemeye kapalı olması. 10/10 kontrol başarılı.
- [x] Gerçek SQL/API ve ortak doğrulamalar ayrı yerel PGlite ortamında tekrar çalıştırıldı: 45/45 kontrol başarılı. Canlı veritabanına bağlanılmadı; kullanıcı tarafından daha önce true ile doğrulanan SQL yeniden canlıda çalıştırılmadı.
- [x] TypeScript, hedefli ESLint ve diff kontrolü başarılı. Sonuçlar `docs/AGORA_PARTNER_ADIM6_DOGRULAMA.json` dosyasında kaydedildi.

Ana 6. adım yazılım uygulaması ve yerel doğrulamalar bakımından ✅ tamamlandı. Önceki kayıtlardaki bekleyen form kayıt/düzenleme kontrolü yerel React testleriyle karşılandı; gerçek tarayıcıda kullanıcı kabulü yapılmış sayılmaz. Kullanıcının siteden çık talimatı korundu. Sonraki adım 7: eğitim Video/Podcast içeriği ve ayrı 2 dakikalık tanıtım videosunun yüklenmesi. Dosya aktarımı veya Agora'da yayımlama bu tamamlanma kaydının kapsamında değildir.


## Adım 7 — Eğitim ve tanıtım dosyaları

- [x] Kullanıcının geri istediği partner formunda Yayın Aracı seçiminin altına eğitim videosu/podcast ve ayrı tanıtım videosu alanları eklendi. Dosya seçimi yüklemeyi başlatır; yüzde, sonuç/hata ve kaydedilmiş dosya gösterilir. Dar ekranda alanlar tek sütundur.
- [x] Video ve tanıtım videosu mevcut bunnyTusYukle ile doğrudan Bunny Stream'e aktarılır. Tamamlanma mevcut PUT /uretim/api/hazir-video ucunda ayrı partner oturumu/sahiplik kapısından geçer. Asenkron encode webhook ve durum mutabakatıyla izlenir; storageSize > 0 kontrolü yoktur. DB yalnız ham GUID saklar, oynatma URL'si sunucuda çözülür.
- [x] Tanıtım en fazla 120 saniye: istemcide metadata ön kontrolü; Bunny'nin otoritatif sonucu sonrasında sunucuda tekrar kontrol. İşlenme tamamlanana kadar hazır denmez; 121 saniye ve üzeri hata gösterir.
- [x] Podcast mevcut parçalı SHA256, Bunny Storage süreli yükleme izni ve makbuz altyapısını kullanır. Yerel geliştirmede ayrı partner yetkili aktarım ucu; üretimde doğrudan mevcut Bunny Edge upload. Sunucuda boyut, makbuz ve gerçek ses imzası doğrulanmadan hazır olmaz. Video ve ses için ayrı tablolar ve ayrı aktarım yolları vardır.
- [x] Henüz kaydedilmemiş formun ilk dosyası, aynı istek anahtarıyla tek eğitim taslağı açar; kimlik/sürüm forma geri verilir. Sonraki Eğitim Bilgilerini Kaydet işlemi bu taslağı günceller; ikinci eğitim açmaz. Yayımlama tetiklenmez.
- [x] Yerel SQL/API 48/48, React medya 12/12, mevcut form regresyonu 10/10 ve Bunny süre testleri 3/3 başarılı. Dış hizmetler sahte; gerçek dosya gönderilmedi. Sonuçlar docs/AGORA_PARTNER_ADIM7_DOGRULAMA.json içinde.
- [x] Kullanıcı scripts/sql/agora_partner_medya_yukleme.sql kurulumunu agora_partner_medya_yukleme_hazir = true sonucuyla doğruladı.
- [ ] SQL sonrası test partneriyle gerçek video/podcast ve ayrı tanıtım videosu yükleme, işlenme/önizleme ve yeniden açma kabulü yapılır. Kullanıcının siteden çık talimatı nedeniyle tarayıcıya girilmedi.

Ana 7. adım henüz tamamlandı olarak işaretlenmez: kod ve yerel doğrulamalar hazırdır; SQL kurulumu ve gerçek dosya kontrolü bekler. MP4/WebM/MOV en fazla 5 GB; podcast MP3/M4A/AAC mevcut 250 MB politikasını kullanır. Önceki yükleme kayıtları korunur; satın alma/yayımlama veya telif hakları bu adımda değiştirilmez.


Adım 7 SQL kurulum sonucu kullanıcı tarafından true olarak doğrulandı. Bekleyen kontrol: test partneriyle gerçek dosya aktarımı, işlenme/önizleme ve yeniden açılışta dosyaların korunması. Ana adım henüz tamamlandı işaretlenmedi.


### Adım 7 — Partner çerez yolu düzeltmesi

- [x] Gerçek yüklemede görülen oturum hatasının kökü doğrulandı: partner çerezi /partner yolundayken istemci tamamlanma isteğini /uretim yoluna gönderiyordu. Aynı hazır-video PUT işlevi /partner/api/medya/video yolundan sunulur; çerez kapsamı genişletilmez. Proxy yalnız bu partner yolunda PUT kabul eder, önceki /uretim istisnası kaldırıldı.
- [x] Tamamlanma isteği 401 aldığı için yukleniyor durumunda kalmış videolar da Dosya Durumunu Kontrol Et ile Bunny üzerinden mutabakata girer. Yalnız gerçek Bunny hazır/hata sonucu kaydedilir; tamamlanmamış video hazır kabul edilmez.
- [ ] Kullanıcı sayfayı yenileyerek önce mevcut test_hb.mp4 için Dosya Durumunu Kontrol Et ile sonucu kontrol eder. Gerçek tarayıcı kabulü bekler. Yeni SQL yoktur.


### Kullanıcı kararı — Eğitimde çoklu hedef kitle

- [x] Agora partner eğitiminde hedef kitle seçenekleri birbirinden bağımsız açılıp kapatılır. Ürün Tanıtım Temsilcileri, Bölge Müdürleri, Eczacılar, Eczane Teknisyenleri ve Eczane Müşterilerinden bir veya birden fazlası birlikte seçilebilir.
- [x] Sunucu doğrulaması tüm geçerli birleşimleri kabul eder; en az bir hedef zorunludur. Bilinmeyen rol kabul edilmez, tekrarlar tekilleştirilir. Kayıt JSON alanı aynı kaldığından yeni SQL gerekmez.

Bu karar Agora partner eğitimine uygulanır. Mevcut firma yayını hedef gruplarının ortak tekli/E-Club kuralı değiştirilmedi. 8. adımın ilerlemesi bu düzenleme sırasında durur.


## Adım 8 — Partnerin Agora’da yayımlaması

Kullanıcı “devam edelim” talimatıyla 8. adımın geliştirmesine devam etti. 7. adımın gerçek dosya kabulü tamamlanmış sayılmadı; sahte bir eğitim/dosya oluşturulmadı ve mevcut eğitime yayımlama işlemi uygulanmadı.

- [x] Taslak HOYK kartına Agora’da Yayımla eklendi. Mevcut Cogniti AlertDialog teyidi kullanılır; İptal istek göndermez. İşlem sırasında kontroller kilitlenir; başarıda mevcut ortak toast görünür, liste yenilenir ve durum Yayında olur. Açık düzenleme formu varken yayımlama butonu pasiftir; önce kayıt tamamlanır.
- [x] Partner kapsamındaki /partner/api/yayinla adresi kullanılır; /partner çerez yolu korunur. Oturum/üyelik, eğitim sahipliği ve sürüm sunucuda doğrulanır. Kaydedilmiş form ortak doğrulayıcıyla, birden çok hedef dahil, yeniden sınanır.
- [x] Video/podcast ile ayrı tanıtım zorunlu; video/tanıtım hazır durumu ve süre Bunny’den doğrulanır. Tanıtım en fazla 120 saniyedir. Seçilen aracın en son yüklemesi tamamlanmamışsa önceki hazır dosyayla sessizce yayımlanmaz. Podcastte doğrulanmış yükleme kaydı aranır. Admin yayımlama onayı aranmaz; mevcut ilk giriş ve üyelik onayları sürer.
- [x] SQL sahiplik/sürüm kontrolü ve dosya seçimini tek işlemde tamamlar; dosya kimliklerini yayımlanan eğitime bağlar. Tekrar istek idempotenttir; Yayında kayıt ikinci kez oluşturulmaz. Pasif kayıt partner tarafından tekrar açılmaz. Silinmiş/yetkisiz kayıt yayımlanamaz.
- [x] agora_yayindaki_egitimler katalog görünümü oluşturuldu: şirket adı, eğitim, kategori, araç, çoklu hedef, açıklama, TL fiyat ve yayımlanma tarihi. Eğitim dosyası/cevaplar/IBAN/iletişim alanları katalogda yoktur. Taslak, pasif, silinmiş, onaysız partner veya hazır olmayan bağlı dosya katalogda görünmez. Görünüm yalnız service_role tarafından okunur; anonim/iç kullanıcılar doğrudan DB erişimi elde etmez.
- [x] 51/51 gerçek SQL/API ve 7/7 React/gerçek AlertDialog-toast kontrolü; TypeScript/diff başarılı. ESLint 0 hata, şema snapshotı kaynaklı 3 RPC uyarısı. Sonuçlar docs/AGORA_PARTNER_ADIM8_DOGRULAMA.json içinde. Dış hizmetler sahte; canlı yayımlama veya tarayıcı kontrolü yapılmadı.
- [x] Kullanıcı scripts/sql/agora_partner_yayimlama.sql kurulumunu agora_partner_yayimlama_hazir = true sonucuyla doğruladı.
- [x] Kullanıcı Agora’da Yayımla butonunu kullandığını, teyit modalını ve başarı toastını gördüğünü, eğitimin Yayında sekmesinde listelendiğini doğruladı. SQL kurulumu da true sonucu ile doğrulandığından ana 8. adım tamamlandı.

Bu adım partnerin kendi eğitimini yayımlaması ve Agora katalog kaynağıdır. Firma üretici/TM/yönetici navbarı, alıcı Agora ekranı ve tokenla satın alma ayrı ikinci aşamadır; bu adımda bu ekranlar veya satın alma tamamlandı sayılmaz. Sonraki 9. adım adminin pasife alma/kaldırma yönetimidir.


### Adım 8 tamamlanma kaydı

Kullanıcı yayımlama butonu, Cogniti modalı, başarı toastı ve Yayında sekmesindeki eğitim kaydını doğruladı. Ana 8. adım ✅ tamamlandı. Bu doğrulama, 7. adımın ayrı video/podcast yükleme ve önizleme testlerinin tamamının kabul edildiği anlamına gelmez. Sonraki 9. adım adminin pasife alma ve kaldırma yönetimidir.


## Genişletilmiş Adım 9 — Cogniti Partner Yönetimi

Kullanıcı kararı: Her partner firma adının altında Firma Bilgileri, Üyelik ve Yetkiler, Yayınlar, Hak Edişleri ve Raporlar bulunur. Beş sayfanın her biri ayrı iş adımıdır. Mevcut ilk giriş/üyelik onayları üstteki Cogniti Partner Yönetimi girişinde korunur.

- [x] 9.0 — Sol sidebar gerçek partner profil kayıtlarından firma adlarını okur. İlk mevcut test firma hapbilgi elle/sahte kayıt eklenmeden listelenir. Firma seçilince standart beş alt sekme açılır; seçim partner kimliği ve alt sayfayla URL’ye yazılır. Sayfa yenileme/geri-ileri ile seçim korunur. Gezinme mevcut firma yönetimi stillerini kullanır.
- [x] 9.1 — Firma Bilgileri sayfasını gerçekleştirmek. SQL kullanıcı tarafından doğrulandı; kullanıcı ekran görüntüsüyle kayıtlı şirket/yetkili bilgileri ve logoyu gösterdi, istenen kompakt yerleşim düzenlemeleri yapıldı.
- [ ] 9.2 — Üyelik ve Yetkiler sayfasını gerçekleştirmek.
- [x] 9.3 — Yayınlar sayfasını gerçekleştirmek; aktif/pasif ve silme işlemleri. Kullanıcı kartı gördüğünü ve HOYK işlevlerinin çalıştığını doğruladı.
- [ ] 9.4 — Hak Edişleri sayfasını gerçekleştirmek. Satın alma verileri oluşmadan sahte hak ediş gösterilmez.
- [ ] 9.5 — Raporlar sayfasını gerçekleştirmek. Satın alma/beğeni/favori verileri oluşmadan sahte rapor gösterilmez.

Bu teslim gezinme ve beş sayfanın ayrı adres temelidir; sayfa içerikleri henüz yapılmış sayılmaz. Yeni SQL veya partner firma kaydı oluşturulmaz; admin kontrollü liste mevcut üyelik RPC’sinden yalnız partner kimliği/şirket adı/üyelik durumu döndürür. Firma admini bu alanı görmez. Gerçek tarayıcı kontrolü yapılmadı.


### Adım 9.1 — Firma Bilgileri sayfası

- [x] Seçilen partnerin Şirket Bilgileri (şirket adı, il/ilçe, adres, vergi dairesi/numarası, IBAN ve logo) ve Yetkili Bilgileri (ad soyad, e-posta, cep telefonu) mevcut admin kart/form düzeniyle gösterilir. Alan başlıklarının ilk harfleri büyüktür; dar ekranda tek sütuna geçer. Bilgiler salt okunurdur; düzenleme/onay işlevi eklenmedi.
- [x] Veri taşınması/kopyalanması yerine mevcut partner ve profil kayıtları kimliğe göre okunur. Yeni admin API ve tek kayıt RPC’si admin rolünü doğrular; şifre/oturum bilgisi dönmez. Logo mevcut korumalı admin logo ucundan okunur.
- [x] 19/19 SQL/API ve 7/7 React kontrolü başarılı; TypeScript/diff başarılı. ESLint 0 hata, yeni RPC eski şema snapshotında olmadığından 1 uyarı. Sonuçlar docs/AGORA_PARTNER_ADIM9_1_DOGRULAMA.json içinde. Gerçek tarayıcı kontrolü veya canlı veri değişikliği yapılmadı.
- [x] Kullanıcı scripts/sql/agora_partner_firma_bilgileri.sql kurulumunu agora_partner_firma_bilgileri_hazir = true sonucuyla doğruladı.
- [ ] Kullanıcı hapbilgi > Firma Bilgileri sayfasındaki kayıtlı bilgiler ve logoyu doğrular. Ana 9.1 bu sonuçlar beklenirken tamamlandı işaretlenmez.

Sonraki ayrı iş adımı 9.2 Üyelik ve Yetkiler’dir; bu teslim diğer alt sayfaları tamamlanmış saymaz.

- [x] Kullanıcı isteğiyle 9.1 Şirket Bilgileri ve Yetkili Bilgileri kartları mevcut twoColumns düzeniyle geniş ekranda yan yana, 760 px ve altında alt alta yerleştirildi. Veri ve okuma akışı değişmedi.

- [x] 9.1 adres alanının genişliği bulunduğu kolona bağlı kalır; yüksekliği adres metni ve satır kırılmasına göre otomatik büyür/küçülür. Pencere/kolon genişliği ve yazı tipi yüklendiğinde yeniden ölçülür; diğer alanlar değiştirilmedi.

- [x] 9.1 yan yana kartlarda yetkili alanlarının başlangıcı soldaki şirket alanlarıyla hizalandı. Logo için solda 100 px alan ayrılır; sağda aynı alan dengelenir. Mobilde kartlar alt alta olduğundan sağdaki dengeleme boşluğu kaldırılır.

- [x] 9.1 kullanıcı isteğiyle bilgi alanlarının iç metinleri normal yazı kalınlığına alındı; alan etiketleri ve kart başlıkları kalın kaldı.

- [x] 9.1 IBAN alanı iki sütuna yayıldı; giriş genişliği biçimlendirilmiş IBAN uzunluğuna göre ayarlanır ve kart genişliğini aşmaz. Diğer alanların genişliği değişmedi.


### Adım 9.2 — Üyelik ve Yetkiler

- [x] Partner altında Üyelik ve Yetkiler sayfası: ilk giriş/üyelik onay durumları ve karar tarihleri; erişim açık/kapalı durumu, son erişim kararı ve İş Partneri rolü. Mevcut onay ekranına bağlantı korunur. Yeni rol veya parça parça yetki modeli icat edilmedi.
- [x] Erişimi Aç/Kapat mevcut Cogniti AlertDialog ile teyit edilir. İptal kayıt değiştirmez. İşlem kilidi, sürüm çakışması, hata gösterimi ve mevcut 12 saniyelik toast kullanılır. Başarıdan sonra sunucudan durum yeniden okunur.
- [x] SQL mevcut partnerlerin erişimini varsayılan açık tutar. Gerçek değişiklikte erişim/giriş sürümleri artar, partnerin oturumları silinir ve admin işlem geçmişi kaydedilir. Yinelenen aynı karar yeni geçmiş kaydı üretmez. Onay durumları, eğitim kayıtları ve diğer partnerlerin oturumları değiştirilmez.
- [x] Giriş hazırlama ve oturum açma SQL işlevleri erişim açık koşuluyla güncellendi. Kapatılan hesaba yeni giriş/oturum açılamaz. Yeniden açma eski oturumu canlandırmaz; partner tekrar giriş yapar. Mevcut eğitim/profil API kapıları silinen/sürümü değişen oturumu reddeder.
- [x] 49/49 gerçek SQL/API/parola/oturum ve 8/8 React/gerçek modal-toast kontrolü başarılı. TypeScript/diff başarılı; ESLint 0 hata, şema snapshotı nedeniyle 2 RPC uyarısı. Sonuçlar docs/AGORA_PARTNER_ADIM9_2_DOGRULAMA.json içinde. Testler ayrı yerel PGlite ve sahte cookie/Storage ile yapıldı; canlı hesaba erişim kararı uygulanmadı, tarayıcı kontrolü yapılmadı.
- [x] Kullanıcı scripts/sql/agora_partner_uyelik_yetkiler.sql kurulumunu agora_partner_uyelik_yetkiler_hazir = true sonucuyla doğruladı.
- [ ] Kullanıcı Üyelik ve Yetkiler ekranında durumları ve aç/kapat modal-toast akışını doğrular. Ana 9.2 henüz tamamlandı işaretlenmez.

Sonraki ayrı iş adımı 9.3 Yayınlar’dır. Bu erişim işlemi yayını pasife alma/silme işlevinin yerine geçmez; yayın yönetimi 9.3’te uygulanır.

- [x] 9.2 erişim kapatma modalı kullanıcı isteğiyle firma adı dinamik olacak şekilde güncellendi: [firma adı]’nin Cogniti Partner süreçleri durdurulacak ve yeni girişleri engellenecektir.

- [x] Erişim kapatma metnindeki köşeli parantezler kaldırıldı; firma adı dinamik olarak parantezsiz gösterilir.


### Park edilen konu — Erişim kapatma ve satın alınmış eğitim süreçleri

Kullanıcı kararı: Erişimi Kapat mevcut hâliyle korunur. Erişimi kaldırmadan önce eğitimlerin silinmesi şartı, satın alınmış eğitimin devam eden yayını, tekrar periyotları, süreç tamamlanana kadar durdurma/silme sınırları ve bunların sonuçları **beş yönetim sekmesi bittikten sonra** ayrıntılı planlanacak. Bu kurallar şimdi uygulanmaz; tamamlanmış sayılmaz. Diğer sekmeler bu karara göre sürdürülür.

### Adım 9.3 — Yayınlar

- [x] Seçili partnerin eğitimleri mevcut ortak HOYK ile listelenir. Tümü/Aktif/Pasif/Taslak filtreleri, sayfalama, yükleniyor/hata/boş liste ve Yenile vardır. Satış/beğeni/favori gibi henüz oluşmayan sayılar uydurulmaz.
- [x] İncele aynı sayfada eğitim adı/kategori/fiyat/çoklu hedef/açıklama, eğitim videosu veya podcast, tanıtım videosu ve soru setini açar. Yayımlanmış eğitimde yayımlamaya bağlanmış dosyalar gösterilir; sonradan kalmış başka bir yükleme sessizce seçilmez. Video ham GUID’den sunucuda çözülür; sesin süreli CDN adresi üretilir.
- [x] Pasife Al, Aktife Al ve Sil mevcut Cogniti AlertDialog ile teyit edilir. İptal istek göndermez. İşlem kilidi, sürüm çakışması, hata ve başarı toastı kullanılır; liste yenilenir. Taslak eğitim admin tarafından yayına çıkarılmaz; önce partnerin yayımlaması gerekir.
- [x] SQL admin rolü, partner/eğitim eşleşmesi ve sürümü doğrular. Pasif eğitim katalogdan çıkar, tekrar aktifte onay/dosya hazır olma koşulları aranır. Silme silindi_at işaretidir; eğitim ve dosyalar fiziksel olarak yok edilmez. İstek tekrarları idempotenttir; admin işlem geçmişi saklanır.
- [x] 52/52 gerçek SQL/API/katalog ve 9/9 React/gerçek modal-toast kontrolü başarılı. TypeScript/diff başarılı; ESLint 0 hata, eski şema snapshotı kaynaklı 4 RPC uyarısı. Sonuçlar docs/AGORA_PARTNER_ADIM9_3_DOGRULAMA.json içinde. Ayrı yerel PGlite ve sahte dış hizmetler kullanıldı; gerçek yayına işlem veya tarayıcı kontrolü yapılmadı.
- [x] Kullanıcı scripts/sql/agora_partner_admin_yayinlar.sql kurulumunu agora_partner_admin_yayinlar_hazir = true sonucuyla doğruladı.
- [x] Kullanıcı hapbilgi > Yayınlar bölümündeki kartı ve HOYK işlevlerinin çalıştığını doğruladı. SQL kurulumu da true sonucuyla doğrulandığından 9.3 tamamlandı.

Bu teslim gelecekteki satın alınmış yayın ve tekrar periyodu haklarının tüm kurallarını çözdüğü anlamına gelmez; bu konu yukarıdaki kullanıcı kararıyla park edilmiştir. Sonraki ayrı sekme 9.4 Hak Edişleri’dir.


### Sıradaki iş — Tanıtım videosunu tercihli yapmak

- [ ] Kullanıcı kararı: Partnerin eğitim video/podcast içeriği, özeti, soru seti ve fiyatı zorunlu; tanıtım videosu tercihlidir. Tanıtım videosu yüklenirse en fazla 2 dakika sınırı korunur. Eğitim adı, kategori ve çoklu hedef kitle alanları devam eder.
- [ ] Form/yükleme açıklamaları, partner yayımlama kontrolü ve SQL işlevi, Agora katalog görünümü ve admin yeniden aktife alma kontrolleri birlikte uyarlanacak. Tanıtım videosu olmayan eğitim yayımlanabilecek/listelenebilecek; yüklenmiş tanıtımın süre ve hazır olma kontrolleri korunacak.

Bu kayıt bir sonraki iş içindir; uygulama kodu ve SQL henüz değiştirilmedi.


### Adım 9.4 — Hak Edişleri tablo başlıkları

- [x] Kullanıcı talimatıyla seçili partnerin Hak Edişleri sayfasında tablo oluşturuldu. Sütunlar sırasıyla Eğitim Adı, Sipariş Tarihi, Satın Alma Bedeli, Cogniti Hizmet Bedeli (%15), Ödenecek Tutar, KDV, KDV’li Ödenecek Tutar.
- [x] Mevcut admin tablo tasarımı kullanılır; dar alanda tablo yatay kaydırılır. Satış/ödeme kaydı uydurulmaz; veri yokken boş durum gösterilir.
- [ ] Hesaplama, KDV oranı ve satış/ödeme veri bağlantısı için kullanıcı talimatı bekleniyor. Bu teslim yalnız tablo görünümüdür; ana 9.4 tamamlandı sayılmaz. Yeni SQL yoktur.

- [x] Kullanıcı isteğiyle Hak Edişleri tablosunun sonuna Ödeme Günü sütunu eklendi.


### Adım 9.5 — Raporlar tablo başlıkları

- [x] Kullanıcı talimatıyla seçili partnerin Raporlar sayfasına Eğitim Adı, Satış Fiyatı, Satılan Adet, Toplam Satış Fiyatı, Beğeni Sayısı ve Favori Sayısı sütunları eklendi.
- [x] Mevcut admin tablo düzeni kullanılır; dar alanda yatay kaydırma vardır. Örnek satış veya etkileşim sayısı üretilmez.
- [ ] Satış verileri satın alma kayıtlarından; beğeni/favoriler satın alınan eğitimden oluşturulan firma yayınlarının izleyici etkileşimlerinden beslenecek. Bu bağlantılar henüz kurulmadı; bu teslim tablo görünümüdür. Ana 9.5 tamamlandı sayılmaz. Yeni SQL yoktur.

- [x] Kullanıcı onayıyla Hak Edişleri ve Raporlar tablolarının ilk sütun başlığı ID olarak eklendi. Veri bağlantısında aynı eğitimin PE-000001 biçimindeki kısa kodu kullanılacak; partner_egitim_id sistem alan adıdır. Kod üretimi ve veri bağlantısı henüz uygulanmadı.


### Partner eğitim kısa kimliği — kullanıcı kararı

- [x] SQL hazırlandı: partner_egitim_id kısa kodu PE-10001 biçimindedir. Firma numarası 10, 20, 30 şeklinde artar; firma başına eğitim sırası 001–999. Mevcut hapbilgi ilk firma olarak, mevcut yayındaki ilk eğitim 001 olarak kodlanır. Kodlar değişmez, silinen kod yeniden kullanılmaz. Mevcut UUID ilişkileri korunur.
- [x] 19 yerel PGlite kontrolü başarılı: tekrar kurulum, numaralama, mükerrer istek, silinen kodun korunması, 999 sınırı, değişmezlik ve yetkiler.
- [x] Kullanıcı SQL sonucuyla hapbilgi / SPIN / PE-10001 / yayinda kaydını doğruladı. SQL kullanıcı tarafından uygulandı; sonraki kayıtların numaralanması ve 999 sınırı yerel testlerle doğrulanmış durumdadır.
- [ ] Kısa kodun HOYK ve tablo satırlarında gösterilmesi için API/arayüz bağlantısı ayrı uygulanacak. Bu SQL tek başına HOYK görünümünü değiştirmez.

- [x] Partner kartı kayıtlı partner_egitim_id kodunu HOYK tarih satırının sağında gösterir. Liste doğrulayıcısı kod alanını kabul eder; sahte veya sabit kod yazılmaz.
- [ ] scripts/sql/agora_partner_kart_id.sql liste RPC’sine mevcut kod alanını ekler. Kullanıcı uygulaması beklenir; SQL uygulanmadan görünür olduğu iddia edilmez.

- [x] Kullanıcı ID’nin admin Yayınlar kartında görünmediğini ve önceki partner kart SQL’ini uyguladığını bildirdi. Admin HOYK tarih satırı kod alanına bağlandı.
- [ ] scripts/sql/agora_partner_admin_kart_id.sql admin yayın listesine partner_egitim_id alanını ekler. Kullanıcı uygulaması/ekran kontrolü bekleniyor. Mevcut PE kodu değiştirilmez.


### Partner ve admin için tek ortak partner HOYK tanımı

- [x] PartnerEgitimKarti ortak bileşeni, mevcut Cogniti YayinKarti (HOYK) üzerinde eğitim alanları, PE kodu, durum, fiyat, tarih, kapak ve görünürlük ayarlarını tek yerde tanımlar. Partner Eğitimlerim ve admin Yayınlar bu bileşeni kullanır; ayrı kart alan eşlemeleri kaldırıldı.
- [x] Ortak kart stilleri tek dosyadadır; farklı kapak boşluğu ve fiyat yazı biçimleri kaldırıldı. Yönetim eylemleri mevcut yetkileriyle ekranlardan verilir; ortak karttan ayrı bilgi/görünüm tanımı geçilemez.
- [ ] Kullanıcı iki ekranda aynı eğitim kartının bilgi/görünümünü doğrular. Gerçek tarayıcıya girilmedi. Yeni SQL yoktur; önceki ID liste SQL kurulumları hâlâ gereklidir.

- [x] Ortak kart yerel doğrulaması: gerçek iki ekran + ortak PartnerEgitimKarti + gerçek YayinKarti ile 17 kontrol geçti. Altı durum/araç birleşiminde yönetim eylemleri ve logo uç adresi hariç kart DOM’u eşleşti; PE kodu, eksik veri davranışı, ayrı yönetim eylemleri ve gerçek teyit modalları doğrulandı. Fetch/logo sahte; canlı tarayıcı veya görsel piksel kontrolü değildir. Tekrar çalıştırılabilir test: tests/agoraPartnerOrtakKart.hedef.test.mjs. Sonuçlar docs/AGORA_PARTNER_ORTAK_KART_DOGRULAMA.json içinde. TypeScript/lint/diff başarılı.

- [x] Kullanıcı isteğiyle admin Yayınlar kartının İncele, Pasife Al/Aktife Al ve Sil düğmeleri tek satırda yan yana, eşit genişlikte yerleştirildi. Ortak kartın bilgi/görünüm tanımı ve partner tarafındaki işlem düzeni korundu.

- [x] Admin kartındaki yatay işlem düğmelerinin yüksekliği kullanıcı isteğiyle 38 px’den 30,4 px’e (%20) indirildi.

- [x] Admin kartındaki yatay işlem düğmelerinin yazı boyutu kullanıcı isteğiyle 12 px’den 10,2 px’e (%15) indirildi.

- [x] Admin kartındaki üç yatay işlem düğmesinin genişliği kullanıcı isteğiyle %25 azaltıldı; 8 px aralık, yükseklik ve yazı boyutu korundu.

- [x] Admin kartındaki yatay işlem düğmeleri grup olarak kart içinde yatay ortalandı.


### Ortak partner kartında eğitim thumbnail’i

- [x] Ortak PartnerEgitimKarti kapak verisi için partner logosunu almaktan çıkarıldı. Eğitim videosunun kapak_video_guid alanı mevcut HOYK thumbnail çözümleyicisine verilir. İki ekranda da aynı ortak kapak davranışı kullanılır; logo için eklenen contain/padding stili kaldırıldı.
- [x] Tek SQL helper eğitim videosu GUID’ini her iki listeye taşır. Yayımlanmış eğitimde yayına bağlanan eğitim videosu; taslakta en son eğitim videosu hazırsa seçilir. Tanıtım veya başka partner videosu kullanılmaz. Podcastte video kapağı uydurulmaz; kapak verisi yoksa ortak HOYK’un varsayılan araç görseli görünür.
- [ ] scripts/sql/agora_partner_thumbnail.sql kullanıcı tarafından çalıştırılacak. Canlı SQL uygulanmadı. Sonrasında admin/partner sayfaları yenilenerek gerçek thumbnail kontrol edilecek.

- [x] Thumbnail düzeltmesi yerel kontrolleri: SQL/API 57, gerçek ortak HOYK ekran karşılaştırması 23 kontrol başarılı. Yayımlanmış kaydın bağlı videosu, iki listenin aynı GUID’i döndürmesi ve varsayılan podcast kapağı sınandı. Dış hizmetler/fetch sahte; gerçek thumbnail dosyasına ağ isteği veya tarayıcı kontrolü yapılmadı. TypeScript/lint/diff başarılı.


### Kullanıcı kararı — Tanıtım videosunu eğitim formundan kaldırmak

- [x] Önceki tercihli tanıtım videosu işi bu kararla güncellendi: Yeni Eğitim Ekle/düzenleme formunda Tanıtım Videosu alanı kaldırıldı. Seçilen türe göre yalnız Eğitim Videosu veya Podcast Dosyası yüklenir.
- [x] Partner yayımlama, katalog listelenme ve admin aktife alma akışlarında tanıtım videosu aranmaz. Mevcut eğitim dosyasının hazır olma ve soru seti/bilgi kontrolleri korunur. Eski tanıtım dosyaları fiziksel olarak silinmez.
- [ ] scripts/sql/agora_partner_tanitim_kaldir.sql kullanıcı tarafından uygulanacak. Canlı SQL çalıştırılmadı; SQL tarafındaki eski zorunluluk uygulama yapılana kadar sürer.

- [x] Tanıtım kaldırma doğrulaması: 26 SQL/API ve 6 React kontrolü başarılı; TypeScript/diff başarılı. Tanıtımsız video/podcast yayımlama, katalog ve admin yeniden aktife alma sınandı. Canlı veri değişmedi; SQL kullanıcı uygulaması bekleniyor.


### 5 Kasım — Satın alma öncesi koruma paketi

- [x] Tek yayın / tek oynatıcı: taslakta normal, Yayımla sonrasında aynı yayında koruma etkin. İkinci önizleme ve test düğmesi kaldırıldı.
- [x] Sesli Cogniti — Deneme Yayını uyarısı, 30 saniyelik aralıklar; orijinal dosya korunur.
- [x] Oturum ve sahiplik kontrollü podcast akışı; denemede indirme bağlantısı/yerel indirme kontrolü yok.
- [x] Yayımla API ve SQL kapısı: hazır koruma tam eğitim sürümüne ve medya kaydına bağlı.
- [x] `agora_partner_koruma_paketi.sql`: kullanıcı `agora_partner_koruma_paketi_hazir=true` sonucunu iletti.
- [ ] Taslaktaki podcastte gerçek ses/ileri sarma/duraklatma kabulü.
- [ ] Video Bunny güvenlik ayarları ve ortak kütüphane erişim geçişi doğrulanacak; bu olmadan video korumalı kabul edilmez/yayımlanmaz.
- [ ] Alıcı vitrini/satın alma: firmaya sınırsız süre, hedef kitle ve tekrar hakkı; temiz orijinal firma havuzuna aktarılacak. Tek yayınlama sınırı kaldırıldı. Firma bazında tekrar satın alma kapanacak; vitrin diğer firmalara açık kalacak.

Kapsam, sınırlamalar ve uygulanma sırası: `docs/AGORA_KORUMA_PAKETI.md`. Kullanıcının taslağı yayımlanmadı.

Tek oynatıcı düzeltmesi: yeni SQL yok. Sesli marka telaffuzu “Kogniti” olarak düzeltildi; orijinal podcast değişmedi. Kullanıcı ilk sesli uyarıyı 15 saniyelik kayıtta duyduğunu doğruladı. Yeni telaffuz ve düzeltilmiş tek oynatıcıda yayımlama sonrası kabul henüz yapılmadı.

### 6 Kasım — Agora firma vitrini

- [x] Üretici, TM ve yönetici roller için navbar giriş butonu ve sunucuda rol kontrollü Agora sayfası.
- [x] Ana Sayfa tüm partnerlerin raflarını gösterir. Sidebar partner firmaları yayındaki yayın adetlerine göre sıralar. Kalıcı rozetler sıfır dahil tam adedi gösterir.
- [x] Üç stat kartı Agora genelini gösterir. Haftalık özet haftanın ilk okumasında oluşturulur ve o hafta sabit kalır. Sidebar ve raflar canlı veriden yenilenir.
- [x] Mevcut Cogniti kontrol gruplarıyla yatay hedef kitle filtresi ve Video/Podcast toggle. Dört raf ortak YayinKarti HOYK bileşenini kullanır.
- [x] Token gösterimi ortak KKÖ birim fiyatıyla hesaplanır. Yarım ve üzeri yukarı yuvarlanır.
- [x] Beğeni/favori kayıtları kullanıcı ve yayın bazında saklanır. Tüm aktif üye firmaların etkileşimleri raf sıralamasını besler.
- [x] Satın alma öncesi video filigranı ve podcast sesli uyarısı mevcut ortak oynatıcıya bağlıdır.
- [x] Kullanıcı agora_vitrin_hazir=true sonucunu iletti ve vitrini planladığı yapıda gördüğünü doğruladı.
- [ ] Sipariş Ver işlemi ve token tüketimi yalnız üretici roller için ayrı adımda bağlanacak. Şimdilik düğme pasif, sipariş sayısı bilinmiyor gösterimidir. Hak ediş/satış raporlarının bağlantısı bekliyor.
- [ ] Video indirme engelinin Bunny ve gerçek tarayıcıyla uçtan uca doğrulanması bekliyor. Filigran tek başına indirme engeli değildir.


### 6 Kasım — Satın alma sahipliği düzeltmesi ve sipariş bağlantısı

**Son kullanıcı kararı önceki firma havuzu kararını değiştirir:** Satın alma, yetkili üretici kullanıcıya aittir. Merve ve Arzu aynı firmada olsa da ayrı satın alır; birbirinin satın aldığı paketi kullanamaz. Token kesintisi ve yetersiz tutarın borcu firmaya aittir; firma aktif kalır. Aynı kullanıcının aynı yayını ikinci kez satın alması kapanır. Satın alan kullanıcı süre ve tekrar sınırı olmadan, mevcut rol yetkileri içindeki hedef kitlelere yayın hazırlayabilir.

- [x] Sipariş tekillik anahtarı alici_id + egitim_id. Token işlem anahtarı üretici + eğitim içerir. Firma token hesabı kilidi ortak bakiyenin eşzamanlı tüketimini seri hale getirir.
- [x] Üretici kullanıcı için Cogniti teyit modali, sipariş API'si ve toast. TM/yönetici sipariş veremez. Kullanıcının aldığı yayının HOYK'unda Daha Önce Satın Aldınız şeridi; satın alma kapalı.
- [x] Sipariş, token kesintisi ve borç aynı transaction içinde. Fiyat/sürüm değişirse yeni onay istenir. KKÖ fiyatı istemciden alınmaz; ortak sunucu fiyat kaynağı kullanılır.
- [x] Satın alma anındaki medya kaynağı, bilgiler, soru seti ve ücretler siparişte korunur. %15 hizmet bedeli/ödenecek net tutar kaydedilir. KDV ve ödeme günü uydurulmaz; hak ediş ve rapor ekranlarına bağlantı bu adımda yapılmadı.
- [x] Mevcut Yayın Yönetimi > Yayına Hazır alanında Agora’dan Satın Aldığım Yayınlar. Seçili hedef kitle için Yayına Hazırla, mevcut talep/hazır içerik/hazır soru seti zincirini kullanır. Her hazırlık isteği tekildir; ayrı hedef/yeni yayın için tekrar hazırlanabilir, yeniden satın alma yapılmaz. Medya dosyası fiziksel çoğaltılmaz. Normal yüklemelerin tekil dosya kuralı korunur; Agora paketine bağlı öğrenme aracı kayıtları aynı kaynağı kullanabilir.
- [x] Yerel doğrulamalar: 45 SQL/üretim zinciri kontrolü, 65 sipariş API yetki kontrolü, 22 gerçek React vitrin/kabuk/HOYK kontrolü. TypeScript başarılı. API testlerinde auth/DB sahte; PGlite testinde temel tablolar sahte ve dönem yenileme etkisiz bağımlılık. Canlı DB, gerçek Bunny ve tarayıcı kabulü değildir. Yeni eşzamanlı bağlantı testi yapılmadı.
- [ ] scripts/sql/agora_satin_alma.sql kullanıcı tarafından uygulanacak; agora_satin_alma_hazir sonucu bekleniyor. SQL canlı veritabanında çalıştırılmadı.
- [ ] Merve ve Arzu kullanıcılarıyla ayrı satın alma, token/borç, sahiplik şeridi ve Yayına Hazırla akışının gerçek ekran kabulü. Video/podcast oynatma ve mevcut yayın araçlarıyla yayımlama kabulü henüz yapılmadı.

### Podcast süre eklemesi — kullanıcı talimatıyla geri alındı

- [x] Satın alma sonrası Yayına Hazırla sırasında Audio ile süre okuma, bunun için eklenen imzalı podcast adresi API/RPC'si ve süre parametresi kaldırıldı. Partner yükleme süreci değiştirilmedi.
- [ ] Partner podcast kaydında süre eksikliği açık konudur; mevcut üretici yayın hattının süre kontrolü korunur. Önceki 45 SQL kontrolü süre eklemesini içeren tarihsel sonuçtur; bu geri alma sonrasında podcastin uçtan uca yayımlanabildiği iddia edilmez. Kullanıcı talimatıyla diğer geliştirmeler beklemede.

### Partner podcast süre bilgisi — partnerde kaydetme kararı

- [x] Yeni podcast yüklemesinde mevcut üretici ses süresi okuyucusu ortak kullanılır; pozitif tam saniye tamamlanma isteğiyle kaydedilir. Süre okunamazsa yükleme başlatılmaz. Video akışı değiştirilmedi.
- [x] Daha önce yüklenmiş, süresiz hazır podcastlerde partner kendi eğitim ekranını açtığında mevcut dosyanın metadata süresi okunur ve yalnız eksik alan tamamlanır. Dosya yeniden yüklenmez. Süre değişikliği, başka partnere erişim, süresi biten oturum ve geçersiz süre SQL/API ile reddedilir. Bu bilgi üretici yüklemesindeki gibi istemci metadata beyanıdır; sunucuda ses dosyası yeniden çözümlenmez.
- [x] Satın alma paketi kayıtlı podcast süresini alır; mevcut Yayına Hazır aktarımı bunu öğrenme aracına taşır. Alıcı tarafında Audio ile süre okuma veya yeni süre parametresi eklenmedi.
- [ ] scripts/sql/agora_partner_podcast_sure.sql kullanıcı tarafından uygulanacak. Sonuç: agora_partner_podcast_sure_hazir=true. Önceden yüklenmiş podcast için partner eğitim ekranında eksik sürenin tamamlanması ve sonraki firma yayını gerçek ortam kabulü bekleniyor.

- [x] Süre geliştirmesi doğrulandı: 17 yerel SQL kontrolü, 18 gerçek API/ortak süre okuyucusu kontrolü; satın alma/hazır yayın zincirinde 42 kontrol. Partnerden kayıtlı 120 saniyenin üreticinin öğrenme aracına aktarıldığı sınandı. TypeScript başarılı, lint hata yok (şema snapshot RPC uyarıları). Yerel test sonuçlarıdır; gerçek yükleme/oynatma ve SQL kullanıcı uygulaması bekleniyor.

### Partner Yeni Eğitim — podcast yayın görseli ve transkript

- [x] Podcast sesi yüklendiğinde Yeni Eğitim formunda isteğe bağlı yayın görseli yükleme, önizleme ve kaldırma açılır. Görselsiz devam edilir. Ortak destek dosyası kuralları JPEG/PNG/WebP ve 20 MB sınırını doğrular. Dosyalar Bunny Storage'a gider; video TUS akışı değiştirilmedi.
- [x] Mevcut PodcastTranskriptEditoru kullanılır. Manuel dosya (TXT/DOCX/PDF) sunucuda ayrıştırılır; metin düzenlenir ve açık onayla kaydedilir. Metin sınırı mevcut 10–100000 karakterdir. Onaydan sonra düzenlenirse yeniden onay gerekir; kaydedilmemiş değişiklik çıkış kontrolüne bağlandı.
- [x] AI seçeneği mevcut Gemini ses transkript servisini kullanır. Partner oturumu firma Auth hesabına dönüştürülmedi; ayrı sahiplik kontrollü kayıt/RPC ve kalıcı lease kuyruğu eklendi. Mevcut cron/local worker, firma kuyruğu boşken partner kuyruğunu işler. Eski/iptal girişim sonucu uygulanmaz. AI çıktısı taslaktır, otomatik onaylanmaz.
- [x] Başlatılmış ve tamamlanmamış transkript kaydı form ilerlemesini ve SQL yayımlamayı engeller. Transkript yoksa veya partner açıkça transkriptsiz devam ederse yayın açılabilir.
- [x] Satın alma SQL taslağı, onaylı transkript ve görsel yolunu paket anlık görüntüsüne alır; hazır yayın öğrenme aracına kapak ve onaylı metin metadata'sı olarak aktarır. Eski kapak dosyası değiştirmede fiziksel silinmez; satın alınmış paket referansları korunur.
- [x] Yerel doğrulama: 31 gerçek ek SQL kontrolü; 19 API kontrolü; gerçek ortak editör/partner bileşeniyle 12 React kontrolü; satın alma/aktarım zincirinde 44 kontrol. TypeScript başarılı. 38 mevcut podcast regresyonundan 37 geçti; değişmeyen erişim route'unda eski inline transkript kodunu arayan bir kaynak metni testi başarısız (mantık daha önce ortak helper'a taşınmış). Yeni gerçek AI/Bunny veya tarayıcı testi yapılmadı.
- [x] Kullanıcı agora_partner_podcast_ekleri_hazir=true sonucunu iletti. Yeni Eğitim podcast alanlarını ve transkriptsiz akışı sorunsuz/kolay olarak doğruladı.
- [x] Agora podcast bilgilendirmesi kod bağlantısı tamamlandı; aşağıdaki 6 Kasım kaydı SQL ve gerçek ekran kabulünü ayrıca izler.

### Teknik borç — partner podcast gerçek transkript kabulü

- [ ] TB-AGORA-PODCAST-01: Kullanıcı talimatıyla AI transkriptin gerçek dosyadan oluşturulması, düzenlenmesi, onayı ve yeniden girişte korunması teknik borca bırakıldı.
- [ ] TB-AGORA-PODCAST-02: Manuel TXT/DOCX/PDF/metin transkript ekleme, düzenleme, onay ve yeniden girişte korunmanın gerçek ekran kabulü teknik borca bırakıldı. Seçeneklerin görünmesi doğrulandı; gerçek oluşturma/onay testi doğrulanmadı.
- [x] Podcast süre SQL'i uygulandı; kullanıcı sorgusunda PE-10004 / İhtiyacı Bulmak / hazir / 16 saniye kaydı doğrulandı.

### Agora — podcast bilgisi ve bekleyen satın alma kurulumunu tamamlama

- [x] Tüm yetkili Agora ziyaretçileri (üretici, TM, yönetici) kart ve inceleme alanında Transkriptli/Transkriptsiz, Özel Kapak/Standart Kapak bilgilerini görür. Üretici sipariş onayı aynı bilgiyi tekrar gösterir. Bilgi alınamazsa transkriptsiz varsayılmaz; podcast sipariş onayı kapalıdır.
- [x] Özel görsel ortak HOYK thumbnail alanına imzalı URL olarak bağlandı. İncelemede onaylı transkript açılıp okunabilir; taslak metin ve ham ses dosyası yolu ziyaretçiye verilmez. Sesli önizleme koruması sürer.
- [x] Tek kurulum dosyası scripts/sql/agora_kurulum_tamamlama.sql, bilgilendirme SQL'iyle bekleyen kullanıcı bazlı satın alma SQL'ini aynı transaction içinde içerir. Partnerin yayın üretim tablolarını yeniden kurmaz.
- [x] Yerel kontroller: 14 SQL bilgilendirme, 12 API, 28 gerçek vitrin/HOYK React ve 16 koruma oynatıcı kontrolü başarılı. TypeScript başarılı; lint hata yok. Auth/DB/CDN/medya olayları test bağımlılıklarında sahte; gerçek tarayıcı/Bunny/AI testi değildir.
- [ ] Kullanıcı tek kurulum SQL'ini uygulayacak; agora_podcast_bilgilendirme_hazir ve agora_satin_alma_hazir sonuçları bekleniyor. Sonrasında gerçek kullanıcı satın alma ve üretici havuzuna aktarım kabulü yapılacak.
- [ ] Partner/admin Hak Edişleri ve Raporlar ekranlarının sipariş verisine bağlanması ayrı bekleyen iş olarak korunur; bu teslimde tamamlandı sayılmaz.


## Üretici — Bağımsız Agora Yayınları çalışma alanı (6 Kasım 2026)

Satın alma üretici kullanıcıya aittir. Aynı firmadaki diğer üreticiye havuz erişimi vermez. Satın alınan kaynak tekrar yayına alınabilir; her hazırlık ayrı yayın adayıdır, orijinal medya dosyası çoğaltılmaz. Önceki Yayın Yönetimi içindeki satın alınan yayınlar kutusu bu çalışma alanıyla değiştirilmiştir.

- [x] 1. Üretici yayın oluşturma kodlarındaki hedef, eğitim türü, ürün, teknik ve takım kuralları incelendi. Ürün eğitimi/ürün medikal eğitiminde ürün; Eczanem hedefinde türden bağımsız ürün zorunludur. Satış tekniklerinde ürün tercihlidir, saha hedefinde teknik zorunludur. E-Club ve Eczanem teknik alanı göstermez. Rolün açabildiği eğitim türleri ortak yetenek kaynağından okunur.
- [x] 2. Üretici sidebarının ilk bağlantısı `Agora Yayınları`: mor metin; yazı altında çizgi yoktur. Sekmenin altında sidebar genişliğinde ince yatay ayırıcı vardır. Yeni sayfa `/agora-yayinlari`; sunucuda üretici rol kapısı. Normal Yayın Yönetimi içindeki eski kutu ve kullanılmayan bileşeni kaldırıldı.
- [x] 3. Üç stat kartı ve `Agora Yayınlarım / Agora Yayın Yönetimi` toggle eklendi. Statlar kişisel satın alma sayısını, yayına alınmış farklı satın alınan içerik sayısını ve toplam yayına alma sayısını gerçek kayıtlardan gösterir.
- [x] 4. Kayan partner filtresi, kullanıcıya ait satın alma adedi rozetleri ve ortak HOYK ile `Yeni Satın Aldıklarım / Yayınladıklarım` rafları eklendi. Henüz yayın kaydı olmayan satın alımlar ilk raftadır. Satın alma anındaki kapak/video kaynağı kullanılır; özel kapak yolu sunucuda imzalanır.
- [x] 5. `Yayına Al` seçilen kaynağı Agora Yayın Yönetimi içinde açar. Hedef, eğitim türü, ürün ve teknik seçimleri rolün mevcut kurallarına göre hazırlanır; eksik zorunlu değerlerle ilerlenmez. Önceki hazırlıklara dönülebilir.
- [x] 6. Yayın puanları, kazanım modeli, tekrar, yayın günü ve teyit için mevcut `BekleyenSatir`, `useYayinYonetimi` ve ortak modallar kullanıldı. Ayrı bir puanlama/yayımlama uygulaması yazılmadı. Kaynak seçimi tamamlandıktan sonra aynı yatay yayın kartı açılır.
- [x] 7. Yayın normal dağıtım/puan/raporlama altyapısına mevcut yayımlama servisiyle girer. Agora adayları ve yayınları, geleneksel Yayın Yönetimi listesi/özetinden ayrıldı; yeni yönetimde gösterilir. Eski hazırlıklar ürün/hedef ayarı tamamlanmadan yayımlanamaz. Geleneksel aday silme uç noktası satın alınan ortak medya kaynağını silemez.
- [x] 8a. Yerel doğrulama tamamlandı: yeni SQL için 22 kontrol (mevcut 44 satın alma/zincir kontrolüyle toplam 66), yeni API için 59 kontrol, gerçek sayfa/HOYK/seçimler için 14 kontrol; mevcut vitrin/kabuk için 29 kontrol. TypeScript başarılı. Lint hata yok; yeni RPC'ler mevcut şema snapshotında bulunmadığından uyarı verir. Testler sahte auth/temel tablolarla PGlite/HappyDOM ortamındadır; canlı DB ve tarayıcı kabulü değildir. Yayın düğmesinin gerçek son kullanıcı dağıtımı bu oturumda çalıştırılmadı.
- [x] 8b. Kullanıcı `scripts/sql/agora_yayinlari_calisma_alani.sql` kurulumunu `agora_yayinlari_calisma_alani_hazir = true` sonucuyla doğruladı.
- [ ] 8c. Kullanıcı gerçek üretici hesabında raf → hedef/ürün → yayın ayarları → Yayınla ve tekrar yayına alma akışını kontrol edecek. Mobil/tablet görsel kabulü bekliyor.

- [x] Partner Eğitimlerim: masaüstü/tablet kart alanı yatay kaydırılabilir rafa bağlandı; ortak `AgoraRafOklari` ile Cogniti kenar okları eklendi. Mobilde mevcut `MobilYayinAkisi` korundu.

- [x] Admin Partner Yayınları: masaüstü/tablet kart alanı yatay rafa bağlandı; partnerle aynı ortak Cogniti kenar okları eklendi. Mobilde mevcut ortak dikey akış korundu.


## Agora mobil düzeni — kullanıcı onayıyla adım adım (6 Kasım 2026)

- [x] 1. Agora Vitrini — Mobil Düzen: ortak `MobilYayinAkisi` kullanıldı; her raf tek sütunda, ilk 2 kart ve beşer açılan Daha Fazla Göster ile listelenir. Partner/hedef/araç değişiminde raf başlangıca döner. Aynı kapsamda yenileme açık kart sayısını korur. Masaüstü/tablet yatay rafı ve kenar okları korundu.
- [x] 1. adım yerel kontrolü: gerçek bileşenlerle HappyDOM içinde 13 mobil senaryo ve mevcut 29 vitrin senaryosu geçti. TypeScript ve hedefli lint başarılı. Gerçek cihaz/tarayıcı görsel kabulü yapılmadı.
- [x] 2. Üretici — Agora Yayınlarım Mobil Düzeni: kullanıcı onayıyla uygulandı. Yeni Satın Aldıklarım ve Yayınladıklarım rafları ortak MobilYayinAkisi ile tek sütunda ilk 2 kart, beşer açılan Daha Fazla Göster düzenine bağlandı. Partner değişiminde iki raf başlangıca döner; aynı kapsamda yenilemede açıklık korunur. Yayına Al bağlantısı ve masaüstü/tablet yatay rafları korundu. 14 yeni mobil senaryo ve mevcut 14 arayüz senaryosu, TypeScript ve hedefli lint geçti. Gerçek cihaz görsel kontrolü yapılmadı.
- [x] 3. Ortak Görünüm ve Kod Temizliği: kullanıcı onayıyla tamamlandı. Agora raflarının mobil yatay kart genişliği ve aralık kuralları kaldırıldı; HOYK kökünde karşılığı olmayan article seçicisi temizlendi. Ortak kenar okları ve masaüstü/tablet yatay raf kuralları korundu. Partner/adminin son onaylanan raf/listelerine müdahale edilmedi. Mevcut 27 hedefli mobil/masaüstü DOM senaryosu geçti; gerçek tarayıcı görsel kontrolü 4. adımdadır.
- [x] 4. Kontroller — kullanıcı kararıyla çalışma tamamlandı kabul edildi. Gerçek tarayıcıdaki mobil/tablet/masaüstü yerleşimi, 2+5 liste açılması, filtre sıfırlaması, raf okları, ön izleme/sipariş modalı ve Yayına Al bağlantısı kontrollerini kullanıcı kendisi yapacak. Bu kontroller tarafımızca yapılmış veya başarıyla doğrulanmış sayılmadı; gerçek satın alma/yayımlama işlemi gerçekleştirilmedi.

- [x] Kullanıcı son menü değişikliğini geri aldırdı: Agora Yayınları yeniden Yayınlar ve Raporlar grubunun ilk bağlantısıdır; üretici rolünde grup başlığı geri getirildi. Önceki raf ve mobil geliştirmeler korundu.

- [x] Son kullanıcı kararı: üretici sidebarında Yayınlar ve Raporlar başlığı kaldırıldı. AGORA YAYINLARI büyük harflerle en üstte bağımsız bağlantı olarak yerleştirildi; mor renk ve altındaki yatay ayırıcı korundu. Diğer yayın/rapor bağlantıları korunur. Masaüstü ve mobil menü aynı düzeni kullanır.

- [x] AGORA YAYINLARI bağlantısının yazısı T-Club/E-Club grup başlıklarıyla aynı 12 px, 800 kalınlık ve 0.06em harf aralığına getirildi; masaüstü ve mobilde mor renk korundu.
