# E-Club yayın gönderimi ve planlama — kurulum ve dağıtım

## Mevcut durum

Adım 3–7 SQL yapısal kontrolleri kullanıcı tarafından başarılı olarak bildirildi.
Plan cron'u ilk kurulumda tek kayıt, dakikalık ve pasif olarak doğrulandı. Kullanıcının 14 Ekim 2026 tarihli `cron.job` çıktısında iş kimliği 14, sıklık `* * * * *` ve `active = true`. Adım 9 geliştirmeden
çıkarıldı: üye öğrenme/puan davranışı korunur. Adım 10 yalnız yayın bildirimlerini
kapsar; puan/rapor ve çek teslimatı bu değişiklik paketine dahil değildir.
Adım 11'de 41/41 izole SQL ve 64/64 ilgili regresyon testi geçti.

Adım 12 için kurulum/durum kontrolü ve cron yönetim dosyaları hazırlandı.
Eklenen operasyon kontrolleriyle yerel SQL paketi 46/46 geçti.
Yerel `npm run build` başarılı; yeni cron endpointi de derlendi. Cron/Vault kısmı
sahte uzantı tablolarıyla sınandı; gerçek Supabase cron etkinleştirme testi olarak
kaydedilmez. Canlı kurulum son kontrolü ve uygulama dağıtımı doğrulaması
**bekliyor**. `scripts/denetim/sema.json` 29 Eylül 2026 tarihli public şema anlık görüntüsüdür; cron etkinliğini göstermez. Aşağıdaki kayıtlar kullanıcı doğrulaması gelmeden tamamlandı yapılmaz.

## Ön koşullar

- E-Club ortak öğrenme aracı omurgası ve yayın görünümleri mevcut olmalı:
  `v_yayin_detay` arac_id/arac_turu ve kapsam bilgilerini,
  `v_yayin_kunye` yayının `urun_id` bağlantısını sağlar.
- Öneriler ortak araç kimliğine geçmiş olmalı; eski `video_id` nullable kalır.
  Önceki ortak araç migrasyonları güncel veritabanında zaten varsa tekrar kurulmaz.
- UTT incelemeleri, yayın tur kayıtları ve aktif UTT–eczane–firma–üye ilişkileri
  mevcut olmalı. Aynı yayın sabitken araç değiştirme iş akışı yoktur.
- Sunucudaki mevcut Supabase servis bağlantısı, `CRON_SECRET`, pg_cron, pg_net
  ve Supabase Vault hazır olmalı. Vault adları `hapbilgi_cron_base_url` ve
  `hapbilgi_cron_secret`tir. Base URL dağıtımın dışarıdan erişilebilir adresidir.
  Vault secret ile uygulamanın `CRON_SECRET` değeri aynı olmalı; değerler
  paylaşılmaz veya bu belgeye yazılmaz.

## SQL sırası

SQL'leri yalnız proje sahibi Supabase SQL Editor'da çalıştırır. Asistan DB'ye
bağlanmaz. Kullanıcının daha önce doğruladığı dosyalar yeniden uygulanmak zorunda
değildir; önce aşağıdaki salt okunur kontrol ile eksik olup olmadığı belirlenir.

| Sıra | Dosya | İşlev |
| --- | --- | --- |
| 1 | `scripts/sql/eclub_yayin_gonderim_planlari.sql` | Ayrı plan tablosu, durum/tekillik kısıtları ve yetkiler |
| 2 | `scripts/sql/eclub_gonderim_kota_ve_tarih_kontrolu.sql` | Ortak atomik hesap, kilitler ve doğrudan yazım kapıları |
| 3 | `scripts/sql/eclub_gonderim_rpc_yeni_kurgu.sql` | Yeni gönderim yazıcısı, eski RPC köprüsü ve 15 gün |
| 4 | `scripts/sql/eclub_gonderim_api_toplu.sql` | Çoklu gönderim/plan/önizleme |
| 5 | `scripts/sql/eclub_planlanan_gonderim_isleyici.sql` | Plan sahiplenme ve aynı transactionda gerçekleştirme |
| 6 | `scripts/sql/eclub_planlanan_gonderim_cron.sql` | Dakikalık cron; ilk kurulumda pasif, tekrar kurulumda önceki aktiflik korunur |
| 7 | `scripts/sql/eclub_gonderi_saatini_temizle.sql` | Saatli planları Türkiye tarihine çevirir; plan kolonunu `date` yapar ve gün bazlı kontrolleri kurar |

Saat kaldırma geçişinde, uygulamanın yeni tarih biçimli API sürümü dağıtılmadan
önce **yalnız 7. SQL** proje sahibi tarafından çalıştırılır. İşlem mevcut planların
hedef saatlerini kaldırıp Türkiye tarihini korur; cron'un aktifliğini değiştirmez.
Bugün henüz saati gelmemiş açık plan varsa SQL hata verip tüm işlemi geri alır;
bu planın erkene çekilmesi için ayrıca karar verilmelidir.
Dosyanın sonundaki beş kontrolün de `true` dönmesi beklenir. Adım 3–6 SQL'lerini
bu geçişten sonra yeniden çalıştırmayın; eski saatli fonksiyonları geri getirirler.

Her dosya kendi transaction'ını içerir ve hata varsa geri alınır. İlk beş dosya
izole PostgreSQL'de aynı veritabanına yeniden uygulanarak doğrulandı. Eski
`eclub_ogrenme_araci_yayin_kimligi.sql` gibi geçmiş migrasyonlar yeni yazıcıdan
sonra tekrar çalıştırılmaz; eski fonksiyon gövdelerini geri getirebilirler.
Eski geçmiş önerilerin 7 günlük süreleri yeni kuruluma rağmen tarihsel kayıt
olarak kalır; yeni gönderimler 15 gündür. Veri silme/temizleme bu pakette yoktur.

## Canlı kurulum kontrolü — ilk işlem

1. `scripts/sql/eclub_gonderim_kurulum_kontrol.sql` çalıştırılır.
   Bütün `uygun` değerleri `true` beklenir. Tablo/görünüm, RPC, aktif trigger,
   geçerli tekil indeks, yetki, eski RPC köprüsü ve süre/tarih kontrolleri okunur.
   Bu dosya salt okunurdur; gönderim RPC'sini çağırmaz.
2. `scripts/sql/eclub_gonderim_canli_durum_kontrol.sql` çalıştırılır.
   Cron/Vault hazır sonuçları `true`, **dağıtım öncesi cron_aktif `false`**,
   sonuç bağlantısı ve planlı öneri süre uyuşmazlığı sayıları `0` beklenir.
   Bekleyen/zamanı gelmiş plan sayıları incelenir; etkinleştirme bu planların
   gerçek gönderimine izin verecektir. Sayıların sıfır olması zorunlu değildir.
   Gizli değerler ve kişi kimlikleri çıktı olarak verilmez.

SQL bir nesnenin eksik veya yetkisiz olduğunu bildirirse ilgili ön koşul/sıra
çözülür; sonuç doğrulanmadan cron açılmaz. Vault ve uygulama anahtarlarının
birbirine eşitliği, değerleri paylaşmadan proje sahibi tarafından doğrulanır.

## Uygulama dağıtımı

- Yerel doğrulama `npm run build` ile yapılır; bu komut önce zorunlu
  `typecheck:build` kontrolünü çalıştırır. Dağıtımın build sonucu ayrıca doğrulanır.
- Projede mevcut Git–Vercel dağıtım yolu `docs/VERCEL_GIT_ENTEGRASYONU.md`
  içinde belgelenmiştir. `main` push'u canlı deployment başlatabilir.
- Çalışma alanındaki diğer değişikliklerle yayın gönderim paketinin sınırı
  incelenmeden bütün dosyalar otomatik commit/push yapılmaz. Bu belgeler
  hazırlanırken commit, push veya Vercel deployment yapılmış kabul edilmez.
- Yeni kodlar: UTT `/eclub/yayinlar` ekranı, `/eclub/oneriler/api`, ortak
  gönderim yardımcıları, ilgili admin süre ayarı ve
  `/api/cron/eclub-yayin-gonderim` işleyicisidir. Üye öğrenme kodu yeniden yazılmaz.
- Yeni sayfada dört durum kapsülü, inceleme tamamlanmasına göre Gönderime Hazır,
  Şimdi gönder/Planla seçenekleri, yalnız tarih seçimi ve uygunluk/özet akışı görülür.
- UTT oturumunda `/eclub/oneriler/api?yalniz_limit=1` salt okunur isteğinin
  yanıtında geçerlilik/tekrar aralığı 15, haftalık ürün sınırı 3, dönemlik tekrar
  sınırı 2, ileri hafta 1 ve yalnız mevcut dönem bilgisi doğrulanır.
- Cron URL'sine **anahtarsız** GET isteği `401` vermelidir. Doğru anahtarlı
  GET/POST bir sağlık kontrolü değildir: kuyruktaki planları gerçekten işler.
  Dağıtım doğrulaması için anahtar kullanılarak boş varsayılan istek atılmaz.
- Yayınlar sayfasından kontrol/önizleme kayıt oluşturmaz. Gönder/Planı kaydet
  gerçek işlem oluşturur; canlı test seçimi kullanıcı tarafından yapılır.

## Cron'u etkinleştirme — son işlem

Uygulama deployment'ı başarılı, canlı yapısal kontroller doğru ve Vault/uygulama
anahtar uyumu doğrulanmışsa kullanıcı
`scripts/sql/eclub_planlanan_gonderim_cron_etkinlestir.sql` dosyasını çalıştırır.
Sonuç: tek kayıt, dakikalık, aktif — üçü de `true` olmalıdır. Dosya yeniden
çalıştırılabilir. Doğrudan `UPDATE cron.job` kullanmaz; `cron.alter_job` çağırır.

Sonrasında kullanıcı seçtiği uygun yayın/alıcı için gelecekte bir hafta içi
hedefiyle planı kaydeder. Kaydetme anında öneri/bildirim oluşmamalıdır. Hedef anı
geçip cron çalışınca plan `gerceklesti`, bir öneri kaydı ve gerçek gönderimden
başlayan 15 günlük süre görülmelidir. Yenilenen listede aynı plan ikinci öneri
oluşturmamalıdır. Yayın durmuş veya kişinin yetkisi kalkmışsa plan
`gerceklesmedi` ve neden görünür; tarih başka güne kaymaz.

`eclub_gonderim_canli_durum_kontrol.sql` yeniden çalıştırılır. Vercel route
loglarında yetkisiz/hata yanıtları olup olmadığı kontrol edilir. Cron'un aktif
olması, HTTP işleyicisinin başarıyla çalıştığını veya cihaz bildiriminin ulaştığını
tek başına doğrulamaz. Üye uygulama içi bildirimini ayrıca kontrol eder. Bildirim
insert hatası loglanır; push geçici hataları üç kez denenir; kalıcı yeniden deneme
kuyruğu bu kapsamda eklenmemiştir.

## Durdurma

Gerekirse kullanıcı `scripts/sql/eclub_planlanan_gonderim_cron_durdur.sql`
ile yalnız bu cron'u pasif yapar. Kayıtlar korunur; halen çalışan HTTP isteği
bu SQL ile iptal edilmez. Eski gönderim kurallarını geri yükleyen SQL uygulanmaz.
Tekrar açmadan önce uygulama/kurulum doğrulanır ve etkinleştirme dosyası kullanılır.

## Tamamlanma kaydı

| Kontrol | Durum | Kanıt |
| --- | --- | --- |
| Adım 3–7 ilk yapısal SQL kontrolleri | Kullanıcı doğruladı | Önceki konuşmada true sonuçları |
| Cron tek/dakikalık/pasif ilk kurulum | Kullanıcı doğruladı | true / true / false |
| Adım 11 yerel testler | Başarılı | 41 SQL + 64 regresyon; Adım 11 JSON |
| Adım 12 yerel operasyon SQL kontrolleri | Başarılı | 46 toplam SQL; cron/Vault kısmı taklit |
| Son canlı yapısal kurulum kontrolü | Kullanıcı doğruladı | 40/40 uygun=true; Adım 12 JSON |
| Cron/Vault/veri durum kontrolü | Kullanıcı doğruladı | Tek/dakikalık/doğru endpoint; Vault hazır; cron pasif; planlar ve uyuşmazlıklar 0 |
| Yerel production build | Başarılı | npm run build; Next 16.2.0, Turbopack, 212 statik sayfa |
| Production deployment | Doğrulanmadı | Deployment kaydı |
| Cron etkinleştirme | Kullanıcı SQL çıktısıyla doğruladı | 14 Ekim 2026: jobid 14, `* * * * *`, `active = true` |
| Saat bilgisini kaldıran tarih geçişi | Kullanıcı canlı SQL sonucuyla doğruladı | 14 Ekim 2026: plan kolonu, tekrar hesabı, toplu işlem, plan kapısı ve işleyici kontrollerinin beşi de `true` |
| Gerçek planın gönderime dönüşmesi | Bekliyor | Kullanıcının plan/öneri ve bildirim doğrulaması |

Yerel test sonucu canlı tamamlanma olarak kaydedilmez. Adım 12 ancak bekleyen
canlı işlemler kullanıcı tarafından doğrulandığında tamamlanır.
