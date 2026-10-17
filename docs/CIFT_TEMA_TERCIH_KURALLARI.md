# Çift tema — 2. adım: tercihin saklanma davranışı

**Tarih:** 17 Ekim 2026  
**Durum:** 2. adım tamamlandı; ilk giriş davranışı kullanıcı tarafından onaylandı. Kalıcı kayıt da [5. adımda uygulandı](CIFT_TEMA_ADIM5.md).

Çift tema planının 1. adımı ve mobil/tablet görünüm kontrolü olan 1,5. adımı kullanıcı tarafından tamamlandı. Bu belge yalnız 2. adımın davranış kurallarını kaydeder.

## Tercih kuralları

| Durum | Uygulanacak kural | Amaç |
|---|---|---|
| Varsayılan görünüm | Mevcut `mavi` kimliği: kırık beyaz–mavi. İkinci seçenek `yesil`: sütlü kahve–yeşil. | Onaylanan iki görünümü ve mevcut varsayılanı korumak. |
| Hesabın kayıtlı tercihi var | Girişten sonra hesap tercihi uygulanır; giriş öncesindeki tarayıcı tercihinden önceliklidir. | Kullanıcının kendi seçimini her cihazda kullanmak. |
| Giriş öncesi kullanım | Login ekranı, kullanıcının B seçeneği onayıyla, bu tarayıcıda son kullanılan temayı korur. Böyle bir seçim yoksa mevcut varsayılan uygulanır. Giriş yapıldığında hesabın kayıtlı tercihi önceliklidir. | Giriş ekranında da kullanıcının son görünümünü korumak. |
| Başka cihazdan değişiklik | Kullanıcı tercihini her cihazdan değiştirebilir. Son başarıyla kaydedilen tercih sonraki girişte veya sayfa yeniden açıldığında uygulanır. | Cihaz değişiminde hesabın güncel tercihini korumak. |
| Aynı cihazda farklı hesaplar | Hesap kaydı doğrulanmış kimliğe bağlıdır. Login ekranı tarayıcının son görünümünü gösterir; başka hesabın kayıtlı tercihi bununla değiştirilmez. Henüz tercihi olmayan hesap için aşağıdaki ilk giriş kuralı geçerlidir. | Hesapların kayıtlarını ayrı tutmak. |
| Kayıt başarısız | Tercih kalıcı olarak kaydedilmiş kabul edilmez; kullanıcıya bildirilir. | Kaydedilmeyen seçimin saklanmış gibi sunulmaması. |
| Hesabın henüz kayıtlı tercihi yok | Kullanıcının onayladığı kural: Giriş öncesinde tarayıcıda seçtiği tema korunur; seçim yoksa varsayılan kırık beyaz–mavi uygulanır. | İlk girişte kullanıcının mevcut seçimini korumak. |

## Koddan doğrulanan mevcut durum

- `app/providers/AuthProvider.tsx`, bütün hesap türleri için doğrulanmış `user.id` değerini `AuthKullanici.id` olarak sunuyor. Tercih sahipliği e-posta veya ad üzerinden kurulmayacak.
- `app/providers/TemaProvider.tsx` mevcut seçimi ve kök HTML'nin `data-tema` değerini yönetiyor. 5. adımda hesap tercihinin `/tema/api` üzerinden, giriş öncesi tercihin ise ayrı bir tarayıcı kaydı üzerinden saklanması eklendi.
- `lib/tema/temalar.ts` mevcut tema kimliklerini ve varsayılan `mavi` değerini tanımlıyor.

## Uygulama sınırı

2. adımda yalnız davranış kuralları kaydedildi. 5. adımda mevcut hesabın `user_metadata` alanı kullanıldı; yeni tablo veya kolon eklenmedi. İlk açılışta yanlış tema parlamasının önlenmesi 6. adımın konusu.
