# Viva — Daily görüşme özellikleri

26 Ekim 2026. Daily'de bulunan arka plan ve kayıt araçları için oluşturulan Viva arayüzleri kaldırıldı.

- Arka plan bulanıklaştırma, görsel seçme ve efekti kaldırma Daily kamera menüsündedir. Oda ayarı `enable_video_processing_ui: true` olarak kalır. Viva paneli, dosya alanı, doğrulaması ve `updateInputSettings()` sarmalayıcısı silindi.
- Kayıt başlatma/durdurma Daily menüsündedir. `enable_recording_ui` yalnız sunucu için açılır; kayıt yetkisi yalnız sunucudadır. Otomatik kayıt kapalıdır.
- Viva'nın kayıt düğmeleri, kayıt rozeti ve tekrarlanan kayıt durum mesajları silindi. Daily'nin kayıt durma olayı arşiv eşleştirmesi için sunucuya bildirilir; hazır dosya Daily API/webhook ile doğrulanır.
- Küçük grup odaları, PiP, emoji tepkileri, görünüm, sabitleme, kamera/mikrofon, sohbet ve ekran/ses paylaşımı Daily'nin kendi kontrollerindedir.
- Herkes için bitir, Viva etkinliğini kalıcı kapatan uygulama işlemidir. Daily'nin kişisel Ayrıl eyleminden farklıdır. Viva yardım penceresi de uygulamaya özgüdür.

Katılımcı ve izleyici kayıt/yönetici yetkisi almaz. İzleyici medya gönderemez. Yeni kayıt menüsü yeni katılım tokenıyla uygulanır; mevcut token değişmez.

Sohbet dosyası üretimi için özel `startRecording({dataOutputs:["chat-webvtt"]})` çağrısı kaldırıldı. Daily'nin yerel kayıt menüsünün sohbet çıktısı üretmesi canlıda doğrulanmadı; bu geçişte sohbet dosyası oluşacağı garanti edilmez. Video ve mevcut dosyaların indirme/yetkilendirme kodları korunur.
