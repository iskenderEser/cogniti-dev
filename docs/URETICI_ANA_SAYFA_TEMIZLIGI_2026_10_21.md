# Üretici Ana Sayfa temizliği — uygulama ve doğrulama

21 Ekim 2026. Proje: `/Users/iskendereser/Desktop/cogniti-dev`.

**Yerel kod temizliği tamamlandı. Dağıtım ve veritabanı değişikliği yapılmadı.** Kullanıcının silme ve başlangıç yönlendirmesi onayı uygulandı.

## Son davranış

- 13 üretici rolünde masaüstü navbar Ana Sayfa pill'i ve mobil menü Ana Sayfa satırı yok. Boş bilgi alanı ve ayraç da çizilmiyor.
- Giriş, Cogniti logosu ve üreticiye ulaşabilen yetki/modül dönüşleri `/yayin-yonetimi` hedefini kullanıyor.
- Eski `/ana-sayfa` adresini açan üretici, kaldırılan ekran kurulmadan Yayın Yönetimi'ne yönleniyor.
- Ortak `/ana-sayfa/api` üreticide 403 dönüyor; üretici ekranına ait veri veya video sorgusu çalışmıyor.
- Üretim durum push bildirimlerinin üretici hedefi `/yayin-takip` oldu. Diğer rollerin ve dış kimliklerin bildirim hedefleri korunuyor.
- Üretici raporlarındaki ve ortak rapor/lig ekranlarındaki geri bağlantıları rolün yeni hedefini ve “Yayın Yönetimi” etiketini kullanıyor.
- İU, UTT/KD_UTT, BM, TM ve yönetici Ana Sayfa ekranları ile E-Club/Eczanem kimliklerinin mevcut davranışları korundu.

Ortak iç panel hedefi `lib/panel/baslangic.ts` dosyasında çözülüyor. E-Club ve Eczanem'in ayrı kimlik yönlendirmeleri kendi kabuklarında kalıyor.

## Kaldırılanlar

Tam silinen uygulama dosyaları:

- `components/ana-sayfa/UreticiAnaSayfa.tsx`
- `lib/utils/anaSayfa/uretici.ts`


Genel rehber motoru, ortak liste/pill/tanbur bileşenleri, üretim zinciri, Talepler, raporlar ve SQL görünümleri korundu. Kullanıcı metadata'sı veya tarayıcı deposu topluca temizlenmedi. Önceden var olan yerel değişiklikler geri alınmadı.

## Doğrulama

| Kontrol | Sonuç |
|---|---|
| Doğrudan bu değişikliğe yönelik test paketi | **140 / 140 geçti** |
| Yakın ekran ve ilgili bağımlılıklarla toplam kontroller | **300 test: 288 geçti, 12 başarısız** |
| Yeni başarısız test | **0** — mevcut 12 başarısızlık temizlik öncesi kopyada da doğrulandı |
| `npm run typecheck:build` | **Geçti** |
| Değişen 49 TS/TSX dosyasında ESLint karşılaştırması | Önce ve sonra **3 hata / 4 uyarı**; eklenen hata/uyarı **0** |
| Kaldırılan ekran/veri/tur/fonksiyon/tema sembollerinin çalışma zamanı taraması | **Artık referans yok** |
| `git diff --check` | **Geçti** |
| Gerçek hesapla tarayıcı doğrulaması | Yapılmadı; rol davranışları sahte kimliklerle gerçek React bileşenleri ve API/proxy kodu üzerinden sınandı |

Yeni davranış testleri tüm iç rollerde giriş, logo, masaüstü/mobil görünürlük, eski adres ve bildirim hedeflerini; 13 üreticide API'nin sorgusuz reddini; kapalı modül/yanlış rol sayfalarının doğru hedefe dönmesini ve API'lerin 403 davranışını sınar. E-Club bildirim alıcıları ve teslimat kuyruklarına yönelik ilgili mevcut testler de çalıştırıldı; bu çalışma gerçek e-posta veya push teslimatı yapmadı.

### Üretim derlemesinin sınırı

Standart Turbopack derlemesi yaklaşık dört dakika compile aşamasında ilerleme göstermedi ve başlatılan derleme süreci durduruldu. Çalışan `localhost:3000` geliştirme sunucusu durdurulmadı.

Webpack ile ilk denemede Google Fonts'a erişim yoktu. Ağ izni alınıp font aşaması geçildikten sonra **önceden mevcut bir CSS üretim hatası** görüldü: Tailwind, `docs/renk-envanteri/renk-katalogu.html` içindeki rapor HTML'ini sınıf adayı olarak tarıyor; bozuk `text-[...]` adayı üretilen CSS'te `Missed semicolon` hatasına yol açıyor.

Aynı HTML kaynağıyla temizlik öncesi ve sonrası kaynaklarda PostCSS/Tailwind işlemi çalıştırıldı; ikisi de aynı bozuk CSS parçasında aynı hatayı verdi. Ana Sayfa temizliği kapsamında bu ayrı kaynak tarama sorunu değiştirilmedi. **Üretim build'i başarılı sayılmadı; dağıtım yapılmadı.**

## Önceden var olan başarısız kontroller

Aşağıdaki kontrol adları mevcut ve temizlik öncesi kopyada eşleşti:

- BM Eczanem sidebarında yalnız Mutabakat Takip öğesini görür
- Faz 4 Mimari - Kapsam B: ChallengeClubPage MobilYayinAkisi kullanır, challenge_id anahtarını korur ve tanbur içermez
- Kapsam B - Challenge Club: VideoListesi mobilde 2 kartla başlar, 7 karta açılır ve kilitli geçişi yönetir
- TM mutabakat takibi BM, UTT ve eczane akordiyon hiyerarşisini son onaya taşır
- bildirimler doğru UTT öneri, BM challenge ve E-Club öneri kimliklerini açar
- görsel ve PDF gözlemci kipinde oturum açmaz ve tamamlama eylemi göstermez
- izinli E-Club ligi yüzeyi takım adı mutasyonunu yalnız UTT rollerine gösterir
- layout.tsx eclub_kisi için co-branding'i kapatır ve firma bilgilerini aktarır
- mutlu: C-Club mobil stat kartları net üstte, kazanım ve kayıp altta iki sütundur
- tests/ogrenmeAraciTamamlamaFaz7.hedef.test.ts
- yönetici kapsamları sunucu kimliğinden alınır
- yönetici rolleri satın alma, eczane yönetimi, gönderim ve talep rol kümelerine dahil değildir

Bu kontrollerin bir bölümü güncel olmayan dosya yolu, metin veya kaynak şekli beklentileridir. Eksik `/raporlar/eczanem` dosyasını bekleyen Faz 7 test dosyası da bu gruptadır. Görev dışı ekran/iş kuralları bu testleri yeşile çevirmek amacıyla değiştirilmedi.

