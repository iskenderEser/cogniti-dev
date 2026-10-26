# Viva — 2.1 Oda Eşleştirmesi Uygulama Kaydı

Tarih: 25 Ekim 2026  
**Durum: 2.1 tamamlandı. Kullanıcının kurulum çıktısındaki 5 kontrol true; 18 SQL testi başarılı. 2.2 başlamadı.**

## Yapılanlar

`cogniti-viva.daily.co` alanı ve yerel API anahtarıyla Daily kimlik doğrulaması başarılı.
Anahtar hiçbir sonuç dosyasına veya sohbete yazılmadı. Vercel değerleri kullanıcı bildirimiyle
kaydedilmiş kabul edilir; Vercel ortamındaki anahtar ajan tarafından okunmadı.

- `lib/viva/daily.ts`: Yalnız sunucuya açık Daily taşıması; sabit API adresi, zaman aşımı,
  özel oda, doğru alan/oda/ayar kontrolü, var olan odayı kullanma ve tarih güncelleme.
- `lib/viva/oda.ts`: DB’de işi ayır → Daily’de hazırla → doğru iş kirasıyla tamamla;
  hata/yanıt kaybında aynı oda adıyla yeniden deneme. İç iş anahtarı istemci yanıtına çıkmaz.
- `app/(panel)/viva/api/oda/route.ts`: `GET` sahip için eşleştirme durumunu okur;
  `POST` sahip için oda hazırlama/güncelleme işlemini yürütür. Etkinlik sahibi güncel DB
  yetkisiyle doğrulanır; istemciden gelen domain/rol kullanılmaz.
- `scripts/sql/viva_asama2_1.sql`: Yeni `viva_daily_odalar` tablosu ve
  `viva_daily_oda_islem` giriş fonksiyonu. Tablo/fonksiyon doğrudan istemciye kapalı;
  erişim sunucu ve mevcut etkinlik sahipliği üzerinden.
- `scripts/sql/viva_asama2_1_test.sql`: Kullanıcı için 18 sıralı iş kuralı kontrolü.

Mevcut birinci aşama ekranları ve etkinlik API’si değiştirilmedi. Yeni oda API’si
2.2/2.3 katılım bağlantısında kullanılacak; bu adımda görüşme veya kayıt başlatılmadı.

## Veri sözleşmesi

Etkinlik başına bir güncel eşleştirme vardır. Daily domaini, sabit oda adı, oda kimliği,
oda nesli, durum ve hedef etkinlik sürümü/tarihleri tutulur. Başarılı eşleşme sürümü ile
güncel etkinlik sürümü ayrı değerlendirilir. 60 saniyelik iş kirası aynı etkinlik için
iki hazırlama isteğinin birlikte çalışmasını sınırlar. Eski kira yeni işin durumunu ezemez.

Etkinlik tarihi değiştiğinde eski eşleşme güncel sayılmaz; bir sonraki yetkili oda hazırlama
çağrısı mevcut Daily odasına yeni tarihleri uygular. Tarih değişikliği anında arka planda
otomatik çalışan bir işleyici bu adımda eklenmedi. Canlı yaşam döngüsü bağlantısı 2.4’te kurulacak.
Kapalı/iptal/bitmiş etkinlik için yeniden hazırlama reddedilir. Oda nesli gelecekte gerekirse
yeni ada geçişi destekleyecek bağlantıdır; bu adım otomatik yeniden açma özelliği sağlamaz.

Daily oturum kimlikleri 2.4’te, kayıt ve webhook olaylarının kalıcı kayıtları 2.5’te eklenecek.
Bu adımda yalnız oda işinin durumu ve yeniden denenebilir hata kodu kalıcı tutulur.
Mevcut podcast transkript kuyruğu öğrenme aracı/talep kimliklerine bağlıdır; o kuyruk Viva
oda işlerini taşımak için değiştirilmedi. Kalıcı iş alma/lease deseni ilgili adımlar için referanstır.

## Doğrulama

| Kontrol | Sonuç |
|---|---|
| Daily API kimlik ve domain eşleşmesi | HTTP 200; beklenen domain |
| Gerçek Daily özel oda oluşturma | Başarılı |
| Aynı oda adıyla tekrar istek | Başarılı; oda çoğalmadı |
| Aynı Daily odasında bitiş saati güncelleme | Başarılı |
| Geçici test odalarının temizliği | Başarılı; son kontrolde silme HTTP 200, ardından okuma HTTP 404 |
| 2.1 uygulama/servis/API testleri | 21/21 başarılı; sahte bağımlılıklar |
| Birinci aşama regresyonları | 21/21 başarılı |
| Toplam uygulama testi | 42/42 başarılı |
| Tip kontrolü | Başarılı |
| Yeni dosyaların lint kontrolü | 0 hata; yeni RPC’nin eski yerel şema kaydında bulunmamasından 1 uyarı |
| SQL kurulumu ve 18 iş kuralı testi | Kullanıcı çalıştırdı: 5/5 kurulum kontrolü true, 18/18 test başarılı; ajan çalıştırmadı |
| İki bağımsız DB bağlantısıyla yarış | Yapılmadı; iş kirası testleri sahte bağımlılık/sıralı SQL kapsamındadır |

Daily API varsayılan `enable_screenshare=true` değerini oda `config` yanıtında atlıyor,
`false` değerini ise açıkça döndürüyor. Bu davranış geçici özel odada doğrulandı; karşılaştırma
bu varsayılanı normalleştiriyor. Bu, gerçek ekran paylaşımı görüşmesinin denendiği anlamına gelmez.

Her Daily testi yalnız bu işlem için oluşturulan özel odada yürütüldü; görüşmeye katılınmadı,
kayıt açılmadı, başka odalar değiştirilmedi. Ajan Supabase’e/DB’ye erişmedi; yerel SQL de çalıştırmadı.

## Kullanıcının çalıştırdığı dosyalar

1. **Kurulum:** `viva_asama2_1.sql` — yeni oda tablosunu/fonksiyonlarını kalıcı kurar.
   Sondaki kontrolde `oda_tablosu`, `oda_fonksiyonu`, `rls_etkin`, `anonim_erisim_kapali`
   ve `istemci_rpc_kapali` değerlerinin tamamı kullanıcı çıktısında `true`.
2. **Test:** `viva_asama2_1_test.sql` — kurulumdan sonra dosyanın tamamı çalıştırılır.
   Yalnız yeni test etkinliği ve oda kaydı oluşturur; son `ROLLBACK` bunları geri alır.
   Mevcut kullanıcı/eczane/üyelik kayıtları değiştirilmez. Kullanıcı 18 başarılı sonucu paylaştı.

Kurulum dosyasındaki COMMIT şemayı kurar; test dosyasındaki ROLLBACK yalnız test kayıtlarını geri alır.
Bu dosyalar Daily’ye HTTP isteği yapmaz. Kullanıcının başarılı kurulum ve test çıktılarıyla 2.1 kapatıldı.

[Paylaşılan SQL sonuç kaydı](./VIVA_ASAMA_2_1_KULLANICI_SQL_SONUCU.md). Token ve aktif oturum kontrolleri 2.2/2.4; iki bağımsız bağlantıyla yarış doğrulaması 2.6.09 kapsamında açık kalır.

## Sonraki adım

Kullanıcının **devam edelim** onayıyla 2.2’de mevcut kimlik ve davet yetkisini
Daily’nin sunucu/katılımcı/izleyici tokenlarına çevireceğiz. Hazır bekleme davranışını da o adımda sınayacağız.

Kullanıcı akışı: 2.1 → kısa tamamlanma briefi ve sıradaki iş → kullanıcı devam onayı → 2.2.
Her adımın sonunda bu sıra korunur; 2.2–2.6 otomatik başlatılmaz.
