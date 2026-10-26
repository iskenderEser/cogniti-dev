# Viva — 2.2 Katılım ve Yetki Uygulama Kaydı

Tarih: 25 Ekim 2026  
**Durum: 2.2 katılım/yetki kodu, API ve SQL doğrulaması tamamlandı: 4 kurulum kontrolü true, 24/24 SQL testi başarılı. Prebuilt bağlantısı ve gerçek görüşme doğrulaması 2.3’te açık; 2.3 başlamadı.**

## Yapılanlar

- Yeni `viva_daily_katilim_baglam` RPC’si, mevcut `viva_erisim`, organizasyon kapsamı ve etkinlik sahipliğini kullanır. Misafir için davet hash’i ile doğrulanmış, süresi dolmamış HttpOnly oturum cookie’sinin hash’i birlikte gerekir. Üye ve misafir kimliği karıştırılamaz. Rol, isim, etkinlik ve süreler istemciden alınmaz.
- Üye katılımı: `POST /viva/api/katilim`, gövdede yalnız etkinlik kimliği kullanılır. Misafir katılımı: `POST /viva/davet/[token]/katilim`, oturum mevcut cookie’den okunur. GET token üretmez. Yanıtlar `private, no-store` ve `no-referrer` ile döner.
- `lib/viva/katilim.ts`, başlangıç zamanı, güncel oda ve bitiş sınırını kontrol eder. Sahip gerekirse 2.1’in iş kirası akışıyla odasını hazırlar; diğer kişiler oda oluşturamaz. Daily tokenı hazırlandıktan sonra yetki tekrar okunur; arada değişmişse token teslim edilmez.
- Daily kullanıcı kimlikleri üyeye veya davete bağlı sabit, özetlenmiş kimliklerdir. E-posta, ham auth/davet kimliği, API anahtarı veya cookie token içine konmaz. Görünür kişi adı mevcut yetki kaynağından gelir. Token sunucuda veya kalıcı tarayıcı kaydında saklanmaz.

## Rol sözleşmesi

| Rol | Owner / yönetim | Medya gönderimi | Ekran paylaşımı | Kayıt |
|---|---|---|---|---|
| Etkinlik sahibi | `is_owner=true`, `canAdmin=true` | Açık | Açık | Sunucu yetkisi ve kayıt düğmesi; fiili kayıt 2.5’te |
| Firma içi / EClub davetlisi | Owner değil, `canAdmin=false` | Kamera/mikrofon açık | Açık; sunucu kontrolüne tabi | `enable_recording=false`, düğme kapalı |
| Özel misafir | Owner değil, `canAdmin=false` | `canSend=false`; kamera/mikrofon/ekran gönderemez | Kapalı | `enable_recording=false`, düğme kapalı |

Üç rolde medya alma açık; kamera/mikrofon başlangıçta kapalıdır. Otomatik kayıt ve otomatik transkripsiyon kapalıdır. Daily API, `enable_recording=false` değerini doğrulama yanıtında boş metin (`""`) olarak normalleştirir; geçici odada doğrulandı. Bu, gerçek görüşmede kayıt başlatma girişiminin test edildiği anlamına gelmez.

## Sunucuyu bekleme

Daily’nin hazır bekleme rehberi geçerli tokenın lobiyi atladığını söylüyor. Bu nedenle özel odada tokensiz knocking kapalı kalır; Viva, katılımcı/izleyici tokenını vermeden önce Daily presence API’sinde etkinlik sahibinin imzalı sabit `user_id` değerini arar. Görünür isim yetki sayılmaz. Oda boşsa 202 ve bekleme açıklaması döner; token veya oda adresi dönmez. Presence başarısızsa erişim açılmaz.

Bu adım bekleme arayüzü, kamera testi veya kabul listesi geliştirmez. 2.3 mevcut Viva oda alanında yalnız bu bağlantı durumunu gösterip Daily’nin hazır Prebuilt arayüzünü yerleştirecek. Gerçek host katılımı ve olumlu presence sonucu henüz görüşmede sınanmadı. Sunucunun sonradan ayrılması, etkinliği herkes için bitirmekten ayrıdır; yaşam döngüsü 2.4’te bağlanacak.

## Süre ve iptal sınırı

Token `room_name`, `nbf` ve `exp` ile oda/zamana bağlıdır. Etkinlik başlangıcından önce token verilmez. Token, etkinlik bitişine kadar; misafirde etkinlik bitişi ve mevcut doğrulanmış oturum bitişinden önce olana kadar geçerlidir. `eject_at_token_exp=true`; çok kısa token süresiyle meşru görüşme kesilmez.

Yeni token isteği, çıkarılmış katılımcı, iptal/yenilenmiş davet, süresi dolmuş misafir oturumu ve kapanmış etkinlik için reddedilir. **Önceden teslim edilmiş token, JWT’nin doğası gereği DB kaydını kendiliğinden yeniden okumaz.** Aktif görüşmeden çıkarma/ban ve eski tokenla yeniden girişin kapanması 2.4’te bağlanacak; bu adımda tamamlanmış sayılmaz. Tokenın join() çağrısına bellekte aktarılması 2.3’ün işidir.

## Doğrulama

| Kontrol | Sonuç |
|---|---|
| Yeni 2.2 uygulama testi | 25/25 başarılı; sahte bağımlılıklar |
| Önceki Viva regresyonları | 42/42 başarılı |
| Toplam uygulama testi | 67/67 başarılı |
| Gerçek Daily token oluşturma/doğrulama | 3 rolün oda, kimlik, zaman ve izinleri kabul edildi |
| Boş gerçek Daily odasında sunucuyu bekleme | Katılımcı ve izleyici token alamadı; 2 kontrol başarılı |
| Gelecekte başlayan nbf tokenı | Daily erken doğrulamayı reddetti |
| Toplam gerçek Daily API kontrolü | 6/6 başarılı |
| Test odası temizliği | DELETE 200; sonraki GET 404 |
| Tip kontrolü | Başarılı |
| Yeni/değişen dosyaların lint kontrolü | 0 hata, eski şema snapshot’ından 3 RPC uyarısı |
| SQL kurulum ve 24 iş kuralı senaryosu | Kullanıcı çalıştırdı: 4/4 true, 24/24 başarılı, atlanan yok; ajan çalıştırmadı |
| Gerçek görüşme, medya engeli, süre sonunda çıkarma | Henüz yapılmadı; 2.3/2.6 |

Daily testleri yalnız geçici özel odada ve sentetik kimliklerle yürütüldü. Tokenlar çıktı dosyalarına yazılmadı; gerçek görüşmeye katılınmadı ve kayıt açılmadı. Ajan Supabase’e/DB’ye erişmedi; yerel SQL de çalıştırmadı.

## Kullanıcının çalıştırdığı dosyalar

1. `viva_asama2_2.sql`: Yalnız yeni yetki RPC’sini kurar. Mevcut tabloları veya kullanıcıları değiştirmez. Çıktıdaki `katilim_fonksiyonu`, `anonim_erisim_kapali`, `istemci_rpc_kapali`, `sunucu_rpc_acik` değerlerinin tamamı kullanıcı çıktısında true.
2. `viva_asama2_2_test.sql`: Kurulumdan sonra tüm dosya çalıştırılır. Yeni rastgele test etkinlikleri ve davetleri üzerinden 24 senaryo sınar, sonunda ROLLBACK yapar. Mevcut kullanıcı/firma/eczane/üyelik kayıtlarını değiştirmez. Firma içi ve EClub senaryoları dahil 24 testin tamamı BAŞARILI; atlanan senaryo yok.

Test SQL’i gerçek e-posta göndermez: yalnız yeni sentetik davette doğrulanmış oturum koşulunu kurar. Gerçek e-posta/cookie uçtan uca denemesi mevcut TB-03 teknik borcunda kalır. İki bağlantılı yarış yapılmış sayılmaz.

[Kullanıcı SQL sonuç kaydı](./VIVA_ASAMA_2_2_KULLANICI_SQL_SONUCU.md).

## Dosyalar

`lib/viva/daily.ts`, `lib/viva/katilim.ts`, `lib/viva/katilimSunucu.ts`, iki yeni katılım API’si, iki SQL dosyası ve `tests/vivaDailyKatilim.hedef.test.ts`. Mevcut Viva ekranları bu adımda değiştirilmedi; commit/push yapılmadı.

## Sonraki adım

Kullanıcı SQL sonuçları doğrulandı. Kullanıcı **devam edelim** dedikten sonra 2.3’te Daily Prebuilt mevcut Viva oda alanına yerleştirilecek; token URL’ye konmadan join() çağrısına aktarılacak. 2.3 otomatik başlatılmaz.

## Dayanaklar

- [Daily token oluşturma](https://docs.daily.co/reference/rest-api/meeting-tokens/create-meeting-token)
- [Token doğrulama](https://docs.daily.co/reference/rest-api/meeting-tokens/validate-meeting-token)
- [Token süreleri ve kullanım sınırları](https://docs.daily.co/reference/rest-api/meeting-tokens)
- [Katılımcı izinleri](https://docs.daily.co/docs/daily-js/guides/permissions)
- [Bekleme alanı ve token davranışı](https://docs.daily.co/docs/daily-js/guides/waiting-room)
- [Odada kullanıcı varlığı](https://docs.daily.co/reference/rest-api/rooms/get-room-presence)
