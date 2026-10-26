# Viva — 1. Aşama Detaylı Kontrol Listesi

**Cogniti içinde Viva’nın yapısını kurmak**  
Tarih: 25 Ekim 2026  
Kapsam: Viva Geliştirme Proje Adımları belgesinin 1–6. adımları.  
Durum: **1. AŞAMA TAMAMLANDI — kullanıcı kabulü, 25 Ekim 2026.** Özgün 74 maddenin 72’si uygulama, kayıtlı test veya kullanıcı kabulü kapsamında kapatıldı; 2 doğrulama maddesi (1.6.08 / 1.6.12) açıkça sonraki takibe devredildi. E-posta kontrolü TB-03 teknik borcundadır. Devredilen işler yapılmış sayılmaz.

[18 adımlık ana proje planını aç](./VIVA_GELISTIRME_PROJE_ADIMLARI.md)

## Güncel kararlar ve uygulama durumu

- Tüm iç kullanıcı rolleri kendi organizasyon kapsamında etkinlik açabilir.
- Özel davetli, bağlantıya ek olarak e-posta doğrulaması yapar; kalıcı üyelik açılmaz.
- SQL’i kullanıcı çalıştıracak. Ajanın veritabanına erişim izni yok.
- [Uygulama, yetki matrisi ve test kaydını aç](./VIVA_ASAMA_1_UYGULAMA.md)

## Hedef ve çalışma sınırı

Bu aşamanın sonunda yetkili kullanıcı Cogniti içinde Viva’ya ulaşabilir, etkinlik oluşturabilir, düzenleyebilir, planlayabilir, katılımcı seçebilir, davet bağlantısı hazırlayabilir ve etkinliği iptal edebilir. Davet edilen kişi yalnız kendisine açılan etkinlik detayına ve yayın odası sayfasına ulaşabilir. Yayın odasında ikinci aşamada Daily’nin yerleşeceği alan hazırdır.

Gerçek görüntü/ses bağlantısı ikinci aşamada kurulur. Cogniti içerikleri, randomize sorular, kayıt arşivi, transkripsiyon ve raporlama üçüncü aşamada bağlanır.

| İş | İlk aşamadaki işlem | Sonraki bağlantı |
|---|---|---|
| Etkinlik, tarih, düzenleyen, katılımcılar | Viva’da geliştir | Daily odasıyla ikinci aşamada eşleştir |
| Cogniti kimliği ve organizasyon kapsamı | Mevcut kaynakları kullan | İkinci aşamada Daily izinlerine çevir |
| Etkinliğe özel misafir daveti | Viva’da geliştir | İkinci aşamada izleyici iznine çevir |
| Yayın odası sayfası | Yerleşim ve erişimi hazırla | İkinci aşamada Daily Prebuilt’i yerleştir |
| Kamera/mikrofon ve cihaz seçimi | Daily’ye bırak | İkinci aşama |
| Bekleme odası, sohbet, el kaldırma, katılımcı görüntüleri | Daily’ye bırak | İkinci aşama |
| Ekran paylaşımı ve görüşme içi yönetim | Daily’ye bırak | İkinci aşama |
| İçerik oynatıcıları ve soru motoru | Mevcut Cogniti kaynaklarını kullan | Üçüncü aşama |
| Kayıt üretimi | Daily’ye bırak | İkinci aşama; arşive aktarım üçüncü aşama |
| Transkripsiyon ve raporlama | Mevcut Cogniti altyapısına bağla | Üçüncü aşama |

**Temel kural:** Her işte önce mevcut Cogniti bileşeni ve Daily’nin hazır karşılığı kontrol edilir. Aynı işlev için yeni bir görüşme ekranı, cihaz kontrolü veya ikinci bir öğrenme altyapısı oluşturulmaz.

## 1. İşlevlerin karşılığını ve ilk aşama kararlarını belirlemek

### 1.1. Mevcut kaynaklarla eşleştirme

- [x] **1.1.01** Ana planın 1–6. adımlarını bu aşamanın görev kapsamı olarak sabitle.
- [x] **1.1.02** Her görev için “Cogniti’de mevcut / Daily’de hazır / Viva’da geliştirilecek” karşılığını ve kullanılacak kaynağı kaydet.
- [x] **1.1.03** Ortak panel, masaüstü menüsü, mobil menü, form, seçim, liste, tarih ve hata gösterimi bileşenlerini belirle; Viva ekranlarını bunlara bağla.
- [x] **1.1.04** İç kullanıcıların ve EClub üyelerinin mevcut kimlik ve gezinme yollarını ayrı ayrı eşleştir. EClub üyesinin çok firmalı bağlamını koru.
- [x] **1.1.05** Mevcut EClub üyelik daveti ile Viva etkinlik davetinin farklı işlemler olduğunu veri ve akış tasarımında ayır. Viva misafiri eklemek EClub üyeliği oluşturmasın.

### 1.2. Uygulama öncesinde netleştirilecek ürün kararları

- [x] **1.1.06** Hangi rollerin etkinlik oluşturabileceğini, düzenleyebileceğini ve iptal edebileceğini belirle. UTT/KD_UTT, PM ailesi, medikal ve diğer iç roller için izinleri açıkça yaz.
- [x] **1.1.07** Her oluşturucu rol için davet edilebilir kişilerin kapsamını belirle: kendi EClub listesi, takım, bölge veya firma. Üretim ve rapor yetkilerini kendiliğinden Viva yetkisine dönüştürme.
- [x] **1.1.08** Düzenleyen, sunucu ve izleyici kavramlarını tanımla. Düzenleyen dışında sunucu atanacaksa bu yetkinin kimde olduğunu karara bağla.
- [x] **1.1.09** Etkinliğin yalnız seçilen kişilere mi, seçilen gruba mı açılacağını ve birden fazla hedef kitlenin birlikte kullanılıp kullanılamayacağını belirle.
- [x] **1.1.10** Özel davetlinin hangi bilgilerle kabul edileceğini, bağlantının başka kişiye iletilmesi durumunda beklenen davranışı ve yeniden giriş kuralını belirle.
- [x] **1.1.11** Başlangıç/bitiş zamanı, erken erişim, yeniden planlama ve davetlerin geçerlilik kurallarını belirle. Saat dilimi Türkiye saati olarak açık gösterilsin.
- [x] **1.1.12** Daveti iletme yöntemini belirle. İlk sürümde bağlantı kopyalama ile mevcut bildirim olanaklarını değerlendir; yeni e-posta/SMS gönderimini ayrıca tanımlanmadan kapsamına ekleme.

**Bu adımın teslimi:** İşlev sahipliği tablosu, rol–eylem–hedef kitle matrisi ve uygulanacak ürün kararları. Açık kararlar kapanmadan bunlara bağlı yetki kodu yazılmaz.

## 2. Viva’nın Cogniti içindeki sayfalarını ve gezinmesini kurmak

### 2.1. Sayfa ve menü yapısı

Aşağıdaki Viva adresleri uygulandı; mevcut yönlendirmelerle birlikte kontrol edildi.

| Ekran | Uygulanan adres | İşlev |
|---|---|---|
| Viva ana sayfası | `/viva` | Kullanıcının yetkili olduğu etkinlikler |
| Etkinlik oluşturma | `/viva/yeni` | Başlık, zaman, hedef kitle ve katılımcı seçimi |
| Etkinlik detayı | `/viva/[etkinlikId]` | Etkinlik bilgileri ve yetkili işlemler |
| Etkinlik düzenleme | `/viva/[etkinlikId]/duzenle` | Düzenlenebilir etkinlik alanları |
| Yayın odası | `/viva/[etkinlikId]/oda` | Daily için ayrılmış yayın alanı |
| Özel davet girişi | `/viva/davet/[token]` | Etkinliğe özel misafir erişimi |

- [x] **1.2.01** Rota yapısını mevcut Cogniti yönlendirmeleriyle kontrol ederek kesinleştir.
- [x] **1.2.02** Yetkili iç kullanıcıların masaüstü ve mobil menüsüne Viva girişini ekle.
- [x] **1.2.03** Yetkili EClub üyelerinin ayrı gezinme yapısına Viva girişini ekle; seçili firmanın kapsamını koru.
- [x] **1.2.04** İç kullanıcı ve EClub ekranlarını mevcut panel kabuğunda aç; misafir girişini hesap gerektiren panel yönlendirmelerinden ayrı ele al.
- [x] **1.2.05** Viva ana sayfasında kullanıcının düzenlediği ve davet edildiği etkinlikleri ayırt edilebilir biçimde göster. Listeler yalnız yetkili kayıtları içersin.
- [x] **1.2.06** Liste öğelerinde başlık, tarih/saat, düzenleyen, durum ve geçerli eylemi göster. İlk aşamaya performans veya başarı göstergeleri ekleme.

### 2.2. Etkinlik ekranları

- [x] **1.2.07** Oluşturma/düzenleme formunu başlık, açıklama, zaman ve hedef kitle alanlarıyla kur. Zorunlu alanları görünür göster.
- [x] **1.2.08** Katılımcı seçiminde mevcut kişi/organizasyon kaynaklarını kullan; arama, seçimden çıkarma ve aynı kişinin tekrar eklenmemesini sağla.
- [x] **1.2.09** Etkinlik detayında yalnız kullanıcının yetkili olduğu düzenleme, davet yönetimi ve iptal işlemlerini göster.
- [x] **1.2.10** Yayın odası sayfasında başlık, etkinlik bilgisi ve Daily’ye ayrılmış alanı hazırla. İlk aşamada canlı bağlantının henüz eklenmediğini açıkça belirt; çalışmayan kamera/mikrofon düğmeleri üretme.
- [x] **1.2.11** Yükleniyor, boş liste, kayıt bulunamadı, yetki yok, süresi geçmiş davet ve işlem hatası durumlarını ortak Cogniti bileşenleriyle göster.
- [x] **1.2.12** Telefon/tablet için form, katılımcı seçimi ve oda yerleşiminin duyarlı kodunu hazırla; alan etiketleri, odak stilleri ve mevcut tema değişkenlerini kullan. **Kod tamamlandı.** Gerçek cihaz/tema kontrolü F-01’e devredildi.

**Bu adımın teslimi:** Viva’nın sayfa akışı ve ortak Cogniti tasarımıyla çalışan ekranları. Görüşme araçlarının yerini Daily Prebuilt dolduracak.

## 3. Etkinlik verisini ve yaşam döngüsünü kurmak

### 3.1. Veri sözleşmesi

Bu bölümdeki kavramlar önerilen veri ihtiyaçlarıdır; mevcut tablo veya kolon adları olarak kabul edilmez. SQL hazırlanmadan önce gerçek şema doğrulanır.

- [x] **1.3.01** Mevcut şemayı kontrol et; Viva için kullanılabilecek kaynakları ve gerçekten gereken yeni kayıtları belirle.
- [x] **1.3.02** Etkinlik kimliği, firma, düzenleyen, başlık, açıklama, zaman, durum ve oluşturma/güncelleme bilgilerinin sözleşmesini yaz.
- [x] **1.3.03** Etkinlik–katılımcı bağını tanımla. İç kullanıcı, EClub kişisi ve özel davetli kimlikleri birbirine karışmasın; etkinlik içindeki rol ayrı tutulsun.
- [x] **1.3.04** Özel davet için etkinlik bağı, geçerlilik süresi, iptal durumu ve güvenli bağlantı doğrulamasını tanımla. Gizli davet değerlerinin gereksiz listelerde ve kayıtlarda gösterilmesini engelle.
- [x] **1.3.05** Firma ve etkinlik bağlarını veritabanı kısıtlarıyla koru; aynı kişinin aynı etkinliğe yinelenen katılımcı kaydıyla eklenmesini önle.
- [x] **1.3.06** Daily oda kimliği gibi ikinci aşama alanlarının bağlantı yerini belirle. Bu aşamada gerçek oda veya Daily anahtarı gerektirme.

### 3.2. Durumlar ve işlemler

| Durum/geçiş | Birinci aşamadaki davranış |
|---|---|
| Taslak | Yetkili düzenleyen hazırlar; hedef katılımcılara henüz açılmaz |
| Taslak → Planlandı | Zorunlu bilgiler ve kapsam doğrulanınca etkinlik erişime açılır |
| Planlandı → Planlandı | Yetkili düzenleme ve yeniden planlama; davet süreleri güncellenir |
| Taslak/Planlandı → İptal | Yeni erişimler kapanır; mevcut davetler geçersizleşir |
| Canlı | Veri sözleşmesinde tanımlanır; gerçek geçiş ikinci aşamada Daily ile bağlanır |
| Sona erdi | Veri sözleşmesinde tanımlanır; gerçek kapanış ikinci aşamada bağlanır |

- [x] **1.3.07** İzinli durum geçişlerini ve her durumda değiştirilebilir alanları tek sözleşmede topla.
- [x] **1.3.08** Sırf planlanan saat geldiği için etkinliği gerçek yayın başlamış gibi “Canlı” yapma. Başlamamış etkinliğin gecikme davranışını tanımla.
- [x] **1.3.09** Etkinlik oluşturma, listeleme, detay, düzenleme, planlama, iptal ve katılımcı yönetimi sunucu işlemlerini kur; kimlik ve kapsamı her işlemde doğrula.
- [x] **1.3.10** Çift tıklama veya tekrar gönderilen oluşturma isteğinin ikinci bir etkinlik üretmesini önle. İptal ve tekrar denemelerde tutarlı sonuç döndür.
- [x] **1.3.11** Güncel sürüm kontrolü ve satır kilidiyle eski düzenlemenin yeni durumu ezmesini önle. **Kod ve sıralı sürüm testleri tamamlandı.** İki bağımsız bağlantıyla yarış doğrulaması F-03’te izlenir.
- [x] **1.3.12** Etkinlik ile katılımcı/davet değişikliklerinin yarım kalmamasını sağla. Tarihleri sunucuda doğrula, depolama ve Türkiye saatinde gösterim dönüşümünü tek yerden yönet.

**Bu adımın teslimi:** Gerçek kayıtlarla çalışan etkinlik işlemleri ve durum sözleşmesi. Canlı yayın geçişleri ikinci aşamaya hazırdır.

## 4. Katılımcı ve erişim yetkilerini uygulamak

- [x] **1.4.01** Birinci adımda belirlenen rol–eylem–hedef kitle matrisini ortak sunucu yetki kontrolüne dönüştür.
- [x] **1.4.02** Mevcut oturum ve rol çözümünü kullan; rol kararını istemcinin gönderdiği rol veya firma bilgisine bırakma.
- [x] **1.4.03** Firma içi etkinliklerde oluşturucunun ve seçilen katılımcıların aktif kimlik/firma bağlarını doğrula.
- [x] **1.4.04** UTT/KD_UTT’nin EClub seçimlerini kendi yetkili liste ve aktif eczane/kişi bağlarıyla doğrula. Başka temsilcinin kişilerini yalnız kimlik göndererek ekleyemesin.
- [x] **1.4.05** Çok firmalı EClub üyesinin erişimini etkinliğin firması için değerlendir; bir firmadaki bağ başka firmanın Viva erişimini açmasın.
- [x] **1.4.06** Liste, detay, düzenleme, davet ve oda sayfasında aynı etkinlik kapsamını uygula. Menü gizleme ile doğrudan adres/API erişimini birlikte denetle.
- [x] **1.4.07** Davet sonrası kullanıcının pasife alınması veya ilgili kapsam bağının değişmesi durumundaki erişim kuralını uygula; her istekte güncel yetkiyi kontrol et.
- [x] **1.4.08** Özel davetliyi yalnız ilgili etkinliğin izleyicisi olarak tanımla. Viva daveti genel Cogniti, EClub, mağaza veya başka etkinlik erişimi vermesin.
- [x] **1.4.09** Katılımcı listesindeki kişisel bilgileri görüntüleyebilen rolleri sınırla; misafir için gereken asgari etkinlik bilgisini göster.
- [x] **1.4.10** Düzenleyen/sunucu/izleyici rollerinin Daily karşılıklarını ikinci aşama bağlantı sözleşmesine yaz. Kamera, mikrofon ve görüşme yönetimi izinlerinin fiilen uygulanması Daily entegrasyonunda doğrulanacak.

**Bu adımın teslimi:** Kullanıcının kimliğine, organizasyonuna ve etkinlik bağına göre çalışan Viva erişimi.

## 5. Davet ve katılım akışını hazırlamak

### 5.1. Mevcut üyeler

- [x] **1.5.01** Seçilen iç kullanıcı/EClub üyesinin etkinliği Viva listesinde ve detayında görebilmesini sağla; yalnız planlanmış ve kendisine açılan etkinlikler gösterilsin.
- [x] **1.5.02** Oturumu kapalı üye giriş yaptığında, yetkisi doğrulandıktan sonra davet edildiği Viva etkinliğine dönebilsin.
- [x] **1.5.03** Katılımcının listeden çıkarılmasını yeni erişimlerde hemen uygula; açık sayfadaki eski bilgiler işlem yetkisi vermesin.

### 5.2. Özel davetliler

- [x] **1.5.04** Düzenleyenin özel davet oluşturmasını ve bağlantıyı kopyalamasını sağla; davetin etkinliğini, geçerliliğini ve iptal durumunu görebilsin.
- [x] **1.5.05** Geçerli bağlantıda etkinliğe özel, e-posta kodu ve HttpOnly çerez kullanan misafir girişini kur; kalıcı Cogniti/EClub üyeliği oluşturma. **Kod ve sahte bağımlılıklı testler tamamlandı.** Gerçek e-posta/çerez akışı F-02’de izlenir.
- [x] **1.5.06** Hatalı, süresi geçmiş, iptal edilmiş veya başka etkinlikte kullanılmış davet için uygun erişim sonucu göster.
- [x] **1.5.07** Davet yenilendiğinde eski bağlantının davranışını ve misafirin sayfayı yenileyip yeniden girebilmesini belirlenen kurala göre uygula.
- [x] **1.5.08** Etkinlik iptalinde ve misafir erişim süresi sonunda erişimi kapat. Sona ermiş etkinlikten yeni katılım yetkisi üretme.
- [x] **1.5.09** Etkinliğin tarihi değiştiğinde davet sürelerini ve ekrandaki tarih bilgisini tutarlı güncelle.

### 5.3. Yayın odasına geçiş

- [x] **1.5.10** Etkinlik detayından oda sayfasına geçmeden önce üye veya davet erişimini sunucuda doğrula; oda adresine doğrudan girişte de aynı kontrolü uygula.
- [x] **1.5.11** Oda sayfasından Viva listesine veya etkinlik detayına dönüşü kur. Misafirin dönüşünde genel panel erişimi açılmasın.
- [x] **1.5.12** Oda sayfası bu aşamada cihaz izni istemesin. Kamera testi, bekleme odası, sohbet ve el kaldırma arayüzlerini ikinci aşamada Daily’den al.

**Bu adımın teslimi:** Mevcut üyeler ve özel davetliler için etkinlik detayına ve oda sayfasına kadar çalışan erişim akışı.

## 6. Birinci aşamayı doğrulamak ve teslim etmek

### 6.1. İşlev ve yetki senaryoları

- [x] **1.6.01** UTT/KD_UTT kapsamını, taslak → plan → EClub üyesinin erişimi zincirini SQL iş kuralı testlerinde doğrula; ekran/form davranışını uygulama testleriyle kontrol et. **Tamamlayıcı kullanıcı SQL’i 7/7 başarılı.** Bu kayıt gerçek tarayıcıda tam rol akışı testi değildir.
- [x] **1.6.02** PM, medikal ve diğer iç rollerin oluşturma/kapsam kurallarını yerel SQL ve uygulama testlerinde doğrula. **Önceki izole SQL testleri ve rol testi kaydı mevcut.** Her rolle gerçek tarayıcı oturumu denenmiş sayılmaz.
- [x] **1.6.03** Özel davet oluşturma, misafir kod doğrulaması, odayı açma ve iptalde kapanma davranışını SQL ve sahte bağımlılıklı React testleriyle doğrula; kalıcı üyelik oluşmadığını kontrol et. **Testler başarılı.** Gerçek teslimat ve misafir oturumu F-02’de.
- [x] **1.6.04** Firma/UTT kapsamı, davetsiz kimlik, yetkisiz detay ve yönetim sınırlarını SQL iş kuralları ve uygulama testleriyle doğrula. **Kayıtlı testler başarılı.** Bu sonuç gerçek tarayıcıda bütün rol/kimlik birleşimlerinin denendiği anlamına gelmez.
- [x] **1.6.05** Taslak, plan, düzenleme, tarih ve iptal kurallarını SQL testleriyle; liste, form, sürüm çakışması ve erişim kaybı ekranlarını React testleriyle doğrula. **Kayıtlı testler başarılı.** Gerçek cihaz kontrolü F-01’de.
- [x] **1.6.06** Davet iptali, süre bitimi, yenileme ve etkinlik iptalinde eski bağlantı kurallarını SQL testleriyle doğrula. **Kullanıcının SQL sonuçları ve önceki izole test kaydı başarılı.** Gerçek misafir çereziyle uçtan uca kontrol F-02’de.
- [x] **1.6.07** Aktif düzenleyen, kişi–eczane bağı ve firma kapsamı koşullarını erişim fonksiyonlarında uygula; önceki izole SQL testlerinde pasif düzenleyen/bağ kaybı ve kapsam reddi sonuçlarını kaydet. **Yerel test kanıtı mevcut.** Canlı kullanıcı kayıtları bu test için ajan tarafından değiştirilmedi.

### 6.2. Veri ve arayüz doğrulaması

- **Devredildi — 1.6.08:** Tek bağlantıda çift istek/yinelenen katılımcı/eski sürüm kontrolleri başarılı; iki bağımsız bağlantıyla yarış testi yapılmadı. Ayrıntı: F-03.
- [x] **1.6.09** Eksik başlık, geçersiz zaman aralığı, Türkiye gece yarısı ve tarih değişimi durumlarını sınayan hedefli kontrolleri çalıştır.
- [x] **1.6.10** Sunucu/veri kurallarının önceki izole PostgreSQL 18.6/PGlite WASM testlerini ve kapsamını kaydet. **27/27 başarılı, tek bağlantı, sahte temel şema.** Bu testler DB erişim yasağından önce yapıldı; bu güncellemede SQL çalıştırılmadı.
- [x] **1.6.11** Form, katılımcı seçimi, hata gösterimi ve menü erişimini uygulama testleriyle doğrula. Kod değişikliği için gerekli tip ve lint kontrollerini çalıştır.
- **Devredildi — 1.6.12:** Gerçek tarayıcı ve cihaz/tema kontrolü push sonrası takibe taşındı. Ayrıntı: F-01.

### 6.3. Aşamanın kapanışı

- [x] **1.6.13** Kontrol listesinde yalnız gerçekten uygulanan ve doğrulanan işleri tamamlandı olarak işaretle. Yerel test, gerçek veritabanı uygulaması ve tarayıcı doğrulamasını ayrı kaydet.
- [x] **1.6.14** Etkinlik API’lerini, veri sözleşmesini, yetki matrisini, açık kararları ve Daily’nin bağlanacağı noktaları belgeye işle.
- [x] **1.6.15** Birinci aşamanın ekran teslimini ve kullanıcının kabulünü kaydet. **Kullanıcı Viva’nın Cogniti’ye kurulduğunu ve ekranda görüldüğünü onayladı.** Canlı telefon denemesi push sonrasında F-01’de izlenecek.
- [x] **1.6.16** Daily’ye devir için etkinlik kimliği, güncel yetki, düzenleyen/katılımcı/izleyici karşılıkları, süre ve iptal bağlantı noktalarını belgeyle doğrula. **Devir sözleşmesi hazır.** Gerçek Daily odası/token ve canlı izin uygulaması ikinci aşamanın işidir.

**Güncel kapanış ölçütü — kullanıcı kararı:** Viva Cogniti’ye kuruldu ve ekranda görüldü; etkinlik/erişim altyapısı ile Daily’nin yerleşeceği oda alanı hazır. Canlı telefon kontrolü push sonrası; elde tablet bulunmaması ve gerçek e-posta kontrolü bu aşamanın kapanışını bekletmez. Canlı görüşme ikinci, Cogniti yetenekleri üçüncü aşamadır.

## Geliştirme sırasında başvurulacak mevcut kaynaklar

Bu kaynaklar başlangıç noktalarıdır; yeni geliştirme başlamadan ilgili kaynakların güncel hali okunur.

- [Ana iş modeli ve kurallar — BLUEBOOK](/Users/iskendereser/Desktop/cogniti-dev/docs/BLUEBOOK.MD)
- [Ortak panel yerleşimi](/Users/iskendereser/Desktop/cogniti-dev/app/(panel)/layout.tsx)
- [İç kullanıcı ve EClub gezinme kaynakları](/Users/iskendereser/Desktop/cogniti-dev/components/panel/panelNav.config.ts)
- [Yetkili rol çözümü](/Users/iskendereser/Desktop/cogniti-dev/lib/utils/rolCozucu.ts)
- [Mevcut rol tanımları](/Users/iskendereser/Desktop/cogniti-dev/lib/utils/roller.ts)
- [UTT–eczane kapsam yardımcıları](/Users/iskendereser/Desktop/cogniti-dev/lib/eclub/uttEczane.ts)
- [Mevcut EClub üyelik daveti; Viva davetinden ayrı akış](/Users/iskendereser/Desktop/cogniti-dev/lib/eclub/uyelikDaveti.ts)
- [Daily Prebuilt özellik ve yerleştirme belgeleri](https://docs.daily.co/guides/products/prebuilt/customizing-daily-prebuilt)
- [Daily katılım ve süre izinleri](https://docs.daily.co/reference/rest-api/meeting-tokens)

## Kapanış sayımı ve kanıtlar

| Kayıt | Sonuç |
|---|---|
| Özgün kontrol maddesi | 74; bütün kimlikler korundu |
| Bu aşamada kapatılan | 72 işaretli madde |
| Sonraki takibe devredilen | 2 madde: 1.6.08 (yarış doğrulaması), 1.6.12 (gerçek cihaz/tema kontrolü) |
| Bu aşamada kararsız veya sınıflandırılmamış madde | 0 |
| Kullanıcı SQL testi | İlk dosya: 27 başarılı, 2 atlandı; tamamlayıcı EClub: 7/7 başarılı, önceki iki senaryo doğrulandı |
| Önceki izole SQL testi | 27/27; PostgreSQL 18.6 / PGlite WASM, sahte temel şema, tek bağlantı |
| Uygulama ve DOM testleri | 21/21; sahte DB/ağ/e-posta |
| Tip ve son değişen bileşenlerin lint kontrolü | Başarılı; son iki bileşen ve arayüz testinde 0 hata, 0 uyarı |
| Aşama kabulü | Kullanıcı onayı: Viva Cogniti’ye kuruldu ve ekranda görüldü |

Tamamlanan kutuların kanıt düzeyi yukarıda ve ilgili maddelerde belirtilir. Kod teslimi,
SQL iş kuralı testi, sahte bağımlılıklı uygulama testi ve gerçek tarayıcı kabulü aynı şey
olarak gösterilmez. Bu belge güncellemesi sırasında DB’ye bağlanılmadı veya SQL çalıştırılmadı.

- [Uygulama ve yetki sözleşmesi](./VIVA_ASAMA_1_UYGULAMA.md)
- [Kullanıcının paylaştığı SQL sonuçları](./VIVA_ASAMA_1_KULLANICI_SQL_SONUCU.md)
- [Arayüz ve dar ekran kontrol kaydı](./VIVA_ASAMA_1_ARAYUZ_KONTROLU.md)
- [Makine okunur test/kabul kaydı](./VIVA_ASAMA_1_TEST_SONUCLARI.json)

## Sonraki takip — 1. aşamanın kapanışını bekletmez

### F-01 — Push sonrasında canlı telefon kontrolü

**Durum:** Bekliyor; kullanıcı kararıyla push sonrasına alındı. Push bu iş kapsamında yapılmadı.
Mobil form, katılımcı seçimi ve oda ekranı gerçek telefonda kontrol edilecek.
Tablet yok; tabletin fiziksel testi yapılmış sayılmaz. Tarayıcıdaki tablet genişliği ve iki tema
görsel kontrolü erişim açıldığında tamamlanabilir. 1.2.12’nin uygulaması kapandı; fiziksel/görsel
kontrol kısmı ve özgün 1.6.12 burada izlenir. Giriş sonrası dönüş ve sayfalar arası gerçek oturum
kontrolü de bu canlı kontrolde ele alınır.

### F-02 — Gerçek e-posta ve misafir oturumu / REDBOOK TB-03

**Durum:** Teknik borç; kullanıcı kararıyla ertelendi. Gerçek adrese kod teslimatı, kodla giriş,
HttpOnly çerezin gerçek tarayıcıda sürmesi, iptal/süre sonunda erişimin kapanması daha sonra
izinli gerçek test adresiyle doğrulanacak. SQL ve sahte taşıma testleri başarılıdır; gerçek
teslimat denenmiş sayılmaz. Uygulamada e-posta doğrulaması zorunlu kalır.

### F-03 — İki bağımsız bağlantıyla yarış doğrulaması

**Durum:** Önceki teknik doğrulama kaydında açık; yapılmadı. Özgün 1.6.08’in çift istek,
yinelenen katılımcı ve sıralı eski sürüm kontrolleri başarılı. Aynı anda düzenleme/iptal ve
kilit bekleme davranışı iki bağımsız bağlantıyla doğrulanmış sayılmaz. Önceki native PostgreSQL
başlatma denemesi paylaşımlı bellek izni nedeniyle ilerlemedi. Ajanın DB/SQL erişim yasağı
korunur; bu belge bir veritabanı testi çalıştırma yetkisi vermez.

## İkinci aşamaya devir

Birinci aşama kapandı. Sıradaki iş Daily odası ve süreli katılım izinlerinin Viva etkinliğiyle
bağlanması, Daily Prebuilt’in oda alanına yerleştirilmesi ve görüşme yaşam döngüsünün kurulmasıdır.
Bu kayıt Daily entegrasyonunun yapılmış olduğu anlamına gelmez.
