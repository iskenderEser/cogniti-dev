# Eczanem dağıtımı — 30 günlük gönderim süresi

## Kullanıcı kararı

PM hedef olarak Eczanem üyesini seçer. Yayın UTT'ye düşer; UTT eczaneye servis eder; eczanedeki yetkili E-Club üyesi danışanlara iletir. Gönderim ömrü PM'den ilk gerçek çıkıştan itibaren **30 × 24 saat**tir. UTT'nin eczaneye iletimi süreyi yeniden başlatmaz. Tam bitiş anında gönderim kapalıdır. Eczane hesapları token hesabı/bakiye görmez veya seçmez.

Bu iyileştirme tamamlanana kadar rol bazlı Esnek Paket çalışmasının 4. adımı bekletildi. Token bloklama (eczane başına uygun aktif üye sayısı), tüketim ve süre sonu blok çözme bağlantıları bu geliştirmeye dahil değildir; sonra ele alınacak. Satın alma sürecinin kalan işleri bundan sonra sürdürülecek.

## Uygulama

- SQL: `scripts/sql/eczanem_yayin_gonderim_30_gun.sql`. **Kullanıcı `eczanem_yayin_gonderim_30_gun_kuruldu = true` sonucunu iletti; SQL kurulumu doğrulandı.** Bu sonuç canlı gönderim veya görsel kontrolün yapıldığı anlamına gelmez.
- `eczanem_yayin_gonderim_sureleri`: ilk çıkış anını sabit saklar. Durdurma, yeniden açma, tarih güncellemesi veya UTT iletimi yeni 30 gün oluşturmaz. Planlanan yayında süre, ilk gerçek aktivasyonda başlar.
- Eski yayınlarda ilk tur başlangıcı; bulunmuyorsa mevcut kayıtlı yayın tarihi kullanılır. Kurulum tarihi başlangıç yapılmaz. Tarihsel ilk tur ve ilk çıkış verisi yoksa geçmişteki gerçek ilk çıkış bu migration ile kanıtlanmış sayılmaz. Başlangıcı bulunmayan gönderimler güvenli biçimde reddedilir.
- UTT→eczane ve eczane→danışan tablolarında BEFORE INSERT kapısı süreyi gerçek işlem anında kontrol eder; doğrudan INSERT de kuraldan geçer. Süresi dolan danışan gönderimi eklenmez, AFTER INSERT tüketim tetikleyicisi çalışmaz. Toplu transaction hata verirse önceki eklemeler de geri alınır.
- `lib/eczanem/gonderimSuresi.ts` tek hesap/metin kaynağı; `gonderimSuresiSunucu.ts` yalnız zaten yetkilendirilmiş yayınların sabit başlangıçlarını okur.
- UTT Eczanem Yayınları ve eczane Üye Yayınları kartlarında kalan süre ve Türkiye saatine göre son gönderim tarihi görünür. Sayfa saati odaklanmada, dakikalık güncellemede ve sıradaki son gönderim anında yenilenir. Süresi dolanlar seçilemez ve Gönderime Hazır listesinden çıkar; diğer listelerde geçmiş görünümü korunur.
- Eczane danışan gönderimi sunucu katmanında ayrıca süre ön kontrolünden geçer. Esas yarış kontrolü veritabanındadır.
- Mevcut izleme/puan API'leri ve ortak izleme erişim kontrolü değiştirilmedi. Daha önce teslim edilmiş yayın kaydı silinmez. Mutabakat kuralları değiştirilmedi.

## Doğrulama

- Gerçek yerel PostgreSQL 18.6; /tmp altında, yalnız Unix socket, sahte temel tablolar. Repodaki PM09 gönderim RPC ve yeni süre SQL'i değiştirilmeden çalıştırıldı. 10 senaryo başarılı: ilk/tekrar kurulum, gerçek aktivasyon, iki RPC yolu, doğrudan INSERT, süre sonu tüketim engeli, durdur/devam, kilitte beklerken süre dolması (iki bağlantı), transaction geri alma, teslim edilmiş kayıt korunması ve sunucu yetkileri.
- Dört hedefli zaman/sunucu okuma testi; 9 toplu gönderim testi; 9 ilgili mevcut Eczanem test senaryosu başarılı.
- Gerçek React yayın kartları, sahte bağımlılıkla: iki kartta kalan metin, tam sınırda checkbox kilidi, eczane kartında token/bakiye alanı olmaması başarılı.
- TypeScript başarılı. Lint: 0 hata; mevcut `cogniti_token_eczanem_toplu_gonder` RPC'sinin şema snapshotında bulunmaması için 1 uyarı.
- Tarayıcı açılmadı; gerçek mobil geometri, canlı Supabase ve gerçek push/izleme deneyimi doğrulanmadı.
- Sonuçlar: `ECZANEM_GONDERIM_30_GUN_TEST_SONUCLARI.json`.

## PM ailesi kaynak doğrulaması — tamamlayıcı düzeltme

Önceki kurulum Eczanem hedefini kontrol ediyordu; çıkışın PM ailesinden geldiğini doğrulayan koşul eksikti. Kullanıcı güncellenmiş aynı SQL dosyasını yeniden çalıştırıp `eczanem_yayin_gonderim_30_gun_kuruldu = true` sonucunu iletti; **PM ailesi kaynak kontrolünün SQL kurulumu doğrulandı**. Bu sonuç canlı gönderim veya görsel doğrulama değildir. Önceden sabitlenmiş başlangıçlar değiştirilmez.

- Çıkış üreticisi ve o andaki rol süre kaydında saklanır. PM ailesi (`pm`, `jr_pm`, `kd_pm`) kaynaklı Eczanem yayınlarının dağıtımına izin verilir. Diğer kaynakların kaydı dağıtım hakkı vermez; sonradan PM rolüne geçmesi eski yayını PM çıkışlı yapmaz.
- Her iki gönderim tablosunun SQL kapısı çıkıştaki PM rolünü, kayıtlı üretici ile yayının üreticisinin eşleşmesini ve Eczanem hedefini birlikte doğrular. Rol/sahip değişikliği süreyi sıfırlamaz. Çıkıştaki PM sonradan rol değiştirirse eski yayının kaynak bilgisi korunur.
- Sunucuda kartlara süre aktarımı ortak `PM_AILESI_ROLLER` kaynağı ile sınırlandırılır; diğer üreticilerin yayınları gönderim için seçilemez.
- Eski süre kayıtlarında çıkış rolü geçmişte tutulmadığından ilk geçiş mevcut üretici rolünü kayda alır. Geçmiş gerçek çıkış unvanı bu kayıtlarla geriye dönük kanıtlanmış sayılmaz.
- Yerel PostgreSQL testi eski tabloyu yeni kolonlara yükseltmeyi de sınar; 12 senaryo başarılı. PM ailesinin üç rolü, Medikal reddi, Medikal→PM ve PM→Medikal değişimi, sahibi değiştirme ve süre koruma sınandı. 4 hedefli zaman/okuma testi ve 9 toplu gönderim testi geçti. Token bölümüne müdahale edilmedi.
