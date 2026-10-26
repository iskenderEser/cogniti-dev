# Viva Geliştirme Proje Adımları

Tarih: 25 Ekim 2026  
Durum: **1. aşama tamamlandı; 2. aşamanın geliştirme ve hedefli teknik teslimi hazır.** 2.1–2.5 SQL sonuçları kullanıcı tarafından doğrulandı. 2.6’da 10 hedefli kontrol, tip/lint ve seçili derleme başarılı. Push/deployment, production webhook/cron etkinleştirmesi ve kullanıcı canlı kabulü bekliyor; 3. aşama başlamadı.

**Sıramız: Viva’yı kurmak → Daily’yi bağlamak → Cogniti yeteneklerini eklemek.** Her adımda önce Daily’nin ve Cogniti’nin mevcut karşılığını kontrol edeceğiz; geliştirmeyi eksik kalan bağlantılarla sınırlayacağız.

## İş paylaşımı

| Alan | Kullanacağımız yapı |
|---|---|
| Etkinlik oluşturma, hedef kitle, Cogniti yetkileri, davetler | Viva |
| Görüntü/ses, cihaz seçimi, görüşme düzeni, ekran paylaşımı | Daily Prebuilt |
| Bekleme odası, el kaldırma, sohbet ve görüşme içi yönetim | Daily’nin hazır özellikleri |
| İçerikler, randomize sorular, cevap doğrulaması, transkripsiyon ve raporlama | Mevcut Cogniti altyapısı |
| Bu yapıların birlikte çalışması | Geliştireceğimiz entegrasyonlar |

Daily’nin hazır görüşme ekranını kullanacağız; görünüm ve özellikleri desteklenen ayarlarla düzenleyeceğiz. [Daily Prebuilt belgeleri](https://docs.daily.co/guides/products/prebuilt/customizing-daily-prebuilt)

## Birinci aşama: Cogniti içinde Viva’nın yapısını kurmak

### 1. İşlevlerin karşılığını belirleyeceğiz.

- [x] Birinci aşama kapsamında tamamlandı. Ayrıntılı kanıt ve devredilen kontroller, 1. aşama checklistinde kayıtlı.

Yapılacaklar listesinde her iş “Cogniti’de mevcut”, “Daily’de hazır” veya “Viva için geliştirilecek” olarak işaretlenecek. Böylece aynı işlev için ikinci bir geliştirme açılmayacak.

### 2. Viva’nın Cogniti içindeki yerini oluşturacağız.

- [x] Birinci aşama kapsamında tamamlandı. Ayrıntılı kanıt ve devredilen kontroller, 1. aşama checklistinde kayıtlı.

Menü girişi, Viva ana sayfası, yayın oluşturma/düzenleme, etkinlik detayı ve yayın odası sayfasını hazırlayacağız. Ortak Cogniti bileşenlerini ve temalarını kullanacağız.

### 3. Etkinlik kayıtlarını ve durumlarını kuracağız.

- [x] Birinci aşama kapsamında tamamlandı. Ayrıntılı kanıt ve devredilen kontroller, 1. aşama checklistinde kayıtlı.

Başlık, açıklama, tarih/saat, düzenleyen kişi, firma kapsamı ve katılımcı bilgilerini saklayacağız. Taslak, planlandı, canlı, sona erdi ve iptal durumlarını tanımlayacağız. Canlı durumunun gerçek görüşmeyle bağlantısı ikinci aşamada kurulacak.

### 4. Katılımcı ve yetki yapısını kuracağız.

- [x] Birinci aşama kapsamında tamamlandı. Ayrıntılı kanıt ve devredilen kontroller, 1. aşama checklistinde kayıtlı.

UTT’nin kendi EClub üyelerini seçmesi, firma içi yetkili katılım ve özel davetli erişimini tanımlayacağız. Dış davetliye yalnız ilgili etkinlik için izleyici erişimi vereceğiz. Viva yetkilerini Cogniti’nin mevcut kimlik ve organizasyon yapısına bağlayacağız.

### 5. Davet ve katılım akışını hazırlayacağız.

- [x] Birinci aşama kapsamında tamamlandı. Ayrıntılı kanıt ve devredilen kontroller, 1. aşama checklistinde kayıtlı.

Mevcut üyelerin etkinliği görmesini, özel davetlinin bağlantıyla etkinliğe ulaşmasını, davetin iptalini ve süresinin bitmesini çalıştıracağız. Kamera/mikrofon kontrolü ve bekleme odasını ikinci aşamada Daily sağlayacak.

### 6. Bu aşamayı doğrulayacağız.

- [x] Birinci aşama kapsamında tamamlandı. Ayrıntılı kanıt ve devredilen kontroller, 1. aşama checklistinde kayıtlı.

Etkinlik oluşturma, düzenleme, katılımcı seçme, davet erişimi ve iptal akışı çalışacak. Mobil ve tablet görünümü kontrol edilecek.

**Aşama sonunda:** Cogniti içinde etkinlikleri yönetilebilen Viva hazır olacak; yayın odasında Daily’ye ayrılmış alan bulunacak.

[Birinci aşamanın kapatılmış checklistini aç](./VIVA_ASAMA_1_DETAYLI_CHECKLIST.md)

## İkinci aşama: Daily’yi Viva yapısına bağlamak

[76 maddelik ikinci aşama detaylı checklistini aç](./VIVA_ASAMA_2_DETAYLI_CHECKLIST.md)

Kayıt sunucunun elle başlat/durdur kontrolünde olacak; toplantı deneyimi kullanıcının alışık olduğu akışı koruyacak. 2.1 kodu, Daily oda testleri ve kullanıcı SQL doğrulaması tamamlandı: 42 uygulama testi, 3 Daily kontrolü, 18 SQL testi başarılı; 5 kurulum kontrolü true. 2.2’de 67 uygulama testi, 6 Daily API kontrolü, 4 kurulum kontrolü ve 24 SQL testi başarılı. 2.3 görüşme bağlantısı tamamlandı. 2.4 ve 2.5 kullanıcı SQL doğrulamasıyla kapandı. 2.6 geliştirme ve teknik teslimi hazır; [deployment ve canlı kabul listesi](./VIVA_ASAMA_2_6_TESLIM.md) ayrı takip edilir. Gerçek görüşme/görsel kabul yapılmış sayılmaz.

### 7. Viva etkinliği ile Daily odasını eşleştireceğiz.

- [x] Teknik bağlantı ve ilgili kullanıcı SQL doğrulaması tamamlandı. Production etkinleştirme/canlı kabul 12. adımda izlenir.

Oda oluşturma, yeniden kullanım ve kapatma işlemlerini sunucudan yöneteceğiz. Aynı işlem tekrarlandığında gereksiz yeni oda oluşmasını önleyeceğiz.

### 8. Viva yetkilerini Daily katılım izinlerine çevireceğiz.

- [x] Teknik bağlantı ve ilgili kullanıcı SQL doğrulaması tamamlandı. Production etkinleştirme/canlı kabul 12. adımda izlenir.

Sunucu, katılımcı ve izleyici izinlerini; odaya bağlı ve süreli katılım bilgileriyle uygulayacağız. Daveti iptal edilen veya etkinliği biten kişinin yeniden erişimini kapatacağız. [Daily katılım izinleri](https://docs.daily.co/reference/rest-api/meeting-tokens)

### 9. Daily Prebuilt’i yayın odasına yerleştireceğiz.

- [x] Teknik bağlantı ve ilgili kullanıcı SQL doğrulaması tamamlandı. Production etkinleştirme/canlı kabul 12. adımda izlenir.

Kamera, mikrofon, cihaz seçimi, katılımcı görüntüleri, ekran paylaşımı, sohbet ve el kaldırmayı hazır arayüzden kullanacağız. Viva tasarımına uyarlamak için önce Daily’nin ayarlarını kullanacağız.

### 10. Görüşme yaşam döngüsünü bağlayacağız.

- [x] Teknik bağlantı ve ilgili kullanıcı SQL doğrulaması tamamlandı. Production etkinleştirme/canlı kabul 12. adımda izlenir.

Katılma, ayrılma, yeniden bağlanma ve herkes için bitirme işlemlerini Viva etkinliğiyle eşleştireceğiz. Sunucunun odadan ayrılmasıyla etkinliğin tamamen bitmesi ayrı davranışlar olacak.

### 11. Daily’nin kayıt özelliğini bağlayacağız.

- [x] Teknik bağlantı ve ilgili kullanıcı SQL doğrulaması tamamlandı. Production etkinleştirme/canlı kabul 12. adımda izlenir.

Kayıt başlatma/durdurma ve kaydın hazır olma bilgisini alacağız. Kayıt üretimini Daily’nin hazır özelliğiyle gerçekleştireceğiz; Cogniti arşivine aktarım üçüncü aşamada yapılacak. [Daily kayıt belgeleri](https://docs.daily.co/reference/daily-js/instance-methods/start-recording)

### 12. Gerçek görüşmeyle doğrulayacağız.

- [ ] 2.6 teknik teslimi hazır; production etkinleştirme ve kullanıcı canlı kabulü bekliyor. [Teslim belgesi](./VIVA_ASAMA_2_6_TESLIM.md).

UTT, EClub üyesi ve özel davetliyle; görüntü/ses, ekran paylaşımı, izinler, bağlantı kopması ve yayını bitirmeyi deneyeceğiz. Telefon, tablet ve bilgisayarda kontrol edeceğiz.

**Aşama sonunda:** Viva üzerinden gerçek canlı yayın ve buluşma yapılabilecek.

## Üçüncü aşama: Cogniti yeteneklerini çalışan Viva’ya bağlamak

### 13. Cogniti içeriklerini yayın odasına açacağız.

Önce mevcut oynatıcıları Daily’nin içerik entegrasyon alanlarında kullanmayı deneyeceğiz. Video, podcast, broşür ve literatür için mevcut erişim kontrollerini koruyacağız.

### 14. Sunumu eş zamanlayacağız.

İçerik açma/kapatmada Daily’nin hazır entegrasyonunu kullanacağız. Sayfa değiştirme, oynatma ve duraklatma için gereken bağlantıyı ekleyeceğiz. Geç katılan kişinin güncel sunuma ulaşmasını sağlayacağız. Daily’nin anlık mesajları saklanmadığından güncel sunum durumunu Cogniti’de tutacağız. [Daily veri paylaşımı belgeleri](https://docs.daily.co/docs/daily-js/guides/custom-messages)

### 15. Cogniti soru motorunu bağlayacağız.

Mevcut soru seti, randomize seçim ve cevap doğrulamasını Viva oturumuyla ilişkilendireceğiz. Soruların açılma zamanı, cevap süresi ve sonuç gösterimini ekleyeceğiz. Puanlama kullanılacaksa Viva’ya ait kuralları tanımlayacağız.

### 16. Katılımcı sorularını ele alacağız.

İlk kullanımda Daily sohbeti ve el kaldırmayı kullanacağız. Soruların kalıcı kaydı, sunucu tarafından seçilmesi veya sonradan analizi gerektiğinde bunları Cogniti’ye bağlayacağız.

### 17. Kayıt ve transkripsiyonu mevcut altyapıya aktaracağız.

Daily kaydını Cogniti medya alanına bağlayıp mevcut transkripsiyon akışını toplantı kaydına uyarlayacağız. Sunulan Cogniti içeriklerinin kayıtta nasıl göründüğünü ayrıca doğrulayacağız.

### 18. Sonuçları ve raporlamayı ekleyeceğiz.

Katılım, cevaplar ve değerlendirme sonuçlarını mevcut rapor yapısına bağlayacağız. Ardından gerçek UTT–EClub tanıtımı ve firma içi buluşmayla tüm akışı doğrulayacağız.

**Aşama sonunda:** Viva, Cogniti içeriklerinin canlı sunulduğu, soruların uygulandığı ve sonuçların Cogniti’de işlendiği bütünleşik bir modül olacak.

[2.1 güncel uygulama kaydı](./VIVA_ASAMA_2_1_UYGULAMA.md). Adımlar kullanıcı devam onayıyla ayrı ayrı yürütülecek.

[2.2 güncel uygulama kaydı](./VIVA_ASAMA_2_2_UYGULAMA.md). SQL kullanıcı tarafından çalıştırıldı ve başarı sonuçları kaydedildi; sonraki adım için kullanıcı devam onayı beklenecek.

[2.3 teknik teslim kaydı](./VIVA_ASAMA_2_3_UYGULAMA.md).

[2.4 uygulama kaydı](./VIVA_ASAMA_2_4_UYGULAMA.md). 2.5 başlamadı.
