# Viva hatırlatma özelliği kaldırıldı — 25 Ekim 2026

Kullanıcının “tüm kodlarını sil” talebiyle toggle, API route'u, worker, cron entegrasyonu, özel push türleri/içeriği/TTL ve service worker eklentisi kaldırıldı. Özelliğin kurulum SQL'i, test dosyaları ve eski uygulama belgesi silindi. Yalnız bu özellik için eklenen toast bağlantı desteği de kaldırıldı. Google/Outlook takvimi ve ortak Viva/Daily/diğer bildirim akışları korunur.

Kullanıcı kurulum SQL'inin üç kontrolünü `true` olarak paylaşmıştı. Canlı veritabanındaki nesneleri kaldırmak için `scripts/sql/viva_hatirlatma_kaldir.sql` hazırlandı; kullanıcı güncel kodun deployment'ından sonra çalıştırır. İki hatırlatma tablosu ve içindeki tercih/olay verileri, dört fonksiyon ve iki push ayar anahtarı silinir. Ortak cron kaydı silinmez. Ajan canlı DB'ye bağlanmadı; temizlik SQL'i canlıda uygulanmış kabul edilmez.

Doğrulama: Viva arayüzü/yaşam akışı ve ilgili mevcut push regresyon testleri **37/37 geçti**. TypeScript kontrolü geçti. Değişen üretim dosyalarının lint kontrolü 0 hata; mevcut Daily yaşam RPC'si için 1 şema anlık görüntüsü uyarısı var. Temizlik SQL'i yalnız bellekte PGlite ve sentetik nesnelerle iki kez çalıştırıldı; eski hatırlatma nesneleri kaldırıldı, diğer push ayarları, etkinlikler ve ortak cron korundu. Uygulama/test kodunda özelliğin kalan referansı bulunmadı. Canlı veritabanı temizliği bekliyor.
