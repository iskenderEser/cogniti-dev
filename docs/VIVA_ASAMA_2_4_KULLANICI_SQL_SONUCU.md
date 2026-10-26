# Viva — 2.4 Kullanıcı SQL Sonuçları

25 Ekim 2026. Kaynak: Kullanıcının paylaştığı çıktılar. Ajan DB’ye erişmedi veya SQL çalıştırmadı.

Kurulum: erisim_tablosu=true, yasam_tablosu=true, yasam_fonksiyonu=true, istemci_rpc_kapali=true.

1. Başkası görüşmeyi bitiremez — BAŞARILI
2. Başlangıç saatinden önce canlıya geçilemez — BAŞARILI
3. Geçerli başlangıç canlı yapar; tekrar sürüm artırmaz — BAŞARILI
4. Eski sağlayıcı oturumu yeni görüşmeyi kapatmaz — BAŞARILI
5. İptal davet kalıcı çıkarma/ban işine girer — BAŞARILI
6. Eski iş sonucu reddedilir; hata yeniden denenebilir — BAŞARILI
7. Herkes için bitir kalıcıdır; tekrar ve eski katılım açamaz — BAŞARILI
8. Süre sonu tarayıcı olmadan kapanış işine dönüşür — BAŞARILI
9. Yaşam döngüsü tablo ve RPC istemciye kapalıdır — BAŞARILI

Cron: cron_tek_kayit=true; cron_aktif=false. Beklenen pasif kurulum doğrulandı; etkinleştirme deployment sonrasına ait ve henüz yapılmadı.

9/9 SQL testi başarılı, atlanan yok. Gerçek görüşme ve görsel kontroller kullanıcıda; yapılmış sayılmaz. Aktif kayıt durdurma bağlantısı 2.5 ile tamamlanacak.
