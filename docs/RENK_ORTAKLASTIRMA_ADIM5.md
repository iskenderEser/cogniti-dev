# Renk ortaklaştırması — 5. adım sonucu

**Tarih:** 17 Ekim 2026.  
**Durum:** TAMAMLANDI — ortak pill, rozet, tarih ve durum renkleri ortak kaynağa bağlı. Mavi değerler, işlevsel palet ve renk dışı kaynak korundu; 45/45 hedef test başarılı.

## Yapılan değişiklik

| Grup | Kaynak ve sonuç |
| --- | --- |
| Nötr ve teknik pill | `Pill.tsx` ve `TeknikPill.tsx` içindeki yüzey, metin ve çizgiler bağlandı; seçili olmayan PillButon aynı amaç karşılıklarını alır |
| Üretim yöntemi | `VaryantPill.tsx` içindeki hazır araç, hazır soru ve İÜ paletleri ayrı korunarak bağlandı |
| Üretim durumu | `lib/utils/durum/mesaj.ts` içindeki yedi renk üçlüsü bağlandı; 20 durumun üretici/İÜ eşlemeleri ve metinleri aynı |
| Hedef rol | `talepler/_types.ts` içindeki beş hedefin renkleri bağlandı; katalog ve iki E-Club yayın görünümünün alpha halkaları geçerli ortak karşılıklara geçirildi |
| Araç türü | `turSunumu.ts` ve `YayinTuruPill.tsx`: dört türün metni, zemini ve beyaz kenarı bağlandı; etiket ve boyutlar aynı |
| Badge | Yalnız destructive varyantının beyaz metni mevcut `destructive-foreground` karşılığına bağlandı |
| Tarih | `tarih-pill.module.css` içindeki üç renk mevcut yüzey, çizgi ve ikincil metin değişkenlerine bağlandı |
| Üretim filtresi rozeti | `DurumAnahtari.tsx` içindeki beyaz sayaç metni ortak ters metin rengine bağlandı |
| Çek talebi | `eclubStoreTipler.ts` içindeki yedi durumun renk üçlüleri bağlandı; kod, etiket ve görünürlük kümeleri aynı |
| Çek günleri | `EclubHediyeCekiGunleriPill.tsx` içindeki açık/yakın/kapalı renkleri bağlandı; süre, 10 gün sınırı, metin, title ve nokta koşulu aynı |
| Teslimat rozeti | `CekTakipKarti.tsx` içindeki yedi teslimat durumunun 21 Tailwind renk sınıfı bağlandı; teslimat hesabı ve etiketler aynı |

**17 uygulama kaynağı** renk amacıyla değişti; bu sayıya `app/tema.css` dahildir. `AsamaPill`, `HedefRolPill`, `DurumPill` ve `TarihPill` kaynaklarının değiştirilmesi gerekmedi; mevcut bağımlılıkları üzerinden renkleri alırlar.

Taranan doğrudan modül tüketicisi listesindeki **90 dosyanın 83'ü** önceki kaynak imzasıyla aynı. Değişen yedisi bu teslimin kaynak listesindedir. Liste tür importlarını da içerir; 90 ekran veya gerçek rol oturumu doğrulanmış anlamına gelmez.

Bileşenler birleştirilmedi. DOM, font, ölçü, konum, sarmalama, responsive sınıf, rol/erişim, metrik, işlem ve kayıt akışlarında değişiklik yapılmadı. Sayfalardaki diğer yerel rozet/renk istisnaları, dosya türü ve kullanılmayan talep türü sözlükleri kalan yerel kapsamla birlikte 9. adımda izlenir.

## Ortak renk karşılıkları

Önceki **165 tema bildirimi** aynı kaldı. 114 amaç değişkeni, toplam 116 bildirim eklendi:

| Grup | Yeni değişken | İki temadaki davranış |
| --- | ---: | --- |
| Nötr pill | 2 | Temaya göre değişir |
| Üretim yöntemi | 9 | Mevcut üç palet sabit |
| Üretim durumu | 21 | Mevcut yedi palet sabit |
| Hedef rol ve alpha halkaları | 22 | Beş rolün ayrı paleti, beş `%20` ve iki `22` alpha halkası sabit |
| Araç türü ve ortak beyaz kenar | 9 | Dört türün ayrı paleti ve saydamlıkları sabit |
| Çek talebi durumu | 21 | Yedi durumun ayrı paleti sabit |
| Çek günleri | 9 | Açık/yakın/kapalı ayrımı sabit |
| Çek teslimat durumu | 21 | Yedi durumun mevcut Tailwind tonları sabit |
| **Toplam** | **114** | **2 temaya bağlı, 112 işlevsel ve sabit** |

Temaya uyarlanan nötr ve tarih karşılıkları:

| Kullanım | Mevcut mavi | Yeşil |
| --- | --- | --- |
| Nötr pill zemini | `#f3f4f6` | Bilgi zemini `#eef1e6` |
| Nötr/teknik pill metni | `#4b5563` | İkincil metin `#68766e` |
| Teknik pill zemini | `#f9fafb` | Ana zemin `#f6f5ef` |
| Pill çizgisi | `#e5e7eb` | `#dfe3d7` |
| Pasif PillButon metni | `#6b7280` | `#68766e` |
| Tarih zemini/metni/çizgisi | `#fff` / `#6b7280` / `#e5e7eb` | `#fcfdf8` / `#68766e` / `#dfe3d7` |

İşlevsel renkler yeşil temada yeni bir tona zorlanmadı. Mevcut ayrımlar [başlangıç envanterindeki tablolarda](renk-envanteri/RAPOR.md), her yeni değişkenin mavi/yeşil tanımı ve çözülmüş değeri [bu adımın JSON kaydında](renk-ortaklastirma/adim5/DOGRULAMA.json) bulunur. Farklı amaçlar aynı HEX'i kullansa da ayrı anlam değişkenleri korunur.

Saydamlık korunumu:

- Araç pili zemininin `e8` alpha değeri, ortak CSS'deki tam zemin renginin parçası oldu. `sunum.zemin` artık uygulanacak zemin karşılığını taşır; bileşendeki HEX eki kaldırıldı. Böylece CSS değişkenine HEX eki yapıştırılmaz. Etiket ve alan adları aynı.
- Beyaz araç kenarı `%60` olarak (`#ffffff99`) korundu.
- Katalog hedef rol halkası `33` (`%20`), E-Club hedef rol halkası `22` (`34/255`) değerini aynı tam renk karşılığından alır.
- Teslimat renkleri yaklaşık HEX ile değiştirilmedi; mevcut 19 Tailwind `--color-*` kaynağına bağlandı. İki temada da aynı OKLCH değerleri çözülür.
- Pill kenarı 0,5 px, PillButon kenarı 1 px; gradyan/gölge ölçüleri, opaklık ve tüm yazı/boyut sınıfları aynı kaldı.

## Doğrulama

- Kayıtlı renk eşlemeleri geri çevrilince 17 kaynağın tamamı öncesiyle byte düzeyinde aynı: **renk dışı fark 0**.
- 80 nesne renk alanı mavi karşılığıyla çözülerek eski değeriyle karşılaştırıldı. Araç zemini mevcut uygulanmış `e8` karşılığıyla karşılaştırıldı: **mavi değer farkı 0**.
- Tarih CSS'sinin **16 bildirimi**, mavi renkler çözüldüğünde öncekiyle aynı. Masaüstü görünürlük medya kuralı korundu.
- Teslimatın **21 yeni utility kuralı**, önceki Tailwind renk sınıflarıyla gerçek derlemede karşılaştırıldı; mavi/yeşil farkı 0. Beyaz araç kenarının gerçek çıktısı ve gereken 19 Tailwind renk kaynağı mevcut.
- Çek günlerinin null/açık/kapalı ve 10 gün sınırını içeren **6 statik çıktısı**, teslimat rozetinin **7 çıktısı** öncesiyle karşılaştırıldı. Renk karşılıkları dışında metin, sınıf, durum koşulu ve HTML farkı 0.

| Kontrol | Sonuç |
| --- | --- |
| Yeni pill renk/davranış testleri | **3/3 başarılı** |
| Mevcut tema, üretim filtresi/araç metni, çek durumu/Hediye Takibi/outbox testleri | **39/39 başarılı** |
| Yalnız YayinTuruPill ile ilgili mevcut tipografi testleri | **3/3 başarılı** |
| Toplam | **45 başarılı, 0 başarısız** |
| TypeScript | Başarılı |
| 15 uygulama TS/TSX kaynağının ESLint kontrolü | Hata 0; mevcut uyarı 1; yeni bulgu 0 |
| İki test dosyasının ESLint kontrolü | Hata/uyarı yok |
| PostCSS/Tailwind çalıştırması ve hedef CSS kuralları | Başarılı, derleyici uyarısı yok |

Yeni testte **31 rol girdisi × 20 üretim durumu × 2 tema** mevcut renk/metin/top-kimde kaydıyla karşılaştırılır. Ayrıca beş hedef rol, dört araç, yedi çek durumu, alpha halkaları ve gerçek bileşenlerin stilleri kontrol edilir. Nötr, teknik, tarih, Badge, araç ve üretim durumu stilleri mavi → yeşil → mavi geçişinde; iç mavi kapsamla birlikte sınanır. PillButon callback'i, seçimi ve formu göndermemesi korunur.

Bu testler gerçek kullanıcı oturumlarını veya yetki kapılarını çalıştırmaz. Happy DOM'da hedef derlenmiş kurallar katmansız yüklenir; OKLCH teslimat renkleri gerçek derleme çıktısı ve ortak kaynak çözümlemesiyle doğrulanır. Gerçek Chrome etkileşimi veya piksel karşılaştırması yapılmış sayılmaz.

```sh
node --import ./tests/_alias.mjs --test tests/pillTemaRenkleri.hedef.test.ts
node --import ./tests/_alias.mjs --test tests/temaAltyapisi.hedef.test.ts tests/uretimDurumFiltresi.smoke.test.ts tests/ogrenmeAraciPillEtiketleri.smoke.test.ts tests/eclubStoreDurumSozlesmesi.hedef.test.ts tests/eclubHediyeTakipDurumlari.hedef.test.ts tests/eclubCekTeslimatOutbox.hedef.test.ts
node --import ./tests/_alias.mjs --test --test-name-pattern YayinTuruPill tests/yayinKartiTipografi.smoke.test.ts
npm run typecheck:build
npx --no-install eslint tests/pillTemaRenkleri.hedef.test.ts tests/yayinKartiTipografi.smoke.test.ts
```

Uygulama kaynakları aynı dosya yollarıyla ESLint API'sinde önceki ve sonraki halleriyle karşılaştırıldı. Mevcut tek uyarı `UreticiYayinKatalogu.tsx:307` içindeki `react-hooks/exhaustive-deps` (`kapsam`) uyarısıdır; aynı kaldı.

[4. adımda kaydedilen](RENK_ORTAKLASTIRMA_ADIM4.md) genel CSS katalog hatası, bu adımın çıktısında da aynı geçersiz bildirimle mevcut. Hedef kurallar geçerli; genel serileştirilmiş CSS'nin tamamı temiz veya bu ayrı bulgu çözülmüş sayılmaz.

## Veri, teslimat ve yayın durumu

Çek teslimatı kaynak akışı tekrar incelendi: `eclub_cek_teslimat_outbox.sql`, e-postayı eczanenin tek aktif ana eczacısına; push işlerini aynı eczanede aktif bağı ve Auth hesabı bulunan E-Club kişilerine hazırlar. E-posta worker'ı kuyruktaki adrese gönderir; push worker'ı kuyruktaki Auth kimliğini `pushYayinlaSonuclu` akışına aktarır. Bu kaynaklar değiştirilmedi. Alıcı veya teslimat davranışı renk sözlüğüne bağlı değil; gerçek e-posta/push teslimatı doğrulanmış sayılmaz.

SQL çalıştırılmadı, veritabanına test kaydı yazılmadı ve canlı dağıtım yapılmadı. Hediye Takibi fiziksel testi park edilmiş durumdadır. **Hediye Takibi test verileri silinecek.** Açık temizlik talimatı ve başarı sonucu gelene kadar kayıtlar korunur. 6. adım başlatılmadı.
