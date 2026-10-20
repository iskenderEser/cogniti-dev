# Çift tema — 2. adım: tercihin saklanma davranışı

**Tarih:** 17 Ekim 2026  
**Durum:** 2. adım tamamlandı; ilk giriş davranışı kullanıcı tarafından onaylandı. Kalıcı kayıt da [5. adımda uygulandı](CIFT_TEMA_ADIM5.md).

**20 Ekim 2026 — Güncel kullanıcı kararı:** Tema her hesap için bağımsızdır. Tercihi olmayan hesap varsayılan maviyle açılır; giriş ekranının tarayıcı tercihi hesaba aktarılmaz veya otomatik kaydedilmez. Bu karar önceki ilk giriş kuralının yerini alır.

**Eski tercihlerin geçersizleştirilmesi:** Eski `hb_tema` kayıtları otomatik aktarım ile gerçek kullanıcı seçimini ayırmadığı için geçerli tercih sayılmaz. Bütün hesaplar varsayılan maviyle başlar. Yalnız düzeltmeden sonra kullanıcının açık renk seçimiyle yazılan `hb_tema_surumu = 2` kaydı kabul edilir. Eski yeşil kayıt, aynı veya farklı tarayıcıdan girişte yeniden uygulanmaz. Bu işlem toplu hesap/veri silme veya kullanıcı kimliği değişikliği gerektirmez.

**Giriş ekranı davranışı — 20 Ekim 2026:** Kullanıcı yeşil seçtiğinde kendi tarayıcısında `/login` yeşil açılır; açık mavi seçiminde mavi açılır. Tarayıcıda seçim yoksa varsayılan mavi uygulanır. Bu kayıt başka hesabın tercihi olarak uygulanmaz veya hesaba otomatik yazılmaz. Önceki “her zaman mavi” değişikliği kullanıcının talimatını yanlış yorumlayan uygulamaydı ve kaldırıldı.

**Varsayılan açılış düzeltmesi:** Eski ortak `hb_misafir_tema` kaydı açılışta kullanılmaz. Açılış mavidir; yalnız bu düzeltmeden sonra yapılan açık seçim `hb_tarayici_tema_secimi` kaydına yazılır ve sonraki açılışta kullanılır. Böylece eski yeşil kayıt varsayılan maviyi ezmez, yeni açık yeşil seçim ise kullanıcının kendi tarayıcısında korunur.

Çift tema planının 1. adımı ve mobil/tablet görünüm kontrolü olan 1,5. adımı kullanıcı tarafından tamamlandı. Bu belge yalnız 2. adımın davranış kurallarını kaydeder.

## Tercih kuralları

| Durum | Uygulanacak kural | Amaç |
|---|---|---|
| Varsayılan görünüm | Mevcut `mavi` kimliği: kırık beyaz–mavi. İkinci seçenek `yesil`: sütlü kahve–yeşil. | Onaylanan iki görünümü ve mevcut varsayılanı korumak. |
| Hesabın kayıtlı tercihi var | Girişten sonra hesap tercihi uygulanır; giriş öncesindeki tarayıcı tercihinden önceliklidir. | Kullanıcının kendi seçimini her cihazda kullanmak. |
| Giriş öncesi kullanım | Login ekranı tarayıcıda son açık seçilen renkle açılır; seçim yoksa varsayılan mavi kullanılır. | Kullanıcının kendi tarayıcısındaki açılış seçimini korumak. |
| Başka cihazdan değişiklik | Kullanıcı tercihini her cihazdan değiştirebilir. Son başarıyla kaydedilen tercih sonraki girişte veya sayfa yeniden açıldığında uygulanır. | Cihaz değişiminde hesabın güncel tercihini korumak. |
| Aynı cihazda farklı hesaplar | Girişten sonra yalnız hesabın kendi geçerli tercihi, yoksa varsayılan mavi uygulanır. Tarayıcı açılış rengi hesaba aktarılmaz. Hesap okuması tarayıcı seçimini değiştirmez; yalnız açık seçim değiştirir. | Hesapların kayıtlarını ayrı tutmak. |
| Kayıt başarısız | Tercih kalıcı olarak kaydedilmiş kabul edilmez; kullanıcıya bildirilir. | Kaydedilmeyen seçimin saklanmış gibi sunulmaması. |
| Hesabın henüz kayıtlı tercihi yok | Varsayılan kırık beyaz–mavi uygulanır. Tarayıcının son rengi hesaba aktarılmaz; kullanıcı renk seçmedikçe hesap tercihi yazılmaz. | Önceki kullanıcının seçiminin başka hesaba taşınmasını önlemek. |
| Hesap tercihi yükleniyor veya okunamıyor | Varsayılan mavi gösterilir; önceki hesabın rengi kullanılmaz. Geçici görünüm login için saklanan tarayıcı kaydını değiştirmez. | Hesap geçişi ve okuma hatasında da renkleri bağımsız tutmak. |

## Koddan doğrulanan mevcut durum

- `app/providers/AuthProvider.tsx`, bütün hesap türleri için doğrulanmış `user.id` değerini `AuthKullanici.id` olarak sunuyor. Tercih sahipliği e-posta veya ad üzerinden kurulmayacak.
- `app/providers/TemaProvider.tsx` mevcut seçimi ve kök HTML'nin `data-tema` değerini yönetiyor. 5. adımda hesap tercihinin `/tema/api` üzerinden, giriş öncesi tercihin ise ayrı bir tarayıcı kaydı üzerinden saklanması eklendi.
- `lib/tema/temalar.ts` mevcut tema kimliklerini ve varsayılan `mavi` değerini tanımlıyor.

## Uygulama sınırı

2. adımda yalnız davranış kuralları kaydedildi. 5. adımda mevcut hesabın `user_metadata` alanı kullanıldı; yeni tablo veya kolon eklenmedi. İlk açılışta yanlış tema parlamasının önlenmesi 6. adımın konusu.
