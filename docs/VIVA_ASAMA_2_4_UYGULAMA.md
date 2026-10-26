# Viva — 2.4 Yaşam Döngüsü

25 Ekim 2026

**Kod ve kullanıcı SQL doğrulaması tamamlandı: 4 kurulum kontrolü true, 9/9 SQL testi başarılı. Cron tek kayıt/pasif kuruldu; deployment sonrası etkinleştirme bekliyor. Kullanıcı 2.4 tamamlandı kabulünü verdi; 2.5’e geçildi. Görsel testler kullanıcıda.**

Başlangıç bildirimi Daily presence ve gerçek sağlayıcı oturum kimliğiyle doğrulanır. Etkinlik sahibi, sürüm, oda ve nesil birlikte kontrol edilir. Katılım veya cihaz ekranının açılması tek başına canlı durumuna geçirmez.

Kişinin ayrılması veya bağlantısının kopması etkinliği bitirmez. Herkes için bitir ayrı sunucu eylemidir: Viva katılımı önce kalıcı kapanır; Daily engelleme, odadakileri çıkarma ve oda silme sonrasında başarı kaydedilir. Hata/yarım kalan işler kira ve hata kaydıyla tekrar denenir. Eski işin tamamlanması daha sonra istenen kapanışı kaybettirmez.

Verilen tokenlar saklanmaz; yalnız kimlik/oda nesli/erişim sonu kaydı tutulur. İptal edilen davet, çıkarılan katılımcı, değişen kapsam ve süresi biten oturum Daily user_id üzerinden ban işine dönüşür. Misafirin yenilenen doğrulama oturumu ayrı Daily kimliği kullanır. Katılımcı çıkarma ve mevcut davet iptali canlı etkinlikte de kullanılabilir. Katılımcı kabulü mevcut Viva daveti ve sunucuyu bekleme kapısından geçer; tokensiz Daily knocking açılmaz.

İptal/davet/katılımcı değişikliklerinde anlık sunucu mutabakatı denenir. Organizasyon/kapsam değişiklikleri ve başarısız işlemler dakikalık cron ile yakalanır; bu yol yalnız tarayıcı kontrolüne bağlı değildir. Token/oda bitiş ayarları sağlayıcıda geçerlidir; cron Viva durumunu da kapatır. Cron aktif edilmeden zamanlayıcı kurulmuş/çalışıyor kabul edilmez.

Geç gelen sağlayıcı olayı oturum ve nesille eşleşmezse yok sayılır. Sağlayıcı oturumunun kapanması tek başına etkinliği kalıcı bitirmez; bağlantı kaybıyla herkesi bitirme birbirine karıştırılmaz. Webhook girişinin kurulması 2.5 kapsamında kalır.

## Doğrulama

- Yaşam döngüsüne yönelik 6 teknik senaryo başarılı. Önceki 88 test yeniden çalıştırılmadı.
- Daily API’de geçici özel odada çevrimdışı kimliğe ban ve boş odanın kapatılması/silinmesi başarılı; gerçek görüşme açılmadı.
- Tip kontrolü başarılı. Lint: 0 hata; eski şema snapshot’ındaki RPC adlarından uyarılar var. DB şeması çekilmedi.
- Ajan SQL çalıştırmadı; kullanıcı 9/9 başarılı SQL kontrolünü paylaştı.
- Gerçek görüşme/görsel/cihaz testleri kullanıcıya ait; yapılmış sayılmaz. Commit/push yapılmadı.

## Kullanıcının çalıştıracağı dosyalar

1. `viva_asama2_4.sql`: erişim/yaşam döngüsü tabloları, RPC ve sürüm eşleştirmesi. Son 4 kontrol true beklenir.
2. `viva_asama2_4_test.sql`: 9 odaklı kontrol; yalnız yeni sentetik Viva kayıtları yazılır, sonunda ROLLBACK yapılır. Mevcut kullanıcılar yalnız okunur; Daily/e-posta çağrısı yapılmaz.
3. `viva_asama2_4_cron.sql`: mevcut Vault adları ve CRON_SECRET düzenini kullanır. İlk kurulum pasiftir. `/api/cron/viva` deployment sonrasında dosyanın sonundaki ayrı etkinleştirme satırı kullanıcı tarafından çalıştırılmalıdır. İlk sonuçta `cron_tek_kayit=true`, `cron_aktif=false` beklenir.

2.5’te aktif kaydı durdurma bu kapanış zincirine eklendi; hedefli stop → ban → kapanış kontrolü başarılı. Bu adım yeni kayıt üretimi kurmaz. SQL sonuçları doğrulandı. Deployment sonrası cron etkinliği henüz doğrulanmadı; zamanlayıcı çalışıyor sayılmaz.

[Kullanıcı SQL sonuç kaydı](./VIVA_ASAMA_2_4_KULLANICI_SQL_SONUCU.md).
