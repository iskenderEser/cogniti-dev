# Viva — 2.1 Kullanıcı SQL Sonuçları

Tarih: 25 Ekim 2026  
Kaynak: Kullanıcının sohbet üzerinden paylaştığı kurulum ve test çıktıları. Ajan DB’ye erişmedi veya SQL çalıştırmadı.

## Kurulum

| Kontrol | Sonuç |
|---|---|
| `oda_tablosu` | `true` |
| `oda_fonksiyonu` | `true` |
| `rls_etkin` | `true` |
| `anonim_erisim_kapali` | `true` |
| `istemci_rpc_kapali` | `true` |

## İş kuralı testleri

| Sıra | Test | Sonuç |
|---|---|
| 01 | Yeni etkinlikte oda henüz yok | BAŞARILI |
| 02 | Başkasının oda eşleştirmesi okunamaz | BAŞARILI |
| 03 | Taslak için oda işi ayrılamaz | BAŞARILI |
| 04 | Daily dışı domain reddedilir | BAŞARILI |
| 05 | Tek oda kimliği ve iş kirası üretilir | BAŞARILI |
| 06 | İş sürerken ikinci çağrı bekler ve gizli kira dönmez | BAŞARILI |
| 07 | Yanlış kira ile iş tamamlanamaz | BAŞARILI |
| 08 | Doğru kira mevcut sürümü hazır yapar | BAŞARILI |
| 09 | Tarih/sürüm değişince eski eşleşme güncel sayılmaz | BAŞARILI |
| 10 | Yeniden deneme aynı oda adıyla yeni tarih hedefler | BAŞARILI |
| 11 | İş sırasında etkinlik değişirse eski sonuç 409 olur | BAŞARILI |
| 12 | Süresi dolmuş iş yeni kirayla aynı odada kurtarılır | BAŞARILI |
| 13 | Eski iş yeni işin durumunu ezemez | BAŞARILI |
| 14 | Sağlayıcı hatası kira bırakılarak kaydedilir | BAŞARILI |
| 15 | Mevcut eşleşme başka Daily alanına taşınamaz | BAŞARILI |
| 16 | Kapalı oda aynı kimlikle tekrar açılamaz | BAŞARILI |
| 17 | İptal edilmiş etkinlikte yeni oda işi kapalıdır | BAŞARILI |
| 18 | Anon/authenticated tabloya veya RPCye doğrudan erişemez | BAŞARILI |

**Sonuç: 18 başarılı, 0 başarısız, 0 atlanan.** Çıktıdaki 19. satır kapsam bilgisidir; test sayısına eklenmedi.

Kullanıcının paylaştığı kapsam: Sıralı iş kuralı testi; Daily API, iki bağlantılı yarış ve gerçek görüşme sınanmaz. Test kayıtları ROLLBACK ile geri alınır.

İki bağımsız bağlantıyla yarış doğrulaması 2.6.09 kapsamında açık kalır. Token üretimi ve yetkileri 2.2, aktif görüşmenin kapatılması/çıkarma işlemleri 2.4 kapsamındadır; bu sonuçlarla yapılmış sayılmaz.
