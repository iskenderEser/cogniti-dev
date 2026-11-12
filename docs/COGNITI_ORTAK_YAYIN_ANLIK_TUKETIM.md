# Üretici yayın açılışında ortak anlık token tüketimi

## Durum — 9 Kasım 2026

Kullanıcı E-Club yayınlarının UTT dağıtımında değil, üreticiden çıktığı anda hedef üye sayısı kadar tüketmesini onayladı. UTT/BM saha yayınlarıyla tek tüketim mekanizması kullanılacak. Eczanem ortak PM/Medikal bloklama akışı korunacak.

Kod ve SQL hazır; yerel testler başarılı. **9 Kasım 2026: Kullanıcı `cogniti_ortak_yayin_anlik_tuketim_kuruldu = true` sonucuyla Supabase SQL kurulumunu doğruladı.** Gerçek kullanıcı/tarayıcı/gönderim kabulü yapılmadı. SQL: `scripts/sql/cogniti_ortak_yayin_anlik_tuketim.sql`. Beklenen sonuç: `cogniti_ortak_yayin_anlik_tuketim_kuruldu = true`.
Ön koşullar: Esnek Adım 1–4 altyapısı, yanlış UTT hesap seçimi geri alması, mevcut kanonik E-Club gönderim SQLleri. Ortak PM/Medikal Eczanem kurulumu aynen korunur. Bu dosya son sırada uygulanır; eski migrationlar tarihsel kayıttır.

## İş kuralı ve bağlantılar

- Üretici, Eczanem dışındaki yayını açarken Kişisel Token Hesabı veya Firma Token Hesabı seçer. Seçim yayına sabitlenir; firma/hesap sahibi istemciden alınmaz. Yetersizlikte başka hesaba geçilmez.
- UTT/BM ve E-Club alıcılarının sayımı `cogniti_yayin_token_alicilari` içindedir. Önizleme ve gerçek açılış aynı kaynağı kullanır. Saha hedefi tek UTT veya BM; E-Club tek eczacı, tek teknisyen veya ikisidir. Hedefin talepteki hedefle aynı olması SQL'de de doğrulanır.
- Saha sayımı mevcut kapsamı korur: aktif firma kullanıcıları; UTT/KD_UTT için talebin takım sınırı ve mevcut bölgeden takım çözümü, BM için mevcut firma kapsamı.
- E-Club sayımı: hedef unvana uygun, hesabı açılmış kişi; aktif kişi–eczane, eczane–firma, UTT–eczane bağları ve aktif UTT/KD_UTT firma/takım kapsamı. İkinci/yardımcı eczacı eczacı hedefine eşlenir. Bir kişinin birden fazla UTT bağı tek token sayılır. Kişi kimlik tablosunda olmayan aktif_mi kolonu varsayılmaz; aktiflik bağlardan çözülür. UTT dağıtımıyla aynı doğrudan takım kapsamı kullanılır.
- İK saha yayınlarını ortak mekanizmayla açar; E-Club hedefi hem mevcut talep/API yetkileriyle hem ortak SQL alıcı kaynağıyla reddedilir. UTT, TM, firma yöneticisi veya Firma Admini üretici yerine yayın açamaz.
- Gerçek açılış, seçilen hesap kilidi altında uygun yüklemelerden kişi başına 1 token tüketir; aktif Eczanem blokları harcanamaz. Süresi dolmuş yüklemeler kullanılamaz. Tüketim defteri alıcı türünü de saklar; E-Club kişi UUIDsi ile firma kullanıcısı ayrılır.
- Yayın, tüketim kayıtları ve açılış tamamlandı kaydı aynı transaction içindedir. Yetersizlikte bütünü geri alınır. Sıfır hedef kişi durumunda da açılış tamamlandı kaydı bulunur; sonradan UTT dağıtımında ikinci tüketim tetiklenmez. Durdur/devam et, teknik tekrar veya aynı adayın ikinci yayını çift tüketmez.
- Yeni E-Club yayını açıldıktan sonra UTT'nin üyeye dağıtımı ikinci token düşürmez. UTT token hesabı seçemez; ekrandan hesap alanı kaldırıldı, API hesap alanı taşıyan isteği reddeder. Hook yalnız mevcut kanonik dağıtım RPCsini çağırır. Eski yanlış Esnek UTT RPCsi yoktur; önizleme hesabı eclub_oneri akışına da kapalıdır.
- Üretici yayın açılışında E-Club üyelerine bildirim gönderilmez; yalnız ilgili firma UTTlerine yeni yayın bildirimi gider. Üye bildirimi mevcut gerçek UTT gönderiminde oluşur. E-Club kişi UUIDleri firma içi bildirim listesine verilmez.
- Yeni planlı yayın da hesap seçimini kaydeder; plan kaydı tüketmez. Gerçek aktivasyon aynı açılış tetikleyicisini kullanır. Aktivasyon öncesinde mevcut alıcılar ve bakiye yeniden kontrol edilir. Cron'da bir hesabın yetersizliği yayını planlı bırakır; diğer yayınları durdurmaz. **Plan token rezervasyonu bu adımda kurulmadı; sonraki rezervasyon adımı ayrı kalır.**

## E-Club üyelerine gönderimde token tüketimi — 12 Kasım 2026

- Yayın gerçekten açıldığında, o anda yayın kapsamına giren her tekil E-Club üyesi için üreticinin yayın için seçtiği hesaptan 1 token düşer. Açılıştaki alıcılar ve toplam tüketim kaydedilir.
- Yayını uygun üyelere iletmek UTT’nin sorumluluğundadır. UTT gönderiminde sistem üyenin güncel uygunluğunu kontrol eder. Gönderi üretici hesabında ek kesinti oluşturmaz.
- Açılıştan sonra kapsama eklenen uygun üyelere yapılan ek gönderileri Cogniti karşılar. Örneğin 400 üyeyle açılan yayın, sonradan katılan 20 üyeye de iletilirse 420 gönderi gerçekleşir ve üreticinin tüketimi 400 token olarak kalır.
- Açılıştan sonra üye sayısı azalırsa açılış tüketimi firmaya aittir. Otomatik iade yapılmaz. Olağan dışı azalmada Cogniti yönetimi durumu inceler ve hak kaybını gidermek için uygun çözümü belirler.

## Geçmiş ve kapsam sınırı

- İlk kurulumda mevcut yayın kimlikleri bir defa işaretlenir. Tekrar kurulum yeni yayınları geçmişe katmaz. Geçmiş yayınlardan geriye dönük açılış ücreti alınmaz; önceki gönderim/token kayıtları silinmez veya iade edilmez.
- Eski E-Club yayınlarında eski dağıtım tüketimi, eski hesapsız saha planlarında eski aktivasyon tüketimi korunur. Yeni yayınlarda UTT dağıtımı tüketmez. Bu ayrım geçmiş yayınları hiç ücret ödemeden yeni ön ödemeli saymaya dönüştürmez.
- Eczanem yayınları yeni anlık tüketim dışında kalır; PM/Medikal ortak blok/tüketim/30 gün ve geçmiş Medikal istisnası değiştirilmez. Diğer T-Club/C-Club/Viva tüketim kaynakları bu değişikliğin kapsamına eklenmedi.
- Satın alma butonu/modalı, rapor bağlantıları ve plan rezervasyonları hâlâ kalan işlerdir. Bu teslim rol bazlı satın almanın tamamlandığı anlamına gelmez.

## Doğrulama

- PostgreSQL 18.6, yalnız /tmp Unix socket, sahte temel tablolar, gerçek kurulum/gönderim SQLleri. Eski firma tüketimi gözlemci stub kullanır; bütün canlı şema veya gerçek e-posta/push teslimi doğrulanmış sayılmaz.
- **18 yeni senaryo** başarılı: iki kez kurulum, aktif/tekil hedef sayımı ve takım ayrımı, E-Club anlık kişisel tüketim, gerçek UTT dağıtımında sıfır ek tüketim, durdur/devam et, ortak hesap, İK saha/İK E-Club yasağı, sekiz E-Club üretici rolü ve kapalı roller, yetersizlik rollback, sıfır üye, plan/gerçek aktivasyon ve bildirim, doğru bildirim kimlikleri, sahte hesap/hedef/üretici ve mükerrer aday, iki bağlantıyla bakiye yarışı, Eczanem ayrımı, yanlış UTT RPC/önizleme kapısı.
- Aynı koşuda önceki 10 önizleme + 16 Adım 4 senaryosu eski migration aşamasında geçer; eski UTT hesap seçimi senaryoları yeni davranışı temsil etmez. Yeni son davranış yukarıdaki ortak testlerle doğrulanır.
- Yayın API 14; UTT dağıtım API 6; gerçek E-Club paneli 4; önizleme API/sözleşme 4 test başarılı. Ortak hesap seçimi React testleri ve Eczanem modal/kart regresyonları başarılı.
- TypeScript başarılı. Hedefli ESLint 0 hata, şema snapshotında olmayan RPCler için 3 uyarı. Hedefli diff whitespace kontrolü temiz. Yerel PostgreSQL test sonunda durduruldu.
- Sonuç: `COGNITI_ORTAK_YAYIN_ANLIK_TUKETIM_TEST_SONUCLARI.json`. SQL kurulumu kullanıcı başarı sonucuyla doğrulandı; gerçek kullanıcıyla canlı gönderim testi henüz yapılmadı. Commit/push yapılmadı.
