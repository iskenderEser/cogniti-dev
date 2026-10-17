# Renk ortaklaştırması — 4. adım sonucu

**Tarih:** 17 Ekim 2026.  
**Durum:** TAMAMLANDI — ortak buton/form ailesinin kalan renk bağlantıları hazır. Mavi değerler ve renk dışı kaynak korundu; 16/16 hedef test başarılı. Genel CSS'deki mevcut katalog bulgusu aşağıda ayrı kayıtlıdır.

## Değişiklik ve kapsam

- [YenileButonu](../components/ui/yenile-butonu.tsx): Dört sabit renk sınıfı amaç değişkenlerine bağlandı. Normal, hover, yükleniyor, disabled ve yerel `className` kullanım sözleşmesi aynı.
- [Button](../components/ui/button.tsx): Yalnız `destructive` varyantındaki `text-white`, mevcut `text-destructive-foreground` karşılığına bağlandı. Altı varyant, dört boyut, `asChild`, olaylar ve kalan sınıflar korundu.
- [Tema kaynağı](../app/tema.css): Dört yeni amaç değişkeni, iki temada toplam sekiz bildirim olarak eklendi. Önceki **157 bildirim** aynı kaldı.
- [Input](../components/ui/input.tsx) ve [Label](../components/ui/label.tsx): Zaten ortak tema köprüsünü veya kapsamın metin rengini kullanıyorlar. Kaynak değişikliği gerekmedi. `sayfa-yenile.module.css`, `app/globals.css` ve kök `app/layout.tsx` da aynı kaldı.

Ortak bileşenleri doğrudan içe aktaran **44 dosyanın 43'ü** önceki kaynak imzasıyla aynı. Tek değişen tüketici `YenileButonu`; kendi dört renk sınıfı değişti. Tüketici listesi 44 doğrulanmış ekran veya gerçek kullanıcı oturumu anlamına gelmez.

Sayfalardaki yerel buton/form renkleri kendi amaçlarıyla korunur; kalan bu istisnalar iş planının 9. adımında tamamlanır. Bütün form ve sayfaların dönüştürüldüğü iddia edilmez. Bileşen, form, rol, yetki, API, kayıt/puan hesabı veya yerleşim birleştirmesi yapılmadı.

## Eşleme tablosu

| Kaynak / CSS özelliği | Önceki mavi | Ortak karşılık | Yeşil |
| --- | --- | --- | --- |
| Yenile / background-color | Tailwind beyazı `#fff` | `--tema-yenile-yuzey` | `--tema-yuzey` → `#fcfdf8` |
| Yenile / border-color | `#d8e3ee` | `--tema-yenile-cizgi` | `--tema-cizgi` → `#dfe3d7` |
| Yenile / color | `#58708b` | `--tema-yenile-metin` | `--tema-ikincil-metin` → `#68766e` |
| Yenile hover / background-color | `#f4f8fb` | `--tema-yenile-hover` | `--tema-secili` → `#edf2e7` |
| Hata butonu / color | Tailwind beyazı `#fff` | Mevcut `--destructive-foreground` | `--tema-ters-metin` → `#ffffff` |

Yeni değişkenlerin mavi karşılıkları eski değerlerin aynısıdır. Kısa/uzun beyaz HEX yazımı aynı renge çözüldü. Yenile butonunun hover metni, önceki `outline` davranışındaki `accent-foreground` karşılığını kullanmaya devam eder.

Mevcut tema köprüsünden çalışan diğer renkler:

| Kullanım | Mevcut ortak kaynak / mavi | Yeşil |
| --- | --- | --- |
| Default ve link butonu | `primary` → `#56aeff` | `#355545` |
| Default buton metni | `primary-foreground` → `#ffffff` | `#fffdf7` |
| Hata butonu ve hatalı giriş çizgisi | `destructive` → `#e24b4a` | Aynı |
| Outline zemini | `background` → `#ffffff` | `#f6f5ef` |
| Secondary ve hover yüzeyi | `secondary` / `accent` → `#f4f4f5` | `#eef1e6` |
| Secondary ve hover metni | `secondary-foreground` / `accent-foreground` → `#18181b` | `#2c4137` |
| Input çizgisi | `input` → `#e5e7eb` | `#dfe3d7` |
| Input placeholder | `muted-foreground` → `#71717a` | `#68766e` |
| Buton/Input focus | `ring` → `#56aeff` | `#355545` |

Hover'daki %90/%80, odaktaki %50 ve hata halkasındaki %20 oranları aynı kaldı. Şeffaf yüzeyler, `currentColor`, mevcut Tailwind gölge ölçü/değerleri ve disabled opacity kuralları değişmedi. `Label` kendi renk tanımını eklemez; bulunduğu metin kapsamını miras alır.

## Korunum ve test sonucu

- İki uygulama kaynağı, öncesine yalnız kayıtlı **beş renk sınıfı eşlemesi** uygulanarak üretildi ve mevcut dosyalarla byte düzeyinde aynı bulundu. **Renk dışı fark 0**.
- Beş yeni utility kuralı gerçek derleyici çıktısından alındı; mavi değişkenler çözülünce önceki sınıfların CSS'siyle aynı. **Mavi renk farkı 0**.
- Normal, hover, focus, placeholder, invalid ve disabled hallerinden **20 mevcut utility kuralı** önceki derleme çıktısıyla aynı.
- `Button` için altı varyant × dört boyut × iki disabled durumu = **48 statik React çıktısı** karşılaştırıldı. Yenile için yükleniyor/disabled/yerel sınıf kombinasyonlarında **8 çıktı** karşılaştırıldı. Renk sınıfları dışında HTML, içerik, ölçü ve yazı sınıfı farkı **0**.
- Tüketicilerin mevcut sayfa/rol koşulları ve yerel stilleri değişmedi; font, padding, responsive sınıf veya DOM düzenlemesi yapılmadı.

| Kontrol | Sonuç |
| --- | --- |
| Yeni buton/form renk ve davranış testleri | **3/3 başarılı** |
| Mevcut tema testleri | **6/6 başarılı** |
| Operasyonel yenileme sözleşmesi | **2/2 başarılı** |
| Rapor/lig/katalog yenileme sözleşmesi | **3/3 başarılı** |
| Yönetim yenileme sözleşmesi | **2/2 başarılı** |
| Toplam | **16 başarılı, 0 başarısız** |
| `npm run typecheck:build` | Başarılı |
| Dört ortak TSX dosyası ve yeni testin ESLint kontrolü | Hata/uyarı yok |
| PostCSS/Tailwind çalıştırması | Başarılı, uyarı yok; hedef kurallar geçerli |
| Genel serileştirilmiş CSS'nin yeniden ayrıştırılması | Aşağıdaki **mevcut bulgu** nedeniyle temiz değil |

Yeni renk testi gerçek bileşen sınıflarını ve gerçek derleyicinin utility kurallarını kullanır. Happy DOM katman/nesting desteği vermediği için hedef utility kuralları katmansız yüklenir; hover renginin derlenen bildirimi ayrı bir stil probunda çözülür. Mavi → yeşil → mavi geçişi, kardeş ve iç içe mavi kapsamlar kontrol edilir. Bu yöntem gerçek Chrome hover/focus etkileşimi veya piksel karşılaştırması değildir.

React etkileşiminde iki tema altında yenilemenin formu göndermediği, callback'i çalıştırdığı, yükleniyor/disabled hallerinde ikinci çağrıyı engellediği, durum etiketi ve dönen simgeyi koruduğu doğrulandı. Input odağı, label–input bağı ve mevcut form değeri de kontrol edildi. Rol içermeyen bu bileşenlerin testi bütün gerçek rol oturumlarının testi olarak sunulmaz.

```sh
node --import ./tests/_alias.mjs --test tests/formTemaRenkleri.hedef.test.ts tests/temaAltyapisi.hedef.test.ts tests/operasyonelYenileme.smoke.test.ts tests/raporLigKatalogYenileme.smoke.test.ts tests/yonetimYenileme.smoke.test.ts
npm run typecheck:build
npx --no-install eslint components/ui/button.tsx components/ui/yenile-butonu.tsx components/ui/input.tsx components/ui/label.tsx tests/formTemaRenkleri.hedef.test.ts
```

## Ayrı mevcut CSS bulgusu

Genel CSS'yi metin olarak yeniden PostCSS'e verirken `Missed semicolon` hatası görüldü. `docs/renk-envanteri/renk-katalogu.html` içindeki kısaltılmış örnek metin, Tailwind tarafından bir renk sınıfı adayı olarak okunuyor; HTML parçaları geçersiz bir `color` bildirimine dönüşüyor.

Değişiklik öncesinde saklanan derleme çıktısı ile mevcut çıktıda **aynı geçersiz bildirim** var. Bu adımın beş hedef kuralı ayrı ayrıştırılıp karşılaştırıldı; bunların renkleri ve sözdizimi geçerli. Genel CSS'nin bu bulgusu çözülmüş veya tüm derleme çıktısı temiz kabul edilmedi. Renk kataloğu/tarama kapsamı ayrıca ele alınmalıdır; bu işte global tarama yapılandırması değiştirilmedi. Bulgunun önceki/sonraki metni JSON kaydında bulunur.

## Teslim durumu

Kaynak imzaları, 44 tüketicinin listesi, eşlemeler, korunan durum kuralları, test sonuçları ve mevcut CSS bulgusu [JSON kaydındadır](renk-ortaklastirma/adim4/DOGRULAMA.json).

Gerçek tarayıcı kontrolü, SQL/veritabanı işlemi veya canlı dağıtım yapılmadı. Bu testler gerçek çek e-postası/push teslimatını veya puan hesabını doğrulamış sayılmaz. Varsayılan mavi tema aynı; 5. adım henüz başlatılmadı.
