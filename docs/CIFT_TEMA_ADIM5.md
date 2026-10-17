# Çift tema — 5. adım: tercihin kalıcı kaydı

**Tarih:** 17 Ekim 2026  
**Durum:** Uygulandı. Kullanıcı, sayfa yenileme ve tekrar giriş sonrasında seçimin korunduğunu doğruladı. Canlı dağıtım yapılmadı.

## Yapılanlar

- Hesaba ait tercih, mevcut Supabase Auth `user_metadata` alanındaki `hb_tema` anahtarında saklanıyor. Mevcut mobil karşılama tercihi de aynı metadata mekanizmasını kullanıyordu. Yeni tablo veya kolon gerekmedi.
- `/tema/api` güncel hesabın tercihini okuyor. Yazma isteğinde oturum kimliğiyle istek sahibi karşılaştırılıyor; başka hesap kimliği reddediliyor. Sunucu yalnız `hb_tema` anahtarını güncelliyor; rol ve yetki bu tercihten belirlenmiyor.
- Hesapta kayıt varsa tarayıcı tercihinden öncelikli. Kayıt yoksa onaylanan kurala göre giriş öncesi seçim, o da yoksa `mavi` uygulanıp hesaba kaydediliyor.
- Login ekranı kullanıcının sonradan onayladığı B davranışını izliyor: `hb_misafir_tema` tarayıcı kaydı son kullanılan görünümü tutuyor. İçerideki seçim de bu görünümü güncelliyor; çıkışta login aynı temada kalıyor. Girişte hesabın kayıtlı tercihi öncelikli; farklı hesapların mevcut kayıtları değiştirilmez.
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
