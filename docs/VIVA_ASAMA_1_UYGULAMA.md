# Viva — 1. Aşama Uygulama ve Teslim Kaydı

Tarih: 25 Ekim 2026

**Durum:** Kod ve kurulum SQL’i hazırlandı. Kullanıcının çıktısıyla üç tablo ve iki giriş fonksiyonunun kurulumu doğrulandı. İlk kullanıcı SQL testinde 27 başarılı ve 2 atlandı sonucu alındı; tamamlayıcı EClub testinde 7/7 başarılı sonuçla bu iki senaryo da doğrulandı. Başarısız sonuç yok. **Birinci aşama kullanıcı tarafından tamamlandı olarak kabul edildi.** Canlı mobil kontrolü push sonrasında izlenecek; tablet yokluğu ve TB-03 e-posta kontrolü kapanışı bekletmez. Daily veya Cogniti içerik/soru/rapor entegrasyonu bu teslimin kapsamında değildir.

## Kullanıcı kararları ve erişim sınırı

- Kullanıcı kararı: Tüm iç kullanıcı rolleri kendi organizasyon kapsamlarında Viva etkinliği açabilir. EClub üyeleri davetli katılımcıdır; etkinlik oluşturamaz.
- Kullanıcı kararı: Özel davetli bağlantıya ek olarak e-posta doğrulaması yapar. Kalıcı Cogniti veya EClub hesabı açılmaz.
- Kullanıcı talimatı: **Veritabanına ajan tarafından erişilmeyecek; SQL’i kullanıcı çalıştıracak.** Gerçek kurulum sonucu yalnız kullanıcının paylaşacağı çıktılarla izlenecek. Bu talimattan sonra ajan veritabanı işlemi veya SQL testi çalıştırmadı; kullanıcının paylaştığı test çıktıları değerlendirilir.
- Gerçek doğrulama e-postası gönderilmedi; e-posta testlerinde sahte taşıma katmanı kullanıldı.

## Hazırlanan işlevler

Viva menüsü iç panel, EClub gezinmesi ve admin üst barına bağlandı. Etkinlik listesi, oluşturma, detay, düzenleme, yayın odası ve özel davet ekranları hazırlandı. Etkinlikler taslak veya planlanmış olarak kaydedilir; düzenleme, yeniden planlama ve iptal işlemleri vardır. Katılımcılar mevcut Cogniti kimliklerinden seçilir. Oda sayfası ikinci aşamadaki Daily Prebuilt yerleştirmesi için ayrılmıştır; görüşme düğmeleri yeniden yazılmadı.

| Kaynak | İşlev |
|---|---|
| `lib/viva/sozlesme.ts` | Türler, durum adları, form doğrulaması, ortak Türkiye saati yardımcılarına bağlantı ve güvenli giriş dönüşü |
| `lib/viva/sunucu.ts` | Mevcut Auth/rol çözümü, Viva RPC bağlantısı, davet ve kod özetleri, e-posta taşıma işlemi |
| `components/viva/VivaEkrani.tsx` | Liste, form, detay, davet yönetimi ve oda yerleşimi |
| `components/viva/VivaMisafir.tsx` | Etkinliğe özel e-posta doğrulamalı misafir ekranı |
| `app/(panel)/viva/` | Üye ekranları ve sunucu API’si |
| `app/viva/davet/[token]/` | Genel hesap gerektirmeyen misafir ekranı ve API’si |
| `scripts/sql/viva_asama1.sql` | Yeni Viva tabloları, erişim ve atomik yönetim fonksiyonları |

## Uygulanan organizasyon kapsamı

Kapsam istemciden gelen firma, rol veya takım değerlerine göre belirlenmez. Mevcut kimlik kaynakları sunucuda okunur. Etkinlik erişiminde düzenleyenin güncel aktifliği ve firma bağı da denetlenir.

| Oluşturucu | İç katılımcı seçimi | EClub katılımcı seçimi |
|---|---|---|
| UTT / KD_UTT | Kendi bölgesi | Kendi aktif UTT–eczane listesi ve aktif kişi–eczane bağları |
| BM | Kendi bölgesi | Kendi bölgesindeki aktif UTT’lerin listeleri |
| TM / PM / JR_PM / KD_PM | Kendi takımı | Kendi takımındaki aktif UTT’lerin listeleri |
| Diğer firmaya bağlı iç roller | Kendi firması | Aynı firmadaki aktif UTT listelerinin kapsamı |
| Firma ataması olmayan platform çalışanı, İÜ/admin | Yalnız firma ataması olmayan platform ekibi | Firma kapsamı oluşmadığından erişim verilmez |

Bu matris, “kendi organizasyon kapsamında” kararının ilk uygulamasıdır. Eksik bölge veya takım ataması kapsamı genişletmez. EClub seçimi için ilgili firmanın aktif ve EClub modülünün açık olması gerekir. Çok firmalı üyenin her etkinlikte erişimi o etkinliğin firması ve düzenleyenin güncel listesi üzerinden değerlendirilir.

İlk sürümde etkinliğin düzenleyeni tek yönetici/sunucudur; seçilen üyeler ve özel davetliler katılımcı/izleyicidir. Ayrı eş sunucu atama işlemi eklenmedi. Kullanıcılar yalnız seçildikleri etkinliğe erişir; yönetici olmak başka bir kişinin etkinliğini kendiliğinden açmaz. İç ve EClub katılımcıları aynı etkinlikte birlikte seçilebilir; otomatik toplu grup üyeliği oluşturulmaz.

## Zaman, durum ve davet davranışı

- Taslağı yalnız düzenleyen görür. Planlandığında seçilmiş kişilere açılır. Planlanmış kayıt taslağa geri alınmaz.
- Başlangıç/bitiş Türkiye saatinde gösterilir; tarihler mevcut `lib/zaman/turkiye.ts` kaynağıyla dönüştürülür.
- Planlama başlangıcı gelecekte ve bitiş başlangıçtan sonra olmalıdır. Başlamış planın bilgilerini değiştirmek için başlangıcın yeniden geleceğe alınması gerekir; canlı oturum yönetimi ikinci aşamadadır.
- Planlanan saat geldiğinde kayıt kendiliğinden `canli` olmaz. `canli` ve `sona_erdi` durumları tanımlıdır; gerçek geçişler ikinci aşamada Daily ile kurulacaktır.
- Planlanmış etkinliğin bilgi ve oda sayfası bitişe kadar açılabilir. Bu aşamada oda yalnız bağlantı alanıdır; gerçek yayına erken katılım penceresi ikinci aşamada uygulanır.
- Özel davet planlanmış etkinlik için oluşturulur. İlk sürümde bağlantı kopyalanır ve düzenleyen tarafından iletilir. Otomatik davet e-postası/SMS veya yeni bildirim zinciri eklenmedi.
- Bağlantıyı açan misafir kod istediğinde yalnız davette kayıtlı e-posta adresine altı haneli kod gönderilir. Kod 10 dakika; doğrulanmış misafir oturumu en fazla 12 saat geçerlidir. Her ikisi de etkinliğin bitişini aşamaz.
- Kod istekleri arasında en az 60 saniye, bir saatlik pencerede en fazla 5 gönderim; her kod için en fazla 5 yanlış deneme vardır. Kod ve oturumun ham değerleri veritabanına yazılmaz.
- Misafir oturumu HttpOnly çerezle, yalnız ilgili davet yoluna bağlıdır. Davet başına bir etkin oturum vardır; başka tarayıcıda yeniden doğrulama önceki oturumu değiştirir.
- Aynı e-postaya yeni davet oluşturmak eski daveti ve eski oturumu geçersizleştirir. Davet veya etkinlik iptali erişimi kapatır. Süre bitiminde yeni erişim verilmez.
- Üye ve misafir oda ekranları görünürken erişim 30 saniyede bir ve sekmeye dönüşte yeniden kontrol edilir. Sunucu her istekte gerçek erişim kuralını uygular.

## Veritabanı kurulum dosyası — kullanıcı çalıştıracak

`scripts/sql/viva_asama1.sql` üç yeni tablo içerir:

- `public.viva_etkinlikler`
- `public.viva_katilimcilar`
- `public.viva_davetler`

Sunucu girişleri `public.viva_islem(uuid,text,jsonb)` ve `public.viva_misafir_islem(text,text,jsonb)` fonksiyonlarıdır. Yeni tablolarda RLS açıktır; `anon` ve `authenticated` doğrudan erişimi kapalıdır. Fonksiyonlar uygulamanın sunucu katmanındaki mevcut `service_role` bağlantısından çağrılır; istemciye bu anahtar verilmez.

SQL mevcut öğrenme, puan, EClub gönderim veya mağaza tablolarını değiştirmez. Mevcut firma/kullanıcı/EClub tablolarını kapsam doğrulaması için okur. Referans kolonları depodaki şema kaydı ve kaynak kod üzerinden kontrol edildi; gerçek şemayla yeni bir karşılaştırma yapılmadı.

1. Kullanıcı `scripts/sql/viva_asama1.sql` dosyasını çalıştırır.
2. Başarı veya hata çıktısını paylaşır. Başarı görülmeden kurulum tamamlandı sayılmaz.
3. Kullanıcı gerekirse aşağıdaki salt okuma kontrolünü çalıştırıp sonucu paylaşır:

```sql
SELECT
  to_regclass('public.viva_etkinlikler') IS NOT NULL AS etkinlik_tablosu,
  to_regclass('public.viva_katilimcilar') IS NOT NULL AS katilimci_tablosu,
  to_regclass('public.viva_davetler') IS NOT NULL AS davet_tablosu,
  to_regprocedure('public.viva_islem(uuid,text,jsonb)') IS NOT NULL AS etkinlik_fonksiyonu,
  to_regprocedure('public.viva_misafir_islem(text,text,jsonb)') IS NOT NULL AS misafir_fonksiyonu;
```

Kurulum yapılmadan Viva API’si anlaşılır bir “henüz kullanıma açılmadı” yanıtı verir; boş listeyi başarılı kurulum gibi sunmaz.

## E-posta yapılandırması

Kod gönderiminde mevcut Resend taşıma altyapısı kullanılır. `RESEND_API_KEY` gerekir; gönderici öncelikle `VIVA_DAVET_EMAIL_FROM`, tanımlı değilse mevcut `ECLUB_DAVET_EMAIL_FROM` değerinden alınır. Bu değişkenlerin mevcut değerleri okunmadı, değiştirilmedi veya belgeye yazılmadı. Gönderici hazır değilse misafire kod gönderildi denmez; anlaşılır bir hata gösterilir.

Gerçek teslimat ve uçtan uca misafir doğrulama kontrolü kullanıcı kararıyla `docs/REDBOOK.MD` TB-03 teknik borcuna taşındı; birinci aşamanın kapanışını bekletmeyecek. Gerçek adrese test e-postası gönderilmedi. Uygulamada doğrulama gereksinimi korunur.

## Doğrulama kaydı ve sınırları

| Kontrol | Sonuç |
|---|---|
| Viva uygulama ve DOM testleri | 21/21 başarılı; sahte bağımlılıklar, gerçek ağ/DB/e-posta yok |
| Giriş/menü ile ilgili regresyonlar | 47 başarılı, 1 önceden var olan karşılama metni uyuşmazlığı |
| Tip kontrolü | `npm run typecheck:build` başarılı |
| Yeni Viva kodu ve değişen giriş/menü dosyaları lint | 0 hata, yeni RPC’lerin eski şema kaydında bulunmamasından 3 uyarı |
| Ortak panel layout lint | Viva değişikliğinden önce de bulunan `set-state-in-effect` hatası; aynı kaynak satırı korunuyor |
| Önceki turdaki SQL yerel testleri | 27/27; PostgreSQL 18.6 / PGlite WASM, sahte temel şema, tek bağlantı |
| İki bağımsız bağlantıyla yarış/lock testleri | Yapılmadı; native PostgreSQL paylaşımlı bellek izni nedeniyle başlayamadı |
| Gerçek tarayıcı | DB bağlantısı olmayan örnek verili önizlemede form ve katılımcı seçimi incelendi. Tam cihaz/tema matrisi tamamlanmadı; sonrasında yerel tarayıcı kullanımı Work ayarından kapatıldı |
| Gerçek DB kurulumu | Kullanıcının paylaştığı kontrolde üç tablo ve iki giriş fonksiyonu mevcut |
| Kullanıcının çalıştırdığı DB iş kuralı testleri | İlk dosya: 27 başarılı, 2 atlandı. Tamamlayıcı EClub dosyası: 7/7 başarılı; önceki iki eksik senaryo doğrulandı. Başarısız sonuç yok |
| Gerçek davet/e-posta/üye oturumuyla uçtan uca kabul | Üye oturumu kabulü bekliyor; gerçek e-posta ve misafir doğrulama/çerez akışı kullanıcı kararıyla TB-03 teknik borcuna taşındı |

Karşılama testinin eski beklentisi `Bilgiyi ulaştırır, öğrenmeyi motive eder` metnidir; mevcut sayfa `Her tanıtım, karşılıklı öğrenmedir.` metnini gösterir. Aynı hata değişiklik içermeyen orijinal projede de doğrulandı. Viva kapsamında metin veya bu beklenti değiştirilmedi.

SQL testleri, kullanıcının DB erişimini yasaklamasından önce izole bellek ortamında yapılmıştır. Bu talimattan sonra ajan SQL testi tekrarlamadı. Kullanıcı kendi çalıştırdığı SQL’in sonuçlarını paylaştı. Bu sonuçlar canlı veritabanının şemasını veya gerçek tarayıcıdan tüm akışı doğrulamaz.

## İkinci aşamaya bağlantı noktaları

Daily odası kalıcı Viva etkinlik kimliğiyle eşleştirilecek. Oda/token üretiminden önce aynı etkinlik kapsamı ve güncel davet geçerliliği doğrulanacak. Mevcut düzenleyen rolü Daily sunucu/yönetim iznine, misafir rolü yalnız izleyici iznine çevrilecek. Bitirme ve iptal, açık Daily görüşmesini de kapatacak şekilde ikinci aşamada bağlanacak. Bu teslimde Daily anahtarı, çağrısı veya SDK bağımlılığı eklenmedi.

## Sonraya bırakılan doğrulama kayıtları

- İzinli bir test ortamında çok bağlantılı yarış testleri ve gerçek kimliklerle etkinlik akışının kabulü.
- Telefon, tablet, masaüstü ve iki tema için tam tarayıcı kontrolü.
- Gerçek e-posta teslimatı ve misafir doğrulama/çerez/iptal akışı TB-03 teknik borcunda izlenir; kullanıcı kararıyla bu aşamanın kapanışını bekletmez.

Kullanıcının aşağıda kaydedilen kabul kararıyla birinci aşama tamamlandı; yapılmamış kontroller yapılmış sayılmadan ayrıca izlenir.

## 25 Ekim — kullanıcı SQL sonuçları

Kurulumun varlık kontrolü kullanıcı tarafından paylaşıldı; beş sonuç da `true`. Ardından `VIVA_ASAMA_1_SQL_TEST.sql` çıktısı alındı: **27 başarılı, 2 atlandı, 0 başarısız**. Atlanan 05/09 testleri seçilen UTT kapsamında Auth kimliği bağlı aktif EClub üyesi bulunamamasından kaynaklandı. Bu, tüm veri kümesinde uygun üye olmadığı anlamına gelmez. Bu ilk çalıştırmada EClub taslak/plan erişimi doğrulanamadı; ardından aşağıdaki tamamlayıcı testle doğrulandı.

Tam sonuç `VIVA_ASAMA_1_KULLANICI_SQL_SONUCU.md` dosyasındadır. Tamamlayıcı SQL uygun UTT–EClub çiftini birlikte seçer; mevcut kullanıcı/üyelik bağlarını değiştirmez ve yeni test kayıtlarını `ROLLBACK` ile geri alır. Kullanıcı tamamlayıcı dosyanın sonucunu da paylaştı: **7/7 başarılı**. Taslak erişiminin reddi, plan sonrası erişim, yönetim ve kişi listelerinin gizliliği, katılımcı çıkarıldıktan sonra erişimin kapanması doğrulandı. Ajan tarafından çalıştırılmadı. E-posta teslimatı, HTTP/çerez akışı ve çok bağlantılı yarışlar bu çıktı ile doğrulanmış sayılmaz.

## 25 Ekim — arayüz kontrolü ve ertelenen e-posta testi

`VIVA_ASAMA_1_ARAYUZ_KONTROLU.md` ayrıntılı kaydı içerir. Uygulama/DOM testleri 21/21 başarılı; tip kontrolü başarılı, değişen iki bileşen ve arayüz testinde lint 0 hata/0 uyarı. Viva’ya özel dar ekran stilleri uygulandı. Gerçek tarayıcı erişimi kapalı olduğundan mobil/tablet ve iki tema görsel kabulü tamamlandı sayılmaz. Gerçek e-posta ve misafir doğrulama/çerez akışı kullanıcının kararıyla REDBOOK TB-03’e alındı ve birinci aşama kapanış koşulundan çıkarıldı.

## Kullanıcı kabulü — 25 Ekim 2026

**1. aşama TAMAMLANDI.** Kullanıcı, Viva’nın Cogniti’ye kurulmasını ve ekranda görülmesini bu aşamanın kabulü olarak onayladı. Canlı telefon kontrolü push sonrasında yapılacak; elde tablet bulunmadığından fiziksel tablet testi bu aşamanın kapanışını bekletmeyecek. Gerçek e-posta kontrolü diğer modüller gibi REDBOOK TB-03 teknik borcunda izlenecek. Önceki açık test kayıtları yapılmış sayılmaz; bu kayıtlar aşamayı yeniden açık duruma getirmez. Çok bağlantılı yarış kontrolünün yapılmadığına ilişkin önceki teknik kayıt korunur. Daily bağlantısı 2., Cogniti yeteneklerinin bağlanması 3. aşamadır.
