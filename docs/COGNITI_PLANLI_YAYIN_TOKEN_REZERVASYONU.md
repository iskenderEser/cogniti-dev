# Yayın Yönetimi ileri tarihli açılış — token rezervasyonu

## Durum — 9 Kasım 2026

Kullanıcı ileri tarihli yayına açma alanının token ayırmaya bağlanmasını istedi. Kod ve SQL hazır, hedefli yerel testler başarılı. **9 Kasım 2026: Kullanıcı `cogniti_planli_yayin_token_rezervasyonu_kuruldu = true` sonucuyla Supabase SQL kurulumunu doğruladı.** Gerçek kullanıcı/tarayıcı veya üretim cron kabulü yapılmadı.

SQL: `scripts/sql/cogniti_planli_yayin_token_rezervasyonu.sql` (298 satır).
Beklenen sonuç: `cogniti_planli_yayin_token_rezervasyonu_kuruldu = true`.
Ön koşullar: Esnek hesap altyapısı, ortak yayın anlık tüketimi ve ortak PM/Medikal Eczanem SQLleri. Bu dosya son sırada uygulanır. Yeni cron kurulmaz; mevcut `yayin_planlananlari_aktive` zinciri kullanılır.

## Bağlanan kullanıcı alanı

- Yayın Yönetimi'ndeki yayın günü seçimi, onay modalına gerçek plan tarihini taşır. Aynı modalı kullanan Agora editörü de aynı bağlantıyı kullanır. İleri tarihli yayında onay düğmesi **Planı kaydet** olur ve tarih açıkça gösterilir.
- Eczanem dışındaki UTT/BM ve E-Club planlarında hesap seçimi/önizleme plan tarihine göre yapılır. Planın Türkiye saati 07:00 açılışında geçerli yüklemeler kullanılabilir sayılır. Önizlemede **Ayrılacak token**, plan tarihinde kullanılabilir miktar ve işlem sonrası kalan gösterilir.
- Yeni SQL kurulmadan eski önizleme yanıtı plan rezervasyonuna izin vermez. `plan_rezervasyonu_acik=true` sözleşmesi ve yeterli token olmadan plan onayı açılmaz.
- Plan kaydı başarılı olduğunda hesap yenilenir. Tarih değişikliği, hemen açma ve iptal sonrası hesap özeti yeniden okunur; başarısız aktivasyon rezervasyon bırakabileceği için hata yanıtında da navbar yenileme olayı tetiklenir. Navbar mevcut toplam/kullanılan/kalan hesabına ek olarak birleşik **Blokeli / Ayrılan** miktarı gösterir.

## Veritabanı davranışı

- Yeni `cogniti_yayin_plan_tokenlari` kaydı yayın, üretici, firma, seçilmiş hesap ve hedef tarihini tutar. `cogniti_yayin_plan_token_dagilimi` miktarı son kullanımı uygun yüklemelere dağıtır. Plan kaydında yüklemenin kalan değeri azaltılmaz; ayrılan miktar kullanılabilirden çıkarılır. Plan silinse bile rezervasyon geçmişi korunur.
- Hesap kilidi altında yalnız üreticinin kendi kişisel hesabı veya kendi firmasının hesabı kullanılır. Önizleme miktarı istemciden kabul edilmez; mevcut ortak alıcı kaynağı tekrar sayılır. Yetersizlikte yayın planı ve rezervasyon birlikte geri alınır.
- Ortak `cogniti_yukleme_ayrilan` işlevi Eczanem bloklarını ve plan rezervasyonlarını birlikte hesaplar. Anlık tüketim, yeni plan ayırma ve Eczanem bloklayıcı aynı miktarı çıkarır; biri diğerine ayrılmış tokenı harcayamaz. Bakiye özeti ve önizleme de aynı kaynağı okur.
- Tarih değişikliğinde eski ayrım aynı transaction içinde bırakılır ve yeni tarihte geçerli yüklemelerden tekrar ayrılır. Yetersizse eski tarih ve eski rezervasyon aynen korunur. Tokenların yıl sonu/son kullanım sınırı plan tarihiyle aşılmaz.
- Gerçek aktivasyonda yayının kendi rezervasyonu hesap kilidi altında serbest hale getirilir, mevcut ortak açılış/tüketim mekanizması güncel alıcıları tekrar sayarak tek kez tüketir; başarı halinde plan kaydı tüketildi olur. Artan alıcı için fark aynı hesaptan kontrol edilir; azalan alıcıda fazla ayrım tüketilmez. Başka hesabın veya yayının rezervasyonuna geçilmez.
- İptalde sadece hâlâ planlı yayın silinir; ayrım serbest işaretlenir. API tarih/iptal yazımlarında `durum=planlandi` filtresi ve dönen kayıt kontrolü var; eş zamanlı aktivasyon yanlış iptal başarısı veya canlı yayının silinmesini oluşturmaz.
- Aktivasyonun iş kuralı/yetki/yetersizlik hatasında yayın, tüketim ve bildirim alt transaction'ı geri alınır; kullanılmayan rezervasyon ayrıca serbest bırakılır. Yayın planlı kalır, RPC başarısız yayın için başarı sayısını artırmaz. Kullanıcı veya mevcut cron daha sonra yeniden deneyebilir; o sırada hesap tekrar kontrol edilir. Teknik/veritabanı arızaları bu beklenen iş kuralı hata grubunun dışında hata olarak kalır; başarılı açılmış sayılmaz.
- Mevcut cron bir planın beklenen başarısızlığından sonra diğer planları işler. Sonraki tekrar açılmış yayını ikinci kez tüketmez.

## Korunan kapsam

- Geçmiş planlara migration sırasında geriye dönük rezervasyon yazılmaz. Yeni kurulum sonrasında tarih değiştirilmesi açık yeni işlem olduğundan uygun hesap seçimi olan eski planda yeniden ayırma kontrolünden geçer. Eski hesapsız planların mevcut aktivasyon yolu korunur.
- Eski yayın geçiş listesinin FK'si silinen eski planı tutarak iptali engellemesin diye yalnız geçiş işareti ON DELETE CASCADE yapılır. Token/tüketim geçmişi silinmez.
- Eczanem planları bu açılış rezervasyonuna girmez; üreticiden gerçek çıkışında 30 gün başlatan ve UTT'nin eczaneye tesliminde bloklayan ayrı ortak PM/Medikal akışı korunur. Bu değişiklik onun 30 gününü veya hedef üyelerini değiştirmez.
- BM önerileri token dışındadır. UTT'nin E-Club dağıtımı hesap seçmez/ikinci tüketim yapmaz. Sipariş ekranı ve rapor bağlantıları ayrı kalan işlerdir.

## Testler

- PostgreSQL 18.6, yalnız /tmp Unix socket, sahte temel tablolar. Gerçek ortak açılış, plan rezervasyonu, aktivasyon ve Eczanem blok ayırma SQLleri kullanıldı. Önceki 10 önizleme + 16 eski Adım 4 + 18 ortak açılış testinin sonuna yeni migration kuruldu; yeni son davranış aşağıdaki 15 senaryoda sınandı. Eski aşama sonuçları yeni plan rezervasyonu tamamlanmış gibi yorumlanmaz.
- **15 yeni PostgreSQL senaryosu başarılı:** tekrar kurulum; saha ayırma ve başka gönderimden korunma; gerçek tek tüketim; E-Club ayırma/iptal; tarih değişikliği ve rollback; alıcı artışı/azalışı; başarısız açılışta bırakma ve yeniden deneme; iptal geçmişi; firma/kişisel ayrımı; son kullanım/önizleme; Eczanem'in plan tokenını harcayamaması; iki bağımsız planın aynı son tokenlar için yarışı; zamanı gelen iki planda başarısızlık/cron devamı/tekrar; yetki kalkması; doğrudan erişim engeli.
- Plan API 4, mevcut yayın API 14 hedefli test başarılı. Gerçek React modalında seçili günün önizlemeye taşınması ve Planı kaydet onayı; hesap seçimi bileşeninde plan rezervasyon yanıtıyla hazır olma; navbar özet/yenileme regresyonu başarılı.
- TypeScript ve hedefli ESLint hatasız/uyarısız. Hedefli whitespace kontrolü temiz. Yerel PostgreSQL test sonunda durduruldu.
- Sonuç: `COGNITI_PLANLI_YAYIN_TOKEN_TEST_SONUCLARI.json`. Sahte temel tablolar bütün Supabase şemasını doğrulamaz. Gerçek kullanıcı, tarayıcı/mobil geometri ve üretim cron çalışması henüz doğrulanmadı.
- SQL kurulumu kullanıcı başarı sonucuyla doğrulandı; gerçek kullanıcı ve üretim cron kabulü henüz yapılmadı. Commit/push yapılmadı.
