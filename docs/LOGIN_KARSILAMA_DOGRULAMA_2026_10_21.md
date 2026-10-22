# Cogniti karşılama ve giriş — 21 Ekim 2026

Onaylanan modalsız mockup, gerçek `app/login/page.tsx` sayfasına uygulandı.

- İlk görünüm: mevcut Cogniti içeriği, solda logo ve sağda Giriş Yap.
- Giriş görünümü: navbar kapanır; logo ve form üst üste ortalanır.
- “← Cogniti’yi tanıyın” aynı içeriğe, önceki kaydırma konumuna döner.
- Sözleşmeler ve şirket iletişimi alt bilgidedir; Görünüm anahtarı burada çalışır.
- Logo dosyaları korunur. Form butonları, bağlantılar, seçim kutusu ve odak çizgileri ortak kontrol renklerini kullanır; mavi eylem `#237AC8` değeridir.
- E-posta/telefon girişi, beni hatırla, şifre gösterme, sıfırlama, bekleyen davet ve firma aktiflik kontrolü korunur.
- Oturumsuz tema seçimi yalnız tarayıcıda saklanır. Hesapların kendi kayıtlı temaları korunur ve girişte okunur.
- Panel ve mobil menülerdeki Hakkında bağlantısı kaldırıldı. İlk mobil girişte Hakkında açma ve bunun metadata kaydı kaldırıldı.
- İç kullanıcı `/ana-sayfa`, admin `/admin`, E-Club kişisi `/eclub/ana-sayfa`, Eczanem üyesi `/eczanem` adresine gider.
- Eski `/hakkinda` adresi kullanıcı kararıyla yönlendirme bırakılmadan kaldırıldı.

## Doğrulama

İlk uygulamanın hedefli kontrol gruplarında toplam **92 test başarılı**, başarısız test yok:

- Giriş/karşılama akışı: 35 test. Gerçek React sayfası ve Cogniti içerik bileşeni, sahte Auth/API servisleriyle çalıştırıldı. E-posta, telefon başarısı/hatası, hatırlama tercihi, şifre gösterme, sıfırlama başarısı/hatası, bekleyen davet, kapalı firma, tüm tanımlı iç roller ve dış kullanıcı yönleri kapsandı.
- Tema, navbar, üye sayfaları ve URL geçişi: 40 test. Oturumsuz tema seçiminin hesaba taşınmaması ve hesapsız API yazımı yapmaması da doğrulandı.
- Yerel tema/sözleşme portalı, panel renkleri, navbar özeti ve mobil FirmaStore regresyonları: 17 test.

`npm run typecheck:build` başarılı. Değişen uygulama ve test kaynaklarında ESLint hatası yok. PanelNavbar'da önceden var olan firma logosuna ilişkin bir `no-img-element` uyarısı bulunuyor. `git diff --check` başarılı.

Yerel çalışan Next.js sunucusunda `/login` HTTP 200; SSR çıktısında yeni içerik ve giriş alanı mevcut. Yeni CSS dosyası Next.js tarafından derlenip sunuluyor; ortak kontrol renkleri, gizli görünüm kuralı ve mobil medya kuralı çıktıda doğrulandı. Bu kontrolden sonra kullanıcı isteğiyle `/hakkinda` yönlendirmesi ve sayfa dosyası kaldırıldı.

## Kontrol sınırları

Yerel tarayıcı aracı “Local browser use is disabled in Work settings” yanıtı verdi. Ajan gerçek tarayıcıda mobil/masaüstü görsel son kontrol ve gerçek kullanıcı oturumuyla giriş yapmadı. Kullanıcı daha sonra “yeni sayfa test edildi. başarılı” bildirimiyle yeni sayfanın testini doğruladı; cihaz ve rol kapsamı ayrıca belirtilmedi. Testler gerçek hesap/veritabanı verisi kullanmaz; gerçek şifre sıfırlama e-postası gönderilmedi. Canlı dağıtım ve commit yapılmadı.
