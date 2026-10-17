# Renk ortaklaştırması — 7. adım sonucu

**Tarih:** 17 Ekim 2026.  
**Durum:** TAMAMLANDI — yerel kod ve hedef doğrulama hazır. Canlı dağıtım yapılmadı.

Kart, tablo, açılır pencere, ipucu, bildirim, akordiyon, boş durum ve skeleton renkleri ortak tema kaynağına bağlandı. Bileşen ortaklaştırması yapılmadı; mevcut veri, hesap ve etkileşim yapısı korundu.

## Yapılan çalışma

| Aile | Bu adımın kapsamı |
| --- | --- |
| Kart ve tablo | Mevcut yüzey/metin/hover/seçim köprüleri korundu ve doğrulandı. Önceden `currentColor` kullanan çizgilere mavi değeri koruyan, yeşilde ortak çizgiyi alan amaç değişkenleri eklendi. |
| AlertDialog ve Tooltip | Pencere zemini/çizgisi/örtüsü, ipucu zemini/metni/oku bağlandı. Gerçek Radix portallarında açıkken tema değişimi sınandı. |
| Bildirimler | `HataMesaji` içindeki hata, başarı, uyarı ve bilgi türlerinin 12 rengi ortak kaynağa taşındı; işlevsel palet iki temada aynı. `YayinSonucBildirimi` kendi sabit rengi olmadığı için değiştirilmedi. |
| Akordiyonlar | C-Club iki kademeli ve T-Club üç kademeli lig akordiyonlarının yüzey, metin, çizgi, açık/hover ve gölge renkleri bağlandı. İlk üç sıra, kazanım ve kayıp ayrımları korundu. Renksiz `ui/collapsible.tsx` değiştirilmedi. |
| Paylaşılan rapor stilleri | Akordiyonun kullandığı UTT rapor `.panel`/`.sectionIcon` kuralları ile BM rapor tablosunun başlık/hücre/hover kurallarındaki 10 renk bildirimi bağlandı. Diğer rapor renkleri bu adımda değiştirilmedi. |
| Skeleton ve boş durum | Dokuz skeleton dosyası, T-Club'ın lig/rapor varyantları, ortak yayın kartı iskeletleri ve yayın listesinin varsayılan boş hali bağlandı. |
| Yerel açılır içerik | E-Club gönderim detay kartı, Eczanem/danışan gönderim detay panelleri ve ortak yayın detay penceresinin yüklenme/hata/boş/dolu halleri bağlandı. |

Uygulama kapsamı **22 TSX + 2 CSS Module + tema CSS'si** olmak üzere 25 dosyadır. Bir hedef test dosyası eklendi; mevcut testlerin beklentileri değiştirilmedi.

**185 değişken / 314 yeni bildirim** eklendi: 129 değişken temaya göre karşılık alır, 56 değişken mevcut işlevsel/sabit rengini korur. Önceki **631 tema bildiriminin tamamı** aynı kaldı.

Mavi görünümün farklı tonları yaklaşık HEX değerlerine indirgenmedi; Tailwind renkleri mevcut kaynaklarına bağlıdır. Yeşil karşılıklar onaylı yüzey, zemin, çizgi, metin, eylem ve seçim paletinden çözülür. Aynı HEX'i kullanan sıra madalyası, nötr simge ve karne etiketi farklı kullanım amaçlarıyla ayrı tutuldu.

## Korunan yapı ve etkileşimler

- Kolonlar, sıralama/gruplama, net puan hesapları, filtreler ve kayıt kapsamları değişmedi.
- DOM, metin, boyut, yazı, responsive, animasyon ve görünürlük koşulları korundu. Pulse animasyonu ve erişilebilir yüklenme metinleri aynı.
- Kartın yerel renk sınıfı verilerek özelleştirilmesi korunur. Yeni çizgi sınıfları mavi temada Preflight'ın önceki `currentColor` sonucunu kullanır.
- Pencerenin iptal/eylem ayrımı, iptale ilk odak, kapatınca tetikleyiciye odak dönüşü ve ipucunun Escape ile kapanması gerçek Radix bileşenleriyle sınandı.
- Portallar mevcut uygulamanın `html[data-tema]` kapsamından renk alır; açık portal aynı DOM öğesi üzerinde tema değiştirir. Yerel bir tema adası içinde farklı portal kökü oluşturan yeni bir mekanizma eklenmedi. Gerçek uygulamada tema kapsamı kök belgededir.
- Bildirimlerin 12 saniyelik varsayılan süresi, elle/otomatik kapatma davranışı, adım/detay/kapat alpha değerleri değişmedi.
- Puan, erişim, gönderim, video yükleme/izleme ve veritabanı akışlarına müdahale edilmedi. Grafik ve hesaplanan renkler 8. adımda kalır.

## Doğrulama

| Kontrol | Sonuç |
| --- | --- |
| Renk eşlemeleri geri çözülerek kaynak karşılaştırması | **24/24 aynı; renk dışı fark 0** |
| Gerçek Tailwind/PostCSS çıktısında eski/yeni mavi renk karşılığı | **391/391 aynı; eksik utility 0** |
| Bildirim renklerinin mavi çözümlemesi | **12/12 aynı** |
| İki CSS Module'deki tüm bildirimlerin mavi karşılaştırması | **693/693 aynı; yalnız 10 renk bildirimi bağlandı** |
| Önceki tema bildirimi korunumu | **631/631 aynı** |
| Yeni renk/etkileşim testleri | **7/7 başarılı** |
| Seçilen mevcut testler | **55 başarılı, 1 mevcut başarısızlık** |
| Toplam | **63 test: 62 başarılı, 1 mevcut başarısızlık; yeni başarısızlık 0** |
| `npm run typecheck:build` | Başarılı |
| 22 uygulama TSX'i ve yeni test dosyasının lint kontrolü | **Yeni bulgu 0; mevcut 1 hata ve 8 uyarı aynı** |

Yeni testler kart/tablo renk ve satır seçimini; AlertDialog/Tooltip portallarını; dört bildirim türünü; dokuz skeleton ailesini; iki/üç kademeli akordiyonların alt açılımlarını; yayın detay penceresinin yüklenme, soru, boş ve hata durumlarını çalıştırır. Tablo başlığı/hücre çizgileri ilgili gerçek CSS Module kurallarıyla da iki temada kontrol edildi. Yayın detayı için yalnız sahte HTTP yanıtları kullanıldı.

Happy DOM'un desteklemediği Tailwind katmanları, seçilmiş gerçek derleme kuralları katmansız yüklenerek kontrol edildi. OKLCH ve yarı saydam tablo durumları yaklaşık renklere çevrilmeden gerçek bildirim çözümlemesiyle karşılaştırıldı. Bunlar tarayıcı ekran görüntüsü, tüm rollerde gerçek oturum veya canlı veritabanı doğrulaması değildir. Değişmeyen responsive kurallar için mobil/masaüstü yerleşimin yeniden doğrulandığı iddia edilmez.

### Önceden var olan bulgular

1. `ccVeriKaynaklari.smoke.test.ts` içindeki “C-Club mobil stat kartları…” testi eski bir sınıf metnini bekler. Test dosyası ve okuduğu `app/(panel)/cc-ligi/page.tsx`, Git HEAD ile byte düzeyinde aynı; bu adımda değiştirilmedi. Bu bulgu renk dönüşümü için sayfa yapısını değiştirerek giderilmedi.
2. `YayinDetayModal.tsx:59` için mevcut `react-hooks/set-state-in-effect` lint hatası ve iki lig akordiyonundaki toplam sekiz kullanılmayan tanım uyarısı değişiklik öncesiyle aynı. Yeni test dosyasının lint sonucu temiz.
3. PostCSS/Tailwind işlemi başarılı ve uyarısızdır. Tüm üretilen CSS metnini yeniden ayrıştırırken önceki envanter HTML'sinden türeyen aynı `Missed semicolon` bulgusu sürer. İlgili bildirim 5–6. adımlarla aynıdır; genel CSS temiz diye bildirilmez. Hedef kurallar gerçek derleme AST'sinden doğrulandı.

## Operasyon sınırları

Çek teslimatı için kaynak ve mevcut hedef testler kontrol edildi: e-posta aktif ana eczacıya; push ilgili eczanedeki aktif HapBilgi hesabı olan E-Club kişilerine hazırlanır. Renk değişikliği alıcı seçimi veya teslimat kuyruğunu değiştirmedi. Gerçek e-posta/push teslimatı yapılmadı.

**Hediye Takibi test verileri silinecek.** Bu adımda test verileri korunmuştur; temizlik SQL'i çalıştırılmadı, canlı test başlatılmadı ve iki aylık dönem sınırı değiştirilmedi. Çek Talebi Toplam Puan hesabı bu renk tesliminin kapsamında değiştirilmedi veya canlı veriyle yeniden doğrulanmadı.

Kalan sayfa renkleri ve rol bazındaki gerçek ekran kapsamı 9. adımda izlenmeye devam eder. **8. adım başlatılmadı.**

[Makine tarafından okunabilir kayıt](renk-ortaklastirma/adim7/DOGRULAMA.json) · [İş planı](RENK_ORTAKLASTIRMA_IS_PLANI.md)
