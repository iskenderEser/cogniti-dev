# Esnek token hesabı — Adım 4 anlık gönderim bağlantıları

## Durum — 9 Kasım 2026

Kod ve kullanıcı tarafından çalıştırılacak SQL hazır. Yerel testler başarılı. **9 Kasım 2026: Kullanıcı `cogniti_esnek_gonderim_adim4_kuruldu = true` sonucunu iletti; Supabase SQL kurulumu doğrulandı. Bu sonuç gerçek gönderim testi değildir.** Tarayıcı açılmadı, gerçek kullanıcı gönderimi yapılmadı.

SQL: `scripts/sql/cogniti_esnek_gonderim_adim4.sql`.
Beklenen sonuç: `cogniti_esnek_gonderim_adim4_kuruldu = true`.
Ön koşullar: Esnek Adım 1–3, PM Eczanem token bloklama, mevcut yayın açılışı/E-Club token tetikleyicileri ve kanonik E-Club toplu gönderim SQLleri. Migration mevcut tetikleyicilerin etkin olduğunu kontrol eder; yeni tüketim için ikinci bir tetikleyici eklemez.

## Bağlanan kapsam

- Üreticinin **anlık UTT/BM hedefli ilk yayın açılışı**: onay modalında açık Kişisel Token Hesabı/Firma Token Hesabı seçimi, gerçek alıcı sayısı ile önizleme. Seçim/uygun önizleme olmadan Yayınla açılmaz.
- UTT/KD_UTT'nin **anlık E-Club önerisi**: mevcut gönderim panelinin özetinde hesap seçimi. Kanonik kota, 15 gün, inceleme, üye/eczane/takım ve firma kontrolleri korunur.
- Kişisel hesap yalnız gönderenin kendi hesabıdır; ortak hesap kendi firmasınındır. Satın alma yetkisi gönderim yetkisini değiştirmez. UTT'ye satın alma yetkisi verilmez.
- Seçim `yayin_yonetimi.token_hesap_turu` ile yeni anlık saha yayınına sabitlenir. Aynı adayın ikinci yayınını kaynak kilidi engeller; durdur/devam et tekrar tüketmez.
- Gerçek tüketim `cogniti_esnek_gonderim_tuketimleri` içinde alıcı ve yükleme kaynağıyla kaydedilir. Kullanılabilir token, süresi dolmamış yüklemelerden aktif Eczanem blokları çıkarılarak hesaplanır. Seçilen hesap yetersizse işlem bütünüyle geri alınır; farklı hesaba veya eski KKÖ hesabına otomatik geçiş yapılmaz.
- E-Club yeni service-only RPC'si aynı transaction'da mevcut kanonik toplu yazıcıyı çağırır. Token hatası bütün toplu öneri ve tüketimleri geri alır. Sunucu kimliği oturumdan alır; istemcinin firma/gönderen/miktar alanları kullanılmaz.
- E-Club işlem anahtarı gönderen, firma, hesap ve sırası korunan yayın/alıcı seçimine bağlıdır. Tekrar aynı sonucu verir; ikinci tüketim/bildirim başlatmaz. İşlemde kullanılan transaction-local hesap bağlamı başarı sonunda geri yüklenir; hata halinde transaction ile geri alınır. Eski plan işleyicisinin sonraki çağrılarına sızmaz.
- Başarı sonrasında ortak navbar yeniden okunur. Yeni yayın alıcıları hem eski tüketim kayıtlarından hem yeni tüketim defterinden çözümlenir; mevcut bildirim zinciri korunur.
- Önizleme hâlâ kayıt/tüketim oluşturmaz. `gercek_gonderim_acik` yalnız bu iki anlık akış için true olur; planlı önizlemede false kalır. SQL kurulmadan önce eski false yanıtı yeni gönderim onayını açmaz.
- Yazma uçları mevcut ortak HTTP yardımcıyla aynı köken, JSON türü ve boyut kontrolünden geçer. Yeni tüketim tabloları ve dahili tüketim fonksiyonu service_role dahil doğrudan erişime kapalıdır; yalnız kontrollü gönderim RPCsi sunucudan çağrılır.

## Korunanlar ve tamamlanmamış işler

- PM ailesinin Eczanem kaynak hesabı/bloklama/tüketim kuralları değiştirilmedi. Eczanem sonraki dağıtımı, ilk saha açılışı gibi ücretlendirilmez. Eczane token bilgisi görmez.
- Mevcut eski yayınlar, planlı yayın aktivasyonu ve E-Club plan işleyicisi eski tüketim yolunda devam eder. Bu adım plan rezervasyonunu yeni Esnek hesaba bağlamaz; Adım 5'te ele alınır. Planlı yayına anlık hesap seçimi gönderilirse sessizce eski hesaba yönlendirilmez, açıkça reddedilir.
- Yeni anlık saha yayını ve E-Club gönderimi seçilen **Esnek** hesabı gerektirir. Eski KKÖ hesabı ile yeni Esnek toplamları birleştirilmez; Esnek satın alma ekranı henüz bağlanmadığından bu teslim tam satın alma→gönderim canlı kabulü değildir.
- BM önerisi, C-Club, yönetici/T-Club ve Viva'nın yeni hesap seçim bağlantıları bu SQL'e eklenmedi; mevcut yolları korunur. Adım 4'ün bütün sistemdeki tüketim kaynaklarını tamamladığı iddia edilmez. İlk kaynak bağlayıcıları olarak Adım 3'te hazırlanan iki akış bağlandı.
- Satın alma butonu/modalı, Satın Alınan Paketler ve Token Kullanımı raporu bağlantıları sonraki ayrı işlerdir. Commit/push yapılmadı.

## Hedefli doğrulama

- Yerel PostgreSQL **18.6**, `/tmp` altında yalnız Unix socket; gerçek kullanıcı verisi ve Supabase bağlantısı yok. Gerçek Adım 1–4 ve E-Club kota/gönderim SQLleri kullanıldı. Temel tablolar sahtedir; eski KKÖ tüketimine delegasyon gözlemci stub ile sınandı, bütün canlı şema doğrulanmış sayılmaz.
- **16 yeni senaryo** başarılı: tekrar kurulum, kişisel/ortak ayrımı, gerçek yayın tetikleyicisi, yeterlilikte bütün işlem rollback, plan/eski aktivasyon, Eczanem ayrımı/blok koruması, token son kullanımı, 13 üretici ve kapalı rol matrisi, gerçek E-Club tek/çoklu gönderimi, aynı anahtarla tekrar, başka hesap/firma reddi, aynı kaynak için çift yayın ve iki bağlantıyla eş zamanlı tüketim/idempotency, doğrudan erişim engeli. Önceki **10 önizleme senaryosu** da aynı koşuda başarılı.
- Yayın API'si 12, E-Club Esnek API'si 6, önizleme sözleşmesi/API 4, gerçek E-Club React paneli 4 test başarılı. Hesap seçimi bileşeninin gecikmiş yanıt, yetersizlik, hazır/onay kilidi testleri ve PM Eczanem modal regresyonu başarılı.
- `npm run typecheck:build`: başarılı. Hedefli ESLint: **0 hata, 4 şema snapshot RPC uyarısı**.
- Test ayrıntısı: `COGNITI_ESNEK_GONDERIM_ADIM4_TEST_SONUCLARI.json`. Yerel PostgreSQL test sonunda durduruldu. Tarayıcı/mobil geometri, gerçek bildirim teslimi ve canlı gönderim henüz doğrulanmadı.

## UTT hesap seçimi yanlışlığı — geri alma talebi (9 Kasım 2026)

UTT'nin E-Club dağıtımında token hesabı seçmesi yanlış bulundu. Kullanıcı yanlış SQL bağlantısının kaldırılmasını istedi. Kullanıcı `eclub_utt_hesap_secimi_kaldirildi = true` sonucuyla yalnız bu RPC/dalı kaldıran geri alma SQL'inin başarıyla uygulandığını doğruladı. E-Club tüketimini üreticinin seçtiği hesaba bağlama henüz yapılmadı. Saha açılışı ve PM/Medikal Eczanem korunur. Ayrıntı: `ECLUB_UTT_HESAP_SECIMI_GERI_AL.md`. SQL: `scripts/sql/eclub_utt_hesap_secimi_geri_al.sql`.

## Ortak üretici açılış tüketimi — yeni uygulama (9 Kasım 2026)

Kullanıcı E-Club yayınlarının üretici çıkışında kapsamdaki kayıtlı üye sayısı kadar, üreticinin seçtiği hesaptan tüketilmesini onayladı. UTT/BM ve E-Club yayınları aynı alıcı kaynağı/tüketim motoruna bağlandı; UTT'nin hesap seçimi ekran/API bağlantısı kaldırıldı, yeni yayının UTT dağıtımında ikinci tüketim yoktur. İK E-Club'a kapalıdır; saha yayınlarında ortak motoru kullanır. Eczanem ve geçmiş yayınların davranışı korunur. Yeni plan hesabı kaydeder, gerçek aktivasyonda tüketir; rezervasyon ayrı kalan iştir. Kod/SQL ve yerel testler hazır; kullanıcı `cogniti_ortak_yayin_anlik_tuketim_kuruldu = true` sonucuyla SQL kurulumunu doğruladı. Gerçek kullanıcıyla canlı gönderim testi henüz yapılmadı. Ayrıntı: `COGNITI_ORTAK_YAYIN_ANLIK_TUKETIM.md`. SQL: `scripts/sql/cogniti_ortak_yayin_anlik_tuketim.sql`.
