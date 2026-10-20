# Çift tema — 5. adım: tercihin kalıcı kaydı

**Tarih:** 17 Ekim 2026  
**Durum:** Uygulandı. Kullanıcı, sayfa yenileme ve tekrar giriş sonrasında seçimin korunduğunu doğruladı. Canlı dağıtım yapılmadı.

## Yapılanlar

- Hesaba ait tercih, mevcut Supabase Auth `user_metadata` alanındaki `hb_tema` anahtarında saklanıyor. Mevcut mobil karşılama tercihi de aynı metadata mekanizmasını kullanıyordu. Yeni tablo veya kolon gerekmedi.
- `/tema/api` güncel hesabın tercihini okuyor. Yazma isteğinde oturum kimliğiyle istek sahibi karşılaştırılıyor; başka hesap kimliği reddediliyor. Sunucu yalnız `hb_tema` anahtarını güncelliyor; rol ve yetki bu tercihten belirlenmiyor.
- **20 Ekim 2026 güncellemesi:** Hesapta kayıt varsa kendi tercihi uygulanır. Kayıt yoksa `mavi` gösterilir; tarayıcı tercihi hesaba aktarılmaz ve otomatik kayıt yapılmaz. Kalıcı kayıt yalnız kullanıcının renk seçimiyle oluşur. Hesap yüklenirken/geçişinde varsayılan görünüm login için tutulan tarayıcı kaydını değiştirmez.
- **Aynı gün tamamlanan eski kayıt düzeltmesi:** Önceki `hb_tema` değerleri geçersizdir. API yalnız yeni açık seçimle birlikte kaydedilen `hb_tema_surumu = 2` tercihlerini kabul eder. Eski yeşil kayıt bulunan üye ve eczacı dahil bütün hesaplar, yeniden seçim yapılana kadar varsayılan maviyi kullanır.
- **20 Ekim 2026 giriş ekranı düzeltmesi:** Eski ortak `hb_misafir_tema` açılışta kullanılmaz; başlangıç mavidir. Kullanıcının bundan sonraki açık seçimi `hb_tarayici_tema_secimi` ile kendi tarayıcısında korunur. Hesap okuması veya varsayılan görünüm tarayıcı seçimini değiştirmez. Başka hesaba girişte yalnız o hesabın geçerli tercihi, yoksa varsayılan mavi uygulanır; tarayıcı rengi hesaba aktarılmaz veya otomatik yazılmaz.
- Hızlı seçimler sıraya alınarak son seçimin en son kaydedilmesi sağlandı. Hesap değişiminde eski yükleme sonuçları uygulanmıyor ve bekleyen eski hesap işleri gönderilmiyor.
- Kayıt/yükleme hatası kullanıcıya bildiriliyor. Başarısız kayıt kaydedilmiş kabul edilmiyor.

## Değişen kaynaklar

- `lib/tema/temalar.ts`: Tercih anahtarları ve geçerli tema kontrolü.
- `app/tema/api/route.ts`: Hesap tercihinin okunması ve kaydı.
- `app/providers/TemaProvider.tsx`: Tercihin uygulanması ve kaydı.
- `app/layout.tsx`: Tema sağlayıcısının doğrulanmış hesap bağlamını kullanması.

Görsel ölçü, font, tablo yapısı, metrik ve hesaplama değiştirilmedi.

## Doğrulama

- `npm run typecheck:build`: başarılı.
- Değişen dört TS/TSX dosyasının ESLint kontrolü: başarılı.
- Kullanıcı ekran kontrolü: sayfa yenileme ve tekrar girişte seçilen tema korundu; kullanıcı **“evet”** yanıtıyla doğruladı.
- Login güncellemesi için `tests/temaLoginTercihi.hedef.test.ts`: **1/1 başarılı**. Gerçek React sağlayıcısı, sahte DOM ve API ile içeride seçilen yeşilin çıkışta ve login yeniden açıldığında korunması, diğer hesabın kayıtlı mavisinin öncelikli olması ve hesap kayıtlarının ayrı kalması doğrulandı. Hedef lint başarılı.
- Gerçek ikinci cihaz testi tamamlanmış olarak raporlanmıyor; birleşik geçiş/kalıcılık kontrolünde ayrıca doğrulanacak.

**Sıradaki adım 6:** İlk görünümde doğru temayı uygulamak ve yanlış renk parlamasını önlemek.
