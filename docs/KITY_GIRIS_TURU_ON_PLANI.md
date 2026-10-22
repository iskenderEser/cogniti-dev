> **Arşiv — 21 Ekim 2026:** Üretici Ana Sayfa kaldırma onayı kapsamında bu sayfaya özel tur, tercih ve test kodları kaldırıldı. Aşağıdaki metin geçmiş plan kaydıdır; güncel uygulama talimatı değildir. Genel rehber motoru ve demo korunur.

# Kity — giriş sonrası tanıtım turu ön planı

Tarih: 17 Ekim 2026. Son güncelleme: 18 Ekim 2026.

Durum: Hesap tercihi, gerçek panel hedefleri, mobil menü ve profil geçişi yerel kodda bağlandı. Metinler ve akış revize edilebilir taslaktır. Mia kayıtları henüz hazırlanmadı. Otomatik giriş turu kapalıdır; yalnız açıkça istenen önizleme çalışır. Canlı dağıtım yapılmadı.

## 1. Kararlaştırılmış kapsam

- **Dahil:** Firma kullanıcıları (UTT/KD_UTT, BM/TM, üretici ve yönetici roller) ve E-Club üyeleri (eczacı, ikinci eczacı, yardımcı eczacı, eczane teknisyeni).
- **Hariç:** Admin, İçerik Üreticisi (`iu`) ve Eczanem müşterileri/üyeleri (`musteri`). Bu kimliklerde giriş turu açılmaz.
- Kity başarılı girişten sonra kullanıcıyı adıyla karşılar.
- Sol menüde yalnız kullanıcıya görünen **ana başlıkları** kısa birer açıklamayla tanıtır. Alt menüler tek tek anlatılmaz.
- Ardından üst navbarı tanıtır.
- Profil bağlantısını açar ve gerçekten görünen profil içeriğini kısaca açıklar.
- Demodaki merkeze yürüme, el sallama ve kaybolma davranışı korunur.
- Kullanıcı turu erken kapatabilir; ayrıca “Bir daha gösterme” seçebilir.
- Ses Mia olacaktır. Tarayıcının mekanik sesi bu tura eklenmeyecektir.
- Mevcut sayfa yerleşimi, fontlar, renkler, ölçüler, tablolar ve iş metrikleri değiştirilmez.

## 2. Tur sırası

| Sıra | Kity ne yapar? | Açıklama |
| --- | --- | --- |
| 1 | İsimle merhaba der. | Ekranda “Merhaba [ad]”; Mia kaydında “Merhaba, ben Kity. Cogniti’ye hoş geldin! Sana kısaca yol göstereyim.” |
| 2 | Görünen ana menü başlıklarına sırayla gider. | Başlık başına tek kısa anlatım; alt menülere girilmez. |
| 3 | Navbarı gösterir. | Kullanıcının ekranında gerçekten bulunan bağlantı ve kontroller anlatılır. |
| 4 | Profili açar ve tanıtır. | Sayfa geçişi sırasında tur devam eder; profil yüklenmeden anlatım başlamaz. |
| 5 | Veda eder. | Merkeze yürür, el sallar ve kaybolur. |

Adım sayısı önerisi: **Görünen ana başlık sayısı + 4**. Karşılama, navbar, profil ve veda bu dört ortak duraktır. Ayrı hareketler veya alt menü anlatımları eklenmez.

## 3. Roller ve ekranlar

Aşağıdaki başlıklar mevcut `panelNav.config.ts` ve `roller.ts` kaynaklarından çıkarılmıştır. Firma modül izinleri ve görünürlük koşulları uygulanır; kapalı modül anlatılmaz.

| Rol / kimlik | Başlangıç | Tanıtılacak ana başlıklar | Profil sonu |
| --- | --- | --- | --- |
| UTT, KD_UTT | `/ana-sayfa` | T-Club; açıksa E-Club ve Eczanem | Hesap bilgileri, fotoğraf/şifre ve mevcut performans alanları. |
| BM, TM | `/ana-sayfa` | T-Club; açıksa C-Club, E-Club ve Eczanem | Hesap bilgileri, fotoğraf ve şifre. |
| Üretici roller: PM ailesi, Medikal, Eğitim, İK | `/ana-sayfa` | Yayınlar ve Raporlar, T-Club; izinli ve açıksa C-Club ve E-Club | Hesap bilgileri, fotoğraf ve şifre. |
| Yönetici roller | `/ana-sayfa` | Yayınlar ve Raporlar, T-Club; açıksa C-Club ve E-Club | Hesap bilgileri, fotoğraf ve şifre. |
| Eczacı, İkinci Eczacı, Yardımcı Eczacı, Eczane Teknisyeni | `/eclub/ana-sayfa` | Görünürse E-Club ve Eczanem | Hesap, bağlı eczane ve şifre bilgileri. Fotoğraf değiştirme ve UTT performansı anlatılmaz. |

Üretici ve yönetici ailelerindeki bütün rol kodları mevcut ortak rol listelerinden alınır; rehber için yeni bir yetki listesi oluşturulmaz. Tabloda başlıkların bulunması modülün her kullanıcıda açık olduğu anlamına gelmez.

## 4. Mia için kısa metin taslakları

Metinler kullanıcının incelemesine sunulacak; onaydan sonra ElevenLabs’te üretilecek.

| Kayıt | Metin taslağı |
| --- | --- |
| Karşılama | Merhaba, ben Kity. Cogniti’ye hoş geldin! Sana kısaca yol göstereyim. |
| Yayınlar ve Raporlar | Yayınlar ve Raporlar bölümünde rolüne açık yayın ve rapor çalışmalarına ulaşabilirsin. |
| T-Club | T-Club, saha eğitimleri ve gelişim takibinin buluştuğu alan. Sana açık seçenekleri bu başlığın altında bulabilirsin. |
| C-Club | C-Club bölümünden Challenge Club çalışmalarına ve ligine ulaşabilirsin. |
| E-Club — iç kullanıcı | E-Club, eczane iş birlikleri ve eğitim yayınları için çalışma alanın. Rolüne açık seçenekler burada. |
| E-Club — eczane kişisi | E-Club bölümünden birlikte çalıştığın firmalara ve sana ulaşan yayınlara erişebilirsin. |
| Eczanem — iç kullanıcı / eczane kişisi | Eczanem bölümünde eczane üyelerine yönelik, rolüne açık işlemleri bulabilirsin. |
| HBStore — yalnız mobilde bu ana başlık görünüyorsa | HBStore bölümünden mağazaya, siparişlerine ve adreslerine ulaşabilirsin. |
| Navbar — ortak bölüm | Ana sayfaya ve Cogniti’yi tanıtan bağlantılara üst bölümden ulaşabilirsin. Renk görünümünü ve profilini de buradan yönetebilirsin. |
| Navbar — mobil | Üst bölümden renk görünümünü değiştirebilir, profilini açabilirsin. Menü düğmesinde ana sayfa ve bilgilendirme bağlantıları da bulunuyor. |
| Profil — ortak panel | Profilinde hesap bilgilerini görebilir, fotoğrafını ve şifreni değiştirebilirsin. |
| Profil — UTT / KD_UTT | Profilinde hesap bilgilerini görebilir, fotoğrafını ve şifreni değiştirebilirsin. Burada izlemelerini, puan dağılımını ve sıralamanı da takip edebilirsin. |
| Profil — eczane kişisi | Profilinde hesap ve eczane bilgilerini görebilir, şifreni değiştirebilirsin. |
| Veda | Küçük turumuz burada bitti. Cogniti’yi keşfetmenin keyfini çıkar. Görüşmek üzere! |

Ekrandaki karşılama kullanıcı adını gösterecek; genel Mia kaydı hiçbir kullanıcının adını seslendirmeyecek. Bu tablodaki metinler **ses üretimi için kullanıcı onayı bekleyen taslaktır**.

Navbarın puan, mağaza ve diğer koşullu alanları yalnız görünür oldukları kullanıcı için anlatılır. Herkese mağaza veya puan özelliği vaat edilmez. Mobilde mevcut menü düğmesi ve menü çekmecesi kullanılır; masaüstünde gizli bir alan hedeflenmez.

Admin, İçerik Üreticisi ve Eczanem üyesi için tur veya ses kaydı hazırlanmayacaktır. Firma kullanıcıları ve E-Club üyelerindeki mevcut Eczanem ana başlığı, görünürse tanıtılmaya devam eder; Eczanem müşterisinin kapsam dışında olması bu başlığın kaldırılması anlamına gelmez.

## 5. Başlatma ve kapatma

| Durum | Planlanan davranış |
| --- | --- |
| Başarılı giriş | Yalnız kapsamdaki firma kullanıcıları ve E-Club üyelerinde, yetki ve görünür menüler hazır olduğunda tur açılır. |
| Aynı girişte sayfa değiştirme | Tur yeniden başlamaz. Profil geçişinde kaldığı yerden devam eder. |
| İleri / geri | Önceki ses durur; Kity yeni hedefe ulaşınca ilgili kayıt çalar. |
| Ses kapalı | Yazılı açıklamalarla tur devam eder. |
| Erken kapat / Escape | Ses ve hareketler durur; “Bir daha gösterme” seçilmemişse sonraki girişte tekrar gelir. |
| Bir daha gösterme | Tercih kullanıcı hesabında saklanır ve sonraki girişlerde tüm cihazlarda otomatik açılma kapanır. |
| Tur sonu | Profil üzerinde kısa açıklamanın ardından demodaki veda oynar. |

“Her açılış” için bu taslakta kullanılan anlam, kullanıcının son talebindeki **girişten sonra** ifadesidir. Her alt sayfa geçişinde tur baştan başlatılmayacaktır.

Hesap tercihi mevcut Supabase Auth kullanıcı tercih alanında `cogniti_kity_turu_gosterme` anahtarıyla saklanır. Rol veya yetki bu tercihten belirlenmez. Yeni tablo, kolon veya SQL gerekmiyor. Aynı girişin tekrarını engellemek için doğrulanmış JWT `session_id` değeri kullanılır; yenileme ve başka sekme yeni giriş sayılmaz.

## 6. Seslerin mevcut durumu

- Kullanıcının seçtiği ElevenLabs sesi: [Mia — Clear, Steady and Warm](https://elevenlabs.io/voices/PdYVUd1CAGSXsTvZZTNn).
- Ses kimliği: `PdYVUd1CAGSXsTvZZTNn`.
- Kullanıcı ücretli aboneliği başlattığını bildirdi.
- Demo karşılama kaydı: `public/rehber/ses/kity-merhaba-mia.mp3`.
- Bu kayıt kişiye özel isim içermiyor, eski marka ve demo yayın kartını anlatıyor; bütün rollerin giriş karşılaması için aynı dosya kullanılmış sayılmayacak.
- Canlı tur için yukarıdaki kısa metinlerin Mia kayıtları hazırlanacak.
- Kullanıcının adı yalnız ekranda görünecek. Her kullanıcı aynı genel Mia ses kaydını duyacak; kişiye özel kayıt üretimi gerekmiyor.
- Sabit kayıtlar bir kez üretilip siteden çalınacak. Tarayıcı sesiyle tamamlama yapılmayacak.

## 7. Açık kararlar

1. Yukarıdaki Cogniti ses metinleri kullanıcı tarafından incelenecek ve onaylanacak.
2. Onaylanan metinler Mia sesiyle üretilecek; ses dosyaları kaydedilip gerçek turda bağlanacak.

Kapsam kararı kesinleşti: Admin, İçerik Üreticisi ve Eczanem müşterileri/üyeleri hariçtir. Bu kabuklar için özel tur uyarlaması yapılmayacaktır.

## 8. Yerel uygulama ve önizleme

- Merkezi metinler, ses yolları ve tur sırası: `lib/rehber/kityGirisTuru.ts`.
- Hesap tercihi ve aynı girişte tekrar kontrolü: `lib/auth/kityTercihi.ts`.
- Panel bağlantısı: `components/rehber/KityGirisTuru.tsx`. Kapsam dışındaki roller bu bileşeni çalıştırmaz.
- Gerçek menü başlıkları, navbar ve yüklenmiş profil kartı hedef olarak işaretlendi. Mobil tur menü çekmecesini açar; navbar ve profil anlatımında kapatır.
- Profil yüklenirken anlatım bekler. İleri/geri veya kapatma, eski hedef beklemesini ve önceki sesi iptal eder. Veda kaydı eklendiğinde kayıt bitmeden karakter kaybolmaz.
- Önizleme: Oturum açıkken kendi Ana Sayfa adresinin sonuna `?kity=onizleme` ekle. Firma kullanıcısı için `/ana-sayfa?kity=onizleme`, E-Club kişisi için `/eclub/ana-sayfa?kity=onizleme`. Önizleme hesapta “Bir daha gösterme” olsa da açılır; tercih yalnız kullanıcı kutuyu değiştirirse güncellenir.
- `KITY_OTOMATIK_TUR_AKTIF` kapalıdır. Mia kayıtları `KITY_SES_KAYITLARI` listesine bağlanıp metin/akış incelemesi tamamlanınca otomatik giriş açılabilir. Bütün durakların ve vedanın kaydı olmadan otomatik tur başlamaz. Şu an önizleme yazılıdır; tarayıcı sesi kullanılmaz.

Yerel doğrulama: Kity kapsamı, görünür menüler, isim/ses ayrımı, hesap tercihi, oturum tekrarı, hedef bekleme/iptali, yürüyüş ve ses kapanışı için **18 hedef test geçti**. TypeScript kontrolü geçti. Değişen kabuk dosyasının lint kontrolünde önceden de bulunan `set-state-in-effect` hatası devam ediyor; yeni Kity dosyalarında lint hatası yok. Bu sonuçlar gerçek kullanıcı hesabıyla tarayıcı veya canlı dağıtım doğrulaması değildir. Puan, gönderim, sipariş veya veritabanı iş kuralları bu çalışma kapsamında yeniden test edilmedi.

## Kaynaktan doğrulanan dosyalar

- `components/panel/panelNav.config.ts`
- `lib/utils/roller.ts`
- `app/(panel)/layout.tsx`
- `components/panel/PanelNavbar.tsx`
- `app/(panel)/profil/page.tsx`
- `app/providers/AuthProvider.tsx`
- `app/admin/_components/AdminUstBar.tsx`
- `app/eczanem/_components/EczanemMusteriNavbar.tsx`
- `app/eczanem/_components/EczanemMusteriSidebar.tsx`

Bu kayıt rol/menü ve profil kaynaklarının incelemesidir; bütün gerçek kullanıcı oturumlarında tarayıcı doğrulaması veya canlı dağıtım sonucu değildir.
