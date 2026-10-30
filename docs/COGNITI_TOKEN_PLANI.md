# Cogniti Token Planı

**Durum:** Plan. Bu belge geliştirme, veritabanı kurulumu veya canlıya alma işleminin tamamlandığı anlamına gelmez.

## 28 Ekim 2026 — Viva: gerçek kullanım üzerinden token tüketimi

Bu karar, aşağıdaki tarihsel Viva davet ücretlendirmesinin yerini alır. Davet oluşturmak token tüketmez. Yayın tamamlandığında Daily oturum/katılımcı süreleri alınır; yayın sahibi dahil gerçek katılımlar, çıkışlar ve tekrar girişler toplam kişi-saniyede birleştirilir. İmzalı Daily katılımcı ayrılış olayları, API'de görünmeyen kısa katılımları tamamlar. Eksik veya devam eden oturum kesinleştirilmez; işlem yeniden denenir.

- **Formül:** `toplam kişi-dakika × 0,004 USD × 55 TL × 1,5 ÷ güncel KKÖ token birim fiyatı`. KKÖ fiyatı fiyatlar sayfasıyla ortak kaynaktır (`lib/token/fiyatlandirma.ts`); bugün 9,90 TL. Fiyatlar mutabakat başlangıcında sabitlenir. Ücretsiz Daily kotası veya hacim indirimi bu satış hesabından düşülmez.
- **Yuvarlama:** Her Viva yayını için yalnız toplam sonuç tam tokena yuvarlanır; 0,5 ve üzeri yukarı, altı aşağı. Sonuç sıfır olabilir. Güncel fiyatla 100 kişinin 60 dakika katılımı 200 token eder.
- **KKÖ:** Yeni yayın başlarken bakiye sıfırsa başlangıç engellenir. Başlamış yayının gerçek tüketimi mevcut bakiyeyi aşabilir. Örneğin 1.470 tüketilmişken 35 tokenlık Viva, o ayın toplam tüketimini 1.505 yapar; kalan 30 düşer, 5 o ayın paket aşımıdır. Bu 5 token sonraki ayın 1.500 hakkından düşülmez. Firma hesabı açık kalır. Ay kapandıktan sonra gelen mutabakat eski ayın kullanılmamış hakkını ve aşımını düzeltir; yeni ayın hakkına dokunmaz.
- **Aylık paket:** Mevcut tüketim, negatif bakiye ve sonraki yüklemeden mahsup davranışı sürer.
- **Geçiş:** Davet tüketim tetikleyicileri kaldırılır; eski ücret kayıtları korunur. Geçmişte davet ücreti alınmış etkinlik ikinci kez ücretlendirilmez. Yeni etkinlikler ile henüz başlamamış ve davet ücreti alınmamış plan/taslaklar yeni modele girer.
- **İşleyici:** Mevcut Viva cron'u kalıcı mutabakat kuyruğunu işler. Yayın kapanışından en az 45 saniye sonra, en az 30 saniye arayla aynı kullanım verisi iki kez görülünce tüketim tek kayıt olarak yazılır. Bu yüzden anlık/20 saniyelik sonuç taahhüdü yoktur; sağlayıcı gecikmesi ve kuyruk sonuç süresini uzatabilir. Yeniden deneme ve eş zamanlı çağrı ikinci tüketim üretmez. Token raporları kayıt sayısını değil tüketim miktarını toplar.
- **Doğrulama ve kurulum:** Kod ve SQL hazırlandı. 49 uygulama testi, 14 yerel PostgreSQL senaryosu (rol kapsamı, iki bağlantıyla yarış, KKÖ/aylık, ay geçişi, yuvarlama, eski ücretleri koruma) ve 14 gün sonu rapor testi geçti. TypeScript kontrolü geçti; kapsamlı lint kontrolünde hata yok. Canlı Daily yayınıyla doğrulanmadı. `scripts/sql/cogniti_token_viva_kullanim_kurulum.sql` kullanıcı tarafından çalıştırılacak; canlı veritabanına uygulanmış kabul edilmez. Ayrıntılı geçiş notu: `docs/VIVA_TOKEN_KULLANIM_GECISI.md`.

## 28 Ekim 2026 — KKÖ kural değişikliği

KKÖ her Türkiye takvim ayının 1’inde 1.500 token ile yenilenecek; önceki aydan kalan token sıfırlanacak ve yükleme hakkı 1.500’ü geçmeyecek. Başlamış Viva yayınının sonradan belirlenen tüketimi için yukarıdaki cari ay aşımı istisnası geçerlidir. GM onayı ve ay içinde ek yükleme kaldırılacak. Bakiye bittiğinde yeni aya kadar gönderim duracak; firma hesabı kapatılmayacak. Kullanıcı beş SQL testinin başarılı olduğunu ve aylık işleyici ile cron kurulum sonuçlarının true olduğunu doğruladı. Gerçek ay geçişi henüz doğrulanmadı. Eski davranış aşağıdaki tarihsel kayıtlarda gösterilmektedir.

## İlk uygulamanın tarihsel kuralları

KKÖ ve Viva için yukarıdaki 28 Ekim kararları geçerlidir; aşağıdaki eski kurallar değişiklik öncesi durumu belgeler.

- Token tüketimi gönderici üzerinden, gönderim yapıldığı anda hesaplanır; alıcının içeriği açması, görmesi veya okuması beklenmez. Gönderilen her alıcı için 1 token, ilgili firmanın bakiyesinden düşer.

- Her kullanıcıya yapılan her gönderi 1 token tüketir. Viva davetleri ve Cogniti hesabı olmayan özel davetliler de token tüketir.
- Eczanem yayınını firmanın UTT’ye, UTT’nin de eczaneye göndermesi token tüketmez. Eczanenin müşterilerine başarılı gönderiminde müşteri başına 1 token, yayının sahibi firmanın bakiyesinden düşer.
- Planlı gönderide token, plan hazırlanırken değil, gönderim gerçekleştiğinde düşer. Gönderinin Cogniti hesabına ulaşması yeterlidir; e-posta veya push teslimi beklenmez.
- UTT veya BM hedefli bir yayının açılması, hedef kullanıcılarına toplu gönderimdir; yayın kullanıcıların ekranına ulaştığında her kullanıcı için 1 token düşer. İleri tarihli yayında bu tüketim plan kaydında değil, yayın gerçekten açıldığında kaydedilir. Eczanem için yukarıdaki istisna geçerlidir.
- Başarılı gönderimden sonra yayın iptal edilir veya durdurulursa token iade edilmez. Viva daveti sistemde oluşturulduğunda e-posta teslimi beklenmeden token düşer.
- Viva'da `etkinlik_id` esas alınır: aynı etkinlikte aynı kişi için bir kez token düşer. Çıkıp tekrar girme veya aynı etkinliğe yeniden davet ikinci tokenı tüketmez; farklı etkinlik yeni tüketimdir. Daily oda kimliği ayrı değerlendirilir.
- Herkes firma toplam bakiyesini ve kendi tüketim kayıtlarını görür. Firma yöneticileri firmanın tüm kayıtlarını; TM kendi takımının, BM kendi bölgesinin kayıtlarını görür.
- Aylık paketlerde yetersiz bakiye gönderimi durdurmaz; bakiye eksiye düşer. Aşan tüketim “Paket aşımı” olarak gösterilir. Negatif bakiye sonraki yüklemeden düşülür.
- Aylık yüklemeler ay/yıl bazında ayrılır; yükleme ayı ve takip eden ay kullanılabilir. Önce eski tokenlar tüketilir; iki aylık süresi dolan kullanılmamış tokenlar kullanım bakiyesinden çıkarılır.
- Kullandığın Kadar Öde (KKÖ) başlangıcında 1.500 süresiz token yüklenir. Bakiye 100'e ulaştığında veya altına indiğinde GM'den devam onayı istenir; admin firma talebiyle yetkiyi başka bir kişiye aktarabilir. Onayla 1.500 token daha yüklenir; sonraki 100 token eşiğinde tekrar onay istenir.
- KKÖ'de onay verilmezse kalan tokenlar kullanılabilir; bakiye bittiğinde firma hesabı pasife alınır. Toplu gönderimde bakiye yetersizse uyarı gösterilir ve gönderim durdurulur. Pasif hesabın açılması için firma başvurur.

## 1. Mevcut gönderim ve davet akışlarının incelenmesi

1. Token tüketebilecek kullanıcıya gönderim işlemlerini kod ve veritabanı katmanında belirle.
2. T-Club önerileri, C-Club challenge'ları, E-Club gönderimleri, Eczanem dağıtımları ve Viva davetlerinin gerçekleşme noktalarını ayrı ayrı çıkar.
3. Gönderici, alıcı, firma ve ilgili yayın veya etkinlik kimliğinin kaynaklarını doğrula.
4. Planlama kaydı ile gerçekleşmiş gönderimi; başarısız, iptal edilmiş ve tekrar denenmiş işlemleri ayır.
5. Token tüketimi uygulanacak işlemlerin envanterini kullanıcıyla gözden geçir ve kesinleştir.

### 1. adım — Kod incelemesi: gönderim envanteri

Bu bölüm başlangıçtaki kod incelemesidir; sonraki adımlardaki uygulama ve kullanıcı tarafından doğrulanan kurulum sonuçları aşağıda ayrıca belirtilmiştir.

| İşlem | Gönderimin kayıt noktası | Gönderen / alıcı / kaynak | Token kararı |
|---|---|---|---|
| UTT veya BM hedefli yayının açılması | Anlık: `app/(panel)/yayin-yonetimi/api/yayinlar/route.ts`; ileri tarihli: `scripts/sql/yayin_aktivasyon.sql` | Üretici ve `yayin_id`; hedef roller, firma ve takım yayın bağlamından | Gerçek açılışta hedeflenen gönderim başına 1; plan kaydında düşmez. Eczanem istisnası ayrı. |
| T-Club önerisi | `app/(panel)/oneriler/api/route.ts`: `oneri_kayitlari` | `oneren_id`, `kullanici_id`, `yayin_id`; gönderenin firma kaydı | Başarıyla oluşturulan her öneri gönderimi için 1. |
| C-Club challenge | `lib/cclub/kayit.ts`: `cc_challenge_gonder` RPC ve `challenge_kayitlari` | `gonderen_id`, `alan_id`, `yayin_id`; gönderen firma kaydı | Oluşturulan her challenge için 1; atlanan veya başarısız işlem için tüketim yok. |
| E-Club anlık ve planlı öneri | `scripts/sql/eclub_gonderim_rpc_yeni_kurgu.sql`: `eclub_yayin_gonder` ve `eclub_oneri_kayitlari`; plan işleyicisi `scripts/sql/eclub_planlanan_gonderim_isleyici.sql` | UTT, `kisi_id`, `yayin_id`; gönderici ve yayın firma kapsamı | Anlık gönderimde veya planın gerçekleştiği anda başarılı kişi–yayın gönderimi başına 1; önizleme ve plan kaydında düşmez. |
| Eczanem firma → UTT → eczane | Yayın yönetimi ve `eczanem_utt_eczaneye_gonder` | Yayın, UTT ve eczane kimliği | Bu aşamalarda token düşmez. |
| Eczanem eczane → müşteri | `lib/eczanem/gonderim.ts`: `eczanem_musterilere_video_gonder`; `eczanem_gonderimler` | Eczane personeli, `musteri_id`, `yayin_id`; yayının sahibi firma | Başarıyla kaydedilen her müşteri gönderimi için yayının sahibi firmadan 1; atlananlara düşmez. |
| Viva iç kullanıcı, E-Club üyesi ve özel davetli | `lib/viva/sunucu.ts`, `viva_islem`, `viva_eposta_kaydet`, `viva_katilimcilar`, `viva_davetler` | Etkinlik sahibi ve firma; `etkinlik_id`, iç kullanıcı veya E-Club kişi kimliği; özel davetlide e-posta | Davet başına 1; aynı etkinlikte aynı kişiye ikinci kez düşmez. Taslak kayıtları ile fiili davet ayrılmalıdır. |

- Gönderimlerin ve tüketimin aynı işlem içinde güvenilir kaydedilmesi, tekrar denemede mükerrer tüketimin önlenmesi 2. ve ilgili entegrasyon adımlarında tasarlanacak.
- Viva katılımcı satırları düzenlemede yeniden oluşturulabildiği için tüketim geçmişi bunların varlığına bağlı olmamalı. Özel davetlerde kişi eşleştirmesi ayrıca incelenecek.
- Anlık yayın ve ileri tarihli aktivasyonun alıcı seçme yolları farklıdır. Token sayımı bildirim başarısına veya alıcının içeriği açmasına bağlanmadan gönderici işlemi üzerinden ortak kuralla yapılmalıdır.
- Aynı fonksiyonun farklı SQL dosyalarında tanımları bulunuyor; uygulamadan önce kurulu sürüm ve kurulum sırası doğrulanmalı.

## 2. Token veri modeli ve bakiye yönetimi

1. Firma bazında paket, bakiye, yükleme ve tüketimleri saklayacak veri modelini hazırla.
2. Yüklemeleri ay/yıl, miktar, kalan miktar ve geçerlilik süresiyle ayrı kaydet; KKÖ yüklemelerini süresiz tanımla.
3. Tüketimde firma, gönderen, alıcı, işlem türü, tarih ve yayın veya etkinlik kimliğini sakla.
4. Pozitif ve negatif bakiyeyi doğru hesapla; yeni yüklemede negatif bakiyeyi düş.
5. Eş zamanlı işlemlerde aynı tokenın iki kez harcanmasını önle.
6. Token hesaplarını diğer erişim tokenlarından ayrı tut.

### 2. adım — Uygulama ve test durumu

- Kullanıcının çalıştırdığı SQL ile hesap, yükleme, tüketim ve dağılım tabloları; yükleme, tekil tüketim ve bakiye işlevleri kuruldu. Kullanıcının ilettiği sorgu sonuçları, tablo okuma ve işlev çalıştırma yetkilerinin yalnız sunucu rolünde olduğunu gösterdi.
- Geri alınan veritabanı testlerinde eski yüklemenin önceliği, süresi dolanın kullanılamaması, aylık aşım ve mahsup, KKÖ bakiyesi, aynı Viva etkinliği ve kişi tekilliği, işlem tekrarları ve bakiye gösterimi başarılı oldu.
- Süresi dolmuş bir aylık yüklemenin borcu kapatmasını önleyen düzeltme kuruldu; geçersiz yüklemenin reddi ve geçerli yüklemenin mahsubu testleri başarılı oldu.
- Toplu token tüketim işlevi kuruldu; KKÖ yetersiz bakiye durumunda işlemin tamamının geri alınması, yeterli bakiye, teknik tekrar ve sunucu yetkileri kullanıcı tarafından çalıştırılan testte başarılı oldu. Gönderim bağlantılarının güncel durumu aşağıda açıklanmıştır.
- İki bağımsız bağlantıyla eş zamanlı tüketim/yükleme henüz test edilmedi. KKÖ uyarısı ve pasifleştirmenin sonraki adımlardaki durumu aşağıdadır. Admin ekranı ve gönderim bağlantılarının durumu aşağıda ayrıca kayıtlıdır.

## 3. Admin token ve yetki yönetimi

1. Adminin firma paketi seçmesini ve token yüklemesini sağla; aylık paket miktarlarını tanımla.
2. KKÖ için ilk 1.500 tokenı yükle.
3. İtiraz veya düzeltmede adminin token yükleyebilmesini sağla; işlem, miktar, zaman ve açıklamayı kaydet.
4. KKÖ devam onayı yetkisini varsayılan olarak GM'ye ver; adminin firma talebiyle başka kullanıcıya aktarabilmesini sağla.
5. Adminin firma bakiyesini, yükleme geçmişini, tüketimi ve paket aşımını görebileceği alanı hazırla.

## 4. Gönderimlerde token tüketimi

1. Gerçekleşen gönderimde alıcı başına 1 token tüket; toplu gönderimde başarılı alıcıları esas al.
2. Gönderi Cogniti hesabına ulaştığında tüketimi kaydet; e-posta/push teslimini bekleme.
3. Planlı gönderimlerde tokenı yalnız gerçekleşme anında düş.
4. Viva'nın özel kuralı dışında, aynı yayının aynı kişiye tekrar gönderimini yeni gönderim olarak değerlendir.
5. Başarılı gönderim ile token tüketiminin birlikte ve güvenilir kaydını sağla; teknik tekrarların mükerrer tüketim yaratmasını önle.
6. Başarılı gönderiden sonra iptal veya durdurmada token iade etme.

### 27 Ekim 2026 — Gerçek gönderim doğrulamaları ve Eczanem hazırlığı

- Admin firma Token sekmesi eklendi. Kullanıcı Hepifarma KKÖ hesabını açtı; 1.500 başlangıç tokenı ve GM onay yetkilisi ekranda doğrulandı. Admin tasarımı sonraya bırakıldı.
- E-Club SQL'i kullanıcı tarafından kuruldu. Sekiz geçici kayıt testi başarılı; UTT → E-Club üyesi gerçek gönderiminde Hepifarma bakiyesi 1.500 → 1.499 düştü.
- BM → UTT SQL'i kuruldu. Altı geçici kayıt testi başarılı; gerçek öneride bakiye 1.499 → 1.498 düştü. Öneri API'si toplu gönderiyi tek INSERT ile yazar.
- C-Club challenge/token tetikleyicisi, mevcut `cc_challenge_gonder` işlevini çağıran atomik toplu RPC ve API bağlantısı hazırlandı. Token hatası tüm toplu işlemi geri alır; normal alıcı/tur/kota reddi mevcut atlama davranışıyla döner. Bildirimler yalnız RPC başarısından sonra oluşturulur.
- C-Club için 6 yeni uygulama testi ve 16 ilgili regresyon testi başarılı; TypeScript kontrolü geçti. Lint hata vermedi; eski kullanılmayan import ve henüz şema envanterinde bulunmayan yeni RPC için iki uyarı var.
- `cogniti_token_cclub_test.sql` yalnız geçici tablolarda yeni tetikleyici/toplu işlev ve kurulu token işlevlerini sınar. Mevcut challenge yazıcısı bu testte sahte puan/challenge yazıcısıyla temsil edilir; gerçek C-Club uçtan uca testi değildir. Sekiz senaryonun kullanıcı sonuçları henüz paylaşılmadı. Kullanıcı kurulum çıktısında iki işlevin kurulduğunu doğruladı; gerçek challenge gönderiminde Hepifarma bakiyesi 1.498 → 1.497 düştü.
- Eczanem müşteri gönderimi için yalnız `eczanem_gonderimler` INSERT sonrasında çalışan token tetikleyicisi hazırlandı. Firma `v_yayin_detay.firma_id` üzerinden yayının sahibidir; gönderen eczane personeli, alıcı müşteridir. Firma → UTT → eczane aktarımında bu tüketim oluşmaz.
- Eczanem çoklu yayın/müşteri seçimi tek RPC/transaction ile mevcut müşteri gönderim işlevine bağlandı. Tekrarlanan/pasif müşteriler için yeni tüketim oluşmaz; yetersiz KKÖ bakiyesi bütün yayınları ve yüzlü müşteri parçalarını geri alır. Tek istekte teknik sınır 10.000 yayın-müşteri çiftidir. Push yalnız işlem başarılı olduktan sonra gerçek gönderim hedeflerine gider.
- Eczanem için 8 yeni uygulama testi ve 12 ilgili regresyon testi başarılı; TypeScript kontrolü geçti. Lint hata vermedi; yeni RPC şema envanterine henüz eklenmediğinden bir uyarı var. Ayrıca çalıştırılan E-Club geçiş regresyonunda, bu değişiklikten önce HEAD'de de bulunan `/eclub/panel` beklentisinin güncel `/eclub/ana-sayfa` yönlendirmesiyle uyuşmaması nedeniyle bir test başarısız; giriş kodu bu kapsamda değiştirilmedi.
- `cogniti_token_eczanem_test.sql` kurulu müşteri gönderim/token işlevlerini geçici tablolara yönlendiren 11 geri alınan senaryo içerir. Personel yetkisi sahte test kaydıyla temsil edilir. Kullanıcı kurulum çıktısında iki bağlantıyı `true` olarak doğruladı. 10 müşteriye gerçek toplu gönderimde Hepifarma bakiyesi 1.497 → 1.487 düştü; ekranda 10 `eczanem_musteri` tüketimi görüldü. SQL testinin 11 senaryosunun sonucu ayrıca paylaşılmadı.
- Yayına alma için `cogniti_token_yayin_kurulum.sql` hazırlandı: ilk `yayinda` INSERT'i veya `planlandi → yayinda` geçişi hedef kişi başına tüketir. Plan kaydı/tarih değişikliği/durdurup devam etme tüketmez; geçmiş yayınlara geriye dönük işlem yapılmaz. Firma gönderen üreticiden doğrulanır; UTT/KD UTT hedefinde takım veya takımsız firma geneli, BM hedefinde mevcut C-Club firma kapsamı kullanılır. E-Club ve Eczanem sonraki gerçek kişi gönderiminde zaten ayrı tüketilir.
- Anlık ve planlı açılış bildirimleri kayıtlı tüketim alıcılarını kullanır; bildirim başarısı token hesabının kaynağı değildir. Plan işleyicisinde KKÖ bakiyesi/hesabı uygun olmayan yayın planlandı kalır ve başka firmanın aktivasyonunu engellemez. Açık `hemen_yayinla` isteğinde hata kullanıcıya döner. Mevcut cron takvimi değiştirilmedi.
- Yayına alma API'sinde 7 yeni test ve 7 ilgili regresyon testi başarılı; TypeScript geçti. Lint hata vermedi; yeni alıcı RPC'si henüz şema envanterinde olmadığı için bir uyarı var. `cogniti_token_yayin_test.sql` 16 geçici veri/ROLLBACK senaryosu içerir; test, yeni aktivasyon işlevinin aynı kaynak kopyasını ve kurulu token işlevlerinin kopyalarını kullanır. Yayın–talep zinciri test görünümüyle temsil edilir. SQL testinin 16 senaryosunun sonuçları ayrıca paylaşılmadı. Kullanıcı kurulum çıktısını ve gerçek anlık yayın tüketimini doğruladı; planlı yayının gerçek açılışı bekliyor.
- Eş zamanlılık testi kullanıcı kararıyla geçildi. Test şeması kullanıcı tarafından temizlendi; eş zamanlılığın doğrulandığı kabul edilmez.

### Yayına alma — kullanıcı doğrulaması

- Kullanıcı UTT hedefli gerçek anlık yayında Hepifarma bakiyesinin 1.487 → 1.481 düştüğünü ve altı tüketim kaydı oluştuğunu gösterdi.
- İleri tarihli yayın planlandığında bakiye 1.481 olarak kaldı. Gerçek planlı açılışın tüketimi ertesi güne bırakıldı; henüz doğrulanmadı.

## 5. Viva davetlerinde token tüketimi — eski model

Bu bölüm tarihsel uygulama kaydıdır. Güncel kural: yukarıdaki 28 Ekim gerçek kullanım modeli.

1. Cogniti kullanıcıları ve özel davetliler için kişi başına 1 token tüket.
2. `etkinlik_id` ve kişi esas alınarak aynı etkinlikte aynı kişiden yalnız bir kez token düş.
3. Tekrar katılım veya aynı etkinliğe yeniden davette tekrar düşme; farklı etkinliği yeni tüketim say.
4. Davet sistemde oluşturulunca tokenı düş; e-posta teslimini bekleme.
5. Özel davetlinin tekrar davette güvenilir kimlik eşlemesini mevcut davet yapısına göre tasarla.
6. Daily oda kimliği veya nesli değişiminin ikinci tüketim yaratmadığını doğrula.

### Viva — hazırlık durumu

- `cogniti_token_viva_kurulum.sql` hazırlandı. İç kullanıcı, E-Club ve özel e-posta davetleri işlem tamamlandığında etkinlik ve kişi bazında tüketilir; taslak tüketmez. Aynı etkinlikte tekrar davet, listeyi yeniden yazma ve Daily oda/oturum değişimi ek tüketim oluşturmaz.
- Kişi ve e-posta eşleşmeleri tüketim geçmişine bağlanır. Aynı e-postayı kullanan farklı kayıtlı kişiler ayrı tüketilir; bir özel adres birden fazla kayıtlı kişiye eşleşirse işlem anlaşılır hata ile durur. Aynı Auth hesabına bağlı iç ve E-Club kimlikleri bir kişi olarak eşleşir.
- KKÖ yetersizliğinde tüm davet işlemi ve tüketim geri alınacak şekilde hazırlandı. Uygulama hata yanıtlarında 5 yeni test ile 48 ilgili test başarılı; TypeScript geçti. `cogniti_token_viva_test.sql` 18 geçici veri ve ROLLBACK senaryosu içerir; Viva yetki ve ayrıntı yardımcıları sahte kayıtlarla temsil edilir. Kullanıcı 18 SQL testinin tamamını başarılı olarak iletti ve `viva_token_baglantilari_kuruldu=true` sonucunu doğruladı. Gerçek UTT → 9 E-Club üyesi Viva davetinde Hepifarma bakiyesi 1.481 → 1.472 düştü. Gerçek tekrar davet testi kullanıcı kararıyla geçildi; SQL tekrar davet senaryoları başarılı.

## 6. Aylık paketler, token süreleri ve paket aşımı

1. Aylık yüklemeleri ay/yıl ile kaydet; yükleme ayı ve takip eden ay kullanılabilir tut.
2. Süresi önce dolacak eski tokenları önce tüket.
3. İkinci ay sonunda kullanılmamış kısmı kullanım bakiyesinden çıkar; tarihçeyi koru.
4. Yetersiz bakiye hâlinde gönderimi sürdür ve bakiyeyi negatife düşür.
5. Aşan tüketimi “Paket aşımı” olarak işaretle; negatif bakiyeyi sonraki yüklemeden düş.
6. Ay sonu, yıl geçişi ve Türkiye saati sınırlarını doğrula.

### 6. adım — hazırlık durumu

- `cogniti_token_aylik_kurulum.sql` hazırlandı. Cari Türkiye ayı için paket bir kez yüklenir; adminin ilk ay yüklemesi farklı işlem anahtarıyla yapılmış olsa da tekrarlanmaz. Firma/dönem bazlı kısmi tekil indeks bu kuralı korur; mevcut yinelenen dönem kayıtları varsa kurulum onları değiştirmeden durur.
- Paket tutarı hesaptaki 10.000/30.000/75.000 seçeneğinden gelir. Yalnız aktif firma ve aylık hesaplar işlenir; KKÖ süresiz yüklemeleri korunur. Mevcut aşım borcu yeni yüklemeden mahsup edilir. İşleyici yalnız cari ayı sağlar; geçmiş aylar için geriye dönük yeni paket açmaz.
- Tüketim işlevine, gerçek tüketim öncesinde cari ayın paketini sağlayan çağrı eklenir. Böylece cron henüz çalışmadığında ilk gönderim gereksiz paket aşımına yazılmaz. Mevcut tüketim işlevi beklenen bağlantı noktası doğrulanarak güncellenir; nokta değişmişse kurulum geri alınır.
- `cogniti_token_aylik_cron.sql` ayrı hazırlanmıştır; her saat başında işleyiciyi çağırır. Mevcut işin aktif/pasif tercihi korunur; yeni iş aktif kurulur. Türkiye dönemi işleyicide hesaplanır.
- `cogniti_token_aylik_test.sql` 13 geri alınan senaryo içerir. Kurulu yükleme/tüketim/bakiye işlevleri geçici tablolara kopyalanır; yalnız test kopyalarında saat, Türkiye takvimi ve yıl sınırlarını sınamak için geçici saate yönlendirilir. Yeni iki işlev ve tüketim bağlantısı test/kurulum dosyalarında aynı kaynaktır. Kullanıcı 13 testin tamamının başarılı olduğunu ve kurulum ile cron sonuçlarının tümünün true olduğunu doğruladı.

## 7. Kullandığın Kadar Öde ve GM onayı

1. Başlangıçta 1.500 süresiz token yükle.
2. Bakiye 100'e ulaştığında veya toplu işlemle altına indiğinde yetkiliye onay uyarısı göster.
3. Varsayılan yetkili GM'yi veya adminin belirlediği yetki sahibini kullan.
4. Onayla 1.500 token yükle; her yeni 100 token eşiğinde yeniden onay iste.
5. Eş zamanlı onay ve tekrar tıklamada mükerrer yükleme yapılmasını engelle.
6. Onay verilmezse mevcut tokenların kullanılmasına izin ver.
7. Yetersiz bakiyeli toplu gönderimde uyarı göster ve gönderimin tamamını durdur; negatif bakiye oluşturma.

### 7. adım — hazırlık durumu

- KKÖ devam onayı için SQL, panel API ve onay penceresi hazırlandı. Yetki, bakiye ve onay dönemi sunucuda doğrulanır; aynı onay tekrarı ikinci yükleme yapmaz.
- `cogniti_token_kko_test.sql` geçici tablolar ve ROLLBACK kullanır. Kullanıcı 8 testin tamamının başarılı olduğunu ve kurulum sonuçlarının true olduğunu doğruladı. Gerçek ekranda 100 token uyarısı henüz test edilmedi. Firma hesabını pasife alma 9. adımdadır.

## 8. Rol bazlı tüketim ve bakiye görünürlüğü

1. Firmanın toplam kalan bakiyesini firmadaki herkese göster.
2. Herkese kendi tüketim kayıtlarını; firma yöneticilerine firma genelini, TM'ye takımını, BM'ye bölgesini göster.
3. Firma ve rol kapsamını sunucuda doğrula.
4. Gönderici, alıcı, işlem, tarih, miktar ve varsa paket aşımı durumunu göster.
5. Yükleme, kalan miktar ve süresi dolan tokenları uygun yetki kapsamında sun.
6. Arama, filtreleme ve sayfalamayı mevcut tasarım sistemiyle değerlendir.

### 8. adım — hazırlık durumu

- Onaylanan taslağa göre firma çalışanları için Token Kullanımı ekranı ve sunucuda rol sınırlarını belirleyen rapor hazırlandı. Eczacılara ve eczane çalışanlarına token görünümü verilmez. Yönetici firma, TM takım, BM bölge ve diğer çalışanlar kendi tüketimlerini görür.
- Eczanem hareketleri mevcut aktif firma-eczane bağındaki bağlayan UTT üzerinden TM/BM kapsamına alınır. Geçmiş hareketlerde işlem anı organizasyon bilgisi kaydedilmediğinden, bağ veya organizasyon değişirse geçmiş görünüm de değişebilir; tarihi kapsam henüz oluşturulmamıştır.
- API yetki testleri ve TypeScript kontrolü başarılıdır. `cogniti_token_gorunurluk_test.sql` geçici verilerle hazırlanmıştır; Kullanıcı 8 SQL testinin başarılı olduğunu ve token raporu kurulum sonucunun true olduğunu iletti; ekranın gerçek kullanıcılarla kontrolü henüz yapılmadı.

## 9. Firma hesabının pasife alınması ve yeniden açılması

1. KKÖ'de onay verilmemiş ve bakiye bitmişse firma hesabını otomatik pasife al.
2. Pasife alma nedenini ve zamanını kaydet; pasif firmada erişim ve gönderim davranışını doğrula.
3. Firma başvurduğunda adminin hesabı yeniden açabileceği işlemi ve gerekli token yüklemesini hazırla.
4. Pasife alma ve yeniden açmada tüketim geçmişini koru.

### 9. adım — hazırlık durumu

- KKÖ bakiyesi son tüketimle sıfıra indiğinde firma pasif olur; neden ve zaman ile durum geçmişi kaydedilir. Hatalı işlemde tüketim ve pasife alma birlikte geri alınır. Aylık hesaplara uygulanmaz.
- Token nedeniyle pasif firma için admin önce token yükler, sonra mevcut firma anahtarını açar. Sıfır bakiyede yeniden açılma veritabanında engellenir. Açık firma oturumlarının sonraki isteklerinde erişim kontrolü hazırlanmıştır.
- Kullanıcı yedi SQL testinin başarılı olduğunu ve iki kurulum sonucunun true olduğunu doğruladı. TypeScript kontrolü başarılı. Gerçek açık oturum, sıfır bakiye ve adminin yeniden açma akışı henüz uçtan uca doğrulanmadı.

## 10. Test ve devreye alma

1. Tekli, toplu, tekrar ve planlı gönderim hesaplarını test et.
2. Viva aynı kişi/aynı etkinlik, farklı etkinlik, yeniden davet ve özel davetli senaryolarını test et.
3. Aylık paketlerde eski token önceliği, iki aylık süre, aşım ve negatif bakiye mahsubunu test et.
4. KKÖ 100 token uyarısı, GM onayı, 1.500 token yüklemesi, bakiye engeli ve pasife almayı test et.
5. Admin, firma yöneticisi, TM, BM ve diğer kullanıcıların yetkili kapsamlarını doğrula.
6. Eş zamanlı gönderim ve çift onayda mükerrer tüketim veya yükleme oluşmadığını test et.
7. Önce izole ortamda sahte verilerle çalış; canlı firma bakiyelerini test için değiştirme.
8. Kurulum ve geçiş sırasını hazırla; gerekli SQL'in uygulanmasını ve sonucunu ayrıca doğrula.
9. Uygulanan kuralları ve doğrulama sonuçlarını Bluebook'a işle.


### 28 Ekim 2026 — cron hedefi, commit öncesi durum

Kullanıcı `cogniti_viva_yasam` görevinin aktif=false olduğunu doğruladı ve sonra aynı görevi active=true yaptı. Dakikalık iki çalıştırma succeeded döndü. İlk HTTP kontrolü eski `hapbilgi.vercel.app` hedefinde 401 ve uygulamanın Yetkisiz erişim yanıtını verdi. Kullanıcının doğruladığı yeni adres doğrultusunda Vault'taki `hapbilgi_cron_base_url` değeri kullanıcı tarafından `https://cogniti-dev.vercel.app` yapıldı. Anahtar adı/değeri değiştirilmedi. Yeni hedefteki 126925 numaralı HTTP kontrolü 200, zaman aşımı yok ve 15 iş/0 hata döndürdü. Bu yanıtta tuketim alanı yoktu; güncel tüketim kodu henüz push/deployment edilmemişti. Otomatik gerçek tüketimin üretim doğrulaması deployment sonrasına kalır. Teknik Hapbilgi adlarının toplu dönüşümü ayrı task kapsamıdır.

Commit öncesi kontrol: `npm run typecheck:build` ve `git diff --check` başarılı. Dokuz hedefli test dosyasında 139 testin 138'i başarılı, biri başarısız: `tests/vivaArayuz.hedef.test.ts` içindeki takvim düğmeleri beklentisi. Bu test gövdesi baz commit'te de aynı; ilgili `VivaDetayIcerigi` bileşeni pakette değiştirilmemiş ve takvim prop'unu göstermiyor. Bu commit hazırlığında ürün davranışı veya test beklentisi değiştirilmedi. Daha önceki tüketim doğrulamasında 17 yerel PostgreSQL senaryosu ve 8 tüketim uygulama testi başarılıydı. Tam production build ve deployment sonrası otomatik kontör kabulü yapılmış sayılmaz.


### TB-VIVA-01 — otomatik kontör tüketimi canlı kabulü (28 Ekim 2026)

Durum: **BEKLİYOR — teknik borç**. Kullanıcı deployment'ı tamamladı; 126983 numaralı kontrol isteği HTTP 200, zaman aşımı yok ve güncel `tuketim` bölümüyle sıfır hata döndürdü. Çağrıda iş yoktu. Kalan iş: yeni gerçek yayın bittikten sonra manuel tetikleme olmadan üretim cron'unun kapanış ve tüketimi tamamlaması, pozitif tutarda doğru bakiyeden tek tüketim düşmesi ve sonraki çağrılarda tekrar düşmemesinin kanıtlanması. Yerel hedefli çalıştırmalar veya işsiz endpoint kontrolü bu kabulü tamamlamaz. Kullanıcı bu kontrolün teknik borç olarak tutulmasını istedi; test başlatılmadı. Ayrıntı ve kapanma koşulları: `docs/VIVA_TOKEN_KULLANIM_GECISI.md`, TB-VIVA-01.
