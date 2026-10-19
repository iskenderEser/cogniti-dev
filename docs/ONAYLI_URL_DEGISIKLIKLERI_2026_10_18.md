# Onaylı URL değişiklikleri — 18.10.2026

## Durum

Onaylanan değişiklikler yerel uygulama koduna işlendi. URL çalışmasında veritabanı değişikliği veya dağıtım yapılmadı. Kullanıcı 18.10.2026 tarihinde gerçek kullanıcı oturumlarıyla son ekran ve akış kontrollerini yaptığını ve doğruladığını bildirdi; URL işi kullanıcı doğrulamasıyla tamamlandı.

Bu dosya, `ROL_BAZLI_SIDEBAR_URL_INCELEMESI.md` içindeki ilk önerilerden sonra kullanıcıyla rol rol kesinleştirilen kararların uygulama kaydıdır.

## Uygulanan adresler

| Önceki adres | Yeni adres — tıklanabilir |
| --- | --- |
| `/cc-ligi` | [/c-club-ligi](http://localhost:3000/c-club-ligi) |
| `/eclub/ligi` | [/e-club-ligi](http://localhost:3000/e-club-ligi) |
| `/eclub/eczanelerim` | [/eclub/eczaneler-takimim](http://localhost:3000/eclub/eczaneler-takimim) |
| `/videolar` | [/ogrenme-araclari](http://localhost:3000/ogrenme-araclari) |
| `/store/siparisler` | [/store/ekip-magaza-siparisleri](http://localhost:3000/store/ekip-magaza-siparisleri) |
| `/eczanem/bm/mutabakat` | [/eczanem/bm/mutabakat-takip](http://localhost:3000/eczanem/bm/mutabakat-takip) |
| `/eczanem/tm/mutabakat` | [/eczanem/tm/mutabakat-takip](http://localhost:3000/eczanem/tm/mutabakat-takip) |
| `/eczanem/eczane/inidirm-onayi` | [/eczanem/eczane/indirim-onayi](http://localhost:3000/eczanem/eczane/indirim-onayi) |
| `/videolarim/urun` | [/egitim-yayinlari/urun-egitimleri](http://localhost:3000/egitim-yayinlari/urun-egitimleri) |
| `/videolarim/medikal` | [/egitim-yayinlari/medikal-egitimler](http://localhost:3000/egitim-yayinlari/medikal-egitimler) |
| `/videolarim/urun-medikal` | [/egitim-yayinlari/urun-medikal-egitimleri](http://localhost:3000/egitim-yayinlari/urun-medikal-egitimleri) |
| `/videolarim/satis` | [/egitim-yayinlari/satis-egitimleri](http://localhost:3000/egitim-yayinlari/satis-egitimleri) |
| `/videolarim/yonetim` | [/egitim-yayinlari/yonetim-egitimleri](http://localhost:3000/egitim-yayinlari/yonetim-egitimleri) |
| `/videolarim/ik` | [/egitim-yayinlari/ik-egitimleri](http://localhost:3000/egitim-yayinlari/ik-egitimleri) |
| `/yayindaki-videolar/urun` | [/egitim-yayinlari/urun-egitimleri](http://localhost:3000/egitim-yayinlari/urun-egitimleri) |
| `/yayindaki-videolar/medikal` | [/egitim-yayinlari/medikal-egitimler](http://localhost:3000/egitim-yayinlari/medikal-egitimler) |
| `/yayindaki-videolar/urun-medikal` | [/egitim-yayinlari/urun-medikal-egitimleri](http://localhost:3000/egitim-yayinlari/urun-medikal-egitimleri) |
| `/yayindaki-videolar/satis` | [/egitim-yayinlari/satis-egitimleri](http://localhost:3000/egitim-yayinlari/satis-egitimleri) |
| `/yayindaki-videolar/yonetim` | [/egitim-yayinlari/yonetim-egitimleri](http://localhost:3000/egitim-yayinlari/yonetim-egitimleri) |
| `/yayindaki-videolar/ik` | [/egitim-yayinlari/ik-egitimleri](http://localhost:3000/egitim-yayinlari/ik-egitimleri) |
| `/eczanem/hapbilgi-nedir` | [/nedir](http://localhost:3000/nedir) |
| `/hapbilgi-nedir` | [/nedir](http://localhost:3000/nedir) |

## Korunan kararlar

- Üretici aileleri: Yayın Oluşturma ve Takip, Yayın Yönetimi, Sizin Yayınlarınız, Tüm Yayınlar ve Yayın Raporları adresleri korundu.
- T-Club Ligi `/t-club-ligi` olarak kaldı.
- T-Club raporlarında `/raporlar/utt`, `/raporlar/bm`, `/raporlar/tm`, `/raporlar/tclub-uretici` ve `/raporlar/yonetici` ayrımı korundu. İlk rapordaki `/t-club/raporlar` önerisi kullanıcı tarafından kabul edilmedi ve uygulanmadı.
- E-Club Takımım için ilk `/eclub/takimim` önerisi yerine kullanıcının belirlediği `/eclub/eczaneler-takimim` uygulandı.
- Eğitim adreslerinde alt sekmelerin tam adları kullanıldı; içerik türü, filtre ve rehber anahtarları için kullanılan eski teknik kategori kodları korundu.
- Ortak eğitim adresi UTT/KD_UTT için mevcut tüketim ekranını; BM/TM ve yönetici ailesi için mevcut katalog ekranını açar. BM öneri seçim sağlayıcısı kategori geçişlerinde yaşamaya devam eder.
- Üretici rollerin eğitim adresine doğrudan erişiminde mevcut `/tum-yayinlar` yönlendirmesi korundu. Ortak katalog API'si tüketici rollere açılmadı.
- HBStore kişisel adresleri `/store`, `/store/siparislerim` ve `/store/adreslerim` olarak kaldı.
- Eczanem içindeki eczane/firma/ürün seçimleri `/eczanem` altında kaldı.
- Admin firma ve sekme seçimleri `/admin` altında kaldı.
- Kıdemli UTT ayrı iş rolü olarak ele alınmıyor; mevcut `kd_utt` teknik kodu UTT ile aynı işlevi kullanıyor. Mutabakat eşitlemesi bu URL çalışmasından önce kullanıcı tarafından DB'de doğrulandı.
- Eski adresler için yeni yönlendirme eklenmedi. Eğitim ana sayfa kısayolları ilk kategoriye doğrudan bağlandı.
- Taşınan route klasörleri altındaki API çağrıları, bunların importları, Bi yönlendirmeleri ve firma/rol bekçileri yeni yollarla eşitlendi.

## Nedir bağlantısının kapsamı

Kullanıcı ortak bilgi bağlantısı için **tüm rollerde Nedir → /nedir** kararını onayladı. Ortak navbar, mobil drawer, Eczanem navbarı, ilk mobil giriş ve Bi bağlantıları `/nedir` kullanır. Eczanem üyesi kendi navbarı ve mevcut açıklamasıyla; firma ve E-Club kullanıcıları mevcut panel kabuğu ve içerikleriyle açılır. Eczanem üyesinin modül erişim kapısı korunur. Admin için yeni menü eklenmedi; mevcut panel yönlendirmesi korunur. Eski bilgi adresleri için yeni yönlendirme eklenmedi.

## Doğrulama

- `npm run typecheck:build`: başarılı.
- Yeni URL kontrolleri: bütün rol kümelerinde sidebar hedeflerinin sayfa dosyası bulunuyor; altı eğitim kategorisinde UTT/KD_UTT ile BM/TM/yönetici ekran ayrımı korunuyor; yeni lig adreslerinde kapalı firma modülleri API'yi engelliyor; `/nedir` Eczanem erişim kapısını koruyor.
- Eğitim türü sözleşmesi, mobil HBStore, E-Club menüsü, Eczanem üye yüzeyi, ilk mobil giriş, Bi yönlendirmesi ve BM/TM Mutabakat Takip kontrolleri başarılı.
- Yeni eğitim sayfası/layout'u, `/nedir`, kategori kaynağı, sidebar kaynağı, proxy ve yeni test dosyasında ESLint başarılı.
- Taşınan CSS dosyası Git'teki önceki içeriğiyle bayt düzeyinde aynı. Font, ölçü ve renk değişikliği yapılmadı.
- Mevcut `panelNavbarOzet.smoke.test.ts` dosyasındaki bir HBStore metin kontrolü başarısız: test `HBStore Günleri’ne`, değişmemiş takvim kaynağı `HBStore Günlerine` bekliyor/üretiyor. URL değişikliğine bağlı değil; takvim veya bu metin beklentisi değiştirilmedi.
- Gerçek kullanıcı oturumuyla son ekran ve akış kontrolü kullanıcı tarafından yapıldı ve 18.10.2026 tarihinde doğrulandı. Bu doğrulama kullanıcı bildirimidir; ajan Chrome kullanmadı.
