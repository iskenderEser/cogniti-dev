# Renk ortaklaştırması — 2. adım sonucu

**Tarih:** 17 Ekim 2026.  
**Durum:** TAMAMLANDI — renk bağlantıları, mevcut mavi değerlerin korunumu, iki tema ve etkileşim davranışları doğrulandı. Ek gerçek tarayıcı kontrollerinin kapsamı aşağıda ayrı kayıtlıdır.

**Tamamlanma ölçütünün düzeltilmesi:** Bu kontrollerde renkler ekran boyutuna göre değişmez; aynı ortak tema değişkenleri mobil ve masaüstünde kullanılır. Mevcut medya kuralları yalnız min-width, gap, min-height ve font-size düzenler; bu kurallar değiştirilmedi. Mobil yeşil görüntüsünü ve ek tarayıcı ölçümlerini renk ortaklaştırmasının tamamlanma şartı yapmak gereksizdi. 40/40 hedef kontrol, CSS derlemesi ve 221 bildirimin korunumu bu adımın doğrulamasıdır; yapılmayan tarayıcı kontrolleri yapılmış sayılmadan adım kapatıldı.

## Yapılan değişiklik

- [Sade Kontroller CSS](../components/kontrol/sade-kontroller.module.css): İlk altı yerel renk, 1. adımda hazırlanan ortak değişkenlere bağlandı. Odak, ok, seçili kapsül metni ve gölge renkleri de ortak kaynaktan alınır. Kişi, tablo, form, arama, menü, kapsül, sekme, native seçim ve tarih stillerinin mevcut farklılıkları korunur.
- [Tema kaynağı](../app/tema.css): Seçili kontrol metni, odak ve üç gölge rengi için gereken beş karşılık eklendi. İlk altıyla birlikte kontrol grubu her temada 11 ortak renk kullanır. Yeşil karşılıklar mevcut onaylı paletten çözülür; gölgelerin mevcut %5, %16 ve %20 saydamlıkları korunur.
- [Radix Select](../components/ui/select.tsx): Yalnız iki sabit focus renk sınıfı, aynı amaçtaki ortak değişkenlere bağlandı. Portal, olay, seçim, klavye, scroll ve prop sözleşmesi değiştirilmedi.
- `SadeKontroller.tsx`, `KisiKontroller.tsx`, dönem/yayın türü ve temsilci sarmalayıcıları için kaynak değişikliği gerekmedi; mevcut stilleri üzerinden geçişi alırlar.

Bileşen birleştirme, DOM, ölçü, font, yerleşim, metrik veya kayıt davranışı değişikliği yapılmadı. Sayfalardaki mevcut yerel `className`/stil istisnaları aynı kaldı; bunların kalan renk kapsamı iş planının 9. adımında izlenir.

## Eklenen renk karşılıkları

İlk altı renk [1. adım eşleme tablosunda](RENK_ORTAKLASTIRMA_ADIM1.md) kayıtlıdır. Bu adımın ekleri:

| Ortak değişken | Mevcut mavi | Yeşil karşılık |
| --- | --- | --- |
| `--tema-kontrol-eylem-metin` | `#fff` | `var(--tema-eylem-metin)` |
| `--tema-kontrol-odak` | `#237ac8` | `var(--tema-odak)` |
| `--tema-kontrol-golge` | `rgba(36,64,98,.05)` | Eylem rengi, %5 opaklık |
| `--tema-kontrol-menu-golge` | `rgba(31,74,111,.16)` | Eylem rengi, %16 opaklık |
| `--tema-kontrol-secili-golge` | `rgba(35,122,200,.2)` | Eylem rengi, %20 opaklık |

Gölge değişkenleri yalnız renk taşır; offset ve blur ölçüleri mevcut kontrol CSS'sinde aynen bırakıldı. Yeşil gölgeler `color-mix` ile onaylı eylem renginden üretilir.

## Korunum ve etki kontrolü

- Değişiklik öncesi ve sonrası **221 CSS bildirimi**, seçici/medya koşulu/özellik/değer/sıralama/`!important` bakımından karşılaştırıldı. Yeni ortak renkler mavi karşılıklarıyla çözüldüğünde önceki kaynakla birebir aynı sonuç elde edildi: **mavi değer farkı 0, renk dışı fark 0**.
- 15 bildirimin yalnız renk ifadesi değişti. Medya koşulları, boyutlar, fontlar, padding/gap, köşeler, gölge ölçüleri ve opacity kuralları korundu.
- Hazır eşlemedeki **57 aile dışı doğrudan kullanım dosyasının 56'sı** önceki kaynak imzasıyla aynı. Tek değişen `components/ui/select.tsx`; farkı yalnız iki focus renk sınıfından ibaret.
- Önceden kayıtlı **47 rota**, olası etki referansıdır; 47 gerçek ekranın veya bütün rollerin tarayıcı testi yapıldığı anlamına gelmez.
- `app/layout.tsx` renk görüntüsü almak için geçici değiştirilip test öncesiyle byte düzeyinde aynı duruma getirildi. Varsayılan mavi tema ve önceki kullanıcı değişiklikleri korunur. Geçici viewport ayarı kaldırıldı.

## Otomatik doğrulama

| Kontrol | Sonuç |
| --- | --- |
| Tema hedef testleri | **6/6 başarılı** |
| Gerçek CSS yüklü Sade Kontroller testleri — mavi kök tema | **17/17 başarılı** |
| Aynı davranış testleri — yeşil kök tema | **17/17 başarılı** |
| Toplam | **40 başarılı, 0 başarısız** |
| `npm run typecheck:build` | Başarılı |
| Değişen Select ve iki test dosyasının ESLint kontrolü | Başarılı; hata/uyarı yok |
| Mevcut PostCSS/Tailwind yapılandırmasıyla global CSS derlemesi | Başarılı; uyarı yok |
| Select'in iki yeni focus sınıfının derlenmiş çıktısı | İki kural da mevcut |

Testler gerçek kontrol CSS'siyle renk çözümlemesini; mavi → yeşil → mavi geçişini, kardeş/iç içe kapsamları, menü/seçenek/kapsül/sekme/native/tarih renklerini ve disabled durumunu kapsar. React testlerinde tekli/çoklu seçim, arama, boş sonuç, klavye, kapanma/odak dönüşü, ay/tarih, form değeri, kişi/rol gösterimi ve Hediye Takibi sekmesi korunmuştur.

Çalıştırılan komutlar:

```sh
node --import ./tests/_alias.mjs --test tests/temaAltyapisi.hedef.test.ts tests/sadeKontroller.hedef.test.ts
HAPBILGI_TEST_TEMA=yesil node --import ./tests/_alias.mjs --test tests/sadeKontroller.hedef.test.ts
npm run typecheck:build
./node_modules/.bin/eslint components/ui/select.tsx tests/temaAltyapisi.hedef.test.ts tests/sadeKontroller.hedef.test.ts
```

Başarılı kontroller, yeni bir uygulama değişikliği olmadığı için kesinti sonrasında tekrar çalıştırılmadı.

## Gerçek tarayıcıda yapılan ek kontroller

Kapsam yalnız mevcut UTT → Ürün Eğitimleri (`/videolarim/urun`) oturumudur. Bu ekran diğer sayfa ve rolleri temsil etmez.

| Kontrol | Durum / kanıt |
| --- | --- |
| 1440 × 1000 mavi, değişiklik öncesi | [Görüntü](renk-ortaklastirma/adim2/mavi-once.png) |
| 1440 × 1000 mavi, değişiklik sonrası | [Görüntü](renk-ortaklastirma/adim2/mavi-sonra.png) |
| 1440 × 1000 yeşil, gerçek uygulamadaki kapsül ve seçim kontrolü | [Görüntü](renk-ortaklastirma/adim2/yesil-gercek-1440.png) |
| 390 × 844 mavi | [Görüntü](renk-ortaklastirma/adim2/mavi-gercek-390.png) |
| 390 × 844 yeşil | Doğrulanamadı; derleme göstergesi açıkken alınan mavi görüntü yeşil doğrulaması olarak kullanılmadı |
| Açık menü, hover ve focus'un gerçek tarayıcı etkileşimi | Doğrulanamadı; tıklama/ölçüm bağlantısı yanıt vermedi. Otomatik renk ve davranış sonuçları bu sınırdan ayrı raporlandı |
| Hesaplanmış DOM stil/ölçü karşılaştırması | Doğrulanamadı; kaynak korunumu ölçülmüş DOM sonucu olarak sunulmaz |

Chrome'un mevcut ekran okuma erişimiyle görüntüler alınabildi. Tıklama/ölçüm bağlantısı hata verdi. Ayrı macOS uygulama erişimi denenmeyecek veya yeni izin istenmeyecek; kullanıcı bu izin denemesini durdurdu. Bu ek tarayıcı kontrollerinin yapılmamış olması kayıtlıdır; aynı renkleri farklı ekran boyutlarında yeniden doğrulamak bu adımın kapanış şartı değildir. Otomatik renk ve menü davranışı testleriyle gerçek tarayıcı etkileşimi birbirine karıştırılmaz.

Kaynak/otomatik sonuç ve tarayıcı ayrımı [JSON kaydında](renk-ortaklastirma/adim2/DOGRULAMA.json) bulunur. Tüm rollerin kalan gerçek kullanım kontrolü ayrıca iş planının 9. adımındadır.

## Veri ve yayın durumu

Veritabanı/SQL işlemi, sahte sipariş veya test kaydı oluşturma, puan/teslimat işlemi ve canlı dağıtım yapılmadı. Bu renk testleri gerçek çek e-postası veya push teslimatını doğrulamış sayılmaz. Eczacıya e-posta ve aynı eczanedeki E-Club üyelerine push teslimatı kuralının canlı kontrol durumu değişmedi.

Hediye Takibi uçtan uca testi park edilmiş durumdadır. **Hediye Takibi test verileri silinecek.** Temizlik talimatına kadar kayıtlar korunur.
