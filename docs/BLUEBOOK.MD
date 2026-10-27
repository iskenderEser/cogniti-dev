# 📘 HapBilgi — BLUEBOOK
### İş Modeli, Mimari, İş Kuralları ve Teknik Envanter Anayasası
*Son genel inceleme: 28 Eylül 2026 | Asistan bölümü ve ilgili envanter güncellemesi: 9 Eylül 2026 | Ortak yayın arayüzü, mobil akış ve tanbur güncellemesi: 21 Eylül 2026 | E-Club iş modeli ve teknik kapanış güncellemesi: 28 Eylül 2026 | Depo tercihleri kod güncellemesi: 29 Eylül 2026; canlı yapısal kontrol: 5 Ekim 2026 (13/13) | Zorunlu Sade Kontrol Aileleri kararı: 8 Ekim 2026 | E-Club yeni gönderim ve planlama belgeleri: 13 Ekim 2026; canlı son doğrulama bekliyor | Görsel renk envanteri ve doğrulama kaydı: 17 Ekim 2026*

---

## 🏛️ Giriş ve Metodoloji
**HapBilgi BLUEBOOK**, platformun iş modelini, kullanıcı alanlarını, rol ve yetki yapısını, üretim ve yayın akışlarını, öğrenme ve işlem kurallarını, veri mimarisini, arayüz sözleşmelerini ve dosya–tür–işlev envanterini tek kaynakta tanımlayan ana başvuru belgesidir.

### 27 Ekim 2026 — Cogniti Token sistemi ve doğrulama durumu

İş planı ve ayrıntılı uygulama kayıtları `docs/COGNITI_TOKEN_PLANI.md` dosyasındadır. Aşağıdaki kodlar çalışma ağacındadır; uygulama değişiklikleri henüz commit veya dağıtım olarak doğrulanmamıştır. Kullanıcı, ilgili SQL kurulum sonuçlarını veritabanında doğrulamıştır. Gerçek kullanıcılarla uçtan uca doğrulanmayan davranışlar tamamlanmış kabul edilmez.

- **Hesaplama:** Her gerçek kişi gönderimi gönderen firmadan bir token tüketir; alıcının okuması, push veya e-posta teslimi beklenmez. Firma → UTT → eczane Eczanem aktarımı tüketmez; eczane → müşteri aktarımı yayın sahibi firmadan müşteri başına tüketir. T-Club önerisi, C-Club challenge, E-Club önerisi ve yayın hedeflerine gerçek açılışta kişi başına tüketim uygulanır. İleri tarihli yayın planı tüketmez. Viva davetinde `etkinlik_id` ve kişi tek tüketimdir; taslak tüketmez ve Daily oda kimliği ayrı tutulur.
- **Paketler:** Aylık paket yükleme ayı ve takip eden ay geçerlidir; önce eski token tüketilir. Paket aşımı negatif bakiye olarak izlenir ve sonraki yüklemede mahsup edilir. Cari ay paketi, saatlik `cogniti_token_aylik_yukleme` işleyicisiyle veya ilk gerçek tüketim öncesinde yüklenir. KKÖ başlangıcında 1.500 süresiz token yüklenir; bakiye 100 ve altına inince atanmış yetkili/GM onayıyla 1.500 token daha yüklenir. KKÖ son tokenla firma pasif olur; admin yeni token yükleyip mevcut firma anahtarından tekrar açar.
- **Yetki:** Firma çalışanları toplam bakiye ve kendi kayıtlarını, firma yönetimi firma genelini, TM takımını, BM bölgesini görür. Eczane çalışanları token bilgisi görmez. Eczanem tüketimleri eczane–firma bağındaki UTT ile ilgili bölge/takıma ilişkilendirilir. Bu ilişki geçmiş için anlık görüntü olarak saklanmadığından organizasyon değişirse geçmiş görünüm değişebilir. Firma yöneticilerine yükleme geçmişi gösterilir.
- **Veri ve kod:** `cogniti_token_hesaplari`, `cogniti_token_yuklemeleri`, `cogniti_token_tuketimleri`, `cogniti_token_tuketim_dagilimlari`, `cogniti_token_viva_kimlikleri` ve `cogniti_token_hesap_durum_gecmisi` tabloları; `scripts/sql/cogniti_token_*.sql` kurulum ve test dosyaları; `app/(panel)/token/`, `components/panel/TokenDevamOnayi.tsx`, `app/admin/_components/TokenYonetimi.tsx`, `app/admin/api/firmalar/[firma_id]/token/`, `lib/token/` ve ilgili yayın, T-Club, C-Club, E-Club, Eczanem ve Viva entegrasyonları. Rapor ve işlem işlevleri service role kapsamındadır; istemci firma veya kullanıcı kimliği seçmez.
- **Doğrulama:** Kullanıcının paylaştığı gerçek Hepifarma işlemlerinde E-Club, T-Club, C-Club, 10 kişilik Eczanem, 6 kişilik anlık yayın ve 9 kişilik Viva gönderiminde beklenen token düşüşleri görüldü. Viva 18, aylık paket 13, KKÖ onayı 8, görünürlük 8 ve pasife alma 7 geçici-veri SQL senaryosu başarılı bildirildi. Eş zamanlılık testi kullanıcı kararıyla geçildi. Planlı yayının gerçek açılışı, 100 token modalı, sıfır bakiye ve admin yeniden açılışı ile rol ekranlarının gerçek kullanıcı kontrolleri bekliyor.

### 29 Eylül 2026 — E-Club depo tercihleri ek sözleşmesi

Bu bölüm depo tercihlerindeki önceki tanımları günceller. Kod tamamlanmıştır. **5 Ekim 2026'da kullanıcı tarafından Supabase SQL Editor'da çalıştırılan salt okunur durum sorgusu, depo tercihi migration'ına ait 13 yapısal kontrolün tamamını başarılı bulmuştur (`YAPISAL_KURULUM_MEVCUT`, eksik yok).** Bu sonuç canlı veritabanında ilgili tabloların, fonksiyonların, RLS'nin, trigger bağlantılarının ve sistem ayarının mevcut olduğunu gösterir; migration'ın çalıştırılma tarihini veya uçtan uca işlevsel testi kanıtlamaz.

- Depo kataloğu `ecza_depolari` ve `ecza_depo_subeleri` tablolarındadır. Kullanıcının yükleme sonucu 585 konum, 326 unvan, 57 il ve 289 boş şube adıdır. Boş şube merkez sayılmaz. Adlandırılmış şubesi olan depoda şube seçimi zorunlu; şubesiz depoda tek konum doğrudan seçilebilir. Birden fazla adsız konum belirsizdir.
- UTT yeni eczane kaydında 1–3 depo/şube konumu seçer; Takımım detayından düzenler. Tercihler firmadan bağımsız eczaneye aittir, ana depo sıralaması yoktur. İl/ilçe/adres salt okunurdur. Düzeltme/Ekleme Talebi varsayılan e-posta uygulamasını açar; sistem ayarı `eclub_depo_info_eposta` başlangıçta `info@mill.gen.tr` olur. Kullanıcı gönderir; buton otomatik e-posta veya DB talebi oluşturmaz.
- Siparişli çek talebi oluşturulurken eczanenin kullanılabilir depo tercihi bulunması zorunludur; siparişsiz çek talepleri bu koşuldan etkilenmez.

Migration: `scripts/sql/eclub_depo_tercihleri.sql`. Canlı yapısal kontrol: `scripts/sql/eclub_depo_tercihleri_durum_kontrol.sql`. Operasyon adımları: `docs/ECZA_DEPO_KATALOGU_YUKLEME.md`.

HapBilgi; firmalar tarafından sağlanan veya yayımlanması sağlanan içerikleri yetkili kullanıcı gruplarına ulaştıran, bu kapsamdaki üretim, yayın, öğrenme, ölçüm ve platform işlemlerini rol temelli olarak yürüten dijital bir platformdur. HapBilgi; firma ile çalışanı, firma ile eczane veya eczane ile Eczanem uygulaması üyesi arasındaki ticari ya da mesleki ilişkinin tarafı değildir.

BLUEBOOK kayıtları aşağıdaki doğrulama kaynakları birlikte değerlendirilerek güncellenir:
1. **İş Modeli ve İşlevsel Kararlar:** Onaylanmış platform modeli, rol sınırları, kullanıcı akışları ve iş kuralları.
2. **Kaynak Kod ve Teknik Envanter:** Güncel uygulama kodu, API rotaları, ortak iş mantığı motorları, yapılandırmalar ve dosya–tür–işlev kayıtları.
3. **Veri Katmanı:** SQL ve migration dosyaları, şema anlık görüntüleri, tablo, view, trigger ve RPC sözleşmeleri. Bir değişiklik, ayrıca doğrulanmadıkça canlı veritabanına uygulanmış kabul edilmez.
4. **Doğrulama Kayıtları:** Commit geçmişi, otomatik testler, tip ve mimari denetimler, üretim derlemesi ile gerçekleştirildiği açıkça belirtilen canlı veya fiziksel kontroller.

Bluebook'taki güncellik ve doğrulama ifadeleri son incelenen sürüm ve belirtilen kontrol tarihi için geçerlidir. Tarihsel test sonuçları güncel sonuç gibi kullanılmaz; canlı ortamda doğrulanmamış bir durum canlıda tamamlanmış veya üretime hazır olarak kaydedilmez.

### Zorunlu arayüz standardı — Sade Kontrol Aileleri

**8 Ekim 2026 kullanıcı kararı:** Bütün sayfa yapılandırmaları, rol ve modül ayrımı olmaksızın, §13'te tanımlanan **Sade Kontrol Aileleri** tasarım ve etkileşim sözleşmesine uymak zorundadır. Onaylı [etkileşimli tasarım referansı](tasarim/SADE_KONTROL_AILELERI.html) bu sözleşmenin parçasıdır. Önceki sayfalarda bulunan farklı seçim, kapsül veya sekme tasarımları yeni çalışmalar için örnek alınamaz. Bu kararın kaydı, mevcut bütün ekranların standarda taşındığı anlamına gelmez.

### Kanonik Zaman Değerleri
HapBilgi'de günlük ölçüm yoktur. Kullanıcıya sunulan ölçüm zamanı seçenekleri yalnızca **Haftalık, Aylık, Dönemlik ve Yıllık** değerleridir; ortak kaynak `lib/utils/raporUtils.ts` içindeki `PERIYOTLAR` listesidir. BM ve TM ana sayfaları haftalık seçimle başlar. Bütün başlangıç ve bitişler Türkiye saatine göre değerlendirilir. Teknik tarih hesaplarında kullanılan gün sınırı (00:00–23:59), bir ölçüm seçeneği değildir.
* **Hafta:** Pazartesi–Pazar.
* **Ay:** 01–28/29/30/31.
* **Dönem:** Ocak–Şubat–Mart, Nisan–Mayıs–Haziran, Temmuz–Ağustos–Eylül veya Ekim–Kasım–Aralık.
* **Yıl:** 01.01.yyyy–31.12.yyyy.

---

# 0. BÖLÜM: GENEL SİSTEM MİMARİSİ, KİMLİK, ROLLER VE GÜVENLİK ANAYASASI
*Platformun Temel Felsefesi, Kullanıcı Alanları, Kimlik Düzlemleri, Rol Hiyerarşisi ve Güvenlik İlkeleri*

*Repo kaynaklarıyla karşılaştırma ve bölüm güncellemesi: 23 Ekim 2026. Bu kayıt kaynak kodun mevcut yapısını belgeler; canlı veritabanı kurulumu veya yeni bir uçtan uca test sonucu değildir.*

### 1. Üç Kimlik Düzlemi, Kullanıcı Alanları ve Öğrenme Zinciri
**Marka ve teknik ad ayrımı:** Platformun kullanıcıya görünen adı **Cogniti**, marka imzası **“Cogniti · bilgi taşır”**dır. Önceki **HapBilgi** adı tarihsel belgelerde, teknik anahtarlarda ve korunmuş dosya/veri adlarında bulunabilir; marka değişimi bu teknik kimlikleri veya geçmiş kayıtları değiştirmez. Kaynaklar: `app/layout.tsx`, `components/marka/CognitiLogo.tsx`.

Cogniti, ilaç ve sağlık sektörüne özgü; rol ve iş kurallarıyla korunan üretim, yayın, öğrenme, ölçüm ve platform işlemlerini tek yapıda birleştiren dijital bir platformdur. Kullanıcı alanları ticari müşteri sınıfları değil, uygulamanın teknik kimlik ve yetki düzlemleridir:
1. **İç Platform Kullanıcıları:** Firma çalışanları, İçerik Üreticisi ve platform yöneticisi teknik olarak `kullanicilar` düzleminde yaşar. Firma kullanıcılarının erişimi firma $\rightarrow$ takım $\rightarrow$ bölge hiyerarşisi ile rol ve yetenek profillerine göre belirlenir.
2. **E-Club Kullanıcıları:** Eczacı, ikinci eczacı, yardımcı eczacı ve eczane teknisyeni `eclub_kisiler` düzleminde yaşar. Kişinin eczane ve firma bağlantıları ayrı üyelik ilişkileri üzerinden kurulur; yapı çok firmalı kullanımı destekler.
3. **Eczanem Uygulaması Üyeleri:** Eczanenin müşterisi veya müşteri adayı olabilen üyeler `eczanem_musteriler` düzleminde yaşar. Üyelik, öğrenme ve platform işlemleri eczane bazındaki aktif üyelik ilişkisi üzerinden yürür.

Platform **Video** (`video`), **Podcast** (`podcast`), **Dijital Broşür** (`gorsel`) ve **Literatür** (`flip_pdf`) öğrenme araçlarını destekler. Yayın ile gerçek öğrenme aracı arasındaki ortak kimlik `yayin_id + arac_id + arac_turu` bileşimidir; rol bazlı puan, soru ve işlem kuralları ilgili kullanıcı alanının kendi motorunda uygulanır.

* **Öğrenme Zinciri:** `Talep` $\rightarrow$ `Üretim veya Hazır Araç` $\rightarrow$ `İnceleme` $\rightarrow$ `Yayın` $\rightarrow$ `Rol Temelli Dağıtım ve Tüketim` $\rightarrow$ `Ölçüm` $\rightarrow$ `İlgiliyse Puan ve Platform İşlemi`.

### 2. Kimlik ve Organizasyon Hiyerarşisi
* **Firma İçi Organizasyon Omurgası:** `firmalar` (Kök) $\rightarrow$ `takimlar` (Takım) $\rightarrow$ `bolgeler` (Saha Bölgesi) zinciri firma içi kullanıcıların kapsamını belirler; E-Club ve Eczanem kimlikleri bu ağacın doğrudan personel düğümleri değildir.
* **3 Kimlik Düzlemi:** İç platform kullanıcıları `kullanicilar`, eczane kullanıcıları `eclub_kisiler`, Eczanem uygulaması üyeleri `eczanem_musteriler` tablosunda saklanır. E-Club'ın eczane ve firma ilişkileri `eclub_eczane_master`, `eclub_eczaneler`, `eclub_eczane_firma`, `eclub_utt_eczane` ve `eclub_kisi_eczane`; Eczanem üyeliği ise `eczanem_uyelikler` üzerinden kurulur.
* **Ortak Giriş:** Üç kimlik düzlemi de `/login` üzerinden e-posta veya cep telefonu ve şifreyle giriş yapabilir. Başarılı girişten sonra kullanıcı, çözümlenen kimlik türü ve rolüne uygun alana yönlendirilir.
* **E-Club Üyelik Daveti:** UTT yeni kişiye şifre vermez. Giriş hesabı bulunmayan kişi şifresiz ve girişe kapalı oluşturulur; 24 saatlik, tek kullanımlık e-posta davetinden `/sifre-olustur` ekranında şifresini iki kez girer. Başarılı kayıtta şifre, e-posta doğrulaması ve Auth erişiminin açılması aynı Auth güncellemesinde yapılır; tarayıcı davetten oturum almaz ve `/login` sayfasına gider. Hazır hesapların şifreleri korunur. UTT daveti yeniden gönderebilir; eski bağlantı geçersizleşir. Gönderim hatası kişi kaydını kaybettirmez.

* **Kimlik ve Rol Çözümleme:** Rol yetkisinin kaynağı istemci metadata'sı değildir. İstemcide `app/providers/AuthProvider.tsx`, oturumu doğruladıktan sonra kullanıcıya daraltılmış `v_auth_kimlik` görünümünden kimlik türünü, rolü ve profil alanlarını okur. Sunucudaki ortak `lib/utils/rolCozucu.ts`, `service_role` SELECT yetkili `v_auth_kimlik_admin` görünümünden rolü çözer; kayıt yoksa veya okuma hatası varsa boş rol döndürür. Mevcut admin API proxy bekçisi ise rolü doğrudan `kullanicilar` tablosundan doğrular. Tüm okuma yollarının aynı yardımcı fonksiyondan geçtiği varsayılmaz; istemci görünümü, sunucu görünümü ve doğrudan admin kontrolü ayrı katmanlardır.

### 3. Rol ve Yetki Anayasası (`lib/utils/roller.ts`)
* **Temel Rol Grupları:**
  * `URETICI_ROLLER` (13 Rol): `pm`, `jr_pm`, `kd_pm`, `med_md`, `egt_md`, `egt_yrd_md`, `egt_yon`, `egt_uz`, `ik_drk`, `ik_md`, `ik_yrd_md`, `ik_uz`, `ik_per` (Yetenek profillerine göre talep, inceleme ve onay akışlarını yürütür).
  * `YONETICI_ROLLER` (7 Rol): `gm`, `gm_yrd`, `drk`, `paz_md`, `blm_md`, `grp_pm`, `sm` (Firma seviyesinde konsolide rapor ve gözlem erişimi kullanır).
  * `ADMIN_ROLLER`: `admin` (Firmalar üstü platform yönetimini yürütür).
  * `YONLENDIRICI_ROLLER`: `tm` (Takım görünümü), `bm` (Bölge öneri ve koçluk yetkisi).
  * `TUKETICI_ROLLER`: `utt`, `kd_utt` (Bölge seviyesinde öğrenme aracı tüketimi, soru, lig ve ilgili mağaza işlemlerini yürütür).
  * `IU_ROLU`: `iu` (İçerik Üreticisi — talebe göre senaryo, seçilen öğrenme aracı ve soru seti üretir).
  * `ECLUB_TUKETICI_ROLLERI`: `eczaci`, `ikinci_eczaci`, `yardimci_eczaci`, `eczane_teknisyeni` (E-Club öğrenme araçlarını tüketen eczane unvanlarıdır).
  * `MUSTERI_ROLU`: `musteri` teknik kimlik değeridir; kullanıcıya dönük karşılığı Eczanem uygulaması üyesidir.
* **UTT pozisyonu — KD_UTT eşdeğerliği (18.10.2026 kararı):** Kıdemli UTT ayrı bir iş rolü veya pozisyon değildir. Mevcut `kd_utt` teknik kodu korunur; işlevsel erişimi `utt` ile aynıdır. Mutabakat menüsü/API erişimi ve BM/TM mutabakat listeleri ortak `TUKETICI_ROLLER` kaynağına bağlandı. `scripts/sql/kd_utt_mutabakat_ve_yayin_bildirimi_esitle.sql` kullanıcı tarafından veritabanında çalıştırıldı; yedi Mutabakat fonksiyonu ve yayın aktivasyon fonksiyonu için sekiz doğrulama satırının tamamında `kd_utt_esitlendi = true` sonucu kullanıcı tarafından iletildi. Kurulu fonksiyonlardaki rol koşulları bu sonuçla doğrulandı. Kullanıcı 18.10.2026 tarihinde marka, URL ve KD_UTT eşitlemesi için gerçek oturumla son ekran ve akış kontrollerini yaptığını ve doğruladığını bildirdi. Kullanıcı rol verisi dönüştürülmez.
* **E-Club Yönetim Grupları:** `ECLUB_GOREN_ROLLER`, E-Club liste yönetimini kullanan UTT/KD_UTT rollerini; `ECLUB_YONETIM_ROLLERI` ve bundan türeyen `ECLUB_LIGI_GOREN_ROLLER` ise UTT/KD_UTT, BM/TM, üretici ve yönetici rollerinin kendi hiyerarşik kapsamlarındaki rapor ve lig erişimini tanımlar.
* **FirmaStore Satın Alma Yetki Ayrımı:**
  * `STORE_ALABILEN_ROLLER`: `[utt, kd_utt, bm]` — Yalnız bu roller kendi harcanabilir puanlarıyla FirmaStore siparişi oluşturabilir ve kendi siparişlerini görebilir.
  * `STORE_GORENLERLER`: Sipariş veren roller ile hiyerarşik gözlem yetkisi bulunan TM, üretici, yönetici ve admin rollerini kapsar.
  * `STORE_GENEL_GOREN_ROLLER`: BM'nin bölgesindeki, TM'nin takımındaki, üretici ve yöneticilerin firmasındaki, adminin ise tüm firmalardaki siparişleri `/store/ekip-magaza-siparisleri` üzerinden görme sınırını tanımlar.
* **Hedef Roller (`talepler.hedef_roller`):** Kişi rolü değil, içeriğin hedef kitlesidir: `utt`, `bm`, `eczaci`, `eczane_teknisyeni`, `eczanem`. Eczacı, ikinci eczacı ve yardımcı eczacı unvanları `eczaci`; eczane teknisyeni `eczane_teknisyeni` hedef kitlesine eşlenir. Yalnız `eczaci` ve `eczane_teknisyeni` hedefleri birlikte seçilebilir. Eczanem hedefli talebi **PM ailesi (`pm`, `jr_pm`, `kd_pm`) ve Medikal Müdür (`med_md`)** açabilir. Ortak kaynak `ECZANEM_TALEP_ACAN_ROLLER = [...PM_AILESI_ROLLER, "med_md"]` listesidir; talep formu, talep/taslak API doğrulamaları ve Yayın Yönetimi hedef görünürlüğü bu kaynağı kullanır. İzinli eğitim türleri ayrıca `lib/uretici/yetenekler.ts` üzerinden doğrulanır; Eczanem hedefli talepte ürün seçimi zorunludur.

### 4. Erişim ve Güvenlik Mimarisi (`proxy.ts` Middleware)
* **Güncel URL kararı (18.10.2026):** Rol bazlı onaylanan adresler ve uygulama doğrulaması `docs/ONAYLI_URL_DEGISIKLIKLERI_2026_10_18.md` dosyasındadır. Aşağıdaki tarihsel dosya envanterinde geçen eski yollar yerine bu güncel URL kaydı esas alınır. C-Club ve E-Club ligleri `/c-club-ligi` ve `/e-club-ligi`; ortak eğitim sayfaları `/egitim-yayinlari/[kategori]` adresindedir. Raporların rol hiyerarşisi, `/admin` ve Eczanem sayfa içi seçim yapısı korunur. **23 Ekim 2026 mevcut yapısında** Cogniti karşılama içeriği `/` ve oturumsuz `/ana-sayfa` üzerinden sunulur; `/login` ayrı giriş ekranıdır. Oturumsuz `/ana-sayfa` isteği proxy tarafından adres çubuğu korunarak `/` içeriğine rewrite edilir; oturumlu kullanıcıda aynı adres mevcut rol panelidir. Karşılama/giriş ayrımı için aşağıdaki güncel kayıt esas alınır. Oturum sonrasında Hakkında menüsü ve ilk mobil Hakkında karşılaması kaldırıldı; `/hakkinda` adresi yönlendirme bırakılmadan kaldırıldı. Eski `/nedir`, `/nasil-calisir` ve `/eczanem/nasil-calisir` sayfaları bulunmaz.
* **Merkezi Güvenlik Kapısı:** Statik varlıklar hariç tüm istekler kök `proxy.ts` (Next.js Node.js runtime) katmanından geçer.
* **Merkezi Erişim Kapıları:**
  1. **Admin API:** `/admin/api/giris` dışındaki `/admin/api/*` rotalarında proxy oturumu ve doğrudan `kullanicilar` kaydındaki `ADMIN_ROLLER` üyeliğini doğrular. Diğer admin uçlarının kendi route handler kontrolleri ayrıca geçerlidir.
  2. **Kullanıcı Yönetimi:** `/kullanicilar/*` sayfa ve API'leri yalnız admin rolüne açıktır.
  3. **Challenge Club:** `/challenge-club/*` ve `/c-club-ligi/*` yollarında proxy oturumu ve firma `cc_aktif` bayrağını denetler. Rol kontrolü ilgili sayfa/API katmanındadır: Challenge Club API'si yalnız BM'ye, C-Club Ligi API'si `CCLIGI_GORENLERLER` grubuna açıktır. Proxy firma kapısı ile uç noktanın rol/kayıt kapsamı kontrolü birbirinin yerine geçmez.
  4. **Eğitim Yayınları ve Katalog:** Ortak sayfa `/egitim-yayinlari/[kategori]`, katalog API'si `/yayin-katalogu/api/*` adresindedir. UTT/KD_UTT ortak eğitim sayfasında kendi tüketim ekranını; BM, TM ve yönetici ailesi katalog ekranını kullanır. Üretici roller bu sayfadan `/tum-yayinlar` adresine yönlendirilir. Katalog API erişimi `YAYINDAKI_VIDEO_GORENLER` ile sınırlıdır; UTT/KD_UTT'nin ortak sayfayı açabilmesi bu API'ye erişim yetkisi vermez. Eski `/yayindaki-videolar` adı güncel rota değildir.
  5. **Üretici Yayın Katalogları:** `/sizin-yayinlariniz` ve `/tum-yayinlar` yalnız `URETICI_ROLLER` kapsamındadır.
  6. **FirmaStore:** `/store/*` yollarında proxy oturumu ve `hbstore_aktif` firma bayrağını kontrol eder; satın alma ve başkalarının siparişlerini görme yetkileri ilgili sayfa/API katmanında ayrı doğrulanır. Ekip siparişleri `/store/ekip-magaza-siparisleri` adresindedir.
  7. **E-Club Hediye Çeki:** `/eclub/store/*`, `/eclub/cek-taleplerim/*`, `/eclub/api/cek-talepleri/*`, `/eclub/hediye-takip/*` ve firma sayfalarının çek talebi/takibi yolları; iç kullanıcıda firma, E-Club kullanıcısında aktif eczane–firma ilişkileri ve `eclub_store_aktif` üzerinden korunur. Firma sayfaları `/eclub/firma/[firma-adi]/hediye-ceki-talebi` ve `/eclub/firma/[firma-adi]/hediye-ceki-takibi` yollarını kullanır; eski firma alt yol karşılıkları da proxy kapsamına dahildir.
  8. **E-Club:** `/eclub/*`, kimlik türüne göre firma veya aktif eczane–firma ilişkileri ve `eclub_aktif` üzerinden korunur.
  9. **Eczanem:** `/eczanem/*`; UTT/KD_UTT, BM, TM, E-Club kullanıcısı ve Eczanem uygulaması üyesi dallarını rol ve ilişki zincirine göre ayırır. BM'nin `/eczanem/bm/mutabakat-takip`, TM'nin `/eczanem/tm/mutabakat-takip` sayfaları ve `/eczanem/bm/api/mutabakat`, `/eczanem/tm/api/mutabakat` uçları kendi rolünü doğrular; kapsamındaki mutabakatları takip etme ve yetkili aşamadaki karar/iletim işlemlerini sunar. `eczanemRolErisimi`, iç kullanıcıda kendi firma bağını, eczane personelinde aktif eczane–firma bağını, üyede üyelik–eczane–firma bağını kullanır; aynı aktif firmada hem `eclub_aktif` hem `eczanem_aktif` açık olmalıdır. Hesap silme, kontrollü kimlik geçişi ve kapalı bilgi ekranının mevcut modül kapısı muafiyetleri korunur.
* **Firma Modül Bayrakları:** `cc_aktif`, `hbstore_aktif`, `eclub_aktif`, `eclub_store_aktif` ve `eczanem_aktif` yalnız arayüz görünürlüğünü değil, ilgili sayfa ve API erişimini de sınırlar.
* **Katmanlı Savunma:** Proxy kapısından sonra hassas route handler'ları kimlik, rol, firma, takım, bölge, eczane ve kayıt sahipliği kontrollerini kendi işlem kapsamlarında tekrarlar. `rolCozucu`, `eclubKisiErisimi` ve `eczanemRolErisimi` ortak erişim kaynaklarıdır; atomik RPC'ler ile veritabanı kısıtları yazma bütünlüğünün son katmanını oluşturur.

### FirmaStore — 21 Ekim 2026

Kullanıcı kararıyla mağazanın görünen adı **FirmaStore** oldu. Önceki HBStore ve Cogniti Store adları navbar, mobil menü, mağaza sayfaları, admin alanı, sayfa rehberleri, takvim, uyarı metinleri ve sipariş push başlığında FirmaStore olarak güncellendi. E25–E29 e-posta metin taslakları da aynı adı kullanır; bu metin değişikliği yeni bildirim gönderimi başlatmaz. `/store` adresleri, `hbstore_aktif`, teknik anahtarlar, rol ve firma erişimi, takvim, puan, stok ve sipariş kuralları korunur. Belgede geçen eski adlar tarihsel kayıt veya teknik kaynak adı olarak bulunabilir.

### Giriş ve Cogniti karşılama sayfası — 23 Ekim 2026

21 Ekim'de tek `/login` sayfasında bulunan tanıtım ve giriş görünümü, 23 Ekim mevcut yapısında ayrı sayfalardır. `app/page.tsx`, ortak `app/_components/KarsilamaSayfasi.tsx` bileşenini sunar; ziyaretçi `/` veya oturumsuz `/ana-sayfa` üzerinden karşılanır. Karşılama kavis/nokta tasarımını, “Bilgiyi ulaştırır, öğrenmeyi motive eder.” başlığını, dört öğrenme aracını ve üç adımlı öğrenme sürecini içerir. Bu tanıtım yüzeyinde `flip_pdf` aracı “Bilimsel Belge” adıyla gösterilir; teknik tür kodu değişmez.

“Giriş Yap” bağlantısı ayrı `/login` sayfasını açar. Giriş ekranında logo formun üstünde ortalanır; tanıtım içeriği ve karşılama navbar'ı bulunmaz. “← Cogniti’yi tanıyın” bağlantısı `/ana-sayfa` adresine gider; aynı sayfada görünüm değiştirme veya eski kaydırma konumunu geri yükleme mekanizması kullanılmaz. Karşılama ve giriş ortak alt bilgi bileşenini kullanır; sözleşmeler mevcut Radix pencerelerinde açılır, şirket iletişimi ve Görünüm anahtarı korunur.

E-posta/telefon girişi, beni hatırla, şifre gösterme, nötr şifre sıfırlama mesajları, davet kontrolü ve firma aktiflik kapısı korunur. Giriş/sıfırlama butonları, seçim kutusu, bağlantılar ve odak çizgileri ortak kontrol renklerine bağlıdır (`--tema-kontrol-eylem`, `--tema-kontrol-odak`); logo SVG'leri korunur. Oturumsuz tema seçimi yalnız tarayıcıya yazılır; hesaba aktarılmaz. Oturum açıldığında hesabın kendi tema tercihi okunur.

Oturum sonrasında Hakkında navbar/mobil bağlantıları ve ilk mobil karşılama metadata yazımı kaldırılmıştır. Üretici `/yayin-yonetimi`, diğer iç kullanıcı `/ana-sayfa`, admin `/admin`, E-Club kişisi `/eclub/ana-sayfa`, Eczanem üyesi `/eczanem` adresine gider. Oturumlu `/ana-sayfa` mevcut rol panelidir; üretici için başlangıç `/yayin-yonetimi` olarak korunur. Eski `/hakkinda` adresi yönlendirme bırakılmadan kaldırılmıştır.

21 Ekim giriş tasarımının tarihsel test ve kontrol sınırları `docs/LOGIN_KARSILAMA_DOGRULAMA_2026_10_21.md` içindedir; bu belge sonraki rota ayrımını tek başına doğrulamaz. Güncel ayrımın yerel davranış kontrolleri `tests/loginKarsilama.hedef.test.ts` ve `tests/karsilamaRotalari.hedef.test.ts` kaynaklarında bulunur. Bu bölüm güncellemesi yeni bir canlı test yapıldığı anlamına gelmez.

### 5. İçerik Üretim Hattı ve Servis Soyutlamaları
* **Dört Öğrenme Aracı:** Üretim hattı Video, Podcast, Dijital Broşür ve Literatür araçlarını ortak üretim sözleşmesi altında, araca özgü dosya, metadata, ilerleme ve tamamlama kurallarıyla yönetir.
* **4 Üretim Varyantı:** V1 (Tam Üretim), V2 (Hazır Öğrenme Aracı), V3 (Hazır Soru Seti), V4 (Hazır Öğrenme Aracı ve Hazır Soru Seti). Varyant ve durum pilleri seçilen aracın gerçek adını gösterir; örneğin hazır kaynak bir podcast ise “Hazır Podcast” yazılır.
* **Tarihsel Teknik Anahtarlar:** Veritabanındaki `video` üretim aşaması ile `hazir_video` alanı geriye dönük uyumluluk için ortak teknik anahtar olarak korunur; kullanıcı arayüzüne doğrudan basılmaz.
* **Bunny Medya Hattı:** Video Bunny Stream TUS hattıyla; Podcast, Dijital Broşür ve Literatür ise süreli imzalı Bunny Storage hattıyla doğrudan yüklenir. Gizli servis anahtarları istemciye açılmaz; dosya türü, boyut, imza, özet ve araca özgü metadata sunucuda doğrulanır.
* **Podcast Kalıcı Taslak ve Kesinleştirme:** Hazır podcast talebinde `/talepler/api/taslak` GET ile kullanıcının taslağına devam etme, POST ile kalıcı taslak oluşturma ve DELETE ile atomik iptal akışını sağlar. Taslak oluşturma `podcast_taslak_atomik_olustur` ile yürür. Talep gönderilirken `/talepler/api`, `taslak_talep_id` sahiplik/firma bağını, podcast dosyasını ve transkript kararının tamamlanmasını doğrular; taslak `podcast_taslak_atomik_kesinlestir` ile kesinleştirilir. Diğer talep oluşturma yolu mevcut `talep_atomik_olustur` sözleşmesini kullanır. Kaynaklar: `app/(panel)/talepler/api/taslak/route.ts`, `app/(panel)/talepler/api/route.ts`. Bu kayıt ilgili RPC'lerin canlı kurulumunun yeniden doğrulandığı anlamına gelmez.
* **Çoklu İÜ Görev Modeli:** Görevler `atama_bekliyor` $\rightarrow$ `hazirlaniyor` $\rightarrow$ `inceleme_bekliyor` $\rightarrow$ `revizyon_bekliyor` $\rightarrow$ `tamamlandi` / `iptal` durum makinesinde ilerler. Atama kaynağı `otomatik`, `manuel`, `devir` veya `gecis` olabilir; otomatik atamada uygun İÜ yük ve yetkinlik kurallarıyla seçilir.

---

# 1. BÖLÜM: T-CLUB (Saha & Temsilci Kulübü)
*İç Kullanıcı Katmanı — Saha Ekibi (UTT, KD_UTT, BM, TM)*

*Repo kaynaklarıyla karşılaştırma ve bölüm güncellemesi: 23 Ekim 2026. Bu güncelleme kaynak kod ve SQL sözleşmelerini belgeler; canlı veritabanı doğrulaması veya yeni otomatik test sonucu değildir.*

### 1. Aşama: Rol ve Görev Tanımları
* **UTT / KD_UTT:** Görünen rol adları sırasıyla **Ürün Tanıtım Temsilcisi** ve **Kıdemli Ürün Tanıtım Temsilcisi**dir (`lib/utils/roller.ts`); işlevsel erişimleri eşdeğerdir. Video, Podcast, Dijital Broşür ve Literatür öğrenme araçlarını `/egitim-yayinlari/[kategori]` ortak sayfasındaki altı eğitim kategorisinde tüketir. Güncel kategori adresleri `urun-egitimleri`, `medikal-egitimler`, `urun-medikal-egitimleri`, `satis-egitimleri`, `yonetim-egitimleri` ve `ik-egitimleri`dir; kaynak `lib/video/uttVideoKategorileri.ts` dosyasıdır. Yayın ile gerçek öğrenme aracı bağı `yayin_id`, `arac_id` ve `arac_turu` kimlikleriyle korunur.
* **Puanlı Öğrenme:** Puan zamanı Türkiye saatiyle hafta içi 07.00–20.29'dur. Uygunluk tamamlanma anından değil, izleme oturumunun **başlangıç zamanından** belirlenir (`app/izle/api/bitir/route.ts`). Normal akışta puan dışı zamanda başlatılan tüketim için izleme kaydı oluşturulmaz; başlatma API'si `puanli_zaman: false` ve `izleme_id: null` döndürür. Geliştirme ortamındaki `mesai_bypass` istisnası `lib/izleme/puanZamani.ts` üzerinden yönetilir; üretim ortamında uygulanmaz. Geçerli turdaki ilk uygun tamamlamada içerik puanı verilir. Doğru cevap ilgili soru puanını kazandırır; yanlış cevap aynı puan kadar kayıp üretir. Soru yanıtında erişim, kaydedilmiş oturumun soru hakkı üzerinden doğrulanır; yanıt anında saat yeniden ölçülmez. Video ileri sarma kaybı, atlanan sürenin içerik puanındaki oransal karşılığıdır. İlk izleme hariç, takvim ayı ile geçerli turun kesişimindeki üçüncü temiz tam tekrarda bir kez Extra puan verilir.
* **Soru Hakkı:** Soru kümesi izleme kimliğine sabitlenir. Soru hakkı, puanlı zamanda başlayan ve ileri sarılmadan tamamlanan ilk gerçek denemeye bağlıdır. Geçerli turda önceki gerçek deneme varsa, o deneme yarım kalmış olsa bile yeni denemede soru hakkı verilmez; mevcut denemedeki ileri sarma da soru hakkını kapatır (`lib/izleme/karar.ts`). Tamamlamadan sonra sorular yanıtlanmadan akış terk edilir ve yeni oturum başlatılırsa önceki oturumun soru hakkı kapanır ve yeniden açılamaz. Cevap API'si `soru_hakki_var_mi`, `soru_erisimi_acik_mi` ve oturuma sabitlenmiş soru indekslerini doğrular.
* **Rapor, Lig ve Mağaza:** UTT/KD_UTT kişisel raporunu (`/raporlar/utt`) ve **T-Club Ligi**'ni (`/t-club-ligi`) izler; firma için **FirmaStore** açıksa kendi harcanabilir puanıyla sipariş oluşturabilir (`/store`). Eski HB Ligi/HBStore adları görünen güncel adlar değildir; `get_hb_ligi_*`, `hbstore_aktif` ve korunmuş teknik dosya adları değiştirilmez.
* **FirmaStore Takvimi ve Dönem Bakiyesi:** Yeni siparişler Türkiye saatiyle **1–7 Ocak, 1–7 Nisan, 1–7 Temmuz ve 1–7 Ekim** günlerinde alınır; pencere ilk gün 00.00'da açılır, sekizinci gün 00.00'da kapanır. API takvim kapısını doğrular; kaynak SQL, kilitlerden sonra veri yazımından önce takvimi yeniden kontrol eder. Açık sipariş penceresinde hemen önce tamamlanan çeyreğin harcanabilir bakiyesi kullanılır; yeni çeyreğin kazanımları o bakiyeye karıştırılmaz. Kullanılmayan puan sonraki çeyreğe devretmez. Harcama ve iadeler siparişin `kaynak_ceyrek_baslangici` alanıyla kaynak döneme bağlanır. İptal, teslim alma ve kargo işlemleri yeni sipariş takviminden bağımsızdır. Kaynaklar: `lib/tclub/store/takvim.ts`, `app/(panel)/store/api/siparis/route.ts`, `scripts/sql/hbstore_donemlik_siparis_takvimi.sql`.
* **BM ve TM:** BM, bölgesindeki aktif UTT/KD_UTT kullanıcılarına UTT hedefli öğrenme içerikleri önerir. Haftalık üç öneri sınırı **gönderen BM–alıcı çifti** üzerinden, önerinin `created_at` değeriyle hesaplanır; hafta Türkiye saatiyle pazartesi başlar. BM'nin takvim ayındaki gönderim kotası bölgesindeki aktif UTT/KD_UTT sayısının on iki katıdır (`lib/tclub/oneri/limitKontrol.ts`). BM kendi bölgesinin, TM ise kendi takımındaki BM–UTT öneri ve performans sonuçlarının hiyerarşik görünümünü izler; öneri oluşturma yetkisi yalnız BM'dedir.
* **Öneri Süresi, Ödülü ve Kaybı:** Başlangıç en erken yarın olabilir; bitiş günü başlangıç gününden sonra olmalıdır. Tarihler Türkiye saatiyle başlangıç günü 07.00 ve bitiş günü 20.30 olarak kaydedilir (`lib/tclub/oneri/tarihKurali.ts`). Puanlı ve ileri sarılmadan tamamlanan öneride pencere uygunluğu izleme başlangıcına göre denetlenir; aynı kullanıcı ve yayın için geçerli turda öneri ödülü bir kez verilir. Ödül tutarı `sistem_ayarlari.oneri_puani` kaynağından okunur (`app/izle/api/bitir/route.ts`). Süresi dolmuş, `izlendi_mi = false` olan ve aynı kullanıcı/yayın için öneri kazancı bulunmayan kayıtlara aynı ayardaki tutar kadar kayıp yazan kaynak `scripts/sql/oneri_kaybi_tara.sql` dosyasıdır; `oneri_id` tekilliği tekrar yazımı engeller. Bu kaynak açıklaması canlı cron veya fonksiyon kurulumunun yeniden doğrulandığı anlamına gelmez.
* **Mobil Yayın Akışı ve Tanbur Navigasyonu:** UTT/KD_UTT ana sayfası ve kategori yayın listeleri, mobilde tek sütun, başlangıçta 2 kayıt açan ve “Daha Fazla Göster” ile her tıklamada 5'er kayıt ekleyen kanonik `MobilYayinAkisi` motorunu kullanır. Kategori veya filtre değişimi akışı 2 kayda sıfırlar; tablet ve masaüstünde yatay raf veya grid düzeni korunur. Sağ kenarda yüzen `HayaletTanburSecici` dikey 3D silindir navigasyonu UTT ve KD_UTT ana sayfalarında aktif durum filtresi açık değilken mobilde bölüm geçişini sağlar; BM ve TM ana sayfalarında ise mevcut `SahaVideoRaflari` içinde render edilir.
* **Önerilen Yayınlar ve Filtreleme:** UTT/KD_UTT için `/oneriler` yüzeyi **Bekleyen, Tamamlanan ve Süresi Dolan** olmak üzere üç durum seçimi sunar. Bekleyen listesi, tamamlanmamış ve başlangıç–bitiş penceresi içinde bulunan önerileri gösterir. Yayın türü filtresi `UttYayinTuruToggle`, liste ise `UttYayinListeAkisi` ile sunulur; durum veya tür değişikliği mobil akışı sıfırlar. Bu görünümün filtrelemesi eski `IcerikFiltreBari` arama düzeniyle açıklanmaz. `/oneriler/tamamlanan` adresi korunur ve aynı `UyeOnerilerGorunumu` bileşenini Tamamlanan varsayılanıyla açar. Öneri kartı künyesi ve puan rozetleri HOYK (`YayinKarti`) ile standartlaştırılmıştır.
* **HOYK Puan Görünürlüğü ve Önbellek Mimarisi:** Ortak `YayinKarti` üzerinde ürün adı mobilde `text-base leading-[22px] font-bold`, masaüstünde `sm:text-xs` uygulanır. Video puanı `video_puani != null` olduğunda mobilde `{video_puani} P`, tablet ve masaüstünde `{video_puani} Puan` olarak (önünde “+” bulunmaksızın) tüm rollerde şeffaf gösterilir; puanların görünmesi puan kazanma yetkisi doğurmaz, yetki ve kazanım kuralları API düzeyinde korunur. Extra puan yalnız `extra_puan > 0` olduğunda `+{extra_puan} Extra` olarak gösterilir. UTT ana sayfa verileri kullanıcı kimliğine göre izole edilerek önbelleğe alınır (`utt_anasayfa_veri_${user.id}`) ve aynı cihazdaki hesaplar arasında veri karışması engellenir; organizasyon zinciri için 5 dakikalık bellek içi önbellek (`ORG_CACHE_TTL = 5 * 60 * 1000`) entegre edilmiştir. Store günleri ana sayfa pill'inde gösterilir, navbar sayaç tekrarı bulunmaz.

### 2. Aşama: Kod Taraması ve Görev İlişki Matrisi
* **Tüketim ve Puan:** `app/(panel)/egitim-yayinlari/[kategori]/`, `lib/video/uttVideoKategorileri.ts`, `components/izle/VideoOynatici.tsx`, `app/izle/api/`, `lib/tclub/puan/`, `lib/tclub/tur/`, `lib/izleme/`, `lib/ogrenmeAraci/`, `components/yayin/YayinKarti.tsx`, `components/yayin/MobilYayinAkisi.tsx`, `components/navigasyon/HayaletTanburSecici.tsx`.
* **Öneri, Rapor ve Lig:** `app/(panel)/oneriler/`, `app/(panel)/oneriler/tamamlanan/`, `app/(panel)/oneriler/_components/UyeOnerilerGorunumu.tsx`, `components/yayin/UttYayinListeOrtaklari.tsx`, `components/yayin/katalog/YayindakiVideoBolumu.tsx`, `app/(panel)/yayin-katalogu/api/`, `app/(panel)/raporlar/utt/`, `app/(panel)/raporlar/bm/`, `app/(panel)/raporlar/tm/`, `app/(panel)/t-club-ligi/`, `lib/tclub/oneri/`, `lib/tclub/hbligi/`.
* **FirmaStore:** `app/(panel)/store/` ve `lib/tclub/store/`. Stok, bakiye, sipariş ve harcama yarışları `store_siparis_olustur`, `store_siparis_iptal` ve `store_teslim_aldim` RPC'leriyle atomik olarak yönetilir; dönem takvimi ve bakiye kaynağı `scripts/sql/hbstore_donemlik_siparis_takvimi.sql` içinde kayıtlıdır.
* **Güvenlik Kapıları:** Gerçek oynatma başlamadan izleme oturumu oluşturulmaz; yayın, rol, firma, takım, geçerli tur, puan zamanı, soru erişimi ve öğrenme aracı kimliği sunucuda yeniden doğrulanır. Tamamlama API'si `lib/ogrenmeAraci/tamamlamaKapisi.ts` üzerinden yayının yayında olmasını, aracın kullanıma açık olmasını ve video dışındaki araçlarda araca uygun `tamamlama_kaniti` verisini doğrular; videoda tamamlama kanıtı bu kapıda aranmaz, sunucuda geçen süre ve onaylı ileri sarma süresi RPC içinde denetlenir. Tamamlama ve soru erişimi `utt_izleme_tamamla` RPC'sine bağlanır.

**Doğrulama kaydı — 3 Eylül 2026:** T-Club tüketim, puan, soru, kategori, lig, mağaza ve ortak öğrenme aracı sözleşmelerine yönelik seçili otomatik testlerin **18 / 18'i başarılıdır**.

### 3. Aşama: Depo Şema ve DDL Kaydı
Bu kayıt canlı veritabanı doğrulaması değildir. `scripts/denetim/sema.json` içindeki **31 Ağustos 2026 tarihli depo şema anlık görüntüsü** ile kaynak SQL sözleşmelerini ifade eder.

* **Tüketim ve Puan Tabloları:** `izleme_kayitlari`, `kazanilan_puanlar`, `ileri_sarma_kayitlari`, `yanlis_cevap_kayitlari`, `soru_cevaplari`, `oneri_kayip_kayitlari`, `oneri_kayitlari`, `yayin_tekrar_kayitlari`.
* **FirmaStore Tabloları:** `store_urunler`, `store_urun_firma_ayarlari`, `store_siparisler`, `store_puan_harcamalari`, `store_adresler`.
* **Rapor, Lig ve İşlem RPC'leri:** `get_hb_ligi_haftalik_v2`, `get_hb_ligi_aylik_v2`, `get_hb_ligi_donemlik_v2`, `get_hb_ligi_yillik_v2`, `get_harcama_bakiyesi`, `get_oneri_listesi`, `get_bm_oneri_durumu_v1`, `get_tm_oneri_durumu_v1`, `store_siparis_olustur`, `store_siparis_iptal`, `store_teslim_aldim`.
* **Güncel Tamamlama ve Soru Sözleşmesi:** `utt_izleme_tamamla`, `izleme_kayitlari` üzerindeki tamamlanma durumu, soru hakkı, sabit soru indeksleri ve `soru_erisimi_acik_mi` alanının güncellenmesini yönetir. Kaynaklar: `scripts/sql/utt_izleme_tamamla_rpc.sql`, soru erişimini güncelleyen `scripts/sql/soru_kesinti_faz2_tamamla.sql` ve `app/izle/api/bitir/route.ts`. Video dışındaki araçlara özgü `tamamlama_kaniti`, API'de ortak tamamlama kapısından geçirilir; video için RPC'nin sunucu süresi kontrolü geçerlidir. Öneri kaybı tarama fonksiyonu `oneri_kaybi_tara`, mağaza takvim fonksiyonu `hbstore_siparis_donemi_acik_mi` kaynak SQL envanterine dahildir. Bunlar eski şema anlık görüntüsüne ek kaynak sözleşmeleridir; canlı kurulum teyidi değildir.

---

# 2. BÖLÜM: C-CLUB (Challenge Club — Yönetici Öğrenmesi)
*Bölge Müdürleri Arası Yarışma ve Öğrenme Katmanı*

*Repo kaynaklarıyla karşılaştırma ve bölüm güncellemesi: 23 Ekim 2026. Bu kayıt uygulama kodunu ve SQL kaynak sözleşmelerini belgeler; canlı veritabanı kurulumu veya yeni uçtan uca kullanıcı testi anlamına gelmez.*

### 1. Aşama: Rol ve Görev Tanımları
* **BM $\rightarrow$ BM Challenge:** C-Club tüketimi ve challenge gönderimi yalnız aktif ve aynı firmadaki BM kullanıcıları arasında çalışır. Firma aktif ve `cc_aktif` açık olmalıdır. BM kendisine challenge gönderemez ve yalnız geçerli turda önce kendisinin tamamladığı Video, Podcast, Dijital Broşür veya Literatür aracını challenge'a dönüştürebilir. Yayın–araç bağı `yayin_id`, `arac_id` ve `arac_turu` ile korunur.
* **Gönderim Sınırları ve Tur:** Bir BM Türkiye takvim ayında en fazla üç challenge gönderir. Aynı gönderenden aynı alıcıya takvim ayında yalnız bir challenge gönderilebilir. Aynı öğrenme aracı aynı alıcıya aynı turda yeniden gönderilemez; aracı geçerli turda tamamlamış veya aynı araç için geçerli turda bekleyen challenge'ı bulunan alıcı seçilemez. İki BM'nin aynı ay birbirine karşılıklı challenge göndermesi serbesttir. Gönderim SQL'i geçerli turu esas alır. **Bulgu 1 düzeltmesi — 23 Ekim 2026:** POST akışı mevcut ortak `gecerliTur` kaynağından tur başlangıcını doğrulayıp alıcı kontrolüne iletir. `lib/cclub/tekrarIzlemeKontrol.ts`, yalnız `izleme_baslangic >= turBaslangici` olan tamamlanmış oturumları engel sayar. Önceki turda tamamlayan alıcı, diğer gönderim koşulları uygunsa yeniden challenge alabilir; mevcut turda tamamlayan alıcı engellenir, yarım izleme tamamlanmış sayılmaz. Aylık kota ve aynı alıcıya aylık gönderim sınırı mevcut kontrollerle sürer. Gönderenin geçerli turda tamamlaması son aşamada atomik `cc_challenge_gonder` RPC'sinde doğrulanır. Bu düzeltme yalnız alıcı ön kontrolü ve API bağlantısını değiştirir; SQL değişikliği gerektirmez.
* **Puan ve Tamamlama:** Challenge oluşturulunca gönderene `sistem_ayarlari.cc_gonderme_puani` yazılır. Alıcı uygun öğrenme aracı oturumunu tamamladığında içerik puanı, doğru cevaplarında ilgili soru puanı kazanır; yanlış cevap aynı soru puanı kadar kayıp üretir. İleri sarılmış oturumda içerik puanı ve soru hakkı verilmez; ileri sarma kaybı ayrıca kaydedilir. İncelenen C-Club başlatma/tamamlama akışında UTT'nin mesai saati kapısı uygulanmaz; başlatma yanıtı `puanli_zaman: true` döndürür. İlk izleme hariç, takvim ayı ile geçerli turun kesişimindeki ikinci temiz tam tekrarda bir kez Extra puan verilir.
* **Challenge Durumu ve Referral Ayrımı:** Öğrenme aracı tamamlanınca `cc_izleme_tamamla`, `challenge_kayitlari.izlendi_mi = true` yapar; bu olay referral puanı vermez. Referral, atanmış soruların geçerli cevapları `cc_cevaplari_kaydet` ile kaydedildiğinde gönderene bir kez yazılır. Bütün cevapların doğru olması gerekmez; yanlışlar alıcının kaybına işlenir. Referral tutarı `sistem_ayarlari.cc_referral_puani` kaynağından okunur. Gönderme ve referral ayarları bulunmazsa her biri için 10 puan kullanılır. Gelen challenge bildiriminin kapanması `izlendi_mi` değişimine bağlıdır; soru cevaplama ve referral ayrı aşamadır.
* **Süresiz Bekleme:** Challenge için iş kuralı olarak süre sonu veya süre aşımı kaybı bulunmaz; kayıt öğrenme aracı tamamlanana kadar bekler. Tarihsel `son_tarih` alanı korunur; güncel gönderim SQL'i, değer verilmediğinde 100 yıl ilerisiyle teknik uyumluluğu sağlar. `cc_yeni_puanlama_modeli.sql` süre aşımı cron'unun kapatılmasını tanımlar; `challenge_kaybi_tara.sql` tarihsel/devre dışı pakettir ve yeniden uygulanmamalıdır. **Bulgu 2 düzeltmesi — 23 Ekim 2026:** Kullanıcının ayrı onayıyla `soru_kesinti_faz5_cevap.sql` ve `cc_izleme_cevap_guvenligi.sql` kaynaklarındaki eski tarih reddi kaldırıldı. Sahiplik, tamamlama, ileri sarma, soru erişimi, atanmış soru kümesi, cevap tekilliği ve referral kuralları korundu. Kullanıcı paketi çalıştırıp `cc_suresiz_cevap_hazir = true` sonucunu iletti; veritabanı uygulaması bu sonuçla 23 Ekim 2026 tarihinde doğrulandı. Gerçek kullanıcıyla cevap/referral akışı ayrıca test edilmiş sayılmaz.
* **Tüketim Modları ve Bekleyen Challenge Kilidi:** İzleme türleri `kendi_izleme`, `challenge` ve `extra` olarak ayrılır. Aynı yayın için geçerli turda bekleyen challenge varsa BM bağımsız izleme başlatamaz; Gelen Challengelar üzerinden açmalıdır. Tamamlanmış challenge tekrar açılırsa `extra` moduna geçer ve yeni oturum challenge bağından ayrılır. Challenge olmadan açılan yayında geçerli turdaki önceki tamamlama, kendi izleme/Extra ayrımını belirler.
* **Soru Hakkı:** Soru kümesi izleme kimliğine sabitlenir. Sorular ileri sarılmamış `kendi_izleme` veya `challenge` oturumlarında açılır; Extra oturumunda açılmaz. Tamamlamadan sonra sorular yanıtlanmadan yeni oturum başlatılırsa önceki soru erişimi kapanır. Soru okuma ve cevap API'leri sahiplik, tamamlanma, ileri sarma, `soru_erisimi_acik_mi`, `cevaplandi_mi` ve sabit soru kümesini doğrular. Başarılı cevap kaydı erişimi kapatır; aynı oturum ikinci kez cevaplanamaz.
* **Lig, Gözlem Yetkisi ve Mağaza:** Güncel lig adresi **`/c-club-ligi`**, görünen mağaza adı **FirmaStore**'dur. Lig yarışmacıları BM'lerdir; TM, üretici, yönetici ve admin gözlem erişimi `CCLIGI_GORENLERLER` ile tanımlanır. Lig haftalık, aylık, dönemlik ve yıllık ölçüm sunar; olağan kullanıcı lig sonuçları kendi firmasına daraltılır. Net puan = izleme + cevaplama + Extra + gönderme + referral − ileri sarma kaybı − yanlış cevap kaybı. Süre aşımı challenge kaybı bu formüle dahil değildir. BM kendi harcanabilir puanını firma için `hbstore_aktif` açıksa FirmaStore'da kullanabilir; sipariş takvimi ve dönem bakiyesi 1. bölümdeki FirmaStore kurallarına tabidir. Görünen ad değişikliği `get_cc_ligi_*` gibi teknik adları değiştirmez.
* **Challenge Club Ekranı ve Çok Alıcılı Gönderim:** `/challenge-club` ekranı **Yayınlar, Challenge Gönder, Gönderilen Challengelar ve Gelen Challengelar** sekmelerini sunar; her sekmenin yayın türü filtresi ayrı tutulur. Challenge Gönder, tamamlanan yayınlardan birini ve birden fazla alıcı BM'yi seçmeyi sağlar. POST, `alan_idler` listesindeki tekrarları ayıklar; alıcıları sırayla işler, başarılı her gönderim kotayı tüketir. Yanıt `gonderilen`, `gonderilen_sayisi` ve gerekçeli `atlanan` listesini içerir. Atomiklik challenge başınadır; çok alıcılı isteğin tamamı tek transaction değildir.
* **Mobil Yayın Akışı ve HOYK Standardı:** Challenge Club ana sayfasındaki yayınlar ile gelen ve giden meydan okuma listeleri mobilde kanonik `MobilYayinAkisi` (2+5 dikey liste) motorunu kullanır; tablet ve masaüstünde `masaustuIcerik` ile grid düzeni korunur. Kartlarda `YayinKarti` (HOYK) standart kapsül ve tipografi hiyerarşisi kullanılır; BM ana sayfasında `SahaVideoRaflari` üzerinden `HayaletTanburSecici` navigasyonu aktiftir.

### 2. Aşama: Kod Taraması ve Görev İlişki Matrisi
* **Challenge ve Katalog:** `app/(panel)/challenge-club/`, `components/challenge-club/ChallengeGonderPaneli.tsx`, `components/challenge-club/CcVideoOynatici.tsx`, `components/yayin/YayinKarti.tsx`, `components/yayin/MobilYayinAkisi.tsx`, `components/navigasyon/HayaletTanburSecici.tsx`, `components/ana-sayfa/SahaVideoRaflari.tsx`, `lib/cclub/kayit.ts`, `lib/cclub/kotaKontrol.ts`, `lib/cclub/uygunAliciListesi.ts`.
* **Tüketim, Puan ve Tur:** `app/(panel)/challenge-club/izle/api/`, `lib/cclub/izleme/`, `lib/cclub/puan/`, `lib/cclub/tekrarIzlemeKontrol.ts`, `lib/tclub/tur/kayit.ts`, `lib/ogrenmeAraci/tamamlamaKapisi.ts`.
* **Lig ve Mağaza:** `app/(panel)/c-club-ligi/`, `lib/utils/roller.ts` (`CCLIGI_GORENLERLER`, `STORE_ALABILEN_ROLLER`), `app/(panel)/store/`, `lib/tclub/store/`.
* **Güvenlik ve Tamamlama Kapıları:** Gönderici, alıcı, firma, modül, yayın, tur ve araç kimliği sunucuda doğrulanır. Video sunucu süresi ve onaylı ileri sarma kayıtlarıyla; podcast, dijital broşür ve literatür kendi `tamamlama_kaniti` verileriyle doğrulanır. Challenge ile gönderme puanı `cc_challenge_gonder` içinde atomiktir. Tamamlama ve cevap/puan/referral işlemleri sırasıyla `cc_izleme_tamamla` ve `cc_cevaplari_kaydet` içinde ayrı atomik işlemlerdir. Cevap fonksiyonu izleme ve challenge satırlarını kilitler; sahiplik, soru erişimi, atanmış küme ve mükerrer cevap kontrolleri korunur. Doğrudan istemci yazımı yerine sunucu işlemleri ve `service_role` yetkisi kullanılır.

**Doğrulama kaydı — 3 Eylül 2026:** C-Club challenge, tüketim, puan, soru, lig, yetki ve ortak öğrenme aracı sözleşmelerine yönelik seçili otomatik testlerin **18 / 18'i başarılıdır**. Bu tarihsel sonuç 23 Ekim güncellemesinin test sonucu değildir.

**Bulgu 1 doğrulaması — 23 Ekim 2026:** `tests/ccAliciGecerliTur.hedef.test.ts` ve gönderim/yaşam döngüsü için seçili iki smoke test dosyasında **16 / 16 kontrol başarılıdır**. Dört öğrenme aracında önceki turdan yeniden gönderim, mevcut turda tamamlamanın engellenmesi, yarım izleme, aylık üçüncü/dördüncü gönderim sınırı, aynı alıcıya aylık tek gönderim ve tur okuma hatası; gerçek kontrol fonksiyonları ve POST handler'ı sahte veritabanı bağımlılıklarıyla çalıştırılarak doğrulandı. SQL veya gerçek veritabanında işlem yapılmadı; 2. bulgu bu değişikliğin kapsamında değildir.

**Bulgu 2 kaynak doğrulaması — 23 Ekim 2026:** `tests/ccSuresizCevap.hedef.test.ts` ile cevap güvenliği ve yetkilendirmeye ilişkin seçili iki smoke test dosyasında **9 / 9 kontrol başarılıdır**. Geçişin güncel cevap gövdesiyle eşleştiği, yalnız C-Club fonksiyonunu değiştirdiği, tarih engelini kaldırıp diğer kapıları koruduğu kaynak metinleri üzerinden denetlendi. Bu kaynak kontrolleri sırasında SQL veritabanında çalıştırılmamıştı. Sonrasında kullanıcı SQL uygulamasının `cc_suresiz_cevap_hazir = true` sonucunu iletti; bu sonuç gerçek kullanıcıyla cevap/referral akışının uçtan uca testi değildir.

### 3. Aşama: Depo Şema ve DDL Kaydı
Bu kayıt canlı veritabanı doğrulaması değildir. `scripts/denetim/sema.json` içindeki **31 Ağustos 2026 tarihli depo şema anlık görüntüsü** ile daha sonraki kaynak SQL sözleşmelerini ifade eder.

* **Çekirdek Tablolar ve Görünüm:** `challenge_kayitlari`, `cc_izleme_kayitlari`, `cc_kazanilan_puanlar`, `cc_ileri_sarma_kayitlari`, `cc_yanlis_cevap_kayitlari`, `cc_ligi_ozet`, `v_cc_challenge_listesi`.
* **Çekirdek RPC'ler:** `cc_arac_kimligi_dogrula`, `cc_challenge_gonder`, `cc_izleme_tamamla`, `cc_cevaplari_kaydet`, `cc_challenge_tamamlaninca_bildirim_kapat`, `_cc_ligi_aralik` ve dönemsel `get_cc_ligi_*` ailesi.
* **Güncel Araç/Tamamlama Kaynakları:** `scripts/sql/cc_ogrenme_araci_yayin_kimligi.sql`, `scripts/sql/cc_ogrenme_araci_tamamlama.sql`, `scripts/sql/soru_kesinti_faz2_tamamla.sql`, `scripts/sql/soru_kesinti_faz5_cevap.sql`. Araç kimliği, araç bazlı kanıtlar, `soru_indeksleri`, `soru_erisimi_acik_mi`, `cevaplandi_mi` ve challenge durumu/referral ayrımı bu kaynaklarla izlenir. Dosyalar aynı fonksiyonun farklı tarihli sürümlerini içerebilir; eski paketler güncel aracın doğrulamasını geri alacak şekilde yeniden uygulanmaz.
* **Puan, Lig ve Yetki Kaynakları:** `scripts/sql/cc_yeni_puanlama_modeli.sql`, `scripts/sql/cc_izleme_cevap_guvenligi.sql`, `scripts/sql/cc_yetkilendirme_guvenligi.sql`.

* **Bulgu 2 — Veritabanı Uygulaması Doğrulandı (23 Ekim 2026):** `scripts/sql/cc_suresiz_challenge_cevap.sql`, yalnız `public.cc_cevaplari_kaydet(uuid, uuid, jsonb)` fonksiyonunu günceller. E-Club/Eczanem fonksiyonlarına ve geçmiş verilere dokunmaz. Kullanıcı SQL uygulaması sonucunda `cc_suresiz_cevap_hazir = true` çıktısını paylaştı. Bu kontrol, kurulu fonksiyonda eski `v_challenge.son_tarih` koşulunun bulunmadığını ve soru erişimi, satır kilidi ile referral ifadelerinin bulunduğunu doğrular. Gerçek cevap/referral akışına ilişkin yeni bir uçtan uca test yapılmadı.

---

# 3. BÖLÜM: E-CLUB (Eczane Kulübü)
*Eczane Kullanıcı Katmanı — Çok Firmalı Öğrenme, Takım, Lig, Rapor ve Ödül Yapısı*

*Repo karşılaştırması ve 9 alanın belge güncellemesi: 23 Ekim 2026. Bu çalışma yalnız bu bölümü günceller; uygulama/SQL değişikliği, yeni veritabanı işlemi veya yeni test sonucu içermez. Tarihsel test ve kullanıcı doğrulamaları kendi tarih ve kapsamlarıyla korunur.*

### 1. Aşama: Rol ve Görev Tanımları
* **Amaç ve Kapsam:** E-Club, ürün tanıtım temsilcilerinin sorumlu oldukları eczanelerde görev yapan eczacı ve eczane teknisyenlerinden öğrenme takımları oluşturduğu HapBilgi alanıdır. Eczane ve üye yönetimi, öğrenme aracı gönderimi ve tüketimi, puanlama, raporlama, E-Club Ligi ve hediye çeki süreçleri bu yapı içinde yürütülür.
* **E-Club Kullanıcıları:** `eczaci`, `ikinci_eczaci`, `yardimci_eczaci` ve `eczane_teknisyeni` ayrı unvanlardır. İlk üç unvan yayın hedeflemesinde `eczaci`, teknisyen ise `eczane_teknisyeni` hedef grubuna bağlanır. Eczanede yalnız bir aktif ana `eczaci` kaydı bulunabilir; ikinci ve yardımcı eczacı ayrı unvanlarla yaşar.
* **UTT / KD_UTT Görevi:** UTT/KD_UTT, sorumluluk alanındaki onaylı eczaneleri kişisel listesine bağlar, E-Club Takımı'nı ve takım adını yönetir, eczane kullanıcılarını takıma ekler, uygun öğrenme araçlarını seçtiği üyelere gönderir ve gönderim, tamamlama, cevap ve puan sonuçlarını izler.
* **E-Club Takımım (`/eclub/eczaneler-takimim`):** UTT/KD_UTT, takımına ad verir (`eclub_takim_adlari`), onaylı GLN üzerinden eczaneleri kendi listesine bağlar, eczane kullanıcılarını görüntüler, ekler, günceller veya eczanedeki üyeliklerini pasife alır. Resmi listede bulunmayan GLN için eczane adı, il ve ilçe girilerek admin onayı istenebilir; kayıt `bekliyor` durumunda tutulur, onaylanmadan UTT listesine bağlanmaz. Kişi ekleme yalnız bir iletişim kaydı değildir; aktif kişi–eczane bağı, kişinin hangi takımda yer aldığını, kimden içerik alabileceğini, kazandığı çekli puanın hangi eczaneye ait olduğunu ve hangi eczanenin çek bildirimlerini görebileceğini belirler.
* **BM/TM Takım ve Yayın Görünümleri:** `/eclub/eczaneler-takimim` ve `/eclub/yayinlar` sayfaları BM ve TM için ayrı yönetim görünümleri sunar. BM kendi bölgesindeki, TM kendi takımındaki yetkili UTT kapsamına göre eczane, üye ve yayın/gönderim bilgilerini izler. Seçilen UTT sunucuda yönetim kapsamına karşı doğrulanır; UTT'nin üye yönetimi ve gönderim eylemleriyle yöneticinin gözlem ekranı aynı yetki olarak kabul edilmez. Kaynaklar: `app/(panel)/eclub/eczaneler-takimim/api/route.ts`, `app/(panel)/eclub/yayinlar/api/bm/route.ts`, `lib/eclub/yonetimKapsami.ts`.
* **Üyelik Davetini Yeniden Gönderme:** `app/(panel)/eclub/listem/api/davet/route.ts`, mevcut üyelik davetini `lib/eclub/uyelikDaveti.ts` üzerinden yeniden gönderir. Davet hesabı bulunması ve ilgili kişinin yetkili kapsamda olması denetlenir; kişi kaydı ve davet gönderim işlemi ayrı izlenir.
* **Kurumsal Eczane ve Liste Üyeliği:** `eclub_eczane_master` onaylı GLN kaynağıdır; `eclub_eczaneler` platform eczanesini, `eclub_eczane_firma` firma–eczane kurumsal bağını tutar. Bu bağdan `eclub_utt_eczane` ile UTT'nin kişisel liste üyeliği, `eclub_kisi_eczane` ile E-Club kullanıcısının eczane ilişkisi ayrılır. Eczane tek bir firmanın mülkiyetinde değildir. Aynı firmanın birden fazla UTT'si aynı kurumsal eczane bağında ayrı üyelikler kurabilir. Bir UTT'nin listeden çıkması diğer UTT üyeliklerini bozmaz; son aktif UTT de çıktığında firma–eczane bağı pasife alınır, eczane kimliği silinmez.
* **Kişi–Eczane ve Puan Aidiyeti:** Çekli puan, kazanıldığı anda kişinin aktif olarak bağlı bulunduğu eczaneye sabitlenir. Kişinin daha sonra pasife alınması, başka bir eczaneye bağlanması veya önceki eczaneyle ilişkisinin sona ermesi, daha önce kazandığı puanın eczane aidiyetini değiştirmez.
* **E-Club Yayın Ayarları:** E-Club; Video, Podcast, Dijital Broşür ve Literatür öğrenme araçlarını destekler. Yayın ile gerçek öğrenme aracı bağı `yayin_id`, `arac_id` ve `arac_turu` kimlikleriyle korunur. Üretici rol, E-Club yayınını yayına alırken puanı `Çekli Puan` veya `Çeksiz Puan` olarak belirler. Çekli Puan E-Club performansı, lig ve hediye çeki hesabına; Çeksiz Puan yalnız E-Club performansı ve lig hesabına katılır.
* **Sipariş Şartı ve Çek Karşılığı:** Üretici rol, Çekli Puan yayınında siparişi zorunlu veya zorunlu değil olarak belirler; puan–TL dönüşümünü ve sipariş baremlerini tanımlar. Sipariş zorunluysa çek hakkı için tanımlanan ürün siparişi verilmelidir. Sipariş zorunlu değilse eczacı sipariş vermeden çek işlemini başlatabilir; sipariş verilirse çek tutarı üretici rolün belirlediği oran kadar artırılabilir.
* **Öneri ve Tüketim:** E-Club yayını bütün üyelere doğrudan dağıtılmaz. UTT/KD_UTT, kendi firma ve takım kapsamındaki, incelemesini tamamladığı yayını kişisel listesindeki uygun E-Club üyelerine gönderir veya planlar. Yayın mühürlüdür; `yayin_id` sabit kalırken öğrenme aracı değiştirilmez. `arac_id` ve `arac_turu` içerik ilişkisini korur; tekrar ve kota hesabının kimliği değildir. Yeni gerçek gönderimin puanlı ve sorulu geçerliliği, gerçek gönderim başlangıcından itibaren 15 gündür. Süresi geçmiş öneri tüketilebilir ancak puan ve soru hakkı vermez. Hafta sonu öğrenme engeli yoktur.
* **Gönderim ve Plan Kotaları:** Haftalık hesap UTT + üye + `urun_id` üzerinden, Türkiye saatinde Pazartesi–Cuma için yapılır; gerçekleşmiş gönderimler ve bekleyen/işlenen planların toplamı en fazla 3'tür. Yeniden gönderim hesabı UTT + üye + `yayin_id` üzerindendir. İlk gönderim ayrı tutulur; Ocak–Şubat, Mart–Nisan, ... takvim dönemlerinde en fazla 2 yeniden gönderim bulunabilir. Önceki ve sonraki ilgili gönderim/planla en az 15 gün korunur; dönem değişmesi bu aralığı kaldırmaz. Eski 7 günlük süre ve araç kimliğine/bitişe bağlı 21 günlük bekleme kullanılmaz.
* **Planlama Sınırları ve Gerçekleşme:** Plan için yalnız Türkiye takvim tarihi seçilir; saat seçimi veya varsayılan saat yoktur. Hedef Pazartesi–Cuma ve gelecekte olmalıdır. Haftalık planlama en fazla takip eden haftaya, dönem planlaması yalnız içinde bulunulan iki aylık döneme yapılır; iki sınır birlikte uygulanır. Hafta sonu plan oluşturulabilir, hafta sonuna gönderim hedefi verilemez. Plan ayrı `eclub_yayin_gonderim_planlari` tablosunda tutulur; plan kaydı üyeye yayın/bildirim iletmez veya tamamlama süresini başlatmaz. Dakikalık işleyici hedef günü geldiğinde uygunluğu tekrar doğrular; öneri ve plan sonucu aynı transactionda yazılır. Gerçekleşmiş plan ayrıca kota tüketmez. Günü geçmiş, yetkisi kalkmış veya yayını durmuş plan gerçekleşmez; nedeni saklanır, hedef başka güne kaydırılmaz. Aynı plan ikinci öneri oluşturmaz.
* **UTT Yayın Ekranı:** `/eclub/yayinlar` ekranında Tümü, Gönderime Hazır, Planlananlar, Gönderilenler kapsülleri vardır. Gönderime Hazır, UTT'nin izleyip/dinleyip/görüp/okuyarak incelemesini tamamladığı yayındır; alıcı ve kota uygunluğu ayrıca kontrol edilir. Statüler örtüşebilir. Planlananlar sayacı bekleyen/işlenen planı olan benzersiz yayınları sayar; gerçekleşmeyen planlar da nedenleriyle gösterilir. Seçilmiş yayınlar ve alıcılar yeni toplu API ile birlikte kontrol edilir; kalan hak/engel nedeni ve kayıt öncesi özet gösterilir.
* **Yayın Bildirimi:** Bildirim yalnız gerçek öneri oluştuğunda uygulama içine yazılır; başarılı yazımdan sonra aynı öneri kimliğiyle Web Push çağrılır. Push geçici hatalarda en fazla üç kez aynı bildirimi dener; yeni yayın gönderimi yapmaz. Uygulama içi bildirim insert hatası loglanır ve bu yolda otomatik yeniden deneme yoktur; push başlatılmaz. Gerçek cihaz teslimatı yerel test sonucu olarak kaydedilmez.
* **Puan Kuralları:** Aktif öneride uygun tamamlama ve doğru cevaplar puan kazandırır. İleri sarma, atlanan sürenin öğrenme aracı puanındaki oransal karşılığı kadar kayıp üretir ve soru hakkını kapatır; yanlış cevap kayıp üretmez. Soru kümesi izleme kimliğine sabitlenir ve tamamlamadan sonra terk edilen soru hakkı yeni oturumda yeniden açılmaz. E-Club üyeleri için Extra puan uygulanmaz. Yeni gönderim kurgusu üyenin mevcut yeniden gönderimde puan davranışını değiştirmez; aynı izleme kaydında mükerrer kazanımı önleyen kontroller korunur.
* **Yeni Gönderim Operasyonu ve Doğrulama:** Kurulum/dağıtım sırası ve salt okunur kontrol sorguları `docs/ECLUB_GONDERIM_OPERASYON_REHBERI.md` içindedir. Adım 11'de izole PostgreSQL'de 41/41 ve ilgili yerel regresyonda 64/64 test geçti (`docs/ECLUB_GONDERIM_ADIM11_TEST_SONUCLARI.json`). Kullanıcı Adım 3–7 yapısal SQL kontrollerini ve ilk kurulumda cron'un tek, dakikalık, pasif olduğunu doğruladı. Operasyon rehberinde, kullanıcının **14 Ekim 2026** tarihli `cron.job` çıktısı iş kimliği 14, sıklık `* * * * *` ve `active = true` olarak kayıtlıdır; etkinleştirme artık yalnız bekleyen bir işlem olarak anlatılmaz. Bu tarihsel kayıt cron'un bu inceleme anında yeniden sorgulandığı anlamına gelmez. Rehberde ek operasyon kontrolleriyle 46/46 yerel SQL sonucu da bulunur. Uygulama dağıtımı ve son canlı kontrollerin tamamlandığına ilişkin ayrı doğrulama bekleyişi korunur. Saat kaldırma geçişi `scripts/sql/eclub_gonderi_saatini_temizle.sql` dosyasıdır; gün bazlı geçişten sonra eski saatli gönderim/plan fonksiyonlarını geri getirecek paketler yeniden uygulanmaz.

* **E-Club Ligi (`/e-club-ligi`):** Firma genelindeki UTT takımlarının dönemsel yarışmasını, ilk üç takım podyumunu, genel sıralamayı ve kullanıcının kendi takımını gösterir. Çekli ve çeksiz puanların ikisi de E-Club performansı ve lig hesabına katılır.
* **Eczane Kullanıcısının Firma Gezinmesi:** Sidebar yalnız `E-Club → Firmalar ve Yayınları` bağlantısını içerir. `/eclub/firmalar` ekranında firma logosu ve adı standart, tıklanabilir kartlarda gösterilir. Firma başlığının altında **Yeni Yayın** ve **Toplam Yayın** sayıları bulunur. Firma özetinde **Yeni Yayınlar, Tamamlananlar ve Net Puan** kartları gösterilir; performans sekmesinde bu genel üçlü gösterilmez, performansın kendi özeti kullanılır. Yeni Yayınlar sayımı, `izlendi_mi = false`, `izleme_baslangic` boş ve `oneri_durumu = aktif` koşullarını birlikte kullanır (`lib/eclub/firmaYayinSayilari.ts`). Genel özet kartları mobilde alt alta dizilir. Ürün sekmeleri ve `Yayınlar / Yayın Tamamlama Performansı / Hediye Çeki Talebi / Hediye Çeki Takibi` seçimi korunur. Güncel adresler `/eclub/firma/[firma-adi]/yayinlar`, `/yayin-tamamlama-performansi`, `/hediye-ceki-talebi` ve `/hediye-ceki-takibi` biçimindedir; adres eşlemesi `lib/eclub/firmaGezinme.ts` kaynağından gelir. Ürün seçimi `eclub_firma_urun:${kullaniciId}:${firmaId}` anahtarıyla `sessionStorage` ve bellek içi yedek üzerinden korunur (`lib/eclub/firmaUrunSecimi.ts`). Gelen `urun_id` parametresi ilk seçimde değerlendirilip oturum seçimine aktarılır ve URL'den temizlenir; sekme geçişleri bu parametreyi sürekli taşımayı gerektirmez. İçerik seçili ürüne göre süzülür. Firma adresinde UUID yerine küçük harfli firma adı kullanılır; kelimeler orta çizgiyle ayrılır ve Türkçe harfler URL için sadeleştirilir (örnek: `iki-isimli-firma`). Firma adı yalnız kullanıcının yetkili firmaları içinde kimliğe çözülür. Eski UUID bağlantıları sorgu parametreleri korunarak firma adı adresine yönlenir. Ürünler firma kataloğundan okunur; üründe ilgili kayıt yoksa boş durum gösterilir. Çek alanları yalnız ilgili firmanın E-Club Store modülü açıksa görünür; sunucu aktif eczane–firma bağını ve modül bayraklarını ayrıca doğrular. Ayrı yayınların puanları, dönüşüm oranları ve talepleri birleştirilmez. Firmalar sidebar rozeti okunmamış çek bildirimlerini toplar; ürünün takip görünümünü açmak diğer ürünlerin bildirimlerini okunmuş yapmaz. Firma bilgisi olan push bağlantıları ilgili firma sayfasını açar; önceki genel bağlantılar çalışmaya devam eder.
* **Eczanenin Yayın Tamamlama Performansı:** Firma ve ürün sayfasındaki `/yayin-tamamlama-performansi` sekmesi, Türkiye saatine göre içinde bulunulan iki aylık kazanım dönemini gösterir. ECharts cetvelinde Video, Podcast, Görsel ve Literatür alt alta, hafta cetveli 1–8 olarak yer alır; ilk yedi bölüm yedişer gündür, sekizinci bölüm iki takvim ayının kalan günlerini de kapsar. Dönem hesabı, iki takvim ayının tamamını kapsar. Tamamlanan izlemelerin içerik ve doğru cevap puanları, ileri sarma kaybı düşülerek tamamlandıkları haftada hesaplanır; çekli ve çeksiz puanlar dahildir, geçmiş dönemden devir veya çek kullanımı bu performans hesabını değiştirmez. Noktaya tıklamak üyelerin adlarını, tamamladıkları yayın sayılarını ve net puan katkılarını açar. Firma ve ürün seçimi korunur. E-Club Store kapalı olsa da performans açıktır. Sunucu firma–ürün ve aktif kişi–eczane–firma bağını doğrular; puan kazanımındaki eczane snapshot'ı korunur, puansız tamamlamalar tamamlanma anındaki üyelik aralığına göre sayılır. Görünüm testi olarak işaretlenmiş izlemeler performansa katılmaz. Satır sınırı tüm sayfalar okunarak aşılır; okuma hatası sıfır performans gibi gösterilmez. Veriler açık sayfada dakikada bir ve odak geri geldiğinde güncellenir. Onaylanan HTML demo görünümü korunur; yayın tipi seçim kontrolü ve ek Yenile butonu bulunmaz. Cetvelde seçilen noktanın türü ve haftası alttaki üye katkı kartını belirler; haftalık bağlantılar seçilmiş yayın tipinin haftasını değiştirir.
* **E-Club Store — Hediye Çeki:** E-Club Store'un güncel karşılığı hediye çekidir; yeni seçenekli ürün kataloğu siparişi oluşturulmaz. Eski ürün mağazasına ait tarihî sipariş kayıtları korunur. Aynı eczanedeki E-Club üyelerinin Çekli Puanları, kazanım anındaki eczane aidiyeti korunarak ilgili yayın ve dönem kapsamında eczane havuzunda birleşir; bir eczanenin puanı, çek hakkı veya çek bilgisi başka bir eczaneye aktarılmaz ve gösterilmez.
* **Çek Dönemi ve İşlem Yetkisi:** Çekli puanlar iki aylık kazanım döneminde birikir. Hediye çeki işlemi bu dönemi takip eden ayın yalnız 1–7. günleri arasında başlatılabilir; pencere ayın 8'inde kapanır. Yeterli puan oluştuğunda işlemi yalnız ilgili eczanenin aktif `eczaci` rolündeki üyesi başlatabilir. Kanonik onay sırası `beklemede` (UTT) → `bm_onayinda` (BM) → `tm_onayinda` (TM son onayı) → `onaylandi` (admin kod girişi bekleniyor) → `teslimat_bekliyor` → `cek_kodlari_gonderildi` biçimindedir. Admin, TM son onayı bulunmayan talebe çek kodu tanımlayamaz.
* **Çekli Puanların Devri ve Bakiye:** Siparişsiz ve siparişi isteğe bağlı yayınlardan kullanılmayan çekli puanlar aynı eczane ve yayın kapsamında sonraki iki aylık kazanım dönemine devreder. Sipariş zorunlu yayınlarda ilgili dönem için iptal edilmemiş, sipariş verilmiş bir çek talebi yoksa kullanılmayan puanlar talep penceresinin kapanışında (Türkiye saatiyle takip eden ayın 8'inde 00.00) silinir ve devredilmez. Geçerli siparişli talep varsa yalnız talebe ayrılan puan düşülür; kullanılmayan artık bakiye yıl sonu kuralına kadar devredebilir. Her yıl Türkiye saatiyle **8 Ocak 00.00'da**, bir önceki yılın kullanılmamış puanlarının tamamı silinir ve yeni yıla devredilmez; 1–7 Ocak talep hakkı korunur. Yeni yılda kazanılan puanlar ve iptal edilmemiş taleplere ayrılmış puanlar bu yıllık silinmeden etkilenmez. Talep iptal edildiğinde ayrılan puan, ilgili dönemin sipariş ve yıl sonu geçerlilik kuralları içinde yeniden hesaplanır; kapanmış sipariş zorunlu dönem veya sona ermiş yıl için kullanılabilir bakiye olarak geri dönmez. Silinme, kullanılabilir bakiyeden çıkarma anlamındadır; kazanım, talep ve teslimat tarihçesi korunur. Dönem koşulu yeni kazanımda sabitlenir; geçmiş dönemlerde varsa talep üzerindeki sipariş koşulu, yoksa SQL kurulumu sırasında yayının mevcut koşulu esas alınır. Günlük otomatik kapanış işi Türkiye saatiyle 00.00'da çalışır; sayfa okuması da aynı hesabı kullanır ve silinen puanları tutar hesaplarından çıkarır. Kurulum SQL'i `scripts/sql/eclub_puan_siparis_ve_yil_sonu_kapanisi.sql` dosyasıdır; kullanıcı 10 Ekim 2026 tarihinde `TAMAMLANDI` sonucuyla canlı kurulumunu doğruladı: bir bakiye kaydında sipariş verilmemiş zorunlu yayına ait 100 puan kapandı, yıl sonu kaynaklı kapanan puan 0. Otomatik işin gerçek zamanlı çalışması ve 8 Ocak canlı sınırı ayrıca doğrulanacaktır.
* **Hediye Takibi — Çek ve Sipariş Ayrımı:** Güncel takip sayfası `/eclub/hediye-takip` adresindedir; **Çek Takibi** ve **Sipariş Takibi** aynı sayfada ayrı seçimler ve listeler olarak sunulur. UTT/KD_UTT kendi kayıtlarını, BM bölgesindeki, TM takımındaki yetkili UTT kayıtlarını izler; ortak sunucu kapsamı `lib/eclub/hediyeTakip/` ve `lib/eclub/yonetimKapsami.ts` üzerinden doğrulanır. Çek takibinde talep durumu, UTT/BM/TM onay zinciri ve teslimat durumu; sipariş takibinde sipariş ve UTT sipariş onayı bilgileri yer alır. UTT yalnız kendi çek taleplerini BM'ye, BM yalnız kendi onayındaki talepleri TM'ye, TM yalnız kendi son onayındaki talepleri admine ilerletebilir. Okuma uçları `/eclub/hediye-takip/api/cek-takip`, `/eclub/hediye-takip/api/siparis-takip` ve BM yönetim kapsamındaki karşılıklarıdır; kayıt işlemleri ilgili `[talepId]` uçlarında rol bazında ayrılır. Admin kod girişi ayrı ve admin yetkili `/admin/eclub-store` yüzeyindedir.
* **Çek Teslimatı ve Eczane İzolasyonu:** Adminin çek kodunu kaydetmesi aynı transaction içinde e-posta ve push outbox işlerini, ayrıca uygulama içi çek bildirimlerini oluşturur. E-posta yalnız eczanenin tek aktif ana `eczaci` hesabına gönderilir. Push ve uygulama içi bildirim, rol ayrımı yapılmadan ilgili eczanede aktif çalışan ve HapBilgi hesabı bulunan bütün E-Club üyelerine yöneltilir. Başka bir eczanenin üyeleri bu çek bilgisini göremez. Talep ancak e-posta ve bütün push işleri tamamlandığında `cek_kodlari_gonderildi` durumuna geçer.
* **Mobil Yayın Akışı ve HOYK Standardı:** E-Club öğrenme aracı kataloğu, mobilde `MobilYayinAkisi` (2+5 dikey akış) motoruna bağlanmıştır; tablet ve masaüstünde yatay, kaydırılabilir snap rafı korunur. Kart gösteriminde `YayinKarti` (HOYK) standart kapsül hiyerarşisi ve öğrenme aracı puanı rozeti kullanılır.

### 2. Aşama: Kod Taraması ve Görev İlişki Matrisi
* **Eczane, UTT ve Kişi Bağları:** `app/(panel)/eclub/eczaneler-takimim/`, `app/(panel)/eclub/listem/api/`, `app/(panel)/eclub/listem/api/davet/`, `lib/eclub/uyelikDaveti.ts`, `lib/eclub/uttEczane.ts`, `lib/eclub/kisiErisim.ts`, `eclub_utt_eczaneye_bagla`, `eclub_utt_eczaneden_cikar`, `eclub_yeni_kisi_provizyonu`, `eclub_mevcut_kisi_provizyonu`.
* **Öneri ve Tüketim:** `app/(panel)/eclub/oneriler/`, `app/(panel)/eclub/yayinlar/`, `app/(panel)/eclub/panel/`, `components/yayin/YayinKarti.tsx`, `components/yayin/MobilYayinAkisi.tsx`, `lib/eclub/oneriLimit.ts`, `lib/eclub/oneriKapsam.ts`, `lib/eclub/izlemeKurali.ts`, `lib/eclub/aktifYayinYetkisi.ts`.
* **Lig ve Hediye Takibi:** `app/(panel)/e-club-ligi/`, `app/(panel)/eclub/hediye-takip/`, `lib/eclub/hediyeTakip/`, `lib/eclub/rapor.ts`, `lib/eclub/yonetimKapsami.ts`. Eski `app/(panel)/eclub/listem/page.tsx`, `/eclub/yayinlar` adresine yönlendirir; eczane/kişi API'lerinin `listem/api` altındaki teknik yolları korunur.
* **Firma ve Ürün Çalışma Alanı:** `app/(panel)/eclub/firma/[firma_id]/`, `components/eclub/EclubFirmaCalismaAlani.tsx`, `components/eclub/EclubYayinPerformansi.tsx`, `lib/eclub/firmaGezinme.ts`, `lib/eclub/firmaUrunSecimi.ts`, `lib/eclub/firmaYayinSayilari.ts`. Klasördeki `[firma_id]` teknik adı, kullanıcıya görünen firma adı adresiyle karıştırılmaz.
* **Gönderim ve Planlama Omurgası:** `app/(panel)/eclub/oneriler/api/route.ts`, `lib/eclub/gonderimApi.ts`, `lib/eclub/gonderimPlanTipleri.ts`, `lib/eclub/gonderimPlanIsleyici.ts`, `lib/eclub/gonderimPlanKuyrugu.ts`, `app/api/cron/eclub-yayin-gonderim/route.ts`. Kaynak SQL'ler: `eclub_yayin_gonderim_planlari.sql`, `eclub_gonderim_kota_ve_tarih_kontrolu.sql`, `eclub_gonderim_rpc_yeni_kurgu.sql`, `eclub_gonderim_api_toplu.sql`, `eclub_planlanan_gonderim_isleyici.sql`, `eclub_planlanan_gonderim_cron.sql` ve gün bazlı son geçiş `eclub_gonderi_saatini_temizle.sql` (`scripts/sql/`).
* **Hediye Çeki:** `app/(panel)/eclub/store/`, `app/admin/eclub-store/`, `lib/eclub/store/`, `scripts/sql/eclub_cek_talebi_ana_eczaci.sql`, `scripts/sql/eclub_store_tm_son_onay.sql`, `scripts/sql/eclub_kullanilmayan_puan_tam_devir.sql`, `scripts/sql/eclub_puan_siparis_ve_yil_sonu_kapanisi.sql`, `scripts/sql/eclub_cek_teslimat_outbox.sql`, `scripts/sql/eclub_cek_eposta_worker.sql`, `scripts/sql/eclub_cek_push_worker.sql`, `scripts/sql/eclub_cek_uygulama_bildirimleri.sql`.
* **Güvenlik Kapıları:** UTT liste üyeliği, kişi–eczane bağı, firma modül bayrakları, yayın kapsamı, araç kimliği, öneri süresi ve aktif üyelik sunucuda doğrulanır. Çek oluşturma yalnız ana eczacıya; UTT, BM ve TM geçişleri rol, firma ve kayıt kapsamına; admin kod girişi admin oturumuna bağlıdır. Outbox tablosu ile worker RPC'leri `PUBLIC`, `anon` ve `authenticated` rollerine kapalı, `service_role` erişimine açıktır.
* **Operasyon Kaydı:** Kurulum sırası, ortam değişkenleri, canlıya çıkış kapıları ve arıza yönetimi `docs/ECLUB_CEK_OPERASYON_REHBERI.md` içinde tutulur.

**Doğrulama kaydı — 28 Eylül 2026:** Ana eczacı → UTT → BM → TM → admin → e-posta/push/uygulama içi bildirim zinciri, çekli–çeksiz puan ayrımı, eczane aidiyeti, rol güvenliği ve fiziksel Store'un kapatılması dâhil tam E-Club otomatik regresyon paketi hatasız geçmiştir. Bu regresyon veritabanına bağlanmadan yapılmıştır.

### 3. Aşama: Depo Şema ve DDL Kaydı
Bu kayıt canlı veritabanı doğrulaması değildir. `scripts/denetim/sema.json` içindeki **29 Eylül 2026 tarihli depo şema anlık görüntüsü** (`uretim_tarihi: 2026-09-29T13:57:14.457Z`) ile kaynak SQL sözleşmelerini ifade eder.

* **Eczane ve Üyelik Tabloları:** `eclub_eczane_master`, `eclub_eczaneler`, `eclub_eczane_firma`, `eclub_utt_eczane`, `eclub_kisiler`, `eclub_kisi_eczane`, `eclub_takim_adlari`.
* **Öneri, Plan, Tüketim ve Puan Tabloları:** `eclub_yayin_gonderim_planlari`, `eclub_oneri_kayitlari`, `eclub_izleme_kayitlari`, `eclub_kazanilan_puanlar`, `eclub_ileri_sarma_kayitlari`, `eclub_dogru_cevap_kayitlari`, `eclub_yanlis_cevap_kayitlari`, `eclub_oneri_kayip_kayitlari`, `eclub_utt_puanlari`.
* **Hediye Çeki Tabloları:** `eclub_store_cek_talepleri`, `eclub_store_puan_devirleri`, `eclub_cek_teslimat_outbox`, `eclub_bildirimler`. Tarihî fiziksel Store tabloları veri kaybı yaratmamak için şemada korunabilir; yeni yazma ve kullanıcı işlemi üretmez.
* **Çekirdek RPC'ler:** `eclub_utt_eczaneye_bagla`, `eclub_utt_eczaneden_cikar`, `eclub_oneri_atomik_kaydet` (uyumluluk köprüsü), `eclub_yayin_gonder`, `eclub_yayin_toplu_islem`, `eclub_gonderim_uygunlugu`, `eclub_gonderim_kontrol_hesapla`, `eclub_planlanan_gonderimi_isle`, `eclub_izleme_tamamla`, `eclub_cevaplari_kaydet`, `eclub_ileri_sarma_kaydet`, `get_eclub_utt_rapor`, dönemsel `get_eclub_ligi_*` ailesi, `get_eclub_eczane_store_ozet`, `eclub_store_cek_talebi_olustur`, `eclub_store_bm_onayina_gonder`, `eclub_store_bm_onayla`, `eclub_store_tm_onayla`, `eclub_store_admin_kod_teslim`, `eclub_store_cek_talebi_iptal`, `eclub_cek_eposta_isi_al`, `eclub_cek_push_isi_al`, `eclub_cek_teslimat_tamamla`, `eclub_cek_teslimat_hata`.

---

# 4. BÖLÜM: ECZANEM (Üye Öğrenme, Puan ve Eczane İşlem Katmanı)
*Eczanem Uygulaması Üyeleri İçin Öğrenme İçeriği ve Eczane Bağlantılı Platform İşlemleri*

**23 Ekim 2026 — Repo karşılaştırması:** Bu bölüm, mevcut uygulama ve kaynak SQL sözleşmelerine göre güncellendi. Karşılama/giriş adresleri, eczane personeli sayfaları, gönderim öncesi UTT incelemesi ve indirim onayından sonraki UTT → BM → TM mutabakat zinciri kayda alındı. Bu belge güncellemesinde uygulama veya SQL dosyası değiştirilmedi; veritabanında işlem yapılmadı. Aşağıdaki geçmiş doğrulama ve bekleyen kurulum kayıtları kendi tarih ve kapsamlarıyla korunur.

**21 Ekim 2026 — E-Club bağımlılığı:** Eczanem yalnız aynı firmada E-Club açıkken açılabilir. E-Club kapatıldığında Eczanem de aynı admin güncellemesinde kapatılır; E-Club yeniden açıldığında Eczanem ayrıca açılmalıdır. Eczanem'in kapatılması E-Club'ı kapatmaz. Farklı firmaların açık bayrakları birleştirilmez; başka bir bağlı firmada ikisi de açıksa o firmanın kapsamı korunur. Admin anahtarları, profil/menü, üye bannerı ve ortak sunucu erişimi bu kurala bağlandı. Önceden tutarsız kaydedilmiş bayraklar da sunucuda erişim vermez.

**Veritabanı kurulumu bekliyor:** `scripts/sql/eczanem_eclub_modul_bagimliligi.sql`, mevcut E-Club kapalı/Eczanem açık firma bayraklarını kapatır; doğrudan yazımlar için CHECK kısıtı ve E-Club kapanışında Eczanem'i kapatan trigger kurar. Üyelik, puan ve işlem kayıtlarını silmez. SQL canlı veritabanında çalıştırılmadı; başarı sonucu görülmeden veritabanı koruması kurulmuş sayılmaz. Uygulama ve sahte bağımlılıklı testlerin geçmesi PostgreSQL'de SQL kurulumu veya gerçek tarayıcı doğrulaması değildir.

**Yerel doğrulama:** İlgili yedi test dosyasında 31/31 test başarılı. Dört bayrak kombinasyonu, ilgili roller, çok firmalı izolasyon, menüler, admin API'si, koşullu güncellemenin kapanış yarışı, admin anahtarlarının React durum güncellemesi ve üye bannerı kapsamı sınandı. Değişen dosyaların ESLint kontrolü başarılı. PostgreSQL çalıştırıcısı bulunmadığından kurulum SQL'i yerel PostgreSQL'de de çalıştırılmadı; bu SQL için yürütme başarısı iddiası yoktur. Ağ bağlantısı ve gerçek modül değişikliği yapılmadı.

### 1. Aşama: Rol ve Görev Tanımları
* **Ortak Üye Sayfa Kabuğu — 20 Ekim 2026:** `/eczanem`, `/eczanem/puanlarim`, `EczanemPanelBaglantisi` üzerinden iç kullanıcılarla aynı `components/panel/PanelKabugu.tsx` bileşenine bağlıdır. Navbar `PanelNavbar`, masaüstü sol menü `SolListe`, mobil menü `MobilDrawer` ile çizilir; ayrı üye navbar/sidebar bileşenleri kaldırılmıştır. Masaüstü sol menü 240 px genişliğindedir; menü ve ana içerik ayrı kayar. Üye ortak renk anahtarıyla kendi temasını değiştirebilir. Ana sayfada Merhaba, seçili eczane veya öne çıkarılan firma başlığı; Yenile, tarih, banner rafı ve E-Club ile ortak üç özet kartı bulunur. İlk yüklemede sayfa/raf/banner iskeletleri gösterilir; yenilemede aynı kapsamın mevcut içeriği korunur.
* **Üye Gezinmesi ve Veri Ayrımı:** `eczanemUyeMenusuOlustur`, Tüm İçerikler ve Puanlarım yollarını; Eczanelerim altında yalnız eczane–firma ağacını ortak masaüstü/mobil menüye verir. Ürünler firma kapsamındaki sayfa içi altı çizgili `EczanemUrunFiltresi` ile seçilir; kapsam breadcrumb bandı ana sayfada kullanılmaz. `eczanemGezinme` kullanıcıya göre ayrılmış menü ağacını sayfalar arasında korur; Puanlarım açıldığında eczaneler kaybolmaz. Metne tıklama kapsamı seçer, ayrı ok alt menüyü açıp kapatır. Navbar yalnız Ana Sayfa (`/eczanem`) bağlantısını gösterir; Cogniti karşılama içeriği `/` üzerinden sunulur; oturumsuz `/ana-sayfa` isteği de adres korunarak bu içeriğe rewrite edilir. `/login` ayrı giriş sayfasıdır. Ana Sayfa ile Tüm İçerikler aynı başlangıç içeriğini açar; aktif seçimleri ayrıdır ve biri seçildiğinde diğerinin vurgusu kalkar. Ana Sayfa ve logo kapsamı, ürün/yayın türü filtresini ve açık oynatıcıyı sıfırlar. Üye bağlayıcısı mevcut Auth kimliğini kullanır, iç kullanıcı `PanelLayout` bileşenini veya firma/rozet/bildirim veri çağrılarını çalıştırmaz. Eski `/hakkinda` adresi yönlendirme bırakılmadan kaldırıldı. Maskeli telefon ve profil bilgisi ortak profil menüsünde gösterilir; ana sayfadaki hesap silme seçeneği mevcut şifre doğrulamalı onayı açar. Oynatıcı ve puan/indirim işlemleri mevcut üye API'lerinde kalır. Otomatik bileşen kontrolleri gerçek kullanıcıyla canlı tarayıcı onayı yerine geçmez.
* **Admin ve Üye Bannerları — 20 Ekim 2026:** Admin Eczanem sekmesindeki `EczanemBannerYonetimi`, mevcut E-Club yükleme bileşenini `uye-ana-sayfa` alanıyla kullanır; dosya seçimi yerel önizlemedir, Yayınla ile kaydedilir. Cogniti platform firması en fazla beş, diğer firmalar en fazla üç üye bannerı kullanır; personelin mevcut üç sayfa alanı üçer bannerla sınırlıdır. Kayıtlar `eczanem_sayfa_bannerlari` tablosundadır; E-Club firma bannerlarından ayrıdır. `scripts/sql/eczanem_uye_bannerlari.sql` için kullanıcı `TAMAMLANDI` sonucunu paylaşmıştır. Üye `/eczanem/api/bannerlar` rotası genel/eczane görünümünde Cogniti bannerlarını; firma görünümünde doğrulanmış aktif üye–eczane–firma bağına ait bannerları okur. Genel Cogniti bannerı platform firmasının `eczanem_aktif` bayrağına bağlı değildir; seçili firma kendi modül kapısından geçer. Kapsam veya hesap değişince önceki banner gizlenir; iptal edilen eski yanıt güncel sonucu ezmez.
* **Kimlik ve Giriş:** Eczanem uygulaması üyesi `eczanem_musteriler` kimlik düzleminde yaşar ve `/login` üzerinden e-posta veya cep telefonu ile şifresini kullanarak giriş yapar. SMS bağlantısıyla giriş kullanılmaz; başarılı giriş üyeyi `/eczanem` alanına yönlendirir.
* **Eczane Bazlı Üyelik:** Aynı kişi birden fazla eczaneye ayrı `eczanem_uyelikler` bağlarıyla üye olabilir. Öğrenme, ilerleme, soru ve yeni puan kazanımı ilgili eczanedeki aktif üyeliğe bağlıdır. Eczane üyeliği pasife alındığında yeni öğrenme ve puan kazanımı durur; mevcut puanlar varsayılan 30 günlük geçiş süresinde görülebilir ve kullanılabilir, süre sonunda kullanım da kapanır.
* **İki Kademeli Öğrenme İçeriği Dağıtımı:** UTT/KD_UTT, kendi firma ve takım kapsamındaki Eczanem hedefli Video, Podcast, Dijital Broşür veya Literatür aracını yalnız kişisel listesinde bulunan ve aktif üye eşiğini karşılayan eczaneye gönderebilir. Eşik `sistem_ayarlari.eczanem_aktif_uye_esigi` üzerinden belirlenir; varsayılan 10'dur. UTT, göndereceği aracın geçerli yayın turunu önce puansız ve sorusuz tamamlamalıdır. `uttGonderimIncelemesiTamamlandi` API kontrolünü, `eczanem_utt_inceleme_gonderim_kilidi` doğrudan gönderim tablosuna yazımları da kapsayan SQL kontrolünü yürütür. İnceleme kaydı aynı UTT–yayın–araç bağına ait olmalı ve geçerli tur başlangıcından eski olmamalıdır; bu doğrulama E-Club inceleme kaynağını paylaşır, dağıtım kuralları Eczanem'e aittir. Yetkili eczane personeli yalnız eczaneye ulaşmış içeriği o eczanenin aktif Eczanem uygulaması üyelerine dağıtabilir. Aynı yayın–eczane ve yayın–üye–eczane birleşimleri mükerrer gönderimi yapısal olarak engeller.
* **Bildirim ve İçerik Rafı:** Başarılı dağıtım, tarayıcı bildirim izni bulunan üyeye Web Push ile bildirilebilir; SMS veya e-posta bildirim kanalı kullanılmaz. Üye içerikleri Yeni Yayınlar, Yarım Kalanlar, Tamamlananlar, En Çok Beğenilenler ve En Çok Favorilenenler raflarında görür. En Çok Tamamlananlar rafı ve ona ait `en_cok_izlenenler`/`izlenme_sayisi` alanları üye rafı/API sözleşmesinden kaldırılmıştır. Yayın–araç bağı `yayin_id`, `arac_id` ve `arac_turu` kimlikleriyle korunur.
* **Kayıpsız Öğrenme Modeli:** İleri sarma kapalıdır ve oynatıcı kullanıcıyı son doğrulanmış konuma döndürür; ileri sarma kaybı oluşmaz. Yanlış cevap puan kaybı üretmez, doğru cevaplar ilgili soru puanını kazandırabilir. Soru kümesi izleme kimliğine sabitlenir; tamamlamadan sonra sorular yanıtlanmadan akış terk edilir ve yeni oturum başlatılırsa önceki soru hakkı yeniden açılamaz.
* **Puan Kaynağı ve Ömrü:** Puan `musteri_id + eczane_id + firma_id + urun_id` bağıyla kaynağından ayrılmadan saklanır. Puan ömrü `sistem_ayarlari.eczanem_puan_omru_gun` üzerinden belirlenir; varsayılan 180 gündür. Kullanım, geçerli puan kayıtlarından FIFO sırasıyla yapılır.
* **Barkodlu Talep ve Eczane Onayı:** Üye barkod üzerinden bir indirim talebi oluşturur; talep aşamasında puan düşmez ve geçerli tarifenin anlık görüntüsü siparişe yazılır. Yetkili eczane personelinin onayında puan atomik FIFO işlemiyle düşer; ret veya üyenin vazgeçmesi puan düşürmez. Cogniti puan veya indirimi tek taraflı belirlemez; yetkili kullanıcıların yayın ve tarife kapsamında girdiği parametreleri kaydeder ve hesaplar. Cogniti, eczane ile Eczanem uygulaması üyesi arasındaki ticari ilişkinin tarafı değildir.
* **Eczane Personeli Sayfaları:** Eczanem menüsünde Üyeler (`/eczanem/eczane/uyeler`), Üye Yayınları (`/eczanem/eczane/uye-yayinlari`) ve İndirim Onayı (`/eczanem/eczane/indirim-onayi`) bulunur. Menü E-Club ve Eczanem modüllerinin ikisinin de açık olmasına bağlıdır; işlem API'leri personelin eczane kapsamını ayrıca doğrular. Eski `/eczanem/eczane/danisan-yayinlari` adresi Üye Yayınları'na yönlenir.
* **İndirim Onayının Kesin Kaynak Kaydı:** Sipariş `onaylandi` durumuna geçtiğinde `eczanem_utt_mutabakat_onay_snapshot`, aynı işlem içinde onay ve kaynak dökümünü oluşturur. Onay kaydında eczane, firma, takım, ürün, onay zamanı, kullanılan puan, indirim tutarı, tarife puan/TL değerleri ve varsa satış fiyatı tutulur. FIFO harcamaları puan → izleme → gönderim → yayın/araç zincirine bağlanır; kaynak dökümü yayın, araç türü, tanımlı öğrenme puanı ve o kaynaktan kullanılan puanı saklar. Kaynaklar eksik veya kapsamları tutarsızsa ya da kaynak puan toplamı kullanılan puanla eşleşmiyorsa onay geri alınır. Onay başına tek mutabakat açılır. Görünen indirim kimliği atomik sıra ile üretilir, tekildir ve sonradan değiştirilemez.
* **UTT → BM → TM Mutabakatı:** UTT/KD_UTT `/eczanem/utt/mutabakat`, BM `/eczanem/bm/mutabakat-takip`, TM `/eczanem/tm/mutabakat-takip` sayfasını kullanır. Her rol için `onay`, `beklet`, `ret` kararları vardır. UTT kararı vermek ile BM onayına göndermek ayrı işlemlerdir; gönderim için UTT kararı `onay` olmalıdır. BM kararı vermek ile TM onayına göndermek de ayrıdır ve TM'ye gönderim BM onayını gerektirir. Akış `utt_hazirliginda` → `bm_onayinda` → `tm_onayinda` durumlarından geçer; TM onayı `onaylandi`, TM reddi `tm_reddetti` ile sonuçlanır. TM'nin bekletmesi kaydı `tm_onayinda` tutar. API'ler kimlik, rol, modül ve organizasyon kapsamını; SQL işlevleri atanan karar vereni ve kayıt durumunu yeniden doğrular.
* **Mutabakat Dönemi, Kilitler ve Geçmiş:** Varsayılan dönem Türkiye saatine göre önceki aydır. UTT, yalnız önceki ay onaylanmış işlemlere mevcut ayın 1–7. günlerinde karar verebilir ve bunları aynı zaman aralığında BM'ye gönderebilir. Bu UTT takvim kuralı BM/TM kararlarına genellenmez. BM'ye gönderildikten sonra UTT kararı, TM'ye gönderildikten sonra BM kararı değiştirilemez. Nihai TM kararı değiştirilemez; aynı kararın tekrarı mevcut sonucu döndürür. Kararlar rol bazında sürüm, karar veren ve zaman bilgisiyle geçmiş tablolarına yazılır; durum geçişlerinde satır kilidi kullanılır.
* **Mutabakat Listeleme ve Excel:** Önceki ayı başlangıç alan `YYYY-MM` dönem seçimi ve `tumu`, `bekliyor`, `onay`, `beklet`, `ret` filtreleri kullanılır. UTT ekranında eczane/ürün kırılımları; BM/TM ekranlarında kendi organizasyon kapsamındaki UTT'lere ve eczane/ürün işlemlerine inen görünüm vardır. Liste RPC'leri 20 kayıtlık sayfalama yapar; düz görünüm seçili dönem ve durumun kayıtlarını toplayabilir. İşlem tablosu puan kaynaklarını ve karar geçmişini gösterir. `MutabakatExcelButonu`, role göre BM/UTT sütunlarını; eczane, onay tarihi, ürün ve görünen ürün kimliği, araç/yayın kodu, satış fiyatı, tarife, görünen indirim kimliği, kullanılan puan, indirim tutarı, karar ve sonuç bilgilerini `.xlsx` olarak aktarır.
* **Kimlik Geçişi ve Silme:** Eczanem uygulaması üyesinin E-Club unvanına alınması çift kimlik oluşturmayan kontrollü karar akışıyla ve aynı giriş hesabı korunarak yapılır. Üye, şifresini yeniden doğrulayarak kendi uygulama ve Auth kimliğini `eczanem_musteri_kendini_tam_sil` üzerinden atomik olarak silebilir.
* **Mobil Yayın Akışı ve a11y Standardı:** Eczanem video rafları (`EczanemVideoRafi.tsx`), mobilde `MobilYayinAkisi` (2+5 dikey liste) motorunu kullanır; tablette yatay raf düzeni korunur. Özel raf başlığı tasarımı bozulmadan, otomatik ve güvenli kapsayıcı ID'leri üzerinden `aria-labelledby` bağlantısı sağlanmıştır. Kartlarda `YayinKarti` (HOYK) yapısı kullanılır.

### 2. Aşama: Kod Taraması ve Görev İlişki Matrisi
* **Üye Yüzeyi ve Kimlik:** `app/page.tsx` (karşılama), `proxy.ts` (oturumsuz `/ana-sayfa` rewrite), `app/login/` (giriş), `app/eczanem/`, `app/eczanem/api/giris/sifre/route.ts`, `lib/eczanem/oturum.ts`, `lib/eczanem/telefon.ts`, `lib/eczanem/aktifUyelik.ts`, `lib/eczanem/erisim.ts`.
* **Dağıtım ve Öğrenme:** `app/(panel)/eczanem/yayinlar/`, `app/eczanem/yayinlar/api/route.ts`, `app/eczanem/api/izleme/`, `components/yayin/YayinKarti.tsx`, `components/yayin/MobilYayinAkisi.tsx`, `lib/eczanem/gonderim.ts`, `components/ogrenme-araci/`, `scripts/sql/eczanem_utt_gonderim_oncesi_inceleme.sql`.
* **Eczane Personeli Yüzeyi:** `app/(panel)/eczanem/eczane/uyeler/`, `app/(panel)/eczanem/eczane/uye-yayinlari/`, `app/(panel)/eczanem/eczane/indirim-onayi/`, `app/(panel)/eczanem/eczane/danisan-yayinlari/page.tsx` (eski adres yönlendirmesi), `app/(panel)/eczanem/eczane/api/siparisler/route.ts`, `components/panel/panelNav.config.ts`.
* **Puan, Tarife ve İşlem:** `app/eczanem/api/puanlar/`, `app/eczanem/api/siparis/`, `lib/eczanem/kasa.ts`, `lib/eczanem/tarife.ts`.
* **Mutabakat Yüzeyi ve Veri Katmanı:** `app/(panel)/eczanem/utt/mutabakat/`, `app/(panel)/eczanem/bm/mutabakat-takip/`, `app/(panel)/eczanem/tm/mutabakat-takip/`; `app/eczanem/utt/api/mutabakat/route.ts`, `app/eczanem/bm/api/mutabakat/route.ts`, `app/eczanem/tm/api/mutabakat/route.ts`; `lib/eczanem/uttMutabakat.ts`, `app/(panel)/eczanem/_components/MutabakatIslemTablosu.tsx`, `app/(panel)/eczanem/_components/MutabakatExcelButonu.tsx`.
* **Üye Bannerları ve Admin:** `app/admin/eczanem/_components/EczanemBannerYonetimi.tsx`, `app/admin/api/eclub/bannerlar/route.ts`, `app/eczanem/api/bannerlar/route.ts`, `app/eczanem/_components/EczanemAnaSayfaUstBolum.tsx`, `lib/eclub/banner.ts`, `scripts/sql/eczanem_uye_bannerlari.sql`.
* **Geçiş ve Silme:** `app/eczanem/api/eclub-gecisi/route.ts`, `app/eczanem/api/hesabimi-sil/route.ts`, `lib/eczanem/silme.ts`, `eczanem_eclub_gecis_karar_ver`, `eczanem_musteri_kendini_tam_sil`.
* **Güvenlik Kapıları:** Üye kimliği, eczane üyeliği, firma modül bayrağı, UTT liste bağı, yayın kapsamı, araç kimliği, aktif üye eşiği, tarife ve sipariş sahipliği sunucuda yeniden doğrulanır. Dağıtım, tamamlama, cevap, üyelik, sipariş ve mutabakat kararları korumalı RPC'lerden geçer. Mutabakat API'leri istemciden gelen rol veya kapsamı yetki kaynağı kabul etmez; UTT/BM/TM kapsamı sunucuda çözülür.

**Doğrulama kaydı — 3 Eylül 2026:** Eczanem kimlik, çoklu üyelik, dağıtım, tüketim, puan, tarife, sipariş, kontrollü geçiş, hesap silme ve ortak öğrenme aracı sözleşmelerine yönelik seçili otomatik testlerin **41 / 41'i başarılıdır**.

### 3. Aşama: Depo Şema ve DDL Kaydı
Bu kayıt canlı veritabanı doğrulaması değildir. `scripts/denetim/sema.json` içindeki **29 Eylül 2026 tarihli depo şema anlık görüntüsü** ile kaynak SQL sözleşmelerini ifade eder.

* **Kimlik ve Üyelik Tabloları:** `eczanem_musteriler`, `eczanem_uyelikler`, `eczanem_silinen_musteriler`, `eczanem_personel_islemleri`.
* **Dağıtım ve Tüketim Tabloları:** `eczanem_eczane_gonderimleri`, `eczanem_gonderimler`, `eczanem_izleme_kayitlari`, `eczanem_cevap_kayitlari`, `eczanem_video_begeniler`, `eczanem_video_favoriler`.
* **Puan ve İşlem Tabloları:** `eczanem_puan_kayitlari`, `eczanem_harcama_kayitlari`, `eczanem_siparisler`, `eczanem_urun_tarifeleri`.
* **İndirim Onayı ve Mutabakat Kaynak Tabloları:** `eczanem_indirim_onaylari`, `eczanem_indirim_onay_kaynaklari`, `eczanem_utt_mutabakatlar`, `eczanem_utt_mutabakat_kararlari`, `eczanem_bm_mutabakat_kararlari`, `eczanem_tm_mutabakat_kararlari`. Bu envanter ilgili kaynak SQL sözleşmelerini de kapsar; her tablonun şema anlık görüntüsünde bulunduğu veya canlı kurulumunun bu incelemede doğrulandığı anlamına gelmez.
* **Üye Banner Tablosu:** `eczanem_sayfa_bannerlari` (`scripts/sql/eczanem_uye_bannerlari.sql`; kullanıcı tarafından bildirilen kurulum sonucu yukarıda kayıtlıdır).
* **Kontrollü Geçiş Tabloları:** `eczanem_eclub_gecis_talepleri`, `eczanem_eclub_gecis_kayitlari`, `eczanem_eclub_puan_kapanislari`.
* **Dağıtım ve Tüketim RPC'leri:** `eczanem_utt_eczaneye_gonder`, `eczanem_musterilere_video_gonder`, `eczanem_gonderim_arac_kimligi_dogrula`, `eczanem_izleme_aktif_uyelik_kapisi`, `eczanem_izleme_tamamla`, `eczanem_cevaplari_kaydet`.
* **Mutabakat Okuma ve Yetki İşlevleri:** `eczanem_utt_mutabakat_yetkili_mi`, `eczanem_utt_mutabakat_listele`, `eczanem_utt_mutabakat_eczaneleri_listele`, `eczanem_utt_mutabakat_eczane_islemleri_listele`, `eczanem_utt_mutabakat_eczane_islemleri_filtreli_listele`, `eczanem_utt_mutabakat_urunleri_listele`, `eczanem_utt_mutabakat_urun_islemleri_listele`, `eczanem_mutabakat_onay_durumlari`.
* **Mutabakat Karar ve Geçiş RPC'leri:** `eczanem_utt_mutabakat_karar_ver`, `eczanem_mutabakat_bm_onayina_gonder`, `eczanem_mutabakat_bm_karar_ver`, `eczanem_mutabakat_tm_onayina_gonder`, `eczanem_mutabakat_tm_karar_ver`. `eczanem_mutabakat_tm_onayla` SQL'de bulunan onay sarmalayıcısıdır; güncel TM API'si üç karar için `eczanem_mutabakat_tm_karar_ver` kullanır.
* **Kaynak Kayıt ve Gönderim Trigger İşlevleri:** `eczanem_utt_mutabakat_onay_snapshot`, `eczanem_indirim_gorunen_id_ata`, `eczanem_utt_inceleme_gonderim_kilidi`.
* **İlgili DDL Dosyaları:** `scripts/sql/eczanem_utt_mutabakat_kayit.sql` ve `scripts/sql/eczanem_utt_mutabakat_rpc.sql` temel kayıt/okuma sözleşmeleridir. `eczanem_mutabakat_onay_hiyerarsisi.sql` karar zincirini; `eczanem_utt_mutabakat_eczane_satirlari.sql`, `eczanem_utt_mutabakat_eczane_urun_filtresi.sql` ve `eczanem_utt_mutabakat_urun_satirlari.sql` liste kırılımlarını; `eczanem_indirim_gorunen_id_atomik.sql` ve `eczanem_utt_mutabakat_liste_gorunen_indirim_id.sql` görünen kimliği ve liste sözleşmelerini tanımlar. Bu dosyalar `scripts/sql/` altındadır; aynı adlı işlevlerin sonraki tanımları önceki sürümlerden ayrılarak değerlendirilir. Dosyaların burada listelenmesi yeni bir SQL çalıştırma talimatı veya bu incelemede yapılmış kurulum doğrulaması değildir.
* **Üyelik, İşlem ve Kimlik RPC'leri:** `eczanem_musteri_bagla_atomik`, `eczanem_musteri_durum_degistir`, `eczanem_uyelik_listeden_sil`, `eczanem_siparis_personel_islemi`, `eczanem_eclub_gecis_talebi_olustur`, `eczanem_eclub_gecis_karar_ver`, `eczanem_musteri_kendini_tam_sil`.

---

# 5. BÖLÜM: ÜRETİM & YÖNETİM OMURGASI
*İlk kayıt: 24 Ağustos 2026 | Güncelleme: 23 Ekim 2026 | Kapsam: İçerik Fabrikası, Dört Öğrenme Aracı, Çoklu İÜ Görev Modeli, Yayın Yönetimi ve Üretim Raporları*

### 1. Aşama: Rol, Talep ve Görev Tanımları
* **13 Üretici Rolünün Yetenek Profilleri (`lib/uretici/yetenekler.ts`):**
  * **Ürün Ailesi (`pm`, `jr_pm`, `kd_pm`):** Takım zorunludur; `urun_egitimi` açar, ürün zorunlu ve teknik tercihlidir. Eczanem hedefli talep açabilen roller, bu aile ile Medikal Müdür'dür (`ECZANEM_TALEP_ACAN_ROLLER`).
  * **Medikal Ailesi (`med_md`):** Firma seviyesindedir; `medikal_egitim` ve `urun_medikal_egitim` açar. Eczanem hedefli talep de açabilir; bu hedefte eğitim türünden bağımsız olarak ürün zorunludur.
  * **Eğitim Ailesi (`egt_*`):** Firma seviyesindedir; `satis_teknikleri` ve `yonetim_egitimi` açar. Satış teknikleri talebinde saha hedefleri için teknik zorunludur; E-Club hedeflerinde teknik seçimi kaldırılır.
  * **İK Ailesi (`ik_*`):** Firma seviyesindedir; `ik_egitimi` ve `yonetim_egitimi` açar; E-Club hedefli talep oluşturamaz.
* **Talep Sahipliği ve Hedef Sözleşmesi:** Her üretici yalnız kendi açtığı talepleri görür. Talebe bağlanan ürün ve teknik üreticinin firmasına ait olmalıdır. Hedef kitle `utt`, `bm`, `eczaci`, `eczane_teknisyeni` veya `eczanem` değerlerinden biridir; yalnız `eczaci` ile `eczane_teknisyeni` birlikte seçilebilir. Talep türünden türetilen içerik türü ile seçilen öğrenme aracı türü talep oluşturulduğunda sabitlenir. E-Club (`eczaci`, `eczane_teknisyeni`) ve Eczanem hedeflerinde teknik alanı gösterilmez ve sunucuda `teknik_id=NULL` yazılır. Eczanem hedefinde ürün her durumda zorunludur.
* **Öğrenme Araçları:** Üretim omurgası **Video** (`video`), **Podcast** (`podcast`), **Dijital Broşür** (`gorsel`) ve **Literatür** (`flip_pdf`) araçlarını destekler. Her araç ayrı özellik bayrağıyla açılıp kapatılabilir. Tarihsel `video` aşaması ve `hazir_video` alanı ortak üretim anahtarı olarak korunur; kullanıcı arayüzünde seçilen aracın gerçek adı gösterilir.
* **4 Üretim Varyantı:**

| Varyant | Hazır Gelen | İÜ Görev Zinciri |
|---|---|---|
| **V1 — Tam Üretim** | Yok | Senaryo $\rightarrow$ seçilen öğrenme aracı $\rightarrow$ soru seti |
| **V2 — Hazır Öğrenme Aracı** | Seçilen öğrenme aracı | Soru seti |
| **V3 — Hazır Soru Seti** | Soru seti | Senaryo $\rightarrow$ seçilen öğrenme aracı |
| **V4 — İkisi Hazır** | Seçilen öğrenme aracı ve soru seti | İÜ görevi açılmaz; yayın yönetimine geçilir |

* **Atomik Talep Oluşturma:** Normal talep oluşturma yolunda talep ve varyanta uygun ilk görev `talep_atomik_olustur` ile aynı işlem içinde oluşturulur; V4'te İÜ görevi açılmaz. Hazır V2/V4 podcast'in kalıcı taslak yolu ayrı bir istisnadır: taslak oluşturmak görev veya yayın zincirini başlatmaz; nihai gönderimde `podcast_taslak_atomik_kesinlestir` kullanılır. Aynı istemci işlem anahtarının tekrarı mükerrer talep, görev veya işlem kaydı üretmez; aynı anahtarla değiştirilmiş talep verisi kabul edilmez.
* **Çoklu İÜ Görev Modeli:** Görev durumları `atama_bekliyor` $\rightarrow$ `hazirlaniyor` $\rightarrow$ `inceleme_bekliyor` $\rightarrow$ `revizyon_bekliyor` $\rightarrow$ `tamamlandi` / `iptal` akışındadır. Atama kaynağı `otomatik`, `manuel`, `devir` veya `gecis` olabilir. Bir talepte sonraki görev açılmadan önce mevcut aktif görev kapatılır; otomatik aday seçimini `uretim_iu_adayi_sec` yürütür.
* **Revizyon ve Sürüm Güvenliği:** Senaryo fark görünümü `SenaryoDuzeltmeEditoru` ile korunur. Senaryo ve seçilen öğrenme aracı için en fazla üç revizyon istenebilir ve revizyon notu zorunludur. Karar isteği incelenen görev sürümünü taşır; güncelliğini yitirmiş ekrandan gönderilen karar yeni görev veya durum kaydı oluşturmadan reddedilir.
* **Medya Yükleme ve Kurtarma:** Video, Bunny Stream TUS hattıyla doğrudan yüklenir ve beş dakikalık işleme takibi kullanır. Podcast, Dijital Broşür ve Literatür dosyaları süreli imza üzerinden Bunny Storage hattına aktarılır; uzantı, MIME, boyut, gerçek dosya imzası, SHA-256 özeti ve araca özgü metadata doğrulanır. Kesilen yükleme aynı kayıt üzerinden yalnız eksik parçalarla sürdürülebilir veya dış depolama nesneleriyle geçici veritabanı kayıtları birlikte temizlenerek iptal edilebilir.
* **Hazır Videonun Asenkron İşlenmesi:** TUS aktarımının bitmesi Bunny kodlamasının bitmesi anlamına gelmez. `PUT /uretim/api/hazir-video`, videoyu talebe bağlar ve `hazirVideoTamamla` üzerinden üretim zincirini açabilir. Video henüz hazır değilse süre boş, `metadata_dogrulandi=false` kalır; üreticinin Yayın Yönetimi'ne geçmesi yayın açılabileceği anlamına gelmez. Bunny webhook'u veya `app/api/uretim/hazir-video-mutabakat/route.ts` arka plan akışı hazır durumu ve pozitif süreyi doğrulayarak kaydı tamamlar. Video hattı Bunny Stream TUS üzerinden yürür; Podcast/Dijital Broşür/Literatür için kullanılan Bunny Storage doğrulama hattıyla birleştirilmez. Beş dakikalık sınırlı işleme takibi, kodlamanın o sürede mutlaka tamamlanacağı garantisi değildir.
* **Hazır Podcast Kalıcı Taslağı:** V2/V4 podcast'te `app/(panel)/talepler/api/taslak/route.ts`, nihai gönderimden önce aynı üretici ve oturum anahtarı için tekrar güvenli talep/araç taslağı oluşturur. Taslak yeniden açıldığında mevcut kayıt geri yüklenebilir. `talepler.taslak_mi` ve `ogrenme_araclari.taslak_mi` ile ayrılan kayıtlar aktif görev/yayın zincirini başlatmaz ve genel Yarım Kalan Yüklemeler listesine alınmaz. Kesinleştirme `podcast_taslak_atomik_kesinlestir`, açık iptal `podcast_taslak_iptal_et_atomik` üzerinden yapılır. `podcast_taslak_zaman_asimi_temizle_atomik` için temizleyicinin varsayılan eşiği 24 saattir; terk edilmiş taslaklar temizlenirken AI işleri iptal edilir ve kullanılmayan dosyalar depolama temizleme kuyruğuna aktarılır.
* **Podcast Transkript ve Teslim Kapıları:** Transkript tercihi `ogrenme_araci_tercihleri.transkript_istendi` alanından çözülür; eski V1/V3 taleplerinde alan yoksa varsayılan `true`, açıkça `false` ise `false` kabul edilir. AI işleri kalıcı `ogrenme_araci_transkript_kuyrugu` üzerinden işlenir. İÜ tesliminde ses dosyası, pozitif süre ve metadata doğrulaması zorunludur. Transkript istenmişse AI metni onaylanmış, doğrulanmış ve güncel sesle eşleşmiş olmalıdır; başlamış fakat tamamlanmamış transkript işlemi teslimi engeller. V1/V3 podcast üretim revizyonunda, daha önce istenmemiş transkript istenebilir; bu karar hazır podcast'e veya başka üretim aşamasına uygulanmaz. V2/V4 taslağı transkript kararı tamamlanmadan kesinleştirilemez. Kapak isteğe bağlı olsa da başlatılmış kapak yüklemesi yarım veya doğrulanmamış bırakılamaz.
* **Yayın Kapısı ve Puanlama:** Öğrenme aracı onaylanmadan, metadata doğrulaması tamamlanmadan, araç puanı ve bütün soru puanları tanımlanmadan yayın açılamaz. Saha yayınında Extra puan 5–10 arasındadır; E-Club ve Eczanem yayınında Extra puan bulunmaz. Eczanem hedefinde barkod, Karşılık ve satış fiyatı zorunludur; tekrar periyodu bulunmaz ve ileri sarma kapalıdır. Araç puanı Eczanem'de 50–500 arasında 25'in katı, diğer hedeflerde 40–70 arasında 5'in katıdır. Soru puanı Eczanem'de 10–100 arasında 10'un katı, diğer hedeflerde 3–7 arasında tam sayıdır. Puanı yalnız talebin sahibi üretici, içerik ilk kez yayımlanmadan önce değiştirebilir. İlk yayından sonra öğrenme aracı ve doğru cevap puanları kilitlenir; yayın durdurulsa da değiştirilemez. Hemen yayın Tur-1'i açar; ileri tarihli yayın `planlandi` durumunda bekler. Depodaki pg_cron sözleşmesi tarihi gelen yayınları Türkiye saatiyle 07.00'de, güvenlik tekrarı olarak 07.10'da aktive eder.
* **Planlı Yayın ve Durum Yönetimi:** Üretici yalnız kendi yayınını yönetir. `planlandi` durumunda `tarih_degistir`, `hemen_yayinla` veya `plan_iptal` işlemleri yapılabilir. Tarih değişikliğinde seçilen günün Türkiye saatiyle 07.00'i gelecekte olmalıdır. Hemen yayınlama `yayin_planlananlari_aktive` üzerinden Tur-1 ve bildirim zincirini çalıştırır. Plan iptali yayın yönetimi kaydını kaldırarak içeriği yayına bekleyenlere döndürür. Yayındaki içerik durdurulunca `durum='Durduruldu'` ve durdurma zamanı yazılır; yeniden başlatılınca durum `yayinda`, durdurma zamanı boş ve yayın tarihi yeniden başlatma zamanı olur.
* **Mobil Yayın Akışı, Tanbur ve HOYK Entegrasyonu:** Yayındaki Videolar (`YayindakiVideoBolumu.tsx`), Üretici Yayın Katalogları (`UreticiYayinKatalogu.tsx`) ve Yayın Yönetimi aktif yayınlar listesi (`yayin-yonetimi/page.tsx`), mobilde `MobilYayinAkisi` (2+5 dikey akış) motoruna bağlanmıştır; masaüstünde tam liste ve filtreleme erişimi korunur. Yayın kartı sunumunda `YayinKarti` (HOYK) kanonik bileşeni kullanılır. Video puanı ve Extra puan bilgileri tüm rollerde kartta şeffaf gösterilir; ancak üretici veya yöneticiye puan kazanma yetkisi vermez. Yönetici (`YoneticiAnaSayfa.tsx`) ana sayfasındaki `HayaletTanburSecici`, `tanburBolumleri.length > 1` koşuluna bağlıdır. Üretici Ana Sayfa özeti ve listesi kaldırılmıştır; üreticiler Yayın Yönetimi ile başlar. Yayın raporlarında varyantlar sade sütun düzeniyle gösterilir; kapsayıcı daraldıkça dört sütundan ikiye, ardından bire iner ve varyant açıklama bağlantısı modalı açar. Konu performansı kartında dört özet değer ve ürün bazlı puan dağılımı vardır; ürün kulakçıkları mobilde tek satırda yatay kayar. YAPKA mobilde tek, tablette iki, masaüstünde dört eşit yükseklikli araç kartı kullanır. Rol sekmeleri mobilde yatay kaydırılır. Kartlar, metinler, çizgiler ve araç vurguları ortak tema değişkenlerine bağlıdır.

### Yayın Raporları: Kapsam, Rol, Zaman ve Üç Kart
* **Rapor Sahipliği:** `uretimRaporKapsaminiCoz` üreticiye kendi kullanıcı kimliği ve yayınlarıyla `uretici`, yöneticiye firma düzeyinde `firma` kapsamı verir. Admin için mevcut firma yöneticisi çözümlemesi kullanılır. Çözülen `raporKimligi` tüm kartlara aktarılır. Üretici raporu firmanın bütün üreticilerinin portföyü değildir.
* **Ortak Filtreler:** Tümü, Temsilci (`utt`), BM, Eczacı, Eczane Teknisyeni ve Eczanem Üyesi seçenekleri vardır. Zaman seçenekleri ortak `PERIYOTLAR` kaynağındaki Haftalık, Aylık, Dönemlik ve Yıllık'tır; başlangıç seçimi Aylık'tır. `rapor_rolu` API'de doğrulanır; hedef rol seçimi raporu açan kişinin yetki kapsamını genişletmez.
* **1. Kart — Yayın Üretim Yöntemleri (Varyantlar) ve Dağılımları:** V1–V4 yayın sayıları ve dağılım yüzdeleri gösterilir. Tümü'nde üretici için `get_uretici_yayin_ana_ozet_v1`, yönetici için `get_yonetici_rapor_ana_ozet_v2` özeti kullanılır. Rol seçimlerinde `get_yayin_raporlari_varyant_ozeti_v1` ilgili hedefe açılan yayınları aynı üretici/firma ve dönem kapsamında sayar. Varyant ayrımı talebin `hazir_video` ve `hazir_soru_seti` alanlarından gelir.
* **2. Kart — Yayın Konusu ve Saha Etkisi:** `get_yonetici_egitim_turu_etkisi_v3`, seçili kapsam, rol ve dönem için eğitim türüne göre yayına alınan, tamamlanan izleme, kazanılan ve net puan ile ürün dağılımını servis eder. `YayinKonuPerformansi` ürün kulakçıklarıyla ürünün kazanılan, kaybedilen ve net puanını gösterir. Üreticiye açabileceği eğitim türlerinin detayları sunulur.
* **3. Kart — Öğrenme Aracı Performansı (YAPKA):** Video, Podcast, Dijital Broşür ve Literatür için sayısal özetler SQL'de hesaplanır; uygulama yanıt türlerini uyarlayıp gösterir. `get_yayin_raporlari_arac_kaynagi_v1` ortak kapsamı, `get_yayin_raporlari_arac_performansi_v1` puan/rol özetlerini, `get_yayin_raporlari_arac_tuketimi_v1` içerik ve tüketim sayılarını, `get_yayin_raporlari_arac_potansiyel_puani_v1` potansiyeli sağlar.
* **YAPKA — Toplam İçerik:** Seçili dönemde yayın tarihi bulunan ve şu anda `durum='yayinda'` olan benzersiz yayınlar, araç türüne ve seçili hedef role göre sayılır. Planlı/durdurulan yayınlar sayılmaz. Bu değer kullanıcıya özel Yeni Yayınlar rafının sayısı değildir.
* **YAPKA — Başlatılan, Tamamlanan ve Oran:** Başlatılan, `izleme_baslangic` seçili aralıkta olan her başlangıç kaydını 1; tamamlanan, `tamamlandi_mi=true` ve `izleme_bitis` seçili aralıkta olan her bitiş kaydını 1 sayar. Eski yayınların dönem içindeki hareketleri de kapsanır; bunlar benzersiz yayın sayısı değildir. YAPKA tarih aralığı başlangıç dahil, bitiş hariçtir. Tamamlama oranı `min(100, round(tamamlama / baslatma × 100))` olup başlatma sıfırsa `NULL`, ekranda “—” gösterilir.
* **YAPKA — Puan Katkısı:** Kazanılan ve kaybedilen puanlar dönem içi olaylardan gelir; net puan kazanılan eksi kaybedilendir. Potansiyel, seçili dönemde yayımlanmış ve hâlen yayında olan aynı kapsamlı yayınların tanımlı öğrenme aracı puanlarının toplamıdır (`v_yayin_detay.video_puani`, asıl kaynak `ogrenme_araci_puanlari.arac_puani`). Her yayın bir kez katkı verir; soru/Extra puanı, kişi sayısı ve tüketim/tekrar adedi çarpan değildir. Ekrandaki “Başarı”, aracın pozitif net puanının dört aracın pozitif net puanları toplamındaki yuvarlanmış yüzde payıdır; potansiyelin kazanılma oranı değildir. Pozitif pay yoksa “—” gösterilir.
* **YAPKA — Rol ve Detay Gösterimi:** İzleme/Dinleme/İnceleme/Okuma Sayıları altında UTT, BM, Eczacı, Ecz.Tekn. ve Danışan grupları, kayıt yoksa sıfırla gösterilir. UTT kıdemli/temsilci karşılıklarını, Eczacı ikinci ve yardımcı eczacıyı, Ecz.Tekn. teknisyen karşılığını, Danışan müşteri/Eczanem karşılığını birleştirir; sayılar tamamlamaların toplamıdır. Araç etkileşim detayları `get_yayin_raporlari_arac_yayinlari_v1` üzerinden UUID imleciyle 50'lik sayfalar halinde yüklenir; seçili rol ve özetin tarih aralığı korunur.

### 2. Aşama: Operasyonel Kod ve İş Akışı Kaydı
1. **Rol, Talep ve Hedef Doğrulaması:** `app/(panel)/talepler/api/route.ts`, `lib/uretici/yetenekler.ts`, `lib/utils/roller.ts`, `lib/uretici/talepKaynakSahipligi.ts`.
2. **Atomik Talep Oluşturma:** `talep_atomik_olustur`, `lib/uretim/parametreKontrol.ts` ve istemci işlem anahtarıyla talep–ilk görev bütünlüğü.
3. **İÜ Atama ve Görev Yönetimi:** `lib/uretim/gorevSozlesmesi.ts`, `app/(panel)/uretim/api/gorevler/route.ts`, `uretim_talep_ilk_gorevini_ac`, `uretim_iu_adayi_sec`, `uretim_gorev_devret`.
4. **Dört Araçlı Üretim ve Revizyon:** `lib/ogrenmeAraci/uretimAkisi.ts`, `app/(panel)/uretim/gorevler/[gorev_id]/page.tsx`, araç türüne özgü doğrulama ve karar RPC'leri ile ortak sürüm kapısı.
5. **Yükleme, Kurtarma ve Temizlik:** `lib/video/bunnyYukleme.ts`, `lib/ogrenmeAraci/bunnyStorage.ts`, `lib/ogrenmeAraci/bunnyYuklemeIstemci.ts`, `app/api/ogrenme-araclari/` ve yarım yükleme temizleme akışı.
6. **Soru Seti Üretimi:** `lib/soru/taslak.ts`, `components/SoruIceAktar.tsx`, `uretim_soru_seti_dogrula`, soru seti büyüklüğü ve hazır set parametre kilidi.
7. **Yayın Yönetimi ve Ortak Arayüz:** `app/(panel)/yayin-yonetimi/`, `components/yayin/YayinKarti.tsx`, `components/yayin/MobilYayinAkisi.tsx`, `components/navigasyon/HayaletTanburSecici.tsx`, `yayin_arac_kapisini_dogrula`, yayın öncesi kilitli silme zinciri, Tur-1 ve `scripts/sql/yayin_aktivasyon.sql`.
8. **Üretim ve Yönetici Raporları:** `app/(panel)/raporlar/api/uretim/route.ts`, `app/(panel)/raporlar/api/yonetici/route.ts`, `lib/rapor/uretim/getUretimData.ts`, `lib/rapor/paylasilan/aracTuruDagilimi.ts`. Yayın raporu üreticide kendi yayınlarını, yöneticide firma kapsamını kullanır; eğitim türü, varyant ve öğrenme aracı dağılımları ile tüketim olayları ayrı eksenlerde gösterilir. UI kaynakları: `app/(panel)/raporlar/yayin-raporlari/`, `components/raporlar/YayinKonuPerformansi.tsx`, `components/raporlar/OgrenmeAraciPerformansi.tsx`; kapsam/rol kaynakları: `lib/rapor/uretim/getUretimData.ts`, `lib/rapor/uretim/raporRolu.ts`, `lib/rapor/uretim/getTemsilciVaryantOzeti.ts`.

**Doğrulama kaydı — 3 Eylül 2026:** Bölüm 5 kapsamındaki rol, hedef, talep, varyant, görev, revizyon, sürüm, yükleme, yayın, silme, raporlama ve veri sözleşmelerine yönelik seçili otomatik testlerin **87 / 87'si başarılıdır**.

### 3. Aşama: Depo Şema ve DDL Kaydı
Bu kayıt canlı veritabanı doğrulaması değildir. `scripts/denetim/sema.json` içindeki **29 Eylül 2026 tarihli depo şema anlık görüntüsü** ile kaynak SQL sözleşmelerini ifade eder.

* **Talep ve Görev Omurgası:** `talepler`, `uretim_gorevleri`, `uretim_gorev_atama_gecmisi`, `uretim_islem_kayitlari`, `iu_urun_atamalari`, `iu_genel_atamalari`.
* **Sürümlü İçerik Kayıtları:** `senaryolar`, `senaryo_durumu`, `soru_setleri`, `soru_seti_durumu`, `soru_seti_puanlari`.
* **Ortak Öğrenme Aracı Kayıtları:** `ogrenme_araclari`, `ogrenme_araci_durumu`, `ogrenme_araci_puanlari`, `ogrenme_araci_video_yukleme_oturumlari`, `ogrenme_araci_depolama_temizleme_kuyrugu`.
* **Podcast Taslak ve Transkript Kayıtları:** `talepler.taslak_mi`, `talepler.taslak_oturum_anahtari`, `ogrenme_araclari.taslak_mi`, `ogrenme_araci_transkript_kuyrugu`; tercih, transkript ve dosya doğrulama bilgileri ilgili tercih/metadata alanlarında saklanır.
* **Podcast Taslak RPC'leri:** `podcast_taslak_atomik_olustur`, `podcast_taslak_atomik_kesinlestir`, `podcast_taslak_iptal_et_atomik`, `podcast_taslak_zaman_asimi_temizle_atomik`. Kaynak: `scripts/sql/ogrenme_araclari_faz3_podcast_taslak.sql`; API: `app/(panel)/talepler/api/taslak/route.ts`; temizleyici: `lib/ogrenmeAraci/podcastTaslakTemizleyici.ts`.
* **Podcast Transkript RPC'leri:** `podcast_transkript_ai_baslat_atomik`, `podcast_transkript_ai_isi_al_atomik`, `podcast_transkript_ai_gecici_hata_atomik`, `podcast_transkript_ai_tamamla_atomik`, `podcast_transkript_ai_hata_atomik`, `podcast_transkript_zincir_ac_atomik`. Kaynaklar: `scripts/sql/ogrenme_araclari_faz3_podcast_ai_transkript.sql`, V1/V3 tercih, İÜ AI, teslim ve revizyonda transkript SQL sözleşmeleri; `lib/ogrenmeAraci/sozlesme.ts`, `lib/ogrenmeAraci/transkriptKuyrukIsleyici.ts`, `app/api/cron/transkript-kuyruk/route.ts` ve `app/api/ogrenme-araclari/[arac_id]/transkript-*/` uçları.
* **Hazır Video Tamamlama Kaynakları:** `uretim_hazir_video_kaydet`, `lib/video/hazirVideoTamamla.ts`, `app/(panel)/uretim/api/hazir-video/route.ts`, `app/api/bunny/webhook/route.ts`, `app/api/uretim/hazir-video-mutabakat/route.ts`.
* **Video Uyumluluk Kayıtları:** `videolar`, `video_durumu`, `video_puanlari`. Ortak öğrenme aracı modeli mevcut video zincirini kaldırmadan ve kimlikleri eşleyerek çalışır.
* **Yayın ve Tur Kayıtları:** `yayin_yonetimi`, `yayin_tekrar_kayitlari`.
* **Üretim ve Rapor Görünümleri:** `v_yayin_detay`, `v_uretici_icerik_takip`, `v_rapor_arac_turu_ozet`, `v_rapor_arac_turu_olaylari`. `v_uretim_detay` kaldırılmıştır; üretim ilişkileri doğrudan `talep_id` üzerinden kurulur.
* **Talep ve Görev RPC Ailesi:** `talep_atomik_olustur`, `uretim_talep_ilk_gorevini_ac`, `uretim_iu_adayi_sec`, `uretim_gorev_devret`, `uretim_senaryo_teslim_et`, `uretim_video_teslim_et`, `uretim_soru_seti_teslim_et`, `uretim_uretici_karar_ver`, `uretim_karar_surum_kapisi`.
* **Araç Türüne Özgü Üretim RPC'leri:** `uretim_podcast_dogrula`, `uretim_podcast_uretici_karar_ver`, `uretim_podcast_soru_zinciri_ac`, `uretim_gorsel_dogrula`, `uretim_gorsel_uretici_karar_ver`, `uretim_flip_pdf_dogrula`, `uretim_flip_pdf_uretici_karar_ver`.
* **Yükleme ve Yayın RPC Ailesi:** `ogrenme_araci_yukleme_baslat`, `ogrenme_araci_yukleme_dogrulama_kaydet`, `ogrenme_araci_yarim_yukleme_iptal`, `yayin_arac_kapisini_dogrula`, `yayin_oncesi_silme_baslat`, `yayin_oncesi_silme_hata`, `yayin_oncesi_silme_tamamla`, `yayin_oncesi_silme_yayin_kapisi`, `yayin_planlananlari_aktive`.
* **Yayın Raporları RPC ve SQL Kaynakları:** `get_uretici_yayin_ana_ozet_v1`, `get_yayin_raporlari_varyant_ozeti_v1`, `get_yayin_raporlari_arac_kaynagi_v1`, `get_yayin_raporlari_arac_performansi_v1`, `get_yayin_raporlari_arac_yayinlari_v1`, `get_yayin_raporlari_arac_tuketimi_v1`, `get_yayin_raporlari_arac_potansiyel_puani_v1`. Temel dosyalar `scripts/sql/get_uretici_yayin_ana_ozet_v1.sql`, `get_yayin_raporlari_varyant_ozeti_v1.sql`, `get_yayin_raporlari_arac_performansi_v1.sql`, `get_yayin_raporlari_arac_tuketimi_v1.sql`, `get_yayin_raporlari_arac_potansiyel_puani_v1.sql` dosyalarıdır; son dört ad da `scripts/sql/` altındadır. BM, Eczacı, Teknisyen ve Eczanem genişletmeleri sırasıyla `get_yayin_raporlari_bm_filtresi_v1.sql`, `get_yayin_raporlari_eczaci_filtresi_v1.sql`, `get_yayin_raporlari_teknisyen_filtresi_v1.sql`, `get_yayin_raporlari_eczanem_filtresi_v1.sql` kaynaklarında bulunur. Aynı fonksiyonun sonraki tanımları eski sürümlerden ayrılarak değerlendirilir; dosya envanteri canlı kurulum doğrulaması değildir.
* **Yönetim ve Rapor RPC'leri:** `get_yonetici_hiyerarsi_v2`, `get_yonetici_rapor_ana_ozet_v2`, `get_yonetici_egitim_turu_etkisi_v3`.

---

# 6. BÖLÜM: BÜTÜNSEL MİMARİ REFACTORİNG, DRY VE TEMİZLİK SİCİLİ
*İlk kayıt: 24 Ağustos 2026 | Güncelleme: 23 Ekim 2026 | Kapsam: Kulüp Modülleri ve Ortak Platform Katmanları, DRY Tek-Kaynak Konsolidasyonu ve Ölü Kod Tasfiyesi*

### 1. Amaç ve İcra Kapsamı
23 Ağustos 2026 denetiminin ardından, sistem genelindeki dağınık kütüphane motorları, geçmiş sürümlerden kalan sürüm takıları (`hbligi_v2`), kod tekrarları (DRY ihlalleri) ve atomik RPC mimarisine geçiş sonrası atıl kalan ölü kodlar kapsamlı bir refactoring operasyonuyla temizlenmiştir.

### 2. Modüler Dizin İzolasyonu ve Sorumluluk Sınırları (`lib/`)
Kulüp motorları ve ortak platform katmanları, ortak mimari ilkeler içinde kendi işlevsel sorumluluk sınırlarına ayrılmıştır:
* **T-Club:** `lib/puan/`, `lib/tur/`, `lib/oneri/`, `lib/hbligi_v2/`, `lib/store/` dağınık kök dizinleri toplanarak **`lib/tclub/`** altına taşınmış; `hbligi_v2` takısı standart `hbligi` olarak sadeleştirilmiştir.
* **C-Club:** `lib/cc/` kısaltması tam modüler standart için **`lib/cclub/`** olarak adlandırılmıştır.
* **E-Club:** `lib/eclub/` modüler sınırları korunmuştur. 23 Ekim 2026 repo taramasında doğrudan 38, alt dizinlerle birlikte 57 TypeScript dosyası bulunur; `store/` ve `hediyeTakip/` alt modülleri ayrı sorumlulukları taşır. Önceki 17 dosya bilgisi güncel envanter değildir.
* **Eczanem:** `lib/eczanem/` (11 dosya) B2C ve B2B ayrımıyla korunmuştur.
* **Üretim & Ortak:** `lib/uretim/`, `lib/uretici/`, `lib/video/`, `lib/rapor/` ve `lib/utils/` bağımsız katmanlar olarak tescillenmiştir.
* **Diğer Ortak Katmanlar:** `lib/panel/` rol başlangıcını; `lib/tema/` tema kimlikleri ve çizim renklerini; `lib/zaman/` zaman hesaplarını; `lib/etkilesim/` yayın etkileşimi erişimini ayrı sorumluluklar olarak taşır. Bu dizinlerin varlığı bütün modüllerin tamamen tekilleştirildiği iddiası değildir.
* **Ortak Çekirdek Hizmetler:** `lib/ogrenmeAraci/`, `lib/push/`, `lib/auth/`, `lib/admin/`, `lib/kimlik/` ve `lib/izleme/` öğrenme araçları, bildirim, kimlik doğrulama, yönetim, kimlik çözümleme ve izleme sorumluluklarını ayrı modüllerde yürütür.

### 3. DRY (Don't Repeat Yourself) Tek-Kaynak Konsolidasyonu
1. **Yayın $\rightarrow$ Ürün Çözümleyici:** Proje genelinde 3 farklı yerde elle çağrılan `get_urun_from_yayin` RPC'si, `@/lib/utils/yayinUrun.ts` (`yayindanUrunId`) altında tekilleştirilmiştir.
2. **Tohumlu Fisher-Yates Soru Seçimi:** E-Club içindeki mükerrer 35 satırlık rastgele soru algoritması silinip `@/lib/soru/secim` (`sabitSoruIndeksleri`) merkezine bağlanmıştır.
3. **Cevap Kümesi Doğrulama:** E-Club içindeki 23 satırlık cevap doğrulama fonksiyonu silinip `@/lib/soru/kontrol` (`cevaplarAtananSorularlaEslesiyorMu`) merkezine bağlanmıştır. Merkezi soru seçimi ve cevap kümesi doğrulaması C-Club ve Eczanem bitirme/cevap API'lerinde de kullanılır; kulüplerin puan ve erişim kuralları kendi katmanlarında kalır.
4. **Banner Okuma ve Organizasyon Kapsamı:** `lib/eclub/bannerSunucu.ts`, alanına göre E-Club firma veya Eczanem banner tablosunu okuyarak ortak banner yanıtını oluşturur. `lib/eclub/yonetimKapsami.ts`, UTT/BM/TM ve üretici/yönetici organizasyon kapsamını çözer; Eczanem mutabakat takip API'leri de bu kapsam kaynağını kullanır. Ortak okuma/kapsam yardımcıları, ilgili modül ve işlem yetkisi kontrollerinin yerine geçmez.

### 4. Tasfiye Edilen Ölü ve Yetim Kodlar
* 🗑️ `lib/cc/izleme/bitir.ts` (Silindi — `cc_izleme_tamamla` RPC'si ile değiştirildi)
* 🗑️ `lib/cc/soru/cevapIsle.ts` (Silindi — `cc_cevaplari_kaydet` RPC'si ile değiştirildi)
* 🗑️ `lib/cc/puan/netHesap.ts` (Silindi — `get_cc_ligi_*` RPC ve view ile değiştirildi)
* 🗑️ `lib/cc/izleme/extraKontrol.ts` içindeki `extraPuanHakEdildiMi` (Silindi — RPC içi sayaç ile değiştirildi)
* 🗑️ `lib/eczanem/kazanim.ts` (Silindi — `eczanem_izleme_tamamla` & `eczanem_cevaplari_kaydet` RPC'leri ile değiştirildi)
* 🗑️ `lib/utils/randomSoruSec.ts` (Silindi — Güvensiz eski soru seçici; `lib/soru/secim` ile değiştirildi)

### 5. Tarihsel Doğrulama Kaydı
*Kontrol tarihi: 21 Eylül 2026 — aşağıdaki sonuçlar o tarihteki çalıştırmaya aittir.*

* **TypeScript Derleme Denetimi (`npm run typecheck:build`):** ✅ **BAŞARILI (Exit code 0)**.
* **Bütünsel Duman Testleri (`npm run test:smoke`):** ✅ **497 / 497 TEST BAŞARILI (%100 PASS)**.
*(Not: 16 Eylül 2026 tarihli 436/436 hedef davranış testi sonucu da tarihsel olarak korunmaktadır. 23 Ekim 2026 bölüm karşılaştırması ve belge güncellemesinde test veya derleme çalıştırılmadı; bu eski sonuçlar mevcut repo için yeni başarı kanıtı sayılmaz.)*

### 6. 16 Eylül 2026 Temizlik Kaydı

* Gerçek kullanım, iç çağrı, dış cron/webhook girişi ve Git geçmişi birlikte incelendi; 7 kullanılmayan API rotası ile bunlara bağlı `lib/cclub/uygunVideoListesi.ts` kaldırıldı.
* Kullanılmayan `SenaryoDuzeltmeEditoru.tsx`, `lib/ogrenmeAraci/oynatici.ts`, `lib/utils/senaryo/duzeltmeModeli.ts` ve ilgili eski test kaldırıldı.
* İşlevsiz `vercel.json`, iki kullanılmayan operasyon/denetim betiği ve yalnız sabit kişi/UUID hedefleyen iki tek kullanımlık SQL teşhisi kaldırıldı.
* Tamamlanmış eski HapBi ve öğrenme aracı geliştirme dönemlerini tekrar eden 6 tarihsel plan belgesi kaldırıldı. Güncel sistem kaydı BLUEBOOK, açık işler REDBOOK, davranış kanıtı kaynak kod ve otomatik testlerdir.
* 16 Eylül tarihli SQL denetiminde kalan 181 dosyanın aktif şema sözleşmesi, tekrar çalıştırılabilir değişiklik, test/mutabakat aracı veya gerekli tarihsel geçiş kaydı olduğu doğrulandı. Bu sayı tarihsel envanterdir. 23 Ekim 2026 karşılaştırmasında `scripts/sql/` doğrudan dizininde 289 SQL dosyası bulunur; yeni dosyaların tamamı için bu eski denetimin tekrarlandığı iddia edilmez.

### 7. 20–21 Eylül 2026 Ortak Yayın Arayüzü ve Mobil Akış Kaydı

1. **`YayinKarti` ile HOYK Tekilleştirmesi:** Farklı yayın modüllerindeki dağınık kart sunumları tek kanonik `components/yayin/YayinKarti.tsx` bileşeni altında birleştirilmiştir. Kart üzerinde thumbnail, öğrenme aracı türü pill'i (`YayinTuruPill`), durum ve içerik türü kapsülü, beğeni, favori ve izlenme sayaçları standartlaştırılmıştır. Ürün adı mobilde `text-base leading-[22px] font-bold`, masaüstünde `sm:text-xs` (12px) tipografisiyle sunulur. Video puanı `video_puani != null` koşulunda mobilde `{video_puani} P`, tablet ve masaüstünde `{video_puani} Puan` olarak (önünde “+” bulunmaksızın) tüm rollerde şeffaf gösterilir; bu görsel şeffaflık izleyiciye puan kazanma yetkisi doğurmaz ve yetkiler API düzeyinde korunur. Extra puan yalnız `extra_puan > 0` olduğunda `+{extra_puan} Extra` rozetiyle basılır. Kart genişletme alanları olarak `solUstRozet`, `sagUstEkRozet`, `puanYaniRozet`, `altEkIcerik` ve `hoverOverlay` prop'ları sağlanmıştır.
2. **`MobilYayinAkisi` ile 2 + 5 Mobil Liste Sözleşmesi:** `components/yayin/MobilYayinAkisi.tsx`, kapsama alınan yayın yüzeylerinin (UTT/KD_UTT ana sayfa, kategori ve öneriler; Saha BM/TM ana sayfa rafları; Yönetici ana sayfa ve yayındaki videolar; Üretici sizin/tüm yayınlarınız; C-Club gelen/giden listeleri; E-Club firma video kataloğu; Eczanem video rafları; Yayın Yönetimi aktif yayınlar) merkezi dikey mobil liste motorudur. Mobilde tek sütun dikey liste (`grid-cols-1`) sunar; başlangıçta 2 kayıt açılır ve “Daha Fazla Göster” butonuyla her seferinde en fazla 5 kayıt eklenir. `Number.isFinite` ve pozitif tam sayı dilimleme sınırları uygulanmıştır. Kategori, sekme, kapsam veya arama alanı değiştiğinde (`sifirlamaAnahtari`) akış güvenli biçimde 2 kayda sıfırlanır; aynı kapsamda veri yenilendiğinde kullanıcının açtığı kayıt sayısı korunur. Tablet ve masaüstü grid veya yatay raf düzenleri `masaustuIcerik` prop'u üzerinden eksiksiz korunur.
4. **Arama/Kategori/Kapsam Sıfırlama Sözleşmesi:** `components/liste/IcerikFiltreBari.tsx` bileşeni ve `useOneriler` kancası entegrasyonuyla; arama metni, arama alanı veya aktif/tamamlanan sekmesi değiştiğinde mobil yayın akışının otomatik olarak ilk 2 kayda dönmesi kilitlenmiştir.
5. **Erişilebilirlik (a11y) Düzeltmeleri:** Özel raf veya bölüm başlığı tasarımları bozulmadan, koşullu ve güvenli kapsayıcı ID'leri (`aria-labelledby`) üzerinden ekran okuyucu ve erişilebilirlik bağlantıları güvenceye alınmıştır.
6. **Kullanıcı Bazlı UTT Panel Önbelleği ve Organizasyon Önbelleği:** Rol ana sayfaları `app/(panel)/ana-sayfa/page.tsx` içinde `next/dynamic` ile yüklenir; kullanılan yöntem `React.lazy` değildir. UTT ana sayfa verileri kullanıcı kimliğine göre izole edilerek önbelleğe alınır (`utt_anasayfa_veri_${user.id}`) ve aynı cihazdaki hesaplar arasında veri karışması engellenir; UTT organizasyon zinciri için 5 dakikalık sunucu içi (`in-memory`) önbellek (`ORG_CACHE_TTL = 5 * 60 * 1000`) kurulmuştur. Eski bağımsız mobil akordeon ve sayaç tekrarları tasfiye edilmiştir. Önbellekler yetki kaynağı değildir, sunucu güvenlik denetimleri korunur.
7. **Rol Yetkilerinin ve Puan Motorlarının Bütünlüğü:** Bu 20–21 Eylül arayüz çalışması yalnızca sunumu ve mobil kullanıcı deneyimini ortaklaştırmıştır; o çalışmanın kapsamında canlı veritabanı şeması, migration, API rotaları, rol yetkileri, kulüp iş kuralları ve puan motorları değiştirilmemiştir. Bu tarihsel kapsam kaydı, sonraki geliştirmelerin tamamının yalnız arayüz değişikliği olduğu anlamına gelmez.

### 8. 23 Ekim 2026 Ortak Panel, Tema ve Kontrol Katmanları

1. **Ortak Panel Kabuğu:** `components/panel/PanelKabugu.tsx`, iç panelin `app/(panel)/layout.tsx` katmanı ile Eczanem'in `app/eczanem/_components/EczanemPanelBaglantisi.tsx` bağlayıcısında kullanılır. `PanelNavbar`, `SolListe` ve `MobilDrawer` sunumunu paylaşır; kimlik veya uzak veri işlemi yürütmez. Kimlik, erişim, menü kapsamı, rozet ve bildirim verileri ilgili bağlayıcının sorumluluğudur. Ortak görünüm Eczanem üyesine iç kullanıcı yetkisi vermez.
2. **Rol Başlangıcı:** `lib/panel/baslangic.ts` üreticiler için `/yayin-yonetimi`, diğer iç panel rolleri için `/ana-sayfa` yolunu ve etiketini tek kaynaktan verir. Ana sayfa üretici yönlendirmesi, panel bağlantıları ve ilgili bildirim hedefleri bu yardımcıyı kullanır. Eczanem üyesinin başlangıcı kendi bağlayıcısında `/eczanem` olarak çözülür.
3. **Ortak Tema Altyapısı:** `lib/tema/temalar.ts` iki seçim kimliğini (`mavi`, `yesil`) ve varsayılan mavi temayı tanımlar; renk değerleri `app/tema.css` içinde tutulur. `app/providers/TemaProvider.tsx`, kök `data-tema` niteliğini uygular; oturumlu hesap tercihini `/tema/api` üzerinden okur/kaydeder, oturumsuz başlangıçta açık tarayıcı tercihini kullanır. Tarayıcı tercihi hesaba otomatik taşınmaz; hesap değişiminde eski hesabın bekleyen yanıt ve kayıtları yeni seçimi ezmez. Ortak `TemaSecici`, panel ve üye yüzeylerinde kullanılır. HOYK, rapor kartları ve ilgili ortak kontroller tema değişkenleriyle renklenir; grafik renk yardımcıları `lib/tema/cizimRenkleri.ts` ve üretilmiş renk kaydında bulunur.
4. **Sade Kontroller:** `components/kontrol/SadeKontroller.tsx` ve `sade-kontroller.module.css`; kişi/kapsam ve tablo seçimi, kapsül/sekme filtreleri, periyot ve ay seçimi, form seçicileri, tarih/arama alanları ve işlem düğmelerinin ortak sunum kaynağıdır. Seçiciler arama, devre dışı durum, odak ve klavye gezinmesini ortaklaştırır; ilgili bileşenlerde erişilebilir ad ve seçili durum bilgileri sağlanır. Periyot seçenekleri `lib/utils/raporUtils.ts` içindeki ortak `PERIYOTLAR` kaynağından gelir. Bu bileşenler veri erişimi veya iş kuralı yetkisi üretmez.
5. **Belge Güncellemesinin Sınırı:** Bu kayıt mevcut repo kaynaklarını belgeler. Yalnız BLUEBOOK'un 6. bölümü güncellendi; uygulama/SQL dosyası değiştirilmedi, veritabanı işlemi veya yeni test çalıştırması yapılmadı.

---

# 7. BÖLÜM: ADMİN MODÜLÜ, SAHNE ARKASI TEMİZLİĞİ VE VERİTABANI ŞEMA KAYDI
*İlk kayıt: 25 Ağustos 2026 | Güncelleme: 23 Ekim 2026 | Kapsam: Admin M2 Kabuğu, 30 API Rotası, Yönetim Kuralları, Sahne Arkası Orphan Tasfiyesi ve Veritabanı Şema Anlık Görüntüsü*

### 1. Admin Yönetim Mimarisi (`app/admin/`)
* **M2 Orkestrasyon Kabuğu:** `app/admin/page.tsx` şişkinlikten arındırılmış; iş mantığı `_hooks/` (`useAdminPanel`, `useTekilForm`, `useTopluForm`, `useTakimBolgeForm`, `useUrunTeknik`, `useKullaniciListesi`), görsel parçalar `_components/` altında modülerleştirilmiştir.
* **Global Yönetim Panelleri:** HBStore (`app/admin/_components/global/HbStorePaneli.tsx`), E-Club Store (`app/admin/_components/global/EclubStorePaneli.tsx`) ve Üretim Atama (`app/admin/_components/global/UretimAtamaPaneli.tsx`) merkezi admin çatısına entegre edilmiştir. E-Club Yönetim paneli kendi modül sınırı içindeki `app/admin/eclub/_components/EclubYonetimPaneli.tsx` konumundadır.

### 2. Admin API Güvenlik ve Hata Kaydı
23 Ekim 2026 kaynak taramasında `app/admin/` altında 30 API rota dosyası bulunur. Açık giriş rotası (`/admin/api/giris`) dışındaki 29 dosya ortak `lib/utils/adminGirisKontrol.ts` kaynağını doğrudan veya paylaşılan işleyiciye bağımlılık olarak aktararak kullanır. Bu yardımcı Supabase oturumunu doğrular, kullanıcı kimliğinden rolü okur ve `ADMIN_ROLLER` üyeliğini denetler; e-posta adresi yetki kaynağı değildir. Giriş rotası parola ile oturum açar; operasyonel admin erişimi ayrıca rol kontrolünden geçer. Bu kayıt kaynak incelemesidir; gerçek kullanıcıyla canlı erişim testi yapıldığı anlamına gelmez.
* **Firma & Organizasyon:** `/admin/api/firmalar` (ve takımlar, bölgeler, kullanıcılar, ürünler, teknikler, export, toplu-yükle alt rotaları).
* **Sistem & Operasyon:** `/admin/api/sistem-ayarlari`, `/admin/api/mesai-bypass`, `/admin/api/veri-sil`, `/admin/api/uretim/atamalar`, `/admin/api/uretim/gorev-devret`.
* **E-Club Yönetimi:** `/admin/api/eclub/*` altında 5 rota: `kayitli`, `onaylar`, `test-eczaneler`, `test-temizlik`, `bannerlar`.
* **Mağaza ve Çek Teslimatı:** `/admin/store/api/*` altında 5 rota (`urun-firma`, `upload`, `kategori`, `urun`, `siparis`); `/admin/eclub-cek-teslimat/api/cek-talepleri` altında 1 rota. Eski `/admin/eclub-store/api/*` envanteri güncel değildir.
* **Firma Kapsamında Eczanem Üyeleri:** `/admin/api/firmalar/[firma_id]/eczanem/uyeler` GET/PATCH işleyicileri `lib/admin/eczanemUyeleri.ts` içinde ortaklaştırılmıştır. E-Club, mağaza ve çek teslimatı dışındaki admin API dosyalarının toplamı, giriş dahil 19'dur.

### 3. Firma, Kullanıcı ve Organizasyon Yönetim Kuralları
Firma kaydı aktif veya pasif durumda yönetilir; pasif firmaya bağlı kullanıcıların girişi engellenir ve firmaya açık platform modülleri ayrı ayrı belirlenebilir. Firma silme işleminde dışa aktarım şartı yalnız firmanın talep üretmiş olması halinde aranır: `talepler` kaydı varsa `son_export_at` boş olmamalıdır. Talep üretmemiş firmaya bu koşul uygulanmaz. Bağlı takımı veya kullanıcısı bulunan firma doğrudan silinemez; dışa aktarım yapılmış olması bu iki engeli kaldırmaz.

Eksik bilgili kullanıcı tanımı `lib/admin/kullaniciDogrulama.ts` içindeki `kullaniciEksikMi` kaynağından role göre türetilir; ayrı bir eksik kolonu tutulmaz. Telefon yokluğu eksikliktir. Üreticilerde takım zorunluluğu yetenek profilinden gelir; ürün müdürü ailesinde zorunludur. TM için takım, BM/UTT/KD_UTT için bölge gerekir; takım bölgeden türetilir. Bütün rollerde hem takım hem bölge gerektiği şeklinde genellenmez. Eksik organizasyon bilgisiyle kabul edilen kullanıcı pasif tutulur ve listede görünür; yeni kullanıcı girdisindeki telefon ayrıca zorunlu biçim doğrulamasından geçer. Eksik bilgileri tamamlanan kullanıcı etkinleştirilebilir; toplu güncellemede eksikliği kapanan pasif kullanıcı otomatik etkinleştirilebilir. Eksik bilgili kullanıcısı bulunan firmanın etkinleştirilmesi engellenir.

Toplu kullanıcı yükleme işlemi insan tarafından okunabilir rol ve organizasyon adlarını kabul eder ve ekleme veya güncelleme işlemi olarak çalışır. Mevcut kullanıcının parolası değiştirilmez; dosyada bulunmayan takım veya bölge bilgisi gereksiz yere ezilmez. Organizasyon yapısı yüklenen dosyadan kurulabilir, takımsız bölge oluşturulmaz; hiyerarşi tekilliği ve toplu işlem paket bütünlüğü korunur.

### Firma Kimliği, Bannerlar, Modül Bağımlılığı ve Eczanem Üyeleri
* **Logo ve Kimlik:** `app/admin/_components/LogoKimlikYonetimi.tsx`, firma logosu ile `ogrenme_platformu_aktif` rozetini yönetir. Ekle/Güncelle, Durdur/Yayına Al ve Kaldır işlemleri bulunur. Görsel `lib/firma/logoOptimizasyonIstemci.ts` üzerinden hazırlanıp `/admin/api/firmalar/upload` ile yüklenir; firma logo/kimlik bilgileri firma güncelleme API'sinde kaydedilir.
* **Banner Yönetimi:** E-Club için `app/admin/eclub/_components/EclubBannerYonetimi.tsx`, Eczanem için `app/admin/eczanem/_components/EczanemBannerYonetimi.tsx` kullanılır. Ortak `/admin/api/eclub/bannerlar` rotası alanına göre `eclub_firma_bannerlari` veya `eczanem_sayfa_bannerlari` tablosunu yönetir. Firma ve üye ana sayfa bannerlarında Cogniti platform firması en fazla 5, diğer firmalar 3 banner kullanır; personel sayfası alanları 3 bannerla sınırlıdır. Dosya seçimi önizleme, Yayınla işlemi kayıttır; API dosya ve alan/sıra doğrulamasını sunucuda yapar.
* **E-Club–Eczanem Bağımlılığı:** Firma modülleri bütünüyle bağımsız anahtarlar değildir. Eczanem aynı firmada E-Club açıkken açılabilir. E-Club kapatılırken Eczanem de aynı güncellemede kapatılır. E-Club yeniden açıldığında Eczanem ayrıca açılır; Eczanem'in kapatılması E-Club'ı kapatmaz. Eczanem açılışındaki koşullu güncelleme E-Club'ın eş zamanlı kapanmasına karşı korunur. Kaynak: `app/admin/api/firmalar/[firma_id]/route.ts`. Bölüm 4'te bekleyen olarak kayıtlı `eczanem_eclub_modul_bagimliligi.sql` kurulumunun tamamlandığı bu belge güncellemesiyle iddia edilmez.
* **Eczanem Üye Yönetimi:** `app/admin/eczanem/_components/EczanemUyeYonetimi.tsx`, seçili firma ve eczane kapsamında üyeleri listeler. API arama, aktif/pasif/tümü filtresi ve 20 kayıtlık sayfalama kullanır; eczane il/ilçe bilgileriyle birlikte telefon son dört hanesi dışında maskelenir. `admin_eczanem_uyeleri_oku` listelemeyi, `admin_eczanem_uyelik_durum_degistir` üyelik durumunu yönetir. PATCH isteği üye, eczane, firma, hedef durum ve kullanıcının gördüğü mevcut durumu taşır; önceki durum uyuşmazlığı çakışma olarak ele alınır. Üyelik durumu ile hesabın aktifliği ayrı alanlardır. Bu işlem üye hesabını silme işlemi değildir. Kaynaklar: `lib/admin/eczanemUyeleri.ts`, `scripts/sql/admin_eczanem_uye_yonetimi.sql`.

### Çek Teslimatı Yönetimi
`app/admin/eclub-cek-teslimat/` adminin çek taleplerini izlediği alandır. `/admin/eclub-cek-teslimat/api/cek-talepleri` GET ile listeyi getirir; PATCH `cek_kodu_teslim` işleminde `eclub_store_admin_kod_teslim`, `iptal` işleminde `eclub_store_cek_talebi_iptal` RPC'sini çağırır. Kod kaydının başarılı olması çekin e-posta ve push teslimat kuyruğuna alındığını ifade eder; bildirimin alıcıya teslim edildiğini tek başına kanıtlamaz. Kanal işleyicileri `lib/eclub/store/cekEpostaKuyrukIsleyici.ts` ve `lib/eclub/store/cekPushKuyrukIsleyici.ts` altındadır. Çek e-postasının eczacıya, push bilgisinin ilgili eczanenin aktif E-Club çalışanlarına ulaştırılması iş kuralı Bölüm 3'teki kanal ve alıcı kapsamıyla birlikte değerlendirilir.

### 4. Sahne Arkası (Backstage) ve Orphan Dosya Tasfiyesi
* **Atıl Kodlar & Bileşenler Silindi:** `useStoreAdminPanel.ts`, `useEclubStoreAdminPanel.ts`, `TalepTuruTablari.tsx`, `accordion.tsx`, `separator.tsx`, `SectionTitle.tsx`, `StatCard.tsx`, `StatGrid.tsx`, `agregasyon.ts`, `ligSira.ts`.
* **Atıl Doküman ve Dökümler Silindi:** `talep-dosyalari.txt` (106 KB), `RAPOR-METRIKLERI.md` (13 KB), 6 eski iş planı ve `public/` altındaki 5 starter SVG.

### 5. Veritabanı Tasfiye Geçmişi ve Şema Kaydı
* 25 Ağustos 2026 tarihli tasfiye çalışmasında Supabase canlı veritabanından 9 adet Kuşak-1 eski rapor view'ı (`v_rapor_bolge`, `v_rapor_sirket`, `v_rapor_takim`, `v_rapor_utt`, `v_rapor_urun_izlenme`, `v_izleme_ozet`, `v_senaryo_son_durum`, `v_soru_seti_son_durum`, `v_video_son_durum`) ve atıl `egitimler` tablosu kaldırılmıştır.
* `scripts/denetim/sema.json`, canlı veritabanı doğrulaması değil, **29 Eylül 2026 tarihli depo şema anlık görüntüsüdür**. Dosyanın üst bilgisi `tablo_sayisi=123`, `rpc_sayisi=206` bildirir; buna karşılık `tablolar` sözlüğünde 122, `rpc` sözlüğünde 203 kayıt vardır. Bildirilen toplamlar ile listelenen kayıtların sayısı aynı değildir; tek bir kesin tablo/RPC sayısı gibi sunulmaz. Önceki 111 tablo/155 RPC bilgisi güncel değildir. Bu bölüm güncellemesinde şema dosyası değiştirilmedi veya canlı veritabanından yeniden çekilmedi.

### 6. Tarihsel Doğrulama Kaydı
*Kontrol tarihi: 3 Eylül 2026 — aşağıdaki sonuçlar o tarihteki çalıştırmaya aittir. 23 Ekim 2026 kaynak karşılaştırması ve bu belge güncellemesinde test, derleme veya mimari lint çalıştırılmadı; eski sonuçlar mevcut repo için yeni başarı kanıtı değildir.*

* **TypeScript:** ✅ `npm run typecheck:build` $\rightarrow$ **BAŞARILI (Exit code 0)**.
* **Duman Testleri:** ✅ `npm run test:smoke` $\rightarrow$ **244 / 244 TEST BAŞARILI (%100 PASS)**.
* **Mimari ESLint:** ✅ `npm run lint:mimari` $\rightarrow$ **MİMARİ KURAL İHLALİ YOK**.

---

# 8. BÖLÜM: ROL, GÖREV, BİLDİRİM VE KULLANICI ETKİLEŞİM MİMARİSİ
*İlk kayıt: 25 Ağustos 2026 | Güncelleme: 23 Ekim 2026 | Kapsam: Platform Rolleri, Görev Devirleri, Anlık ve Kalıcı Bildirimler, Rozetler, Web Push, Kanal Teslimatı ve Rol Bazlı İşlem Yetkileri*

### 1. Ortak Bildirim Mimarisi ve Dil Sözleşmesi
* **Ortak Bileşen:** `components/HataMesaji.tsx`, platformdaki `hata`, `basari`, `uyari` ve `bilgi` bildirimlerinin ortak görsel ve davranış sözleşmesidir. `useHataMesaji` kullanan her yüzey kendi mesaj state'ini yönetir; bileşen ortaktır, uygulama genelinde tek bir global toast state'i bulunmaz.
* **Yerleşim ve Süre:** `HataMesajiContainer` bildirimleri sağ üstte `top:24`, `right:24`, en fazla 380 piksel genişlik ve `zIndex:9999` ile gösterir. Varsayılan görünme süresi 12 saniyedir; kaybolmaması gereken uyarılar kullanıcı kapatana kadar kalıcı olabilir.
* **Kurumsal Dil:** Kullanıcıya dönük metinlerde kurumsal “siz” dili kullanılır. Teknik rol kodları, altyapı sağlayıcılarının adları ve iç sistem ayrıntıları kullanıcı mesajlarına taşınmaz; hata, yapılan işlem ve kullanıcının atabileceği sonraki adım açık dille anlatılır.
* **Üretim Devir Bildirimi:** `lib/uretim/toastMesaj.ts`, üretim hattındaki işlem bildirimlerinin ortak sözlüğüdür. Bir aşamayı kapatan mesaj, tamamlanan işi ve sıradaki işin sahibini birlikte bildirir. Sıradaki işlem aynı kullanıcıdaysa ilgili yönetim ekranına yönlendirir; revizyon mesajı revizyon talebinin kime iletildiğini belirtir.
* **Öğrenme Aracı Adı:** Kullanıcıya gösterilen varyant, aşama, durum ve bildirim metinleri seçilen aracın gerçek adını kullanır: **Video**, **Podcast**, **Dijital Broşür** veya **Literatür**. `video` ve `hazir_video` gibi tarihsel teknik anahtarlar yalnız geriye dönük uyumluluk içindir.

### 2. Üretici Rolleri ve Görev Devir Matrisi

| Rol grubu | Yetki ve kapsam | Üretim görevi |
|---|---|---|
| **Ürün ailesi** (`pm`, `jr_pm`, `kd_pm`) | Takım kapsamında ürün eğitimi oluşturur; ürün zorunlu, teknik tercihlidir. Eczanem hedefli talep açabilen roller bu aile ile Medikal Müdür'dür. E-Club/Eczanem hedefinde teknik seçilmez. | Dört üretim varyantında talep açar, teslimleri inceler, onay veya revizyon kararı verir ve yayını yönetir. |
| **Medikal** (`med_md`) | Firma kapsamında medikal eğitim ve ürün medikal eğitimi oluşturur; Eczanem hedefli talep de açabilir ve bu hedefte ürün zorunludur. | Kendi talebine bağlı senaryo, öğrenme aracı ve soru setini inceler. |
| **Eğitim** (`egt_md`, `egt_yrd_md`, `egt_yon`, `egt_uz`) | Firma kapsamında satış teknikleri ve yönetim eğitimi oluşturur; satış tekniklerinde saha hedefleri için teknik seçimi zorunludur; E-Club hedeflerinde teknik seçilmez. | Kendi yetenek profiline uygun talep ve inceleme akışını yürütür. |
| **İnsan Kaynakları** (`ik_drk`, `ik_md`, `ik_yrd_md`, `ik_uz`, `ik_per`) | Firma kapsamında İK ve yönetim eğitimi oluşturur; E-Club hedefli talep açamaz, Eczanem hedefi için yetkili rol listesinde yer almaz. | Kendi yetenek profiline uygun talep ve inceleme akışını yürütür. |
| **İçerik Üreticisi** (`iu`) | Firmalardan bağımsız ortak içerik fabrikasında yalnız kendisine atanmış işleri görür. | Senaryo, seçilen öğrenme aracı ve soru seti görevlerini üretir, teslim eder ve istenen revizyonları tamamlar. |

| Olay | Kapanan iş | Yeni iş ve sorumlusu |
|---|---|---|
| **V1 — Tam Üretim talebi** | Talep oluşturuldu. | Senaryo üretimi İçerik Üreticisindedir. |
| **V2 — Hazır Öğrenme Aracı talebi** | Hazır araç doğrulandı ve talep oluşturuldu. | Soru seti üretimi İçerik Üreticisindedir. |
| **V3 — Hazır Soru Seti talebi** | Hazır soru seti doğrulandı ve talep oluşturuldu. | Senaryo üretimi İçerik Üreticisindedir. |
| **V4 — Hazır Araç ve Hazır Soru Seti talebi** | Hazır bileşenler doğrulandı ve talep oluşturuldu. | Yayın yönetimi talep sahibindedir; İÜ görevi açılmaz. |
| **Senaryo teslimi** | İÜ senaryo görevini tamamladı. | İnceleme talep sahibindedir. |
| **Senaryo onayı** | Senaryo incelemesi tamamlandı. | Seçilen öğrenme aracının üretimi İçerik Üreticisindedir. |
| **Öğrenme aracı teslimi** | İÜ araç üretimini tamamladı. | İnceleme talep sahibindedir. |
| **Öğrenme aracı onayı** | Araç incelemesi tamamlandı. | Hazır soru seti yoksa soru seti İÜ'dedir; varsa yayın yönetimi talep sahibindedir. |
| **Soru seti teslimi** | İÜ soru setini tamamladı. | İnceleme talep sahibindedir. |
| **Soru seti onayı** | Üretim zinciri tamamlandı. | Yayın yönetimi talep sahibindedir. |
| **Revizyon talebi** | İnceleme kararı kaydedildi. | İlgili aşamanın revizyonu İçerik Üreticisindedir. |

Bildirimler seçilen öğrenme aracının adını ve talebi açan kullanıcının gerçek unvanını kullanır. Form doğrulamaları hedef rol, ürün, teknik, içerik adı, hazır dosya ve soru seti gerekliliklerini ilgili üretici yeteneğine ve varyanta göre bildirir.

### 3. Saha, Yönlendirme, Yönetim ve Admin Rolleri

| Rol grubu | Temel görev ve kapsam | Başlıca işlem bildirimi |
|---|---|---|
| **UTT / KD_UTT** (`utt`, `kd_utt`) | Dört öğrenme aracını T-Club'da tüketir; soru ve puan akışını yürütür, eczane portföyünü yönetir, E-Club önerisi ve Eczanem eczane dağıtımı yapar, Eczanem mutabakatını değerlendirip BM onayına gönderir, yetkisi açıksa HBStore kullanır. | Puan zamanı, tamamlama, cevap, öneri, eczaneye gönderim, üye eşiği, sipariş ve bakiye sonucu. |
| **Bölge Müdürü** (`bm`) | Bölgesindeki UTT/KD_UTT kullanıcılarını ve raporları izler, T-Club önerisi oluşturur, C-Club'da uygun BM'lere challenge gönderir, Eczanem mutabakatında kendi kapsamındaki kayıtları değerlendirip onaylananları TM'ye gönderir ve yetkisi açıksa HBStore kullanır. | Öneri, challenge, bekleyen challenge, rapor, lig ve sipariş sonucu. |
| **Takım Müdürü** (`tm`) | Takımındaki BM ve UTT sonuçlarını, öneri akışını, raporları ve yetkili sipariş görünümünü izler; Eczanem mutabakatında kendisine gönderilen kayıtlar için nihai onay, bekletme veya ret kararı verir; öneri veya mağaza siparişi oluşturmaz. | Rapor, öneri takibi, takım ligi ve bölge sıralaması. |
| **Yöneticiler** (`gm`, `gm_yrd`, `drk`, `paz_md`, `blm_md`, `grp_pm`, `sm`) | Firma kapsamındaki üretim, T-Club, C-Club, E-Club, Eczanem ve sipariş raporlarını rol yetkisine göre izler; rapor erişimi işlem oluşturma yetkisi doğurmaz. | Firma raporu, üretim portföyü ve kapsamındaki operasyon kayıtlarının yükleme sonucu. |
| **Admin** (`admin`) | Firma, kullanıcı, organizasyon, modül, sistem ayarı, Store ve üretim atamalarını merkezi yönetim kapsamıyla yürütür. | Doğrulama, oluşturma, güncelleme, dışa aktarma ve yönetim işlemlerinin sonucu. |

T-Club ve C-Club'da soru hakkı izleme kimliğine bağlıdır; bu bağ tek başına her yeni oturumda yeni soru hakkı doğduğu anlamına gelmez. T-Club başlatma API'si geçerli tur başlangıcından sonraki gerçek oynatma kayıtlarıyla deneme sırasını belirler. Mesai dışında izleme kaydı oluşturmaz; dolayısıyla bu açılış puanlı deneme kaydı olarak sayılmaz. Yeni izleme başlatılırken aynı kullanıcı–yayın için önceki tamamlanmış izlemelerin açık soru erişimi kapatılır; eski izleme kimliğiyle soru akışına dönülemez. C-Club kendi geçerli tur, kendi izleme/challenge/extra ve soru kapısı kurallarını uygular; T-Club'ın mesai kuralı tüm kulüplere genellenmez. İlgili kaynaklar `app/izle/api/baslat/route.ts`, `lib/tclub/puan/strateji.ts` ve `app/(panel)/challenge-club/izle/api/` altındaki başlatma, bitirme ve cevap uçlarıdır. Video ileri sarma davranışı sabit bir “tüm puanı iptal etme” kuralı değildir; puanlı zamanda atlanan sürenin araç puanındaki oransal karşılığı kayıp olarak uygulanır. Araç türüne özgü ilerleme ve tamamlama kuralları Bölüm 1–3'teki kulüp sözleşmeleriyle birlikte değerlendirilir.

Ortak `YayinKarti` (HOYK) üzerinde Video puanı ve Extra izleme puanı rozetleri tüm rollerde (üretici ve yönetici dahil) görünür kılındığından kart üzerinde bilgi şeffaflığı sağlanmıştır; ancak puanların görünmesi puan kazanma yetkisi doğurmaz ve yetki sınırları API düzeyinde korunur. `HayaletTanburSecici` mobil navigasyonu UTT/KD_UTT, BM, TM ve yönetici ana sayfa yüzeylerinde kullanılır; `iu` ve `admin` ana sayfaları bu kapsamın dışındadır. 13 üretici rolü `lib/panel/baslangic.ts` üzerinden `/yayin-yonetimi` adresine yönlendirilir; üretici ana sayfasında koşulsuz Tanbur bulunduğunu söyleyen eski kayıt geçerli değildir. Yönetici ana sayfasında `tanburBolumleri.length > 1` koşulu aranır. BM'nin ortak raf görünümünde `SahaVideoRaflari`, TM'nin kendi raf görünümünde `TmAnaSayfa` Tanbur'u kullanır. UTT/KD_UTT ana sayfasında aktif durum filtresi açık değilken çizilir.

### 4. E-Club ve Eczanem Rolleri

| Rol grubu | Temel görev ve kapsam | Başlıca işlem bildirimi |
|---|---|---|
| **E-Club eczacı unvanları** (`eczaci`, `ikinci_eczaci`, `yardimci_eczaci`) | Eczane ilişkisi kapsamında öğrenme araçlarını tüketir, soru ve puan akışına katılır, E-Club Store'un yetkili görüntülerini kullanır; hediye çeki talebi oluşturma yetkisi bu unvanların tamamına ait değildir, yalnız ana eczacı (`eczaci`) talep oluşturabilir; yetkili olduğu eczanede Eczanem üyelik, dağıtım ve işlem kararlarını yürütür. | Eğitim, tamamlama, sipariş, Eczanem uygulaması üyesi bağlama, içerik dağıtma ve işlem kararı sonucu. |
| **Eczane teknisyeni** (`eczane_teknisyeni`) | Kendi unvanıyla E-Club'a katılır; yetkili eczane ilişkisi kapsamında öğrenme, yetkili Store görüntüleri ve Eczanem operasyonlarını yürütür; hediye çeki talebi oluşturamaz. | Eczacı unvanlarıyla aynı işlem ailesindeki, kendi yetkisine uygun sonuçlar. |
| **Eczanem uygulaması üyesi** (tarihsel teknik rol: `musteri`) | Bağlı olduğu eczaneden gelen dört öğrenme aracını kullanır, uygun puanları kazanır ve eczaneye işlem talebi iletebilir. Üye, eczanenin müşterisi veya müşteri adayı olabilir; bu sıfatı Cogniti belirlemez. | İçerik tamamlama, soru, puan, talep oluşturma veya vazgeçme sonucu. |

UTT/KD_UTT'nin Eczanem hedefli öğrenme içeriğini eczaneye göndermesi ile yetkili eczane personelinin bu içeriği Eczanem uygulaması üyelerine dağıtması iki ayrı aşamadır. Cogniti, eczane ile Eczanem uygulaması üyesi arasındaki ticari ilişkinin tarafı değildir; platform yetkili kullanıcıların girdiği bilgileri, dağıtım kararlarını ve işlem durumlarını kaydeder ve uygular.

HBStore ve E-Club Store işlemlerinde bildirim, siparişin alınması veya iptali ile stok, adres ve harcanabilir bakiye doğrulamalarının sonucunu açıklar. Bildirimde sistemde bulunmayan “mağaza yöneticisi” gibi bir rol oluşturulmaz; sonraki durum işlem akışı veya gerçek yetkili rol üzerinden ifade edilir.


### Kalıcı Bildirim, Rozet ve Web Push Katmanları

* **Anlık Mesaj ile Kalıcı Kayıt Ayrımı:** `HataMesaji` kullanıcının yaptığı işlemin anlık sonucunu gösterir; `bildirimler` ve `eclub_bildirimler` kalıcı bildirim kaynaklarıdır. `/bildirimler/api` GET oturumdaki iç kullanıcı bildirimlerini ve varsa Auth kimliğine bağlı E-Club kişisinin görülmemiş bildirimlerini birleştirip tarihe göre sıralar. PUT okundu işlemlerini ilgili alıcı kapsamında yürütür; çek bildirimleri E-Club kişi ve gerektiğinde firma/eczane kapsamıyla sınırlandırılır.
* **Rozet Hesapları:** Rozet sayısı her durumda ham bildirim adedi değildir. Öneri rozeti `oneriIzlenebilirMi` ile zaman ve izlenme koşullarından hesaplanır; API sonraki zaman sınırını da döndürür. Yayın rozeti talep sahibinin onaylı fakat henüz yayın kaydı açılmamış içeriklerinden; çek firma rozetleri talebin firmasından türetilir. `lib/bildirimler/rozet.ts` içindeki `bildirimRozetleriniYenile`, aynı tarayıcıda yenileme olayını yayımlar; bu olay yetki kaynağı veya sunucudaki kaydın yerine geçen bir sayaç değildir.
* **Kimlik ve Abonelik:** `app/api/push/abonelik/route.ts` aboneliği istemcinin bildirdiği kullanıcıya değil oturumdaki `user.id` kimliğine bağlar. Geçerli oturuma sahip iç kullanıcı, E-Club kişisi ve Eczanem üyesi abone olabilir; abone olmak bütün olayları alma yetkisi vermez. Kullanıcı yalnız kendi aboneliğini pasifleştirebilir. `lib/utils/rolCozucu.ts`, gönderim anındaki rolü `v_auth_kimlik_admin` üzerinden çözer; istemci metadata'sındaki eski rol yetki kaynağı değildir.
* **Push Orkestrasyonu ve Olaylar:** `lib/push/tipler.ts` olay/abonelik/yük sözleşmesini, `lib/push/icerik.ts` olay–rol içerik ve hedef eşlemesini, `lib/push/orkestrasyon.ts` ayar → rol → içerik → aktif abonelik → gönderim → denetim kaydı zincirini yönetir. Olaylar üretim durum geçişi, içerik önerisi/yayını, E-Club önerisi, hediye çeki teslimi, challenge, Eczanem gönderimi/işlemi ve mağaza siparişidir. Teknik `video_*` olay adları dört araçlı yapının geçmiş adlarıdır. İçerikler genel metinler kullanır; ayrıntılar uygulama içindeki yetkili ekranda açılır. Hedef yollar rol ve firma/öneri/challenge/gönderim bağlamıyla üretilir.
* **Gönderim ve Hata Sınırı:** Olay aç/kapa ve TTL ayarları `sistem_ayarlari` kaynağından okunur; varsayılan TTL üç gündür. Tekrarlanan/boş alıcılar ayıklanır; uygun içerik bulunmayan rol atlanır. Gönderim sonuçları `push_gonderim_kayitlari` içinde gönderim anındaki rol ile tutulur. Push hatası ana iş akışını geri almaz. `pushYayinlaArkada` yanıt sonrası işi `after()` ile yürütür; kuyruk işleyicileri `pushYayinlaSonuclu` sonucunu değerlendirir. Abonelik ve ortam yapılandırması olmadan başarılı push teslimi varsayılmaz.
* **Hediye Çeki Yetki ve Kanal Sözleşmesi:** `lib/eclub/store/cekTalebiYetkisi.ts` ve çek talebi API'si oluşturma yetkisini yalnız ana eczacıya verir. Admin kod tesliminde e-posta işi eczanenin tek uygun ana eczacısı için, push işleri aktif eczane bağı ve Auth kimliği bulunan çalışanlar için hazırlanır. E-posta ve push kanalları `eclub_cek_teslimat_outbox` ile ayrı izlenir; kaynaklar `scripts/sql/eclub_cek_teslimat_outbox.sql`, `lib/eclub/store/cekEpostaKuyrukIsleyici.ts`, `lib/eclub/store/cekPushKuyrukIsleyici.ts` altındadır. Push işleyicisi en az bir başarılı gönderim sonucu olmadan işi tamamlandı saymaz. Kodun kaydedilmesi, kuyruğa alınma, kanal gönderimi ve kullanıcının bildirimi okuması farklı aşamalardır.
* **Mutabakat Rol Ayrımı:** UTT/KD_UTT kendi mutabakatını değerlendirir ve onayını BM'ye gönderir; BM kendisine atanan kapsamı değerlendirip onayını TM'ye gönderir; TM onay/beklet/ret kararı verir. Üst role gönderme ile karar verme ayrı işlemlerdir. Nihai TM kararı ve alt rollerin gönderim sonrası değişiklik sınırları Bölüm 4'teki sözleşmeyle uygulanır; rapor erişimi bu işlem yetkilerini kendiliğinden vermez.

### 5. bi — Kaldırıldı (19 Ekim 2026)

Kullanıcının kararıyla bi sohbet özelliği sistemden tamamen kaldırıldı. Sohbet arayüzü, yüzen düğme, global sağlayıcı, soru API'si, rol bazlı cevap/prompt ve Gemini sohbet motoru ile bunlara özel test ve pilot çıktıları silindi. Özelliği yeniden açacak bayrak veya geçiş katmanı bırakılmadı.

Statkart, lig, raporlar ve mevcut sayfa rehberleri kullanılmaya devam eder. Podcast transkripsiyonunun ayrı Gemini bağlantısı ve ortak ortam değişkenleri bu kaldırmanın kapsamında değildir. bi'ye özel veri tabanı tablosu veya migration bulunmadığından bu işlem için SQL değişikliği gerekmedi.


---

# 9. BÖLÜM: BÜTÜNSEL DOSYA VE DİZİN ENVANTERİ (CANONICAL FILE MANIFEST)
*Güncelleme: 23 Ekim 2026 | Kapsam: Projenin mevcut kaynakları, yapılandırmaları, testleri, altyapısı, görselleri ve kurumsal belgeleri*

Bu envanter mevcut dosya yollarını kaydeder. Bağımlılıklar, Git iç verileri, derleme/önbellek ve test raporu çıktıları, işletim sistemi artıkları, yerel araç ayarları ve outputs dizinleri kapsam dışıdır. .env.local ve .env.example yalnız ad ve işlevleriyle yer alır; gizli içerikleri okunmaz veya BLUEBOOK’a alınmaz. Kaynak olarak tutulan üretilmiş renk kayıtları ve mevcut belge/denetim çıktıları kendi türleriyle belirtilir.

Kaldırılmış veya taşınmış yollar aktif dosya gibi listelenmez; mevcut eski adlı dosyalar ise adları nedeniyle yok sayılmaz. Dosya varlığı, bir SQL’in canlıda kurulduğunun, bir testin çalıştırıldığının veya başarılı olduğunun kanıtı değildir. Bu güncelleme yalnız 9. bölümün envanterini kapsar; 11–13 numaralı sözleşmeler ve sonraki ekler korunmuştur.

## 1. KÖK DİZİN (ROOT & CONFIG)

### 📁 / (Kök Dizin)

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `.env.example` | Yapılandırma | Ortam değişkenlerinin kurulum şablonudur; bu envanter yalnız dosyanın adını ve görevini kaydeder. |
| `.env.local` | Yapılandırma | Yerel ortamın gizli servis adreslerini ve anahtarlarını taşır; yalnız adı kaydedilir, içeriği okunmaz veya belgeye alınmaz. |
| `.gitignore` | Yapılandırma | Sürüm kontrolüne alınmayacak bağımlılık, derleme, ortam ve yerel çalışma çıktılarını tanımlar. |
| `.vercelignore` | Yapılandırma | Vercel dağıtım paketine gönderilmeyecek medya, doküman, denetim ve yerel geliştirme varlıklarını sınırlar. |
| `AGENTS.md` | Dokümantasyon | Bu depoda çalışan yapay zekâ ajanlarının Next.js dokümantasyonu ve KVKK takip süreci dâhil zorunlu çalışma kurallarını tanımlar. |
| `CLAUDE.md` | Dokümantasyon | Claude tabanlı geliştirme araçları için projeye özgü çalışma bağlamı ve yönlendirmeleri taşır. |
| `README.md` | Dokümantasyon | Projenin geliştirme ortamını başlatma ve temel Next.js komutlarını açıklayan başlangıç belgesidir. |
| `components.json` | JSON / Yapılandırma | shadcn/ui bileşen üretimi için stil, alias ve dosya konumu tercihlerini tanımlar. |
| `eslint.config.mjs` | Yapılandırma | Next.js ve TypeScript lint ayarlarıyla HapBilgi’ye özgü mimari bağımlılık kurallarını etkinleştirir. |
| `instrumentation.ts` | TypeScript / Altyapı | Next.js instrumentation girişinde sunucu başlangıç kancalarını tanımlar. |
| `next-env.d.ts` | TypeScript / Lib | Next.js tarafından üretilen TypeScript ortam ve tip başvurularını projeye tanıtır; elle düzenlenmez. |
| `next.config.ts` | Yapılandırma | React Compiler ve bağımsız tip kontrolüyle bağlantılı derleme ayarlarını tanımlar; eski üretim raporu adreslerini /raporlar/yayin-raporlari yoluna yönlendirir. |
| `package-lock.json` | Bağımlılık Kilidi | NPM bağımlılık ağının kesin sürümlerini ve bütünlük özetlerini kilitler. |
| `package.json` | JSON / Yapılandırma | Uygulamanın bağımlılıklarını ve geliştirme, test, tip kontrolü, derleme ile denetim komutlarını tanımlar. |
| `postcss.config.mjs` | Yapılandırma | Tailwind CSS dönüşümünü Next.js derleme hattına bağlayan PostCSS yapılandırmasıdır. |
| `proxy.ts` | TypeScript / Lib | Kimlik, rol ve firma modüllerine göre rota erişimini korur; oturumsuz /ana-sayfa isteğini kök karşılama içeriğine rewrite eder. |
| `tsconfig.build.json` | JSON / Yapılandırma | Üretim kaynaklarını testlerden ayırarak bağımsız ve artımsız tip kontrolüne tabi tutar. |
| `tsconfig.json` | JSON / Yapılandırma | Projenin strict TypeScript, modül çözümleme ve yol alias kurallarını tanımlar. |

## 2. APP ORTAK ROTALAR, SAĞLAYICILAR VE SERVİS UÇLARI

### 📁 app/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `apple-icon.png` | Belge / Görsel | apple icon için belge veya görsel referans varlığıdır. |
| `favicon.ico` | Görsel / İkon | Tarayıcı sekmesinde kullanılan Cogniti site simgesidir. |
| `globals.css` | Stil / CSS | Tailwind CSS katmanlarını, ortak tema değişkenlerini ve uygulama genelindeki temel stilleri tanımlar. |
| `layout.tsx` | UI / React | Uygulamanın kök HTML iskeletini, global stilleri ve kimlik sağlayıcısını kuran Next.js yerleşimidir. |
| `page.tsx` | UI / React | Kök adreste Cogniti karşılama sayfasını sunar; giriş formu ayrı /login sayfasındadır. |
| `tema.css` | Stil / CSS | Mavi ve yeşil temaların ortak ve yüzeye özgü renk değişkenlerini tanımlar. |

### 📁 app/_components/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `KarsilamaSayfasi.tsx` | UI / React | Karsilama Sayfasi arayüz bileşenini veya sağlayıcısını tanımlar. |

### 📁 app/api/bunny/webhook/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | Medya sağlayıcısından gelen video işleme bildirimini imzayla doğrular; video ve ortak öğrenme aracı durumlarını eşzamanlı günceller. |

### 📁 app/api/cron/eclub-cek-eposta/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/api/cron/eclub-cek-eposta` yolunun GET/POST sunucu işleyicilerini tanımlar. |

### 📁 app/api/cron/eclub-yayin-gonderim/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/api/cron/eclub-yayin-gonderim` yolunun GET/POST sunucu işleyicilerini tanımlar. |

### 📁 app/api/cron/transkript-kuyruk/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/api/cron/transkript-kuyruk` yolunun GET/POST sunucu işleyicilerini tanımlar. |

### 📁 app/api/ogrenme-araclari/[arac_id]/destek-yukleme-baslat/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/api/ogrenme-araclari/[arac_id]/destek-yukleme-baslat` uç noktasında POST isteklerini işler; Cogniti için öğrenme araçları destek yükleme başlatma sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/api/ogrenme-araclari/[arac_id]/destek-yukleme-tamamla/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/api/ogrenme-araclari/[arac_id]/destek-yukleme-tamamla` uç noktasında POST isteklerini işler; Cogniti için öğrenme araçları destek yükleme tamamlama sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/api/ogrenme-araclari/[arac_id]/erisim/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/api/ogrenme-araclari/[arac_id]/erisim` uç noktasında GET isteklerini işler; Cogniti için öğrenme araçları erişim sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/api/ogrenme-araclari/[arac_id]/flip-pdf-dogrula/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/api/ogrenme-araclari/[arac_id]/flip-pdf-dogrula` uç noktasında POST isteklerini işler; Cogniti için öğrenme araçları flip pdf doğrulama sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/api/ogrenme-araclari/[arac_id]/gorsel-dogrula/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/api/ogrenme-araclari/[arac_id]/gorsel-dogrula` uç noktasında POST isteklerini işler; Cogniti için öğrenme araçları Dijital Broşür doğrulama sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/api/ogrenme-araclari/[arac_id]/podcast-dogrula/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/api/ogrenme-araclari/[arac_id]/podcast-dogrula` uç noktasında POST isteklerini işler; Cogniti için öğrenme araçları Podcast doğrulama sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/api/ogrenme-araclari/[arac_id]/transkript-ai-baslat/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/api/ogrenme-araclari/[arac_id]/transkript-ai-baslat` yolunun POST sunucu işleyicilerini tanımlar. |

### 📁 app/api/ogrenme-araclari/[arac_id]/transkript-durum/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/api/ogrenme-araclari/[arac_id]/transkript-durum` yolunun GET sunucu işleyicilerini tanımlar. |

### 📁 app/api/ogrenme-araclari/[arac_id]/transkript-yonet/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/api/ogrenme-araclari/[arac_id]/transkript-yonet` yolunun POST sunucu işleyicilerini tanımlar. |

### 📁 app/api/ogrenme-araclari/bayraklar/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/api/ogrenme-araclari/bayraklar` uç noktasında GET isteklerini işler; Cogniti için öğrenme araçları bayraklar sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/api/ogrenme-araclari/flip-pdf-ilerleme/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/api/ogrenme-araclari/flip-pdf-ilerleme` uç noktasında POST isteklerini işler; Cogniti için öğrenme araçları flip pdf ilerleme sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/api/ogrenme-araclari/gorsel-tamamla/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/api/ogrenme-araclari/gorsel-tamamla` uç noktasında POST isteklerini işler; Cogniti için öğrenme araçları Dijital Broşür tamamlama sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/api/ogrenme-araclari/podcast-ilerleme/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/api/ogrenme-araclari/podcast-ilerleme` uç noktasında POST isteklerini işler; Cogniti için öğrenme araçları Podcast ilerleme sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/api/ogrenme-araclari/yarim-yuklemeler/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/api/ogrenme-araclari/yarim-yuklemeler` uç noktasında GET, DELETE, POST isteklerini işler; Cogniti için öğrenme araçları yarım yüklemeler sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/api/ogrenme-araclari/yukleme-baslat/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/api/ogrenme-araclari/yukleme-baslat` uç noktasında POST isteklerini işler; Cogniti için öğrenme araçları yükleme başlatma sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/api/ogrenme-araclari/yukleme-local/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/api/ogrenme-araclari/yukleme-local` uç noktasında PUT isteklerini işler; Cogniti için öğrenme araçları yükleme yerel sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/api/ogrenme-araclari/yukleme-tamamla/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/api/ogrenme-araclari/yukleme-tamamla` uç noktasında POST isteklerini işler; Cogniti için öğrenme araçları yükleme tamamlama sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/api/push/abonelik/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/api/push/abonelik` uç noktasında POST, DELETE isteklerini işler; Web Push bildirimleri için Web Push abonelik sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/api/raporlar/yayin-detay/[yayin_id]/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/api/raporlar/yayin-detay/[yayin_id]` yolunun GET sunucu işleyicilerini tanımlar. |

### 📁 app/api/uretim/hazir-video-mutabakat/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/api/uretim/hazir-video-mutabakat` uç noktasında POST isteklerini işler; üretim için üretim hazır video mutabakat sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/bildirimler/api/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/bildirimler/api` uç noktasında GET, PUT isteklerini işler; bildirim için bildirimler sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/davet-bekliyor/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / Sayfa | `davet-bekliyor` kapsamındaki sayfa girişini veya yönlendirmesini tanımlar. |

### 📁 app/login/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `login.module.css` | Stil / CSS | login.module yüzeyinin yerleşim, tema ve responsive stillerini tanımlar. |
| `page.tsx` | UI / React | Ortak giriş sayfasını sunar; Cogniti karşılama içeriği kök sayfada bulunur. |

### 📁 app/login/_components/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `GirisAltBilgileri.tsx` | UI / React | Giriş formunun altında kullanım koşulları, KVKK ve çerez metinlerini modal olarak açar; şirket bağlantısı ile iletişim adresini gösterir. |
| `yasalMetinler.ts` | TypeScript / Lib | Login sayfasında gösterilen Platform Kullanım Koşulları, KVKK Aydınlatma Metni ve Çerez Aydınlatma Metni içeriklerinin kanonik veri kaynağıdır. |

### 📁 app/providers/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `AuthProvider.tsx` | UI / React | Supabase oturumunu ve v_auth_kimlik görünümündeki kullanıcı kimliği/rol bilgisini arayüze sağlayan ortak kimlik bağlamıdır. |
| `PushAbonelik.tsx` | UI / React | Oturum açan kullanıcı için tarayıcı bildirim desteğini ve izin tercihini yönetir; abonelik kaydını sunucu API'siyle eşleştirir. |
| `TemaProvider.tsx` | UI / React | Tema tercihini hesap ve oturumsuz tarayıcı kapsamlarında yönetir; kök data-tema niteliğini uygular. |

### 📁 app/renk-demo/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `RenkKarsilastirma.tsx` | UI / React | Renk Karsilastirma arayüz bileşenini veya sağlayıcısını tanımlar. |
| `page.tsx` | UI / Sayfa | `renk-demo` kapsamındaki sayfa girişini veya yönlendirmesini tanımlar. |
| `renk.module.css` | Stil / CSS | renk.module yüzeyinin yerleşim, tema ve responsive stillerini tanımlar. |

### 📁 app/sifre-olustur/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `layout.tsx` | UI / Yerleşim | app/sifre-olustur rotalarının ortak yerleşim veya sağlayıcı bağını tanımlar. |
| `page.tsx` | UI / Sayfa | `sifre-olustur` kapsamındaki sayfa girişini veya yönlendirmesini tanımlar. |

### 📁 app/sifre-olustur/api/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/sifre-olustur/api` yolunun POST sunucu işleyicilerini tanımlar. |

### 📁 app/sifre-yenile/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / React | Kullanıcıların güvenli e-posta bağlantısıyla şifrelerini sıfırladığı ve yeni şifre belirlediği arayüz. |

### 📁 app/takimlar/api/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/takimlar/api` uç noktasında GET isteklerini işler; Cogniti için takimlar sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/teknikler/api/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/teknikler/api` uç noktasında GET, POST isteklerini işler; Cogniti için teknikler sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/tema-secici-demo/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / Sayfa | `tema-secici-demo` kapsamındaki sayfa girişini veya yönlendirmesini tanımlar. |

### 📁 app/tema/api/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/tema/api` yolunun GET/PUT sunucu işleyicilerini tanımlar. |

### 📁 app/urunler/api/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/urunler/api` uç noktasında GET, POST isteklerini işler; Cogniti için ürünler sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

## 3. APP PANEL MODÜLLERİ (B2B SAHA & YÖNETİM)

### 📁 app/(panel)/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `layout.tsx` | UI / React | HapBilgi alt rotalarının ortak yerleşimini, sağlayıcılarını ve gezinme kabuğunu kuran Next.js layout bileşenidir. |

### 📁 app/(panel)/ana-sayfa/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / React | İÜ, UTT/KD_UTT, BM, TM ve yönetici ana sayfalarını next/dynamic ile yükler; üretici rollerini ortak başlangıç kaynağı üzerinden Yayın Yönetimi’ne yönlendirir. |

### 📁 app/(panel)/ana-sayfa/api/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/ana-sayfa/api` uç noktasında GET isteklerini işler; Cogniti için ana sayfa sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/c-club-ligi/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `loading.tsx` | UI / Yükleme | app/(panel)/c-club-ligi rotasının yükleme görünümünü sağlar. |
| `page.tsx` | UI / Sayfa | `(panel)/c-club-ligi` kapsamındaki sayfa girişini veya yönlendirmesini tanımlar. |

### 📁 app/(panel)/c-club-ligi/api/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/c-club-ligi/api` yolunun GET sunucu işleyicilerini tanımlar. |

### 📁 app/(panel)/challenge-club/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / React | Bölge Müdürleri arasındaki meydan okuma yarışmasının, gelen ve giden davetlerin `MobilYayinAkisi` (2+5 dikey liste) ve `YayinKarti` ile yönetildiği ana C-Club sayfası. |

### 📁 app/(panel)/challenge-club/api/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/challenge-club/api` uç noktasında GET, POST isteklerini işler; C-Club için challenge club sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/challenge-club/api/uygun-aliciler/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/challenge-club/api/uygun-aliciler` uç noktasında GET isteklerini işler; C-Club için challenge club uygun aliciler sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/challenge-club/izle/[yayin_id]/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / React | `/challenge-club/izle/[yayin_id]` rotasında C-Club kapsamındaki [yayin id] arayüzünü sunan Next.js sayfa bileşenidir. |

### 📁 app/(panel)/challenge-club/izle/api/baslat/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/challenge-club/izle/api/baslat` uç noktasında POST isteklerini işler; C-Club için izleme başlatma sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/challenge-club/izle/api/bitir/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/challenge-club/izle/api/bitir` uç noktasında PUT isteklerini işler; C-Club için izleme tamamlama sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/challenge-club/izle/api/cevap/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/challenge-club/izle/api/cevap` uç noktasında POST isteklerini işler; C-Club için izleme cevap sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/challenge-club/izle/api/ileri-sarma/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/challenge-club/izle/api/ileri-sarma` uç noktasında POST isteklerini işler; C-Club için izleme ileri sarma sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/challenge-club/izle/api/sorular/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/challenge-club/izle/api/sorular` uç noktasında GET isteklerini işler; C-Club için izleme sorular sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/e-club-ligi/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `eclub-league.module.css` | Stil / CSS | eclub league.module yüzeyinin yerleşim, tema ve responsive stillerini tanımlar. |
| `page.tsx` | UI / Sayfa | `(panel)/e-club-ligi` kapsamındaki sayfa girişini veya yönlendirmesini tanımlar. |

### 📁 app/(panel)/e-club-ligi/api/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/e-club-ligi/api` yolunun GET sunucu işleyicilerini tanımlar. |

### 📁 app/(panel)/e-club-ligi/api/takim-adi/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/e-club-ligi/api/takim-adi` yolunun GET/PUT sunucu işleyicilerini tanımlar. |

### 📁 app/(panel)/eclub/ana-sayfa/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `loading.tsx` | UI / Yükleme | app/(panel)/eclub/ana-sayfa rotasının yükleme görünümünü sağlar. |
| `page.tsx` | UI / Sayfa | `(panel)/eclub/ana-sayfa` kapsamındaki sayfa girişini veya yönlendirmesini tanımlar. |

### 📁 app/(panel)/eclub/ana-sayfa/firma/[firma_id]/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / Sayfa | `(panel)/eclub/ana-sayfa/firma/[firma_id]` kapsamındaki sayfa girişini veya yönlendirmesini tanımlar. |

### 📁 app/(panel)/eclub/api/bannerlar/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eclub/api/bannerlar` yolunun GET sunucu işleyicilerini tanımlar. |

### 📁 app/(panel)/eclub/api/cek-talepleri/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eclub/api/cek-talepleri` yolunun GET/POST/PATCH sunucu işleyicilerini tanımlar. |

### 📁 app/(panel)/eclub/api/performans/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eclub/api/performans` yolunun GET sunucu işleyicilerini tanımlar. |

### 📁 app/(panel)/eclub/cek-taleplerim/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / Sayfa | `(panel)/eclub/cek-taleplerim` kapsamındaki sayfa girişini veya yönlendirmesini tanımlar. |

### 📁 app/(panel)/eclub/depolar/api/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eclub/depolar/api` yolunun GET/PUT sunucu işleyicilerini tanımlar. |

### 📁 app/(panel)/eclub/eczaneler-takimim/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / Sayfa | `(panel)/eclub/eczaneler-takimim` kapsamındaki sayfa girişini veya yönlendirmesini tanımlar. |

### 📁 app/(panel)/eclub/eczaneler-takimim/_components/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `BmEclubTakimim.tsx` | UI / React | Bm Eclub Takimim arayüz bileşenini veya sağlayıcısını tanımlar. |

### 📁 app/(panel)/eclub/eczaneler-takimim/api/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eclub/eczaneler-takimim/api` yolunun GET sunucu işleyicilerini tanımlar. |

### 📁 app/(panel)/eclub/firma/[firma_id]/cek-talepleri/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / Sayfa | `(panel)/eclub/firma/[firma_id]/cek-talepleri` kapsamındaki sayfa girişini veya yönlendirmesini tanımlar. |

### 📁 app/(panel)/eclub/firma/[firma_id]/hediye-ceki-takibi/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `loading.tsx` | UI / Yükleme | app/(panel)/eclub/firma/[firma_id]/hediye-ceki-takibi rotasının yükleme görünümünü sağlar. |
| `page.tsx` | UI / Sayfa | `(panel)/eclub/firma/[firma_id]/hediye-ceki-takibi` kapsamındaki sayfa girişini veya yönlendirmesini tanımlar. |

### 📁 app/(panel)/eclub/firma/[firma_id]/hediye-ceki-talebi/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `loading.tsx` | UI / Yükleme | app/(panel)/eclub/firma/[firma_id]/hediye-ceki-talebi rotasının yükleme görünümünü sağlar. |
| `page.tsx` | UI / Sayfa | `(panel)/eclub/firma/[firma_id]/hediye-ceki-talebi` kapsamındaki sayfa girişini veya yönlendirmesini tanımlar. |

### 📁 app/(panel)/eclub/firma/[firma_id]/hediye-cekleri/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / Sayfa | `(panel)/eclub/firma/[firma_id]/hediye-cekleri` kapsamındaki sayfa girişini veya yönlendirmesini tanımlar. |

### 📁 app/(panel)/eclub/firma/[firma_id]/performans/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / Sayfa | `(panel)/eclub/firma/[firma_id]/performans` kapsamındaki sayfa girişini veya yönlendirmesini tanımlar. |

### 📁 app/(panel)/eclub/firma/[firma_id]/yayin-tamamlama-performansi/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `loading.tsx` | UI / Yükleme | app/(panel)/eclub/firma/[firma_id]/yayin-tamamlama-performansi rotasının yükleme görünümünü sağlar. |
| `page.tsx` | UI / Sayfa | `(panel)/eclub/firma/[firma_id]/yayin-tamamlama-performansi` kapsamındaki sayfa girişini veya yönlendirmesini tanımlar. |

### 📁 app/(panel)/eclub/firma/[firma_id]/yayinlar/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `loading.tsx` | UI / Yükleme | app/(panel)/eclub/firma/[firma_id]/yayinlar rotasının yükleme görünümünü sağlar. |
| `page.tsx` | UI / Sayfa | `(panel)/eclub/firma/[firma_id]/yayinlar` kapsamındaki sayfa girişini veya yönlendirmesini tanımlar. |

### 📁 app/(panel)/eclub/firmalar/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `loading.tsx` | UI / Yükleme | app/(panel)/eclub/firmalar rotasının yükleme görünümünü sağlar. |
| `page.tsx` | UI / Sayfa | `(panel)/eclub/firmalar` kapsamındaki sayfa girişini veya yönlendirmesini tanımlar. |

### 📁 app/(panel)/eclub/firmalar/api/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eclub/firmalar/api` yolunun GET sunucu işleyicilerini tanımlar. |

### 📁 app/(panel)/eclub/hediye-takip/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / Sayfa | `(panel)/eclub/hediye-takip` kapsamındaki sayfa girişini veya yönlendirmesini tanımlar. |

### 📁 app/(panel)/eclub/hediye-takip/_components/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `BmHediyeTakipIstemcisi.tsx` | UI / React | Bm Hediye Takip Istemcisi arayüz bileşenini veya sağlayıcısını tanımlar. |
| `CekTakipFiltreleri.tsx` | UI / React | Cek Takip Filtreleri arayüz bileşenini veya sağlayıcısını tanımlar. |
| `CekTakipKarti.tsx` | UI / React | Cek Takip Karti arayüz bileşenini veya sağlayıcısını tanımlar. |
| `CekTakipListesi.tsx` | UI / React | Cek Takip Listesi arayüz bileşenini veya sağlayıcısını tanımlar. |
| `HediyeTakipIstemcisi.tsx` | UI / React | Hediye Takip Istemcisi arayüz bileşenini veya sağlayıcısını tanımlar. |
| `HediyeTakipToggle.tsx` | UI / React | Hediye Takip Toggle arayüz bileşenini veya sağlayıcısını tanımlar. |
| `SiparisTakipFiltreleri.tsx` | UI / React | Siparis Takip Filtreleri arayüz bileşenini veya sağlayıcısını tanımlar. |
| `SiparisTakipIstemcisi.tsx` | UI / React | Siparis Takip Istemcisi arayüz bileşenini veya sağlayıcısını tanımlar. |
| `SiparisTakipListesi.tsx` | UI / React | Siparis Takip Listesi arayüz bileşenini veya sağlayıcısını tanımlar. |
| `TakipStatKartlari.tsx` | UI / React | Takip Stat Kartlari arayüz bileşenini veya sağlayıcısını tanımlar. |

### 📁 app/(panel)/eclub/hediye-takip/api/bm/cek-takip/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eclub/hediye-takip/api/bm/cek-takip` yolunun GET sunucu işleyicilerini tanımlar. |

### 📁 app/(panel)/eclub/hediye-takip/api/bm/cek-takip/[talepId]/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eclub/hediye-takip/api/bm/cek-takip/[talepId]` yolunun POST sunucu işleyicilerini tanımlar. |

### 📁 app/(panel)/eclub/hediye-takip/api/bm/siparis-takip/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eclub/hediye-takip/api/bm/siparis-takip` yolunun GET sunucu işleyicilerini tanımlar. |

### 📁 app/(panel)/eclub/hediye-takip/api/bm/siparis-takip/[talepId]/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eclub/hediye-takip/api/bm/siparis-takip/[talepId]` yolunun POST sunucu işleyicilerini tanımlar. |

### 📁 app/(panel)/eclub/hediye-takip/api/cek-takip/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eclub/hediye-takip/api/cek-takip` yolunun GET sunucu işleyicilerini tanımlar. |

### 📁 app/(panel)/eclub/hediye-takip/api/cek-takip/[talepId]/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eclub/hediye-takip/api/cek-takip/[talepId]` yolunun POST sunucu işleyicilerini tanımlar. |

### 📁 app/(panel)/eclub/hediye-takip/api/siparis-takip/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eclub/hediye-takip/api/siparis-takip` yolunun GET sunucu işleyicilerini tanımlar. |

### 📁 app/(panel)/eclub/hediye-takip/api/siparis-takip/[talepId]/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eclub/hediye-takip/api/siparis-takip/[talepId]` yolunun POST sunucu işleyicilerini tanımlar. |

### 📁 app/(panel)/eclub/hediye-takip/api/tm/cek-takip/[talepId]/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eclub/hediye-takip/api/tm/cek-takip/[talepId]` yolunun POST sunucu işleyicilerini tanımlar. |

### 📁 app/(panel)/eclub/listem/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `_types.ts` | TypeScript / Lib | E-Club alanında kullanılan `Eczane`, `Kisi`, `EclubGecisTalebi`, `GlnKisi` veri tiplerini ve modüller arası sözleşmeleri tanımlar. |
| `page.tsx` | UI / React | `/eclub/listem` rotasında E-Club kapsamındaki listem arayüzünü sunan Next.js sayfa bileşenidir. |

### 📁 app/(panel)/eclub/listem/_components/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `EczaneBlogu.module.css` | Stil / CSS | Eczane Blogu.module yüzeyinin yerleşim, tema ve responsive stillerini tanımlar. |
| `EczaneBlogu.tsx` | UI / React | eczane Blogu, E-Club ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |

### 📁 app/(panel)/eclub/listem/_hooks/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `useEclubListem.ts` | TypeScript / Lib | use E-Club listem hook'u, E-Club ekranlarının veri yükleme, durum ve kullanıcı eylemlerini ortaklaştırır. |

### 📁 app/(panel)/eclub/listem/api/davet/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eclub/listem/api/davet` yolunun POST sunucu işleyicilerini tanımlar. |

### 📁 app/(panel)/eclub/listem/api/eczaneler/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eclub/listem/api/eczaneler` uç noktasında GET, POST, PUT isteklerini işler; E-Club için listem eczaneler sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/eclub/listem/api/kisiler/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eclub/listem/api/kisiler` uç noktasında GET, POST, PUT isteklerini işler; E-Club için listem kişiler sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/eclub/oneriler/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `_types.ts` | TypeScript / Lib | E-Club alanında kullanılan `EclubHedefRol`, `OneriYayin`, `OneriKisi`, `OneriLimitler` veri tiplerini ve modüller arası sözleşmeleri tanımlar. |
| `page.tsx` | UI / React | `/eclub/oneriler` rotasında E-Club kapsamındaki öneriler arayüzünü sunan Next.js sayfa bileşenidir. |

### 📁 app/(panel)/eclub/oneriler/_hooks/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `useEclubOneriler.ts` | TypeScript / Lib | use E-Club öneriler hook'u, E-Club ekranlarının veri yükleme, durum ve kullanıcı eylemlerini ortaklaştırır. |

### 📁 app/(panel)/eclub/oneriler/api/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eclub/oneriler/api` uç noktasında GET, POST isteklerini işler; E-Club için E-Club öneriler sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/eclub/oneriler/api/inceleme/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eclub/oneriler/api/inceleme` yolunun POST sunucu işleyicilerini tanımlar. |

### 📁 app/(panel)/eclub/oneriler/api/yayinlar/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eclub/oneriler/api/yayinlar` uç noktasında GET isteklerini işler; E-Club için öneriler yayınlar sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/eclub/panel/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | Yönlendirme | Eski `/eclub/panel` adresini sorgu parametrelerini koruyarak `/eclub/ana-sayfa` adresine yönlendirir. |

### 📁 app/(panel)/eclub/panel/_components/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `EclubFirmaVideoKatalogu.tsx` | UI / React | E-Club firma video kataloğunu mobilde `MobilYayinAkisi` (2+5 dikey liste), tablet ve masaüstünde yatay, kaydırılabilir snap rafı ve `YayinKarti` (HOYK) rozetleriyle sunan bileşendir. |
| `EclubVideoOynatici.tsx` | UI / React | E-Club video Oynatici, ilgili öğrenme aracını gösteren ve E-Club ilerleme/tamamlama akışına bağlayan oynatıcı bileşenidir. |

### 📁 app/(panel)/eclub/panel/_hooks/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `useEclubPanel.ts` | TypeScript / Lib | use E-Club panel hook'u, E-Club ekranlarının veri yükleme, durum ve kullanıcı eylemlerini ortaklaştırır. |

### 📁 app/(panel)/eclub/panel/api/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eclub/panel/api` uç noktasında GET isteklerini işler; E-Club için E-Club panel sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/eclub/panel/api/baslat/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eclub/panel/api/baslat` uç noktasında POST isteklerini işler; E-Club için panel başlatma sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/eclub/panel/api/bitir/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eclub/panel/api/bitir` uç noktasında PUT isteklerini işler; E-Club için panel tamamlama sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/eclub/panel/api/cevapla/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eclub/panel/api/cevapla` uç noktasında POST isteklerini işler; E-Club için panel cevaplama sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/eclub/panel/api/ileri-sarma/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eclub/panel/api/ileri-sarma` uç noktasında POST isteklerini işler; E-Club için panel ileri sarma sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/eclub/panel/api/sorular/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eclub/panel/api/sorular` uç noktasında GET isteklerini işler; E-Club için panel sorular sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/eclub/panel/firma/[firma_id]/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / React | `/eclub/panel/firma/[firma_id]` rotasında E-Club kapsamındaki [firma id] arayüzünü sunan Next.js sayfa bileşenidir. |

### 📁 app/(panel)/eclub/store/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / React | Eczanenin Çekli Puan bakiyesini ve uygun Migros hediye çeki hakkını gösterir; talep oluşturma eylemini yalnız aktif ana eczacıya açar. |

### 📁 app/(panel)/eclub/store/_hooks/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `useEclubStore.ts` | TypeScript / Lib | Hediye çeki ekranının özet ve talep verisini yükler; talep uygunluğu ve yenileme durumunu yönetir. |

### 📁 app/(panel)/eclub/store/api/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eclub/store/api` uç noktasında GET isteklerini işler; E-Club Store için E-Club Store sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/eclub/yayinlar/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / React | `/eclub/yayinlar` rotasında E-Club kapsamındaki öğrenme yayınları arayüzünü sunan Next.js sayfa bileşenidir. |

### 📁 app/(panel)/eclub/yayinlar/_components/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `BmEclubYayinlari.tsx` | UI / React | Bm Eclub Yayinlari arayüz bileşenini veya sağlayıcısını tanımlar. |
| `EclubGonderimDetayKarti.tsx` | UI / React | Yayının izleyen, bekleyen ve izlemeyen alıcılarını kişi bazında gösteren açılır gönderim detay yüzüdür. |
| `EclubGonderimPaneli.tsx` | UI / React | Eclub Gonderim Paneli arayüz bileşenini veya sağlayıcısını tanımlar. |
| `EclubPlanlananlar.tsx` | UI / React | Eclub Planlananlar arayüz bileşenini veya sağlayıcısını tanımlar. |
| `EclubYayinGonderimKarti.tsx` | UI / React | E-Club yayınını gönderim durumu, puanı ve koşullarıyla gösterir; gönderilen yayınlarda detay kartını bağlar. |

### 📁 app/(panel)/eclub/yayinlar/api/bm/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eclub/yayinlar/api/bm` yolunun GET sunucu işleyicilerini tanımlar. |

### 📁 app/(panel)/eczanem/_components/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `MutabakatExcelButonu.tsx` | UI / React | Mutabakat Excel Butonu arayüz bileşenini veya sağlayıcısını tanımlar. |
| `MutabakatIslemTablosu.module.css` | Stil / CSS | Mutabakat Islem Tablosu.module yüzeyinin yerleşim, tema ve responsive stillerini tanımlar. |
| `MutabakatIslemTablosu.tsx` | UI / React | Mutabakat Islem Tablosu arayüz bileşenini veya sağlayıcısını tanımlar. |

### 📁 app/(panel)/eczanem/bm/mutabakat-takip/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / Sayfa | `(panel)/eczanem/bm/mutabakat-takip` kapsamındaki sayfa girişini veya yönlendirmesini tanımlar. |

### 📁 app/(panel)/eczanem/bm/mutabakat-takip/_components/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `BmMutabakatTakipClient.tsx` | UI / React | Bm Mutabakat Takip Client arayüz bileşenini veya sağlayıcısını tanımlar. |

### 📁 app/(panel)/eczanem/eczane/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / React | Eczane personelinin Eczanem OTC müşteri programını, video dağıtımlarını ve kasa indirim kuyruğunu yönettiği ana panel. |

### 📁 app/(panel)/eczanem/eczane/_components/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `EczanemEczaneArayuz.tsx` | UI / React | Eczanem eczane Arayuz, Eczanem ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `EczanemSiparisKuyrugu.tsx` | UI / React | Eczanem sipariş Kuyrugu, Eczanem ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |

### 📁 app/(panel)/eczanem/eczane/api/bannerlar/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eczanem/eczane/api/bannerlar` yolunun GET sunucu işleyicilerini tanımlar. |

### 📁 app/(panel)/eczanem/eczane/api/gonderim/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eczanem/eczane/api/gonderim` uç noktasında GET, POST isteklerini işler; Eczanem için eczane gönderim sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/eczanem/eczane/api/musteri-ekle/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eczanem/eczane/api/musteri-ekle` uç noktasında POST isteklerini işler; Eczanem için eczane üye ekle sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/eczanem/eczane/api/musteriler/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eczanem/eczane/api/musteriler` uç noktasında GET, PUT, DELETE isteklerini işler; Eczanem için eczane üyeler sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/eczanem/eczane/api/rozet/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eczanem/eczane/api/rozet` uç noktasında GET isteklerini işler; Eczanem için eczane rozet sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/eczanem/eczane/api/siparisler/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eczanem/eczane/api/siparisler` uç noktasında GET, POST isteklerini işler; Eczanem için eczane siparişler sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/eczanem/eczane/dagitim/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / Sayfa | `(panel)/eczanem/eczane/dagitim` kapsamındaki sayfa girişini veya yönlendirmesini tanımlar. |

### 📁 app/(panel)/eczanem/eczane/danisan-yayinlari/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / Sayfa | `(panel)/eczanem/eczane/danisan-yayinlari` kapsamındaki sayfa girişini veya yönlendirmesini tanımlar. |

### 📁 app/(panel)/eczanem/eczane/danisanlarim/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / Sayfa | `(panel)/eczanem/eczane/danisanlarim` kapsamındaki sayfa girişini veya yönlendirmesini tanımlar. |

### 📁 app/(panel)/eczanem/eczane/indirim-onayi/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / Sayfa | `(panel)/eczanem/eczane/indirim-onayi` kapsamındaki sayfa girişini veya yönlendirmesini tanımlar. |

### 📁 app/(panel)/eczanem/eczane/musterilerim/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / Sayfa | `(panel)/eczanem/eczane/musterilerim` kapsamındaki sayfa girişini veya yönlendirmesini tanımlar. |

### 📁 app/(panel)/eczanem/eczane/siparisler/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / Sayfa | `(panel)/eczanem/eczane/siparisler` kapsamındaki sayfa girişini veya yönlendirmesini tanımlar. |

### 📁 app/(panel)/eczanem/eczane/uye-yayinlari/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `_types.ts` | TypeScript / Lib |  types kapsamındaki yardımcı, tip veya çalıştırma kaynağıdır. |
| `page.tsx` | UI / React | `/eczanem/eczane/uye-yayinlari` rotasında üyelere yayın gönderim arayüzünü sunan Next.js sayfa bileşenidir. |

### 📁 app/(panel)/eczanem/eczane/uye-yayinlari/_components/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `EczaneDanisanGonderimPaneli.tsx` | UI / React | Eczane Danisan Gonderim Paneli arayüz bileşenini veya sağlayıcısını tanımlar. |
| `EczaneDanisanYayinKarti.tsx` | UI / React | Eczane Danisan Yayin Karti arayüz bileşenini veya sağlayıcısını tanımlar. |

### 📁 app/(panel)/eczanem/eczane/uyeler/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / React | Eczaneye bağlı kayıtlı müşterilerin listelendiği, yeni müşteri eklendiği veya SMS daveti gönderildiği müşteri sayfası. |

### 📁 app/(panel)/eczanem/tm/mutabakat-takip/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / Sayfa | `(panel)/eczanem/tm/mutabakat-takip` kapsamındaki sayfa girişini veya yönlendirmesini tanımlar. |

### 📁 app/(panel)/eczanem/utt/mutabakat/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / Sayfa | `(panel)/eczanem/utt/mutabakat` kapsamındaki sayfa girişini veya yönlendirmesini tanımlar. |

### 📁 app/(panel)/eczanem/yayinlar/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `_types.ts` | TypeScript / Lib | Eczanem alanında kullanılan `UttEczanemYayin`, `UttEczanemEczane`, `UttEczanemGonderim`, `UttEczanemVeri` veri tiplerini ve modüller arası sözleşmeleri tanımlar. |
| `page.tsx` | UI / React | `/eczanem/yayinlar` rotasında UTT'nin portföyündeki uygun eczanelere Eczanem öğrenme içeriklerini dağıttığı temsilci operasyon sayfası. |

### 📁 app/(panel)/eczanem/yayinlar/_components/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `EczanemGonderimPaneli.tsx` | UI / React | Eczanem Gonderim Paneli arayüz bileşenini veya sağlayıcısını tanımlar. |
| `EczanemYayinGonderimKarti.tsx` | UI / React | Eczanem yayın kartında eczane bazlı gönderim durumunu ve önizleme ile seçim eylemlerini gösterir. |

### 📁 app/(panel)/egitim-yayinlari/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `layout.tsx` | UI / Yerleşim | app/(panel)/egitim-yayinlari rotalarının ortak yerleşim veya sağlayıcı bağını tanımlar. |

### 📁 app/(panel)/egitim-yayinlari/[kategori]/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / Sayfa | `(panel)/egitim-yayinlari/[kategori]` kapsamındaki sayfa girişini veya yönlendirmesini tanımlar. |

### 📁 app/(panel)/iletisim/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / React | `/iletisim` rotasında Cogniti kapsamındaki iletişim arayüzünü sunan Next.js sayfa bileşenidir. |

### 📁 app/(panel)/kullanicilar/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / React | `/kullanicilar` rotasında Cogniti kapsamındaki kullanıcılar arayüzünü sunan Next.js sayfa bileşenidir. |

### 📁 app/(panel)/kullanicilar/api/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/kullanicilar/api` uç noktasında GET isteklerini işler; Cogniti için kullanıcılar sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/kullanicilar/api/[kullanici_id]/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/kullanicilar/api/[kullanici_id]` uç noktasında GET, PUT, DELETE isteklerini işler; Cogniti için kullanıcılar sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/ogrenme-araclari/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / Sayfa | `(panel)/ogrenme-araclari` kapsamındaki sayfa girişini veya yönlendirmesini tanımlar. |

### 📁 app/(panel)/ogrenme-araclari/[senaryo_durum_id]/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / Sayfa | `(panel)/ogrenme-araclari/[senaryo_durum_id]` kapsamındaki sayfa girişini veya yönlendirmesini tanımlar. |

### 📁 app/(panel)/ogrenme-araclari/api/bunny-durum/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/ogrenme-araclari/api/bunny-durum` yolunun GET sunucu işleyicilerini tanımlar. |

### 📁 app/(panel)/ogrenme-araclari/api/bunny-yukleme-baslat/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/ogrenme-araclari/api/bunny-yukleme-baslat` yolunun POST sunucu işleyicilerini tanımlar. |

### 📁 app/(panel)/onaylanan-talepler/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / React | `/onaylanan-talepler` rotasında Cogniti kapsamındaki onaylanan talepler arayüzünü sunan Next.js sayfa bileşenidir. |

### 📁 app/(panel)/onaylanan-talepler/api/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/onaylanan-talepler/api` yolunun GET sunucu işleyicilerini tanımlar. |

### 📁 app/(panel)/oneriler/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / React | UTT için gelen aktif önerileri, BM için gönderdiği önerileri, TM için takım takip dökümünü alt sekmeler ve `IcerikFiltreBari` ile sunan öneri merkezi. |

### 📁 app/(panel)/oneriler/_components/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `BmOneriTakibi.tsx` | UI / React | BM öneri Takibi, Bölge Müdürünün gönderdiği önerileri ve durumlarını sunan React bileşenidir. |
| `TmOneriTakibi.tsx` | UI / React | TM öneri Takibi, Takım Müdürünün takımındaki öneri akışını izlediği React bileşenidir. |
| `UyeOnerilerGorunumu.tsx` | UI / React | UTT için aktif ve tamamlanan önerileri alt sekmeler, `IcerikFiltreBari`, `YayinKarti` ve `MobilYayinAkisi` ile listeleyen görünüm bileşenidir. |

### 📁 app/(panel)/oneriler/_hooks/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `useOneriler.ts` | TypeScript / Lib | Öneriler ekranının aktif/tamamlanan sekme durumunu, arama alanı ve metin filtreleri ile mobil akış sıfırlama durumunu yöneten kancadır. |

### 📁 app/(panel)/oneriler/api/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/oneriler/api` uç noktasında GET, POST isteklerini işler; Cogniti için öneriler sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/oneriler/api/[oneri_id]/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/oneriler/api/[oneri_id]` uç noktasında PUT isteklerini işler; Cogniti için öneriler sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/oneriler/api/kullanicilar/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/oneriler/api/kullanicilar` uç noktasında GET isteklerini işler; Cogniti için öneriler kullanıcılar sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/oneriler/api/yayinlar/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/oneriler/api/yayinlar` uç noktasında GET isteklerini işler; Cogniti için öneriler yayınlar sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/oneriler/tamamlanan/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / React | UTT için tamamlanan öneriler alt sekmesini `UyeOnerilerGorunumu` üzerinden sunan sayfa bileşenidir. |

### 📁 app/(panel)/profil/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / React | `/profil` rotasında Cogniti kapsamındaki profil arayüzünü sunan Next.js sayfa bileşenidir. |

### 📁 app/(panel)/profil/api/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/profil/api` uç noktasında GET, PUT isteklerini işler; Cogniti için profil sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/raporlar/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / React | `/raporlar` rotasında raporlama kapsamındaki raporlar arayüzünü sunan Next.js sayfa bileşenidir. |

### 📁 app/(panel)/raporlar/api/bm/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/raporlar/api/bm` uç noktasında GET isteklerini işler; raporlama için raporlar bm sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/raporlar/api/tclub-uretici/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/raporlar/api/tclub-uretici` uç noktasında GET isteklerini işler; raporlama için raporlar tclub üretici sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/raporlar/api/tm/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/raporlar/api/tm` uç noktasında GET isteklerini işler; raporlama için raporlar tm sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/raporlar/api/uretici/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/raporlar/api/uretici` uç noktasında GET isteklerini işler; üretim için raporlar üretici sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/raporlar/api/uretim/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/raporlar/api/uretim` uç noktasında GET isteklerini işler; üretim için raporlar üretim sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/raporlar/api/utt/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/raporlar/api/utt` uç noktasında GET isteklerini işler; raporlama için raporlar UTT sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/raporlar/api/yonetici/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/raporlar/api/yonetici` uç noktasında GET isteklerini işler; raporlama için raporlar yönetici sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/raporlar/api/yonetici/akordeon/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/raporlar/api/yonetici/akordeon` uç noktasında GET isteklerini işler; raporlama için yönetici akordeon sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/raporlar/bm/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `bm-report.module.css` | Stil / CSS | raporlama görünümünün yerleşim, renk, tipografi ve responsive davranışlarını tanımlayan stil dosyasıdır. |
| `page.tsx` | UI / React | Bölge Müdürünün bölgesine bağlı UTT'lerin eğitim ve öneri tamamlama performansını analiz ettiği bölge raporu. |

### 📁 app/(panel)/raporlar/tclub-uretici/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `loading.tsx` | UI / Yükleme | app/(panel)/raporlar/tclub-uretici rotasının yükleme görünümünü sağlar. |
| `page.tsx` | UI / React | `/raporlar/tclub-uretici` rotasında raporlama kapsamındaki tclub üretici arayüzünü sunan Next.js sayfa bileşenidir. |

### 📁 app/(panel)/raporlar/tm/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / React | Takım Müdürünün takımındaki bölgelerin ve BM'lerin genel başarı oranlarını karşılaştırdığı takım raporu. |

### 📁 app/(panel)/raporlar/uretici/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / React | Ürün ve Eğitim Müdürlerinin ürettikleri eğitimlerin izlenme oranlarını ve eğitim türü etkisini izlediği üretici raporu. |
| `uretici-report.module.css` | Stil / CSS | üretim görünümünün yerleşim, renk, tipografi ve responsive davranışlarını tanımlayan stil dosyasıdır. |

### 📁 app/(panel)/raporlar/utt/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / React | Tıbbi Tanıtım Temsilcisinin kişisel izlenme, soru başarısı ve puan kazanım grafiklerini sunan bireysel rapor sayfası. |
| `utt-report.module.css` | Stil / CSS | raporlama görünümünün yerleşim, renk, tipografi ve responsive davranışlarını tanımlayan stil dosyasıdır. |

### 📁 app/(panel)/raporlar/yayin-raporlari/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / React | Varyantlar, yayın konusu/saha etkisi ve öğrenme aracı performansını ortak rol ve zaman filtreleriyle sunar. |
| `yayin-raporlari.module.css` | Stil / CSS | yayin raporlari.module yüzeyinin yerleşim, tema ve responsive stillerini tanımlar. |

### 📁 app/(panel)/raporlar/yayin-raporlari/_hooks/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `uretimRaporuOnbellek.ts` | TypeScript / Lib | uretim Raporu Onbellek kapsamında `getUretimRaporuOnbellek`, `setUretimRaporuOnbellek`, `prefetchUretimRaporu` kaynaklarını sağlar. |
| `useUretimRaporu.ts` | TypeScript / Lib | use Uretim Raporu kapsamında `useUretimRaporu` kaynaklarını sağlar. |

### 📁 app/(panel)/raporlar/yonetici/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / React | Üst Yönetimin (GM, Direktörler) firma genelindeki tüm hiyerarşik başarı dökümlerini incelediği konsolide yönetici raporu. |
| `yonetici-report.module.css` | Stil / CSS | raporlama görünümünün yerleşim, renk, tipografi ve responsive davranışlarını tanımlayan stil dosyasıdır. |

### 📁 app/(panel)/raporlar/yonetici/_components/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `TakimBolgeUttAkordeon.tsx` | UI / React | takım bölge UTT Akordeon, raporlama ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |

### 📁 app/(panel)/senaryolar/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / React | İçerik Üreticisinden gelen senaryoların canlı görsel diff editörüyle incelendiği ve onaylandığı senaryo karar sayfası. |

### 📁 app/(panel)/senaryolar/[talep_id]/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / React | `/senaryolar/[talep_id]` rotasında Cogniti kapsamındaki [talep id] arayüzünü sunan Next.js sayfa bileşenidir. |

### 📁 app/(panel)/sizin-yayinlariniz/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / React | `/sizin-yayinlariniz` rotasında Cogniti kapsamındaki sizin yayinlariniz arayüzünü sunan Next.js sayfa bileşenidir. |

### 📁 app/(panel)/soru-setleri/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / React | `/soru-setleri` rotasında Cogniti kapsamındaki soru setleri arayüzünü sunan Next.js sayfa bileşenidir. |

### 📁 app/(panel)/soru-setleri/[video_durum_id]/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / React | `/soru-setleri/[video_durum_id]` rotasında Cogniti kapsamındaki [video durum id] arayüzünü sunan Next.js sayfa bileşenidir. |

### 📁 app/(panel)/sozlesmeler/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / React | `/sozlesmeler` rotasında Cogniti kapsamındaki sozlesmeler arayüzünü sunan Next.js sayfa bileşenidir. |

### 📁 app/(panel)/store/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / React | UTT ve BM'lerin kazandıkları puanlarla ürün seçip sepete eklediği HBStore ana vitrin sayfası. |

### 📁 app/(panel)/store/[urun_id]/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / React | HBStore ürününün puan bedelinin incelendiği ve teslimat adresi seçilerek sipariş verildiği ürün detay sayfası. |

### 📁 app/(panel)/store/adreslerim/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / React | Kullanıcının mağaza teslimat adreslerini eklediği, güncellediği veya sildiği adres yönetim sayfası. |

### 📁 app/(panel)/store/api/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/store/api` uç noktasında GET isteklerini işler; HBStore için Store sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/store/api/adres/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/store/api/adres` uç noktasında GET, POST, PATCH, DELETE isteklerini işler; HBStore için Store adres sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/store/api/siparis/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/store/api/siparis` uç noktasında GET, POST, PATCH isteklerini işler; HBStore için Store sipariş sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/store/ekip-magaza-siparisleri/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `_types.ts` | TypeScript / Lib |  types kapsamında `BOS_FILTRELER` kaynaklarını sağlar. |
| `page.tsx` | UI / Sayfa | `(panel)/store/ekip-magaza-siparisleri` kapsamındaki sayfa girişini veya yönlendirmesini tanımlar. |

### 📁 app/(panel)/store/ekip-magaza-siparisleri/_components/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `SiparisFiltreleri.tsx` | UI / React | Siparis Filtreleri arayüz bileşenini veya sağlayıcısını tanımlar. |
| `SiparisTablosu.tsx` | UI / React | Siparis Tablosu arayüz bileşenini veya sağlayıcısını tanımlar. |

### 📁 app/(panel)/store/ekip-magaza-siparisleri/_hooks/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `useHiyerarsi.ts` | TypeScript / Lib | use Hiyerarsi kapsamında `useHiyerarsi` kaynaklarını sağlar. |
| `useSiparisListe.ts` | TypeScript / Lib | use Siparis Liste kapsamında `useSiparisListe` kaynaklarını sağlar. |

### 📁 app/(panel)/store/ekip-magaza-siparisleri/api/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/store/ekip-magaza-siparisleri/api` yolunun GET sunucu işleyicilerini tanımlar. |

### 📁 app/(panel)/store/ekip-magaza-siparisleri/api/hiyerarsi/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/store/ekip-magaza-siparisleri/api/hiyerarsi` yolunun GET sunucu işleyicilerini tanımlar. |

### 📁 app/(panel)/store/siparislerim/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / React | Kullanıcının geçmiş mağaza siparişlerini, kargo durumlarını takip ettiği ve sipariş iptali yapabildiği geçmiş sayfası. |

### 📁 app/(panel)/t-club-ligi/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `loading.tsx` | UI / Yükleme | app/(panel)/t-club-ligi rotasının yükleme görünümünü sağlar. |
| `page.tsx` | UI / React | `/t-club-ligi` rotasında T-Club kapsamındaki lig arayüzünü sunan Next.js sayfa bileşenidir. |

### 📁 app/(panel)/t-club-ligi/api/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/t-club-ligi/api` uç noktasında GET isteklerini işler; T-Club ligi sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/talepler/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `_types.ts` | TypeScript / Lib | HapBilgi alanında kullanılan `Talep`, `Urun`, `Teknik`, `Takim` veri tiplerini ve modüller arası sözleşmeleri tanımlar. |
| `_ureticiRolTypes.ts` | TypeScript / Lib | HapBilgi alanında kullanılan `TalepSatiri`, `RevizyonNotu`, `SenaryoBlogu`, `VideoBlogu` veri tiplerini ve modüller arası sözleşmeleri tanımlar. |
| `page.tsx` | UI / React | Ürün Müdürleri ve üretici rollerin yeni eğitim talebi oluşturduğu ve geçmiş talepleri listelediği talep yönetim arayüzü. |

### 📁 app/(panel)/talepler/[talep_id]/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / React | `/talepler/[talep_id]` rotasında Cogniti kapsamındaki [talep id] arayüzünü sunan Next.js sayfa bileşenidir. |

### 📁 app/(panel)/talepler/_components/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `AdimIcerigi.tsx` | UI / React | Adim Icerigi, Cogniti ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `AksiyonSeridi.tsx` | UI / React | Aksiyon Seridi, Cogniti ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `EkDosyaYukleme.tsx` | UI / React | Ek Dosya yükleme, Cogniti ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `FlipPdfTalepAlanlari.tsx` | UI / React | Flip Pdf talep alanları, HapBilgi işleminde gerekli flip pdf talep alanları girdilerini toplar ve kullanıcı doğrulamalarını görünür kılar. |
| `GorselTalepAlanlari.tsx` | UI / React | Dijital Broşür talep alanları, HapBilgi işleminde gerekli dijital broşür talep alanları girdilerini toplar ve kullanıcı doğrulamalarını görünür kılar. |
| `HazirSoruSetiBlogu.tsx` | UI / React | hazır soru Seti Blogu, Cogniti ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `HazirVideoYukleme.tsx` | UI / React | hazır video yükleme, Cogniti ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `IptalAkordiyonu.tsx` | UI / React | Iptal Akordiyonu, Cogniti kapsamındaki ıptal içeriğini açılır-kapanır bölümde gösterir. |
| `IsListesi.tsx` | UI / React | Is Listesi, HapBilgi kayıtlarını listeleyip yükleme, seçim veya filtreleme etkileşimlerini yönetir. |
| `PodcastTalepAlanlari.tsx` | UI / React | Podcast talep alanları, HapBilgi işleminde gerekli podcast talep alanları girdilerini toplar ve kullanıcı doğrulamalarını görünür kılar. |
| `PodcastTranskriptEditoru.tsx` | UI / React | Podcast Transkript Editoru arayüz bileşenini veya sağlayıcısını tanımlar. |
| `SoruSetiAyarlari.tsx` | UI / React | soru Seti Ayarlari, Cogniti ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `TalepDetayi.tsx` | UI / React | talep Detayi, Cogniti ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `TalepOnayModal.tsx` | UI / React | talep onay Modal, Cogniti kapsamındaki talep onay işlemini açılır pencerede yöneten React bileşenidir. |
| `UreticiRolGorunum.tsx` | UI / React | üretici rol Gorunum, Cogniti ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `UretimSeridi.tsx` | UI / React | üretim Seridi, Cogniti ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `UrunTeknikSecici.tsx` | UI / React | ürün teknik Secici, Cogniti ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `VideoYukleme.tsx` | UI / React | video yükleme, Cogniti ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `YeniTalepAkordiyonu.tsx` | UI / React | Yeni talep Akordiyonu, Cogniti kapsamındaki yeni talep içeriğini açılır-kapanır bölümde gösterir. |
| `YeniTalepFormV2.tsx` | UI / React | Yeni talep Form V2, Cogniti ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |

### 📁 app/(panel)/talepler/_hooks/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `talepOnbellek.ts` | TypeScript / Lib | talep Onbellek kapsamında `hesaplaTalepOzeti`, `getTalepOnbellek`, `setTalepOnbellek`, `prefetchTalepMerkezi` kaynaklarını sağlar. |
| `useTalepFormu.ts` | TypeScript / Lib | Talep formundaki girdi validasyonlarını, hedef rol kurallarını ve dosya yükleme işlemlerini yöneten React hook'u. |
| `useTalepMerkezi.ts` | TypeScript / Lib | Üreticinin geçmiş talep listelerini filtreleyen, sayfalayan ve durum geçişlerini koordine eden React hook'u. |

### 📁 app/(panel)/talepler/api/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/talepler/api` uç noktasında POST isteklerini işler; Cogniti için talepler sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/talepler/api/bunny-yukleme-baslat/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/talepler/api/bunny-yukleme-baslat` uç noktasında POST isteklerini işler; Cogniti için talepler Bunny yükleme başlatma sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/talepler/api/detay/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/talepler/api/detay` uç noktasında GET isteklerini işler; Cogniti için talepler detay sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/talepler/api/dosyalar/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/talepler/api/dosyalar` uç noktasında GET, POST, DELETE isteklerini işler; Cogniti için talepler dosyalar sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/talepler/api/kunye/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/talepler/api/kunye` uç noktasında GET isteklerini işler; Cogniti için talepler künye sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/talepler/api/taslak/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/talepler/api/taslak` yolunun GET/POST/DELETE sunucu işleyicilerini tanımlar. |

### 📁 app/(panel)/talepler/api/uretici-rol/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/talepler/api/uretici-rol` uç noktasında GET isteklerini işler; Cogniti için talepler üretici rol sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/tum-yayinlar/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / React | `/tum-yayinlar` rotasında Cogniti kapsamındaki tum yayınlar arayüzünü sunan Next.js sayfa bileşenidir. |

### 📁 app/(panel)/uretim/api/gorevler/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/uretim/api/gorevler` uç noktasında GET isteklerini işler; üretim için üretim gorevler sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/uretim/api/hazir-video/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/uretim/api/hazir-video` uç noktasında PUT isteklerini işler; üretim için üretim hazır video sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/uretim/api/karar/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/uretim/api/karar` uç noktasında POST isteklerini işler; üretim için üretim karar sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/uretim/api/teslim/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/uretim/api/teslim` uç noktasında POST isteklerini işler; üretim için üretim teslim sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/uretim/gorevler/[gorev_id]/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / React | `/uretim/gorevler/[gorev_id]` rotasında üretim kapsamındaki [gorev id] arayüzünü sunan Next.js sayfa bileşenidir. |

### 📁 app/(panel)/yayin-katalogu/api/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/yayin-katalogu/api` yolunun GET sunucu işleyicilerini tanımlar. |

### 📁 app/(panel)/yayin-katalogu/api/[yayin_id]/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/yayin-katalogu/api/[yayin_id]` yolunun GET sunucu işleyicilerini tanımlar. |

### 📁 app/(panel)/yayin-takip/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / Sayfa | `(panel)/yayin-takip` kapsamındaki sayfa girişini veya yönlendirmesini tanımlar. |

### 📁 app/(panel)/yayin-yonetimi/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `_types.ts` | TypeScript / Lib | HapBilgi alanında kullanılan `Bekleyen`, `Yayin`, `AltSekme`, `BekleyenHedefSayilari` veri tiplerini ve modüller arası sözleşmeleri tanımlar. |
| `page.tsx` | UI / React | Onaylanan içeriklerin puanlarının belirlendiği, hedef kitleye açıldığı, yayına alındığı ve aktif yayınların mobilde `MobilYayinAkisi` (2+5 dikey liste) ile sunulduğu yayın operasyon merkezi. |

### 📁 app/(panel)/yayin-yonetimi/_components/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `BekleyenSatir.tsx` | UI / React | bekleyen Satir, Cogniti ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `Modallar.tsx` | UI / React | Modallar, Cogniti ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `SoruListesi.tsx` | UI / React | soru Listesi, HapBilgi kayıtlarını listeleyip yükleme, seçim veya filtreleme etkileşimlerini yönetir. |
| `Yardimcilar.tsx` | UI / React | Yardimcilar, Cogniti ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `YayinKumandaPaneli.tsx` | UI / React | yayın Kumanda Paneli, Cogniti kapsamındaki yayın kumanda verilerini ve işlemlerini tek panelde birleştirir. |
| `YayinSatir.tsx` | UI / React | yayın Satir, Cogniti ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |

### 📁 app/(panel)/yayin-yonetimi/_hooks/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `ozetOnbellek.ts` | TypeScript / Lib | ozet Onbellek kapsamında `getOzetOnbellek`, `setOzetOnbellek`, `prefetchYayinOzet` kaynaklarını sağlar. |
| `useYayinYonetimi.ts` | TypeScript / Lib | Yayın havuzundaki aday içerikleri, puan formunu ve yayına alma/durdurma süreçlerini yöneten React hook'u. |

### 📁 app/(panel)/yayin-yonetimi/api/bekleyenler/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/yayin-yonetimi/api/bekleyenler` uç noktasında GET isteklerini işler; Cogniti için yayın yonetimi bekleyenler sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/yayin-yonetimi/api/bekleyenler/sil/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/yayin-yonetimi/api/bekleyenler/sil` uç noktasında DELETE isteklerini işler; Cogniti için bekleyenler silme sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/yayin-yonetimi/api/ozet/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/yayin-yonetimi/api/ozet` yolunun GET sunucu işleyicilerini tanımlar. |

### 📁 app/(panel)/yayin-yonetimi/api/puan/sorular/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/yayin-yonetimi/api/puan/sorular` uç noktasında POST isteklerini işler; Cogniti için puan sorular sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/yayin-yonetimi/api/puan/video/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/yayin-yonetimi/api/puan/video` uç noktasında POST isteklerini işler; video altyapısı için puan video sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/yayin-yonetimi/api/tekrar-secenekleri/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/yayin-yonetimi/api/tekrar-secenekleri` uç noktasında GET isteklerini işler; Cogniti için yayın yonetimi tekrar secenekleri sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/yayin-yonetimi/api/yayinlar/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/yayin-yonetimi/api/yayinlar` uç noktasında GET, POST isteklerini işler; Cogniti için yayın yonetimi yayınlar sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/(panel)/yayin-yonetimi/api/yayinlar/[yayin_id]/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/yayin-yonetimi/api/yayinlar/[yayin_id]` uç noktasında PUT isteklerini işler; Cogniti için yayın yonetimi yayınlar sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

## 4. APP ADMİN MODÜLÜ

### 📁 app/admin/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `_constants.ts` | TypeScript / Lib | admin yönetimi kapsamında `ROLLER`, `RENK_GRI`, `RENK_BORDO`, `RENK_CIZGI` işlev ve sabitlerini sağlar; constants iş kurallarını tek modülde toplar. |
| `_types.ts` | TypeScript / Lib | admin yönetimi alanında kullanılan `Firma`, `Kullanici`, `OnizlemeSatir`, `OnizlemeKurulum` veri tiplerini ve modüller arası sözleşmeleri tanımlar. |
| `page.tsx` | UI / React | Sistem yöneticilerinin (Admin) firma, kullanıcı, organizasyon ve mağaza operasyonlarını yönettiği M2 modüler orkestrasyon kabuğu. |

### 📁 app/admin/_components/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `AdminUstBar.tsx` | UI / React | admin Ust Bar, admin yönetimi ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `FirmaSidebar.tsx` | UI / React | firma Sidebar, admin yönetimi ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `FirmaVeriSilModal.tsx` | UI / React | firma veri silme Modal, admin yönetimi kapsamındaki firma veri silme işlemini açılır pencerede yöneten React bileşenidir. |
| `KullaniciDuzenleModal.tsx` | UI / React | kullanıcı düzenleme Modal, admin yönetimi kapsamındaki kullanıcı düzenleme işlemini açılır pencerede yöneten React bileşenidir. |
| `KullaniciListesi.tsx` | UI / React | kullanıcı Listesi, admin yönetimi kayıtlarını listeleyip yükleme, seçim veya filtreleme etkileşimlerini yönetir. |
| `LogoKimlikYonetimi.tsx` | UI / React | Logo Kimlik Yonetimi arayüz bileşenini veya sağlayıcısını tanımlar. |
| `ModulDurumKarti.tsx` | UI / React | modül durum Karti, admin yönetimi içindeki modül durum bilgisini kart görünümü ve ilgili eylemlerle sunar. |
| `ModulSekmeBari.tsx` | UI / React | modül Sekme Bari, admin yönetimi ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `SekmeBari.tsx` | UI / React | Sekme Bari, admin yönetimi ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `SistemAyarlari.tsx` | UI / React | Sistem Ayarlari, admin yönetimi ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `TakimBolgeFormu.tsx` | UI / React | takım bölge Formu, admin yönetimi işleminde gerekli takım bölge girdilerini toplar ve kullanıcı doğrulamalarını görünür kılar. |
| `TekilGirisFormu.tsx` | UI / React | Tekil Giris Formu, admin yönetimi işleminde gerekli tekil giris girdilerini toplar ve kullanıcı doğrulamalarını görünür kılar. |
| `TopluGirisFormu.tsx` | UI / React | toplu Giris Formu, admin yönetimi işleminde gerekli toplu giris girdilerini toplar ve kullanıcı doğrulamalarını görünür kılar. |
| `TopluTekilSilModal.tsx` | UI / React | toplu Tekil silme Modal, admin yönetimi kapsamındaki toplu tekil silme işlemini açılır pencerede yöneten React bileşenidir. |
| `UrunTeknikYonetimi.tsx` | UI / React | ürün teknik Yonetimi, admin yönetimi ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |

### 📁 app/admin/_components/global/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `EclubStorePaneli.tsx` | UI / React | E-Club Store Paneli, admin yönetimi kapsamındaki e-club store verilerini ve işlemlerini tek panelde birleştirir. |
| `HbStorePaneli.tsx` | UI / React | Hb Store Paneli, admin yönetimi kapsamındaki hb store verilerini ve işlemlerini tek panelde birleştirir. |
| `UretimAtamaPaneli.tsx` | UI / React | üretim atama Paneli, admin yönetimi kapsamındaki üretim atama verilerini ve işlemlerini tek panelde birleştirir. |

### 📁 app/admin/_hooks/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `useAdminPanel.ts` | TypeScript / Lib | use admin panel hook'u, admin yönetimi ekranlarının veri yükleme, durum ve kullanıcı eylemlerini ortaklaştırır. |
| `useKullaniciListesi.ts` | TypeScript / Lib | use kullanıcı Listesi hook'u, admin yönetimi ekranlarının veri yükleme, durum ve kullanıcı eylemlerini ortaklaştırır. |
| `useTakimBolgeForm.ts` | TypeScript / Lib | use takım bölge Form hook'u, admin yönetimi ekranlarının veri yükleme, durum ve kullanıcı eylemlerini ortaklaştırır. |
| `useTekilForm.ts` | TypeScript / Lib | use Tekil Form hook'u, admin yönetimi ekranlarının veri yükleme, durum ve kullanıcı eylemlerini ortaklaştırır. |
| `useTopluForm.ts` | TypeScript / Lib | use toplu Form hook'u, admin yönetimi ekranlarının veri yükleme, durum ve kullanıcı eylemlerini ortaklaştırır. |
| `useUrunTeknik.ts` | TypeScript / Lib | use ürün teknik hook'u, admin yönetimi ekranlarının veri yükleme, durum ve kullanıcı eylemlerini ortaklaştırır. |

### 📁 app/admin/api/eclub/bannerlar/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/admin/api/eclub/bannerlar` yolunun GET/POST/DELETE sunucu işleyicilerini tanımlar. |

### 📁 app/admin/api/eclub/kayitli/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/admin/api/eclub/kayitli` uç noktasında GET, PUT isteklerini işler; E-Club için E-Club kayitli sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/admin/api/eclub/onaylar/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/admin/api/eclub/onaylar` uç noktasında GET, PUT isteklerini işler; E-Club için E-Club onaylar sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/admin/api/eclub/test-eczaneler/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/admin/api/eclub/test-eczaneler` uç noktasında GET, POST, DELETE isteklerini işler; E-Club için E-Club test eczaneler sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/admin/api/eclub/test-temizlik/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/admin/api/eclub/test-temizlik` uç noktasında GET, DELETE isteklerini işler; E-Club için E-Club test temizlik sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/admin/api/firmalar/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/admin/api/firmalar` uç noktasında GET, POST isteklerini işler; admin yönetimi için admin firmalar sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/admin/api/firmalar/[firma_id]/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/admin/api/firmalar/[firma_id]` uç noktasında GET, PUT, PATCH, DELETE isteklerini işler; admin yönetimi için admin firmalar sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/admin/api/firmalar/[firma_id]/eczanem/uyeler/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/admin/api/firmalar/[firma_id]/eczanem/uyeler` yolunun GET/PATCH sunucu işleyicilerini tanımlar. |

### 📁 app/admin/api/firmalar/[firma_id]/export/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/admin/api/firmalar/[firma_id]/export` uç noktasında GET isteklerini işler; admin yönetimi için firmalar dışa aktarma sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/admin/api/firmalar/[firma_id]/kullanicilar/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/admin/api/firmalar/[firma_id]/kullanicilar` uç noktasında GET, POST, PUT, DELETE isteklerini işler; admin yönetimi için firmalar kullanıcılar sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/admin/api/firmalar/[firma_id]/takimlar/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/admin/api/firmalar/[firma_id]/takimlar` uç noktasında GET, POST isteklerini işler; admin yönetimi için firmalar takimlar sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/admin/api/firmalar/[firma_id]/takimlar/[takim_id]/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/admin/api/firmalar/[firma_id]/takimlar/[takim_id]` uç noktasında GET, PUT, DELETE isteklerini işler; admin yönetimi için firmalar takimlar sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/admin/api/firmalar/[firma_id]/takimlar/[takim_id]/bolgeler/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/admin/api/firmalar/[firma_id]/takimlar/[takim_id]/bolgeler` uç noktasında GET, POST isteklerini işler; admin yönetimi için takimlar bolgeler sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/admin/api/firmalar/[firma_id]/takimlar/[takim_id]/bolgeler/[bolge_id]/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/admin/api/firmalar/[firma_id]/takimlar/[takim_id]/bolgeler/[bolge_id]` uç noktasında GET, PUT, DELETE isteklerini işler; admin yönetimi için takimlar bolgeler sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/admin/api/firmalar/[firma_id]/teknikler/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/admin/api/firmalar/[firma_id]/teknikler` uç noktasında GET, POST, DELETE isteklerini işler; admin yönetimi için firmalar teknikler sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/admin/api/firmalar/[firma_id]/toplu-yukle/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/admin/api/firmalar/[firma_id]/toplu-yukle` uç noktasında POST isteklerini işler; admin yönetimi için firmalar toplu yukle sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/admin/api/firmalar/[firma_id]/urunler/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/admin/api/firmalar/[firma_id]/urunler` uç noktasında GET, POST, DELETE isteklerini işler; admin yönetimi için firmalar ürünler sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/admin/api/firmalar/upload/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/admin/api/firmalar/upload` yolunun POST sunucu işleyicilerini tanımlar. |

### 📁 app/admin/api/giris/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/admin/api/giris` uç noktasında POST isteklerini işler; admin yönetimi için admin giris sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/admin/api/mesai-bypass/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/admin/api/mesai-bypass` uç noktasında GET, PUT isteklerini işler; admin yönetimi için admin mesai bypass sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/admin/api/sistem-ayarlari/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/admin/api/sistem-ayarlari` uç noktasında GET, PUT isteklerini işler; admin yönetimi için admin sistem ayarlari sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/admin/api/uretim/atamalar/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/admin/api/uretim/atamalar` uç noktasında GET, POST isteklerini işler; üretim için üretim atamalar sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/admin/api/uretim/gorev-devret/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/admin/api/uretim/gorev-devret` uç noktasında POST isteklerini işler; üretim için üretim görev devret sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/admin/api/veri-sil/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/admin/api/veri-sil` uç noktasında POST isteklerini işler; admin yönetimi için admin veri silme sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/admin/eclub/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / React | `/admin/eclub` rotasında E-Club kapsamındaki E-Club arayüzünü sunan Next.js sayfa bileşenidir. |

### 📁 app/admin/eclub-cek-teslimat/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / Sayfa | `admin/eclub-cek-teslimat` kapsamındaki sayfa girişini veya yönlendirmesini tanımlar. |

### 📁 app/admin/eclub-cek-teslimat/_components/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `EclubStoreSiparislerSekmesi.tsx` | UI / React | Eclub Store Siparisler Sekmesi arayüz bileşenini veya sağlayıcısını tanımlar. |

### 📁 app/admin/eclub-cek-teslimat/_hooks/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `useEclubStoreSiparis.ts` | TypeScript / Lib | use Eclub Store Siparis kapsamında `useEclubStoreSiparis` kaynaklarını sağlar. |

### 📁 app/admin/eclub-cek-teslimat/api/cek-talepleri/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/admin/eclub-cek-teslimat/api/cek-talepleri` yolunun GET/PATCH sunucu işleyicilerini tanımlar. |

### 📁 app/admin/eclub/_components/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `EclubBannerYonetimi.tsx` | UI / React | Eclub Banner Yonetimi arayüz bileşenini veya sağlayıcısını tanımlar. |
| `EclubYonetimPaneli.tsx` | UI / React | E-Club yönetim Paneli, E-Club kapsamındaki e-club yönetim verilerini ve işlemlerini tek panelde birleştirir. |
| `eclub-banner-yonetimi.module.css` | Stil / CSS | eclub banner yonetimi.module yüzeyinin yerleşim, tema ve responsive stillerini tanımlar. |

### 📁 app/admin/eclub/_hooks/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `useEclubKayitli.ts` | TypeScript / Lib | use E-Club Kayitli hook'u, E-Club ekranlarının veri yükleme, durum ve kullanıcı eylemlerini ortaklaştırır. |
| `useEclubOnaylar.ts` | TypeScript / Lib | use E-Club onaylar hook'u, E-Club ekranlarının veri yükleme, durum ve kullanıcı eylemlerini ortaklaştırır. |
| `useEclubTestEczaneler.ts` | TypeScript / Lib | use E-Club test Eczaneler hook'u, E-Club ekranlarının veri yükleme, durum ve kullanıcı eylemlerini ortaklaştırır. |
| `useEclubTestTemizlik.ts` | TypeScript / Lib | use E-Club test Temizlik hook'u, E-Club ekranlarının veri yükleme, durum ve kullanıcı eylemlerini ortaklaştırır. |

### 📁 app/admin/eczanem/_components/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `EczanemBannerYonetimi.tsx` | UI / React | Eczanem Banner Yonetimi arayüz bileşenini veya sağlayıcısını tanımlar. |
| `EczanemUyeYonetimi.tsx` | UI / React | Eczanem Uye Yonetimi arayüz bileşenini veya sağlayıcısını tanımlar. |

### 📁 app/admin/store/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `_types.ts` | TypeScript / Lib | HBStore alanında kullanılan `UrunGosterim`, `SiparisGosterim`, `Sekme` veri tiplerini ve modüller arası sözleşmeleri tanımlar. |
| `page.tsx` | UI / React | UTT ve BM'lerin kazandıkları puanlarla ürün seçip sepete eklediği HBStore ana vitrin sayfası. |

### 📁 app/admin/store/_components/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `FirmaErisimModal.tsx` | UI / React | firma erişim Modal, HBStore kapsamındaki firma erişim işlemini açılır pencerede yöneten React bileşenidir. |
| `KategoriModal.tsx` | UI / React | kategori Modal, HBStore kapsamındaki kategori işlemini açılır pencerede yöneten React bileşenidir. |
| `KategorilerSekmesi.tsx` | UI / React | Kategoriler Sekmesi, HBStore yönetimindeki kategoriler kayıtlarını ve eylemlerini sunar. |
| `SekmeBari.tsx` | UI / React | Sekme Bari, HBStore ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `SiparisYonetimModal.tsx` | UI / React | sipariş yönetim Modal, HBStore kapsamındaki sipariş yönetim işlemini açılır pencerede yöneten React bileşenidir. |
| `SiparislerSekmesi.tsx` | UI / React | siparişler Sekmesi, HBStore yönetimindeki siparişler kayıtlarını ve eylemlerini sunar. |
| `UrunModal.tsx` | UI / React | ürün Modal, HBStore kapsamındaki ürün işlemini açılır pencerede yöneten React bileşenidir. |
| `UrunlerSekmesi.tsx` | UI / React | ürünler Sekmesi, HBStore yönetimindeki ürünler kayıtlarını ve eylemlerini sunar. |

### 📁 app/admin/store/_hooks/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `useKategoriYonetimi.ts` | TypeScript / Lib | use kategori Yonetimi hook'u, HBStore ekranlarının veri yükleme, durum ve kullanıcı eylemlerini ortaklaştırır. |
| `useSiparisYonetimi.ts` | TypeScript / Lib | use sipariş Yonetimi hook'u, HBStore ekranlarının veri yükleme, durum ve kullanıcı eylemlerini ortaklaştırır. |
| `useUrunYonetimi.ts` | TypeScript / Lib | use ürün Yonetimi hook'u, HBStore ekranlarının veri yükleme, durum ve kullanıcı eylemlerini ortaklaştırır. |

### 📁 app/admin/store/api/kategori/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/admin/store/api/kategori` uç noktasında GET, POST, PATCH, DELETE isteklerini işler; HBStore için Store kategori sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/admin/store/api/siparis/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/admin/store/api/siparis` uç noktasında GET, PATCH isteklerini işler; HBStore için Store sipariş sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/admin/store/api/upload/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/admin/store/api/upload` uç noktasında POST isteklerini işler; HBStore için Store upload sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/admin/store/api/urun/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/admin/store/api/urun` uç noktasında GET, POST, PATCH, DELETE isteklerini işler; HBStore için Store ürün sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/admin/store/api/urun-firma/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/admin/store/api/urun-firma` uç noktasında GET, PATCH isteklerini işler; HBStore için Store ürün firma sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

## 5. APP ECZANEM ÜYE PORTALI

### 📁 app/eczanem/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `_types.ts` | TypeScript / Lib | Eczanem alanında kullanılan `EczanemMusteriVideo`, `EczanemVideoRaflari`, hiyerarşik `EczanemSidebarAgaci` ve ayırt edilmiş tipli `EczanemSidebarSecim` sözleşmelerini tanımlar. |
| `loading.tsx` | UI / Yükleme | app/eczanem rotasının yükleme görünümünü sağlar. |
| `page.tsx` | UI / React | `/eczanem` müşteri ana sayfasını sunar; masaüstü sidebar ve mobil drawer gezintisini, useMemo ile kapsam filtrelemesini, breadcrumb akışını, oynatıcı durumunu ve global beğeni/favori sayaçlarını koruyan altı içerik rafını yönetir. |

### 📁 app/eczanem/_components/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `EclubGecisKarti.tsx` | UI / React | E-Club Gecis Karti, Eczanem içindeki e-club gecis bilgisini kart görünümü ve ilgili eylemlerle sunar. |
| `EczanemAnaSayfaSkeleton.tsx` | UI / React | İlk sayfa, banner ve raf yüklemelerinde ortak görünüme uygun iskeletleri sunar. |
| `EczanemAnaSayfaUstBolum.tsx` | UI / React | Başlık, tarih, yenileme, kapsam bannerları ve ortak özet kartlarını çizer; puan ve banner okumalarını ayrı yönetir. |
| `EczanemKapsamBreadcrumb.tsx` | UI / React | Seçili ağaç kapsamını Tüm İçerikler, Eczane, Firma, Ürün (null ise Genel İçerikler) ve Araç adımlarıyla hiyerarşik breadcrumb olarak gösterir ve adımlara tıklanarak kapsam değiştirilmesini sağlar. |
| `EczanemPanelBaglantisi.tsx` | UI / React | Üye kimliği, oturum yönlendirmesi, üye yolları ve profil menüsünü gerçek ortak `PanelKabugu` bileşenine aktarır; iç kullanıcı verisi çekmez. |
| `EczanemProfilMenusu.tsx` | UI / React | Ortak profil menüsünde üye adı, maskeli telefon ve üye rozetini sunar; verilmişse mevcut hesap silme onayını açan callback'i çağırır. |
| `EczanemPuanlarim.tsx` | UI / React | Eczanem Puanlarim, Eczanem ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `EczanemUrunFiltresi.tsx` | UI / React | Seçili firmanın ürünlerini ortak altı çizgili sayfa içi filtreyle sunar; eczane ve firma kapsamını korur. |
| `EczanemVideoOynatici.tsx` | UI / React | Eczanem video Oynatici, ilgili öğrenme aracını gösteren ve Eczanem ilerleme/tamamlama akışına bağlayan oynatıcı bileşenidir. |
| `EczanemVideoRafi.tsx` | UI / React | Eczanem öğrenme araçlarını masaüstünde yatay kaydırmalı raf, mobilde `MobilYayinAkisi` (2+5 dikey liste) ile sunar; güvenli kapsayıcı a11y bağlantısı ve `YayinKarti` (HOYK) standart rozetlerini barındırır. |
| `eczanemGezinme.ts` | TypeScript / Lib | Kullanıcıya ait eczane–firma menü ağacını sayfalar arasında korur ve gerektiğinde yeniden doğrular; hesaplar arasında veri taşımaz. |
| `eczanemUyeMenusu.ts` | TypeScript / Lib | Üyenin sayfa bağlantılarını ve içerik kapsam ağacını ortak `NavGrup` sözleşmesine dönüştürür; API çağrısı yapmaz. |

### 📁 app/eczanem/api/bannerlar/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eczanem/api/bannerlar` yolunun GET sunucu işleyicilerini tanımlar. |

### 📁 app/eczanem/api/eclub-gecisi/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eczanem/api/eclub-gecisi` uç noktasında GET, POST isteklerini işler; Eczanem için Eczanem E-Club gecisi sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/eczanem/api/etkilesim/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eczanem/api/etkilesim` uç noktasında POST isteklerini işler; Eczanem için Eczanem etkileşim sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/eczanem/api/giris/sifre/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eczanem/api/giris/sifre` uç noktasında POST isteklerini işler; Eczanem için giris sifre sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/eczanem/api/hesabimi-sil/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eczanem/api/hesabimi-sil` uç noktasında POST isteklerini işler; Eczanem için Eczanem hesabimi silme sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/eczanem/api/izleme/baslat/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eczanem/api/izleme/baslat` uç noktasında POST isteklerini işler; Eczanem için izleme başlatma sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/eczanem/api/izleme/bitir/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eczanem/api/izleme/bitir` uç noktasında PUT isteklerini işler; Eczanem için izleme tamamlama sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/eczanem/api/izleme/cevapla/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eczanem/api/izleme/cevapla` uç noktasında POST isteklerini işler; Eczanem için izleme cevaplama sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/eczanem/api/izleme/ilerleme/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eczanem/api/izleme/ilerleme` uç noktasında POST isteklerini işler; Eczanem için izleme ilerleme sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/eczanem/api/izleme/sorular/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eczanem/api/izleme/sorular` uç noktasında GET isteklerini işler; Eczanem için izleme sorular sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/eczanem/api/puanlar/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eczanem/api/puanlar` uç noktasında GET isteklerini işler; Eczanem için Eczanem puanlar sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/eczanem/api/siparis/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eczanem/api/siparis` uç noktasında GET, POST isteklerini işler; Eczanem için Eczanem sipariş sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/eczanem/api/siparis/vazgec/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eczanem/api/siparis/vazgec` uç noktasında POST isteklerini işler; Eczanem için sipariş vazgec sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/eczanem/api/videolar/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eczanem/api/videolar` uç noktasında GET isteklerini işler; aktif eczane üyeliklerine ait yayınları künye ve öğrenme aracı bütünlüğüyle doğrular, global etkileşim sayılarıyla zenginleştirir ve tipli hiyerarşik sidebar ağacı (`agac`) ile birlikte döner. |

### 📁 app/eczanem/bm/api/mutabakat/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eczanem/bm/api/mutabakat` yolunun GET/POST sunucu işleyicilerini tanımlar. |

### 📁 app/eczanem/kapali/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / React | `/eczanem/kapali` rotasında Eczanem kapsamındaki kapali arayüzünü sunan Next.js sayfa bileşenidir. |

### 📁 app/eczanem/puanlarim/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `page.tsx` | UI / React | Müşterinin kazandığı puanları gördüğü ve anlaşmalı eczane kasasında indirim barkodu oluşturduğu kasa cüzdan sayfası. |

### 📁 app/eczanem/tm/api/mutabakat/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eczanem/tm/api/mutabakat` yolunun GET/POST sunucu işleyicilerini tanımlar. |

### 📁 app/eczanem/utt/api/mutabakat/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eczanem/utt/api/mutabakat` yolunun GET/POST sunucu işleyicilerini tanımlar. |

### 📁 app/eczanem/yayinlar/api/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/eczanem/yayinlar/api` uç noktasında GET, POST isteklerini işler; Eczanem Yayınları sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

## 6. APP ORTAK ÖĞRENME TAKİP ROTALARI

### 📁 app/izle/api/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/izle/api` uç noktasında GET isteklerini işler; Cogniti için izleme sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/izle/api/[yayin_id]/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/izle/api/[yayin_id]` uç noktasında GET isteklerini işler; Cogniti için izleme sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/izle/api/baslat/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/izle/api/baslat` uç noktasında POST isteklerini işler; Cogniti için izleme başlatma sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/izle/api/begeni/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/izle/api/begeni` uç noktasında POST isteklerini işler; Cogniti için izleme beğeni sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/izle/api/bitir/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/izle/api/bitir` uç noktasında PUT isteklerini işler; Cogniti için izleme tamamlama sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/izle/api/cevap/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/izle/api/cevap` uç noktasında POST isteklerini işler; Cogniti için izleme cevap sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/izle/api/favori/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/izle/api/favori` uç noktasında POST isteklerini işler; Cogniti için izleme favori sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/izle/api/ileri-sarma/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/izle/api/ileri-sarma` uç noktasında POST isteklerini işler; Cogniti için izleme ileri sarma sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

### 📁 app/izle/api/sorular/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `route.ts` | API / Route Handler | `/izle/api/sorular` uç noktasında GET isteklerini işler; Cogniti için izleme sorular sürecini gerekli kimlik, yetki ve girdi doğrulamalarıyla yürütür. |

## 7. LİB ÇEKİRDEK İŞ MANTIĞI VE MOTORLAR

### 📁 lib/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `utils.ts` | TypeScript / Lib | Cogniti kapsamında `cn` işlev ve sabitlerini sağlar; utils iş kurallarını tek modülde toplar. |

### 📁 lib/admin/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `eczanemUyeleri.ts` | TypeScript / Lib | Admin Eczanem üye listesini firma/eczane, arama, durum ve sayfa kapsamında okur; maskeli telefon sunar ve üyelik durumunu korumalı RPC ile günceller. |
| `hiyerarsiTekillik.ts` | TypeScript / Lib | admin yönetimi kapsamında `hiyerarsiAdiBicimle`, `tekillikIhlaliMi` işlev ve sabitlerini sağlar; hiyerarşi Tekillik iş kurallarını tek modülde toplar. |
| `kullaniciDogrulama.ts` | TypeScript / Lib | admin yönetimi kapsamında `turkceKatla`, `rolCoz`, `telefonNormalize` işlev ve sabitlerini ve `FirmaYapisi`, `KullaniciGirdisi`, `DogrulanmisKullanici` veri sözleşmelerini sağlar; kullanıcı Dogrulama iş kurallarını tek modülde toplar. |
| `telefonBicim.ts` | TypeScript / Lib | admin yönetimi kapsamında `telefonRakam`, `telefonBicimle` işlev ve sabitlerini sağlar; telefon Bicim iş kurallarını tek modülde toplar. |
| `topluPaketButunlugu.ts` | TypeScript / Lib | admin yönetimi kapsamında `topluPaketHatalari` işlev ve sabitlerini ve `TopluPaketSatiri` veri sözleşmelerini sağlar; toplu paket Butunlugu iş kurallarını tek modülde toplar. |
| `yayinKodu.ts` | TypeScript / Lib | yayin Kodu kapsamında `yayinKoduNumarasiniCoz` kaynaklarını sağlar. |

### 📁 lib/auth/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `guvenliCikis.ts` | TypeScript / Lib | kimlik ve oturum kapsamında `supabaseAuthCookieOnEki`, `guvenliCikisYap` işlev ve sabitlerini sağlar; guvenli Cikis iş kurallarını tek modülde toplar. |

### 📁 lib/bildirimler/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `rozet.ts` | TypeScript / Lib | bildirim kapsamında `BILDIRIM_ROZETLERI_DEGISTI`, `bildirimRozetleriniYenile` işlev ve sabitlerini sağlar; rozet iş kurallarını tek modülde toplar. |

### 📁 lib/cclub/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `bildirimMesajlari.ts` | TypeScript / Lib | C-Club kapsamında `challengeGeldiMesaji`, `challengeIzlendiMesaji` işlev ve sabitlerini sağlar; bildirim Mesajlari iş kurallarını tek modülde toplar. |
| `kartDetaylari.ts` | TypeScript / Lib | C-Club kapsamında `ccKartMetrikleri` işlev ve sabitlerini ve `CcKartMetrik` veri sözleşmelerini sağlar; kart Detaylari iş kurallarını tek modülde toplar. |
| `kayit.ts` | TypeScript / Lib | C-Club kapsamında `challengeOlustur`, `referralPuaniKaydet` işlev ve sabitlerini sağlar; kayıt iş kurallarını tek modülde toplar. |
| `kotaKontrol.ts` | TypeScript / Lib | C-Club kapsamında `aylikKotaKontrol`, `aliciAylikKontrol`, `karsiliklilikKilidi` işlev ve sabitlerini sağlar; kota Kontrol iş kurallarını tek modülde toplar. |
| `sabitler.ts` | TypeScript / Lib | C-Club kapsamında `AYLIK_MAX_GONDERIM`, `ccGondermePuani`, `ccReferralPuani`, `ccPuanSabitleri` işlev ve sabitlerini sağlar; sabitler iş kurallarını tek modülde toplar. |
| `tekrarIzlemeKontrol.ts` | TypeScript / Lib | C-Club kapsamında `tekrarIzlemeKontrol` işlev ve sabitlerini sağlar; tekrar Izleme Kontrol iş kurallarını tek modülde toplar. |
| `tipler.ts` | TypeScript / Lib | C-Club kapsamında `ChallengeOlusturParams`, `ReferralPuaniParams`, `KotaSonuc` veri sözleşmelerini sağlar; tipler iş kurallarını tek modülde toplar. |
| `uygunAliciListesi.ts` | TypeScript / Lib | C-Club kapsamında `uygunAliciListesi` işlev ve sabitlerini sağlar; uygun Alici Listesi iş kurallarını tek modülde toplar. |

### 📁 lib/cclub/izleme/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `baslat.ts` | TypeScript / Lib | C-Club kapsamında `izlemeBaslat` işlev ve sabitlerini sağlar; başlatma iş kurallarını tek modülde toplar. |
| `extraKontrol.ts` | TypeScript / Lib | C-Club kapsamında `CC_EXTRA_TEKRAR_ESIGI`, `dahaOnceTamamlandiMi` işlev ve sabitlerini sağlar; extra Kontrol iş kurallarını tek modülde toplar. |

### 📁 lib/cclub/puan/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `kayip.ts` | TypeScript / Lib | C-Club kapsamında `ileriSarmaKaybiKaydet`, `yanlisCevapKaybiKaydet` işlev ve sabitlerini sağlar; kayip iş kurallarını tek modülde toplar. |
| `kazanim.ts` | TypeScript / Lib | C-Club kapsamında `izlemePuaniKaydet`, `cevapPuaniKaydet`, `extraPuaniKaydet`, `ccGondermePuaniKaydet` işlev ve sabitlerini sağlar; kazanim iş kurallarını tek modülde toplar. |

### 📁 lib/eclub/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `aktifYayinYetkisi.ts` | TypeScript / Lib | E-Club kapsamında `eclubAktifYayinYetkisi` işlev ve sabitlerini sağlar; aktif yayın Yetkisi iş kurallarını tek modülde toplar. |
| `anaSayfaBannerOnbellek.ts` | TypeScript / Lib | ana Sayfa Banner Onbellek kapsamında `anaSayfaBannerOnbelleginiOku`, `anaSayfaBannerlariniIste` kaynaklarını sağlar. |
| `anaSayfaPanelOnbellek.ts` | TypeScript / Lib | ana Sayfa Panel Onbellek kapsamında `panelOnbelleginiSil`, `panelOnbelleginiOku`, `panelVerisiniIste`, `panelOnbellegineYaz` kaynaklarını sağlar. |
| `banner.ts` | TypeScript / Lib | banner kapsamında `ECLUB_BANNER_BUCKET`, `ECLUB_BANNER_TABLO`, `ECLUB_BANNER_MAX_BOYUT`, `PLATFORM_FIRMA_ID` kaynaklarını sağlar. |
| `bannerSunucu.ts` | TypeScript / Lib | banner Sunucu kapsamında `firmaBannerlariniOku` kaynaklarını sağlar. |
| `bmGruplari.ts` | TypeScript / Lib | bm Gruplari kapsamında `eclubBmGruplari` kaynaklarını sağlar. |
| `depo.ts` | TypeScript / Lib | depo kapsamında `uuidMu`, `depoTercihleriGecerli`, `secilebilirKonumlar`, `konumEtiketi` kaynaklarını sağlar. |
| `depoErisim.ts` | TypeScript / Lib | depo Erisim kapsamında `depoOturumu` kaynaklarını sağlar. |
| `depoSunucu.ts` | TypeScript / Lib | depo Sunucu kapsamında `depoKataloguGetir` kaynaklarını sağlar. |
| `firmaBannerOnbellek.ts` | TypeScript / Lib | firma Banner Onbellek kapsamında `firmaBannerOnbelleginiOku`, `firmaBannerlariniIste` kaynaklarını sağlar. |
| `firmaGezinme.ts` | TypeScript / Lib | firma Gezinme kapsamında `eclubFirmaAdiYolu`, `eclubFirmaRotasiKapsami`, `eclubFirmaYolu`, `eclubFirmaKapsami` kaynaklarını sağlar. |
| `firmaUrunSecimi.ts` | TypeScript / Lib | firma Urun Secimi kapsamında `eclubFirmaUrunSeciminiOku`, `eclubFirmaUrunSeciminiYaz`, `eclubFirmaUrunSecimineAboneOl` kaynaklarını sağlar. |
| `firmaYayinSayilari.ts` | TypeScript / Lib | firma Yayin Sayilari kapsamında `eclubYeniYayinMi`, `eclubFirmaYayinSayilari` kaynaklarını sağlar. |
| `gonderiAyarlari.ts` | TypeScript / Lib | E-Club kapsamında `ECLUB_GONDERI_AYARLARI`, `ECLUB_GONDERI_AYAR_ANAHTARLARI`, `eclubGonderiAyariMi`, `eclubGonderiAyariVarsayilani` işlev ve sabitlerini ve `EclubGonderiAyariAnahtari` veri sözleşmelerini sağlar; gonderi Ayarlari iş kurallarını tek modülde toplar. |
| `gonderimApi.ts` | TypeScript / Lib | gonderim Api kapsamında `GONDERIM_LIMITLERI`, `gonderimIsteginiOku`, `planTarihAdaylari`, `planTarihiniRpcGirdisineCevir` kaynaklarını sağlar. |
| `gonderimDurumlari.ts` | TypeScript / Lib | gonderim Durumlari kapsamında `kisiBasinaSonGonderimler`, `gonderimDurumu`, `gonderimDurumGruplari` kaynaklarını sağlar. |
| `gonderimEkrani.ts` | TypeScript / Lib | gonderim Ekrani kapsamında `gonderimAraligiBitisAni`, `gonderiIcinKalanGun`, `planTakvimSinirlari`, `planHedefiniCoz` kaynaklarını sağlar. |
| `gonderimPlanIsleyici.ts` | TypeScript / Lib | gonderim Plan Isleyici kapsamında `cronYetkiliMi`, `eclubPlanIsleriniTuket` kaynaklarını sağlar. |
| `gonderimPlanKuyrugu.ts` | TypeScript / Lib | gonderim Plan Kuyrugu kapsamında `eclubPlanlananGonderimleriTuket` kaynaklarını sağlar. |
| `gonderimPlanTipleri.ts` | TypeScript / Lib | gonderim Plan Tipleri kapsamında `ECLUB_GONDERIM_PLAN_DURUMLARI` kaynaklarını sağlar. |
| `hoykSureCercevesi.ts` | TypeScript / Lib | hoyk Sure Cercevesi kapsamında `eclubHoykRenkPaleti`, `eclubHoykRengi`, `eclubHoykUcRengi`, `eclubHoykSureDurumu` kaynaklarını sağlar. |
| `ileriSarma.ts` | TypeScript / Lib | E-Club kapsamında `eclubIleriSarmaKonumuDogrula`, `eclubIleriSarmaKaybiHesapla` işlev ve sabitlerini ve `EclubIleriSarmaKonumu` veri sözleşmelerini sağlar; ileri Sarma iş kurallarını tek modülde toplar. |
| `izlemeKurali.ts` | TypeScript / Lib | E-Club kapsamında `eclubOneriDurumu`, `eclubIzlemeHaklari`, `eclubSoruIndeksleri` işlev ve sabitlerini ve `EclubOneriDurumu` veri sözleşmelerini sağlar; izleme Kurali iş kurallarını tek modülde toplar. |
| `kisiErisim.ts` | TypeScript / Lib | E-Club kapsamında `eclubKisiModulDurumu`, `eclubKisiErisimi` işlev ve sabitlerini ve `EclubKisiErisimSonucu` veri sözleşmelerini sağlar; kişi erişim iş kurallarını tek modülde toplar. |
| `ligPeriyot.ts` | TypeScript / Lib | E-Club kapsamında `eclubLigPeriyoduParse` işlev ve sabitlerini sağlar; lig Periyot iş kurallarını tek modülde toplar. |
| `oneriKapsam.ts` | TypeScript / Lib | E-Club kapsamında `eclubYayinKapsamindaMi` işlev ve sabitlerini ve `EclubUttYayinKapsami`, `EclubYayinKapsami` veri sözleşmelerini sağlar; öneri Kapsam iş kurallarını tek modülde toplar. |
| `oneriLimit.ts` | TypeScript / Lib | E-Club kapsamında `eclubOneriGecerlilikGun`, `eclubAyniVideoTekrarBeklemeGun`, `oneriBitisHesapla`, `ayniAracTekrarAcikZamani` işlev ve sabitlerini ve `AyniAracTekrarEngeli`, `AyniAracTekrarSonuc` veri sözleşmelerini sağlar; öneri Limit iş kurallarını tek modülde toplar. |
| `performans.ts` | TypeScript / Lib | performans kapsamında `ECLUB_PERFORMANS_TURLERI`, `eclubPerformansDonemKoduGecerliMi`, `eclubPerformansDonemi`, `eclubPerformansDonemSecenekleri` kaynaklarını sağlar. |
| `performansGrafik.ts` | TypeScript / Lib | performans Grafik kapsamında `eclubPerformansGrafikSecenegi` kaynaklarını sağlar. |
| `performansOnbellek.ts` | TypeScript / Lib | performans Onbellek kapsamında `performansOnbelleginiOku`, `performansVerisiniIste` kaynaklarını sağlar. |
| `rapor.ts` | TypeScript / Lib | E-Club lig sıralamalarını, eczane bazlı izlenme dökümlerini ve ciro etki metriklerini derleyen rapor motoru. |
| `testGln.ts` | TypeScript / Lib | E-Club kapsamında `TEST_GLN_PREFIX`, `TEST_GLN_UZUNLUK`, `TEST_GLN_TEK_SEFER_UST_SINIR`, `TEST_TEMIZLIK_ONAYI` işlev ve sabitlerini sağlar; test Gln iş kurallarını tek modülde toplar. |
| `uttEczane.ts` | TypeScript / Lib | E-Club kapsamında `uttEczaneFirmaBaglari`, `uttEczaneYetkisiVarMi` işlev ve sabitlerini sağlar; UTT eczane iş kurallarını tek modülde toplar. |
| `uyelikDaveti.ts` | TypeScript / Lib | uyelik Daveti kapsamında `davetHash`, `davetTokenGecerli`, `davetBekliyor`, `davetAltyapisiKontrol` kaynaklarını sağlar. |
| `yayinEtkilesimleri.ts` | TypeScript / Lib | yayin Etkilesimleri kapsamında `eclubYayinEtkilesimSayilari` kaynaklarını sağlar. |
| `yayinGonderimFiltreleri.ts` | TypeScript / Lib | yayin Gonderim Filtreleri kapsamında `yayinAlicisiUygun`, `yayinGonderimListeleri` kaynaklarını sağlar. |
| `yayinRafiSirasi.ts` | TypeScript / Lib | yayin Rafi Sirasi kapsamında `tohumaGoreYayinSirala` kaynaklarını sağlar. |
| `yonetimKapsami.ts` | TypeScript / Lib | E-Club Ligi Excel dışa aktarımı için yetkili UTT kapsamını, takım, BM ve bölge adlarıyla belirler. |

### 📁 lib/eclub/hediyeTakip/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `bmTakipKapsami.ts` | TypeScript / Lib | bm Takip Kapsami kapsamında `bmTakipKapsaminiCoz`, `bmTakipListeKapsamlari` kaynaklarını sağlar. |
| `cekTakip.ts` | TypeScript / Lib | cek Takip kapsamında `CEK_TAKIP_SAYFA_LIMITI`, `CEK_TAKIP_ISLEMLERI`, `CEK_TAKIP_TESLIMAT_DURUMLARI`, `cekTakipTeslimatiTamamlandiMi` kaynaklarını sağlar. |
| `cekTakipErisim.ts` | TypeScript / Lib | cek Takip Erisim kapsamında `CEK_TAKIP_ROLLERI`, `cekTakipRoluneIzinVarMi`, `cekTakipTalepKapsami`, `cekTakipKapsaminiCoz` kaynaklarını sağlar. |
| `cekTakipFiltreSecenekleri.ts` | TypeScript / Lib | cek Takip Filtre Secenekleri kapsamında `cekTakipFiltreSecenekleriniGetir` kaynaklarını sağlar. |
| `cekTakipFiltreleri.ts` | TypeScript / Lib | cek Takip Filtreleri kapsamında `cekTakipFiltreleriniParseEt` kaynaklarını sağlar. |
| `cekTakipListesi.ts` | TypeScript / Lib | cek Takip Listesi kapsamında `cekTakipTeslimatKanaliniOzetle`, `cekTakipIzinVerilenIslemler`, `cekTakipTalepleriniGetir` kaynaklarını sağlar. |
| `cekTakipStatlari.ts` | TypeScript / Lib | cek Takip Statlari kapsamında `CEK_TAKIP_ONAY_SURECI_TALEP_DURUMLARI`, `CEK_TAKIP_TESLIMAT_SURECI_TALEP_DURUMLARI`, `CEK_TAKIP_TAMAMLANAN_TALEP_DURUMLARI`, `cekTakipStatGrubu` kaynaklarını sağlar. |
| `siparisTakip.ts` | TypeScript / Lib | siparis Takip kapsamında `SIPARIS_TAKIP_SAYFA_LIMITI`, `SIPARIS_TAKIP_DURUMLARI`, `siparisTakipDurumu`, `siparisTakipStatlariniHesapla` kaynaklarını sağlar. |
| `siparisTakipFiltreleri.ts` | TypeScript / Lib | siparis Takip Filtreleri kapsamında `siparisTakipFiltreleriniParseEt` kaynaklarını sağlar. |
| `siparisTakipListesi.ts` | TypeScript / Lib | siparis Takip Listesi kapsamında `siparisTakipVerisiniGetir` kaynaklarını sağlar. |

### 📁 lib/eclub/store/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `cekEpostaKuyrukIsleyici.ts` | TypeScript / Lib | Çek e-posta kuyruğundan işleri alır, gönderir ve kanal sonucunu tamamlanma veya hata RPC’lerine kaydeder. |
| `cekPushKuyrukIsleyici.ts` | TypeScript / Lib | Çek push kuyruğunu tüketir; başarılı gönderim sonucunu doğrulayarak işi tamamlar, başarısız sonuçları hata olarak kaydeder. |
| `cekTakipOnbellek.ts` | TypeScript / Lib | cek Takip Onbellek kapsamında `cekTakipOnbellegi` kaynaklarını sağlar. |
| `cekTalebiYetkisi.ts` | TypeScript / Lib | Hediye çeki talebi oluşturma yetkisini yalnız ana eczacı rolü için tanımlar. |
| `eclubStoreTipler.ts` | TypeScript / Lib | E-Club Store kapsamında `EclubStoreKategori`, `EclubStoreUrun`, `EclubStoreAdres` veri sözleşmelerini sağlar; E-Club Store Tipler iş kurallarını tek modülde toplar. |
| `gorunumTesti.ts` | TypeScript / Lib | gorunum Testi kapsamında `ECLUB_CEK_KARTI_TEST_PUAN_IDLERI`, `ECLUB_CEK_TALEBI_TEST_IDLERI`, `eclubCekTalebiGorunumTestiMi` kaynaklarını sağlar. |
| `takvim.ts` | TypeScript / Lib | takvim kapsamında `ayGunSayisi`, `eclubAyPenceresi`, `eclubStoreSiparisAcikMi`, `eclubStoreTakvimDurumu` kaynaklarını sağlar. |
| `uxGorunumTesti.ts` | TypeScript / Lib | ux Gorunum Testi kapsamında `ECLUB_UX_TEST_KISI_ID`, `eclubUxTestYayiniMi`, `eclubUxKartlariniBirlestir` kaynaklarını sağlar. |
| `vitrinOnbellek.ts` | TypeScript / Lib | vitrin Onbellek kapsamında `vitrinOnbellegi` kaynaklarını sağlar. |

### 📁 lib/eczanem/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `aktifUyelik.ts` | TypeScript / Lib | Eczanem kapsamında `aktifEczaneUyeliginiDogrula`, `aktifGonderimUyeliginiDogrula` işlev ve sabitlerini ve `AktifUyelikSonucu` veri sözleşmelerini sağlar; aktif Uyelik iş kurallarını tek modülde toplar. |
| `eclubUyesiKontrol.ts` | TypeScript / Lib | Eczanem kapsamında `ECLUB_UYESI_MUSTERI_OLAMAZ_MESAJI`, `ECZANEM_MUSTERISI_ECLUB_UYESI_OLAMAZ_MESAJI`, `eclubTelefonVaryantlari`, `eclubUyesiTelefonMu` işlev ve sabitlerini sağlar; E-Club Uyesi Kontrol iş kurallarını tek modülde toplar. |
| `eczaci.ts` | TypeScript / Lib | Eczanem kapsamında `eczaciAktifEczanesi` işlev ve sabitlerini sağlar; eczaci iş kurallarını tek modülde toplar. |
| `erisim.ts` | TypeScript / Lib | Eczanem kapsamında `ECZANEM_KAPALI_MESAJI`, `PASIFE_PUAN_KULLANIM_GUN`, `eczaneEczanemFirmaIdleri`, `uttEczanemErisimi` işlev ve sabitlerini ve `EczanemErisimSonucu` veri sözleşmelerini sağlar; erişim iş kurallarını tek modülde toplar. |
| `gonderim.ts` | TypeScript / Lib | Eczanem kapsamında `AKTIF_UYE_ESIGI_VARSAYILAN`, `aktifUyeEsigi`, `eczaneAdMap` işlev ve sabitlerini ve `UttEczanemYayin`, `UttEczanemEczane`, `UttEczanemVeri` veri sözleşmelerini sağlar; gönderim iş kurallarını tek modülde toplar. |
| `kasa.ts` | TypeScript / Lib | Eczane kasasında indirim tutarını ve barkod karşılığını hesaplayan, atomik onayda puanı düşen kasa motoru. |
| `oturum.ts` | TypeScript / Lib | Eczanem kapsamında `musteriKimligi` işlev ve sabitlerini sağlar; oturum iş kurallarını tek modülde toplar. |
| `silme.ts` | TypeScript / Lib | KVKK uyumlu müşteri tam silme (Right to be Forgotten) ve hesap kapatma işlemlerini atomik yürüten motor. |
| `tarife.ts` | TypeScript / Lib | Eczanem kapsamında `guncelTarife`, `tarifeVeBarkodYaz` işlev ve sabitlerini ve `TarifeGiris`, `TarifeSonuc`, `GuncelTarife` veri sözleşmelerini sağlar; tarife iş kurallarını tek modülde toplar. |
| `telefon.ts` | TypeScript / Lib | Eczanem kapsamında `telefonNormalize` işlev ve sabitlerini sağlar; telefon iş kurallarını tek modülde toplar. |
| `uttMutabakat.ts` | TypeScript / Lib | UTT/BM/TM mutabakatlarının dönem, liste kırılımı, kaynak dökümü, karar ve üst onaya gönderim veri sözleşmelerini yönetir. |

### 📁 lib/etkilesim/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `yayinYetkisi.ts` | TypeScript / Lib | Cogniti kapsamında `etkilesimYayinYetkisi` işlev ve sabitlerini sağlar; yayın Yetkisi iş kurallarını tek modülde toplar. |

### 📁 lib/firma/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `eclubDurumu.ts` | TypeScript / Lib | eclub Durumu kapsamında `firmaEclubDurumu` kaynaklarını sağlar. |
| `kolonlar.ts` | TypeScript / Lib | Cogniti kapsamında `FIRMA_KOLONLARI` işlev ve sabitlerini sağlar; kolonlar iş kurallarını tek modülde toplar. |
| `logoOptimizasyonIstemci.ts` | TypeScript / Lib | logo Optimizasyon Istemci kapsamında `svgMi`, `logoGorseliniOptimizeEt` kaynaklarını sağlar. |
| `logoStorage.ts` | TypeScript / Lib | logo Storage kapsamında `firmaLogoYukle` kaynaklarını sağlar. |

### 📁 lib/izleme/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `baslat.ts` | TypeScript / Lib | öğrenme takibi kapsamında `olayIdGecerliMi`, `baslatOlayIdGecerliMi`, `izlemeTuruBelirle`, `oynatmaBaslatilmaliMi` işlev ve sabitlerini ve `IzlemeTuru` veri sözleşmelerini sağlar; başlatma iş kurallarını tek modülde toplar. |
| `karar.ts` | TypeScript / Lib | öğrenme takibi kapsamında `soruHakkiBelirle`, `izlemeKazanimKarariBelirle`, `ileriSarmaKaybiHesapla`, `tamamlamaYeterliMi` işlev ve sabitlerini sağlar; karar iş kurallarını tek modülde toplar. |
| `puanZamani.ts` | TypeScript / Lib | öğrenme takibi kapsamında `izlemePuanZamaniAktifMi` işlev ve sabitlerini sağlar; puan Zamani iş kurallarını tek modülde toplar. |
| `tipler.ts` | TypeScript / Lib | öğrenme takibi kapsamında `SoruHakkiNedeni`, `SoruHakkiGirdisi`, `IzlemeKazanimGirdisi` veri sözleşmelerini sağlar; tipler iş kurallarını tek modülde toplar. |

### 📁 lib/kimlik/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `provizyon.ts` | TypeScript / Lib | kimlik ve oturum kapsamında `provizyonBaslat`, `provizyonDurumuYaz`, `authTelafisiYap` işlev ve sabitlerini ve `ProvizyonHedefi` veri sözleşmelerini sağlar; provizyon iş kurallarını tek modülde toplar. |

### 📁 lib/ogrenmeAraci/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `bayraklar.ts` | TypeScript / Lib | ortak öğrenme aracı kapsamında `ogrenmeAraciAcikMi`, `yayinAraciKullanimaAcikMi`, `ogrenmeAraciBayraklari` işlev ve sabitlerini sağlar; bayraklar iş kurallarını tek modülde toplar. |
| `bunnyStorage.ts` | TypeScript / Lib | ortak öğrenme aracı kapsamında `bunnyStorageOrtami`, `bunnyNesneYoluOlustur`, `bunnyPodcastDestekYoluOlustur`, `yuklemeYetkisiOlustur` işlev ve sabitlerini ve `YuklemeYetkisi` veri sözleşmelerini sağlar; Bunny Storage iş kurallarını tek modülde toplar. |
| `bunnyYuklemeIstemci.ts` | TypeScript / Lib | ortak öğrenme aracı kapsamında `hazirPodcastYukle`, `hazirGorselYukle`, `hazirFlipPdfYukle` işlev ve sabitlerini ve `YuklemeAsamasi`, `OgrenmeAraciYuklemeKontrolu` veri sözleşmelerini sağlar; Bunny yükleme Istemci iş kurallarını tek modülde toplar. |
| `erisimBasligi.ts` | TypeScript / Lib | erisim Basligi kapsamında `ogrenmeAraciErisimUrunAdi` kaynaklarını sağlar. |
| `etiketler.ts` | TypeScript / Lib | ortak öğrenme aracı kapsamında `OGRENME_ARACI_METINLERI`, `ogrenmeAraciMetinleri` işlev ve sabitlerini ve `OgrenmeAraciMetinleri` veri sözleşmelerini sağlar; etiketler iş kurallarını tek modülde toplar. |
| `geminiTranscribe.ts` | TypeScript / Lib | Podcast ses kaydının Gemini üzerinden transkripsiyonunu yürütür; kaldırılmış bi sohbet motorundan ayrı bir öğrenme aracı hizmetidir. |
| `gorselMetadata.ts` | TypeScript / Lib | gorsel Metadata kapsamında `gorselOlculeriniBaytlardanOku` kaynaklarını sağlar. |
| `izlemeIstemci.ts` | TypeScript / Lib | izleme Istemci kapsamında `ogrenmeAraciIzlemesiniBaslat` kaynaklarını sağlar. |
| `izlemeSahibi.ts` | TypeScript / Lib | ortak öğrenme aracı kapsamında `ogrenmeAraciIzlemeSahibiniCoz` işlev ve sabitlerini ve `OgrenmeAraciIzlemeTablosu`, `OgrenmeAraciIzlemeSahibi` veri sözleşmelerini sağlar; izleme Sahibi iş kurallarını tek modülde toplar. |
| `konusmaciAyraci.ts` | TypeScript / Lib | konusmaci Ayraci kapsamında `escapeRegExp`, `konusmaciMetniniNormalizeEt`, `metindeIkiKonusmaciVarMi`, `konusmaciAdiniTemizle` kaynaklarını sağlar. |
| `localTranskriptWorker.ts` | TypeScript / Lib | local Transkript Worker kapsamında `baslatLocalTranskriptWorker`, `durdurLocalTranskriptWorker`, `localTranskriptWorkerDurumu` kaynaklarını sağlar. |
| `pdfMetadata.ts` | TypeScript / Lib | pdf Metadata kapsamında `pdfMetadatasiniBaytlardanCikar` kaynaklarını sağlar. |
| `podcastTaslakTemizleyici.ts` | TypeScript / Lib | Terk edilmiş kalıcı podcast taslaklarının zaman aşımı temizliğini atomik RPC’ye iletir. |
| `podcastTranskriptErisimi.ts` | TypeScript / Lib | podcast Transkript Erisimi kapsamında `podcastTranskriptErisiminiCoz` kaynaklarını sağlar. |
| `sha256Istemci.ts` | TypeScript / Lib | ortak öğrenme aracı kapsamında `dosyaSha256Parcali` işlev ve sabitlerini sağlar; sha256 Istemci iş kurallarını tek modülde toplar. |
| `sozlesme.ts` | TypeScript / Lib | ortak öğrenme aracı alanında kullanılan `ARAC_DOSYA_POLITIKASI`, `ogrenmeAraciTuruMu`, `yeniOgrenmeAraciTuruMu`, `dosyaBeyaniDogrula` veri tiplerini ve modüller arası sözleşmeleri tanımlar. |
| `sunucu.ts` | TypeScript / Lib | ortak öğrenme aracı kapsamında `VIDEO_ARACI`, `PODCAST_ARACI`, `GORSEL_ARACI` işlev ve sabitlerini ve `SureliAracIlerlemesi`, `GorselIlerlemesi`, `FlipPdfIlerlemesi` veri sözleşmelerini sağlar; sunucu iş kurallarını tek modülde toplar. |
| `tamamlamaKapisi.ts` | TypeScript / Lib | tamamlama Kapisi kapsamında `ogrenmeAraciTamamlamaKapisi` kaynaklarını sağlar. |
| `thumbnailIstemci.ts` | TypeScript / Lib | thumbnail Istemci kapsamında `yayinThumbnailIstemciCoz` kaynaklarını sağlar. |
| `tipler.ts` | TypeScript / Lib | ortak öğrenme aracı kapsamında `OGRENME_ARACI_TURLERI`, `YENI_OGRENME_ARACI_TURLERI` işlev ve sabitlerini ve `OgrenmeAraciTuru`, `YeniOgrenmeAraciTuru`, `OgrenmeAraciKaynagi` veri sözleşmelerini sağlar; tipler iş kurallarını tek modülde toplar. |
| `transkriptIstemciCikarici.ts` | TypeScript / Lib | transkript Istemci Cikarici kapsamında `istemcideMetinCikar` kaynaklarını sağlar. |
| `transkriptKuyrukIsleyici.ts` | TypeScript / Lib | transkript Kuyruk Isleyici kapsamında `transkriptKuyrukIsle`, `transkriptKuyrugunuTuket` kaynaklarını sağlar. |
| `transkriptMetinCikarici.ts` | TypeScript / Lib | transkript Metin Cikarici kapsamında `AZAMI_TRANSKRIPT_KARAKTER`, `ASGARI_TRANSKRIPT_KARAKTER`, `transkriptDosyasindanMetinCikar` kaynaklarını sağlar. |
| `turSunumu.ts` | TypeScript / Lib | tur Sunumu kapsamında `YAYIN_TURU_SUNUMU`, `YAYIN_TURLERI` kaynaklarını sağlar. |
| `uretimAkisi.ts` | TypeScript / Lib | ortak öğrenme aracı kapsamında `ogrenmeAraciUretimAkisi` işlev ve sabitlerini ve `OgrenmeAraciUretimVaryanti`, `OgrenmeAraciUretimAkisi` veri sözleşmelerini sağlar; üretim Akisi iş kurallarını tek modülde toplar. |
| `yayinThumbnail.ts` | TypeScript / Lib | yayin Thumbnail kapsamında `bunnyEmbedUrlUret`, `yayinVideoUrlCoz`, `yayinThumbnailUrlCoz`, `yayinlariThumbnailIleZenginlestir` kaynaklarını sağlar. |
| `yetki.ts` | TypeScript / Lib | ortak öğrenme aracı kapsamında `uretimAraciYetkisiniDogrula` işlev ve sabitlerini ve `UretimAraciYetkisi` veri sözleşmelerini sağlar; yetki iş kurallarını tek modülde toplar. |

### 📁 lib/panel/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `baslangic.ts` | TypeScript / Lib | Üretici için Yayın Yönetimi, diğer iç panel rolleri için Ana Sayfa başlangıç yolunu ve etiketini tek kaynaktan çözer. |
| `panelCache.ts` | TypeScript / Lib | panel Cache kapsamında `VARSAYILAN_FLAGS`, `getAuthKullaniciCache`, `setAuthKullaniciCache`, `clearAuthKullaniciCache` kaynaklarını sağlar. |
| `sayfaOkumaOnbellegi.ts` | TypeScript / Lib | sayfa Okuma Onbellegi kapsamında `sayfaOkumaOnbellegiOlustur` kaynaklarını sağlar. |

### 📁 lib/profil/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `fotoDogrula.ts` | TypeScript / Lib | foto Dogrula kapsamında `PROFIL_FOTO_LIMITLERI`, `profilFotoGirisDogrula`, `profilFotoCiktiDogrula` kaynaklarını sağlar. |

### 📁 lib/push/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `abonelik.ts` | TypeScript / Lib | Web Push bildirimleri kapsamında `abonelikUpsert`, `abonelikPasifle`, `aktifAbonelikleriGetir` işlev ve sabitlerini sağlar; abonelik iş kurallarını tek modülde toplar. |
| `gonderici.ts` | TypeScript / Lib | Web Push bildirimleri kapsamında `pushGonder` işlev ve sabitlerini ve `PushHedefi` veri sözleşmelerini sağlar; gonderici iş kurallarını tek modülde toplar. |
| `icerik.ts` | TypeScript / Lib | Web Push bildirimleri kapsamında `icerikUret` işlev ve sabitlerini sağlar; icerik iş kurallarını tek modülde toplar. |
| `istemci.ts` | TypeScript / Lib | Web Push bildirimleri kapsamında `pushDestekliMi`, `mevcutIzin`, `aboneOlVeKaydet`, `aboneligiTazele` işlev ve sabitlerini ve `PushIzinDurumu` veri sözleşmelerini sağlar; istemci iş kurallarını tek modülde toplar. |
| `orkestrasyon.ts` | TypeScript / Lib | Web Push bildirimleri kapsamında `pushYayinla`, `pushYayinlaArkada`, `pushYayinlaEclubKisilereArkada`, `pushYayinlaEczanemMusterilereArkada` işlev ve sabitlerini sağlar; orkestrasyon iş kurallarını tek modülde toplar. |
| `tipler.ts` | TypeScript / Lib | Web Push bildirimleri kapsamında `TarayiciAboneligi`, `PushAbonelikKaydi`, `PushOlayTuru` veri sözleşmelerini sağlar; tipler iş kurallarını tek modülde toplar. |

### 📁 lib/rapor/bm/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `getBmData.ts` | TypeScript / Lib | raporlama kapsamında `getBmData` işlev ve sabitlerini ve `BmUttPerformans`, `KullaniciOzetSatiri`, `KullaniciUrunDagilimi` veri sözleşmelerini sağlar; get Bm Data iş kurallarını tek modülde toplar. |
| `getBmDavranis.ts` | TypeScript / Lib | get Bm Davranis kapsamında `bmDavranisiniHesapla`, `TemsilciKapsamHatasi`, `getBmKarsilastirma`, `getBmDavranis` kaynaklarını sağlar. |
| `toplamlar.ts` | TypeScript / Lib | raporlama kapsamında `bosPuanToplami`, `ozetToplami`, `kategorileriTopla`, `urunleriTopla` işlev ve sabitlerini ve `PuanToplami` veri sözleşmelerini sağlar; toplamlar iş kurallarını tek modülde toplar. |

### 📁 lib/rapor/paylasilan/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `aracTuruDagilimi.ts` | TypeScript / Lib | Araç performansı, tüketim ve potansiyel puan özetlerini SQL’den okuyup veri türlerini uyarlar; yayın detaylarını imleçli sayfalarla getirir. |
| `bmPerformansTipleri.ts` | TypeScript / Lib | raporlama kapsamında `BmPerformans`, `BmUttPerformans`, `BmPerformansDetay` veri sözleşmelerini sağlar; bm Performans Tipleri iş kurallarını tek modülde toplar. |
| `eclubDurumu.ts` | TypeScript / Lib | eclub Durumu kapsamında `raporModulDurumunuUygula`, `raporBolumleriniSec` kaynaklarını sağlar. |
| `netPuanToplami.ts` | TypeScript / Lib | net Puan Toplami kapsamında `netPuanSatirlari`, `netPuanToplami` kaynaklarını sağlar. |
| `oran.ts` | TypeScript / Lib | raporlama kapsamında `katkiYuzdesi`, `izlenmeOrani`, `tamamlanmaOrani` işlev ve sabitlerini sağlar; oran iş kurallarını tek modülde toplar. |

### 📁 lib/rapor/tclubUretici/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `getYayinDetaylari.ts` | TypeScript / Lib | get Yayin Detaylari kapsamında `getUreticiYayinDetaylari` kaynaklarını sağlar. |

### 📁 lib/rapor/tm/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `getTmDavranis.ts` | TypeScript / Lib | get Tm Davranis kapsamında `getTmKarsilastirma`, `tmRaporKapsami`, `getTmDavranis` kaynaklarını sağlar. |

### 📁 lib/rapor/uretici/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `getUreticiData.ts` | TypeScript / Lib | üretim kapsamında `getUreticiData` işlev ve sabitlerini ve `UreticiSahaOzetSatiri`, `UreticiRaporOzet`, `UreticiData` veri sözleşmelerini sağlar; get üretici Data iş kurallarını tek modülde toplar. |

### 📁 lib/rapor/uretim/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `getTemsilciVaryantOzeti.ts` | TypeScript / Lib | get Temsilci Varyant Ozeti kapsamında `getTemsilciVaryantOzeti` kaynaklarını sağlar. |
| `getUretimData.ts` | TypeScript / Lib | Üretici için kişisel yayın, yönetici için firma kapsamını çözer; SQL kaynaklı varyant ve eğitim türü rapor yanıtlarını hazırlar. |
| `raporRolu.ts` | TypeScript / Lib | rapor Rolu kapsamındaki yardımcı, tip veya çalıştırma kaynağıdır. |

### 📁 lib/rapor/utt/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `getAracPuanDagilimi.ts` | TypeScript / Lib | get Arac Puan Dagilimi kapsamında `getAracPuanDagilimi` kaynaklarını sağlar. |
| `getUttData.ts` | TypeScript / Lib | raporlama kapsamında `getUttData` işlev ve sabitlerini sağlar; get UTT Data iş kurallarını tek modülde toplar. |
| `getUttDavranis.ts` | TypeScript / Lib | get Utt Davranis kapsamında `DAVRANIS_ARACLARI`, `uttDavranisiniHesapla`, `getDavranisGirdisi`, `getUttDavranis` kaynaklarını sağlar. |
| `getUttKatki.ts` | TypeScript / Lib | get Utt Katki kapsamında `getUttKatki` kaynaklarını sağlar. |

### 📁 lib/rapor/yonetici/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `getYoneticiData.ts` | TypeScript / Lib | raporlama kapsamında `getYoneticiData` işlev ve sabitlerini sağlar; get yönetici Data iş kurallarını tek modülde toplar. |
| `getYoneticiDavranis.ts` | TypeScript / Lib | get Yonetici Davranis kapsamında `getYoneticiDavranis` kaynaklarını sağlar. |

### 📁 lib/rehber/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `sayfaRehberi.ts` | TypeScript / Lib | Cogniti kapsamında `VARYANT_ALT_MODAL`, `SAYFA_REHBERLERI` işlev ve sabitlerini ve `AltModalKart`, `AltModalBilgisi`, `RehberMadde` veri sözleşmelerini sağlar; sayfa Rehberi iş kurallarını tek modülde toplar. |

### 📁 lib/soru/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `dosyadanGetir.ts` | TypeScript / Lib | soru seti kapsamında `DESTEKLENEN_UZANTILAR`, `dosyadanTaslaklar` işlev ve sabitlerini ve `DosyaGetirmeSonucu` veri sözleşmelerini sağlar; dosyadan Getir iş kurallarını tek modülde toplar. |
| `izlemeTipleri.ts` | TypeScript / Lib | izleme Tipleri kapsamındaki yardımcı, tip veya çalıştırma kaynağıdır. |
| `kontrol.ts` | TypeScript / Lib | Kullanıcının gönderdiği cevap anahtarlarının atanan sorularla uyuşup uyuşmadığını doğrulayan güvenlik kontrolü. |
| `parse.ts` | TypeScript / Lib | soru seti kapsamında `parseSoruSeti`, `parseSoruSetiEsnek` işlev ve sabitlerini ve `Soru` veri sözleşmelerini sağlar; parse iş kurallarını tek modülde toplar. |
| `secim.ts` | TypeScript / Lib | İçerik havuzundan tohumlu Fisher-Yates algoritmasıyla deterministik ve adil soru seçimi yapan çekirdek kütüphane. |
| `taslak.ts` | TypeScript / Lib | soru seti kapsamında `SECENEK_HARF`, `harfBul`, `bosSoruTaslagi`, `taslaklariDogrula` işlev ve sabitlerini ve `SoruTaslagi` veri sözleşmelerini sağlar; taslak iş kurallarını tek modülde toplar. |

### 📁 lib/supabase/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `client.ts` | TypeScript / Lib | İstemci tarafında (tarayıcı) çalışan Supabase anonim bağlantı istemcisi. |
| `server.ts` | TypeScript / Lib | Next.js Server Component ve Route Handler'lar için çerez tabanlı güvenli Supabase istemcisi. |

### 📁 lib/tclub/hbligi/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `eclubDurumu.ts` | TypeScript / Lib | eclub Durumu kapsamında `ligEclubDurumu`, `ligModulDurumunuUygula` kaynaklarını sağlar. |
| `getBmPerformans.ts` | TypeScript / Lib | T-Club kapsamında `getBmPerformans` işlev ve sabitlerini sağlar; get Bm Performans iş kurallarını tek modülde toplar. |
| `getSahaLig.ts` | TypeScript / Lib | T-Club kapsamında `getSahaLig` işlev ve sabitlerini ve `SahaGorunumu`, `SahaBirimTuru`, `SahaLigKullanici` veri sözleşmelerini sağlar; get Saha lig iş kurallarını tek modülde toplar. |
| `getUreticiEtkiLigi.ts` | TypeScript / Lib | get Uretici Etki Ligi kapsamında `getUreticiEtkiLigi` kaynaklarını sağlar. |
| `getUttLig.ts` | TypeScript / Lib | T-Club kapsamında `getUttLig` işlev ve sabitlerini ve `UttLigSatiri`, `UttLigSonuc` veri sözleşmelerini sağlar; get UTT lig iş kurallarını tek modülde toplar. |
| `ligRpcCagir.ts` | TypeScript / Lib | T-Club kapsamında `ligRpcCagir` işlev ve sabitlerini ve `Periyot`, `LigPeriyot`, `HbLigiHamSatir` veri sözleşmelerini sağlar; lig Rpc Cagir iş kurallarını tek modülde toplar. |
| `siralama.ts` | TypeScript / Lib | T-Club kapsamında `esitPuanEsitSira` işlev ve sabitlerini sağlar; siralama iş kurallarını tek modülde toplar. |
| `ureticiLigKapsami.ts` | TypeScript / Lib | uretici Lig Kapsami kapsamında `ureticiLigKapsaminiUygula`, `ureticiLiginiSirala` kaynaklarını sağlar. |

### 📁 lib/tclub/oneri/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `gorunurluk.ts` | TypeScript / Lib | gorunurluk kapsamında `ONERI_ZAMANI_DEGISTI`, `oneriIzlenebilirMi`, `sonrakiOneriZamanSiniri` kaynaklarını sağlar. |
| `limitKontrol.ts` | TypeScript / Lib | T-Club kapsamında `MAKS_ALICI_HAFTA`, `AYLIK_KOTA_KATSAYI`, `haftalikLimitKontrol`, `aylikKotaKontrol` işlev ve sabitlerini ve `HaftalikLimitSonuc`, `AylikKotaSonuc` veri sözleşmelerini sağlar; limit Kontrol iş kurallarını tek modülde toplar. |
| `pencereKontrol.ts` | TypeScript / Lib | T-Club kapsamında `oneriPenceresiAcik` işlev ve sabitlerini ve `OneriPencereSonuc` veri sözleşmelerini sağlar; pencere Kontrol iş kurallarını tek modülde toplar. |
| `tarihKurali.ts` | TypeScript / Lib | T-Club kapsamında `ONERI_BASLANGIC_SAAT`, `ONERI_BITIS_SAAT`, `oneriTarihKurali` işlev ve sabitlerini ve `TarihKuraliSonuc` veri sözleşmelerini sağlar; tarih Kurali iş kurallarını tek modülde toplar. |
| `yaklasanBitis.ts` | TypeScript / Lib | yaklasan Bitis kapsamında `YAKLASAN_BITIS_SAATI` kaynaklarını sağlar. |

### 📁 lib/tclub/puan/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `kayit.ts` | TypeScript / Lib | T-Club kapsamında `kazanilanPuanKaydet`, `yanlisCevapKaybiKaydet`, `ileriSarmaKaybiKaydet`, `oneriKaybiKaydet` işlev ve sabitlerini sağlar; kayıt iş kurallarını tek modülde toplar. |
| `strateji.ts` | TypeScript / Lib | T-Club kapsamında `izlemeKarariBelirle`, `EXTRA_PUAN_TEKRAR_ESIGI`, `extraPuanEsikKarsilandi` işlev ve sabitlerini ve `IzlemeKarari` veri sözleşmelerini sağlar; strateji iş kurallarını tek modülde toplar. |
| `tekrarSayim.ts` | TypeScript / Lib | T-Club kapsamında `tamTekrarSayisi`, `tamTekrarSayilari` işlev ve sabitlerini sağlar; tekrar Sayim iş kurallarını tek modülde toplar. |
| `tipler.ts` | TypeScript / Lib | T-Club kapsamında `PuanTuru`, `KazanilanPuanParams`, `YanlisCevapKayipParams` veri sözleşmelerini sağlar; tipler iş kurallarını tek modülde toplar. |

### 📁 lib/tclub/store/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `adres.ts` | TypeScript / Lib | T-Club kapsamında `adresleriListele`, `adresEkle`, `adresGuncelle`, `adresSil` işlev ve sabitlerini sağlar; adres iş kurallarını tek modülde toplar. |
| `bakiye.ts` | TypeScript / Lib | T-Club kapsamında `harcamaBakiyesi` işlev ve sabitlerini sağlar; bakiye iş kurallarını tek modülde toplar. |
| `firmaUrun.ts` | TypeScript / Lib | T-Club kapsamında `firmaIcinUrunAktifMi`, `hbstoreFirmaBaglami`, `firmaKapaliUrunIdleri` işlev ve sabitlerini ve `HbstoreFirmaBaglami` veri sözleşmelerini sağlar; firma ürün iş kurallarını tek modülde toplar. |
| `kargo.ts` | TypeScript / Lib | T-Club kapsamında `KARGO_FIRMALARI`, `KARGO_FIRMA_ADLARI`, `kargoTakipUrl` işlev ve sabitlerini sağlar; kargo iş kurallarını tek modülde toplar. |
| `olay.ts` | TypeScript / Lib | T-Club kapsamında `HBSTORE_BAKIYE_DEGISTI`, `hbstoreBakiyesiDegistiBildir` işlev ve sabitlerini sağlar; olay iş kurallarını tek modülde toplar. |
| `sabitler.ts` | TypeScript / Lib | T-Club kapsamında `IPTAL_SURE_SAATI`, `STOK_AZ_ESIK`, `DURUM_ETIKETLERI`, `DURUM_RENKLERI` işlev ve sabitlerini sağlar; sabitler iş kurallarını tek modülde toplar. |
| `siparis.ts` | TypeScript / Lib | T-Club kapsamında `siparisOlustur`, `siparisIptal`, `teslimAldim` işlev ve sabitlerini sağlar; sipariş iş kurallarını tek modülde toplar. |
| `storage.ts` | TypeScript / Lib | T-Club kapsamında `gorselYukle`, `gorselSil`, `urlDenYolCikar` işlev ve sabitlerini ve `YuklemeSonuc`, `SilmeSonuc` veri sözleşmelerini sağlar; storage iş kurallarını tek modülde toplar. |
| `takvim.ts` | TypeScript / Lib | takvim kapsamında `yilDonemPencereleri`, `hbstoreSiparisAcikMi`, `hbstoreTakvimDurumu` kaynaklarını sağlar. |
| `tipler.ts` | TypeScript / Lib | T-Club kapsamında `KayitSonuc`, `SiparisDurum`, `HarcamaTuru` veri sözleşmelerini sağlar; tipler iş kurallarını tek modülde toplar. |

### 📁 lib/tclub/tur/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `ayarlar.ts` | TypeScript / Lib | T-Club kapsamında `tekrarPeriyotSecenekleri` işlev ve sabitlerini sağlar; ayarlar iş kurallarını tek modülde toplar. |
| `kayit.ts` | TypeScript / Lib | T-Club kapsamında `TurAcilisTuru`, `TurKaydiParams`, `TurKaydiSonuc` veri sözleşmelerini sağlar; kayıt iş kurallarını tek modülde toplar. |

### 📁 lib/tema/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `cizimRenkleri.ts` | TypeScript / Lib | cizim Renkleri kapsamında `hesaplananRenk`, `cizimRenkCozucu`, `grafikRenkleriniCoz`, `cizimTemasiniIzle` kaynaklarını sağlar. |
| `hesaplananRenkler.generated.ts` | Üretilmiş TypeScript Kaynağı | Renk üretim betiğinin oluşturduğu tema renk kaydıdır; çalışma zamanı kaynaklarına dahildir ve elle yönetilen renk kaynağıyla karıştırılmaz. |
| `temalar.ts` | TypeScript / Lib | temalar kapsamında `TEMALAR`, `VARSAYILAN_TEMA`, `TEMA_TERCIHI_ANAHTARI`, `TEMA_TERCIHI_SURUM_ANAHTARI` kaynaklarını sağlar. |

### 📁 lib/types/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `rapor.ts` | TypeScript / Lib | raporlama kapsamında `Bolge`, `Takim`, `UrunIzleme` veri sözleşmelerini sağlar; rapor iş kurallarını tek modülde toplar. |

### 📁 lib/uretici/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `talepKaynakSahipligi.ts` | TypeScript / Lib | üretim kapsamında `teknikFirmayaAitMi`, `urunFirmayaAitMi` işlev ve sabitlerini sağlar; talep kaynak Sahipligi iş kurallarını tek modülde toplar. |
| `urunKapsami.ts` | TypeScript / Lib | üretim kapsamında `ureticiUrunListeKapsami`, `ureticiUrunYazmaKapsami` işlev ve sabitlerini ve `UreticiUrunProfili`, `UreticiUrunKapsami` veri sözleşmelerini sağlar; ürün Kapsami iş kurallarını tek modülde toplar. |
| `yetenekler.ts` | TypeScript / Lib | 13 üretici rolün içerik türü yetkilerini, ürün/teknik zorunluluklarını ve form kısıtlarını denetleyen anayasal kural motoru. |

### 📁 lib/uretim/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `gorevSozlesmesi.ts` | TypeScript / Lib | üretim alanında kullanılan `URETIM_GOREV_ASAMALARI`, `UretimGorevAsamasi`, `URETIM_GOREV_DURUMLARI`, `UretimGorevDurumu` veri tiplerini ve modüller arası sözleşmeleri tanımlar. |
| `gorevTipleri.ts` | TypeScript / Lib | üretim kapsamında `UretimGorevAsamasi`, `UretimGorevDurumu`, `UretimGorevTalebi` veri sözleşmelerini sağlar; görev Tipleri iş kurallarını tek modülde toplar. |
| `parametreKontrol.ts` | TypeScript / Lib | üretim kapsamında `hazirParametreKontrol` işlev ve sabitlerini sağlar; parametre Kontrol iş kurallarını tek modülde toplar. |
| `rpc.ts` | TypeScript / Lib | Üretim durum makinesini canlı Supabase RPC'lerine bağlayan çekirdek köprü. |
| `rpcTemel.ts` | TypeScript / Lib | üretim kapsamında `uuidGecerliMi`, `uretimRpcHttpDurumu` işlev ve sabitlerini sağlar; rpc Temel iş kurallarını tek modülde toplar. |
| `toastMesaj.ts` | TypeScript / Lib | 5 üretim aşamasındaki tüm onay ve devir işlemlerinde unvanlı ve iki parçalı toast mesajlarını üreten merkezi motor. |

### 📁 lib/urunler/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `gorunenId.ts` | TypeScript / Lib | gorunen Id kapsamında `gorunenUrunIdHaritasi`, `yayinGorunenUrunIdHaritasi` kaynaklarını sağlar. |

### 📁 lib/utils/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `adSoyadBicimle.ts` | TypeScript / Lib | Cogniti kapsamında `adSoyadBicimle`, `adSoyadCanliBicimle` işlev ve sabitlerini sağlar; ad Soyad Bicimle iş kurallarını tek modülde toplar. |
| `adminGirisKontrol.ts` | TypeScript / Lib | Cogniti kapsamında `adminGirisKontrol` işlev ve sabitlerini sağlar; admin Giris Kontrol iş kurallarını tek modülde toplar. |
| `beniHatirla.ts` | TypeScript / Lib | Cogniti kapsamında `beniHatirlaKaydet`, `oturumDusurulmeliMi`, `beniHatirlaTemizle` işlev ve sabitlerini sağlar; beni Hatirla iş kurallarını tek modülde toplar. |
| `bildirimOlustur.ts` | TypeScript / Lib | bildirim kapsamında `gonderenBildirimleriOkunduIsaretle`, `bildirimOlustur`, `cokluBildirimOlustur` işlev ve sabitlerini ve `BildirimSonucu` veri sözleşmelerini sağlar; bildirim Olustur iş kurallarını tek modülde toplar. |
| `eclubBildirim.ts` | TypeScript / Lib | Cogniti kapsamında `eclubBildirimOlustur`, `eclubCokluBildirimOlustur` işlev ve sabitlerini sağlar; E-Club bildirim iş kurallarını tek modülde toplar. |
| `firmaAdiBicimle.ts` | TypeScript / Lib | Cogniti kapsamında `firmaAdiBicimle` işlev ve sabitlerini sağlar; firma Adi Bicimle iş kurallarını tek modülde toplar. |
| `guvenliDosyaAdi.ts` | TypeScript / Lib | Cogniti kapsamında `guvenliDosyaAdi` işlev ve sabitlerini sağlar; guvenli Dosya Adi iş kurallarını tek modülde toplar. |
| `hataIsle.ts` | TypeScript / Lib | Tüm API route handler'larında standart JSON hata formatı (sunucuHatasi, yetkiHatasi, validasyonHatasi) üreten merkezi hata yöneticisi. |
| `ortam.ts` | TypeScript / Lib | Cogniti kapsamında `canliOrtamMi` işlev ve sabitlerini sağlar; ortam iş kurallarını tek modülde toplar. |
| `periyotAltKirilim.ts` | TypeScript / Lib | Cogniti kapsamında `periyotAltKirilim` işlev ve sabitlerini ve `Dilim` veri sözleşmelerini sağlar; periyot Alt Kirilim iş kurallarını tek modülde toplar. |
| `raporUtils.ts` | TypeScript / Lib | Raporlama sayfalarında kullanılan puan formatlama, dönem etiketleri ve yüzde hesaplama fonksiyonları. |
| `rolCozucu.ts` | TypeScript / Lib | Oturum açan kullanıcının gerçek rolünü v_auth_kimlik_admin view'ı üzerinden tek kaynakta çözen yetkili fonksiyon. |
| `roller.ts` | TypeScript / Lib | Platformdaki tüm rol gruplarını (URETICI_ROLLER, STORE_ALABILEN_ROLLER, YONETICI_ROLLER vb.) tanımlayan tek anayasal kaynak. |
| `talepZinciri.ts` | TypeScript / Lib | Cogniti kapsamında `TALEP_ALANLARI`, `haritalaTalep`, `talepBilgisiSenaryo`, `talepBilgisiVideo` işlev ve sabitlerini ve `TalepBilgisi`, `HamTalepKaydi` veri sözleşmelerini sağlar; talep Zinciri iş kurallarını tek modülde toplar. |
| `tarihAraligi.ts` | TypeScript / Lib | Cogniti kapsamında `tarihAraligi` işlev ve sabitlerini sağlar; tarih Araligi iş kurallarını tek modülde toplar. |
| `uretimSeridi.ts` | TypeScript / Lib | Cogniti kapsamında `adimlariCoz` işlev ve sabitlerini ve `AdimAnahtari`, `AdimHal`, `Adim` veri sözleşmelerini sağlar; üretim Seridi iş kurallarını tek modülde toplar. |
| `uretimZinciri.ts` | TypeScript / Lib | Cogniti kapsamında `zincirHaritasi`, `asamaCoz` işlev ve sabitlerini ve `ZincirAsama`, `ZincirSatiri`, `ZincirDurumu` veri sözleşmelerini sağlar; üretim Zinciri iş kurallarını tek modülde toplar. |
| `yayinKodu.ts` | TypeScript / Lib | yayin Kodu kapsamında `yayin_kodu` kaynaklarını sağlar. |
| `yayinUrun.ts` | TypeScript / Lib | Yayın kaydından ürün ID'sini çözen ve tekilleştiren DRY yardımcı fonksiyonu. |

### 📁 lib/utils/anaSayfa/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `bm.ts` | TypeScript / Lib | Cogniti kapsamında `getBmAnaSayfaVeri` işlev ve sabitlerini sağlar; bm iş kurallarını tek modülde toplar. |
| `iu.ts` | TypeScript / Lib | Cogniti kapsamında `getIuAnaSayfaVeri` işlev ve sabitlerini ve `IsSatiri`, `IuAnaSayfaVeri` veri sözleşmelerini sağlar; iu iş kurallarını tek modülde toplar. |
| `iuDurumEsle.ts` | TypeScript / Lib | Cogniti kapsamında `talepBazindaTekillestir` işlev ve sabitlerini ve `IuKategori` veri sözleşmelerini sağlar; iu durum Esle iş kurallarını tek modülde toplar. |
| `tm.ts` | TypeScript / Lib | Cogniti kapsamında `getTmAnaSayfaVeri` işlev ve sabitlerini sağlar; tm iş kurallarını tek modülde toplar. |
| `utt.ts` | TypeScript / Lib | Cogniti kapsamında `getUttAnaSayfaVeri` ve `getUttOrganizasyonBilgisi` işlevlerini sağlar; 5 dakikalık sunucu içi organizasyon önbelleği (`ORG_CACHE_TTL`) ve UTT iş kurallarını tek modülde toplar. |
| `yonetici.ts` | TypeScript / Lib | Cogniti kapsamında `getYoneticiAnaSayfaVeri` işlev ve sabitlerini sağlar; yönetici iş kurallarını tek modülde toplar. |

### 📁 lib/utils/durum/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `filtre.ts` | TypeScript / Lib | Cogniti kapsamında `uretimDurumSirasi`, `ilkUretimDurumu`, `aktifUretimDurumuCoz` işlev ve sabitlerini ve `DurumSayimi` veri sözleşmelerini sağlar; filtre iş kurallarını tek modülde toplar. |
| `mesaj.ts` | TypeScript / Lib | Cogniti kapsamında `DurumTopu`, `DurumRenk`, `DurumMesaji` veri sözleşmelerini sağlar; mesaj iş kurallarını tek modülde toplar. |

### 📁 lib/utils/senaryo/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `diffHesapla.ts` | TypeScript / Lib | Cogniti kapsamında `senaryoDiffHesapla` işlev ve sabitlerini ve `SenaryoDiffTuru`, `SenaryoDiffParcasi` veri sözleşmelerini sağlar; diff Hesapla iş kurallarını tek modülde toplar. |
| `gonderimKarari.ts` | TypeScript / Lib | Cogniti kapsamında `gonderimKarari` işlev ve sabitlerini ve `SonSatirBilgisi`, `GonderimKarari` veri sözleşmelerini sağlar; gönderim Karari iş kurallarını tek modülde toplar. |

### 📁 lib/video/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `anaSayfaRaflari.ts` | TypeScript / Lib | video altyapısı kapsamında `RAF_LIMIT`, `anaSayfaRaflari` işlev ve sabitlerini ve `RafVideo` veri sözleşmelerini sağlar; ana sayfa Raflari iş kurallarını tek modülde toplar. |
| `anaSayfaVideolari.ts` | TypeScript / Lib | Video altyapısı kapsamında `getAnaSayfaVideolari` ve `getSahaAnaSayfaVideolari` işlevlerini sağlar; ana sayfa video sorgularını ve kart puan zenginleştirmelerini yönetir. |
| `bunnyTusIstemci.ts` | TypeScript / Lib | video altyapısı kapsamında `videoYuklemeOturumuGuncelle`, `bunnyTusYukle` işlev ve sabitlerini ve `BunnyVezneIzni` veri sözleşmelerini sağlar; Bunny Tus Istemci iş kurallarını tek modülde toplar. |
| `bunnyYukleme.ts` | TypeScript / Lib | Bunny Stream TUS API vezne modelini işleten; API anahtarı ifşa olmadan doğrudan CDN yükleme token'ı üreten video motoru. |
| `departman.ts` | TypeScript / Lib | video altyapısı kapsamında `DEPARTMAN_SIRA`, `DEPARTMAN_ETIKET`, `DEPARTMAN_RENK`, `departmanKey` işlev ve sabitlerini ve `DepartmanKey` veri sözleşmelerini sağlar; departman iş kurallarını tek modülde toplar. |
| `enBoyOrani.ts` | TypeScript / Lib | video altyapısı kapsamında `VARSAYILAN_ORAN`, `DIKEY_ESIGI`, `enBoyOrani`, `dikeyMi` işlev ve sabitlerini sağlar; en Boy Orani iş kurallarını tek modülde toplar. |
| `gorunurluk.ts` | TypeScript / Lib | video altyapısı kapsamında `gorunenTurler`, `kapsamGenisMi`, `tuketiciMi`, `videoBolumuVarMi` işlev ve sabitlerini sağlar; gorunurluk iş kurallarını tek modülde toplar. |
| `hazirVideoTamamla.ts` | TypeScript / Lib | Hazır video üretim zincirini atomik RPC ile tamamlar; Bunny işleme durumuna göre süre ve metadata doğrulamasını kaydeder. |
| `icerikTuru.ts` | TypeScript / Lib | video altyapısı kapsamında `TUR_BASLIK`, `TUR_SIRA`, `TUR_RAPOR_ADI`, `isIcerikTuru` işlev ve sabitlerini sağlar; icerik Turu iş kurallarını tek modülde toplar. |
| `islemeDurumu.ts` | TypeScript / Lib | video altyapısı kapsamında `SORGU_ARALIGI_SANIYE`, `SORGU_ARALIGI_MS`, `TAVAN_SANIYE` işlev ve sabitlerini ve `BunnySorguSonucu`, `IslemeDurumu`, `PollingKarari` veri sözleşmelerini sağlar; işleme Durumu iş kurallarını tek modülde toplar. |
| `katalogOnbellek.ts` | TypeScript / Lib | katalog Onbellek kapsamında `getKatalogOnbellek`, `setKatalogOnbellek`, `prefetchYayinKatalog` kaynaklarını sağlar. |
| `thumbnail.ts` | TypeScript / Lib | video altyapısı kapsamında `thumbnailUrlUret` işlev ve sabitlerini sağlar; thumbnail iş kurallarını tek modülde toplar. |
| `uttVideoKategorileri.ts` | TypeScript / Lib | video altyapısı kapsamında `UTT_VIDEO_KATEGORILERI`, `uttVideoKategorisiBul` işlev ve sabitlerini sağlar; UTT video Kategorileri iş kurallarını tek modülde toplar. |
| `videoPlayer.ts` | TypeScript / Lib | video altyapısı kapsamında `detectProvider`, `bunnyEmbedUrl` işlev ve sabitlerini ve `VideoPlayer`, `Provider`, `PlayerJsInstance` veri sözleşmelerini sağlar; video Player iş kurallarını tek modülde toplar. |
| `yayinVideoBildirim.ts` | TypeScript / Lib | yayin Video Bildirim kapsamında `yayinVideoSonucunuBildir` kaynaklarını sağlar. |
| `yayindakiVideolar.ts` | TypeScript / Lib | Video altyapısı kapsamında `getYayindakiVideolar` işlevini sağlar; yayındaki videoların klasör, hedef rol, kategori ve HOYK kart verilerini yönetir. |

### 📁 lib/zaman/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `kontrol.ts` | TypeScript / Lib | Sistem genelindeki Gün, Hafta, Ay, Dönem ve Yıl başlangıç ve bitişlerini Kanonik Zaman Değerleri sözleşmesine ve Türkiye saat dilimine göre hesaplayan zaman motoru. |
| `turkiye.ts` | TypeScript / Lib | turkiye kapsamında `TR_SAAT_DILIMI`, `trZamanParcalari`, `trZamanUtc`, `formatKalanSure` kaynaklarını sağlar. |

## 8. COMPONENTS, HOOKS, TYPES VE YEREL ARAÇLAR

### 📁 components/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `DosyaGoruntuleListesi.tsx` | UI / React | Dosya Goruntule Listesi, HapBilgi kayıtlarını listeleyip yükleme, seçim veya filtreleme etkileşimlerini yönetir. |
| `DurumAnahtari.tsx` | UI / React | durum Anahtari, Cogniti ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `HataMesaji.tsx` | UI / React | Hata Mesaji, Cogniti ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `SenaryoMetniGoster.tsx` | UI / React | senaryo Metni Goster, Cogniti ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `SoruIceAktar.tsx` | UI / React | soru Ice Aktar, Cogniti ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `SoruSetiFormu.tsx` | UI / React | soru Seti Formu, HapBilgi işleminde gerekli soru seti girdilerini toplar ve kullanıcı doğrulamalarını görünür kılar. |

### 📁 components/ana-sayfa/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `BmAnaSayfa.tsx` | UI / React | Bölge Müdürü operasyonel karşılama, göstergeler, `HayaletTanburSecici` ve `MobilYayinAkisi` destekli video bölümlerini sunan bileşendir. |
| `IuAnaSayfa.tsx` | UI / React | İÜ operasyonel karşılama, bekleyen işler ve teslim listesini sunan React bileşenidir. |
| `SahaVideoRaflari.tsx` | UI / React | Saha video raflarını masaüstünde yatay raf, mobilde `MobilYayinAkisi` (2+5 dikey liste) ve `YayinKarti` ile sunan bileşendir. |
| `TmAnaSayfa.tsx` | UI / React | Takım Müdürü operasyonel karşılama, göstergeler, `HayaletTanburSecici` ve `MobilYayinAkisi` destekli video bölümlerini sunan bileşendir. |
| `UttAnaSayfa.tsx` | UI / React | UTT operasyonel karşılama, sayaçlar, Store pill'i, `sessionStorage` önbelleği, `HayaletTanburSecici` ve `MobilYayinAkisi` ile 2+5 dikey yayın akışını sunan bileşendir. |
| `VideoBolumu.tsx` | UI / React | BM ve TM ana sayfalarında video bölümlerini masaüstünde yatay raf, mobilde `MobilYayinAkisi` (2+5 dikey liste) ile sunan bileşendir. |
| `YoneticiAnaSayfa.tsx` | UI / React | 7 yönetici rolü için firma göstergeleri, `HayaletTanburSecici` ve `MobilYayinAkisi` destekli yayın listesini sunan ana sayfa bileşenidir. |

### 📁 components/auth/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `DavetSifreKarti.tsx` | UI / React | Davet Sifre Karti arayüz bileşenini veya sağlayıcısını tanımlar. |
| `SifreBelirlemeFormu.tsx` | UI / React | Sifre Belirleme Formu arayüz bileşenini veya sağlayıcısını tanımlar. |

### 📁 components/cc-ligi/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `CcChallengeListesi.tsx` | UI / React | Cc Challenge Listesi, C-Club kayıtlarını listeleyip yükleme, seçim veya filtreleme etkileşimlerini yönetir. |
| `CcLigiBanner.tsx` | UI / React | Cc Ligi Banner, C-Club ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `CcLigiPeriyotSecici.tsx` | UI / React | Cc Ligi Periyot Secici, C-Club ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `CcLigiSkeleton.tsx` | UI / React | Cc Ligi Skeleton arayüz bileşenini veya sağlayıcısını tanımlar. |
| `CcLigiTablosu.tsx` | UI / React | Cc Ligi Tablosu, C-Club verilerini sıralı tablo görünümünde ve ilgili kullanıcı eylemleriyle sunar. |
| `CcTakimLigAkordeonu.tsx` | UI / React | Cc takım lig Akordeonu, C-Club ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |

### 📁 components/challenge-club/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `CcVideoOynatici.tsx` | UI / React | Cc video Oynatici, ilgili öğrenme aracını gösteren ve C-Club ilerleme/tamamlama akışına bağlayan oynatıcı bileşenidir. |
| `ChallengeGonderPaneli.tsx` | UI / React | Challenge Gonder Paneli, C-Club kapsamındaki challenge gonder verilerini ve işlemlerini tek panelde birleştirir. |

### 📁 components/eclub/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `BannerRafi.tsx` | UI / React | Banner Rafi arayüz bileşenini veya sağlayıcısını tanımlar. |
| `DepoAramaliSecim.tsx` | UI / React | Depo Aramali Secim arayüz bileşenini veya sağlayıcısını tanımlar. |
| `DepoTercihFormu.tsx` | UI / React | Depo Tercih Formu arayüz bileşenini veya sağlayıcısını tanımlar. |
| `EclubAnaSayfaSkeleton.tsx` | UI / React | Eclub Ana Sayfa Skeleton arayüz bileşenini veya sağlayıcısını tanımlar. |
| `EclubCekTakipVitrinKarti.tsx` | UI / React | Eclub Cek Takip Vitrin Karti arayüz bileşenini veya sağlayıcısını tanımlar. |
| `EclubCekTalepVitrinKarti.tsx` | UI / React | Eclub Cek Talep Vitrin Karti arayüz bileşenini veya sağlayıcısını tanımlar. |
| `EclubFirmaCalismaAlani.tsx` | UI / React | Eclub Firma Calisma Alani arayüz bileşenini veya sağlayıcısını tanımlar. |
| `EclubFirmaCekTakibiSkeleton.tsx` | UI / React | Eclub Firma Cek Takibi Skeleton arayüz bileşenini veya sağlayıcısını tanımlar. |
| `EclubFirmaCekTalebiSkeleton.tsx` | UI / React | Eclub Firma Cek Talebi Skeleton arayüz bileşenini veya sağlayıcısını tanımlar. |
| `EclubFirmaPerformansSkeleton.tsx` | UI / React | Eclub Firma Performans Skeleton arayüz bileşenini veya sağlayıcısını tanımlar. |
| `EclubFirmaSecimi.tsx` | UI / React | Eclub Firma Secimi arayüz bileşenini veya sağlayıcısını tanımlar. |
| `EclubFirmaYayinlarSkeleton.tsx` | UI / React | Eclub Firma Yayinlar Skeleton arayüz bileşenini veya sağlayıcısını tanımlar. |
| `EclubFirmalarSkeleton.tsx` | UI / React | Eclub Firmalar Skeleton arayüz bileşenini veya sağlayıcısını tanımlar. |
| `EclubHaftalikPuanBirikimi.tsx` | UI / React | Eclub Haftalik Puan Birikimi arayüz bileşenini veya sağlayıcısını tanımlar. |
| `EclubHediyeCekiBilgiPaneli.tsx` | UI / React | Eclub Hediye Ceki Bilgi Paneli arayüz bileşenini veya sağlayıcısını tanımlar. |
| `EclubHediyeCekiGunleriPill.tsx` | UI / React | Eclub Hediye Ceki Gunleri Pill arayüz bileşenini veya sağlayıcısını tanımlar. |
| `EclubHoykSureCercevesi.tsx` | UI / React | Eclub Hoyk Sure Cercevesi arayüz bileşenini veya sağlayıcısını tanımlar. |
| `EclubKisiBanner.tsx` | UI / React | Eclub Kisi Banner arayüz bileşenini veya sağlayıcısını tanımlar. |
| `EclubKisiSayfa.tsx` | UI / React | E-Club kişi sayfa, E-Club ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `EclubLigiSkeleton.tsx` | UI / React | Eclub Ligi Skeleton arayüz bileşenini veya sağlayıcısını tanımlar. |
| `EclubYayinPerformansi.tsx` | UI / React | Eclub Yayin Performansi arayüz bileşenini veya sağlayıcısını tanımlar. |
| `UttGonderimIncelemesi.tsx` | UI / React | Utt Gonderim Incelemesi arayüz bileşenini veya sağlayıcısını tanımlar. |
| `eclub-bilgi-paneli.module.css` | Stil / CSS | eclub bilgi paneli.module yüzeyinin yerleşim, tema ve responsive stillerini tanımlar. |
| `eclub-kisi-banner.module.css` | Stil / CSS | eclub kisi banner.module yüzeyinin yerleşim, tema ve responsive stillerini tanımlar. |
| `eclub-performans.module.css` | Stil / CSS | eclub performans.module yüzeyinin yerleşim, tema ve responsive stillerini tanımlar. |

### 📁 components/eczanem/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `EczanemSayfaBanner.tsx` | UI / React | Eczanem Sayfa Banner arayüz bileşenini veya sağlayıcısını tanımlar. |

### 📁 components/grafik/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `EChart.tsx` | UI / React | EChart, Cogniti ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |

### 📁 components/hbligi/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `HbLigiPeriyotSecici.tsx` | UI / React | Hb Ligi Periyot Secici, T-Club ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |

### 📁 components/hbligi/field/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `FieldLeaguePage.tsx` | UI / React | Field League Page, T-Club ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `TakimLigAkordeonu.tsx` | UI / React | takım lig Akordeonu, T-Club ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `field.module.css` | Stil / CSS | T-Club görünümünün yerleşim, renk, tipografi ve responsive davranışlarını tanımlayan stil dosyasıdır. |

### 📁 components/hbligi/league/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `BmLeaguePage.tsx` | UI / React | Bm League Page arayüz bileşenini veya sağlayıcısını tanımlar. |
| `CompetitorComparison.tsx` | UI / React | Competitor Comparison, T-Club ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `LeadershipInsight.tsx` | UI / React | Leadership Insight, T-Club ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `LeadershipPath.tsx` | UI / React | Leadership Path, T-Club ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `LeadershipProfile.tsx` | UI / React | Leadership Profile, T-Club ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `LeadershipScore.tsx` | UI / React | Leadership Score, T-Club ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `LeagueHeader.tsx` | UI / React | League Header, T-Club ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `LeaguePage.tsx` | UI / React | League Page, T-Club ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `LeaguePodium.tsx` | UI / React | League Podium, T-Club ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `MonthlyLeaders.tsx` | UI / React | Monthly Leaders arayüz bileşenini veya sağlayıcısını tanımlar. |
| `ScoreComposition.tsx` | UI / React | Score Composition, T-Club ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `TmLeaguePage.tsx` | UI / React | Tm League Page arayüz bileşenini veya sağlayıcısını tanımlar. |
| `kursuYerlesimi.ts` | TypeScript / Lib | kursu Yerlesimi kapsamında `kursuYerlesimi` kaynaklarını sağlar. |
| `league.module.css` | Stil / CSS | T-Club görünümünün yerleşim, renk, tipografi ve responsive davranışlarını tanımlayan stil dosyasıdır. |
| `types.ts` | TypeScript / Lib | types, T-Club ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `util.ts` | TypeScript / Lib | util, T-Club ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |

### 📁 components/hbligi/producer/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `ProducerLeaguePage.tsx` | UI / React | Producer League Page arayüz bileşenini veya sağlayıcısını tanımlar. |

### 📁 components/izle/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `VideoOynatici.tsx` | UI / React | video Oynatici, ilgili öğrenme aracını gösteren ve HapBilgi ilerleme/tamamlama akışına bağlayan oynatıcı bileşenidir. |

### 📁 components/kontrol/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `KisiKontroller.tsx` | UI / React | Kisi Kontroller arayüz bileşenini veya sağlayıcısını tanımlar. |
| `README.md` | Dokümantasyon | README konusundaki proje açıklama, plan veya kayıtlarını tutar. |
| `SadeKontroller.tsx` | UI / React | Seçici, sekme, kapsül filtre, dönem/ay/tarih seçimi ve işlem kontrollerinin ortak görünüm ve etkileşim bileşenlerini sağlar. |
| `sade-kontroller.module.css` | Stil / CSS | sade kontroller.module yüzeyinin yerleşim, tema ve responsive stillerini tanımlar. |

### 📁 components/liste/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `DahaFazlaGoster.tsx` | UI / React | Daha Fazla Goster, Cogniti ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `IcerikFiltreBari.tsx` | UI / React | Arama alanı seçimi, metin araması ve durum filtrelerini tek satırda birleştiren ve akışı sıfırlayan ortak filtreleme çubuğudur. |
| `ListeArama.tsx` | UI / React | liste Arama, Cogniti ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `index.ts` | TypeScript / Lib | Liste bileşenlerini ve kancalarını dışa aktaran modül giriş noktasıdır. |
| `useListe.ts` | TypeScript / Lib | Liste arama, filtreleme, sayfalama ve mobil akış sıfırlama durumlarını yöneten ortak kancadır. |

### 📁 components/marka/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `CognitiLogo.tsx` | UI / React | Cogniti logosunu ortak bileşen üzerinden sunar. |

### 📁 components/navigasyon/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `HayaletTanburSecici.tsx` | UI / React | Yalnızca mobilde sağ kenardan açılan; 3D silindir tipi dikey bölüm navigasyonu sağlayan, arka plan kaydırmasını kilitleyen ve seçilen bölümü sayfa state'ine bağlayan bileşendir. |

### 📁 components/ogrenme-araci/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `AracVarsayilanKapak.tsx` | UI / React | Arac Varsayilan Kapak arayüz bileşenini veya sağlayıcısını tanımlar. |
| `DagitimIcerikOzeti.tsx` | UI / React | Dagitim Icerik Ozeti arayüz bileşenini veya sağlayıcısını tanımlar. |
| `FlipPdfOynatici.tsx` | UI / React | Flip Pdf Oynatici, ilgili öğrenme aracını gösteren ve ortak öğrenme aracı ilerleme/tamamlama akışına bağlayan oynatıcı bileşenidir. |
| `GorselOynatici.tsx` | UI / React | Dijital Broşür Oynatici, ilgili öğrenme aracını gösteren ve ortak öğrenme aracı ilerleme/tamamlama akışına bağlayan oynatıcı bileşenidir. |
| `OgrenmeAraciOnizleme.tsx` | UI / React | öğrenme Araci Onizleme, ortak öğrenme aracı ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `PodcastKapakGorseli.tsx` | UI / React | Podcast kapak görseli veya yüklenmediğinde varsayılan Apple Podcasts simgeli ve ürün adlı kapağı görüntüleyen ortak bileşendir. |
| `PodcastOynatici.tsx` | UI / React | Podcast Oynatici, ilgili öğrenme aracını gösteren ve ortak öğrenme aracı ilerleme/tamamlama akışına bağlayan oynatıcı bileşenidir. |
| `TuketimOynaticisi.tsx` | UI / React | Tuketim Oynaticisi arayüz bileşenini veya sağlayıcısını tanımlar. |
| `YarimYuklemeBildirimi.tsx` | UI / React | yarım yükleme Bildirimi, ortak öğrenme aracı ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `YayinTuruFiltresi.tsx` | UI / React | Yayin Turu Filtresi arayüz bileşenini veya sağlayıcısını tanımlar. |
| `YayinTuruPill.tsx` | UI / React | Dört öğrenme aracı türü için standart ve kart boyutu varyantlarıyla tür rozeti render eden ortak bileşendir. |

### 📁 components/panel/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `BilgiSayfa.tsx` | UI / React | bilgi sayfa, Cogniti ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `MobilDrawer.tsx` | UI / React | Ortak mobil gezinme çekmecesidir; verilen menü ağacını ve bilgi yollarını rol/kimlik kapsamıyla çizer, kapsam seçimi veya gezinmede kapanır. |
| `PanelKabugu.tsx` | UI / React | İç panel ve Eczanem üyeleri için Navbar, sol menü, mobil menü ve kaydırılan içerik yerleşimini paylaşır; kimlik ve veri işlemlerini bağlayıcıya bırakır. |
| `PanelNavbar.tsx` | UI / React | Kullanıcı profil, rol, lig sırası ve sipariş puanı göstergelerini sunan; mobil navbar sayaç tekrarı arındırılmış ve net ayraçlı özet kapsüle sahip üst gezinme çubuğudur. |
| `SolListe.tsx` | UI / React | Ortak masaüstü gezinme listesidir; rol/kimlik kapıları, rozetler, rota bağlantıları ve çok katmanlı kapsam seçimlerini verilen menü verisinden çizer. |
| `YayinSonucBildirimi.tsx` | UI / React | Yayin Sonuc Bildirimi arayüz bileşenini veya sağlayıcısını tanımlar. |
| `panelNav.config.ts` | TypeScript / Lib | Panel gezinme çubuğunun menü öğelerini, rol bazlı görünürlük haritasını ve bildirim sayaç yapılandırmasını tanımlar. |

### 📁 components/panel/bilgi/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `CognitiHakkinda.tsx` | UI / React | Cogniti Hakkinda arayüz bileşenini veya sağlayıcısını tanımlar. |
| `cogniti-hakkinda.module.css` | Stil / CSS | cogniti hakkinda.module yüzeyinin yerleşim, tema ve responsive stillerini tanımlar. |

### 📁 components/pill/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `AsamaPill.tsx` | UI / React | Asama Pill, Cogniti ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `DurumPill.tsx` | UI / React | durum Pill, Cogniti ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `HedefRolPill.tsx` | UI / React | Hedef rol Pill, Cogniti ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `Pill.tsx` | UI / React | Pill, Cogniti ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `TeknikPill.tsx` | UI / React | teknik Pill, Cogniti ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `VaryantPill.tsx` | UI / React | Varyant Pill, Cogniti ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `index.ts` | TypeScript / Lib | index, Cogniti ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |

### 📁 components/raporlar/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `BegeniFavoriListesi.tsx` | UI / React | beğeni favori Listesi, raporlama kayıtlarını listeleyip yükleme, seçim veya filtreleme etkileşimlerini yönetir. |
| `BmPerformansGorunumu.tsx` | UI / React | Bm Performans Gorunumu, raporlama ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `DagilimGrafik.tsx` | UI / React | Dagilim Grafik, raporlama ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `DavranisRaporu.tsx` | UI / React | Davranis Raporu arayüz bileşenini veya sağlayıcısını tanımlar. |
| `OgrenmeAraciPerformansi.module.css` | Stil / CSS | Ogrenme Araci Performansi.module yüzeyinin yerleşim, tema ve responsive stillerini tanımlar. |
| `OgrenmeAraciPerformansi.tsx` | UI / React | Dört öğrenme aracının SQL kaynaklı tüketim, puan, potansiyel ve rol özetlerini; sayfalı yayın etkileşim detaylarını gösterir. |
| `RaporPeriyotSecici.tsx` | UI / React | Rapor Periyot Secici arayüz bileşenini veya sağlayıcısını tanımlar. |
| `TemsilciSecici.tsx` | UI / React | Temsilci Secici arayüz bileşenini veya sağlayıcısını tanımlar. |
| `UrunKirilimPaneli.tsx` | UI / React | ürün Kirilim Paneli, raporlama kapsamındaki ürün kirilim verilerini ve işlemlerini tek panelde birleştirir. |
| `YayinDetayModal.tsx` | UI / React | Yayin Detay Modal arayüz bileşenini veya sağlayıcısını tanımlar. |
| `YayinKonuPerformansi.module.css` | Stil / CSS | Yayin Konu Performansi.module yüzeyinin yerleşim, tema ve responsive stillerini tanımlar. |
| `YayinKonuPerformansi.tsx` | UI / React | Eğitim türü özetini ve ürün kulakçıklarıyla seçilen ürünün kazanılan, kaybedilen ve net puan dağılımını gösterir. |

### 📁 components/rehber/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `SayfaRehberi.tsx` | UI / React | sayfa Rehberi, Cogniti ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `UretimVaryantlariModal.tsx` | UI / React | Uretim Varyantlari Modal arayüz bileşenini veya sağlayıcısını tanımlar. |

### 📁 components/soru/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `IzlemeSoruPaneli.tsx` | UI / React | Izleme Soru Paneli arayüz bileşenini veya sağlayıcısını tanımlar. |

### 📁 components/store/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `AdresModal.tsx` | UI / React | Adres Modal, HBStore kapsamındaki adres işlemini açılır pencerede yöneten React bileşenidir. |

### 📁 components/talep/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `TalepKlasorleri.tsx` | UI / React | talep Klasorleri, Cogniti ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |

### 📁 components/tclub/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `TClubPageSkeleton.tsx` | UI / React | TClub Page Skeleton arayüz bileşenini veya sağlayıcısını tanımlar. |

### 📁 components/tema/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `TemaSecici.tsx` | UI / React | Tema Secici arayüz bileşenini veya sağlayıcısını tanımlar. |
| `tema-secici.module.css` | Stil / CSS | tema secici.module yüzeyinin yerleşim, tema ve responsive stillerini tanımlar. |

### 📁 components/ui/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `alert-dialog.tsx` | UI / React | alert dialog, Cogniti ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `avatar.tsx` | UI / React | avatar, Cogniti ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `badge.tsx` | UI / React | badge, Cogniti ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `button.tsx` | UI / React | button, Cogniti ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `card.tsx` | UI / React | card, Cogniti ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `collapsible.tsx` | UI / React | collapsible, Cogniti ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `input.tsx` | UI / React | input, Cogniti ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `label.tsx` | UI / React | label, Cogniti ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `periyot-butonlari.tsx` | UI / React | periyot butonlari arayüz bileşenini veya sağlayıcısını tanımlar. |
| `progress.tsx` | UI / React | progress, Cogniti ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `sayfa-yenile-basligi.tsx` | UI / React | sayfa yenile basligi arayüz bileşenini veya sağlayıcısını tanımlar. |
| `sayfa-yenile.module.css` | Stil / CSS | sayfa yenile.module yüzeyinin yerleşim, tema ve responsive stillerini tanımlar. |
| `select.tsx` | UI / React | select, Cogniti ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `table.tsx` | UI / React | table, Cogniti ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `tarih-pill.module.css` | Stil / CSS | tarih pill.module yüzeyinin yerleşim, tema ve responsive stillerini tanımlar. |
| `tarih-pill.tsx` | UI / React | tarih pill arayüz bileşenini veya sağlayıcısını tanımlar. |
| `tooltip.tsx` | UI / React | tooltip, Cogniti ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `yenile-butonu.tsx` | UI / React | yenileme butonu, Cogniti ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |

### 📁 components/uretim/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `UretimGorevListesi.tsx` | UI / React | üretim görev Listesi, üretim kayıtlarını listeleyip yükleme, seçim veya filtreleme etkileşimlerini yönetir. |

### 📁 components/video/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `UttVideoKarti.tsx` | UI / React | UTT video kartı arayüzünü `YayinKarti` (HOYK) kanonik bileşeni üzerinden geriye dönük uyumlulukla sunan sarmalayıcı bileşendir. |
| `VideoCercevesi.tsx` | UI / React | video Cercevesi, video altyapısı ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `VideoOnizleme.tsx` | UI / React | video Onizleme, video altyapısı ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |
| `useVideoEtkilesimKatmani.ts` | TypeScript / Lib | use video etkileşim Katmani, video altyapısı ekranındaki ilgili bilgileri ve kullanıcı eylemlerini sunan React bileşenidir. |

### 📁 components/yayin/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `BmEgitimYayinlari.tsx` | UI / React | Bm Egitim Yayinlari arayüz bileşenini veya sağlayıcısını tanımlar. |
| `BmOneriGonderimPaneli.tsx` | UI / React | Bm Oneri Gonderim Paneli arayüz bileşenini veya sağlayıcısını tanımlar. |
| `BmOneriSecimi.tsx` | UI / React | Bm Oneri Secimi arayüz bileşenini veya sağlayıcısını tanımlar. |
| `EgitimYayinFiltreleri.tsx` | UI / React | Egitim Yayin Filtreleri arayüz bileşenini veya sağlayıcısını tanımlar. |
| `MobilYayinAkisi.tsx` | UI / React | Tüm yayın yüzeylerinde mobilde 2+5 dikey liste akışını yöneten; filtre ve arama alanı değişiminde 2 kayda sıfırlanan, masaüstünde grid/raf düzenini koruyan kanonik liste motorudur. |
| `UttYayinListeOrtaklari.tsx` | UI / React | Utt Yayin Liste Ortaklari arayüz bileşenini veya sağlayıcısını tanımlar. |
| `YayinKarti.tsx` | UI / React | HapBilgi Ortak Yayın Kartı (HOYK); thumbnail, tür pill'i, metrikler, duyarlı mobil/masaüstü tipografi, genişletme alanları (`solUstRozet`, `sagUstEkRozet`, `puanYaniRozet`, `altEkIcerik`, `hoverOverlay`), Video puanı ve Extra izleme puanı rozetlerini birleştiren kanonik kart bileşenidir. |
| `egitim-yayin-filtreleri.module.css` | Stil / CSS | egitim yayin filtreleri.module yüzeyinin yerleşim, tema ve responsive stillerini tanımlar. |

### 📁 components/yayin/katalog/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `UreticiYayinKatalogu.tsx` | UI / React | Uretici Yayin Katalogu arayüz bileşenini veya sağlayıcısını tanımlar. |
| `YayindakiVideoBolumu.tsx` | UI / React | Yayindaki Video Bolumu arayüz bileşenini veya sağlayıcısını tanımlar. |

### 📁 hooks/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `useBunnyIslemeDurumu.ts` | TypeScript / Lib | use Bunny Isleme Durumu hook'u, Cogniti ekranlarının veri yükleme, durum ve kullanıcı eylemlerini ortaklaştırır. |
| `useEclubStoreTakvim.ts` | TypeScript / Lib | use Eclub Store Takvim kapsamında `useEclubStoreTakvim` kaynaklarını sağlar. |
| `useHbstoreTakvim.ts` | TypeScript / Lib | use Hbstore Takvim kapsamında `useHbstoreTakvim` kaynaklarını sağlar. |
| `useOkunmamisIdler.ts` | TypeScript / Lib | use Okunmamis Idler hook'u, Cogniti ekranlarının veri yükleme, durum ve kullanıcı eylemlerini ortaklaştırır. |
| `useRapor.ts` | TypeScript / Lib | use rapor hook'u, Cogniti ekranlarının veri yükleme, durum ve kullanıcı eylemlerini ortaklaştırır. |
| `useRaporModulDurumu.ts` | TypeScript / Lib | use Rapor Modul Durumu kapsamında `useRaporModulDurumu` kaynaklarını sağlar. |
| `useUretimDurumFiltresi.ts` | TypeScript / Lib | use üretim durum Filtresi hook'u, Cogniti ekranlarının veri yükleme, durum ve kullanıcı eylemlerini ortaklaştırır. |

### 📁 tools/eslint-rules/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `index.mjs` | Script / Node.js | index denetimini veya bakım işlemini komut satırından yürüten Node.js betiğidir. |

### 📁 types/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `auth.ts` | TypeScript / Lib | Cogniti kapsamında `KimlikTuru`, `AuthKullanici` veri sözleşmelerini sağlar; kimlik doğrulama iş kurallarını tek modülde toplar. |

## 9. SCRİPTS, TEST VE ALTYAPI KATMANI

### 📁 infra/bunny/ogrenme-araci-upload/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `README.md` | Dokümantasyon | “Öğrenme Aracı Upload Edge Script” kapsamındaki kararları, planı veya doğrulama kayıtlarını tutan proje belgesidir. |
| `index.ts` | TypeScript / Lib | ortak öğrenme aracı kapsamında index iş akışının dahili yardımcılarını ve kurallarını uygular. |
| `package-lock.json` | Bağımlılık Kilidi | Bu alt projenin NPM bağımlılık ağını kesin sürüm ve bütünlük özetleriyle kilitler. |
| `package.json` | JSON / Yapılandırma | Bu alt projenin bağımlılıklarını ve çalıştırma/derleme komutlarını tanımlar. |
| `tsconfig.json` | JSON / Yapılandırma | Bu alt projenin TypeScript derleme ve modül çözümleme kurallarını tanımlar. |

### 📁 scripts/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `backfill-video-suresi.mjs` | Script / Node.js | backfill video suresi denetimini veya bakım işlemini komut satırından yürüten Node.js betiğidir. |

### 📁 scripts/denetim/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `admin-eczanem-uyeleri-dogrula.mjs` | Script / Denetim | admin eczanem uyeleri dogrula kapsamındaki yardımcı, tip veya çalıştırma kaynağıdır. |
| `denetim-sonuc.json` | JSON / Yapılandırma | denetim sonuc için yapılandırma veya veri kaydıdır. |
| `denetle.cjs` | Script / Node.js | denetle denetimini veya bakım işlemini komut satırından yürüten Node.js betiğidir. |
| `eclub-banner-dogrula.mjs` | Script / Denetim | eclub banner dogrula kapsamındaki yardımcı, tip veya çalıştırma kaynağıdır. |
| `eclub-cek-talepleri-gorunumu-dogrula.mjs` | Script / Denetim | eclub cek talepleri gorunumu dogrula kapsamındaki yardımcı, tip veya çalıştırma kaynağıdır. |
| `eclub-puan-kapanisi-dogrula.mjs` | Script / Denetim | eclub puan kapanisi dogrula kapsamındaki yardımcı, tip veya çalıştırma kaynağıdır. |
| `hedef-roller-dogrula.cjs` | Script / Node.js | hedef roller doğrulama denetimini veya bakım işlemini komut satırından yürüten Node.js betiğidir. |
| `hesaplanan-renkleri-uret.mjs` | Script / Denetim | hesaplanan renkleri uret kapsamında `HESAPLANAN_RENKLER` kaynaklarını sağlar. |
| `kod-tara.cjs` | Script / Node.js | kod tara denetimini veya bakım işlemini komut satırından yürüten Node.js betiğidir. |
| `kontrol-standardi.mjs` | Script / Denetim | kontrol standardi kapsamındaki yardımcı, tip veya çalıştırma kaynağıdır. |
| `kullanim.json` | JSON / Yapılandırma | kullanim için yapılandırma veya veri kaydıdır. |
| `ogrenme-araclari-bunny-canli-dogrula.mjs` | Script / Node.js | öğrenme araçları Bunny canli doğrulama denetimini veya bakım işlemini komut satırından yürüten Node.js betiğidir. |
| `renk-envanteri.mjs` | Script / Denetim | renk envanteri kapsamındaki yardımcı, tip veya çalıştırma kaynağıdır. |
| `sema-cek.cjs` | Script / Node.js | sema cek denetimini veya bakım işlemini komut satırından yürüten Node.js betiğidir. |
| `sema.json` | JSON / Şema Görüntüsü | 29 Eylül 2026 depo şema anlık görüntüsüdür; üst bilgi 123 tablo/206 RPC bildirirken listelenen sözlüklerde 122 tablo/203 RPC bulunur. Canlı şema doğrulaması değildir. |

### 📁 scripts/denetim/tutarlilik/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `calistir.cjs` | Script / Node.js | calistir denetimini veya bakım işlemini komut satırından yürüten Node.js betiğidir. |
| `td01-uretim-zinciri.sql` | SQL / Denetim | Cogniti kapsamında td01 üretim zinciri için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar. |
| `td02-hedef-rol-gecerlilik.sql` | SQL / Denetim | Cogniti kapsamında td02 hedef rol gecerlilik için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar. |
| `td03-rol-izleme-uyumu.sql` | SQL / Denetim | Cogniti kapsamında td03 rol izleme uyumu için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar. |
| `td04-tur-tutarliligi.sql` | SQL / Denetim | Cogniti kapsamında td04 tur tutarliligi için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar. |
| `td05-extra-tekligi.sql` | SQL / Denetim | Cogniti kapsamında td05 extra tekligi için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar. |
| `td06-puansiz-pencere.sql` | SQL / Denetim | Cogniti kapsamında td06 puansiz pencere için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar. |
| `td07-kazanim-kayip-simetrisi.sql` | SQL / Denetim | Cogniti kapsamında td07 kazanim kayip simetrisi için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar. |
| `td08-eczanem-ledger.sql` | SQL / Denetim | Cogniti kapsamında td08 Eczanem ledger için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar. |
| `td09-teklikler.sql` | SQL / Denetim | Cogniti kapsamında td09 teklikler için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar. |
| `td10-kimlik-duzlemleri.sql` | SQL / Denetim | Cogniti kapsamında td10 kimlik duzlemleri için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar. |
| `td11-rapor-lig-birebirligi.sql` | SQL / Denetim | Cogniti kapsamında td11 rapor lig birebirligi için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar. |
| `td12-eczanem-grant-deseni.sql` | SQL / Denetim | Cogniti kapsamında td12 Eczanem grant deseni için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar. |

### 📁 scripts/sql/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `admin_eczanem_uye_yonetimi.sql` | SQL / Kaynak ve Denetim | admin eczanem uye yonetimi için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `admin_eczanem_uyelik_islemleri`, `admin_eczanem_uyeleri_oku`, `admin_eczanem_uyelik_durum_degistir`. |
| `admin_hiyerarsi_tekillik.sql` | SQL / DDL | Cogniti kapsamında admin hiyerarşi tekillik için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `hiyerarsi_adi_anahtari`, `firmalar`, `firma_no_ata` veritabanı nesnelerini ele alır. |
| `bildirimler_alici_kayit_unique.sql` | SQL / Kaynak ve Denetim | bildirimler alici kayit unique için SQL sözleşmesi veya denetim sorgularını içerir. |
| `cc_challenge_gonderim_guvenligi.sql` | SQL / DDL | Cogniti kapsamında cc challenge gönderim guvenligi için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `cc_challenge_gonder` veritabanı nesnelerini ele alır. |
| `cc_izleme_cevap_guvenligi.sql` | SQL / DDL | Cogniti kapsamında cc izleme cevap guvenligi için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `cc_izleme_kayitlari`, `cc_izleme_tamamla`, `cc_cevaplari_kaydet` veritabanı nesnelerini ele alır. |
| `cc_ligi_backfill.sql` | SQL / DDL | Cogniti kapsamında cc ligi backfill için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar. |
| `cc_ligi_okuma.sql` | SQL / DDL | Cogniti kapsamında cc ligi okuma için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `_cc_ligi_aralik`, `get_cc_ligi_aylik`, `get_cc_ligi_donemlik` veritabanı nesnelerini ele alır. |
| `cc_ligi_ozet.sql` | SQL / DDL | Cogniti kapsamında cc ligi ozet için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `cc_ligi_ozet`, `cc_ligi_ozet_guncelle`, `trg_cc_ozet_kazanim` veritabanı nesnelerini ele alır. |
| `cc_ogrenme_araci_tamamlama.sql` | SQL / DDL | C-Club tamamlamasını dört araç türü için ortak kanıt, puan ve soru sözleşmesine geçirir. |
| `cc_ogrenme_araci_yayin_kimligi.sql` | SQL / DDL | C-Club challenge ve BM izleme kayıtlarına ortak yayın/araç kimliğini ekler. |
| `cc_suresiz_challenge_cevap.sql` | SQL / Kaynak ve Denetim | cc suresiz challenge cevap için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `cc_cevaplari_kaydet`. |
| `cc_yeni_puanlama_modeli.sql` | SQL / DDL | Cogniti kapsamında cc yeni puanlama modeli için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `cc_challenge_gonder`, `cc_challenge_tamamlaninca_bildirim_kapat`, `trg_cc_challenge_tamamlaninca_bildirim_kapat` veritabanı nesnelerini ele alır. |
| `cc_yetkilendirme_guvenligi.sql` | SQL / DDL | Cogniti kapsamında cc yetkilendirme guvenligi için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `cc_izleme_kayitlari`, `cc_kazanilan_puanlar`, `cc_ileri_sarma_kayitlari` veritabanı nesnelerini ele alır. |
| `challenge_kaybi_tara.sql` | SQL / DDL | Cogniti kapsamında challenge kaybi tara için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `cc_challenge_tamamlaninca_bildirim_kapat`, `trg_cc_challenge_tamamlaninca_bildirim_kapat`, `challenge_kaybi_tara` veritabanı nesnelerini ele alır. |
| `cogniti_eczanem_banner_gorsel_kontrol.sql` | SQL / Kaynak ve Denetim | cogniti eczanem banner gorsel kontrol için SQL sözleşmesi veya denetim sorgularını içerir. |
| `cogniti_marka_db_donusumu.sql` | SQL / Kaynak ve Denetim | cogniti marka db donusumu için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `eclub_banner_sira_kontrolu`. |
| `cogniti_marka_db_on_kontrol.sql` | SQL / Kaynak ve Denetim | cogniti marka db on kontrol için SQL sözleşmesi veya denetim sorgularını içerir. |
| `dijital_brosur_v3_karar_terminolojisi.sql` | SQL / Kaynak ve Denetim | dijital brosur v3 karar terminolojisi için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `uretim_gorsel_uretici_karar_ver`. |
| `dokum_hbstore_siparis_kaynak_ceyrek.sql` | SQL / Kaynak ve Denetim | dokum hbstore siparis kaynak ceyrek için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_abilon_11_test_v3.sql` | SQL / Kaynak ve Denetim | eclub abilon 11 test v3 için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `eclub_cek_karti_ux_testleri`. |
| `eclub_abilon_11_ux_puan_kontrol_salt_okunur.sql` | SQL / Kaynak ve Denetim | eclub abilon 11 ux puan kontrol salt okunur için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_abilon_11_ux_senaryosu_v2.sql` | SQL / Kaynak ve Denetim | eclub abilon 11 ux senaryosu v2 için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `eclub_cek_karti_ux_testleri`. |
| `eclub_alti_izleme_yayin_ureticisi_salt_okunur.sql` | SQL / Kaynak ve Denetim | eclub alti izleme yayin ureticisi salt okunur için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_ayni_video_tekrar_ayari.sql` | SQL / DDL | Cogniti kapsamında E-Club ayni video tekrar ayari için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar. |
| `eclub_ayse_eczanesi_eksik_puanlari_onar.sql` | SQL / Kaynak ve Denetim | eclub ayse eczanesi eksik puanlari onar için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_ayse_saglik_uuid.sql` | SQL / Kaynak ve Denetim | eclub ayse saglik uuid için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_ayse_saglik_yayin_tamamlama_durumu.sql` | SQL / Kaynak ve Denetim | eclub ayse saglik yayin tamamlama durumu için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_cek_eposta_worker.sql` | SQL / Kaynak ve Denetim | eclub cek eposta worker için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `eclub_cek_eposta_isi_al`, `eclub_cek_teslimat_tamamla`, `eclub_cek_teslimat_hata`. |
| `eclub_cek_gorunum_testlerini_birlikte_temizle.sql` | SQL / Kaynak ve Denetim | eclub cek gorunum testlerini birlikte temizle için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_cek_karti_kolonlari.sql` | SQL / Kaynak ve Denetim | eclub cek karti kolonlari için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_cek_karti_temizlik_engelleri.sql` | SQL / Kaynak ve Denetim | eclub cek karti temizlik engelleri için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_cek_karti_test_verisi_ekle.sql` | SQL / Kaynak ve Denetim | eclub cek karti test verisi ekle için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_cek_karti_test_verisi_onkontrol.sql` | SQL / Kaynak ve Denetim | eclub cek karti test verisi onkontrol için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_cek_karti_test_verisi_temizle.sql` | SQL / Kaynak ve Denetim | eclub cek karti test verisi temizle için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_cek_push_worker.sql` | SQL / Kaynak ve Denetim | eclub cek push worker için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `eclub_cek_push_isi_al`. |
| `eclub_cek_takip_11_ux_senaryosu_ekle.sql` | SQL / Kaynak ve Denetim | eclub cek takip 11 ux senaryosu ekle için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `eclub_cek_takip_ux_testleri`. |
| `eclub_cek_takip_11_ux_senaryosu_temizle.sql` | SQL / Kaynak ve Denetim | eclub cek takip 11 ux senaryosu temizle için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_cek_talebi_ana_eczaci.sql` | SQL / Kaynak ve Denetim | eclub cek talebi ana eczaci için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `eclub_store_cek_talebi_olustur`. |
| `eclub_cek_talepleri_test_verisi_ekle.sql` | SQL / Kaynak ve Denetim | eclub cek talepleri test verisi ekle için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_cek_talepleri_test_verisi_temizle.sql` | SQL / Kaynak ve Denetim | eclub cek talepleri test verisi temizle için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_cek_teslimat_outbox.sql` | SQL / Kaynak ve Denetim | eclub cek teslimat outbox için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `eclub_cek_teslimat_outbox`, `eclub_store_admin_kod_teslim`. |
| `eclub_cek_uygulama_bildirimleri.sql` | SQL / Kaynak ve Denetim | eclub cek uygulama bildirimleri için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `eclub_cek_uygulama_bildirimi_yaz`. |
| `eclub_cekli_ceksiz_puan_tam_rollout.sql` | SQL / Kaynak ve Denetim | eclub cekli ceksiz puan tam rollout için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `tg_eclub_kazanilan_puanlar_cek_karsiligi`, `tg_eclub_ileri_sarma_kayitlari_cek_karsiligi`, `get_eclub_utt_rapor`, `get_eclub_store_firma_bakiye`. |
| `eclub_depo_tercihleri.sql` | SQL / Kaynak ve Denetim | eclub depo tercihleri için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `eclub_eczane_depo_tercihleri`, `eclub_depo_tercih_gecmisi`, `eclub_depo_konumu_uygun`, `eclub_eczane_depolari_hazir`. |
| `eclub_depo_tercihleri_durum_kontrol.sql` | SQL / Kaynak ve Denetim | eclub depo tercihleri durum kontrol için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_eksik_puanlari_onar.sql` | SQL / Kaynak ve Denetim | eclub eksik puanlari onar için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_faz9_geriye_donuk_uyumluluk.sql` | SQL / Kaynak ve Denetim | eclub faz9 geriye donuk uyumluluk için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_firma_bannerlari.sql` | SQL / Kaynak ve Denetim | eclub firma bannerlari için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `eclub_firma_bannerlari`, `eclub_banner_sira_kontrolu`. |
| `eclub_fiziksel_store_kapatma.sql` | SQL / Kaynak ve Denetim | eclub fiziksel store kapatma için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_forma_xl_alti_test_izlemesini_sifirla.sql` | SQL / Kaynak ve Denetim | eclub forma xl alti test izlemesini sifirla için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `eclub_forma_xl_alti_test_izleme_yedegi_20261015`. |
| `eclub_forma_xl_p4_puan_nedeni_salt_okunur.sql` | SQL / Kaynak ve Denetim | eclub forma xl p4 puan nedeni salt okunur için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_forma_xl_performans_p4_salt_okunur.sql` | SQL / Kaynak ve Denetim | eclub forma xl performans p4 salt okunur için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_gonderi_limit_ayarlari.sql` | SQL / DDL | Cogniti kapsamında E-Club gonderi limit ayarlari için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar. |
| `eclub_gonderi_saatini_temizle.sql` | SQL / Kaynak ve Denetim | eclub gonderi saatini temizle için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_gonderim_api_toplu.sql` | SQL / Kaynak ve Denetim | eclub gonderim api toplu için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `eclub_yayin_toplu_islem`. |
| `eclub_gonderim_canli_durum_kontrol.sql` | SQL / Kaynak ve Denetim | eclub gonderim canli durum kontrol için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_gonderim_kota_ve_tarih_kontrolu.sql` | SQL / Kaynak ve Denetim | eclub gonderim kota ve tarih kontrolu için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `eclub_gonderim_kapsamini_kilitle`, `eclub_gonderim_kontrol_hesapla`, `eclub_gonderim_erisimini_kilitle`, `eclub_gonderim_uygunlugu`. |
| `eclub_gonderim_kurulum_kontrol.sql` | SQL / Kaynak ve Denetim | eclub gonderim kurulum kontrol için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_gonderim_rpc_yeni_kurgu.sql` | SQL / Kaynak ve Denetim | eclub gonderim rpc yeni kurgu için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `eclub_gonderim_sure_kapisi`, `eclub_yayin_gonder`, `eclub_oneri_atomik_kaydet`. |
| `eclub_hediye_takip_test_verisi_ekle.sql` | SQL / Kaynak ve Denetim | eclub hediye takip test verisi ekle için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_hediye_takip_test_verisi_onkontrol.sql` | SQL / Kaynak ve Denetim | eclub hediye takip test verisi onkontrol için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_hediye_takip_test_verisi_temizle.sql` | SQL / Kaynak ve Denetim | eclub hediye takip test verisi temizle için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_hepifarma_11_test_yayini_tarih_onkontrol.sql` | SQL / Kaynak ve Denetim | eclub hepifarma 11 test yayini tarih onkontrol için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_hepifarma_11_test_yayinini_bugun_ac.sql` | SQL / Kaynak ve Denetim | eclub hepifarma 11 test yayinini bugun ac için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `eclub_hepifarma_11_test_yayini_yedegi_20261015`. |
| `eclub_hepifarma_11_yayin_soru_yapisi_salt_okunur.sql` | SQL / Kaynak ve Denetim | eclub hepifarma 11 yayin soru yapisi salt okunur için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_hepifarma_11_yayinin_hedef_disi_15_izlemesi_salt_okunur.sql` | SQL / Kaynak ve Denetim | eclub hepifarma 11 yayinin hedef disi 15 izlemesi salt okunur için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_hepifarma_15_ek_test_izlemesini_sifirla.sql` | SQL / Kaynak ve Denetim | eclub hepifarma 15 ek test izlemesini sifirla için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `hata`, `eclub_hepifarma_15_ek_test_izleme_yedegi_20261015`. |
| `eclub_hepifarma_39_izleme_baslangicini_gonderim_gunune_tasi.sql` | SQL / Kaynak ve Denetim | eclub hepifarma 39 izleme baslangicini gonderim gunune tasi için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_hepifarma_39_izleme_iki_yanlis_cevap.sql` | SQL / Kaynak ve Denetim | eclub hepifarma 39 izleme iki yanlis cevap için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_hepifarma_39_izleme_uye_puan_dogrulama_salt_okunur.sql` | SQL / Kaynak ve Denetim | eclub hepifarma 39 izleme uye puan dogrulama salt okunur için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_hepifarma_39_izlemeyi_puanli_tamamla.sql` | SQL / Kaynak ve Denetim | eclub hepifarma 39 izlemeyi puanli tamamla için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_hepifarma_39_utt_gonderim_tarihi_duzeltildi.sql` | SQL / Kaynak ve Denetim | eclub hepifarma 39 utt gonderim tarihi duzeltildi için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_hepifarma_39_utt_gonderimini_bugune_tasi.sql` | SQL / Kaynak ve Denetim | eclub hepifarma 39 utt gonderimini bugune tasi için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_hepifarma_diger_urunler_p4_salt_okunur.sql` | SQL / Kaynak ve Denetim | eclub hepifarma diger urunler p4 salt okunur için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_hepifarma_p4_24_izleme_sifirlama_onkontrol.sql` | SQL / Kaynak ve Denetim | eclub hepifarma p4 24 izleme sifirlama onkontrol için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_hepifarma_p4_24_test_izlemesini_sifirla.sql` | SQL / Kaynak ve Denetim | eclub hepifarma p4 24 test izlemesini sifirla için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `hata`, `eclub_hepifarma_p4_24_test_izleme_yedegi_20261015`. |
| `eclub_hoyk_55_renk_gorunumu_20261015.sql` | SQL / Kaynak ve Denetim | eclub hoyk 55 renk gorunumu 20261015 için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `eclub_hoyk_renk_deneme_yedek_20261015`. |
| `eclub_hoyk_55_renk_gorunumu_geri_al.sql` | SQL / Kaynak ve Denetim | eclub hoyk 55 renk gorunumu geri al için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_hoyk_55_tarih_20260901_20260916.sql` | SQL / Kaynak ve Denetim | eclub hoyk 55 tarih 20260901 20260916 için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_hoyk_9_tamamlanan_gorunumu_20261015.sql` | SQL / Kaynak ve Denetim | eclub hoyk 9 tamamlanan gorunumu 20261015 için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `eclub_hoyk_tamamlanan_9_yedek_20261015`. |
| `eclub_hoyk_9_tamamlanan_gorunumu_geri_al.sql` | SQL / Kaynak ve Denetim | eclub hoyk 9 tamamlanan gorunumu geri al için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_ileri_sarma_cek_karsiligi.sql` | SQL / Kaynak ve Denetim | eclub ileri sarma cek karsiligi için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `tg_eclub_ileri_sarma_kayitlari_cek_karsiligi`, `get_eclub_store_firma_bakiye`. |
| `eclub_ileri_sarma_kurali.sql` | SQL / DDL | Cogniti kapsamında E-Club ileri sarma kurali için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `eclub_ileri_sarma_kayitlari`, `eclub_ileri_sarma_kaydet`, `eclub_izleme_tamamla` veritabanı nesnelerini ele alır. |
| `eclub_izleme_suresi_snapshot.sql` | SQL / DDL | Cogniti kapsamında E-Club izleme suresi snapshot için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `eclub_izleme_kayitlari`, `eclub_izleme_tamamla` veritabanı nesnelerini ele alır. |
| `eclub_izleme_tekillik.sql` | SQL / DDL | Cogniti kapsamında E-Club izleme tekillik için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `eclub_izleme_kayitlari`, `eclub_yanlis_cevap_kayitlari`, `eclub_izleme_tamamla` veritabanı nesnelerini ele alır. |
| `eclub_kazanilan_puanlar_cek_karsiligi.sql` | SQL / Kaynak ve Denetim | eclub kazanilan puanlar cek karsiligi için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `tg_eclub_kazanilan_puanlar_cek_karsiligi`. |
| `eclub_kisi_unvanlari.sql` | SQL / DDL | Cogniti kapsamında E-Club kişi unvanlari için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `eclub_kisiler` veritabanı nesnelerini ele alır. |
| `eclub_kullanilmayan_puan_tam_devir.sql` | SQL / Kaynak ve Denetim | eclub kullanilmayan puan tam devir için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `eclub_tam_devir_gecis_yedegi`, `eclub_store_onceki_deviri_hazirla`. |
| `eclub_lig_cekli_ceksiz_puan.sql` | SQL / Kaynak ve Denetim | eclub lig cekli ceksiz puan için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `get_eclub_utt_rapor`. |
| `eclub_ogrenme_araci_tamamlama.sql` | SQL / DDL | E-Club tamamlamasını video, podcast, görsel ve Flip PDF kanıtlarına göre ortak yayın/arac kimliğiyle doğrular. |
| `eclub_ogrenme_araci_yayin_kimligi.sql` | SQL / DDL | E-Club önerilerini `yayin_id`, `arac_id` ve `arac_turu` ortak öğrenme aracı kimliğine geçirir. |
| `eclub_oneri_atomik_kaydet.sql` | SQL / DDL | Cogniti kapsamında E-Club öneri atomik kaydet için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `eclub_oneri_atomik_kaydet` veritabanı nesnelerini ele alır. |
| `eclub_oneri_video_kimligi.sql` | SQL / DDL | Cogniti kapsamında E-Club öneri video kimligi için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `eclub_oneri_kayitlari` veritabanı nesnelerini ele alır. |
| `eclub_planlanan_gonderim_cron.sql` | SQL / Kaynak ve Denetim | eclub planlanan gonderim cron için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_planlanan_gonderim_cron_durdur.sql` | SQL / Kaynak ve Denetim | eclub planlanan gonderim cron durdur için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_planlanan_gonderim_cron_etkinlestir.sql` | SQL / Kaynak ve Denetim | eclub planlanan gonderim cron etkinlestir için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_planlanan_gonderim_isleyici.sql` | SQL / Kaynak ve Denetim | eclub planlanan gonderim isleyici için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `eclub_planlanan_gonderimi_isle`. |
| `eclub_puan_eczane_sabitleme.sql` | SQL / Kaynak ve Denetim | eclub puan eczane sabitleme için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `tg_eclub_kazanilan_puanlar_eczane_sabitle`, `tg_eclub_kazanilan_puanlar_eczane_degismez`. |
| `eclub_puan_eczane_test_verisi_temizle.sql` | SQL / Kaynak ve Denetim | eclub puan eczane test verisi temizle için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_puan_siparis_ve_yil_sonu_kapanisi.sql` | SQL / Kaynak ve Denetim | eclub puan siparis ve yil sonu kapanisi için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `eclub_puan_kapanis_gecis_yedegi`, `eclub_store_puan_silinmeleri`, `eclub_store_donem_kosulunu_sabitle`, `eclub_store_kazanim_donem_kosulu`. |
| `eclub_puan_yazma_fonksiyonlari_eczane.sql` | SQL / Kaynak ve Denetim | eclub puan yazma fonksiyonlari eczane için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `eclub_izleme_tamamla`, `eclub_cevaplari_kaydet`. |
| `eclub_siparis_bm_onay.sql` | SQL / Kaynak ve Denetim | eclub siparis bm onay için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `eclub_siparis_bm_onaylari`, `eclub_siparis_bm_onayla`. |
| `eclub_siparis_utt_takip.sql` | SQL / Kaynak ve Denetim | eclub siparis utt takip için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `eclub_siparis_utt_onaylari`, `eclub_siparis_utt_onayla`. |
| `eclub_siparissiz_cek_siparis_guvencesi.sql` | SQL / Kaynak ve Denetim | eclub siparissiz cek siparis guvencesi için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_store_aktif_uyelik_siparis_kapisi.sql` | SQL / DDL | Cogniti kapsamında E-Club Store aktif uyelik sipariş kapisi için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `eclub_store_siparis_olustur` veritabanı nesnelerini ele alır. |
| `eclub_store_ayin_ilk_yedi_gunu_takvimi.sql` | SQL / Kaynak ve Denetim | eclub store ayin ilk yedi gunu takvimi için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `eclub_store_siparis_donemi_acik_mi`. |
| `eclub_store_cekli_puan_sinirlamasi.sql` | SQL / Kaynak ve Denetim | eclub store cekli puan sinirlamasi için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `get_eclub_store_firma_bakiye`. |
| `eclub_store_donemlik_siparis_takvimi.sql` | SQL / Kaynak ve Denetim | eclub store donemlik siparis takvimi için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `eclub_store_siparis_donemi_acik_mi`, `eclub_store_siparis_olustur`. |
| `eclub_store_firma_urun_gorunurlugu.sql` | SQL / DDL | Cogniti kapsamında E-Club Store firma ürün gorunurlugu için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `eclub_store_urun_firma_ayarlari`, `eclub_store_siparis_olustur` veritabanı nesnelerini ele alır. |
| `eclub_store_hediye_ceki_cekli_puan.sql` | SQL / Kaynak ve Denetim | eclub store hediye ceki cekli puan için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `eclub_store_onceki_deviri_hazirla`, `get_eclub_eczane_store_ozet`, `eclub_store_cek_talebi_olustur`. |
| `eclub_store_rapor_lig_eczane_snapshot.sql` | SQL / Kaynak ve Denetim | eclub store rapor lig eczane snapshot için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `eclub_store_onceki_deviri_hazirla`, `get_eclub_eczane_store_ozet`, `eclub_store_cek_talebi_olustur`, `get_eclub_utt_rapor`. |
| `eclub_store_tm_son_onay.sql` | SQL / Kaynak ve Denetim | eclub store tm son onay için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `eclub_store_bm_onayla`, `eclub_store_tm_onayla`, `eclub_store_admin_kod_teslim`, `eclub_store_cek_talebi_iptal`. |
| `eclub_store_yeni_donem_satis_sartli_cek.sql` | SQL / Kaynak ve Denetim | eclub store yeni donem satis sartli cek için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `eclub_store_cek_talepleri`, `eclub_store_puan_devirleri`, `eclub_store_cek_eposta_kuyrugu`, `eclub_store_donem_sinirlari`. |
| `eclub_tek_izleme_zamanlari_salt_okunur.sql` | SQL / Kaynak ve Denetim | eclub tek izleme zamanlari salt okunur için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_tek_urun_11_ux_senaryosu_ekle.sql` | SQL / Kaynak ve Denetim | eclub tek urun 11 ux senaryosu ekle için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `eclub_cek_karti_ux_testleri`. |
| `eclub_tek_urun_11_ux_senaryosu_temizle.sql` | SQL / Kaynak ve Denetim | eclub tek urun 11 ux senaryosu temizle için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_test_gln_kaynak.sql` | SQL / DDL | Cogniti kapsamında E-Club test gln kaynak için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `eclub_eczane_master` veritabanı nesnelerini ele alır. |
| `eclub_test_veri_temizle.sql` | SQL / DDL | Cogniti kapsamında E-Club test veri temizle için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `eclub_test_veri_islem` veritabanı nesnelerini ele alır. |
| `eclub_utt_eczane_uyeligi.sql` | SQL / DDL | Cogniti kapsamında E-Club UTT eczane uyeligi için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `eclub_utt_eczane`, `eclub_utt_eczaneye_bagla`, `eclub_utt_eczaneden_cikar` veritabanı nesnelerini ele alır. |
| `eclub_utt_gonderim_oncesi_inceleme.sql` | SQL / Kaynak ve Denetim | eclub utt gonderim oncesi inceleme için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `eclub_utt_yayin_incelemeleri`, `eclub_utt_inceleme_gonderim_kilidi`. |
| `eclub_utt_rapor_yetki_daraltma.sql` | SQL / Kaynak ve Denetim | eclub utt rapor yetki daraltma için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_uyelerin_yayin_tarihleri.sql` | SQL / Kaynak ve Denetim | eclub uyelerin yayin tarihleri için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_uyelik_daveti.sql` | SQL / Kaynak ve Denetim | eclub uyelik daveti için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `eclub_uyelik_davetleri`, `eclub_davet_bekleyen_kayit`, `eclub_davet_yenile`, `eclub_davet_islem_al`. |
| `eclub_video_begeni_favori.sql` | SQL / DDL | Cogniti kapsamında E-Club video beğeni favori için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `eclub_video_begeniler`, `eclub_video_favoriler` veritabanı nesnelerini ele alır. |
| `eclub_yayin_cek_karsiligi_var_mi.sql` | SQL / Kaynak ve Denetim | eclub yayin cek karsiligi var mi için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eclub_yayin_gonderim_planlari.sql` | SQL / Kaynak ve Denetim | eclub yayin gonderim planlari için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `eclub_yayin_gonderim_planlari`. |
| `ecza_depo_katalogu_sema.sql` | SQL / Kaynak ve Denetim | ecza depo katalogu sema için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `ecza_depolari`, `ecza_depo_subeleri`. |
| `ecza_depo_katalogu_veri_20260929.sql` | SQL / Kaynak ve Denetim | ecza depo katalogu veri 20260929 için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eczanem_35_test_uye_kayit_envanteri.sql` | SQL / Kaynak ve Denetim | eczanem 35 test uye kayit envanteri için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eczanem_butunluk_paketi.sql` | SQL / DDL | Cogniti kapsamında Eczanem butunluk paketi için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `hapbilgi_telefon_normalize`, `hapbilgi_kimlik_telefon_ayir_trg`, `trg_eclub_kisiler_telefon_ayir` veritabanı nesnelerini ele alır. |
| `eczanem_butunluk_paketi_on_kontrol.sql` | SQL / Denetim | Cogniti kapsamında Eczanem butunluk paketi on kontrol için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar. |
| `eczanem_coklu_eczane_aktif_uyelik.sql` | SQL / DDL | Cogniti kapsamında Eczanem coklu eczane aktif uyelik için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `eczanem_gonderimler`, `eczanem_izleme_aktif_uyelik_kapisi`, `eczanem_izleme_aktif_uyelik_trg` veritabanı nesnelerini ele alır. |
| `eczanem_eclub_kontrollu_gecis.sql` | SQL / DDL | Cogniti kapsamında Eczanem E-Club kontrollu gecis için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `eczanem_eclub_gecis_talepleri`, `eczanem_eclub_gecis_kayitlari`, `eczanem_eclub_puan_kapanislari` veritabanı nesnelerini ele alır. |
| `eczanem_eclub_modul_bagimliligi.sql` | SQL / Kaynak ve Denetim | eczanem eclub modul bagimliligi için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `eczanem_eclub_modul_bagimliligini_koru`. |
| `eczanem_eczane_yonetim_paketi.sql` | SQL / DDL | Cogniti kapsamında Eczanem eczane yönetim paketi için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `eczanem_personel_islemleri`, `eczanem_uyelikler`, `eczanem_siparisler` veritabanı nesnelerini ele alır. |
| `eczanem_eski_mutabakat_kaldir.sql` | SQL / Kaynak ve Denetim | eczanem eski mutabakat kaldir için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eczanem_indirim_gorunen_id_atomik.sql` | SQL / Kaynak ve Denetim | eczanem indirim gorunen id atomik için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `eczanem_indirim_gorunen_id_ata`, `eczanem_utt_mutabakat_eczane_islemleri_listele`. |
| `eczanem_izleme_cevap_guvenligi.sql` | SQL / DDL | Cogniti kapsamında Eczanem izleme cevap guvenligi için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `eczanem_izleme_kayitlari`, `eczanem_izleme_tamamla`, `eczanem_cevaplari_kaydet` veritabanı nesnelerini ele alır. |
| `eczanem_musteri_ad_soyad_ayrimi.sql` | SQL / Kaynak ve Denetim | eczanem musteri ad soyad ayrimi için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `hapbilgi_eczanem_musteri_ad_soyad_senk_trg`, `v_auth_kimlik`, `v_auth_kimlik_admin`, `eczanem_yeni_musteri_provizyonu_izli`. |
| `eczanem_musteri_auth_kapisi.sql` | SQL / DDL | Cogniti kapsamında Eczanem üye kimlik doğrulama kapisi için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `eczanem_yeni_musteri_provizyonu_izli` veritabanı nesnelerini ele alır. |
| `eczanem_musteri_kendini_atomik_sil.sql` | SQL / DDL | Cogniti kapsamında Eczanem üye kendini atomik silme için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `eczanem_musteri_kendini_tam_sil` veritabanı nesnelerini ele alır. |
| `eczanem_musteri_video_etkilesimleri.sql` | SQL / DDL | Cogniti kapsamında Eczanem üye video etkilesimleri için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `eczanem_izleme_kayitlari`, `eczanem_video_begeniler`, `eczanem_video_favoriler` veritabanı nesnelerini ele alır. |
| `eczanem_mutabakat_onay_hiyerarsisi.sql` | SQL / Kaynak ve Denetim | eczanem mutabakat onay hiyerarsisi için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `eczanem_bm_mutabakat_kararlari`, `eczanem_tm_mutabakat_kararlari`, `eczanem_mutabakat_onay_durumlari`, `eczanem_utt_mutabakat_karar_ver`. |
| `eczanem_mutabakat_test_urun_adlarini_duzelt.sql` | SQL / Kaynak ve Denetim | eczanem mutabakat test urun adlarini duzelt için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eczanem_ogrenme_araci_tamamlama.sql` | SQL / DDL | Eczanem müşteri tamamlamasını dört araç türü için ortak kanıt ve puan sözleşmesine geçirir. |
| `eczanem_ogrenme_araci_yayin_kimligi.sql` | SQL / DDL | UTT→eczane ve eczane→müşteri dağıtımlarına ortak yayın/araç kimliğini ekler. |
| `eczanem_sayfa_bannerlari.sql` | SQL / Kaynak ve Denetim | eczanem sayfa bannerlari için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `eczanem_sayfa_bannerlari`. |
| `eczanem_utt_gonderim_atomik.sql` | SQL / DDL | Cogniti kapsamında Eczanem UTT gönderim atomik için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `eczanem_utt_eczaneye_gonder` veritabanı nesnelerini ele alır. |
| `eczanem_utt_gonderim_atomik_on_kontrol.sql` | SQL / Denetim | Cogniti kapsamında Eczanem UTT gönderim atomik on kontrol için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar. |
| `eczanem_utt_gonderim_oncesi_inceleme.sql` | SQL / Kaynak ve Denetim | eczanem utt gonderim oncesi inceleme için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `eczanem_utt_inceleme_gonderim_kilidi`. |
| `eczanem_utt_mutabakat_eczane_satirlari.sql` | SQL / Kaynak ve Denetim | eczanem utt mutabakat eczane satirlari için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `eczanem_utt_mutabakat_eczaneleri_listele`, `eczanem_utt_mutabakat_eczane_islemleri_listele`. |
| `eczanem_utt_mutabakat_eczane_urun_filtresi.sql` | SQL / Kaynak ve Denetim | eczanem utt mutabakat eczane urun filtresi için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `eczanem_utt_mutabakat_eczane_islemleri_filtreli_listele`. |
| `eczanem_utt_mutabakat_gorunum_test_ekle.sql` | SQL / Kaynak ve Denetim | eczanem utt mutabakat gorunum test ekle için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eczanem_utt_mutabakat_gorunum_test_onkontrol.sql` | SQL / Kaynak ve Denetim | eczanem utt mutabakat gorunum test onkontrol için SQL sözleşmesi veya denetim sorgularını içerir. |
| `eczanem_utt_mutabakat_kayit.sql` | SQL / Kaynak ve Denetim | eczanem utt mutabakat kayit için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `eczanem_indirim_onaylari`, `eczanem_indirim_onay_kaynaklari`, `eczanem_utt_mutabakatlar`, `eczanem_utt_mutabakat_kararlari`. |
| `eczanem_utt_mutabakat_liste_gorunen_indirim_id.sql` | SQL / Kaynak ve Denetim | eczanem utt mutabakat liste gorunen indirim id için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `eczanem_utt_mutabakat_listele`. |
| `eczanem_utt_mutabakat_rpc.sql` | SQL / Kaynak ve Denetim | eczanem utt mutabakat rpc için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `eczanem_utt_mutabakat_yetkili_mi`, `eczanem_utt_mutabakat_listele`, `eczanem_utt_mutabakat_karar_ver`. |
| `eczanem_utt_mutabakat_urun_satirlari.sql` | SQL / Kaynak ve Denetim | eczanem utt mutabakat urun satirlari için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `eczanem_utt_mutabakat_urunleri_listele`, `eczanem_utt_mutabakat_urun_islemleri_listele`. |
| `eczanem_uye_bannerlari.sql` | SQL / Kaynak ve Denetim | eczanem uye bannerlari için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `eczanem_sayfa_bannerlari`. |
| `eczanem_uyelik_listeden_sil_atomik.sql` | SQL / DDL | Cogniti kapsamında Eczanem uyelik listeden silme atomik için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `eczanem_uyelik_listeden_sil` veritabanı nesnelerini ele alır. |
| `firma_header_logo_migration.sql` | SQL / Kaynak ve Denetim | firma header logo migration için SQL sözleşmesi veya denetim sorgularını içerir. |
| `flip_pdf_kapak_dogrulama_kapisi.sql` | SQL / Kaynak ve Denetim | flip pdf kapak dogrulama kapisi için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `uretim_flip_pdf_dogrula`. |
| `get_bm_oneri_durumu_v1.sql` | SQL / DDL | Cogniti kapsamında get bm öneri durumu v1 için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `get_bm_oneri_durumu_v1` veritabanı nesnelerini ele alır. |
| `get_bm_puan_ozet.sql` | SQL / Kaynak ve Denetim | get bm puan ozet için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `get_bm_puan_ozet`. |
| `get_bm_rapor_v2.sql` | SQL / DDL | Cogniti kapsamında get bm rapor v2 için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `get_bm_rapor_ana_ozet_v2`, `get_bm_utt_performans_v2`, `get_bm_etkilesim_v2` veritabanı nesnelerini ele alır. |
| `get_bolge_bazli_grup.sql` | SQL / DDL | Cogniti kapsamında get bölge bazli grup için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `get_bolge_bazli_grup` veritabanı nesnelerini ele alır. |
| `get_eclub_ligi_detay_aylik.sql` | SQL / DDL | Cogniti kapsamında get E-Club ligi detay aylik için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `get_eclub_ligi_detay_aylik` veritabanı nesnelerini ele alır. |
| `get_eclub_ligi_detay_donemlik.sql` | SQL / DDL | Cogniti kapsamında get E-Club ligi detay donemlik için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `get_eclub_ligi_detay_donemlik` veritabanı nesnelerini ele alır. |
| `get_eclub_ligi_detay_yillik.sql` | SQL / DDL | Cogniti kapsamında get E-Club ligi detay yillik için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `get_eclub_ligi_detay_yillik` veritabanı nesnelerini ele alır. |
| `get_eclub_store_firma_bakiye.sql` | SQL / DDL | Cogniti kapsamında get E-Club Store firma bakiye için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `get_eclub_store_firma_bakiye` veritabanı nesnelerini ele alır. |
| `get_eclub_utt_rapor.sql` | SQL / DDL | Cogniti kapsamında get E-Club UTT rapor için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `get_eclub_utt_rapor` veritabanı nesnelerini ele alır. |
| `get_eclub_utt_siparisler.sql` | SQL / DDL | Cogniti kapsamında get E-Club UTT siparişler için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `get_eclub_utt_siparisler` veritabanı nesnelerini ele alır. |
| `get_izle_videolari_firma.sql` | SQL / DDL | Cogniti kapsamında get izleme videolari firma için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `get_izle_videolari` veritabanı nesnelerini ele alır. |
| `get_kullanici_kategori_dagilimi.sql` | SQL / DDL | Cogniti kapsamında get kullanıcı kategori dagilimi için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `get_kullanici_kategori_dagilimi` veritabanı nesnelerini ele alır. |
| `get_kullanici_urun_dagilimi.sql` | SQL / DDL | Cogniti kapsamında get kullanıcı ürün dagilimi için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `get_kullanici_urun_dagilimi` veritabanı nesnelerini ele alır. |
| `get_tm_bm_performans_v1.sql` | SQL / DDL | Cogniti kapsamında get tm bm performans v1 için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `get_tm_bm_performans_v1` veritabanı nesnelerini ele alır. |
| `get_tm_oneri_durumu_v1.sql` | SQL / DDL | Cogniti kapsamında get tm öneri durumu v1 için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `get_tm_oneri_durumu_v1` veritabanı nesnelerini ele alır. |
| `get_tm_rapor_v2.sql` | SQL / DDL | Cogniti kapsamında get tm rapor v2 için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `get_tm_etkilesim_v2` veritabanı nesnelerini ele alır. |
| `get_uretici_rapor_ozet_v3.sql` | SQL / DDL | Cogniti kapsamında get üretici rapor ozet v3 için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `get_uretici_rapor_ozet_v3` veritabanı nesnelerini ele alır. |
| `get_uretici_yayin_ana_ozet_v1.sql` | SQL / Kaynak ve Denetim | get uretici yayin ana ozet v1 için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `get_uretici_yayin_ana_ozet_v1`. |
| `get_urun_from_yayin.sql` | SQL / DDL | Cogniti kapsamında get ürün from yayın için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `get_urun_from_yayin` veritabanı nesnelerini ele alır. |
| `get_yayin_raporlari_arac_performansi_v1.sql` | SQL / Kaynak ve Denetim | get yayin raporlari arac performansi v1 için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `get_yayin_raporlari_arac_kaynagi_v1`, `get_yayin_raporlari_arac_performansi_v1`, `get_yayin_raporlari_arac_yayinlari_v1`. |
| `get_yayin_raporlari_arac_potansiyel_puani_v1.sql` | SQL / Kaynak ve Denetim | get yayin raporlari arac potansiyel puani v1 için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `get_yayin_raporlari_arac_potansiyel_puani_v1`. |
| `get_yayin_raporlari_arac_toplamlari_v1.sql` | SQL / Kaynak ve Denetim | get yayin raporlari arac toplamlari v1 için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `get_yayin_raporlari_arac_toplamlari_v1`. |
| `get_yayin_raporlari_arac_tuketimi_v1.sql` | SQL / Kaynak ve Denetim | get yayin raporlari arac tuketimi v1 için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `get_yayin_raporlari_arac_tuketimi_v1`. |
| `get_yayin_raporlari_bm_filtresi_v1.sql` | SQL / Kaynak ve Denetim | get yayin raporlari bm filtresi v1 için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `get_yayin_raporlari_varyant_ozeti_v1`, `get_yonetici_egitim_turu_etkisi_v3`, `get_yayin_raporlari_arac_kaynagi_v1`. |
| `get_yayin_raporlari_eczaci_filtresi_v1.sql` | SQL / Kaynak ve Denetim | get yayin raporlari eczaci filtresi v1 için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `get_yayin_raporlari_varyant_ozeti_v1`, `get_yonetici_egitim_turu_etkisi_v3`, `get_yayin_raporlari_arac_kaynagi_v1`. |
| `get_yayin_raporlari_eczanem_filtresi_v1.sql` | SQL / Kaynak ve Denetim | get yayin raporlari eczanem filtresi v1 için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `get_yayin_raporlari_varyant_ozeti_v1`, `get_yonetici_egitim_turu_etkisi_v3`, `get_yayin_raporlari_arac_kaynagi_v1`. |
| `get_yayin_raporlari_teknisyen_filtresi_v1.sql` | SQL / Kaynak ve Denetim | get yayin raporlari teknisyen filtresi v1 için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `get_yayin_raporlari_varyant_ozeti_v1`, `get_yonetici_egitim_turu_etkisi_v3`, `get_yayin_raporlari_arac_kaynagi_v1`. |
| `get_yayin_raporlari_varyant_ozeti_v1.sql` | SQL / Kaynak ve Denetim | get yayin raporlari varyant ozeti v1 için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `get_yayin_raporlari_varyant_ozeti_v1`. |
| `get_yonetici_egitim_turu_etkisi_v3.sql` | SQL / DDL | Cogniti kapsamında get yönetici egitim turu etkisi v3 için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `get_yonetici_egitim_turu_etkisi_v3` veritabanı nesnelerini ele alır. |
| `get_yonetici_rapor_v2.sql` | SQL / DDL | Cogniti kapsamında get yönetici rapor v2 için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `get_yonetici_rapor_ana_ozet_v2`, `get_yonetici_hiyerarsi_v2`, `get_yonetici_icerik_etkisi_v2` veritabanı nesnelerini ele alır. |
| `hatali_aktif_yayinlari_temizle.sql` | SQL / Kaynak ve Denetim | hatali aktif yayinlari temizle için SQL sözleşmesi veya denetim sorgularını içerir. |
| `hbligi_v1_kaldir.sql` | SQL / DDL | Cogniti kapsamında hbligi v1 kaldir için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar. |
| `hbligi_v2_backfill.sql` | SQL / DDL | Cogniti kapsamında hbligi v2 backfill için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar. |
| `hbligi_v2_kopya.sql` | SQL / DDL | Cogniti kapsamında hbligi v2 kopya için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `hb_ligi_v2`, `v_hbligi_sirali_v2`, `get_hb_ligi_aylik_v2` veritabanı nesnelerini ele alır. |
| `hbligi_v2_okuma.sql` | SQL / DDL | Cogniti kapsamında hbligi v2 okuma için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `hb_ligi_v2`, `v_hbligi_sirali_v2`, `_hb_ligi_v2_aralik` veritabanı nesnelerini ele alır. |
| `hbligi_v2_ozet.sql` | SQL / DDL | Cogniti kapsamında hbligi v2 ozet için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `hb_ligi_ozet_v2`, `hb_ligi_ozet_v2_guncelle` veritabanı nesnelerini ele alır. |
| `hbstore_bakiye_turkiye_takvimi.sql` | SQL / Kaynak ve Denetim | hbstore bakiye turkiye takvimi için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `get_harcama_bakiyesi`. |
| `hbstore_bm_ekip_siparis_kapsami.sql` | SQL / DDL | Cogniti kapsamında hbstore bm ekip sipariş kapsami için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `get_kapsamli_siparisler` veritabanı nesnelerini ele alır. |
| `hbstore_bm_ogrenme_puani_guncelleme.sql` | SQL / Kaynak ve Denetim | hbstore bm ogrenme puani guncelleme için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `get_harcama_bakiyesi_tarihli`, `get_harcama_bakiyesi`. |
| `hbstore_donemlik_siparis_takvimi.sql` | SQL / Kaynak ve Denetim | hbstore donemlik siparis takvimi için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `hbstore_siparis_donemi_acik_mi`, `get_harcama_bakiyesi_tarihli`, `get_harcama_bakiyesi`, `store_siparis_olustur_cekirdek`. |
| `hbstore_firma_urun_gorunurlugu.sql` | SQL / DDL | Cogniti kapsamında hbstore firma ürün gorunurlugu için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `store_urun_firma_ayarlari`, `store_siparis_olustur` veritabanı nesnelerini ele alır. |
| `hbstore_siparis_bakiye_kilidi.sql` | SQL / Kaynak ve Denetim | hbstore siparis bakiye kilidi için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `store_siparis_olustur_cekirdek`. |
| `iu_coklu_atama_gorev_modeli.sql` | SQL / DDL | Cogniti kapsamında iu coklu atama görev modeli için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `iu_urun_atamalari`, `iu_genel_atamalari`, `uretim_gorevleri` veritabanı nesnelerini ele alır. |
| `iu_coklu_atama_on_kontrol.sql` | SQL / Denetim | Cogniti kapsamında iu coklu atama on kontrol için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar. |
| `iu_coklu_atama_rpc.sql` | SQL / DDL | Cogniti kapsamında iu coklu atama rpc için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `uretim_islem_kayitlari`, `uretim_aktif_iu_dogrula`, `uretim_iu_talep_icin_uygun` veritabanı nesnelerini ele alır. |
| `kd_utt_mutabakat_ve_yayin_bildirimi_esitle.sql` | SQL / Kaynak ve Denetim | kd utt mutabakat ve yayin bildirimi esitle için SQL sözleşmesi veya denetim sorgularını içerir. |
| `kd_utt_yayin_bildirimi_kontrol.sql` | SQL / Kaynak ve Denetim | kd utt yayin bildirimi kontrol için SQL sözleşmesi veya denetim sorgularını içerir. |
| `kuyruk_cronlarini_supabase_tasima.sql` | SQL / Kaynak ve Denetim | kuyruk cronlarini supabase tasima için SQL sözleşmesi veya denetim sorgularını içerir. |
| `ogrenme_araci_depolama_temizleme_kuyrugu_on_delete_set_null.sql` | SQL / Kaynak ve Denetim | ogrenme araci depolama temizleme kuyrugu on delete set null için SQL sözleşmesi veya denetim sorgularını içerir. |
| `ogrenme_araclari_faz2_on_kontrol.sql` | SQL / Denetim | Cogniti kapsamında öğrenme araçları faz2 on kontrol için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar. |
| `ogrenme_araclari_faz2_ortak_omurga.sql` | SQL / DDL | Cogniti kapsamında öğrenme araçları faz2 ortak omurga için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `ogrenme_araclari`, `ogrenme_araci_durumu`, `ogrenme_araci_puanlari` veritabanı nesnelerini ele alır. |
| `ogrenme_araclari_faz2_yayin_gorunumu.sql` | SQL / DDL | Cogniti kapsamında öğrenme araçları faz2 yayın gorunumu için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `v_yayin_detay`, `v_yayin_kunye` veritabanı nesnelerini ele alır. |
| `ogrenme_araclari_faz2_yukleme_dogrulama_idempotent.sql` | SQL / DDL | Cogniti kapsamında öğrenme araçları faz2 yükleme dogrulama idempotent için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `ogrenme_araci_depolama_temizleme_kuyrugu`, `ogrenme_araci_yukleme_dogrulama_kaydet` veritabanı nesnelerini ele alır. |
| `ogrenme_araclari_faz3_podcast_ai_transkript.sql` | SQL / Kaynak ve Denetim | ogrenme araclari faz3 podcast ai transkript için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `ogrenme_araci_transkript_kuyrugu`, `podcast_transkript_ai_baslat_atomik`, `podcast_transkript_ai_isi_al_atomik`, `podcast_transkript_ai_gecici_hata_atomik`. |
| `ogrenme_araclari_faz3_podcast_opsiyonel_kapak.sql` | SQL / DDL | Podcast tamamlama RPC'sinde (`uretim_podcast_dogrula`) kapak görseli zorunluluğunu kaldırıp opsiyonel hale getirir; ses ve transkript zorunluluğunu korur. |
| `ogrenme_araclari_faz3_podcast_opsiyonel_transkript.sql` | SQL / Kaynak ve Denetim | ogrenme araclari faz3 podcast opsiyonel transkript için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `uretim_podcast_dogrula`. |
| `ogrenme_araclari_faz3_podcast_talep.sql` | SQL / DDL | Cogniti kapsamında öğrenme araçları faz3 Podcast talep için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `talepler` veritabanı nesnelerini ele alır. |
| `ogrenme_araclari_faz3_podcast_taslak.sql` | SQL / Kaynak ve Denetim | ogrenme araclari faz3 podcast taslak için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `podcast_taslak_atomik_olustur`, `podcast_taslak_atomik_kesinlestir`, `podcast_taslak_iptal_et_atomik`, `podcast_taslak_zaman_asimi_temizle_atomik`. |
| `ogrenme_araclari_faz3_podcast_transkript_mime_dosya_adi.sql` | SQL / Kaynak ve Denetim | ogrenme araclari faz3 podcast transkript mime dosya adi için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `podcast_transkript_ai_isi_al_atomik`. |
| `ogrenme_araclari_faz3_podcast_uretim.sql` | SQL / DDL | Cogniti kapsamında öğrenme araçları faz3 Podcast üretim için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `ogrenme_araclari`, `uretim_podcast_soru_zinciri_ac`, `uretim_podcast_dogrula` veritabanı nesnelerini ele alır. |
| `ogrenme_araclari_faz3_podcast_v1_v3_iu_ai.sql` | SQL / Kaynak ve Denetim | ogrenme araclari faz3 podcast v1 v3 iu ai için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `podcast_transkript_ai_baslat_atomik`. |
| `ogrenme_araclari_faz3_podcast_v1_v3_revizyonda_transkript.sql` | SQL / Kaynak ve Denetim | ogrenme araclari faz3 podcast v1 v3 revizyonda transkript için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `uretim_podcast_uretici_karar_ver`. |
| `ogrenme_araclari_faz3_podcast_v1_v3_tercih.sql` | SQL / Kaynak ve Denetim | ogrenme araclari faz3 podcast v1 v3 tercih için SQL sözleşmesi veya denetim sorgularını içerir. |
| `ogrenme_araclari_faz3_podcast_v1_v3_teslim.sql` | SQL / Kaynak ve Denetim | ogrenme araclari faz3 podcast v1 v3 teslim için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `uretim_podcast_dogrula`. |
| `ogrenme_araclari_faz4_gorsel_uretim.sql` | SQL / DDL | Cogniti kapsamında öğrenme araçları faz4 Dijital Broşür üretim için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `uretim_gorsel_dogrula`, `uretim_gorsel_uretici_karar_ver` veritabanı nesnelerini ele alır. |
| `ogrenme_araclari_faz5_flip_pdf_uretim.sql` | SQL / DDL | Cogniti kapsamında öğrenme araçları faz5 flip pdf üretim için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `uretim_flip_pdf_dogrula`, `uretim_flip_pdf_uretici_karar_ver` veritabanı nesnelerini ele alır. |
| `ogrenme_araclari_faz5_podcast_v1_v3_ai_guvenlik.sql` | SQL / Kaynak ve Denetim | ogrenme araclari faz5 podcast v1 v3 ai guvenlik için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `podcast_transkript_ai_baslat_atomik`. |
| `ogrenme_araclari_faz6_rapor_arac_turu.sql` | SQL / DDL | Cogniti kapsamında öğrenme araçları faz6 rapor araç turu için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `v_rapor_arac_turu_ozet` veritabanı nesnelerini ele alır. |
| `ogrenme_araclari_modernizasyon_faz2_gorsel_teslim.sql` | SQL / Kaynak ve Denetim | ogrenme araclari modernizasyon faz2 gorsel teslim için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `uretim_gorsel_dogrula`. |
| `ogrenme_araclari_modernizasyon_faz3_literatur_teslim.sql` | SQL / Kaynak ve Denetim | ogrenme araclari modernizasyon faz3 literatur teslim için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `uretim_flip_pdf_dogrula`. |
| `ogrenme_araclari_tamamlama_faz4_uretim_hatti.sql` | SQL / DDL | Cogniti kapsamında öğrenme araçları tamamlama faz4 üretim hatti için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `uretim_gorevi_arac_esitle`, `uretim_talep_ilk_gorevini_ac`, `uretim_podcast_soru_zinciri_ac` veritabanı nesnelerini ele alır. |
| `ogrenme_araclari_tamamlama_faz6_hbstore_fonksiyon_teshis.sql` | SQL / Denetim | Cogniti kapsamında öğrenme araçları tamamlama faz6 hbstore fonksiyon teshis için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar. |
| `ogrenme_araclari_tamamlama_faz6_mutabakat.sql` | SQL / DDL | Cogniti kapsamında öğrenme araçları tamamlama faz6 mutabakat için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar. |
| `ogrenme_araclari_tamamlama_faz6_puan_bagi_teshis.sql` | SQL / Denetim | Cogniti kapsamında öğrenme araçları tamamlama faz6 puan bagi teshis için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar. |
| `ogrenme_araclari_tamamlama_faz6_puan_butunlugu.sql` | SQL / DDL | Cogniti kapsamında öğrenme araçları tamamlama faz6 puan butunlugu için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `get_harcama_bakiyesi`, `ogrenme_puani_izleme_bagini_dogrula`, `trg_ogrenme_puani_bag_utt` veritabanı nesnelerini ele alır. |
| `ogrenme_araclari_tamamlama_faz6_puan_tekillik_mutabakat.sql` | SQL / DDL | Cogniti kapsamında öğrenme araçları tamamlama faz6 puan tekillik mutabakat için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar. |
| `ogrenme_araclari_tamamlama_faz7_raporlama.sql` | SQL / DDL | Cogniti kapsamında öğrenme araçları tamamlama faz7 raporlama için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `eczanem_cevap_kayitlari`, `eczanem_cevaplari_kaydet`, `v_rapor_arac_turu_ozet` veritabanı nesnelerini ele alır. |
| `oneri_kaybi_tara.sql` | SQL / DDL | Cogniti kapsamında öneri kaybi tara için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `oneri_kaybi_tara` veritabanı nesnelerini ele alır. |
| `ortak_test_adresi_atama.sql` | SQL / Kaynak ve Denetim | ortak test adresi atama için SQL sözleşmesi veya denetim sorgularını içerir. |
| `pm09_eczanem_yayin_durdurma_kapisi.sql` | SQL / DDL | Cogniti kapsamında pm09 Eczanem yayın durdurma kapisi için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `eczanem_utt_eczaneye_gonder`, `eczanem_musterilere_video_gonder` veritabanı nesnelerini ele alır. |
| `podcast_kapak_yukleme_guvenligi.sql` | SQL / Kaynak ve Denetim | podcast kapak yukleme guvenligi için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `podcast_kapak_yukleme_baslat_atomik`, `podcast_kapak_yukleme_tamamla_atomik`, `podcast_kapak_yukleme_iptal_atomik`, `ogrenme_araci_kapak_yukleme_baslat_atomik`. |
| `podcast_karar_idempotent_yanit_duzeltmesi.sql` | SQL / Kaynak ve Denetim | podcast karar idempotent yanit duzeltmesi için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `uretim_podcast_uretici_karar_ver`. |
| `puan_urun_opsiyonel.sql` | SQL / DDL | Cogniti kapsamında puan ürün opsiyonel için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `kazanilan_puanlar`, `yanlis_cevap_kayitlari`, `ileri_sarma_kayitlari` veritabanı nesnelerini ele alır. |
| `push_tablolar.sql` | SQL / DDL | Cogniti kapsamında Web Push tablolar için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `push_abonelikleri`, `push_gonderim_kayitlari` veritabanı nesnelerini ele alır. |
| `rapor_puan_hesaplari_ortaklastirma.sql` | SQL / Kaynak ve Denetim | rapor puan hesaplari ortaklastirma için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `get_bolge_bazli_grup`, `get_bm_utt_performans_v2`, `get_yonetici_hiyerarsi_v2`, `get_yonetici_rapor_ana_ozet_v2`. |
| `sema_kontrol_test_rapor_tablolari.sql` | SQL / Kaynak ve Denetim | sema kontrol test rapor tablolari için SQL sözleşmesi veya denetim sorgularını içerir. |
| `soru_kesinti_faz2_tamamla.sql` | SQL / DDL | Cogniti kapsamında soru kesinti faz2 tamamlama için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `utt_izleme_tamamla`, `cc_izleme_tamamla`, `eclub_izleme_tamamla` veritabanı nesnelerini ele alır. |
| `soru_kesinti_faz5_cevap.sql` | SQL / DDL | Cogniti kapsamında soru kesinti faz5 cevap için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `cc_cevaplari_kaydet`, `eclub_cevaplari_kaydet`, `eczanem_cevaplari_kaydet_cekirdek` veritabanı nesnelerini ele alır. |
| `soru_kesinti_kurali.sql` | SQL / DDL | Cogniti kapsamında soru kesinti kurali için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `izleme_kayitlari`, `cc_izleme_kayitlari`, `eclub_izleme_kayitlari` veritabanı nesnelerini ele alır. |
| `talep_olusturma_idempotent.sql` | SQL / DDL | Cogniti kapsamında talep olusturma idempotent için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `talepler`, `talep_atomik_olustur` veritabanı nesnelerini ele alır. |
| `talepler_hedef_rol_temizle.sql` | SQL / DDL | Cogniti kapsamında talepler hedef rol temizle için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `talepler`, `v_yayin_detay`, `v_yayin_kunye` veritabanı nesnelerini ele alır. |
| `talepler_hedef_roller.sql` | SQL / DDL | Cogniti kapsamında talepler hedef roller için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `talepler`, `talepler_hedef_roller_esitle`, `talepler_hedef_roller_esitle_trg` veritabanı nesnelerini ele alır. |
| `talepler_icerik_turu_urun_medikal.sql` | SQL / DDL | Cogniti kapsamında talepler icerik turu ürün medikal için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `talepler` veritabanı nesnelerini ele alır. |
| `test_bm_puan_ozet_ve_hbstore.sql` | SQL / Kaynak ve Denetim | test bm puan ozet ve hbstore için SQL sözleşmesi veya denetim sorgularını içerir. |
| `test_eclub_store_donemlik_siparis_takvimi.sql` | SQL / Kaynak ve Denetim | test eclub store donemlik siparis takvimi için SQL sözleşmesi veya denetim sorgularını içerir. |
| `test_hbstore_donemlik_siparis_takvimi.sql` | SQL / Kaynak ve Denetim | test hbstore donemlik siparis takvimi için SQL sözleşmesi veya denetim sorgularını içerir. |
| `test_rapor_puan_hesaplari_ortaklastirma.sql` | SQL / Kaynak ve Denetim | test rapor puan hesaplari ortaklastirma için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `get_bolge_bazli_grup`, `get_bm_utt_performans_v2`, `get_yonetici_hiyerarsi_v2`, `get_yonetici_rapor_ana_ozet_v2`. |
| `test_veri_sayim.sql` | SQL / DDL | Cogniti kapsamında test veri sayim için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `test_veri_sayim` veritabanı nesnelerini ele alır. |
| `test_veri_temizle.sql` | SQL / DDL | Cogniti kapsamında test veri temizle için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `test_veri_temizle` veritabanı nesnelerini ele alır. |
| `tm_bm_toplam_dogrulama.sql` | SQL / DDL | Cogniti kapsamında tm bm toplam dogrulama için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar. |
| `tm_eski_rpc_bagimlilik_taramasi.sql` | SQL / DDL | Cogniti kapsamında tm eski rpc bagimlilik taramasi için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar. |
| `tm_eski_rpc_kaldir.sql` | SQL / DDL | Cogniti kapsamında tm eski rpc kaldir için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar. |
| `uretici_eski_nesne_bagimlilik_taramasi.sql` | SQL / DDL | Cogniti kapsamında üretici eski nesne bagimlilik taramasi için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar. |
| `uretici_eski_nesne_kaldir.sql` | SQL / DDL | Cogniti kapsamında üretici eski nesne kaldir için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar. |
| `uretim_atomik_rpc.sql` | SQL / DDL | Cogniti kapsamında üretim atomik rpc için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `uretim_soru_seti_dogrula`, `uretim_senaryo_teslim_et`, `uretim_video_teslim_et` veritabanı nesnelerini ele alır. |
| `uretim_bildirim_guvenlik.sql` | SQL / DDL | Cogniti kapsamında üretim bildirim güvenlik için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `bildirimler`, `uretim_gorevleri`, `uretim_gorev_atama_gecmisi` veritabanı nesnelerini ele alır. |
| `uretim_gorevleri_canli_gecis.sql` | SQL / DDL | Cogniti kapsamında üretim gorevleri canli gecis için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `uretim_gorevleri` veritabanı nesnelerini ele alır. |
| `uretim_karar_surum_kapisi.sql` | SQL / DDL | Cogniti kapsamında üretim karar surum kapisi için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `uretim_karar_surum_kapisi`, `uretim_uretici_karar_ver`, `uretim_podcast_uretici_karar_ver` veritabanı nesnelerini ele alır. |
| `uretim_revizyon_tavani_artir.sql` | SQL / Kaynak ve Denetim | uretim revizyon tavani artir için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `uretim_uretici_karar_ver`, `uretim_video_uretici_karar_ver`, `uretim_podcast_uretici_karar_ver`, `uretim_gorsel_uretici_karar_ver`. |
| `urun_gorunen_id_atomik.sql` | SQL / Kaynak ve Denetim | urun gorunen id atomik için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `urun_gorunen_id_koru_ve_ata`, `firma_no_urun_id_koru`. |
| `utt_eclub_puan_kazanimi.sql` | SQL / Kaynak ve Denetim | utt eclub puan kazanimi için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `get_kullanici_ozet`, `get_kullanici_urun_dagilimi`, `get_kullanici_kategori_dagilimi`, `get_bolge_bazli_grup`. |
| `utt_izleme_oturum_modeli.sql` | SQL / DDL | Cogniti kapsamında UTT izleme oturum modeli için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `izleme_kayitlari`, `ileri_sarma_kayitlari`, `videolar` veritabanı nesnelerini ele alır. |
| `utt_izleme_oturum_modeli_on_kontrol.sql` | SQL / Denetim | Cogniti kapsamında UTT izleme oturum modeli on kontrol için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar. |
| `utt_izleme_tamamla_rpc.sql` | SQL / DDL | Cogniti kapsamında UTT izleme tamamlama rpc için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `utt_izleme_tamamla` veritabanı nesnelerini ele alır. |
| `v_rapor_begeni_favori_v3.sql` | SQL / DDL | Cogniti kapsamında v rapor beğeni favori v3 için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `v_rapor_begeni_favori_v3` veritabanı nesnelerini ele alır. |
| `v_uretici_icerik_takip.sql` | SQL / DDL | Cogniti kapsamında v üretici icerik takip için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `v_uretici_icerik_takip` veritabanı nesnelerini ele alır. |
| `v_yayin_detay_firma_id.sql` | SQL / DDL | Cogniti kapsamında v yayın detay firma id için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `v_yayin_detay` veritabanı nesnelerini ele alır. |
| `v_yayin_detay_urun_adi_fallback.sql` | SQL / DDL | Cogniti kapsamında v yayın detay ürün adi fallback için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `v_yayin_detay` veritabanı nesnelerini ele alır. |
| `v_yayin_detay_video_suresi.sql` | SQL / DDL | Cogniti kapsamında v yayın detay video suresi için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `v_yayin_detay` veritabanı nesnelerini ele alır. |
| `v_yayin_kunye.sql` | SQL / DDL | Cogniti kapsamında v yayın künye için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `v_yayin_kunye` veritabanı nesnelerini ele alır. |
| `video_hazir_akisi_asenkron_yayin.sql` | SQL / Kaynak ve Denetim | video hazir akisi asenkron yayin için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `yayin_arac_kapisini_dogrula`. |
| `video_ortak_model_hazirlik.sql` | SQL / Kaynak ve Denetim | video ortak model hazirlik için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `v_uretici_ogrenme_araci_takip`, `v_yayin_detay`, `uretim_gorev_ac`, `uretim_video_teslim_et`. |
| `video_ortak_model_sonlandir.sql` | SQL / Kaynak ve Denetim | video ortak model sonlandir için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `yayin_oncesi_silme_baslat`, `yayin_oncesi_silme_tamamla`, `legacy_video_yazimini_engelle`. |
| `yarim_ogrenme_araci_yuklemeleri.sql` | SQL / DDL | Cogniti kapsamında yarım öğrenme araci yuklemeleri için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `ogrenme_araci_video_yukleme_oturumlari`, `ogrenme_araci_yarim_yukleme_iptal` veritabanı nesnelerini ele alır. |
| `yayin_aktivasyon.sql` | SQL / DDL | Cogniti kapsamında yayın aktivasyon için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `yayin_planlananlari_aktive` veritabanı nesnelerini ele alır. |
| `yayin_oncesi_silme.sql` | SQL / DDL | Cogniti kapsamında yayın oncesi silme için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `talepler`, `yayin_oncesi_silme_yayin_kapisi`, `trg_yayin_oncesi_silme_yayin_kapisi` veritabanı nesnelerini ele alır. |
| `yonetim_egitimleri_icerik_turu.sql` | SQL / DDL | Cogniti kapsamında yönetim egitimleri icerik turu için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar; başlıca `talepler`, `iu_genel_atamalari`, `iu_genel_atamasi_ayarla` veritabanı nesnelerini ele alır. |

### 📁 scripts/sql/utt_izleme_on_kontrol/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `01_gecis_kapsami.sql` | SQL / Denetim | Cogniti kapsamında 01 gecis kapsami için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar. |
| `02_kazanim_mukerrerleri.sql` | SQL / Denetim | Cogniti kapsamında 02 kazanim mukerrerleri için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar. |
| `03_cevap_mukerrerleri.sql` | SQL / Denetim | Cogniti kapsamında 03 cevap mukerrerleri için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar. |
| `04_kayip_mukerrerleri.sql` | SQL / Denetim | Cogniti kapsamında 04 kayip mukerrerleri için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar. |
| `05_cevaplanmis_tamamlanmis.sql` | SQL / Denetim | Cogniti kapsamında 05 cevaplanmis tamamlanmis için şema, veri bütünlüğü veya atomik işlem kurallarını tanımlar. |

### 📁 tests/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `_alias-hooks.mjs` | Test / Node.js | Node test çalıştırıcısında `@/` proje kökü alias'ını çözen ESM resolve ve load hook'larını tanımlar. |
| `_alias.mjs` | Test / Node.js | Smoke testler başlamadan önce TypeScript dönüşümünü ve `@/` alias çözümleyicisini kaydeden ön yükleme betiğidir. |
| `adminEczanemBagimliligi.hedef.test.ts` | Test / Kaynak | “admin firma anahtarı ve modül kartı E-Club kapalıyken Eczanem açılışını engeller” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `adminEczanemBannerApi.hedef.test.ts` | Test / Kaynak | “Eczanem bannerı yüklenir, değiştirilir, silinir; aynı sıradaki E-Club kaydı korunur” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `adminEczanemBannerYukleme.hedef.test.ts` | Test / Kaynak | “Admin Eczanem alanı mevcut yükleme akışını kullanır; seçim yayınlamaz, yayınla/değiştir/kaldır doğru alana gider” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `adminEczanemUyeleri.hedef.test.ts` | Test / Kaynak | “Liste firma ve filtreleri RPC” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `adminHiyerarsiTekillik.hedef.test.ts` | Test / TypeScript | “hiyerarşi adı yinelenen boşluklardan arındırılır” davranışını otomatik olarak doğrulayan hedef testidir. |
| `adminTekilSilTalepKimligi.smoke.test.ts` | Test / Kaynak | “admin tekil silme yayın kodunun sonundaki numarayı çözer” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `adminTopluPaketButunlugu.hedef.test.ts` | Test / TypeScript | “tek hatalı satır bütün paketi engeller” davranışını otomatik olarak doğrulayan hedef testidir. |
| `bmDavranisRaporu.smoke.test.ts` | Test / Kaynak | “Bölge puanları kişisel kurallarla toplanır; dış bölge ve dönem dışı kayıtlar alınmaz” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `bmKategoriSecimi.smoke.test.ts` | Test / Kaynak | “BM seçimi kategori geçişinde yayın, UTT ve tarihleri korur” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `bmOneriGonderimPaneli.hedef.test.ts` | Test / Kaynak | “BM paneli alıcı, zaman ve özet sırasıyla; yalnız yeterli hak ve geçerli tarihle ilerler” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `bmPuanHesaplari.smoke.test.ts` | Test / Kaynak | “HB Ligi getBmPerformans: RPC” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `bmRaporToplamlari.smoke.test.ts` | Test / TypeScript | “mutlu: UTT özetleri ile aynı kategori ve ürün satırları bölge toplamına dönüşür” davranışını otomatik olarak doğrulayan smoke testidir. |
| `bunnyVideoSuresi.smoke.test.ts` | Test / TypeScript | “Bunny video süresi pozitif tam saniye olarak çözülür” davranışını otomatik olarak doğrulayan smoke testidir. |
| `ccAliciGecerliTur.hedef.test.ts` | Test / Kaynak | “alıcı kontrolü yalnız geçerli turdaki tamamlanmış ilgili yayını sayar” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `ccChallengeGonderimGuvenligi.smoke.test.ts` | Test / TypeScript | “mutlu: challenge ile gönderme puanı tek atomik RPC içinde oluşturulur” davranışını otomatik olarak doğrulayan smoke testidir. |
| `ccChallengeYasamDongusu.smoke.test.ts` | Test / TypeScript | “mutlu: alıcı ve gönderici aynı challenge durumunu kullanır” davranışını otomatik olarak doğrulayan smoke testidir. |
| `ccIzlemeCevapGuvenligi.smoke.test.ts` | Test / TypeScript | “mutlu: C-Club tamamlama, soru, puan ve challenge sonucu atomik sözleşmeye bağlıdır” davranışını otomatik olarak doğrulayan smoke testidir. |
| `ccOgrenmeAraciYayinKimligi.smoke.test.ts` | Test / TypeScript | “C-Club challenge ve izleme kayıtları ortak araç kimliğini taşır” davranışını otomatik olarak doğrulayan smoke testidir. |
| `ccSuresizCevap.hedef.test.ts` | Test / Kaynak | “geçişte ve iki kaynakta eski tarih reddi kaldırılmıştır” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `ccVeriKaynaklari.smoke.test.ts` | Test / TypeScript | “mutlu: CC özet ve backfill yalnız C-Club puan/kayıp tablolarını kullanır” davranışını otomatik olarak doğrulayan smoke testidir. |
| `ccYayinGirisi.smoke.test.ts` | Test / TypeScript | “mutlu: başlangıç videosu BM hedefi, firma ve geçerli yayın tarihleriyle süzülür” davranışını otomatik olarak doğrulayan smoke testidir. |
| `ccYetkilendirmeGuvenligi.smoke.test.ts` | Test / TypeScript | “mutlu: CC izleme kimliği oturumdan alınır ve firma erişimi doğrulanır” davranışını otomatik olarak doğrulayan smoke testidir. |
| `dagitimIcerikOzeti.smoke.test.ts` | Test / Kaynak | “ortak dağıtım özeti sunucunun thumbnail URL” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `diffHesapla.smoke.test.ts` | Test / TypeScript | “mutlu: degisen kelime cikar+ekle, kalan ayni olarak ayristirilir” davranışını otomatik olarak doğrulayan smoke testidir. |
| `eclubAdminCekOperasyonu.smoke.test.ts` | Test / Kaynak | “Admin 1: Çek talepleri operasyon satırı veri bütünlüğü ve zorunlu alanlar” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubAnaSayfaDonus.hedef.test.ts` | Test / Kaynak | “60 saniye dolmuş panel hemen açılır, ağ sonucu yeniler; zorunlu yenileme ve yetki hatası önbelleği aşar” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubAnaSayfaHiz.hedef.test.ts` | Test / Kaynak | “öncelikli kapak eager/high, diğer yayın kapakları lazy yüklenir” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubBanner.hedef.test.ts` | Test / Kaynak | “Platform firması adı değişse de kimliğiyle beş, diğer firmalar üç banner kullanır” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubBannerYayinlama.hedef.test.ts` | Test / Kaynak | “Seçim yalnız yerel önizleme oluşturur; yayınlama, vazgeçme ve hata mevcut bannerı korur” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubBmHediyeTakip.hedef.test.ts` | Test / Kaynak | “BM E-Club Takımım sayfasından Hediye Takibi” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubBmTakimim.hedef.test.ts` | Test / Kaynak | “BM sidebar” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubBmYayinlari.hedef.test.ts` | Test / Kaynak | “BM sidebar” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubCekAkisiFaz6.hedef.test.ts` | Test / Kaynak | “Faz 6 seed” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubCekEpostaWorker.hedef.test.ts` | Test / Kaynak | “e-posta işi eşzamanlı workerlar arasında güvenli sahiplenilir” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubCekPushWorker.hedef.test.ts` | Test / Kaynak | “push işi eşzamanlı workerlar arasında güvenli sahiplenilir” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubCekTakibiApiHiz.hedef.test.ts` | Test / Kaynak | “çek takibi erişimi bir kez çözülür; ürün ve eczane/firma kapsamı korunur” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubCekTakibiHiz.hedef.test.ts` | Test / Kaynak | “takip dönüşü beklemez; doğrulama sonrası bildirim okunur, iptal iki önbelleği yeniler ve yetki hatası veriyi kaldırır” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubCekTalebiAnaEczaci.hedef.test.ts` | Test / Kaynak | “yalnız ana eczacı rolü çek talebi oluşturabilir” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubCekTalebiHiz.hedef.test.ts` | Test / Kaynak | “çek vitrinine dönüş beklemez; güncellik, talep sonrası yenileme ve kapsam ayrımı korunur” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubCekTeslimatOutbox.hedef.test.ts` | Test / Kaynak | “outbox şeması e-posta ve push işlerini ortak sözleşmede tutar” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubCekUygulamaBildirimi.hedef.test.ts` | Test / Kaynak | “çek kaydıyla uygulama bildirimi aynı transaction içinde oluşur” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubCokluUttUyelik.smoke.test.ts` | Test / TypeScript | “mutlu: aynı firmanın farklı UTT'leri tek kurumsal eczane bağında ayrı liste üyelikleri kurar” davranışını otomatik olarak doğrulayan smoke testidir. |
| `eclubDepo.hedef.test.ts` | Test / Kaynak | “şubeli depoda adsız kaydı merkez saymaz ve aktif şube seçtirir” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubDepoKaldirma.hedef.test.ts` | Test / Kaynak | “üç harf sonrası kısa/resmi ad ve Türkçe karakterlerle arar; seçili ve uygun olmayan kayıtları dışlar” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubDortKazanimModeli.hedef.test.ts` | Test / Kaynak | “E-Club üreticisi dört ayrı kazanım hâli seçer” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubEczanemMobilYayinAkisi.smoke.test.ts` | Test / TypeScript | E-Club ve Eczanem yayın yüzeylerinin `MobilYayinAkisi` entegrasyonu, 2+5 akışı ve a11y bağlantılarını doğrulayan smoke testidir. |
| `eclubFirmaAdiApi.hedef.test.ts` | Test / Kaynak | eclub Firma Adi Api.hedef.test kapsamındaki test veya doğrulama senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubFirmaGezinme.smoke.test.ts` | Test / Kaynak | “bir firmanın açık mağazası diğer firmanın çek erişimini açmaz” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubFirmaYayinlarHiz.hedef.test.ts` | Test / Kaynak | “firma bilgisi beklenirken yayın ve banner başlar; süresi dolmuş önbellekli dönüş ağ beklemez ve arka planda doğrulanır” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubFizikselStoreKaldirma.hedef.test.ts` | Test / Kaynak | “fiziksel katalog, adres ve yönetim yüzeyleri kaldırıldı” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubGeriyeDonukUyumluluk.hedef.test.ts` | Test / Kaynak | “Faz 9 Migration Sözleşmesi: Tekrar güvenli (idempotent) ve veri koruyucu DDL” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubGonderiAyarlari.smoke.test.ts` | Test / TypeScript | “E-Club gönderi ayarları iki pozitif tam sayı kuralını tek kaynaktan tanımlar” davranışını otomatik olarak doğrulayan smoke testidir. |
| `eclubGonderilecekVideolar.smoke.test.ts` | Test / TypeScript | “mutlu: öğrenme aracı önizlemesi dört araç türünü salt görüntüler” davranışını otomatik olarak doğrulayan smoke testidir. |
| `eclubGonderim.postgres.mjs` | Test / Kaynak | eclub Gonderim.postgres kapsamındaki test veya doğrulama senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubGonderimApi.smoke.test.ts` | Test / Kaynak | “eski tek yayın isteği ve yeni çoklu seçim aynı sözleşmeye dönüşür” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubGonderimDurumlari.hedef.test.ts` | Test / Kaynak | “kişi tekrar gönderimlerinde yalnız en güncel kayıt durum yüzüne alınır” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubGonderimEkrani.hedef.test.ts` | Test / Kaynak | “yalnız gelecek bir Türkiye tarihi seçilir; saat istenmez” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubGonderimPaneli.hedef.test.ts` | Test / Kaynak | “inceleme bitmeden gönderim adımına geçilmez; planlama yalnız tarih seçtirir” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubGonderimPlanIsleyici.smoke.test.ts` | Test / Kaynak | “eksik/yanlış cron yetkisi ve boş ortam anahtarı reddedilir” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubGuvenlikVeMigrationDenetimi.hedef.test.ts` | Test / Kaynak | “Faz 10 Denetim 1: Transaction ve Advisory Lock bütünlüğü” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubHediyeCekiCekliPuan.hedef.test.ts` | Test / Kaynak | “Faz 8 SQL Sözleşmesi: eclub_store_onceki_deviri_hazirla yalnız Çekli Puanı işler ve devreder” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubHediyeTakipDurumlari.hedef.test.ts` | Test / Kaynak | “ilk yükleme ayrı ve görünür bir durum olarak sunulur” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubHediyeTakipErisilebilirlik.hedef.test.ts` | Test / Kaynak | “takip toggle” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubHediyeTakipErisim.hedef.test.ts` | Test / Kaynak | “Çek Takip yalnız UTT ve KD_UTT rollerine açıktır” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubHediyeTakipFiltreleri.hedef.test.ts` | Test / Kaynak | “boş sorgu güvenli varsayılan filtreleri ve 30 kayıt sınırını üretir” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubHediyeTakipGiris.hedef.test.ts` | Test / Kaynak | “E-Club Takımım sayfası Hediye Takip girişini doğru rotaya açar” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubHediyeTakipKabuk.hedef.test.ts` | Test / Kaynak | “Hediye Takip kabuğu başlık, stat kartları, toggle ve içerik sırasını korur” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubHediyeTakipListesi.hedef.test.ts` | Test / Kaynak | “masaüstü liste kararlaştırılan on iki başlığı taşır” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubHediyeTakipSiparis.hedef.test.ts` | Test / Kaynak | “sipariş durumu çek onay basamağından değil UTT onayından türetilir” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubHediyeTakipSozlesme.hedef.test.ts` | Test / Kaynak | “Çek Takip yanıtı stat, filtre, talep ve sayfalama bölümlerini zorunlu tutar” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubHediyeTakipStatlari.hedef.test.ts` | Test / Kaynak | “onay statı UTT, BM ve TM onay adımlarını birlikte sayar” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubHediyeTakipTeslimat.hedef.test.ts` | Test / Kaynak | “takip tablosu çek, içerik ve teslimat bilgilerini ayrı sütunlarda gösterir” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubHediyeTakipTestKapisi.hedef.test.ts` | Test / Kaynak | “rol kapsamı yalnız UTT ve KD_UTT” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubHediyeTakipTestVerisiSql.hedef.test.ts` | Test / Kaynak | “Hediye Takibi görünüm testi yalnız bilinen UTT ve 111 test eczanesi kapsamındadır” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubHediyeTakipUttIslemi.hedef.test.ts` | Test / Kaynak | “yalnız oturumdaki UTT” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubHoykDurumGorunumu.hedef.test.ts` | Test / Kaynak | “süre bilgisi Türkiye gece yarısında tam bir gün ilerler” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubHoykSecim.hedef.test.ts` | Test / Kaynak | “HOYK thumbnail ve bilgi alanları korunurken Önizle ve Seç ayrı eylemlerdir; BM seçemez” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubIleriSarmaCekKarsiligi.hedef.test.ts` | Test / Kaynak | “Faz 4 Migration Sözleşmesi: eclub_ileri_sarma_kayitlari ve merkezi BEFORE INSERT trigger” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubIzlemeKurali.smoke.test.ts` | Test / TypeScript | “mutlu: aktif öneri puan ve soru hakkı verir; soru kümesi sabittir” davranışını otomatik olarak doğrulayan smoke testidir. |
| `eclubKazanilanPuanCekKarsiligi.hedef.test.ts` | Test / Kaynak | “Faz 3 Migration Sözleşmesi: eclub_kazanilan_puanlar ve merkezi BEFORE INSERT trigger” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubKisiErisim.smoke.test.ts` | Test / TypeScript | “mutlu: en az bir aktif bağlı firma E-Club, Store ve Eczanem erişimini açar” davranışını otomatik olarak doğrulayan smoke testidir. |
| `eclubKisiUnvanlari.smoke.test.ts` | Test / TypeScript | “E-Club eczacı unvanları eczacı hedef kitlesine bağlanır” davranışını otomatik olarak doğrulayan smoke testidir. |
| `eclubLigHesapAyrismasi.hedef.test.ts` | Test / Kaynak | “Faz 5 Migration Sözleşmesi: get_eclub_utt_rapor fonksiyonu ve sütunları” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubLigPeriyot.smoke.test.ts` | Test / TypeScript | “mutlu: haftalık ve dönemlik lig seçimlerini doğrular” davranışını otomatik olarak doğrulayan smoke testidir. |
| `eclubLigRaporPuanAyrimi.hedef.test.ts` | Test / Kaynak | “lig puanı çekli ve çeksiz performans puanlarının toplamıdır” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubNav.smoke.test.ts` | Test / TypeScript | “UTT E-Club altında kararlaştırılan yönetim alanlarını doğru sırada görür” davranışını otomatik olarak doğrulayan smoke testidir. |
| `eclubNihaiRegresyon.hedef.test.ts` | Test / Kaynak | “Senaryo 1 & 4: Üretici Çekli Puan seçerek E-Club yayını oluşturabilir, barem ve dönüşüm alanları zorunludur” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubOgrenmeAraciYayinKimligi.smoke.test.ts` | Test / TypeScript | “E-Club öneri kataloğu legacy video zinciri olmadan ortak araç kimliğini döndürür” davranışını otomatik olarak doğrulayan smoke testidir. |
| `eclubOneriKapsam.smoke.test.ts` | Test / TypeScript | “mutlu: UTT kendi takımının ve firma-geneli E-Club yayınını kullanabilir” davranışını otomatik olarak doğrulayan smoke testidir. |
| `eclubPerformans.hedef.test.ts` | Test / Kaynak | “iki aylık takvim Türkiye saatinde başlar; yıl ve artık yıl son günleri kaybolmaz” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubPerformansApi.hedef.test.ts` | Test / Kaynak | “oturumsuz istek veri okumadan reddedilir; firma ve ürün yetkisi sunucuda doğrulanır” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubPerformansArayuz.hedef.test.ts` | Test / Kaynak | “grafik seçimi üye katkısını açar; otomatik güncelleme seçimleri korur ve ürün değişiminde eski veri gizlenir” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubPerformansGrafik.hedef.test.ts` | Test / Kaynak | “ECharts dört sabit satırı ve sekiz haftayı masaüstü ve mobil genişlikte çizer” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubPerformansTasarim.hedef.test.ts` | Test / Kaynak | “onaylı görünüm korunur; üye tablosu altı puan sütununa genişler” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubPlanlananlar.hedef.test.ts` | Test / Kaynak | “planlanan gönderimler yayın, gün ve eczaneye göre tek taranabilir satırda toplanır” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubPuanEczaneSabitleme.hedef.test.ts` | Test / Kaynak | “Faz 1A migration transaction, advisory lock ve tablo kilidi içerir” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubPuanTuruSecimi.hedef.test.ts` | Test / Kaynak | “Faz 1 & 2 Tip ve İstemci Sözleşmesi: Bekleyen arayüzü ve useYayinYonetimi state” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubPuanYazmaEczane.hedef.test.ts` | Test / Kaynak | “Faz 1B transaction korumalıdır ve Faz 1A bağımlılığını doğrular” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubRapor.smoke.test.ts` | Test / TypeScript | “mutlu: içerik satırlarını eczane ve kişi düzeyinde kayıpsız toplar” davranışını otomatik olarak doğrulayan smoke testidir. |
| `eclubSatisSartliCek.smoke.test.ts` | Test / Kaynak | “PM baremi boşluksuz ve çakışmasız olmalıdır” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubStoreAktifUyelikSiparis.smoke.test.ts` | Test / TypeScript | “E-Club Store sipariş API'si pasif kişinin yeni siparişini reddeder” davranışını otomatik olarak doğrulayan smoke testidir. |
| `eclubStoreCekTalebi.hedef.test.ts` | Test / Kaynak | “dinamik barem ve puan/TL karşılığı sabit eşik kullanmaz” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubStoreCekliPuanSinirlamasi.hedef.test.ts` | Test / Kaynak | “Faz 7 Migration Sözleşmesi: get_eclub_store_firma_bakiye içinde Çekli Puan filtreleri” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubStoreDurumSozlesmesi.hedef.test.ts` | Test / Kaynak | “çek talebi için tek kanonik durum sözleşmesi kullanılır” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubStoreRaporLigEczane.hedef.test.ts` | Test / Kaynak | “Faz 1C transaction korumalıdır ve zorunlu eczane_id bağımlılığını doğrular” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubStoreTakvim.smoke.test.ts` | Test / Kaynak | “çek talebi yalnız iki aylık dönemi izleyen ayın 1–7” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubTakimlarLigiVeExport.hedef.test.ts` | Test / Kaynak | “Hedef Test 1: Takım tablosu çekli, çeksiz ve lig puanını ayrı gösterir” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubTestGln.smoke.test.ts` | Test / TypeScript | “30 test GLN benzersiz, 13 haneli ve 111 önekli üretilir” davranışını otomatik olarak doğrulayan smoke testidir. |
| `eclubTmHediyeTakip.hedef.test.ts` | Test / Kaynak | “TM onayı gerçek route üzerinden doğru RPC ve parametrelerle yapılır; kod okunmaz” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubTmSonOnay.hedef.test.ts` | Test / Kaynak | “TM onayı kanonik talep durumlarına eklendi” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubTmTakimYayin.hedef.test.ts` | Test / Kaynak | “BM gruplaması farklı BM” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubUyelikDaveti.hedef.test.ts` | Test / Kaynak | “hatalı token, kısa veya eşleşmeyen şifre Auth ve DB” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubUyelikDaveti.postgres.mjs` | Test / Kaynak | eclub Uyelik Daveti.postgres kapsamındaki test veya doğrulama senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubYayinBildirimAkisi.hedef.test.ts` | Test / Kaynak | “anlık gönderimde yalnız kaydedilen önerinin kimliğiyle SQL sonucundan sonra bildirilir” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubYayinGonderimFiltreleri.hedef.test.ts` | Test / Kaynak | “0/y, kısmi ve y/y gönderimde liste üyeliği” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubYayinRafiSirasi.smoke.test.ts` | Test / Kaynak | “E-Club ilk raf: giriş boyunca sıra sabit kalır; yeni giriş farklı sıralanabilir” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eczanemAktifUyelikGonderim.smoke.test.ts` | Test / TypeScript | “mutlu: aynı yayın gönderim ve ilerleme durumunu eczane/gönderim ekseninde ayırır” davranışını otomatik olarak doğrulayan smoke testidir. |
| `eczanemAnaSayfaBanner.hedef.test.ts` | Test / Kaynak | “ana sayfa yalnız admin Eczanem üye alanından platform bannerlarını okur” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eczanemAnaSayfaUstBolum.hedef.test.ts` | Test / Kaynak | “üst bölüm gerçek E-Club stat kartlarını kullanır; kullanılabilir puan mevcut eczane/ürün bakiyelerinden gelir” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eczanemBannerAlanlari.hedef.test.ts` | Test / Kaynak | “Yalnız mevcut firma alanı ve tanımlı Eczanem banner alanları kabul edilir” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eczanemBmMutabakatTakip.smoke.test.ts` | Test / Kaynak | “BM Eczanem sidebarında yalnız Mutabakat Takip öğesini görür” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eczanemButunlukPaketi.smoke.test.ts` | Test / TypeScript | “mutlu: firma kapısı, atomik provizyon, sipariş tekilliği ve tek-sorgu liste birlikte kurulur” davranışını otomatik olarak doğrulayan smoke testidir. |
| `eczanemCokluUyelik.smoke.test.ts` | Test / TypeScript | “mutlu: kayıtlı müşteri kimliği değiştirilmeden ikinci eczaneye bağlanır” davranışını otomatik olarak doğrulayan smoke testidir. |
| `eczanemEclubBagimliligi.hedef.test.ts` | Test / Kaynak | “iki firmanın ayrı açık bayrakları birleştirilmez; ikinci açık firma erişimi korur” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eczanemEclubKontrolluGecis.smoke.test.ts` | Test / TypeScript | “mutlu: müşteri kararı ve aynı Auth hesabıyla atomik E-Club geçişi birlikte kurulur” davranışını otomatik olarak doğrulayan smoke testidir. |
| `eczanemEclubUyesiEngeli.smoke.test.ts` | Test / TypeScript | “mutlu: global E-Club kontrolü kanonik ve mevcut telefon biçimlerini kapsar” davranışını otomatik olarak doğrulayan smoke testidir. |
| `eczanemEczaciVideoDagitimi.smoke.test.ts` | Test / TypeScript | “mutlu: eczacı dağıtımı UTT ile aynı satır içi yönetim ve önizleme akışını kullanır” davranışını otomatik olarak doğrulayan smoke testidir. |
| `eczanemEczaneIslemKapsami.smoke.test.ts` | Test / TypeScript | “eczacı müşteri ve gönderim listeleri yalnız çözümlenen eczane bağlamını kullanır” davranışını otomatik olarak doğrulayan smoke testidir. |
| `eczanemEczaneYonetim.smoke.test.ts` | Test / TypeScript | “mutlu: personel izi ve ayrılmış sipariş kuyruğu ortak arayüzle kurulur” davranışını otomatik olarak doğrulayan smoke testidir. |
| `eczanemGezinme.hedef.test.ts` | Test / Kaynak | “doğrudan Puanlarım açılışında menü yüklenir; sayfa değişiminde mevcut eczaneler kaybolmaz” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eczanemGirisYonlendirmesi.hedef.test.ts` | Test / Kaynak | “oturumsuz Eczanem sayfaları ortak girişe yönlenir; silinmiş giriş adresine gitmez” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eczanemGonderimIncelemesi.smoke.test.ts` | Test / Kaynak | “Eczanem incelemesi firma/takım/hedef kapsamını ve E-Club ile aynı dört tamamlama koşulunu kullanır” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eczanemIzlemeCevapGuvenligi.smoke.test.ts` | Test / TypeScript | “mutlu: izleme ve cevap akışı sabit soru kümesiyle atomik RPC'leri kullanır” davranışını otomatik olarak doğrulayan smoke testidir. |
| `eczanemMusteriAuthKapisi.smoke.test.ts` | Test / TypeScript | “müşteri provizyonu geçerli Auth hesabı olmadan aktif müşteri oluşturmaz” davranışını otomatik olarak doğrulayan smoke testidir. |
| `eczanemMusteriTamSilme.smoke.test.ts` | Test / TypeScript | “mutlu: müşteri modal ve şifre teyidiyle bütün hesap zincirini siler” davranışını otomatik olarak doğrulayan smoke testidir. |
| `eczanemMusteriYuzeyi.smoke.test.ts` | Test / TypeScript | “mutlu: müşteri ana sayfası belirlenen altı dijital kanal rafını ve ayrı Puanlarım sayfasını sunar” davranışını otomatik olarak doğrulayan smoke testidir. |
| `eczanemOgrenmeAraciYayinKimligi.smoke.test.ts` | Test / TypeScript | “Eczanem iki dağıtım katmanında ortak araç kimliğini taşır ve doğrular” davranışını otomatik olarak doğrulayan smoke testidir. |
| `eczanemOrtakNavbar.hedef.test.ts` | Test / Kaynak | “ortak kabukta üyenin ana sayfa bağlantısı ve gerçek renk anahtarı çalışır” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eczanemOrtakSayfalar.hedef.test.ts` | Test / Kaynak | “ana sayfa gerçek ortak kabukta kapsamı ve yenilemede seçimi korur; profil mevcut silme onayını açar” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eczanemPanelBaglantisi.hedef.test.ts` | Test / Kaynak | “üye bağlantısı kimlik ve menüyü ortak kabuğa verir; firma servislerini çağırmaz” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eczanemSayfaBanner.hedef.test.ts` | Test / Kaynak | “Üç sayfa ayrı banner okur; ortak galeride seçim çalışır, boş sayfada alan gösterilmez” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eczanemSiparisOnayiYenileKaldirma.hedef.test.ts` | Test / Kaynak | “Yenile olmadan onay doğru POST” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eczanemUttMutabakat.smoke.test.ts` | Test / Kaynak | “Türkiye saatine göre varsayılan dönem önceki aydır; UUID ve dönem filtresi doğrulanır” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eczanemUttYonetim.smoke.test.ts` | Test / TypeScript | “mutlu: UTT yüzeyi panel kabuğunda, shadcn deseninde ve atomik gönderimle çalışır” davranışını otomatik olarak doğrulayan smoke testidir. |
| `eczanemUyeGonderimDurumlari.hedef.test.ts` | Test / Kaynak | “çoklu yayında yalnız aktif danışanların durumunu tüm sayfalardan toplar” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eczanemUyeMenusu.hedef.test.ts` | Test / Kaynak | “sidebar eczane ve firmada biter; ürün seçiliyken ilgili firma aktif kalır” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eczanemUyelikDurumu.smoke.test.ts` | Test / TypeScript | “mutlu: müşteri durumu eczaneye özel üyelik bağında okunur ve yazılır” davranışını otomatik olarak doğrulayan smoke testidir. |
| `eczanemUyelikListedenSilme.smoke.test.ts` | Test / TypeScript | “mutlu: eczacı liste silmesini tek atomik RPC ile yapar” davranışını otomatik olarak doğrulayan smoke testidir. |
| `eczanemVideoDagitimRozeti.smoke.test.ts` | Test / TypeScript | “mutlu: gönderilebilir videosu olan eczanenin Video Dağıtımı rozeti güncellenir” davranışını otomatik olarak doğrulayan smoke testidir. |
| `eczanemYayinAylikSayac.smoke.test.ts` | Test / Kaynak | “Eczanem aylık sayaç penceresi Türkiye saatinde ayın son gününü kapsar ve sonraki ay başında sıfırlanır” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eczanemYayinRafiGorunumu.hedef.test.ts` | Test / Kaynak | “Eczanem rafının başlık, kart genişliği, aralık, ok ve boş durum görünümü gerçek E-Club rafıyla eşleşir” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `egitimTuruSozlesmesi.smoke.test.ts` | Test / TypeScript | “eğitim türü sözleşmesi altı kanonik türü ve üretici rol yetkilerini doğru tutar” davranışını otomatik olarak doğrulayan smoke testidir. |
| `egitimYayinUrunFiltresi.hedef.test.ts` | Test / Kaynak | “ürünler tekrarsızdır; tür kapsülü ürün filtresinin ardından gelir ve kaynak liste değişmez” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `faz2TurBazliKapak.smoke.test.ts` | Test / Kaynak | “istemci thumbnail çözümleyicisi sunucu URL” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `firmaHeaderCoBranding.smoke.test.ts` | Test / Kaynak | “FIRMA_KOLONLARI logo_url ve ogrenme_platformu_aktif alanlarını içerir” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `firmaLogoOptimizasyonu.hedef.test.ts` | Test / Kaynak | “svgMi helper” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `formTemaRenkleri.hedef.test.ts` | Test / Kaynak | “gerçek YenileButonu sınıfları iki temanın renklerini alır; iç içe mavi kapsam korunur” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `gonderimKarari.smoke.test.ts` | Test / TypeScript | “mutlu: beklemedeki id ya da kendi durumsuz satiri -> guncelle + dogru id” davranışını otomatik olarak doğrulayan smoke testidir. |
| `gorselModernizasyonFaz2.hedef.test.ts` | Test / Kaynak | “PNG ve JPEG ölçüleri dosya baytlarından okunur” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `grafikHesaplananTema.hedef.test.ts` | Test / Kaynak | “CSS tek kaynak kalır; üretilen çıktı günceldir ve yalnız renk callback” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `hazirVideoTamamlama.smoke.test.ts` | Test / Kaynak | “hazır video zinciri ve süresi tamamlanınca yalnız aynı girişimin oturumu kapanır” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `hbligiKapsam.smoke.test.ts` | Test / TypeScript | “HBLigi üst rol kapsamları firma ve takım sınırını korur” davranışını otomatik olarak doğrulayan smoke testidir. |
| `hbstoreFirmaUrun.smoke.test.ts` | Test / TypeScript | “mutlu: global aktif ürün varsayılan veya açık firma ayarında görünür” davranışını otomatik olarak doğrulayan smoke testidir. |
| `hbstoreTakvim.smoke.test.ts` | Test / Kaynak | “takvim: 4 çeyreğin açılış ve kapanış sınırları TR saatine göre kesin doğrulanır” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `hedefRoller.smoke.test.ts` | Test / TypeScript | “hedef kitle sözleşmesi Eczacı ve Teknisyeni tekil ya da birlikte kabul eder” davranışını otomatik olarak doğrulayan smoke testidir. |
| `hoykOynaticiTema.hedef.test.ts` | Test / Kaynak | “HOYK gerçek CSS” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `icMusteriTelefonGirisi.smoke.test.ts` | Test / TypeScript | “mutlu: aktif iç müşteri kayıtlı cep telefonuyla aynı Auth hesabına giriş yapar” davranışını otomatik olarak doğrulayan smoke testidir. |
| `izlemeBaslat.smoke.test.ts` | Test / TypeScript | “ilk gerçek oynatma tek bir sunucu oturumu ister” davranışını otomatik olarak doğrulayan smoke testidir. |
| `izlemeKarari.smoke.test.ts` | Test / TypeScript | “ilk gerçek temiz tam izleme tam puan ve soru hakkı üretir” davranışını otomatik olarak doğrulayan smoke testidir. |
| `izlemeSonucToplamPuan.smoke.test.ts` | Test / Kaynak | “soru sonucu aynı izlemeye ait bütün başarılı puan kalemlerinin toplamını gösterir” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `karsilamaRotalari.hedef.test.ts` | Test / Kaynak | “oturumsuz /ana-sayfa adresi korunarak kök karşılama içeriği sunulur” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `kdUttMutabakatErisimi.hedef.test.ts` | Test / Kaynak | “Mutabakat menüsü UTT ve KD_UTT için aynı; diğer rollere ve kapalı modüle açılmaz” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `kursuYerlesimi.smoke.test.ts` | Test / Kaynak | “kursuYerlesimi: Normal durumda ilk 3 benzersiz şekilde kürsüye yerleşir” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `literaturKapakVeThumbnail.smoke.test.ts` | Test / Kaynak | “Kapak beyanı: JPG/JPEG doğru uzantı ve MIME kabul edilir” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `literaturModernizasyonFaz3.hedef.test.ts` | Test / Kaynak | “PDF sayfa sayısı ve arama metni sunucudaki baytlardan çıkarılır” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `loginKarsilama.hedef.test.ts` | Test / Kaynak | “login doğrudan formu açar; sıfırlama, değerler ve odak korunur; dönüş ayrı adrestedir” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `mobilHbstoreNavigasyonu.smoke.test.ts` | Test / Kaynak | “mobil FirmaStore grubu UTT, KD_UTT ve BM için C-Club bayrağından bağımsız ve tekil görünür” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `mobilYayinAkisi.smoke.test.ts` | Test / TypeScript | `MobilYayinAkisi` bileşeninin 2+5 kart basamaklı açılışını, görünüm hesaplama mantığını ve erişilebilirlik bağlantılarını doğrudan DOM etkileşimiyle doğrular. |
| `ogrenmeAraciErisimBasligi.smoke.test.ts` | Test / Kaynak | “ortak talep künyesi katalog ürününü serbest ürün adından önce kullanır” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `ogrenmeAraciFaz2Guvenlik.smoke.test.ts` | Test / TypeScript | “tamamlanan öğrenme araçları varsayılan açıktır” davranışını otomatik olarak doğrulayan smoke testidir. |
| `ogrenmeAraciFaz2Migration.smoke.test.ts` | Test / TypeScript | “migration eklemelidir ve eski video tablolarını kaldırmaz” davranışını otomatik olarak doğrulayan smoke testidir. |
| `ogrenmeAraciFaz2Sozlesme.smoke.test.ts` | Test / TypeScript | “kanonik araç sözleşmesi video ile üç yeni aracı birbirinden ayırır” davranışını otomatik olarak doğrulayan smoke testidir. |
| `ogrenmeAraciFaz3Talep.smoke.test.ts` | Test / TypeScript | “talep formu Video ve Podcast arasında tek öğrenme aracı seçer” davranışını otomatik olarak doğrulayan smoke testidir. |
| `ogrenmeAraciFaz6Kritik.smoke.test.ts` | Test / TypeScript | “dört tüketici kanalında sahiplik ve bağ kimliği sunucuda doğrulanır” davranışını otomatik olarak doğrulayan smoke testidir. |
| `ogrenmeAraciHazirVaryantlari.canli.cjs` | Test / Kaynak | ogrenme Araci Hazir Varyantlari.canli kapsamındaki test veya doğrulama senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `ogrenmeAraciIuGorevYetkisi.hedef.test.ts` | Test / Kaynak | “İÜ görevi kullanıcı, talep, aşama ve aktif durumla birlikte doğrulanır” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `ogrenmeAraciIzlemeIstemci.smoke.test.ts` | Test / Kaynak | “ortak istemci başlangıç isteğini gönderir ve kanal yanıtını normalize eder” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `ogrenmeAraciKararKapilari.canli.cjs` | Test / Kaynak | ogrenme Araci Karar Kapilari.canli kapsamındaki test veya doğrulama senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `ogrenmeAraciModalOnizleme.smoke.test.ts` | Test / Kaynak | “Modallar.tsx OgrenmeAraciOnizlemeModal ile 4 öğrenme aracını da destekler” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `ogrenmeAraciPillEtiketleri.smoke.test.ts` | Test / TypeScript | “değişken durum: varyant, aşama ve durum metinleri seçilen aracı gösterir” davranışını otomatik olarak doğrulayan smoke testidir. |
| `ogrenmeAraciRaporSql.hedef.test.ts` | Test / Kaynak | “SQL neti ve başarı yüzdesi uygulamada yeniden hesaplanmaz; eksik/hatalı yanıt Tümü’ye dönmez” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `ogrenmeAraciRolYayinKimligi.smoke.test.ts` | Test / TypeScript | “UTT yayın sözleşmesi öğrenme aracı kimliği ve türünü oynatıcıya taşır” davranışını otomatik olarak doğrulayan smoke testidir. |
| `ogrenmeAraciTamamlamaFaz3.hedef.test.ts` | Test / TypeScript | “boş ve küçük dosyanın parçalı SHA-256 özeti doğrudur” davranışını otomatik olarak doğrulayan hedef testidir. |
| `ogrenmeAraciTamamlamaFaz4.hedef.test.ts` | Test / TypeScript | “değişken durum değişken durum üretim akışı doğrudur” davranışını otomatik olarak doğrulayan hedef testidir. |
| `ogrenmeAraciTamamlamaFaz5.hedef.test.ts` | Test / TypeScript | “UTT ve KD_UTT erişimi aktif kullanıcı, firma, takım, hedef rol ve öneri bağıyla sınırlıdır” davranışını otomatik olarak doğrulayan hedef testidir. |
| `ogrenmeAraciTamamlamaFaz6.hbstore.canli.cjs` | Test / Node.js | Cogniti kapsamındaki öğrenme Araci Tamamlama Faz6.hbstore.canli sözleşmesini otomatik olarak doğrular. |
| `ogrenmeAraciTamamlamaFaz6.hedef.test.ts` | Test / TypeScript | “araç türleri mevcut yayın ve ortak tamamlama puanı omurgasını kullanır” davranışını otomatik olarak doğrulayan hedef testidir. |
| `ogrenmeAraciTamamlamaFaz7.hedef.test.ts` | Test / TypeScript | “araç bazında dönemsel yayın sayısı dört araç için üretilir” davranışını otomatik olarak doğrulayan hedef testidir. |
| `ogrenmeAraciTamamlamaFaz8.hedef.test.ts` | Test / TypeScript | Bildirim, Eczanem, ortak etkileşim ve öğrenme içeriği yüzeyi kontrollerini içerir. |
| `ogrenmeAraciTamamlamaKapisi.smoke.test.ts` | Test / Kaynak | “aktif video kanıt gerektirmeden ortak tamamlama kapısından geçer” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `onayliUrlGecisi.hedef.test.ts` | Test / Kaynak | “tüm rollerin masaüstü ve mobil sidebar hedefleri mevcut sayfalara karşılık gelir” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `oneri.tarih.smoke.test.ts` | Test / TypeScript | “mutlu: yarindan itibaren oneri kabul edilir” davranışını otomatik olarak doğrulayan smoke testidir. |
| `oneriRozetiZamani.smoke.test.ts` | Test / Kaynak | “öneri rozeti başlangıçta açılır, bitişten sonra kapanır” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `onerilenYayinlarNav.smoke.test.ts` | Test / TypeScript | Önerilen Yayınlar menü yapısını, bekleyen/tamamlanan alt sekmelerini, rozet bağlarını ve yetkisiz erişim engelini doğrular. |
| `onerilerGenelKolThumbnail.smoke.test.ts` | Test / Kaynak | “Öneri API genel kolu: Doğrulanmamış Podcast/Literatür kapağında RPC” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `operasyonelYenileme.smoke.test.ts` | Test / TypeScript | “mutlu: operasyon sayfaları ortak, pasiflenebilir ve durum koruyan yenileme kullanır” davranışını otomatik olarak doğrulayan smoke testidir. |
| `panelCokKatmanliMenu.hedef.test.ts` | Test / Kaynak | panel Cok Katmanli Menu.hedef.test kapsamındaki test veya doğrulama senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `panelNavbarOzet.smoke.test.ts` | Test / Kaynak | “UTT navbar özeti yalnızca takım sırası ve sipariş puanını taşır” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `panelTemaRenkleri.hedef.test.ts` | Test / Kaynak | “bütün tanımlı rollerde üst/sol/mobil menü yüzeyleri iki temanın ortak kaynağını kullanır” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `periyotAltKirilim.smoke.test.ts` | Test / TypeScript | “mutlu: bu_gun dilimleri TR 6'sar saatlik ve etiketle uyumlu” davranışını otomatik olarak doğrulayan smoke testidir. |
| `pillTemaRenkleri.hedef.test.ts` | Test / Kaynak | “31 rolün 20 üretim durumu, hedef roller ve çek durumları iki temada mevcut anlam/rengi korur” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `pm04YarimYukleme.hedef.test.ts` | Test / TypeScript | “PM-03/A video kesintisi aynı oturum ve TUS aktarımıyla sürer; iptal tam temizlikten sonra bildirilir” davranışını otomatik olarak doğrulayan hedef testidir. |
| `pm05TalepIdempotency.hedef.test.ts` | Test / TypeScript | “PM-05 istemci, yanıt kaybında aynı form için aynı işlem anahtarını korur” davranışını otomatik olarak doğrulayan hedef testidir. |
| `pm06GuncelSurum.hedef.test.ts` | Test / TypeScript | “PM-06: karar isteği ekranda incelenen görev sürümünü taşır” davranışını otomatik olarak doğrulayan hedef testidir. |
| `pm09EczanemYayinDurdurmaKapisi.hedef.test.ts` | Test / TypeScript | “iki Eczanem gönderim RPC'si yayın satırını kilitleyip aktifliği doğrular” davranışını otomatik olarak doğrulayan hedef testidir. |
| `pm10Kapsam.smoke.test.ts` | Test / TypeScript | “PM-10: PM ürün sözlüğünde yalnız kendi firma ve takım kapsamını kullanır” davranışını otomatik olarak doğrulayan smoke testidir. |
| `podcastAsama4KararYayinRegresyon.hedef.test.ts` | Test / Kaynak | “Hedef 1: Transkriptsiz V2 tamamlama — hazır ses yüklenir, transkriptsiz onaylanır ve soru zinciri açılır” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `podcastBackendDavranis.hedef.test.ts` | Test / Kaynak | “Davranışsal Test 1: İki TEK_KİŞİ sonucu monolog kabul edilir ve yapay etiket üretilmez” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `podcastGeminiTranskript.canli.test.ts` | Test / Kaynak | “Canlı Gemini 3.5 Transcribe Entegrasyonu: Gerçek ses dosyası ile transkript üretimi ve temizleme” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `podcastGeminiTranskript.hedef.test.ts` | Test / Kaynak | “Aşama 3 Model ve Ortam Yapılandırması: gemini-3.5-flash korunurken gemini-3.5-transcribe eklenir” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `podcastGonderButonKilidi.hedef.test.ts` | Test / Kaynak | “Hedef 1: ai_bekliyor, ai_isleniyor ve ai_taslak durumlarında buton pasif kalır” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `podcastGorselVeUrunAdi.hedef.test.ts` | Test / TypeScript | Podcast yayın görseli imzalı CDN adresi, yarım yükleme kurtarma/iptal akışı ve PM ürün adı öncelik çözümlemesi davranışlarını otomatik olarak doğrulayan hedef testidir. |
| `podcastHardRefreshGeriYukleme.hedef.test.ts` | Test / Kaynak | “1. GET /talepler/api/taslak: Üretici yetkisi ve firma sahipliği kilit altındadır (Multi-tenant sınır)” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `podcastIstemciVeGirisim.hedef.test.ts` | Test / Kaynak | “Davranışsal Test 1: Eski ai_girisim_id sonucu reddedilir ve durumu bozmaz” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `podcastKonusmaciAyrimi.hedef.test.ts` | Test / Kaynak | “Gemini transkript yönergesi: İki konuşmacı ayrımı, monolog koruması ve isim tahmini yasağı” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `podcastManuelTranskript.hedef.test.ts` | Test / Kaynak | “Aşama 2 TXT Metin Çıkarma: geçerli UTF-8 metin çıkarılır, null bayt içeren dosya reddedilir” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `podcastNihaiGonderimAtomikKesinlestir.hedef.test.ts` | Test / Kaynak | “1. podcast_taslak_atomik_kesinlestir RPC şeması üretici ve firma sahipliğini kilit altında doğrular” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `podcastTaslakAltyapisi.hedef.test.ts` | Test / Kaynak | “Hedef 1: Çift taslak oluşturma tek taslak döndürür — Idempotent oturum anahtarı” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `podcastTaslakDepolamaTemizlemeKuyruk.hedef.test.ts` | Test / Kaynak | “Hedef 1: Şema ve migrasyon doğrulaması (arac_id DROP NOT NULL & ON DELETE SET NULL)” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `podcastTaslakErkenDogrulamaVeYarimYukleme.hedef.test.ts` | Test / Kaynak | “Hedef 1: AI ön yüklemesinde /podcast-dogrula kesinlikle çağrılmaz (taslakModu: true)” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `podcastTaslakKesinlestirme.hedef.test.ts` | Test / Kaynak | “Hedef 1: Uçtan uca akış: AI seçimi → taslak → podcast yükleme → AI taslağı → onay → Gönderiniz” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `podcastTranskriptOpsiyonelV2V4.hedef.test.ts` | Test / Kaynak | “Aşama 1 Veri Sözleşmesi: 8 transkript durumu ve metadata alanları eksiksiz tanımlıdır” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `podcastV1V3Faz5Butunluk.hedef.test.ts` | Test / Kaynak | “AI yalnız dosyası, pozitif süresi ve teknik doğrulaması bulunan ses için başlar” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `podcastV1V3IuAiTranskript.hedef.test.ts` | Test / Kaynak | “1. Atanmış İÜ, transkript istenen podcastte AI yetkisini alır” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `podcastV1V3RevizyondaTranskript.hedef.test.ts` | Test / Kaynak | “V1/V3 podcast revizyonunda false tercih true yapılabilir” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `podcastV1V3TeslimVeInceleme.hedef.test.ts` | Test / Kaynak | “İÜ teslimi: transkript istenmediyse doğrulanmış ses tek başına yeterlidir” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `podcastV1V3TranskriptSecimi.hedef.test.ts` | Test / Kaynak | “1. V1 ilk talepte ” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `podcastYuklemeAiBaslatma.hedef.test.ts` | Test / Kaynak | “Hedef 1: AI butonu taslak oluşturur ve 7 durum arayüzde açıkça yer alır” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `profilFotoDogrula.smoke.test.ts` | Test / Kaynak | “profilFotoGirisDogrula: Geçerli boyut ve formattaki dosyaları kabul eder” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `raporEclubModul.smoke.test.ts` | Test / Kaynak | “Kapalı E-Club yalnız kendi kartını kaldırır; kalan kartların sırası değişmez” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `raporLigKatalogYenileme.smoke.test.ts` | Test / TypeScript | “mutlu: rapor, lig ve katalog yüzeyleri ortak yenileme sözleşmesini kullanır” davranışını otomatik olarak doğrulayan smoke testidir. |
| `sadeKontroller.hedef.test.ts` | Test / Kaynak | “Tekli seçim: arama, klavye, seçim, kapanma ve odağın geri dönmesi” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `sahaYoneticiMobilYayinAkisi.smoke.test.ts` | Test / TypeScript | Saha ana sayfaları (`SahaVideoRaflari`, `VideoBolumu`) ve yönetici yayındaki videolar yüzeylerinin `MobilYayinAkisi` entegrasyonu ile 2+5 akışını doğrular. |
| `sayfaOkumaOnbellegi.hedef.test.ts` | Test / Kaynak | “kullanıcı/kapsam ve sayfa ayrımı, oturumdan okuma, süre sonu ve bozuk kayıt” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `soruAtama.smoke.test.ts` | Test / Kaynak | “atanmış sorular kayıtlı sırayla çözülür ve doğru cevap bilgisi istemciye taşınmaz” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `talepDetayiDosyaSecici.smoke.test.ts` | Test / Kaynak | “aracYuklemeAyarlari öğrenme aracı türüne göre buton, format ve metinleri dinamik döner” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `talepFormuUyumu.smoke.test.ts` | Test / TypeScript | “mutlu: referans dosyası bütün üretici rollerinde sahiplik ve görev bağıyla korunur” davranışını otomatik olarak doğrulayan smoke testidir. |
| `talepKaynakSahipligi.smoke.test.ts` | Test / TypeScript | “teknik firma sahipliği: kendi firmasının tekniği kabul, başka firmanınki reddedilir” davranışını otomatik olarak doğrulayan smoke testidir. |
| `tanburTumRoller.smoke.test.ts` | Test / TypeScript | Hayalet Tanbur'un 13 üretici, 7 yönetici, UTT, KD_UTT, BM ve TM rollerinde aktif olduğunu, `iu` ve `admin` rollerinden dışlandığını doğrular. |
| `tclubLigEclubModul.smoke.test.ts` | Test / Kaynak | “Modül durumu yalnız oturum firmasından okunur; açık ve kapalı ayrımı nettir” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `tclubMobil.smoke.test.ts` | Test / Kaynak | “T-Club sayfaları iskelet ve kısa süreli istemci önbelleği kullanır” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `tclubUreticiRapor.smoke.test.ts` | Test / Kaynak | “üretici T-Club raporu altı kartlık yeni yapıyı kullanır” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `tclubYoneticiTakimSecimi.smoke.test.ts` | Test / Kaynak | “Yönetici tüm firma takımlarını alır; başka firma ve pasif BM kapsam dışında kalır” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `tedarikciGizliligi.smoke.test.ts` | Test / TypeScript | “kullanıcıya ulaşan arayüz ve API metinleri altyapı sağlayıcısının adını göstermez” davranışını otomatik olarak doğrulayan smoke testidir. |
| `temaAltyapisi.hedef.test.ts` | Test / Kaynak | “varsayılan tema mevcut genel ve shadcn renklerini korur” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `temaLoginTercihi.hedef.test.ts` | Test / Kaynak | “açık yeşil seçimi tarayıcı açılışında korunur; diğer hesabın kendi rengine aktarılmaz” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `temsilciUretimYontemleri.hedef.test.ts` | Test / Kaynak | “Tümü çağrısı üç parametreyi korur; Temsilci aynı eğitim RPC’sine utt gönderir” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `tmDavranisRaporu.smoke.test.ts` | Test / Kaynak | “TM kapsamı takım → BM bölgesi → UTT zincirinde daralır” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `tuketimAracDavranislari.smoke.test.ts` | Test / Kaynak | “video ve podcast bütün tüketim hedeflerinde süre ve sona ulaşma kanıtı ister” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `tuketimDagitimMatrisi.smoke.test.ts` | Test / Kaynak | “20 araç-hedef yayınının her biri yalnız doğru tüketici kimliklerine açılır” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `tuketimGuvenlikNegatif.smoke.test.ts` | Test / Kaynak | “UTT etkileşimi öneri kaydı olmadan açılır; yanlış kullanıcı, takım veya hedefle açılamaz” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `tuketimListeDetayMatrisi.smoke.test.ts` | Test / Kaynak | “20 araç-hedef liste kaydı kimliğini korur ve ham depolama yolunu istemciye sızdırmaz” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `tuketimSenaryoAltyapisi.smoke.test.ts` | Test / Kaynak | “tüketim altyapısı dört araç ve beş hedef için 20 izole yayın üretir” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `ureticiBaslangic.hedef.test.ts` | Test / Kaynak | “UTT yayın bağlantıları ve dış kimlik push hedefleri korunur” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `ureticiChallengeMobilYayinAkisi.smoke.test.ts` | Test / TypeScript | Üretici yayın katalogları (`UreticiYayinKatalogu`) ve Challenge Club listelerinin `MobilYayinAkisi` entegrasyonu ile 2+5 basamaklı açılışını doğrular. |
| `uretimDurumFiltresi.smoke.test.ts` | Test / TypeScript | “mutlu: içerik üreticisi revizyonu ve yeni işi üretici incelemesinden önce görür” davranışını otomatik olarak doğrulayan smoke testidir. |
| `uretimEskiYolTemizligi.smoke.test.ts` | Test / TypeScript | “mutlu: üretim yazıları yalnız kanonik görev API'lerinde yaşar” davranışını otomatik olarak doğrulayan smoke testidir. |
| `uretimGorevArayuzu.smoke.test.ts` | Test / TypeScript | “mutlu: görev durumları ortak arayüz durumlarına eksiksiz çevrilir” davranışını otomatik olarak doğrulayan smoke testidir. |
| `uretimGorevSozlesmesi.smoke.test.ts` | Test / TypeScript | “mutlu: atanan görev hazırlanır, incelemeye gider, revizyondan yeniden teslim edilir” davranışını otomatik olarak doğrulayan smoke testidir. |
| `uretimKararKapisi.canli.cjs` | Test / Kaynak | uretim Karar Kapisi.canli kapsamındaki test veya doğrulama senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `uretimRevizyonTavani.hedef.test.ts` | Test / Kaynak | “sözleşme: URETIM_REVIZYON_TAVANI sabiti 3 olarak tanımlıdır” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `uretimRpc.smoke.test.ts` | Test / TypeScript | “üretim RPC yardımcıları bilinen girdileri doğru sınıflandırır” davranışını otomatik olarak doğrulayan smoke testidir. |
| `uretimSenaryoAltyapisi.smoke.test.ts` | Test / Kaynak | “üretim senaryosu altyapısı dört araç ve dört varyant için 16 izole başlangıç üretir” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `uretimSenaryolariOgrenmeAraclari.smoke.test.ts` | Test / Kaynak | uretim Senaryolari Ogrenme Araclari.smoke.test kapsamındaki test veya doğrulama senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `uretimSenaryolariVideo.smoke.test.ts` | Test / Kaynak | “Video V1: senaryo, video, soru seti ve yayın sırasını korur” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `uretimSeridiGenelleme.smoke.test.ts` | Test / Kaynak | “uretimSeridi adimlariCoz hazir ogrenme araci adimini kapali yapmaz” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `uretimTuketimKopruleri.smoke.test.ts` | Test / Kaynak | “seçilmiş 16 araç-varyant köprüsü üretimden doğru tüketiciye ve tamamlamaya kesintisiz ulaşır” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `uretimVaryantlariModal.smoke.test.ts` | Test / Kaynak | “VARYANT_ALT_MODAL V1-V4 tanımları ve pilleri sözleşmeye tam uygundur” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `uttDavranisRaporu.smoke.test.ts` | Test / Kaynak | “Oturum bitişi ve puan olayı ayrı sayılır; dönem dışındaki kazanım taşınmaz” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `uttMobilYayinAkisi.smoke.test.ts` | Test / TypeScript | UTT ana sayfası ve öneriler yüzeylerinin `UttKayanVideoRafi` üzerinden `MobilYayinAkisi` ve 2+5 kart basamaklandırmasını doğrular. |
| `uttRaporDonemselKatki.smoke.test.ts` | Test / Kaynak | “Bölge, takım ve firma katkıları aynı dönemin net puanlarıyla hesaplanır” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `videoOrtakCozumlemeVeOynatma.hedef.test.ts` | Test / Kaynak | “bunnyEmbedUrlUret: 36 karakterlik Bunny GUID” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `videoOrtakModelMimari.smoke.test.ts` | Test / Kaynak | “uygulama Video için eski fiziksel tablolara doğrudan erişmez” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `videoVaryantlari.canli.cjs` | Test / Kaynak | video Varyantlari.canli kapsamındaki test veya doğrulama senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `yardimciGorunumTema.hedef.test.ts` | Test / Kaynak | “kart ve tablo yüzey/metin/çizgileri iki temayı alır; satır seçimi, kolonlar ve renk override” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `yayinDetayGuvenlikVeCache.smoke.test.ts` | Test / Kaynak | “güvenlik: yayin-detay API” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `yayinDetayModalErisimSozlesmesi.hedef.test.ts` | Test / Kaynak | “sözleşme: YAYIN_DETAY_MODAL_ROLLER tam 23 yönetim ve üretim rolünü kapsar” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `yayinKartiTipografi.smoke.test.ts` | Test / TypeScript | `YayinKarti` bileşeninin mobil (16px / leading-[22px]) ve masaüstü (12px / sm:text-xs) ürün adı tipografisini, rozet ve alt şerit düzenini doğrular. |
| `yayinKonuPerformansi.hedef.test.ts` | Test / Kaynak | “dört özet SQL değerleriyle kalır; ürün kulakçığı yalnız seçili ürünün değerlerini değiştirir” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `yayinOncesiSilme.smoke.test.ts` | Test / TypeScript | “mutlu: yayın adayı kilitlenir, Bunny ve varyanta uygun DB silmesi tamamlanır” davranışını otomatik olarak doğrulayan smoke testidir. |
| `yayinThumbnailOgrenmeAraci.smoke.test.ts` | Test / Kaynak | “yayinThumbnailUrlCoz video için mevcut thumbnail_url” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `yayinVideoBildirim.smoke.test.ts` | Test / Kaynak | “video kodlaması başarıyla bittiğinde üreticiye başarı bildirimi kaydedilir ve push hatasız yürütülür” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `yayinYonetimiDurumNavigasyon.smoke.test.ts` | Test / Kaynak | “YayinYonetimiPage useSearchParams ile durum ve hedef parametrelerini okur ve baslangic state” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `yerelSayfaTema.hedef.test.ts` | Test / Kaynak | “girişte gerçek sözleşme portalı açıkken tema değişir; içerik, kapatma ve odak korunur” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `yoneticiDavranisRaporu.smoke.test.ts` | Test / Kaynak | “Yönetici firma takımlarını gerçek adlarıyla alır; varsayılan takım raporu TM hesabıyla aynıdır” dahil ilgili davranış senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `yoneticiGozlemYetkisi.hedef.test.ts` | Test / TypeScript | “yönetici kataloğu dört öğrenme aracının kimliğini ve türünü taşır” davranışını otomatik olarak doğrulayan hedef testidir. |
| `yonetimYenileme.smoke.test.ts` | Test / TypeScript | “mutlu: üretim, yönetim ve sipariş takip yüzeyleri ortak YenileButonu kullanır” davranışını otomatik olarak doğrulayan smoke testidir. |
| `zaman.sinir.smoke.test.ts` | Test / TypeScript | “mutlu: gun ici bir an dogru TR gunune ve periyoda cozulur” davranışını otomatik olarak doğrulayan smoke testidir. |

### 📁 tests/fixtures/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `eclub-gonderim-cron-postgres.sql` | SQL / Kaynak ve Denetim | eclub gonderim cron postgres için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `cron`, `vault`. |
| `eclub-gonderim-postgres.sql` | SQL / Kaynak ve Denetim | eclub gonderim postgres için SQL sözleşmesi veya denetim sorgularını içerir. Tanımlanan başlıca nesneler: `firmalar`, `urunler`, `kullanicilar`, `eclub_kisiler`. |
| `eclub-performans-onayli-tasarim.json` | Test / Kaynak | eclub performans onayli tasarim kapsamındaki test veya doğrulama senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `eclubCekAkisi.fixture.ts` | Test / Kaynak | eclub Cek Akisi.fixture kapsamındaki test veya doğrulama senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `podcast_ornek.m4a` | Test / Kaynak | podcast ornek kapsamındaki test veya doğrulama senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `yayin-arac-performansi-tumu.json` | Test / Kaynak | yayin arac performansi tumu kapsamındaki test veya doğrulama senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |

### 📁 tests/helpers/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `tuketimSenaryosu.ts` | Test / Kaynak | tuketim Senaryosu kapsamındaki test veya doğrulama senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |
| `uretimSenaryosu.ts` | Test / Kaynak | uretim Senaryosu kapsamındaki test veya doğrulama senaryolarını içerir. Bu kayıt testin çalıştırıldığına dair sonuç değildir. |

## 10. PUBLIC VE DOCS VARLIKLARI

**23 Ekim 2026 karşılaştırması:** Bu alt başlıktaki 117 dosya yolu mevcut public/docs dosyalarıyla eşleşir; eksik veya kaldırılmış yol kaydı yoktur. Plan, mockup, test sonucu ve denetim çıktıları kendi tarih ve kapsamlarıyla değerlendirilir; envanterde bulunmaları güncel test başarısı, canlı kurulum veya tamamlanmış entegrasyon kanıtı değildir. Mevcut eski marka adlı dosyalar korunur; adlarından hareketle silinmiş veya kullanılmıyor kabul edilmez.

### 📁 docs/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `BLUEBOOK.MD` | Dokümantasyon | Cogniti iş modeli, iş kuralları, mimari ve dosya envanterinin ana başvuru belgesidir. |
| `CIFT_TEMA_ADIM5.md` | Dokümantasyon | CIFT TEMA ADIM5 konusundaki proje açıklama, plan veya kayıtlarını tutar. |
| `CIFT_TEMA_SONUC.md` | Dokümantasyon | CIFT TEMA SONUC konusundaki proje açıklama, plan veya kayıtlarını tutar. |
| `CIFT_TEMA_TERCIH_KURALLARI.md` | Dokümantasyon | Çift tema tercihinin saklanma ve hesap/tarayıcı kapsamı kurallarını belgeler. |
| `COGNITI_EPOSTA_SABLON_STOGU.md` | Dokümantasyon | Cogniti sistem bildirimleri ve e-posta metin taslaklarını, mevcut kanal/alıcı ayrımlarını ve entegrasyon için açık kararları kaydeder; taslak bulunması otomatik gönderimin etkin olduğu anlamına gelmez. |
| `COGNITI_MARKA_DONUSUMU.md` | Dokümantasyon | Cogniti marka dönüşümünün iş adımlarını, tamamlanan işleri ve domain/e-posta kimliği geçişiyle birlikte ele alınacak işleri izler. |
| `COGNITI_RENK_ONIZLEME.md` | Dokümantasyon | COGNITI RENK ONIZLEME konusundaki proje açıklama, plan veya kayıtlarını tutar. |
| `ECLUB_CANLI_DOGRULAMA_TAKIBI.md` | Dokümantasyon | E-Club canlı doğrulama adımlarını, bekleyen uçtan uca testleri ve kullanıcı tarafından bildirilen sonuçları izler. |
| `ECLUB_CEK_OPERASYON_REHBERI.md` | Dokümantasyon | E-Club hediye çeki operasyonunun kurulum ve işletim adımlarını açıklayan başvuru belgesidir. |
| `ECLUB_GONDERILECEK_YAYINLAR_UX.md` | Dokümantasyon | ECLUB GONDERILECEK YAYINLAR UX konusundaki proje açıklama, plan veya kayıtlarını tutar. |
| `ECLUB_GONDERIM_ADIM11_TEST_SONUCLARI.json` | Yapılandırma / Veri | ECLUB GONDERIM ADIM11 TEST SONUCLARI için yapılandırma, bağımlılık veya kayıt verilerini tutar. |
| `ECLUB_GONDERIM_ADIM12_TEST_SONUCLARI.json` | Yapılandırma / Veri | ECLUB GONDERIM ADIM12 TEST SONUCLARI için yapılandırma, bağımlılık veya kayıt verilerini tutar. |
| `ECLUB_GONDERIM_OPERASYON_REHBERI.md` | Dokümantasyon | E-Club yayın gönderimi ve planlama için kurulum ve dağıtım işlemlerini belgeler. |
| `ECLUB_GONDERIM_PLAN_VERI_MODELI.md` | Dokümantasyon | E-Club planlı gönderim veri modelini ve ilgili adımın tasarım kararlarını kaydeder. |
| `ECLUB_UYELIK_DAVETI.md` | Dokümantasyon | E-Club üyelik daveti sürecinin kurulum ve uygulama kayıtlarını tutar. |
| `ECZA_DEPO_KATALOGU_YUKLEME.md` | Dokümantasyon | Ecza depo kataloğunun kontrol ve Supabase yükleme adımlarını açıklar. |
| `HOYK_SAYFA_ROL_KART_BILGILERI_ENVANTERI.md` | Dokümantasyon | Yayın kartlarının sayfa ve rol bazında gösterdiği alanları karşılaştıran HOYK envanteridir. |
| `LOGIN_KARSILAMA_DOGRULAMA_2026_10_21.md` | Dokümantasyon | 21 Ekim 2026 karşılama ve giriş değişikliklerinin doğrulama kaydıdır; tarihsel sonuçları yeni bir test çalıştırması olarak sunmaz. |
| `ONAYLI_URL_DEGISIKLIKLERI_2026_10_18.md` | Dokümantasyon | 18 Ekim 2026 tarihinde onaylanan URL değişikliklerini kaydeder. |
| `ORTAK_GORSEL_SISTEM_MATRISI.md` | Dokümantasyon | ORTAK GORSEL SISTEM MATRISI konusundaki proje açıklama, plan veya kayıtlarını tutar. |
| `REDBOOK.MD` | Dokümantasyon | Bilinen teknik borçları, riskleri ve tamamlanması gereken iyileştirmeleri izleyen teknik takip belgesidir. |
| `RENK_ORTAKLASTIRMA_ADIM1.md` | Dokümantasyon | RENK ORTAKLASTIRMA ADIM1 konusundaki proje açıklama, plan veya kayıtlarını tutar. |
| `RENK_ORTAKLASTIRMA_ADIM10.md` | Dokümantasyon | RENK ORTAKLASTIRMA ADIM10 konusundaki proje açıklama, plan veya kayıtlarını tutar. |
| `RENK_ORTAKLASTIRMA_ADIM2.md` | Dokümantasyon | RENK ORTAKLASTIRMA ADIM2 konusundaki proje açıklama, plan veya kayıtlarını tutar. |
| `RENK_ORTAKLASTIRMA_ADIM3.md` | Dokümantasyon | RENK ORTAKLASTIRMA ADIM3 konusundaki proje açıklama, plan veya kayıtlarını tutar. |
| `RENK_ORTAKLASTIRMA_ADIM4.md` | Dokümantasyon | RENK ORTAKLASTIRMA ADIM4 konusundaki proje açıklama, plan veya kayıtlarını tutar. |
| `RENK_ORTAKLASTIRMA_ADIM5.md` | Dokümantasyon | RENK ORTAKLASTIRMA ADIM5 konusundaki proje açıklama, plan veya kayıtlarını tutar. |
| `RENK_ORTAKLASTIRMA_ADIM6.md` | Dokümantasyon | RENK ORTAKLASTIRMA ADIM6 konusundaki proje açıklama, plan veya kayıtlarını tutar. |
| `RENK_ORTAKLASTIRMA_ADIM7.md` | Dokümantasyon | RENK ORTAKLASTIRMA ADIM7 konusundaki proje açıklama, plan veya kayıtlarını tutar. |
| `RENK_ORTAKLASTIRMA_ADIM8.md` | Dokümantasyon | RENK ORTAKLASTIRMA ADIM8 konusundaki proje açıklama, plan veya kayıtlarını tutar. |
| `RENK_ORTAKLASTIRMA_ADIM9.md` | Dokümantasyon | RENK ORTAKLASTIRMA ADIM9 konusundaki proje açıklama, plan veya kayıtlarını tutar. |
| `RENK_ORTAKLASTIRMA_IS_PLANI.md` | Dokümantasyon | RENK ORTAKLASTIRMA IS PLANI konusundaki proje açıklama, plan veya kayıtlarını tutar. |
| `ROLLER_VE_KAPSAMLI_ZOR_TESTLER.md` | Dokümantasyon | “Roller ve Kapsamlı Zor Testler” kapsamındaki kararları, planı veya doğrulama kayıtlarını tutan proje belgesidir. |
| `ROL_BAZLI_SIDEBAR_URL_INCELEMESI.md` | Dokümantasyon | ROL BAZLI SIDEBAR URL INCELEMESI konusundaki proje açıklama, plan veya kayıtlarını tutar. |
| `TEMA_ALTYAPISI.md` | Dokümantasyon | Ortak tema altyapısının tasarımını ve kaynak bağlantılarını açıklar. |
| `URETICI_ANA_SAYFA_TEMIZLIGI_2026_10_21.md` | Dokümantasyon | Üretici ana sayfasının kaldırılması, Yayın Yönetimi başlangıcı ve ilgili temizliğin uygulama/doğrulama kayıtlarını tutar. |
| `VERCEL_GIT_ENTEGRASYONU.md` | Dokümantasyon | Vercel–GitHub dağıtım olayının kök nedenini ve Vercel cronlarından Supabase zamanlayıcısına geçirilen güncel yapıyı kaydeder. |
| `mobil_dikey_yayin_akisi_envanter_faz0.md` | Dokümantasyon | Mobil dikey yayın akışı mimarisine geçişte tüm rol, rota ve liste yüzeylerinin teknik envanterini ve kart işaretleme kurallarını belgeler. |

### 📁 docs/hukuki/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `CEREZ_AYDINLATMA_VE_TERCIH_METNI.md` | Dokümantasyon | “HAPBİLGİ ÇEREZ VE TARAYICI DEPOLAMA AYDINLATMA METNİ” kapsamındaki kararları, planı veya doğrulama kayıtlarını tutan proje belgesidir. |
| `KVKK_AYDINLATMA_METNI.md` | Dokümantasyon | “HAPBİLGİ KİŞİSEL VERİLERİN İŞLENMESİNE İLİŞKİN AYDINLATMA METNİ” kapsamındaki kararları, planı veya doğrulama kayıtlarını tutan proje belgesidir. |
| `KVKK_YURTDISI_VERI_AKTARIMI_TAKIP.md` | Dokümantasyon | Supabase ile KVKK Standart Sözleşme-2 ve Kurum bildirimi sürecinin durumunu, kanıtlarını ve sonraki adımlarını izler. |
| `PUAN_VE_ODUL_PROGRAMI_KURALLARI.md` | Dokümantasyon | “HAPBİLGİ PUAN VE ÖDÜL PROGRAMI KURALLARI” kapsamındaki kararları, planı veya doğrulama kayıtlarını tutan proje belgesidir. |
| `TICARI_ELEKTRONIK_ILETI_IZNI.md` | Dokümantasyon | “HAPBİLGİ TİCARİ ELEKTRONİK İLETİ İZNİ” kapsamındaki kararları, planı veya doğrulama kayıtlarını tutan proje belgesidir. |

### 📁 docs/mockups/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `bm-oneriler-gonderim-ux.html` | HTML / Mockup | bm oneriler gonderim ux tasarımının bağımsız HTML örneğini tutar; canlı veri bağlantısı olduğu varsayılmaz. |
| `eclub-hoyk-sure-cercevesi.html` | HTML / Mockup | eclub hoyk sure cercevesi tasarımının bağımsız HTML örneğini tutar; canlı veri bağlantısı olduğu varsayılmaz. |
| `eclub-yayinlar-gonderim-ux.html` | HTML / Mockup | eclub yayinlar gonderim ux tasarımının bağımsız HTML örneğini tutar; canlı veri bağlantısı olduğu varsayılmaz. |
| `eczanem-yayinlar-gonderim-ux.html` | HTML / Mockup | eczanem yayinlar gonderim ux tasarımının bağımsız HTML örneğini tutar; canlı veri bağlantısı olduğu varsayılmaz. |

### 📁 docs/ortak-gorsel-sistem/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `ADIM1_DOGRULAMA.json` | Yapılandırma / Veri | ADIM1 DOGRULAMA için yapılandırma, bağımlılık veya kayıt verilerini tutar. |
| `ADIM1_KAYNAK_ESLEME.json` | Yapılandırma / Veri | ADIM1 KAYNAK ESLEME için yapılandırma, bağımlılık veya kayıt verilerini tutar. |
| `ADIM1_SADE_KONTROLLER.md` | Dokümantasyon | Sade kontrol ailesinin kaynak ve görünüm referansını kaydeder. |
| `SADE_KONTROL_CSS_REFERANSI.json` | Yapılandırma / Veri | SADE KONTROL CSS REFERANSI için yapılandırma, bağımlılık veya kayıt verilerini tutar. |

### 📁 docs/ortak-gorsel-sistem/referanslar/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `utt-urun-egitimleri-1440x1000.jpg` | Belge / Görsel | utt urun egitimleri 1440x1000 için belge veya görsel referans varlığıdır. |
| `utt-urun-egitimleri-baslangic.jpg` | Belge / Görsel | utt urun egitimleri baslangic için belge veya görsel referans varlığıdır. |

### 📁 docs/renk-envanteri/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `CSS_DEGISKENLERI.md` | Dokümantasyon | CSS değişkenlerinin kaynakta bulunan tanımlarını kaydeden renk envanteri çıktısıdır. |
| `DOGRULAMA.json` | Yapılandırma / Veri | DOGRULAMA için yapılandırma, bağımlılık veya kayıt verilerini tutar. |
| `DOSYA_BAZINDA_TUM_KULLANIMLAR.md` | Dokümantasyon | Renk ve görünüm kullanımlarını dosya bazında kaydeden denetim çıktısıdır. |
| `PILL_VE_YUVARLAK_KONTROLLER.md` | Dokümantasyon | Pill, rozet ve yuvarlak kontrol kaynaklarının indeksidir. |
| `RAPOR.md` | Dokümantasyon | Görsel renk envanterinin kapsamını ve bulgularını açıklar; ayrıntılı renk ve dosya kullanım kayıtlarına başvuru sağlar. |
| `TUM_RENKLER.md` | Dokümantasyon | Kaynak renkleri ile Tailwind renk karşılıklarını listeleyen envanter çıktısıdır. |
| `ham-hex-kapsam-kontrolu.json` | Yapılandırma / Veri | ham hex kapsam kontrolu için yapılandırma, bağımlılık veya kayıt verilerini tutar. |
| `ozel-bilesenler.json` | Yapılandırma / Veri | ozel bilesenler için yapılandırma, bağımlılık veya kayıt verilerini tutar. |
| `renk-envanteri.json` | Yapılandırma / Veri | renk envanteri için yapılandırma, bağımlılık veya kayıt verilerini tutar. |
| `renk-katalogu.html` | HTML / Mockup | renk katalogu tasarımının bağımsız HTML örneğini tutar; canlı veri bağlantısı olduğu varsayılmaz. |
| `tum-kullanimlar.csv` | Kaynak / Yapılandırma | tum kullanimlar adlı proje kaynağını veya yapılandırmasını sağlar. |

### 📁 docs/renk-ortaklastirma/adim10/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `ECLUB_DONEM_ZEMIN_DOGRULAMA.json` | Yapılandırma / Veri | ECLUB DONEM ZEMIN DOGRULAMA için yapılandırma, bağımlılık veya kayıt verilerini tutar. |
| `HIZLI_KONTROL.json` | Yapılandırma / Veri | HIZLI KONTROL için yapılandırma, bağımlılık veya kayıt verilerini tutar. |
| `I_REHBER_DOGRULAMA.json` | Yapılandırma / Veri | I REHBER DOGRULAMA için yapılandırma, bağımlılık veya kayıt verilerini tutar. |
| `SON_KAYNAK_KONTROLU.json` | Yapılandırma / Veri | SON KAYNAK KONTROLU için yapılandırma, bağımlılık veya kayıt verilerini tutar. |
| `SORU_DOGRU_SECIM_DOGRULAMA.json` | Yapılandırma / Veri | SORU DOGRU SECIM DOGRULAMA için yapılandırma, bağımlılık veya kayıt verilerini tutar. |
| `TANBUR_YAZI_GOLGE_DOGRULAMA.json` | Yapılandırma / Veri | TANBUR YAZI GOLGE DOGRULAMA için yapılandırma, bağımlılık veya kayıt verilerini tutar. |
| `URETIM_OZET_DOGRULAMA.json` | Yapılandırma / Veri | URETIM OZET DOGRULAMA için yapılandırma, bağımlılık veya kayıt verilerini tutar. |
| `URETIM_VARYANTLARI_MODAL_DOGRULAMA.json` | Yapılandırma / Veri | URETIM VARYANTLARI MODAL DOGRULAMA için yapılandırma, bağımlılık veya kayıt verilerini tutar. |
| `YONETICI_KART_VURGU_DOGRULAMA.json` | Yapılandırma / Veri | YONETICI KART VURGU DOGRULAMA için yapılandırma, bağımlılık veya kayıt verilerini tutar. |

### 📁 docs/renk-ortaklastirma/adim2/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `DOGRULAMA.json` | Yapılandırma / Veri | DOGRULAMA için yapılandırma, bağımlılık veya kayıt verilerini tutar. |
| `mavi-gercek-390.png` | Belge / Görsel | mavi gercek 390 için belge veya görsel referans varlığıdır. |
| `mavi-once.png` | Belge / Görsel | mavi once için belge veya görsel referans varlığıdır. |
| `mavi-sonra.png` | Belge / Görsel | mavi sonra için belge veya görsel referans varlığıdır. |
| `yesil-gercek-1440.png` | Belge / Görsel | yesil gercek 1440 için belge veya görsel referans varlığıdır. |

### 📁 docs/renk-ortaklastirma/adim3/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `DOGRULAMA.json` | Yapılandırma / Veri | DOGRULAMA için yapılandırma, bağımlılık veya kayıt verilerini tutar. |

### 📁 docs/renk-ortaklastirma/adim4/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `DOGRULAMA.json` | Yapılandırma / Veri | DOGRULAMA için yapılandırma, bağımlılık veya kayıt verilerini tutar. |

### 📁 docs/renk-ortaklastirma/adim5/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `DOGRULAMA.json` | Yapılandırma / Veri | DOGRULAMA için yapılandırma, bağımlılık veya kayıt verilerini tutar. |

### 📁 docs/renk-ortaklastirma/adim6/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `DOGRULAMA.json` | Yapılandırma / Veri | DOGRULAMA için yapılandırma, bağımlılık veya kayıt verilerini tutar. |

### 📁 docs/renk-ortaklastirma/adim7/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `DOGRULAMA.json` | Yapılandırma / Veri | DOGRULAMA için yapılandırma, bağımlılık veya kayıt verilerini tutar. |

### 📁 docs/renk-ortaklastirma/adim8/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `DOGRULAMA.json` | Yapılandırma / Veri | DOGRULAMA için yapılandırma, bağımlılık veya kayıt verilerini tutar. |

### 📁 docs/renk-ortaklastirma/adim9/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `DOGRULAMA.json` | Yapılandırma / Veri | DOGRULAMA için yapılandırma, bağımlılık veya kayıt verilerini tutar. |
| `RENK_ESLEMELERI.json` | Yapılandırma / Veri | RENK ESLEMELERI için yapılandırma, bağımlılık veya kayıt verilerini tutar. |
| `ROL_KAPSAMI.json` | Yapılandırma / Veri | ROL KAPSAMI için yapılandırma, bağımlılık veya kayıt verilerini tutar. |

### 📁 docs/tasarim/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `ORTAK_YAPI_DISINDAKI_KONTROLLER.md` | Dokümantasyon | Ortak görsel yapı dışında kalan kontrollerin inceleme kaydıdır. |
| `SADE_KONTROL_AILELERI.html` | HTML / Mockup | SADE KONTROL AILELERI tasarımının bağımsız HTML örneğini tutar; canlı veri bağlantısı olduğu varsayılmaz. |
| `SADE_KONTROL_AILELERI_30PX_ONIZLEME.html` | HTML / Mockup | SADE KONTROL AILELERI 30 PX ONIZLEME tasarımının bağımsız HTML örneğini tutar; canlı veri bağlantısı olduğu varsayılmaz. |

### 📁 public/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `cc-ligi-yil-lider-0926.png` | Görsel / Varlık | cc ligi yil lider 0926 adlı statik varlığı sağlar. |
| `cclub-ligi-0926-gumus-seffaf.png` | Görsel / Varlık | cclub ligi 0926 gumus seffaf adlı statik varlığı sağlar. |
| `cclub-ligi-0926-gumus.png` | Görsel / Varlık | cclub ligi 0926 gumus adlı statik varlığı sağlar. |
| `cclub-ligi-0926.png` | Görsel / Varlık | cclub ligi 0926 adlı statik varlığı sağlar. |
| `eclub-ligi1-0926.png` | Görsel / Varlık | eclub ligi1 0926 adlı statik varlığı sağlar. |
| `eclub-ligi1-0926.webp` | Görsel / Varlık | eclub ligi1 0926 adlı statik varlığı sağlar. |
| `hapbilgi-dikey-TM-1-logo.png` | Görsel / Varlık | hapbilgi dikey TM 1 logo için uygulamada kullanılan görsel varlıktır. |
| `hapbilgi-yatay-TM-1-logo-optimized.png` | Görsel / Varlık | hapbilgi yatay TM 1 logo optimized adlı statik varlığı sağlar. |
| `hapbilgi-yatay-TM-1-logo.png` | Görsel / Varlık | hapbilgi yatay TM 1 logo için uygulamada kullanılan görsel varlıktır. |
| `hepifarma_logo_dark.png` | Görsel / Varlık | hepifarma logo dark adlı statik varlığı sağlar. |
| `icon-192.png` | Görsel / Varlık | PWA ve mobil cihazlar için 192x192 uygulama ikonu. |
| `icon-512.png` | Görsel / Varlık | PWA ve mobil cihazlar için 512x512 yüksek çözünürlüklü uygulama ikonu. |
| `kursu_5_0926-banner.png` | Görsel / Varlık | kursu 5 0926 banner adlı statik varlığı sağlar. |
| `logo-download.png` | Görsel / Varlık | logo download için uygulamada kullanılan görsel varlıktır. |
| `manifest.json` | JSON / PWA | Uygulama adı, başlangıç ve ikon bilgileriyle PWA kurulum sözleşmesini tanımlar. |
| `sw.js` | Service Worker | Tarayıcı push mesajlarını ve bildirim tıklama hedeflerini işleyen servis işçisidir. |

### 📁 public/eclub/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `sizin-yeriniz.png` | Görsel / Varlık | sizin yeriniz adlı statik varlığı sağlar. |

### 📁 public/marka/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|
| `cogniti-blue.png` | Görsel / Varlık | Cogniti marka varlığıdır; tema veya ikon sunumunda kullanılır. |
| `cogniti-blue.svg` | Görsel / Varlık | Cogniti marka varlığıdır; tema veya ikon sunumunda kullanılır. |
| `cogniti-green.png` | Görsel / Varlık | Cogniti marka varlığıdır; tema veya ikon sunumunda kullanılır. |
| `cogniti-green.svg` | Görsel / Varlık | Cogniti marka varlığıdır; tema veya ikon sunumunda kullanılır. |
| `cogniti-icon.svg` | Görsel / Varlık | Cogniti marka varlığıdır; tema veya ikon sunumunda kullanılır. |

### 📁 public/rehber/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|

### 📁 public/rehber/ses/

| Dosya Adı | Türü | İşlevi ve Fonksiyonel Görevi (1-2 Cümle) |
|---|:---:|---|

---

## 11. SIFIR `ANY` VE KESİN TİP GÜVENLİĞİ SÖZLEŞMESİ (STRICT TYPE-SAFETY)

HapBilgi kod tabanında tip güvenliği, sistem dayanıklılığı ve bakım kolaylığının temel taşıdır. Kod kalitesini en üst düzeye çıkarmak amacıyla **Sıfır `any` Prensibi** hayata geçirilmiş ve kurumsal olarak kilitlenmiştir:

1. **Tam Tip Kapsamı (0 `any`):** Projedeki 618 adet `.ts` ve `.tsx` dosyasının tamamı taranmış; önceki sürümlerden kalan tüm serbest `any` kullanımları tasfiye edilerek yerlerine kanonik Supabase row arayüzleri, jenerik haritalar (`Record<string, unknown>`), typed UI prop'ları (`AuthKullanici`, `Soru`, vb.) ve güvenli hata yakalama modelleri (`catch (err: unknown)`) entegre edilmiştir.
2. **ESLint Kalite Kilidi:** `eslint.config.mjs` yapılandırmasında `@typescript-eslint/no-explicit-any: "error"` kuralı aktif hale getirilmiştir. Kod tabanına yeni bir `any` tipi eklenmesi derleme ve CI/CD pipeline aşamasında otomatik olarak engellenir.
3. **Type Narrowing & Unknown Disiplini:** Belirsiz API girdileri veya harici JSON verileri asla `any` olarak işaretlenmez; `unknown` tipi ve `instanceof Error`, `typeof` ya da type guard yardımcıları ile sıkı tip daraltma (type narrowing) yapılarak güvenli alana taşınır.
4. **Veri ve Panel Uyumu:** Panel ana sayfa bileşenleri (`BmAnaSayfa`, `IuAnaSayfa`, `TmAnaSayfa`, `YoneticiAnaSayfa`) doğrudan `AuthKullanici` sözleşmesine; yayın ve talep hatları ise `HamTalepKaydi` ve `Soru` standartlarına bağlanmıştır.

---

## 12. SORU ERİŞİMİ KESİNTİ KURALI (TÜM İZLEYİCİ ROLLER)
*Tarih: 30 Ağustos 2026 | Kapsam: UTT/KD_UTT, BM (Challenge), E-Club, Eczanem müşteri*

Video tamamlanıp izleme puanı ve soru indeksleri yazıldıktan sonra kullanıcı soruları cevaplamadan çıkarsa, soru hakkının sunucuda açık kalması ve bazı akışlarda (BM challenge, E-Club, müşteri) yeniden girişte soruların tekrar açılması sorunu; dört izleme tablosuna eklenen tek tip `soru_erisimi_acik_mi` kapısıyla köke kapatıldı.

* **Alan (`soru_erisimi_acik_mi boolean NOT NULL DEFAULT false`):** `izleme_kayitlari`, `cc_izleme_kayitlari`, `eclub_izleme_kayitlari`, `eczanem_izleme_kayitlari`.
* **Durum geçişleri (tüm rollerde aynı):** ilk uygun video tamamlandı → `true` (tamamlama RPC'lerinde); cevaplar gönderildi → `false`; yayın yeniden başlatıldı → `false` (`baslat` uçlarında). Eski tamamlanmış-cevaplanmamış kayıtlar `false` kalır; geçmiş sorular açılmaz.
* **Kilit:** dört `/sorular` ve dört cevap yolu bu kapıyı denetler; kapalıysa eski `izleme_id` ile soru alınamaz veya cevap yazılamaz (atomik; eşzamanlı ikinci isteği keser).
* **BM challenge:** `challenge_kayitlari.izlendi_mi` artık video tamamlanınca açılır; referral yalnız cevap başarıyla kaydedilince verilir.
* **Not:** Mevcut `soru_hakki_var_mi` (UTT/E-Club) ve `cevaplandi_mi` (BM/müşteri) alanları korunur; tek-kaynağa indirgeme teknik borcu REDBOOK §6.4 TB-01'de.

---

## 13. ZORUNLU SADE KONTROL AİLELERİ — TASARIM VE ETKİLEŞİM SÖZLEŞMESİ

*Karar ve yürürlük tarihi: 8 Ekim 2026 | Durum: Kullanıcı tarafından onaylandı, tüm sayfa yapılandırmaları için zorunlu*

**Onaylı aile: Sade kapsül.** Etiketli dış kapsülün içinde ikinci bir seçim butonu bulunan alternatif onaylanmamıştır. Kalıcı, açılıp seçim yapılabilen görsel referans: [Sade Kontrol Aileleri](tasarim/SADE_KONTROL_AILELERI.html). Referanstaki kişi adları ve seçenekler gösterim örneğidir; gerçek kapsam ve veriler ilgili sayfanın iş kurallarından gelir.

### 13.1. Kapsam ve uygulama zorunluluğu

Bu sözleşme ana sayfalar, eğitim yayınları, ligler, raporlar, öneri ve işlem takipleri, Store, E-Club, C-Club, Eczanem, üretim, yönetim ve admin ekranları dahil **tüm sayfalarda**, **tüm rollerde**, masaüstü ve mobil görünümlerde geçerlidir. Yeni sayfa, yeni kontrol ve mevcut sayfa/kontrol yeniden yapılandırılırken uygun kontrol ailesi kullanılır. Aynı işlev için sayfaya veya role özel yeni bir tasarım oluşturulamaz.

Ortak görünüm ve etkileşim ortak bileşenlerden sağlanır. Sayfalarda aynı kontrolün kopyası çizilmez; boyut, font, renk, köşe ve gölge sayfaya özel sınıflarla rastgele değiştirilmez. Tablo içi küçük sürüm gibi farklılıklar, bu sözleşmedeki açık varyantlar üzerinden uygulanır. Standart değişikliği kullanıcı kararı ve BLUEBOOK kaydı gerektirir.

### 13.2. Altı kontrol ailesi

**8 Ekim 2026 — Kullanıcı tarafından onaylanan düzeltme:** Açılır seçimler toggle iç butonuyla aynı 30 px yüksekliğe ve 11 px / 800 yazı biçimine getirildi; ok hizaları ve form alanlarının sağ ok boşluğu eşitlendi. BM adının altındaki bölge satırı kaldırıldı. Bu düzeltmeler kalıcı tasarım referansına işlendi. Dokunmatik cihazlarda form seçim metninin 16 px olması erişilebilirlik istisnası olarak korunur.

**9 Ekim 2026 — Kullanıcı tarafından onaylanan yükseklik güncellemesi:** BM Öneri Takibi'ndeki denemenin ardından dökülen liste pilleri **40 px** yüksekliğe yükseltildi; yazı **11 px / 800** kaldı. Bu karar 8 Ekim'deki 30 px seçim yüksekliğinin yerini alır. Kişi/kapsam, tablo, çoklu alıcı ve form seçimleri ortak ölçüyü kullanır. Tarih alanları yanlarındaki seçimlerle aynı 40 px yükseklikte kalır. Toggle dış kapsülü 40 px, iç seçenek butonları 30 px olarak korunur. BM sayfasındaki geçici yerel ölçü kuralı kaldırılmıştır.

| Kontrol ailesi | Kullanım | Zorunlu sade tasarım ve davranış |
|---|---|---|
| **Kişi ve kapsam seçimi** | BM, UTT, firma, takım, bölge, eczane ve benzeri tekli seçimler | Tek kapsül, 40 px yükseklik, 14 px köşe, 11 px Nunito yazı ve 800 yazı kalınlığı, beyaz yüzey, ince kenarlık, mavi seçim metni, sağda aşağı ok. Uzun kişi/listelerde açılan menünün üstünde arama; seçili öğede onay işareti. Kişi adları §13.5'e göre gösterilir; bölge müdürünün altında bölge adı veya ili gösterilmez. Dış kapsül içinde ikinci çerçeveli buton kullanılmaz. |
| **Tablo içi seçim** | Sütun başlığındaki kişi veya kapsam filtresi | Aynı seçim ailesinin tablo sürümü: 40 px yükseklik, 10 px köşe, 11 px yazı ve 800 yazı kalınlığı. Arama, seçili öğe ve açılıp kapanma davranışı kişi ve kapsam seçimiyle aynı kalır. Tabloya sığdırmak için metin aşırı küçültülmez. |
| **Kapsül filtre** | Ölçüm zamanı, yayın türü ve kısa kapsam seçenekleri | Tek ortak kapsül içinde seçenekler; 14 px dış ve 10 px iç köşe, 4 px iç boşluk, 30 px iç buton, 11 px yazı ve 800 yazı kalınlığı. Dış kapsülün toplam yüksekliği kenarlıklarla 40 px olur; açılır seçimler bu kapsülün dış yüksekliğiyle eşleşir. Aktif seçenek mavi zemin/beyaz metin; diğerleri sade metin. Birbirinden kopuk ayrı yayın türü pilleri çizilmez. |
| **Altı çizgili sekme** | Sayfa içeriği veya görünümü değiştiren sekmeler | 13 px kalın yazı; altta ince ortak ayraç; seçili sekmede mavi metin ve 2 px mavi çizgi. Dolgulu kapsül filtreyle karıştırılmaz. İçerik değişimi seçili sekmeyle eşleşir. |
| **Çoklu alıcı seçimi** | Gönderim için birden fazla kişi/eczane seçimi | Sade tek kapsül, 40 px yükseklik, 11 px yazı ve 800 yazı kalınlığı; sağda aşağı ok, kapsülde seçili alıcı sayısı. Açılan listede arama ve onay kutuları. Her seçimde liste kapanmaz; seçili sayısı anında güncellenir. Tekli kişi seçimiyle aynı yüzey, font, kenarlık ve menü dili kullanılır. |
| **Form alanı** | Veri girişindeki unvan, durum ve benzeri seçenekler | Alan etiketi üstte; tek giriş alanı; 40 px yükseklik, 12 px köşe, 11 px yazı ve 800 yazı kalınlığı. Seçili değer açıkça görünür. Form etiketi, butonu içine alan ikinci bir kapsüle dönüştürülmez. |

### 13.3. Ortak etkileşim ve mobil davranışı

**9 Ekim 2026 — Kullanıcı tarafından onaylanan üç stat kartı mobil standardı:** Üç stat kartından oluşan özet grupları mobilde (640 px altındaki ekranlarda) tek sütunda, üç kart alt alta ve her biri tam satır genişliğinde gösterilir. Bu kural tüm sayfalarda ve tüm rollerde geçerlidir; koşullu bir kartın gizlenmesiyle üç karta düşen grupları da kapsar. Mobilde iki kart yan yana veya bir kart tam satır, diğer iki kart yan yana düzeni kullanılmaz. 640 px ve üzerindeki yerleşim bu kararla değiştirilmez. Mevcut sayfaların bu standarda dönüştürülmesi ayrıca uygulanacaktır.

- Açılır seçimlerin aşağı okları metin taban çizgisinden bağımsız, kontrolün dikey merkezine hizalanır. Kişi/kapsam, tablo içi, çoklu alıcı ve form seçimleri aynı ok biçimini kullanır. Form alanı oklarının sağ kenar boşluğu tablo içi seçimle aynıdır: kenarlık hariç 12 px (dış kenardan 13 px); metin ok alanına taşmaz.
- Tekli seçimde menü kapanır, seçili değer kapsüle yansır ve odak seçim butonuna döner. Arama Türkçe adlarla çalışır; sonuç yoksa anlaşılır boş durum gösterilir.
- Menüler dışarı tıklama ve `Escape` ile kapanır. Açık/kapalı, seçili ve devre dışı durumları erişilebilirlik özellikleriyle bildirilir. Klavye ile açma, arama, seçim ve kapatma kullanılabilir; sekmeler uygun klavye gezintisini destekler.
- Sekme ve filtre değişiklikleri gereksiz sayfa atlaması oluşturmaz. Veri yükleme sırasında seçilen kapsam anlaşılır kalır; geç gelen eski yanıt yeni seçimin üzerine yazılmaz.
- Mobilde kontroller sıkıştırılarak okunamaz hale getirilmez; uygun satır düzeni veya yatay kapsül kaydırması kullanılır. Açılan menü ekran dışına taşmaz. Dokunmatik hedef gerektiğinde büyütülür; tablo içi küçük varyant okunabilirliğini korur.
- Kişi seçimleri, ilişkili kapsam zincirine göre çalışır. Kullanıcı yalnız rolünün izin verdiği seçenekleri görür; üst kapsam değiştiğinde geçersiz alt seçim korunmaz. `Tümü`, `Tüm Bölge` ve benzeri toplam seçenekleri yalnız sayfanın gerçekten desteklediği kapsamı ifade eder.
- Ölçüm zamanı seçenekleri yalnız **Haftalık, Aylık, Dönemlik, Yıllık**; ortak kaynak `lib/utils/raporUtils.ts` içindeki `PERIYOTLAR` listesidir. İşlem ayı seçimi gibi ayrı işlevler günlük ölçüm seçeneğine dönüştürülemez.

### 13.4. İş kurallarının korunması ve mevcut durum

Görünümün ortaklaştırılması rol yetkisini, firma/modül sınırını, veri kapsamını, puan hesabını, gönderim hakkını veya kayıt davranışını değiştirmez. Üretim durumunu anlatan renkler, çoklu seçim, depo/şube kayıt kuralları ve özel işlem dönemleri kendi işlevlerini korur; uygun aileye bağlanırken ortak tasarım dili uygulanır. Onaylı örnekteki her seçenek her sayfaya eklenmez.

**Bu bölüm bağlayıcı tasarım kararını kaydeder.** Etkileşimli örnek repoya alınmıştır; bütün uygulama ekranlarının ortak bileşenlere taşınması bu kayıt işlemiyle tamamlanmış sayılmaz. Mevcut dağınık kullanımların dönüştürülmesi ayrıca yürütülecek geliştirme işidir. Önceki envanterdeki farklı tasarımlar bu standardı geçersiz kılamaz.

**8 Ekim 2026 — Ortak kontrol geliştirmesi:** Altı standart kontrolün ortak uygulaması `components/kontrol/SadeKontroller.tsx`, ortak görünümü `components/kontrol/sade-kontroller.module.css` dosyalarında hazırlandı. Kişi/kapsam ve tablo seçimi, kapsül filtre ve zaman toggle’u, altı çizgili sekme, çoklu alıcı seçimi ve form seçimi bu kaynaktan sağlanır. Mevcut `PeriyotButonlari`, `TemsilciSecici`, `YayinTuruFiltresi` ve `Select` ortak yapıya bağlandı; bunları kullanan ekranlar değişiklikten etkilenir. Liglerin zaman etiketleri `PERIYOTLAR` kaynağından alınırken mevcut API değerleri korunur. Sayfalarda ayrı tanımlanmış kontrollerin geçişi ve sayfa bazında görsel doğrulama sonraki adımdır; tüm ekranların dönüşümü tamamlanmış değildir. İşlem butonu için bu bölümde ayrı standart bulunmadığından `Button` değiştirilmedi.


**9 Ekim 2026 — BM kontrol incelemesi sonrası uygulama:** BM ana sayfasının yayın türü ve zaman toggle’ları mobilde alt alta yerleşir. Altı Eğitim Yayınları sayfasında tarih alanları `SadeTarihAlani` üzerinden 40 px olur; arama alanı yanındaki seçimle aynı yüksekliği kullanır. Mobil öneri gönderiminde Temsilciler tam satır, Başlangıç/Bitiş yan yana, Gönder ayrı satırdır. E-Club Yayınları mobil filtreleri ve BM T-Club Ligi toggle’ları aynı başlangıç hizasına alınmıştır. Öneri Durumları listesinin `planlandi` değeri **Planlananlar** olarak gösterilir. Ortak davranış raporunda Rapor/Karşılaştırma ve Tümü/Kazandıranlar/Kaybettirenler görünümlerinin içeriği sekme alt çizgisinden 20 px sonra başlar. Gönderim, tarih sınırları ve filtre değerleri korunmuştur; bu kayıt yeni bir kontrol ailesi tanımlamaz.

### 13.5. İsim listelerinde standart gösterim

**9 Ekim 2026 — Kullanıcı kararı:** İsim seçilen bütün dökülen listeler `components/kontrol/KisiKontroller.tsx` ortak kaynağını kullanır. Tekli seçim `SadeKisiSecimi`, çoklu seçim `SadeKisiCokluSecimi`, isim biçimi `kisiGorunenAdi` üzerinden sağlanır.

- Seçim öncesinde kapsülün içinde kapsamı anlatan başlık bulunur: **Bölge Müdürleri, Temsilciler, Kullanıcılar, Üyeler, İçerik Üreticileri, Alıcılar**. Karşılaştırma seçimleri **Bölge Müdürü 1/2** veya **Temsilci 1/2** olarak ayırt edilir.
- Kişi seçeneklerinde ve tekli seçim sonrasında **ad soyad** gösterilir. `BM`, `PM`, `TM`, `UTT` ve diğer unvan önekleri; isim sonundaki rol parantezleri kullanılmaz. Şirketlerin görev unvanlarının farklı olması bu kararın gerekçesidir.
- **Ecz.** ve **Ecz.Tekn.** istisnadır: eczacı ve eczane teknisyeninin isminin önünde korunur. Eczacı grubunun ikinci ve yardımcı eczacı rolleri de **Ecz.** önekiyle gösterilir. Rol ve yetki verileri değişmez.
- Tümünü kapsayan gerçek seçenekler açılan listede **Tüm Bölgeler, Tüm Temsilciler, Tüm Kullanıcılar, Tüm Üyeler** gibi açık ifadelerle gösterilir. Sayfada bulunmayan bir tümünü seçme davranışı eklenmez.
- Pasiflik, kalan öneri hakkı ve gönderim engeli gibi işlem bilgileri isimden ayrı satırda gösterilir. Tekli seçim kapsülünde yalnız kişi adı bulunur. Çoklu seçim kapsülünde **N kişi seçildi** yazılır.
- E-Club Yayınları'nda otomatik seçilen temsilci mevcut veri kapsamını korur; kullanıcı listeden seçim yapana kadar kapsülde **Temsilciler** başlığı gösterilir. Bölge müdürü seçimi değişince bu başlangıç gösterimine dönülür.

### 13.6. Kontrol Checklisti

Her sayfada yalnız kullanılan kontrol aileleri için uygulanacak checklist:

| No | Kontrol | Sonuç |
|---|---|---|
| 1 | Kontrol, uygun ortak bileşenden kullanılıyor mu? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |
| 2 | Sayfaya özel boyut, font, renk, köşe veya gölge değişikliği yapılmamış mı? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |
| 3 | Dış kapsül içinde ikinci çerçeveli seçim butonu bulunmuyor mu? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |

**Ölçüler ve görünüm**

| No | Kontrol | Sonuç |
|---|---|---|
| 4 | Kişi/kapsam seçimi: **40 px**, **11 px / 800**, **14 px köşe** mi? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |
| 5 | Kişi/kapsam seçimi: beyaz yüzey, ince kenarlık, mavi metin ve sağ aşağı ok kullanıyor mu? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |
| 6 | Tablo seçimi: **40 px**, **11 px / 800**, **10 px köşe** mi? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |
| 7 | Kapsül: dış **40 px / 14 px köşe**, iç buton **30 px / 10 px köşe**, iç boşluk **4 px** mi? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |
| 8 | Kapsül yazısı **11 px / 800** mü? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |
| 9 | Kapsül seçenekleri tek kapsül içinde mi; aktif seçenek mavi zemin/beyaz metin mi? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |
| 10 | Sekme yazısı **13 px / 800** mü; ortak alt ayraç ve aktif **2 px mavi çizgi** var mı? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |
| 11 | Çoklu alıcı seçimi **40 px**, **11 px / 800** mü; ortak seçim görünümünü kullanıyor mu? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |
| 12 | Form seçimi **40 px**, **11 px / 800**, **12 px köşe** mi? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |
| 13 | Form etiketi üstte, seçili değer görünür ve giriş alanı tek mi? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |
| 14 | Dokunmatik cihazdaki form seçimi yazısı **16 px** istisnasına uygun mu? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |
| 15 | Tarih ve arama alanlarının yüksekliği yanındaki seçimle eşleşiyor mu? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |

**Oklar, seçim ve klavye**

| No | Kontrol | Sonuç |
|---|---|---|
| 16 | Aşağı ok biçimi ortak mı ve dikey merkezde mi? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |
| 17 | Form okunun sağ boşluğu kenarlık hariç **12 px**, dış kenardan **13 px** mi; metin ok alanına taşmıyor mu? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |
| 18 | Uzun listelerde arama, seçili öğede onay işareti ve anlaşılır boş sonuç var mı? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |
| 19 | Tekli seçimde menü kapanıyor, değer güncelleniyor ve odak tetikleyiciye dönüyor mu? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |
| 20 | Çoklu seçimde menü açık kalıyor ve seçili sayısı güncelleniyor mu? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |
| 21 | Menü dışarı tıklama ve `Escape` ile kapanıyor mu? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |
| 22 | Açık/kapalı, seçili ve devre dışı durumları erişilebilirlik özellikleriyle bildiriliyor mu? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |
| 23 | Klavyeyle açma, arama, seçim ve kapatma çalışıyor mu? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |
| 24 | Sekmeler klavyeyle gezilebiliyor ve seçilen sekmenin içeriği gösteriliyor mu? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |

**Mobil ve veri davranışı**

| No | Kontrol | Sonuç |
|---|---|---|
| 25 | Mobilde metinler okunabilir mi; satır düzeni veya yatay kaydırma kullanılıyor mu? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |
| 26 | Menüler ekrana sığıyor ve dokunmatik hedefler kullanılabilir mi? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |
| 27 | Filtre/sekme değişimi gereksiz sayfa atlaması oluşturmuyor mu? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |
| 28 | Yükleme sırasında seçili kapsam korunuyor; eski yanıt yeni seçimin üzerine yazılmıyor mu? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |
| 29 | Kullanıcı yalnız yetkili seçenekleri görüyor; üst kapsam değişince geçersiz alt seçim temizleniyor mu? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |
| 30 | “Tümü” seçenekleri gerçekten desteklenen kapsamı ifade ediyor mu? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |
| 31 | Görünüm değişikliği mevcut yetki, veri kapsamı, puan ve kayıt kurallarını koruyor mu? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |

**Ölçüm zamanı ve isimler**

| No | Kontrol | Sonuç |
|---|---|---|
| 32 | Ölçüm seçenekleri yalnız **Haftalık, Aylık, Dönemlik, Yıllık** mı ve `PERIYOTLAR` kaynağından mı geliyor? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |
| 33 | İşlem ayı, ölçüm zamanı seçeneğiyle karıştırılmamış mı? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |
| 34 | İsim listeleri `KisiKontroller.tsx` ve `kisiGorunenAdi` kullanıyor mu? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |
| 35 | Seçim öncesi kapsam başlığı ve karşılaştırmalarda 1/2 ayrımı var mı? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |
| 36 | İsimler ad soyad mı; yalnız **Ecz. / Ecz.Tekn.** önekleri korunuyor mu? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |
| 37 | BM altında bölge/il gösterilmiyor; işlem bilgileri isimden ayrı mı? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |
| 38 | Tekli seçimde kişi adı, çoklu seçimde **N kişi seçildi** gösteriliyor mu? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |
| 39 | Toplam seçeneklerin adları açık mı; desteklenmeyen tümünü seçme eklenmemiş mi? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |
| 40 | E-Club otomatik temsilci seçiminde başlangıç ve sıfırlama başlığı **Temsilciler** mi? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |

**Sayfaya özel kayıtlı kurallar**

| No | Kontrol | Sonuç |
|---|---|---|
| 41 | BM ana sayfasında mobil yayın türü ve zaman kapsülleri alt alta mı? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |
| 42 | Mobil öneride Temsilciler tam satır, tarihler yan yana, Gönder ayrı satır mı? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |
| 43 | E-Club mobil filtreleri ve BM T-Club kapsülleri aynı başlangıç hizasında mı? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |
| 44 | Belirtilen Rapor/Karşılaştırma ve Tümü/Kazandıranlar/Kaybettirenler içerikleri sekme çizgisinden **20 px** sonra mı başlıyor? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |
| 45 | Üç stat kartı bulunan gruplar mobilde (640 px altında) tek sütunda, üç kart alt alta ve tam satır genişliğinde mi? Koşullu olarak üç karta düşen gruplar da bu kurala uyuyor mu? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |

**Yenile butonu**

| No | Kontrol | Sonuç |
|---|---|---|
| 46 | Yenile butonu başlık satırının sağında, başlık metniyle dikey merkezleri aynı yatay çizgide ve sağ kenarı en sağdaki stat kartın sağ kenarıyla (stat kart yoksa içerik alanının sağ sınırıyla) hizalı mı; takvim, açıklama, bilgi bandı veya stat kartının dışında mı? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |
| 47 | Mobilde Yenile başlıkla aynı satırda kalıyor mu; alan daraldığında yatay boşluklar azaltılıp gerekirse yalnız simge gösteriliyor mu; dokunma alanı en az 44 × 44 px ve erişilebilir adı “Yenile” mi? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |
| 48 | Ortak `YenileButonu` kullanılıyor ve sayfaya özel görünüm oluşturulmuyor mu? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |
| 49 | Yenileme sırasında buton pasif ve simgesi döner durumda mı; metin gösterilen görünümde etiket, yalnız simgeli görünümde erişilebilir ad “Yenileniyor…” mu? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |
| 50 | Yenileme yalnız verileri güncelliyor; seçili firma, ürün, sekme, filtre ve dönem korunuyor mu? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |
| 51 | Yenile butonunun kullanımı, §13.7'deki sayfa içeriği ölçütüne uygun mu; otomatik güncellenen sayfalarda ayrıca buton gereksinimi değerlendirilmiş mi? | ☐ Uygun ☐ Uyumsuz ☐ Uygulanmaz |

**İşlem butonları:** Ekle, Gönder, Kaydet, İptal, Yenile ve Kapat butonlarına seçim kontrollerinin ölçüleri uygulanarak uyumsuzluk yazılmaz. Yenile butonunun yerleşim, ortak bileşen ve davranış kuralları §13.7 kapsamında ayrıca değerlendirilir.

### 13.7. Yenile Butonu Standardı

*Karar ve yürürlük tarihi: 10 Ekim 2026 | Kapsam: tüm sayfalar ve tüm roller*

**Kullanım ölçütü**

Yenile butonu; kullanıcı sayfada kalırken başka kullanıcıların veya sistemin işlemleriyle değişebilen liste, durum, puan, bakiye ve rapor verilerini gösteren sayfalarda kullanılır. Sabit içerik ve yalnızca veri girişine yönelik sayfalarda kullanılmaz.

| Sayfanın içeriği | Yenile ihtiyacı |
|---|---|
| Talep, sipariş, onay, teslimat ve işlem takibi | Yararlıdır. İşlemin durumu başka kullanıcı tarafından değişebilir. |
| Yayın, görev ve dağıtım listeleri | Yararlıdır. Yeni kayıt gelebilir veya mevcut kaydın durumu değişebilir. |
| Puan, bakiye, lig ve performans raporları | Yararlıdır. Başka kullanıcıların işlemleri sonuçları değiştirebilir. |
| Kullanıcı, ekip ve müşteri listeleri | Yararlıdır. Kayıtlar başka yetkililer tarafından değiştirilebilir. |
| Sabit açıklamalar, kullanım bilgileri ve tanıtım sayfaları | Gerekli değildir. Güncellenecek işlem verisi yoktur. |
| Yalnızca kullanıcının doldurduğu form veya düzenleme ekranı | Gerekli değildir. Buradaki işlem kaydetmedir. |

Sayfa bu değişiklikleri otomatik olarak güncelliyorsa, ayrıca Yenile butonu koyma ihtiyacı değerlendirilir.

**Yerleşim ve davranış**

- Yenile butonu, **sayfa başlığının bulunduğu satırın sağındaki aksiyon alanında** yer alır.
- **Başlık metni ile butonun dikey merkezleri aynı yatay çizgide** olur. Hizalama, başlık ve alt açıklamanın toplam yüksekliğine göre yapılmaz.
- Butonun **sağ kenarı, en sağdaki stat kartın sağ kenarıyla aynı dikey çizgide** olur. Stat kart bulunmayan sayfalarda içerik alanının sağ sınırı esas alınır.
- Takvim, açıklama, bilgi bandı veya stat kartının içine yerleştirilmez.
- **Mobilde buton başlıkla aynı satırda, sağda kalır; alt satıra taşınmaz.** Alan daraldığında önce yatay boşluklar azaltılır; gerekirse “Yenile” yazısı kaldırılıp yalnız simge gösterilir. Dokunma alanı **en az 44 × 44 px** kalır ve yalnız simgeli butonun erişilebilir adı **“Yenile”** olur.
- Ortak **`components/ui/yenile-butonu.tsx` içindeki `YenileButonu`** bileşeni kullanılır; sayfaya özel görünüm oluşturulmaz.
- Yenileme sırasında buton pasif olur ve simgesi döner. Metin gösterilen görünümde **“Yenileniyor…”** yazısı gösterilir; yalnız simgeli görünümde erişilebilir ad **“Yenileniyor…”** olur.
- Yenileme yalnız verileri günceller; seçili firma, ürün, sekme, filtre ve dönem korunur.
- Bu standart, yeni sayfalarda ve mevcut sayfalar yeniden düzenlenirken tüm roller için zorunludur.

Bu kayıt standardı tanımlar; mevcut sayfaların tamamının bu standarda dönüştürüldüğü anlamına gelmez.

---

### 13.8. Ana Sayfa Tarih Pill’i Standardı

*Karar ve yürürlük tarihi: 10 Ekim 2026 | Kapsam: admin hariç tüm rollerin ana sayfaları*

- **Kapsam:** Admin hariç tüm rollerin ana sayfalarında bulunur.
- **İçerik:** Türkiye saatine göre güncel tarih, **GG.AA.YYYY** biçiminde gösterilir.
- **Yükseklik:** **24 px**.
- **Genişlik:** İçeriğe göre belirlenir; sağ ve sol iç boşluk **12 px** olur.
- **Yazı:** **10 px**, normal kalınlık, gri (`#6b7280`).
- **Görünüm:** Beyaz zemin, **1 px** açık gri kenarlık (`#e5e7eb`), tam yuvarlatılmış köşeler.
- **Konum:** Karşılama alanının sağında, stat kartlarının üstünde bulunur. Sağ kenarı, en sağdaki stat kartının sağ kenarıyla hizalanır. Alt kenarı, karşılama bloğunun alt kenarıyla hizalanır.
- **Süre pill’i varsa:** Süre pill’i üstte, tarih pill’i altta yer alır. Aralarında **6 px** boşluk bulunur.
- **Mobil:** **768 px altındaki ekranlarda gizlenir.**
- **Davranış:** Bilgi gösterimidir; tıklanmaz ve bağlantı içermez.
- **Ortak uygulama:** `components/ui/tarih-pill.tsx` içindeki `TarihPill` ve `tarih-pill.module.css` kullanılır. Ana sayfalarda ayrı güncel tarih hesaplama veya pill görünüm kodu tutulmaz. Ortak bileşen Türkiye saatini esas alır ve açık kalan sayfada tarih değişimini günceller.

---

### 13.9. Ortak Sayfa Açılış Performansı Standardı

*Karar ve kayıt tarihi: 11 Ekim 2026 | Referans: T-Club Ligi açılışı ve E-Club ana sayfa iyileştirmesi*

Yeni sayfalarda ve kullanıcı tarafından hızlandırılması istenen mevcut sayfalarda aşağıdaki yaklaşım uygulanır. Kullanıcı sayfa bağlantılarını verdiğinde ilgili sayfanın veri akışı incelenir; tasarım, rol/firma kapsamı ve iş kuralları korunarak uygun iyileştirmeler yapılır.

- **Yükleme görünümü:** İlk veri beklenirken sayfanın gerçek yerleşimine uygun iskelet gösterilir. Uygun rotalarda `loading.tsx` ile istemci veri yükleme durumu aynı iskeleti kullanır. İskeletin görünmesi, gerçek içeriğin daha hızlı yüklendiğinin kanıtı değildir.
- **Veri önbelleği:** Güncellik gereksinimi izin veren salt okunur veriler kullanıcı kimliği, firma/organizasyon kapsamı ve sonucu etkileyen bütün filtreler/seçimler bazında ayrılır. T-Club Ligi ve E-Club ana sayfasındaki **60 saniye**, uygun sayfalar için referans süredir; bütün ekranlara zorunlu olarak uygulanmaz. Bellek ve gerektiğinde `sessionStorage` kullanılabilir. Kimliği doğrulanmamış durumda kişisel önbellek okunmaz; yetki ve modül kontrolleri önbellek gerekçesiyle atlanmaz. Süresi dolmuş, bozuk veya başarısız veri yeniden istenir. Açıkça etkinleştirilen ekranlarda sınırlandırılmış eski veri hemen gösterilip arka planda doğrulanabilir; süre sınırı ve hata davranışı sayfa kaydında belirtilir.
- **İstek paylaşımı ve güncellik:** Aynı kullanıcı/kapsam için eş zamanlı aynı okuma istekleri paylaşılır. Eski yanıt yeni seçimin verisini ezmez. Tamamlama, beğeni/favori, talep veya başka bir veri değiştiren işlem ilgili önbelleği geçersiz kılar ya da güncel veriyle yeniler. Varsa mevcut Yenile eylemi önbelleği aşar; bu standart tek başına yeni bir buton ekleme gerekçesi değildir.
- **Önemli görselin önceliği:** İlk görünümdeki LCP adayı görsel gecikmeli yüklenmez; uygun yerde `loading="eager"`, `fetchPriority="high"` veya preload kullanılır. Bütün görseller yüksek öncelikli yapılmaz; diğer kapaklar gecikmeli yüklenmeye devam eder. Banner ve yayın kartı kapağı ayrı değerlendirilir. Görsel boyutu ve indirme süresi ölçülerek gerekiyorsa uygun boyut/biçim sunulur.
- **Sorgu akışı:** Bağımsız sorgular paralel yürütülür; aynı veri tekrar okunmaz, önceki sonuç yeniden kullanılır. Gerçek veri bağımlılıkları, hata kontrolleri, firma/rol filtreleri ve hesap sonuçları korunur. API paralelleştirmesi video yükleme/transkod zincirinin değiştirilmesine izin vermez.
- **Doğrulama:** Değişiklik kapsamına uygun TypeScript, lint ve davranış testleri çalıştırılır. İlk önbelleksiz giriş ve önbellekli dönüş ayrı ölçülür; karşılaştırmalarda ekran boyutu, gezinme türü ve ağ/cihaz koşulları eş tutulur. Geliştirme ortamı ölçümü üretim sonucu sayılmaz; üretim derlemesinde tekrar doğrulanır. Görsel önceliği, istek süresi ve çizim gecikmesi ölçülmeden sabit süre kazanımı vaat edilmez.
- **Kapsam:** Yalnız istenen sayfalar ve bu sayfaların gerektirdiği ortak altyapı değiştirilir. Ortak bileşenlerde yeni davranış varsayılan olarak diğer sayfalara yayılmaz; gereken sayfa açıkça etkinleştirir.

**Mevcut referans uygulama:** T-Club Ligi için `app/(panel)/t-club-ligi/page.tsx` ve `components/tclub/TClubPageSkeleton.tsx`; E-Club ana sayfası için `components/eclub/EclubAnaSayfaSkeleton.tsx`, `lib/eclub/anaSayfaPanelOnbellek.ts`, `lib/eclub/anaSayfaBannerOnbellek.ts` ve `app/(panel)/eclub/panel/_hooks/useEclubPanel.ts`. Ortak `YayinKarti` içindeki `kapakOncelikli` seçeneği yalnız etkinleştirilen kapakta eager/high uygular. Panel API'sinde öneri/performans sorguları paraleldir; ürün bağı bir kez okunur, ürün bağı ile beğeni/favori sorguları eş zamanlı yürütülür.

**Ölçüm kaydı:** Kullanıcı, E-Club ana sayfasında son yerel LCP sonucunu **0,55 saniye** olarak bildirdi. Önceki ekran görüntülerinde 4,06 → 3,36 → 2,20 saniye görüldü. Koşulların eşitliği ve önbellek durumu kaydedilmediğinden bunlar kontrollü karşılaştırma veya diğer sayfalar için süre garantisi değildir.

**E-Club Firmalar — 11 Ekim 2026:** Kullanıcının başlangıç açılış ölçümü 1,30–1,58 saniyedir. `/eclub/firmalar` için sayfaya uygun ortak rota/istemci iskeleti ve ilk firma logosunda eager/high yükleme uygulandı. `lib/panel/sayfaOkumaOnbellegi.ts` salt okunur sayfalar için genel, tipli bellek/oturum önbelleği ve eş zamanlı istek paylaşımı sağlar. Firmalar listesi kullanıcı bazında 60 saniye saklanır; önbellekten gösterilse de API ile arka planda tekrar doğrulanır. Başarısız okumada önbellek ve gösterilen liste kaldırılır; kullanıcı değişiminde önceki liste gösterilmez. Firma erişimi API'si ve tasarım korunur. Önbellek ve firma gezinme/erişim kontrollerini kapsayan 11 test geçti; değişiklik sonrası kullanıcı açılış ölçümü henüz alınmadı.

**E-Club Firma Yayınları — 11 Ekim 2026:** Kullanıcının `/eclub/firma/hepifarma/yayinlar` için başlangıç ölçümü 3,97 saniyedir. Firma/ürün bilgisi, yayın paneli ve banner istekleri oturum doğrulandıktan sonra eş zamanlı başlar. Panel API'si `firma` rota adını yalnız kullanıcının aktif firma kapsamından UUID'ye çözer; yetkisiz veya boş firma parametresi genel listeye düşmez. Firma bilgisi ve banner ortak okuma önbelleğini, panel kullanıcı–firma bazlı 60 saniyelik panel önbelleğini kullanır. Firma bilgisi önbellekten açılsa da erişim API'si arka planda tekrar çağrılır; hata durumunda çalışma alanı kapatılır. İlk banner ve ilk yayın kapağı önceliklidir; rota/istemci yüklemesi aynı firma yayınları iskeletini kullanır. Çek sekmelerinin kodu dinamik yüklenir. Ürün/sekme seçimi ve tamamlama sonrası zorunlu yenileme korunur. React açılış/önbellek testi dahil ilgili 20 test geçti; yeni kullanıcı süre ölçümü henüz alınmadı. Çek teslimatının tek aktif eczacıya e-posta ve aynı eczanenin aktif E-Club hesaplarına push outbox akışı koddan yeniden kontrol edildi; gerçek teslimat testi yapılmadı. Hediye Takibi uçtan uca testi ve mevcut test verilerinin temizlik bekleyişi değişmedi.

**E-Club Ana Sayfa Dönüşü — 11 Ekim 2026:** Kullanıcı sayfalar arası dönüşte yaklaşık 2 saniye, sonraki dönüşte 0,50 saniye bildirdi (ekran görüntüsü 1,96 saniye). Ana sayfa paneli ve banner için en fazla beş dakikalık kullanıcı kapsamlı veri dönüşte hemen gösterilir; panel ve banner yeniden doğrulanır. Önbellek okuması kayıt zamanını uzatmaz. Panel yenileme/tamamlama önbelleği aşar; başarısız panel okuması veriyi ve önbelleği kaldırır. Banner başarısızlığında eldeki görsel kaldırılır. Firma yayınları ve diğer sayfalar bu panel davranışına dahil değildir. Bu değişiklik ilk önbelleksiz girişin veya bütün dönüşlerin 0,50 saniye olacağı garantisi değildir. Süre sonu, ağ sonucu, yetki hatası, kullanıcı ayrımı ve zorunlu yenileme davranışı test edilir.

**E-Club Firma Yayınlarına Dönüş — 11 Ekim 2026:** Kullanıcı Hepifarma yayınlarına tekrar girişte 1,63 saniye bildirdi. Yayın sekmesinde kullanıcı–firma kapsamlı firma bilgisi, panel ve banner kayıtları en fazla beş dakika boyunca dönüşü ağ beklemeden açmak için kullanılır; üç veri kaynağı arka planda yeniden okunur. Firma erişimi reddedilirse çalışma alanı kapatılır; zorunlu panel yenilemesi önbelleği aşmaya devam eder. Genel okuma yardımcısındaki süre genişletme isteğe bağlıdır; diğer ekranların varsayılan 60 saniyesi değişmez. 60 saniye sonrası geciktirilmiş ağ ile açılış ve firma yetkisinin kaldırılması React testinde doğrulandı. Yeni tarayıcı süre ölçümü bekleniyor.

**E-Club Yayın Tamamlama Performansı — 11 Ekim 2026:** Kullanıcının Hepifarma performans sayfası başlangıç ölçümü 4,21 saniyedir. Firma bilgisi yayın sekmesiyle aynı kullanıcı–firma önbelleğinden beş dakika sınırıyla gösterilir ve yeniden doğrulanır. Performans sekmesi kullanılmayan yayın panelini artık istemez veya beklemez. Performans verisi kullanıcı–firma–ürün–iki aylık dönem koduyla ayrılan ortak okuma önbelleğinde saklanır; dönüşte en fazla beş dakikalık veri gösterilir, açılışta, odaklanmada ve mevcut 60 saniyelik kontrolle yeniden okunur. Hata durumunda veri ve önbellek kaldırılır; ürün/kullanıcı değişimi eski kapsamı göstermez. Grafik kütüphanesi ayrı dinamik yüklenir; puan özeti ve tablo veri yüklemesini grafik kodu bekletmez. API'de firma bağlantıları/yayınlar ile üye bağları/kazanım snapshot okumaları paraleldir; yetki filtreleri, sayfalama, iki aylık dönem ve hesaplama korunur. Rota/istemci yüklemesi performans iskeletini kullanır. Yeni tarayıcı süre ölçümü bekleniyor.

**E-Club Hediye Çeki Talebi — 11 Ekim 2026:** Kullanıcının Hepifarma çek talebi sayfası başlangıç ölçümü 3,10 saniyedir. Firma bilgisi ve yayın paneli paralel başlar; firma doğrulandıktan sonra çek ekranı yayın panelini beklemeden yüklenir, firma özeti beklenirken iskelet gösterilir. Çek ekranının kodu bu sırada önceden yüklenir. Firma/panel ve çek vitrini kullanıcı–firma kapsamıyla dönüşte en fazla beş dakikalık veriyi gösterir ve arka planda yeniler. Önbellekteki bakiye güncel sunucu yanıtıyla doğrulanana kadar talep düğmeleri kapalıdır. Yenile ve başarılı talep sonrası vitrin okuması önbelleği aşar; işlem öncesinde başlamış bir yanıt yeni kayıtları ezemez. Çek özeti RPC ve görünüm testi kapsamı okumaları paraleldir. Ana eczacı yetkisi, sunucu takvimi, bakiye RPC'si, test verilerinin salt okunur olması ve POST doğrulamaları korunur. E-posta/push outbox ve worker akışı yeniden incelendi; tek aktif ana eczacıya e-posta, aynı eczanenin aktif E-Club hesaplarına push sözleşmesi testlerle doğrulandı; gerçek gönderim veya sipariş oluşturulmadı. İlgili 48 test geçti; yeni tarayıcı ölçümü bekleniyor. Hediye Takibi uçtan uca test ve test verisi temizliği bekleyişi değişmedi.

**E-Club Hediye Çeki Takibi — 11 Ekim 2026:** Kullanıcının Hepifarma çek takibi sayfası başlangıç ölçümü 3,50 saniyedir. Firma ve yayın paneli paralel başlar; firma bilgisi hazır olduğunda takip ekranı panel sonucunu beklemez, panel özeti beklenirken iskelet gösterilir. Takip kodu erken yüklenir. Kullanıcı–firma kapsamlı talep listesi dönüşte en fazla beş dakikalık önbellekten gösterilir ve yeniden doğrulanır; güncel yanıt gelene kadar iptal ve kod kopyalama kapalıdır, bildirim okundu işlemi de güncel yanıtı bekler. GET erişim yardımcısındaki kişi ve aktif eczane üyeliği sonuçlarını yeniden kullanır; aynı kayıtlar tekrar sorgulanmaz. Firma/eczane/ürün kapsamı, durum ve çek kodu kuralları korunur. Başarılı yeni talep takip önbelleğini; iptal takip ve vitrin önbelleklerini geçersiz kılar, iptal sonrası panel ve takip verileri taze okunur. İşlemle silinen kayıt bekleyen eski yanıtla yeniden doldurulamaz. Yetki/okuma hatasında eski liste kaldırılır. İlgili 51 test, TypeScript ve lint geçti; yeni tarayıcı ölçümü bekleniyor. Tek aktif ana eczacıya e-posta ve aynı eczanenin aktif E-Club hesaplarına push outbox/worker sözleşmesi yeniden kontrol edildi; gerçek gönderim veya sipariş yapılmadı. Hediye Takibi canlı uçtan uca testi ve test verilerinin temizliği beklemede kalır.

Bu kayıt ortak geliştirme standardını ve referans uygulamaları tanımlar. Bütün sayfaların dönüştürüldüğü veya bütün önbelleklerin genel yardımcıya taşındığı anlamına gelmez; diğer sayfalar kullanıcı tarafından verildikçe incelenir.

---

### 13.10. Görsel Renk Envanteri ve Tema Çalışmasının Referansı

*İnceleme ve kayıt tarihi: 17 Ekim 2026 | Referans: repodaki mevcut çalışma ağacı; kaynak dosyalarının SHA-256 değerleri tam envanterde kayıtlıdır.*

Kullanıcının talebiyle HapBilgi'nin görsel renk kullanımları dosya, satır, özellik ve durum bilgileriyle çıkarıldı. Zemin, metin, buton, kenarlık, ayırıcı, gölge, outline/ring, SVG/Canvas, grafik, gradyan, saydamlık ve filtreler; hover/focus/active/disabled/dark/aria/data durumları; bütün pill aileleri ve E-Club HOYK ilerleme çerçevesi incelemeye alındı. Ayrıntılı mevcut durum kaydı [HapBilgi görsel renk envanteri raporudur](renk-envanteri/RAPOR.md).

#### Envanterin sayısal özeti

| Ölçüt | Sonuç |
| --- | --- |
| Taranan kaynak dosyası / bulgu içeren dosya | **1.205 / 300** |
| Dosya ve konum bilgisiyle inceleme kaydı | **18.971** |
| Uygulama kaynağı / tema ve rehber çalışması / HTML tasarım prototipi kayıtları | **16.312 / 896 / 1.763** |
| Katalogdaki renk, gradyan ve anahtar ifade | **1.765** |
| Alpha dahil normalleştirilmiş HEX ifadeleri / uygulama kaynağındakiler | **1.377 / 1.024** |
| Pill, rozet ve yuvarlak kontrol adayı | **469** |
| CSS değişken tanımı / statik görsel varlığı | **172 / 18** |
| AST/CSS ayrıştırma hatası | **0** |

Bir kullanım, renk bileşeni ve tam stil ifadesi gibi birden fazla kayıt üretebilir; **18.971 ayrı renk yoktur**. 1.765 ifade de algısal olarak farklı renk sayısı değildir. 469 aday içinde yuvarlak ikon ve avatarlar bulunur; tamamı pill olarak sınıflandırılmamıştır. CSS değişken listesi, bağımlılıkların görülebilmesi için renk dışındaki tanımları da içerir. Demo/prototip kayıtları mevcut uygulama kaynaklarından ayrı etiketlenmiştir.

#### Tema kararında dikkate alınacak doğrulanmış bulgular

- **Mevcut site tek bir mavi/gri palet kullanmıyor.** Marka bordosu `#bc2d0d`, genel tema mavisi `#56aeff`, Sade Kontrol/E-Club mavisi `#237ac8` ve yayın/puan mavisi `#2563eb` farklı görevlerde bulunuyor. Beyaz ve açık yüzeyler ile eski ortak metin ailesi ve yeni E-Club metin ailesinin bütün tonları ayrıntılı raporda kaynaklarıyla kayıtlıdır.
- **Önizleme ile mevcut site birebir aynı değil.** Örneğin mevcut aktif sol menü metni `#185fa5`, demodaki seçili metin `#1d4ed8` değerindedir. Önizlemedeki “Kırık beyaz–mavi” adı mevcut site renklerinin birebir kopyalandığı anlamına gelmez. Mevcut görünümü koruyacak seçeneğin referansı bu envanterdir.
- **HOYK ilerleme çizgisi hesaplanmış bir renk akışıdır.** `lib/eclub/hoykSureCercevesi.ts` ve `components/eclub/EclubHoykSureCercevesi.tsx` kaynaklarında yeşil `#16a34a` → sarı `#d99300` → kırmızı `#dc2626` durakları kullanılır. Canvas çizgisi 3,5 px kalınlıkta, saat yönünde ve geçen gün/15 oranında uzar; ara renkler çevre konumuna göre hesaplanır. Uzunluk geçişi 450 ms, 15. gündeki bütünüyle kırmızıya karışma 320 ms'dir. Süresi geçmiş tamamlanmamış kartta 2 px sabit kırmızı, tamamlanmış kartta 2 px sabit `#2563eb` çerçeve bulunur. 0–15 günün uç renkleri ve açık oynatıcı durum pill'inin metin/zemin hesabı ayrı kaydedildi.
- **Öğrenme aracı pill'lerinin alpha değeri de görünümün parçasıdır.** Video `#1d4ed8` / `#dbeafee8`, podcast `#7e22ce` / `#f3e8ffe8`, görsel `#047857` / `#d1fae5e8`, literatür `#b45309` / `#fef3c7e8` metin/zemin çiftlerini kullanır. `e8`, yaklaşık %90,98 opaklıktır; kenarlık, gölge ve blur ayrıca kayıtlıdır.
- **Diğer pill aileleri ayrı anlamlar taşır.** Aşama, teknik tür, hazır araç/soru, hedef rol, üretim durumu, çek talebi/teslimatı/günü, tarih ve dönem kontrolleri kaynaklarıyla listelendi. Aynı üretim durumunun üretici ve İÜ görünümündeki renkleri farklı olabilir. Araç türünün performans grafiğindeki rengi, araç pill'indeki rengiyle her zaman aynı değildir. E-Club kart sarmalayıcısının ortak durum kapsülünü kapattığı koşullar da kayıtlıdır.
- **Değerler kullanım bağlamıyla değerlendirilir.** Kurulu Tailwind sürümünün OKLCH karşılıkları, sınıf alpha ekleri, yerel CSS değişken kapsamları ve URL içine kodlanmış SVG rengi (`#7c8da4`) yakalandı. Aynı değişken adı farklı yerel kapsamlarda farklı anlam taşıyabilir; HEX metnini topluca değiştirmek bu ayrımları karşılamaz.

#### Tam kayıtlar ve tekrar üretim

| Belge / araç | İçerik |
| --- | --- |
| [Ayrıntılı rapor](renk-envanteri/RAPOR.md) | Renk aileleri, kaynaklar, HOYK hesabı, pill sözlükleri ve inceleme sınırları |
| [Aranabilir görsel katalog](renk-envanteri/renk-katalogu.html) | 1.765 ifadenin renk örnekleri ve bütün kaynak konumları |
| [Bütün renk ifadeleri](renk-envanteri/TUM_RENKLER.md) | Tam renk, gradyan ve ifade listesi |
| [Dosya bazında bütün kullanımlar](renk-envanteri/DOSYA_BAZINDA_TUM_KULLANIMLAR.md) | Her kullanımın dosyası, satırı, özelliği ve koşulu |
| [Pill ve yuvarlak kontroller](renk-envanteri/PILL_VE_YUVARLAK_KONTROLLER.md) | Adlandırılmış bileşenler ve inline adaylar |
| [CSS değişkenleri](renk-envanteri/CSS_DEGISKENLERI.md) | Bütün tanımlar ve kapsamları |
| [Tam CSV](renk-envanteri/tum-kullanimlar.csv) / [tam JSON](renk-envanteri/renk-envanteri.json) | 18.971 kayıt, bağlamlar, kaynak imzaları ve varlık listesi |
| [Özel bileşen tabloları](renk-envanteri/ozel-bilesenler.json) | Kaynaktan doğrulanan rol/durum/pill eşlemeleri ve HOYK gün renkleri |
| [Doğrulama sonucu](renk-envanteri/DOGRULAMA.json) / [ham HEX kapsam kontrolü](renk-envanteri/ham-hex-kapsam-kontrolu.json) | Bağımsız tarama, kritik bileşen kontrolleri ve yalnız yorumda kalan eşleşmeler |
| [Envanter tarayıcısı](../scripts/denetim/renk-envanteri.mjs) | `node scripts/denetim/renk-envanteri.mjs` ile ana listeleri yeniden üretir; uygulama kaynaklarını değiştirmez |

Tarayıcı TypeScript AST, PostCSS ve kurulu Tailwind tema tanımlarını kullanır. Bağımlılık/derleme çıktıları, test beklentileri ve düz metin belge örnekleri uygulama rengi sayılmaz. Raster görseller varlık olarak listelenir; fotoğraf pikselleri, uzaktan yüklenen kapak/banner/logolar, iframe içeriği ve tarayıcının kendi kontrolleri repo CSS paletine dahil değildir.

#### Doğrulama ve çalışma durumu

**Kaynak envanteri doğrulandı.** 1.205 dosyanın imzası eşleşti. Bağımsız ham HEX taramasındaki 6.024 eşleşmenin 6.012'si envanterde; kalan 12'si yalnız yorum satırı/bloklarında ve konumları kayıtlıdır. Açıkta kalan uygulama HEX kullanımı **0**. Katalog referansları, HOYK fonksiyonunun 0–15 gün çıktıları, dört araç pill'inin alpha değerleri, üretici/İÜ durum farkları, kodlanmış SVG ve CSV/JSON kayıt eşitliği kontrol edildi. Happy DOM'da katalog araması ve arama temizlenince tam listenin dönüşü doğrulandı; tarayıcı betiğinin ESLint kontrolü ve `git diff --check` başarılıdır. Bu doğrulama kaynak envanterini kapsar; bütün rollerin tarayıcıdan uçtan uca testi veya canlı veritabanı doğrulaması yapılmadı.

**Tema çalışması iş planına göre uygulanıyor.** Kullanıcıyla kararlaştırılan yön, sayfalara dağılmış sabit renkleri kullanım amaçlarına göre ortak tema değişkenlerine bağlamaktır. [Renk Ortaklaştırması İş Planı](RENK_ORTAKLASTIRMA_IS_PLANI.md), bileşenleri birleştirmeden ilerleyecek on uygulama adımını, küçük teslim yöntemini ve hedefli doğrulamayı tanımlar. Ortak altyapı ve önizlemenin ardından kontroller ile menü/kabuk renkleri bağlandı; aşağıda ilk üç uygulama adımının sonuçları kayıtlıdır. Diğer ekranların dönüşümü ve hesap tercihinin kalıcılığı bekliyor; güncel kapsam [tema altyapısı kaydındadır](TEMA_ALTYAPISI.md). Envanter çalışması sırasında uygulamanın renkleri değiştirilmedi; sonraki uygulama sonuçları site genelinde tema dönüşümünün tamamlandığı anlamına gelmez.

**17 Ekim 2026 — Güncel kullanıcı kararı: yalnız renk ve çift tema:** Bileşen ortaklaştırması yapılmayacak. Kullanıcı, sistemin karmaşıklığı nedeniyle bu yönü kapsamdan çıkardı; çalışma mevcut bileşen yapıları korunarak renk sistemi üzerinden devam edecek. Hazır tema altyapısı, renk envanteri ve kaynak eşlemeleri kullanılacak; sabit renkler kullanım amacı ve yerel kapsamına göre tema değişkenlerine bağlanacak. Önceki bileşen ortaklaştırma hazırlıkları tarihsel kaynak referansıdır. Güncel kapsam [tema altyapısı kaydındadır](TEMA_ALTYAPISI.md). İkinci temanın bütün ekranlara yayılması ve kalıcı kullanıcı tercihi henüz tamamlanmadı.

**17 Ekim 2026 — Renk ortaklaştırması 1. adım tamamlandı:** Sade Kontrollerin ilk altı yerel rengi için `app/tema.css` içinde iki temanın ortak karşılıkları hazırlandı. Mavi değerler kaynak CSS ile aynı; yeşil karşılıklar mevcut onaylı paletten çözülür. Önceki 91 tema bildirimi ve kontrol CSS kaynağı korundu. Hedef testler 5/5, TypeScript, ESLint ve PostCSS/Tailwind derlemesi başarılı. [Eşleme ve doğrulama sonucu](RENK_ORTAKLASTIRMA_ADIM1.md). Kontrollerin bu değişkenlere bağlanması 2. adımdadır; gerçek ekran/rol kontrolü, veritabanı işlemi veya canlı dağıtım bu adımda yapılmadı.

**17 Ekim 2026 — Renk ortaklaştırması 2. adım tamamlandı:** Sade Kontrollerin yerel renkleri, odak/ok/seçili metin ve gölge renkleri ortak kaynağa bağlandı; Radix Select'in yalnız iki focus renk sınıfı değişti. 221 CSS bildiriminin mavi karşılıkları ve renk dışı stilleri korundu; 57 aile dışı kullanım dosyasının 56'sı aynı, tek değişen Select kaynağıdır. Tema 6/6, davranış mavi 17/17 ve yeşil 17/17 olmak üzere 40 test başarılı; TypeScript, ESLint ve CSS derlemesi geçti. Bu bölümün renkleri ekran boyutuna göre değişmez; mevcut responsive kurallar korunmuştur. Gerçek masaüstünde iki tema, mobilde mavi görüntülendi; mobil yeşil, gerçek menü etkileşimi ve DOM ölçümü yapılmış sayılmaz. Önceki değerlendirmede ek tarayıcı kontrolleri gereksiz kapanış şartı yapılmıştı; kaynak ve gerekli test doğrulamasına göre 2. adım kapatıldı. Geçici layout/viewport değişiklikleri geri alındı; varsayılan mavi, veritabanı ve canlı yayın durumu korundu. [Ayrıntılı sonuç](RENK_ORTAKLASTIRMA_ADIM2.md).

**17 Ekim 2026 — Renk ortaklaştırması 3. adım tamamlandı:** PanelNavbar, SolListe, MobilDrawer ve panel layout'unda yalnız 72 renk ifadesi ortak kaynağa bağlandı. Önceki 113 tema bildirimi, mevcut mavi değerler, renk dışı kaynak, rol/rota/menü davranışı ve HBStore'un turuncu kimliği korundu. Başlık bileşeni ve CSS'sinde renk tanımı olmadığından değişiklik gerekmedi. Menü testi 31 rol girdisini iki temada kapsıyor; seçili 21 testten 20'si başarılı. Değişmemiş HBStore metnindeki apostrof için bir mevcut test uyuşmazlığı ve ESLint'teki 2 mevcut hata/1 uyarı ayrıca kaydedildi; yeni lint bulgusu yok. TypeScript ve gerçek CSS derlemesi başarılı. Gerçek tarayıcı etkileşimi, veritabanı işlemi veya canlı dağıtım yapılmadı. [Eşleme ve doğrulama sonucu](RENK_ORTAKLASTIRMA_ADIM3.md).

**17 Ekim 2026 — Renk ortaklaştırması 4. adım tamamlandı:** Yenile butonunun yüzey, çizgi, metin ve hover renkleri ortak kaynağa; `Button` hata varyantının beyaz metni mevcut `destructive-foreground` karşılığına bağlandı. `Input` ve `Label` zaten tema köprüsünden çalıştığı için kaynakları aynı kaldı. Önceki 157 tema bildirimi, 20 durum kuralı ve 56 statik bileşen çıktısı korundu; beş sınıfın mavi değer farkı ve renk dışı fark 0. Hedef testler 16/16, TypeScript ve değişen aileye yönelik ESLint başarılı. PostCSS/Tailwind çalıştırması başarılı; genel CSS'nin yeniden ayrıştırılmasında HTML renk kataloğundaki örnek metinden üretilen aynı mevcut hata önceki ve sonraki çıktıda görüldü. Bu ayrı bulgu çözülmüş veya genel CSS bütünüyle temiz sayılmadı. Gerçek tarayıcı kontrolü, veritabanı işlemi veya canlı dağıtım yapılmadı. [Eşlemeler, kontrol kapsamı ve mevcut CSS bulgusu](RENK_ORTAKLASTIRMA_ADIM4.md).

**17 Ekim 2026 — Renk ortaklaştırması 5. adım tamamlandı:** Ortak pill, Badge, tarih, araç türü, üretim/rol/çek sözlükleri, çek günleri ve teslimat rozetleri renk kaynağına bağlandı. İki nötr değişken tema karşılığı alır; 112 işlevsel değişken iki temada mevcut paletini korur. Üretici/İÜ ayrımı, beş hedef rol, dört araç, yedi çek ve yedi teslimat durumu değişmedi. Araç pili `e8`, beyaz kenar %60 ve hedef rol halkalarının `33`/`22` alpha değerleri ortak karşılıklarda korunur. Önceki 165 tema bildirimi ve 16 tarih CSS bildirimi aynı; renk dışı kaynak farkı 0. 31 rol × 20 üretim durumu iki temada sınandı; 45/45 hedef test ve TypeScript başarılı. Lint: hata 0, bir mevcut `exhaustive-deps` uyarısı, yeni bulgu 0. Önceki genel CSS katalog hatası aynı. SQL/alıcı kuyruk akışı yalnız kaynak üzerinden kontrol edildi; gerçek e-posta/push teslimatı veya canlı dağıtım yapılmadı. [Eşlemeler ve doğrulama sonucu](RENK_ORTAKLASTIRMA_ADIM5.md).

**17 Ekim 2026 — Bağlayıcı kullanıcı talimatı: görünüm, metrikler ve onay:** Renk çalışmasında mevcut metrik değerler, font ailesi/büyüklüğü/kalınlığı, her türlü nesnenin ölçüleri/konumları, pill yerleri/büyüklükleri, tablo yapıları ve davranışlar korunur. Mavi tema mevcut kullanım renklerini korur; yeşil karşılıklar onaylı palete göre ele alınır. İyileştirme veya eski standarda uyum gerekçesiyle renk çalışması dışında kendiliğinden değişiklik yapılamaz. Her adım sonunda yapılanların özeti ve doğrulama durumu sunulur; gerekli ekran kontrolü kullanıcıyla tamamlanır. Zorunlu fark, iki seçenek arasında karar veya bilinmeyen durum/nesne ile karşılaşıldığında ilgili işlem durdurulur, konu kullanıcıya sorulur ve açık onay gelmeden karara bağlı işe devam edilmez. Bu talimat, bu çalışma için önceki standart farklarının otomatik uygulanmasına izin veren yorumların önündedir.

**17 Ekim 2026 — Kullanım bağlamı ve doğrudan teslim düzeltmesi:** HOYK ve diğer benzer bileşenler sayfa, rol, amaç ve duruma göre farklı kullanımlara sahip olabilir. Her kullanımın mevcut ölçü, yerleşim, prop, varyant ve yerel stil kapsamı korunur; yalnız renk karşılıkları bu bağlamda ele alınır. Bileşenler birleştirilmez. Tek ekranın platformun bütün kullanımlarını temsil ettiği varsayılmaz. UTT Ürün Eğitimleri görüntüleri yalnız o kullanımın tarihsel referansıdır. Hazır envanter ve kaynak eşlemelerinden küçük renk değişikliği hazırlanır, yalnız etkilenen kullanımların gerekli kontrolleri yapılır ve sonuç hemen sunulur. Tarayıcı erişimi veya yeni geniş araştırma, bütün çalışma için genel başlangıç şartı yapılmaz. Belirsizlikte kullanıcı onayı bekleme koşulu geçerlidir.

---

## 🎯 GENEL SONUÇ VE KALİTE SİCİLİ

**21 Eylül 2026** tarihi itibarıyla BLUEBOOK; HapBilgi’nin iş modelini, kullanıcı rollerini, yetki sınırlarını, T-Club, C-Club, E-Club, Eczanem, Store, üretim, yönetim, raporlama, HapBi ve öğrenme araçları süreçlerini güncel uygulama yapısıyla birlikte tanımlar.

Platformun iş kuralları; rol ve firma kapsamı, veri bütünlüğü, erişim denetimi, öğrenme takibi ve üretim akışları esas alınarak kod, veritabanı ve kullanıcı arayüzü katmanlarında uygulanır. Video, Podcast, Dijital Broşür ve Flip PDF ortak öğrenme aracı yapısı içinde yönetilir.

Kod kalitesi; TypeScript tip denetimi, mimari kurallar, otomatik testler, SQL denetimleri ve kanonik dosya envanteriyle korunur. BLUEBOOK güncel ve bağlayıcı sistem kaydını, REDBOOK açık teknik borçları, hukuki takip belgeleri ise tamamlanması gereken veri ve mevzuat süreçlerini gösterir.

Bu kayıt, doğrulanmış mevcut durumu ifade eder; mutlak kusursuzluk veya tamamlanmışlık iddiası taşımaz.


**10 Eylül 2026 — medikal rol:** `med_md` ortak üretici KAÇ hattına bağlandı. İzinli türler yetenek kaynağından `medikal_egitim` ve `urun_medikal_egitim` olarak alınır. Sayımlar kendi talep ve yayınlarıyla sınırlıdır. Ürün-medikal eğitim türü seçilebilir; belirli ürün filtresi mevcut rapora yönlendirilir. NEDİR seçiminde eğitimle aynı 17 ortak/sade onaylı yanıt kullanılır; yeni cevap metni kopyalanmaz.

**10 Eylül 2026 — PM ailesi:** `pm`, `jr_pm`, `kd_pm` ortak üretici NEDİR/KAÇ hattına bağlandı. Eğitim ve medikal ile aynı 17 ortak/sade cevap kimliğini kullanır; metin kopyalanmaz. İzinli talep türü yetenek kaynağındaki `urun_egitimi`dir. On sayım yalnız kullanıcının kendi talep/yayınlarını kapsar; takım toplamı değildir. Ürün/teknik bazındaki ayrıntılar ve saha sonuçları ilgili mevcut raporlara yönlendirilir. Böylece 13 üretici rolünün tamamı ortak üretici hattına bağlanmıştır.

**10 Eylül 2026 — yayın adedi / araç türü ayrımı:** Ortak üretici hattında `yayinda` yayın adedidir. `yayinda_arac_turu` yayındaki farklı öğrenme aracı türlerini sayar; `yayin_arac_dagilimi` video/podcast/gorsel/flip_pdf başına yayın adedini verir. “Yayında kaç öğrenme aracım var?” tür sayısıdır; “Yayında kaç yayınım var?” yayın adedidir. 27 videodan oluşan yayındaki portföy sırasıyla 1 tür ve 27 yayındır. Dağılım mevcut kişisel yayın filtreleriyle, sayfalar arasında benzersiz yayın kimlikleri üzerinden hesaplanır; eksik/tanımsız araç türü sıfır kabul edilmez. Üç ölçüt mevcut durum içindir, geçmiş durum fotoğrafı üretmez.

**10 Eylül 2026 — yönetici başlangıcı:** Yedi `YONETICI_ROLLER` unvanı ortak 17 sade üretim/platform tanımı ve üç saha yönetimi tanımını katalogdan seçer. İşlem sayfası bağlantıları üretim raporuna yönlenir. `yoneticiYanit.ts` firma geneli sekiz ölçütü mevcut `get_yonetici_rapor_ana_ozet_v2` kaynağından okur: güncel takım/bölge/UTT/yayındaki yayın sayısı; zaman aralığında tamamlanan izleme ve kazanılan/kaybedilen/net saha puanı. Kimlik/firma oturumdan doğrulanır. Tarihler ortak hafta/ay/çeyrek/yıl sözleşmesidir; geçmiş anlık durum hesaplanmaz. Takip ve önceki eş dönem karşılaştırması vardır. Belirli kişi/takım/bölge/ürün/eğitim/araç filtresi, tür sayısı, dağılım ve kişisel C-Club soruları mevcut ilgili rapor veya lige yönlendirilir; firma toplamı yerine geçirilmez. Bu ilk adım tüm yönetici rapor ayrıntılarını sohbet içinde hesaplama iddiası taşımaz.

**10 Eylül 2026 — yönetici ayrıntıları (GM dahil):** `yoneticiDetay.ts` yedi yönetici rolünün firma içi ayrıntılarını aynı Gemini çağrısından çıkan doğrulanmış sorguyla hesaplar. Takım/bölge/UTT sonuçları sayfalı `get_yonetici_hiyerarsi_v2`, BM kişisel sonuçları mevcut C-Club okuyucusundan gelir. Üretim, üretici/eğitim türü/ürün gruplarında ortak üretici sayım okuyucusunu kullanır; yönetici filtresi firma eşitliğini doğrular ve tarihsel üretici kayıtlarını korur. Ürün filtresi taleplere uygulanır. Yayındaki tür sayısı tüm seçili üreticilerdeki türlerin birleşimidir; tür sayıları birbirine eklenmez. Dağılım dört türde yayın adetlerini verir. Aynı grupta adlarla kıyaslama, büyükten küçüğe sıralama (eşitlik aynı sıra), önceki eş takvim dönemi karşılaştırması desteklenir. Ayrıntı yanında rapor/lig bağlantısı sunulur. Üretim takım/bölge filtresi, saha ürün/eğitim/araç filtresi, çapraz grup kıyası ve geçmiş anlık durum bu sözleşmede yoktur; filtre atılarak toplam verilmez. Kullanıcı isteği doğrultusunda otomatik/ekran testleri çalıştırılmadı; ekran doğrulaması kullanıcıda.

**11 Eylül 2026 — Podcast Yapısı ve Opsiyonel Yayın Görseli:** Talep formundaki "Podcast Yapısı" kartından Monolog/Diyalog seçim butonları kaldırıldı; yeni taleplerde `ogrenme_araci_tercihleri` boş nesne (`{}`) olarak gönderilirken, geçmiş kayıtlardaki `ogrenme_araci_tercihleri.anlatim_turu` verisi geriye dönük uyumluluk amacıyla aynen korunur. Hazır podcast dosya alanında teknik dosya rolleri (`ses`, `kapak`, `transkript`) korunarak kullanıcıya gösterilen başlıklar güncellendi: "Nihai ses" başlığı "Podcast" oldu; "Kapak" başlığı "Yayın Görseli" olarak değiştirildi ve isteğe bağlı (opsiyonel) yapıldı. Üreticiler görsel yüklemeden de hazır podcast talebi oluşturabilir; transkript zorunluluğu ise aynen devam eder. İstemci yükleme hattı, yarım yükleme kurtarma, veritabanı doğrulama RPC'si (`uretim_podcast_dogrula`) ve yayınlama kapısı görsel yokluğunda akışı engellemez. Görsel yüklenmediğinde sahte bir URL oluşturulmaz; tüm inceleme, yayın yönetimi ve tüketici ekranlarında (`CcVideoOynatici`, `VideoOynatici`, `EclubVideoOynatici`, `EczanemVideoOynatici`, `OgrenmeAraciOnizleme`) ortak Apple Podcasts SVG ikonlu ve altında ürün adı yer alan `PodcastKapakGorseli` / `PodcastVarsayilanKapak` bileşeni kullanılır.

**11 Eylül 2026 — Podcast Yayın Görseli ve Ürün Adı İyileştirmeleri:**
1. *Yayın Yönetiminde İmzalı CDN URL Dönüşümü:* `yayin-yonetimi/api/bekleyenler` ve `yayin-yonetimi/api/yayinlar` rotalarında podcast kapak yolu depolama yolu yerine `bunnyCdnImzaliUrl` ile imzalı erişim adresine dönüştürülerek `thumbnail_url`'e aktarılır. Kapak yolu mevcutken adres üretilemezse 503 servis hatası verilir; kapak yolu null ise `thumbnail_url` null dönerek arayüzün varsayılan SVG kapağı render etmesi sağlanır. `v_yayin_detay` görünümünün `arac_kapak_yolu` alanı `YAYIN_LISTE_ALANLARI` envanterine dahil edilmiştir.
2. *Yarım Kalan Görselin Kurtarılması ve İptali:* `YarimYuklemeBildirimi` bileşeni kapak görselinin hiç seçilmemesi ile seçilip aktarımın yarıda kalması durumunu `kapak_yarim` (`metadata.kapak_bekleniyor`, `bekleyen_destek_yollari.kapak`, `kapak_yolu` ve `!kapak_iptal_edildi`) üzerinden ayırır. Ses ve transkript hazır olsa bile "Yayın Görseli (isteğe bağlı)" seçicisi açılır ve "Görselsiz Devam Et" butonu sunulur. "Görselsiz Devam Et" seçildiğinde yarım kalan storage nesnesi silinir (`bunnyStorageNesneSil`), `kapak_bekleniyor: false`, `kapak_iptal_edildi: true`, `kapak_yolu: null` yapılır; ses ve transkript hazırsa podcast onay sürecine devredilir. Gecikmeli gelen destek yükleme tamamlama istekleri 409 ile reddedilir.
3. *PM Ürün Adı Öncelik Sıralaması:* `api/ogrenme-araclari/[arac_id]/erisim` rotasında ürün adı `talepler(urun_adi, urunler(urun_adi))` ilişkisi üzerinden çözümlenir: `urunler.urun_adi` (trim) $\rightarrow$ `talepler.urun_adi` (trim) $\rightarrow$ `"Podcast"`. `PodcastOynatici.tsx` üst prop boş veya whitespace olduğunda bu çözümlenen adı kullanır; `PodcastKapakGorseli.tsx` simgenin altında bu adı gösterir ve erişilebilirlik etiketlerini günceller.
4. *Yayın Görseli Yükleme Yarış Koruması:* Her görsel yükleme denemesi benzersiz girişim kimliği ve nesne yoluyla açılır. Başlatma, tamamlama ve “Görselsiz Devam Et” kararları araç satırını kilitleyen atomik RPC'ler üzerinden yürür; iptal edilmiş veya eski girişimden geciken tamamlama isteği kapağı geri getiremez. Temizlenemeyen nesne yolları kalıcı depolama temizleme kuyruğuna yazılır.

**17 Eylül 2026 — Hazır video asenkron tamamlama düzeltmesi:** Ortak modele geçişte yükleme öncesi açılan doğrulanmamış video kabuğu, tamamlanmış video sayılmaz. Webhook ve mutabakat hazır video zincirini idempotent olarak tamamlar; `lib/video/hazirVideoTamamla.ts` zincir ve doğrulanmış süre yazımından sonra yalnız aynı üretici/talep/GUID yükleme oturumunu kapatır. Talep detayındaki işlenme durumu boş kabuğun varlığından değil video adresinden çözülür. Kurtarma ekranı doğrulama bekleyen aktarımı kesilmiş dosya olarak tanımlamaz; 202 yanıtında tamamlandı mesajı vermez ve oturumu kapatmaz. Tip kontrolü ve bu düzeltmeye yönelik 34 yerel test başarılıdır. Canlı 30064 numaralı talebin Bunny'de hazır olan videosu doğrulanmış; talep yeniden yükleme olmadan yayın yönetimi aşamasına geçirilmiştir. Bu işlem yayına alma işlemi değildir.

**21 Eylül 2026 — Ortak yayın kartı, merkezi mobil akış ve Tanbur:**
1. *Merkezi Mobil Yayın Akışı (`MobilYayinAkisi`):* Mobil yayın sunumunu dikey tek sütun (`grid-cols-1`) akışına kavuşturmak üzere geliştirilen `MobilYayinAkisi` bileşeni; UTT/KD_UTT (ana sayfa, kategori ve öneriler), Saha BM/TM (ana sayfa rafları), Yönetici (ana sayfa video bölümü ve yayındaki videolar), Üretici (sizin/tüm yayınlarınız), C-Club (`/challenge-club` gelen/giden listeleri), E-Club (firma video kataloğu), Eczanem (video rafları) ve Yayın Yönetimi (aktif yayınlar) yüzeylerine bağlanmıştır. Başlangıçta 2 kart, “Daha Fazla Göster” etkileşimiyle 5'er kart (`2 + 5`) artış kuralı `hesaplaMobilYayinGorunumu` saf hesaplama fonksiyonuyla kilitlenmiştir. Bileşene iletilen kapsayıcı `id`'si güvenli ve benzersiz ID'ye dönüştürülerek butonun `aria-labelledby` erişilebilirlik bağlantısı güvenceye alınmıştır.
2. *Ortak Yayın Kartı (`YayinKarti`):* Video, podcast, görsel ve flip PDF araçları tek bileşen omurgasında toplanmıştır. Mobil görünümde ürün adı `text-base leading-[22px] font-bold`, masaüstünde `sm:text-xs` (12px) tipografisiyle sunulur. Video puanı `video_puani != null` koşulunda mobilde `{video_puani} P`, tablet ve masaüstünde `{video_puani} Puan` olarak (önünde “+” bulunmaksızın) tüm rollerde şeffaf gösterilir; bu görsel şeffaflık izleyiciye puan hakkı kazandırmaz. Extra puan yalnız `extra_puan > 0` olduğunda `+{extra_puan} Extra` olarak gösterilir. Kart genişletme alanları `solUstRozet`, `sagUstEkRozet`, `puanYaniRozet`, `altEkIcerik` ve `hoverOverlay` prop'ları üzerinden yönetilir.
3. *Hayalet Tanbur (`HayaletTanburSecici`):* 13 üretici rolü, 7 yönetici rolü, UTT, KD_UTT, BM ve TM ana sayfalarında mobil dikey gezinmeyi hızlandıran kayan tanbur devreye alınmıştır (`iu` ve `admin` kapsam dışıdır). Tanbur'un render davranışları yüzeylere göre belirlenmiştir: Üretici ana sayfasında koşulsuz render edilir; Yönetici ana sayfasında `tanburBolumleri.length > 1` koşuluna bağlıdır; Saha BM ve TM ana sayfalarında mevcut `SahaVideoRaflari` içinde render edilir; UTT ve KD_UTT ana sayfasında ise aktif durum filtresi açık değilken render edilir.
4. *İstemci Performansı ve Önbellek:* UTT ana sayfa verileri kullanıcı kimliğine göre izole edilerek önbelleğe alınır (`utt_anasayfa_veri_${user.id}`) ve aynı cihazdaki hesaplar arasında veri karışması engellenir; organizasyon zinciri için 5 dakikalık bellek içi önbellek (`ORG_CACHE_TTL = 5 * 60 * 1000`) kurulmuştur.
5. *Önerilen Yayınlar Sekme Düzeni:* `/oneriler` (Bekleyen) ve `/oneriler/tamamlanan` (Tamamlanan) alt sekmeleri ayrılmış; `useListe` ve `IcerikFiltreBari` standardı getirilmiştir.

**9 Ekim 2026 — Kullanıcı kararı:** E-Club Ligi Excel indirme özelliği tüm rollerden kaldırıldı; indirme butonu ve dışa aktarma API uç noktası kaldırıldı.

**9 Ekim 2026 — Kullanıcı kararı:** E-Club kişi ana sayfası `/eclub/ana-sayfa`, firma alt sayfaları `/eclub/ana-sayfa/firma/[firma_id]` adresine taşındı. Giriş, navbar, sidebar ve öneri bildirim bağlantıları güncellendi. Eski sayfa adresleri sorgu parametreleri korunarak yeni adreslere yönlendirilir; tüketim API adresleri korunur.


**17 Ekim 2026 — Renk ortaklaştırması 6. adım tamamlandı:** HOYK, dört araç kapağı, Podcast/Görsel/Flip PDF/Video oynatıcı arayüzleri ve gerçek kart renk slotları ortak kaynağa bağlandı. Bileşen ortaklaştırması yapılmadı. 216 değişken/350 bildirim eklendi, önceki 281 bildirim korundu. 275 gerçek CSS ve 45 satır içi mavi karşılık aynı; 23 TSX kaynağında renk dışı fark 0. Gerçek görseller, süre anlamları ve 15 günlük hesap, video yükleme/GUID, izleme/puan akışları değişmedi. Yeni testler 6/6; toplam 64 testte 62 başarılı, adım öncesi kodla da aynı iki eski E-Club testi başarısız. TypeScript ve 26 dosyanın lint kontrolü başarılı. Önceki genel CSS katalog bulgusu aynı; gerçek rol oturumu, medya oynatımı veya canlı dağıtım yapılmadı. İlk altı plan kutusu işaretli; 7. adım başlamadı. [Sonuç ve kontrol sınırları](RENK_ORTAKLASTIRMA_ADIM6.md).


**17 Ekim 2026 — Renk ortaklaştırması 7. adım tamamlandı:** Kart/tablo çizgileri, AlertDialog/Tooltip, dört bildirim türü, lig akordiyonları, dokuz skeleton ailesi, ortak boş durum ve gönderim/yayın detay görünümleri ortak renk kaynağına bağlandı. Bileşen ortaklaştırması yapılmadı. 185 değişken/314 bildirim eklendi; önceki 631 bildirim korundu. 391 derlenmiş CSS ve 12 bildirim rengi mavi karşılığıyla aynı; iki CSS Module’de 693 bildirim korunur, 24 kaynakta renk dışı fark 0. Yeni testler 7/7; toplam 63 testte 62 başarılı, değişmeyen C-Club kaynağında bir mevcut başarısızlık var. TypeScript başarılı; önceki bir lint hatası/sekiz uyarı ve genel CSS katalog bulgusu aynı, yeni bulgu yok. Gerçek Radix portalının açıkken kök temayı alması, iptal/eylem/odak ve Tooltip Escape davranışı sınandı. Hediye test verilerine, alıcı/teslimat ve puan akışlarına işlem yapılmadı; gerçek rol oturumu veya canlı dağıtım yok. İlk yedi kutu işaretli; 8. adım başlamadı. [Sonuç ve kontrol sınırları](RENK_ORTAKLASTIRMA_ADIM7.md).


**17 Ekim 2026 — Renk ortaklaştırması 8. adım tamamlandı:** Grafik/SVG/Canvas renkleri ortak CSS kaynağına bağlandı. Mevcut ECharts açıkken tema değişimini aynı örnek üzerinde izler; HOYK çerçevesi gün/animasyon konumunu korur. CSS’den üretilen 99 çizim rengi sunucu/DOM dışı hesaplarda kullanılır; elle ikinci palet yoktur. SVG seçim oku da CSS'den beslenir. 100 değişken/152 bildirim eklendi; önceki 945 bildirim korundu. Araç, kazanım/kayıp, süre ve madalya anlamları aynı; bileşen ortaklaştırması yapılmadı. 94 mavi eşleme, 48 grafik seçeneği ve 1.128 HOYK renk örneği aynı. 47/47 test, TypeScript ve hedef lint başarılı. Önceki genel CSS katalog bulgusu aynı; gerçek tarayıcı/rol oturumu veya canlı dağıtım yok. İlk sekiz plan kutusu işaretli; 9. adım başlamadı. [Sonuç ve kontrol sınırları](RENK_ORTAKLASTIRMA_ADIM8.md).

---

<!-- COGNITI_EPOSTA_SABLON_STOGU:BEGIN -->

# EK — Cogniti e-posta şablon stoğu

Tarih: 18 Ekim 2026.

## Durum ve kapsam

Kullanıcı, gönderici/domain kurulumunu gerçek e-posta ile kayıt testleri aşamasına bıraktı; e-posta formatlarının bu aşamada hazırlanıp stokta tutulmasını istedi.

Kullanıcı **“Tüm sistem bildirimlerini kapsa”** seçimini onayladı. Stok; mevcut e-postaları, uygulama/push bildirimlerini ve ilgili süreçlerin kodda tanımlı durumları için e-posta metin taslaklarını kapsar. Mevcut uygulama/push bildirimleri bu belgeyle e-postaya dönüştürülmez.

**Metinler taslaktır; kullanıcı onayı, HTML görsel tasarımı, uygulamaya entegrasyon ve gerçek teslimat testi henüz yapılmadı.** Belgede kullanılan `{{...}}` alanları içerik yer tutucularıdır; mevcut uygulamanın veya Supabase'in çalıştırılabilir şablon sözdizimi değildir.

E01–E04 ilk stoktur. E05–E35 aşağıda genişletilmiş stok olarak yer alır. Alıcı bilgisi mevcut bildirimde doğrulanmışsa aktarılmıştır. Yalnız durum kaydı bulunan olaylarda e-posta alıcısı/gönderim zamanı kararı açık bırakılmıştır; taslak metin bu kararı vermiş sayılmaz.

**Kullanıcı kararı:** Çek sağlayıcısı değişebilir. Şablonlarda sabit bir mağaza/sağlayıcı adı yerine **“Hediye çeki”** ifadesi kullanılacak. Bu kayıt metin taslaklarını geneller; mevcut gönderim kodu veya sağlayıcı entegrasyonunun değiştirildiği anlamına gelmez.

## Şablon listesi

| Kod | Gönderim durumu | Alıcı | Mevcut mekanizma | Stok durumu |
| --- | --- | --- | --- | --- |
| E01 | E-Club üyelik daveti / davetin yeniden gönderilmesi | Davet edilen hesabın e-posta adresi | Resend; aynı davet şablonu | Metin taslağı hazır |
| E02 | Kullanıcının şifre sıfırlama isteği | İstekte belirtilen kayıtlı hesabın e-posta adresi | Supabase Auth | Metin taslağı hazır; paneldeki şablon henüz görülmedi |
| E03 | Hediye çeki kodunun teslimi | İlgili eczanenin tek aktif ana eczacısı | Resend; mevcut çek teslimat kuyruğu | Metin taslağı hazır |
| E04 | Depo/şube ekleme veya düzeltme talebi | Formda yapılandırılmış iletişim adresi | Kullanıcının e-posta uygulamasında açılan `mailto`; otomatik sistem e-postası değil | Talep formatı hazır |

## Ortak içerik düzeni

1. Cogniti logosu ve marka adı.
2. Gönderim durumunu açıkça söyleyen konu ve başlık.
3. Varsa alıcıya adıyla hitap.
4. Kısa açıklama ve yalnız o işleme ait bilgiler.
5. Gerekiyorsa tek ana işlem bağlantısı; altta aynı bağlantının düz metni.
6. İşleme özel gerekli bilgi: örneğin yalnız davet için doğrulanmış 24 saat geçerlilik.
7. “Cogniti · bilgi taşır” marka imzası.

Gönderici adresi, yanıt adresi ve destek e-posta adresi henüz seçilmedi. Çalıştığı doğrulanmamış adres veya bağlantı taslağa gerçekmiş gibi yazılmayacak. E04'te kullanıcı kendi e-posta hesabından talep gönderir; bu formatta otomatik sistem bildirimi ifadesi kullanılmayacak.

## E01 — E-Club üyelik daveti

**Konu:** Cogniti E-Club üyelik davetiniz

**Metin:**

> Merhaba {{ad}},
>
> Cogniti E-Club üyeliğinizi tamamlamak için şifrenizi oluşturun.
>
> **Şifre oluştur:** {{davet_baglantisi}}
>
> Bu bağlantı 24 saat geçerlidir ve tek kullanımlıktır. Süresi dolarsa temsilcinizden yeni bir davet isteyebilirsiniz.
>
> Cogniti · bilgi taşır

**Mevcut veriler:** ad; sunucunun oluşturduğu `/sifre-olustur?token=…` bağlantısı. İlk davet ve yeniden gönderim için aynı metin yeterlidir. Yeniden gönderim mevcut kurala göre önceki bağlantıyı geçersiz kılar. Taslak, gerçek token içermez.

**Kaynak:** `lib/eclub/uyelikDaveti.ts`, `docs/ECLUB_UYELIK_DAVETI.md`.

## E02 — Şifre sıfırlama

**Konu:** Cogniti şifre sıfırlama bağlantınız

**Metin:**

> Cogniti hesabınız için şifre sıfırlama isteği aldık.
>
> **Yeni şifre belirle:** {{sifre_sifirlama_baglantisi}}
>
> Bu isteği siz yapmadıysanız bu e-postayı dikkate almayabilirsiniz.
>
> Cogniti · bilgi taşır

**Mevcut veriler:** Supabase Auth tarafından üretilen işlem bağlantısı; uygulama dönüş yolu `/sifre-yenile`. Bağlantı süresi Supabase ayarından henüz doğrulanmadığı için taslağa bir süre yazılmadı. Kullanıcı adının sağlayıcı şablonunda bulunacağı varsayılmadı.

**Kaynak:** `app/login/page.tsx` içindeki `resetPasswordForEmail` çağrısı. Göndericinin gerçek şablonu Supabase panelinde kontrol edilecek.

## E03 — Hediye çeki hazır

**Konu:** Hediye çekiniz hazır

**Metin:**

> Merhaba {{alici_adi}},
>
> {{cek_tutari_tl}} TL değerindeki hediye çekiniz hazır.
>
> **Çek kodunuz:** {{cek_kodu}}
>
> Kodu Cogniti içindeki Çeklerim alanından da görebilirsiniz.
>
> Cogniti · bilgi taşır

**Mevcut veriler:** alıcı adı, çek tutarı ve çek kodu. Doğrulanmamış son kullanım tarihi veya kullanım koşulu eklenmedi. Taslak, gerçek çek kodu içermez.

**Alıcı kuralı:** E-posta eczacıya; çek bilgisi ayrıca ilgili eczanedeki E-Club üyelerinin hesaplarına uygulama/push bildirimi olarak gider. Şablon çalışması bu dağılımı değiştirmez.

**Kaynak doğrulaması:** `scripts/sql/eclub_cek_teslimat_outbox.sql` tek aktif ana eczacının e-posta işini ve aynı eczanedeki aktif/Auth bağlı kişilerin push işlerini oluşturur. `lib/eclub/store/cekEpostaKuyrukIsleyici.ts` kuyruktaki e-posta adresine gönderir. Bu kaynak incelemesi canlı veritabanının güncel fonksiyonunu veya gerçek e-posta/push teslimatını doğrulamaz.

## E04 — Depo/şube talebi

**Konu:** Cogniti Depo Düzeltme/Ekleme Talebi

**Ekleme talebi:**

```text
Depo/Şube ekleme talebi
Depo adı: {{depo_adi}}
Şube adı (varsa): {{sube_adi}}
İl / İlçe: {{il}} / {{ilce}}
Adres: {{adres}}

Talebim:
{{talep_metni}}
```

**Düzeltme talebi:**

```text
Düzeltme talebi
Depo: {{depo_adi}}
Şube: {{sube_adi}}
İl / İlçe: {{il}} / {{ilce}}
Adres: {{adres}}
Kayıt: {{depo_sube_id}}

Talebim:
{{talep_metni}}
```

**Kaynak:** `lib/eclub/depo.ts` içindeki `depoTalepMailto`; `components/eclub/DepoTercihFormu.tsx`. Mevcut form kullanıcıya e-posta taslağını açar veya metni kopyalatır; sunucudan otomatik e-posta göndermez.

## Tüm sistem bildirimleri: kaynak eşlemesi

`lib/push/tipler.ts` dokuz olay ailesi tanımlar. Aşağıdaki eşleme dokuzunun tamamını kapsar; mevcut kaynakta ayrıca bulunan cron bildirimleri ve durum varyantları da stokta yer alır.

| Olay ailesi | İçerik / alıcı ayrımı | Stoktaki karşılığı |
| --- | --- | --- |
| `uretim_durum_gecisi` | İçerik üreticisi, üretici rol ailesi ve diğer iç alıcılar | E05–E11 |
| `video_yayini` | Hedef kullanıcıya yeni yayın; üreticiye işlenme sonucu ayrı metinlerdir | E12–E14 |
| `video_onerisi` | İç kullanıcıya öğrenme içeriği önerisi | E15 |
| `eclub_oneri` | E-Club kişisine gerçekleşen yayın önerisi | E16 |
| `challenge` | Challenge alıcısı, gönderen ve süre kaybı | E17–E19 |
| `eczanem_gonderim` | Eczanem müşterisine yeni içerik | E20 |
| `eczanem_siparis` | Eczane kadrosuna onay isteği; müşteriye işlem sonucu | E21–E24 |
| `store_siparis` | Mağaza siparişi durumu | E25–E29 |
| `eclub_cek_teslim` | Eczacıya çek e-postası; eczane kadrosuna uygulama/push | E03; süreç öncesi durumlar E30–E35 |

**Mevcut kanal ayrımı:** Bir olayın push tipinde bulunması, her yerde çağrıldığı veya e-postasının bulunduğu anlamına gelmez. Özellikle `store_siparis` için içerik üretici tanımı var; incelenen sipariş oluşturma/iptal/teslim ve admin güncelleme yollarında push çağrısı görülmedi. Üretimde görev tamamlanması/iptali yeni bildirim açmak yerine eski bildirimi kapatabiliyor. Bunların taslakları aşağıda bu fark korunarak yer alır.

**Bağlantı kuralı:** Yeni taslakların `{{islem_baglantisi}}` alanı, entegrasyon sırasında kullanıcının yetkili olduğu mevcut sayfaya çözülecek. Bir rolün erişmediği sayfa veya yeni bir URL taslak üzerinden kararlaştırılmadı.

## E05–E11 — Üretim hattı

Ortak gövde: varsa `Merhaba {{ad}},` hitabı, aşağıdaki duruma özel metin, **“İşlemi görüntüle: {{islem_baglantisi}}”** ve `Cogniti · bilgi taşır` imzası.

| Kod | Olay / mevcut alıcı | Konu | Duruma özel metin |
| --- | --- | --- | --- |
| E05 | Yeni görev ataması → atanan içerik üreticisi | Cogniti — Yeni üretim göreviniz | {{icerik_adi}} için {{asama_adi}} görevi size atandı. Görev ayrıntılarını Cogniti üzerinden inceleyebilirsiniz. |
| E06 | Görev devri → yeni atanan içerik üreticisi | Cogniti — Bir üretim görevi size devredildi | {{icerik_adi}} için {{asama_adi}} görevi size devredildi. Güncel görev bilgilerine Cogniti üzerinden ulaşabilirsiniz. |
| E07 | İnceleme bekliyor → talebin sahibi üretici | Cogniti — İçeriğiniz incelemenizi bekliyor | {{icerik_adi}} için hazırlanan {{asama_adi}} incelemenizi bekliyor. İçeriği ve ilgili notları Cogniti üzerinden görüntüleyebilirsiniz. |
| E08 | Revizyon bekliyor → atanan içerik üreticisi | Cogniti — Revizyon talebi var | {{icerik_adi}} için {{asama_adi}} revizyonu istendi. Revizyon notlarını Cogniti üzerinden inceleyebilirsiniz. |
| E09 | Görev tamamlandı → e-posta alıcısı kararı açık | Cogniti — Üretim aşaması tamamlandı | {{icerik_adi}} için {{asama_adi}} aşaması tamamlandı. Sürecin güncel durumunu Cogniti üzerinden görüntüleyebilirsiniz. |
| E10 | Görev iptali → e-posta alıcısı kararı açık | Cogniti — Üretim görevi iptal edildi | {{icerik_adi}} için {{asama_adi}} görevi iptal edildi. İşlem ayrıntılarını Cogniti üzerinden görüntüleyebilirsiniz. |
| E11 | Diğer iç alıcıya genel üretim gelişmesi → mevcut olay alıcısı | Cogniti — Üretim sürecinde güncelleme | Sizi ilgilendiren bir üretim işleminin durumu güncellendi. Ayrıntıları Cogniti üzerinden görüntüleyebilirsiniz. |

**Durum ayrımı:** E05–E08 için kaynakta görev bildirimi yazımı bulunuyor. E09–E10 görev durumuna dayalı stoktur; incelenen tetikleyici bu geçişlerde yeni bildirim üretmek yerine okunmamış bildirimi kapatır. E11 push içeriğinin genel rol karşılığıdır; yeni alıcı listesi önermez.

**Araç ayrımı:** `{{asama_adi}}` mevcut görev/öğrenme aracı etiketinden gelir; her içeriğe video denmez. Bu metinler video, podcast, görsel veya PDF yükleme/işleme mekanizmalarını ortaklaştırmaz; mevcut görev yapısı değiştirilmez.

**Kaynaklar:** `scripts/sql/uretim_bildirim_guvenlik.sql`, `lib/uretim/gorevTipleri.ts`, `lib/push/icerik.ts`; üretim teslim/karar/hazır video ve admin görev devri API'leri.

## E12–E16 — Yayınlar ve öğrenme önerileri

Ortak gövde: varsa adla hitap, duruma özel metin, aşağıdaki işlem bağlantısı ve Cogniti imzası.

| Kod | Olay / mevcut alıcı | Konu | Duruma özel metin | Ana işlem |
| --- | --- | --- | --- | --- |
| E12 | Yeni yayın → yayının hedef kullanıcıları | Cogniti — Yeni öğrenme içeriği yayında | Size sunulan yeni bir öğrenme içeriği yayında. İçeriğe Cogniti üzerinden ulaşabilirsiniz. | Yayını görüntüle |
| E13 | Video işlenmesi sonrası yayın başarı sonucu → yayını oluşturan üretici | Cogniti — Yayınınız hazır | Yayınınızın video işleme süreci başarıyla tamamlandı. Güncel yayın durumunu Cogniti üzerinden görüntüleyebilirsiniz. | Yayını görüntüle |
| E14 | Video işlenmesi sonrası yayın hata sonucu → yayını oluşturan üretici | Cogniti — Yayınınız için işlem gerekiyor | Yayınınızın video işleme süreci tamamlanamadı. İşlem ayrıntılarını ve güncel yayın durumunu Cogniti üzerinden inceleyebilirsiniz. | Yayın durumunu incele |
| E15 | T-Club öğrenme önerisi → önerinin hedef iç kullanıcısı | Cogniti — Size bir öğrenme içeriği önerildi | Size yeni bir öğrenme içeriği önerildi. Öneriyi Cogniti üzerinden görüntüleyebilirsiniz. | Öneriyi görüntüle |
| E16 | E-Club öğrenme önerisi → önerinin hedef E-Club kişisi | Cogniti E-Club — Yeni öğrenme öneriniz | Eczanenize yeni bir öğrenme içeriği önerildi. Öneriyi Cogniti üzerinden görüntüleyebilirsiniz. | Öneriyi görüntüle |

Her ana işlem `{{islem_baglantisi}}` yer tutucusunu kullanır. E12 için anlık yayın ve planlı yayının gerçekten açılması aynı içerik taslağını kullanır; plan kaydı oluşturulunca “yayında” metni gönderilmez. E16 anlık gönderim ve planın gerçekleşmesi içindir; planlanan gönderim kaydedildiğinde öneri gerçekleşmiş kabul edilmez.

E13–E14'ün mevcut uygulama içi mesajları birbirinden ayrıdır. Aynı `video_yayini` push ailesini kullanmaları e-posta taslaklarını birleştirme gerekçesi değildir; üretici rolünün push filtresinden geçeceği varsayılmaz. E13 yalnız hazır/başarılı kaynak sonucunda, E14 yalnız hata sonucunda kullanılabilecek stoktur. Diğer öğrenme araçlarına video transkod durumu atanmaz.

**Kaynaklar:** `lib/video/yayinVideoBildirim.ts`, `app/(panel)/yayin-yonetimi/api/yayinlar/route.ts`, `scripts/sql/yayin_aktivasyon.sql`, `app/(panel)/oneriler/api/route.ts`, `app/(panel)/eclub/oneriler/api/route.ts`, `lib/eclub/gonderimPlanKuyrugu.ts`.

## E17–E19 — Challenge Club

Ortak gövde: varsa adla hitap, aşağıdaki metin, **“Challenge ayrıntıları: {{islem_baglantisi}}”** ve Cogniti imzası.

| Kod | Olay / mevcut alıcı | Konu | Duruma özel metin |
| --- | --- | --- | --- |
| E17 | Yeni challenge → alan BM | Cogniti Challenge Club — Yeni challenge | Size yeni bir challenge gönderildi. İçeriği ve geçerlilik bilgilerini Cogniti üzerinden görüntüleyebilirsiniz. |
| E18 | Tamamlama/referral sonucu → gönderen BM | Cogniti Challenge Club — Challenge sonucunuz | Gönderdiğiniz challenge için bir tamamlama sonucu oluştu. Kazanılan referral puanı: {{referral_puani}}. Ayrıntıları Cogniti üzerinden görüntüleyebilirsiniz. |
| E19 | Süresinde izlenmeme ve kayıp kaydı → alan BM | Cogniti Challenge Club — Süre sonucu | Bir challenge için geçerlilik süresi sona erdi ve puan kaybı kaydedildi. Kayıp puan: {{kaybedilen_puan}}. İşlem ayrıntılarını Cogniti üzerinden görüntüleyebilirsiniz. |

Puanlar mevcut gerçekleşmiş sonuçtan alınır; taslağa sabit kazanç/kayıp veya yeni süre yazılmaz. E19, yalnız süre doldu varsayımıyla değil mevcut kayıp işlemi sonucu için stoktur. Cron tarafındaki uygulama bildirimi ayrıca doğrulanmıştır; gerçek e-posta gönderimi eklenmedi.

**Kaynaklar:** `lib/cclub/kayit.ts`, `lib/cclub/bildirimMesajlari.ts`, `app/(panel)/challenge-club/izle/api/cevap/route.ts`, `scripts/sql/challenge_kaybi_tara.sql`.

## E20–E24 — Eczanem

Ortak gövde: varsa adla hitap, aşağıdaki kısa metin, **“Cogniti'de görüntüle: {{islem_baglantisi}}”** ve Cogniti imzası. Müşteri/ürün ayrıntıları veya sağlık bilgileri e-posta taslağına taşınmaz.

| Kod | Olay / alıcı | Konu | Duruma özel metin | Kaynak durumu |
| --- | --- | --- | --- | --- |
| E20 | Yeni içerik → gönderimin hedef Eczanem müşterisi | Cogniti Eczanem — Yeni içeriğiniz var | Eczanenizden size yeni bir öğrenme içeriği gönderildi. İçeriğe Cogniti üzerinden ulaşabilirsiniz. | Mevcut push olayı |
| E21 | İndirim işlemi onay bekliyor → ilgili eczanenin mevcut aktif kişi hedeflemesi | Cogniti Eczanem — Onayınızı bekleyen işlem | Eczanem'de onayınızı bekleyen yeni bir işlem var. Ayrıntıları Cogniti üzerinden inceleyebilirsiniz. | Mevcut push olayı |
| E22 | İndirim işlemi onaylandı → işlemin sahibi müşteri | Cogniti Eczanem — İşleminiz onaylandı | Eczanem işleminiz onaylandı. Sonucu Cogniti üzerinden görüntüleyebilirsiniz. | Başarılı onay sonrası mevcut push |
| E23 | Eczane tarafından reddedilen işlem → e-posta alıcısı kararı açık; müşteri için metin stoğu | Cogniti Eczanem — İşleminiz onaylanmadı | Eczanem işleminiz onaylanmadı. Güncel durumu Cogniti üzerinden görüntüleyebilirsiniz. | Mevcut durum/işlem; incelenen yolda ayrı ret bildirimi yok |
| E24 | Müşterinin vazgeçtiği işlem → e-posta alıcısı kararı açık; işlem sahibi için metin stoğu | Cogniti Eczanem — İşleminiz iptal edildi | Vazgeçtiğiniz Eczanem işlemi iptal edildi. Güncel durumu Cogniti üzerinden görüntüleyebilirsiniz. | Mevcut durum/işlem; incelenen yolda ayrı vazgeçme bildirimi yok |

E23–E24 kaynakta aynı `dustu` durumunu kullanabilir. Metin seçimi yalnız bu durum adına bakılarak yapılamaz; işlemi kimin hangi aksiyonla sonuçlandırdığı bilinmelidir. Bu bilgi bulunmadan ret/vazgeçme nedeni varsayılmaz.

**Kaynaklar:** `lib/eczanem/gonderim.ts`, `lib/eczanem/kasa.ts`, `lib/push/icerik.ts`, `lib/push/orkestrasyon.ts`.

## E25–E29 — Mağaza siparişleri

Ortak gövde: varsa adla hitap, aşağıdaki metin, **“Siparişi görüntüle: {{islem_baglantisi}}”** ve Cogniti imzası. Sipariş numarası mevcut veriden doldurulur; adres veya gereksiz kişisel bilgi eklenmez.

| Kod | Durum | Konu | Duruma özel metin |
| --- | --- | --- | --- |
| E25 | `beklemede` | FirmaStore — Siparişiniz alındı | {{siparis_no}} numaralı siparişiniz alındı ve beklemede. Güncel durumu Cogniti üzerinden görüntüleyebilirsiniz. |
| E26 | `kargoda` | FirmaStore — Siparişiniz kargoda | {{siparis_no}} numaralı siparişiniz kargoda. Kayıtlı gönderim bilgilerini Cogniti üzerinden görüntüleyebilirsiniz. |
| E27 | `teslim_edildi` | FirmaStore — Siparişiniz teslim edildi | {{siparis_no}} numaralı siparişiniz teslim edildi olarak kaydedildi. Ayrıntıları Cogniti üzerinden görüntüleyebilirsiniz. |
| E28 | `iptal` | FirmaStore — Siparişiniz iptal edildi | {{siparis_no}} numaralı siparişiniz iptal edildi. İşlem ayrıntılarını Cogniti üzerinden görüntüleyebilirsiniz. |
| E29 | Genel sipariş gelişmesi | FirmaStore — Siparişiniz güncellendi | Siparişinizde bir gelişme var. Güncel durumu Cogniti üzerinden görüntüleyebilirsiniz. |

**Alıcı ve kanal:** E25–E28 mevcut FirmaStore sipariş durumlarına dayalı stoktur; yeni e-posta hedeflemesi onaylanmadı. Sipariş sahibi için içerik hazırlanmıştır. E29 mevcut `store_siparis` push içerik tanımına karşılık gelir; rolüne göre iç kullanıcı veya E-Club Store yüzeyine bağlanır. Bu tanımın bulunması, aktif bir sipariş push tetikleyicisi olduğu anlamına gelmez. FirmaStore'un dört fiziksel sipariş durumu E-Club hediye çeki süreçlerine taşınmaz.

**Kaynaklar:** `lib/tclub/store/tipler.ts`, `lib/tclub/store/sabitler.ts`, `lib/tclub/store/siparis.ts`, `app/admin/store/api/siparis/route.ts`, `lib/push/icerik.ts`.

## E30–E35 — E-Club çek talebinin işlem durumları

Mevcut durumlar `lib/eclub/store/eclubStoreTipler.ts` içinden alınmıştır. Bunlar **durum bazlı e-posta stoğudur**; her aşamada bir e-posta/push gönderildiği doğrulanmış değildir. Yeni e-posta alıcıları ve gönderim zamanı onay bekler. Aşağıdaki rol adları mevcut işlem sırasını anlatır; e-posta alıcısı olarak etkinleştirilmez.

Ortak gövde: varsa adla hitap, aşağıdaki metin, **“Talebi görüntüle: {{islem_baglantisi}}”** ve Cogniti imzası.

| Kod | Durum / süreçteki taraf | Konu | Duruma özel metin |
| --- | --- | --- | --- |
| E30 | `beklemede` / UTT aşaması | Cogniti E-Club — Çek talebi alındı | Bir hediye çeki talebi kaydedildi ve UTT aşamasında bekliyor. Talep ayrıntılarını Cogniti üzerinden görüntüleyebilirsiniz. |
| E31 | `bm_onayinda` / BM aşaması | Cogniti E-Club — Çek talebi BM onayında | Bir hediye çeki talebi BM onayına iletildi. Talep ayrıntılarını Cogniti üzerinden görüntüleyebilirsiniz. |
| E32 | `tm_onayinda` / TM aşaması | Cogniti E-Club — Çek talebi TM onayında | Bir hediye çeki talebi TM onayına iletildi. Talep ayrıntılarını Cogniti üzerinden görüntüleyebilirsiniz. |
| E33 | `onaylandi` / onay sonucu | Cogniti E-Club — Çek talebi onaylandı | Bir hediye çeki talebi onaylandı. Onay ve sonraki işlem bilgilerini Cogniti üzerinden görüntüleyebilirsiniz. |
| E34 | `teslimat_bekliyor` / teslimat süreci | Cogniti E-Club — Çek teslimatı bekleniyor | Onaylanan hediye çeki talebi için teslimat süreci henüz tamamlanmadı. Güncel teslimat durumunu Cogniti üzerinden görüntüleyebilirsiniz. |
| E35 | `iptal` / iptal sonucu | Cogniti E-Club — Çek talebi iptal edildi | Bir hediye çeki talebi iptal edildi. İşlem ayrıntılarını Cogniti üzerinden görüntüleyebilirsiniz. |

`cek_kodlari_gonderildi` için yeni bir şablon kopyası oluşturulmadı; mevcut E03 çek teslimi metni kullanılır. Talebin onaylanması veya kodun kaydedilmesi, e-postanın gerçekten teslim edildiği anlamına gelmez. E34 teslimat bekleme durumunu, E03 hazır çek kodunun eczacıya iletilmesini anlatır; bu iki durum birbirine karıştırılmaz.

**Korunan iş kuralı:** Çek e-postası eczacıya; uygulama/push bildirimi ilgili eczanenin E-Club üyelerine gider. E30–E35 kapsam onayı bu dağılımı değiştirmez. Her aşamayı tüm eczane kadrosuna e-postalamak gibi bir karar verilmedi.

**Kaynaklar:** `lib/eclub/store/eclubStoreTipler.ts`, `scripts/sql/eclub_cek_teslimat_outbox.sql`, `scripts/sql/eclub_cek_uygulama_bildirimleri.sql`, `lib/eclub/store/cekEpostaKuyrukIsleyici.ts`, `lib/eclub/store/cekPushKuyrukIsleyici.ts`.

## Entegrasyon öncesinde açık kalan kararlar

- Taslak metinlerin ve ortak görsel tasarımın kullanıcı onayı.
- Mevcut e-posta dışındaki her olay için e-postanın gerçekten gönderilip gönderilmeyeceği ve hangi alıcılara gideceği. Kapsam onayı yalnız taslak hazırlığı içindir.
- Genel olay mı, durum ayrıntısı mı gönderileceği: E11/E29 ile ayrıntılı varyantlar aynı olayda mükerrer gönderim üretmemeli.
- E-posta adresi bulunmayan kişi veya müşterilere yeni adres toplama işlemi eklenmedi; olası entegrasyonda bu durum ayrıca kararlaştırılacak.
- Yalnız ekranda görülen başarı/hata mesajları, rozet sayımları ve teknik kuyruk hataları yeni bir kullanıcı e-postası kabul edilmedi. Stok bir sistem hatası alarm altyapısı kurmaz.

## Teknik kurulum ve gerçek test: ertelendi

- Resend domain doğrulaması, gönderici adı/adresi, hosting ayarları ve davet kök adresi gerçek kayıt testlerinde ele alınacak.
- Supabase Auth SMTP, gönderici, şifre sıfırlama şablonu ve dönüş adresleri aynı aşamada doğrulanacak.
- 18.10.2026 yerel kontrolde `RESEND_API_KEY`, `ECLUB_DAVET_EMAIL_FROM`, `ECLUB_CEK_EMAIL_FROM`, `HAPBILGI_SITE_URL` tanımlı değildi. Hosting tarafındaki değerler görülmedi.
- Gerçek davet → e-posta → şifre oluşturma → giriş ve şifre sıfırlama akışları henüz teslimat testiyle doğrulanmadı. Taslak hazırlığı bu testleri tamamlanmış saydırmaz.
- Gönderim hatası, yeniden deneme veya başarılı teslimat gibi teknik durumlar için kendiliğinden yeni kullanıcı e-postası üretilmeyecek. Yeni bir bildirim gerekiyorsa olay, alıcı ve kanal ayrıca onaylanacak.

<!-- COGNITI_EPOSTA_SABLON_STOGU:END -->

### Üretici Ana Sayfa temizliği — 21 Ekim 2026

Kullanıcı onayıyla 13 üretici rolünün Ana Sayfa pill'i ve mobil bilgi satırı kaldırıldı. Üretici başlangıcı ve Cogniti logosunun hedefi `/yayin-yonetimi`; eski `/ana-sayfa` ziyaretleri rol bazlı aynı hedefe gider. Üreticiye ait özet/liste bileşeni, veri hazırlayıcısı, Ana Sayfa API dalı, özel rehber/tur/tercih kodları, tek kullanımlık yardımcı ve tema tanımları kaldırıldı. Ortak API üreticide 403 döner; diğer rol dalları korunur. Üretim durum push bağlantısı `/yayin-takip` olur. Ortak panelin başlangıç hedefi `lib/panel/baslangic.ts` içinde çözülür. Üretici rapor/lig bağlantıları ve yetki/modül dönüşleri buna uyar. Ortak üretim zinciri, Talepler, rapor SQL'leri, genel rehber motoru ve diğer kimliklerin Ana Sayfa'ları korunur. DB migration veya veri silme gerekmez. Doğrulama sonuçları `docs/URETICI_ANA_SAYFA_TEMIZLIGI_2026_10_21.md` içinde kaydedilir.


### 26 Ekim 2026 — Viva davet kapsamı

Kullanıcının onayladığı davet matrisi: UTT/KD_UTT firma içinden yalnız kendi bölgesindeki UTT/KD_UTT ve BM'yi davet eder. BM, TM, PM ailesi, Medikal, Eğitim, İK ve yönetici rolleri kendi firmasındaki tüm çalışanları davet edebilir; firma içi davette bu rollere takım/bölge filtresi uygulanmaz.

E-Club daveti ayrı kurala bağlıdır: UTT/KD_UTT kendi portföyü; BM kendi bölgesi; TM ve PM/JR_PM/KD_PM kendi takımı; Medikal, Eğitim ve yönetici rolleri firma kapsamındaki aktif eczane–kişi ilişkileri. İK'nın E-Club daveti yoktur. Admin/İÜ'nün mevcut kapsamı, E-Club üyesinin yalnız davetli olması ve özel misafir akışı korunur. Firma/modül/aktiflik kontrolleri devam eder.

Davetliler alanındaki iki aramalı çoklu seçim listesi **Firmanız** ve **E-Club Üyeleri** adlarını kullanır. Seçimler birbirini silmez; tek kayıtta birlikte gönderilir. E-Club listesinin görünürlüğü kişi sayısından bağımsız sunucu yetkisiyle belirlenir. `viva_davet_baglami` güncel bağlamı, `viva_ic_kapsam` ve `viva_eclub_kapsam` listeleme, kayıt ve oda erişimindeki aynı kapsamı sağlar. Kurulum dosyası: `scripts/sql/viva_davet_kapsami.sql`; kullanıcı tarafından uygulanacak. Dosyanın hazırlanması canlı veritabanında kurulduğu anlamına gelmez.

**26 Ekim 2026 — Bölge seçimi ve seçili davetliler:** Firmanız listesi, davet edilebilir UTT/KD_UTT'leri bölgelere göre gruplar. Bölge kutusu o bölgedeki tüm UTT'leri seçer/kaldırır; grup açılarak kişiler tek tek seçilir. Diğer bölge ve E-Club seçimleri korunur. Diğer firma rolleri aynı listede tekil seçilebilir. Bölge bilgileri sunucuda yalnız `viva_davet_baglami` tarafından döndürülen kişi kimliklerine eklenir; mevcut davet kapsamı ve kayıt doğrulaması kullanılır. SQL kurulumu gerektirmez. Seçilen isimler, seçim listelerinin sağındaki satır sardıkça büyüyen kutuda unvan kısaltması ve ad soyadla gösterilir; mobilde alanlar alt alta uyarlanır.


**26 Ekim 2026 — Viva giriş ve yayın listesi adresleri:** Cepteki Viva `/viva` adresinde etkinlik oluşturma formunu açar; varsayılan seçim Planlı Etkinlik, anlık seçim `/viva?tur=anlik` adresidir. Yayın listesi `/viva/yayinlar` adresine taşındı ve breadcrumb'ta Viva Yayınlar olarak adlandırılır. Ana giriş breadcrumb'ı Cogniti → Viva; liste Cogniti → Viva → Viva Yayınlar sırasındadır. Eski `/viva/yeni` bağlantıları türü koruyarak yeni girişe, eski `/viva?kaynak=...` liste bağlantıları filtreyi koruyarak `/viva/yayinlar?kaynak=...` adresine yönlenir.


**27 Ekim 2026 — Ortak Viva etkinlik detayı:** İleri Tarihli Yayınlar, Başlayan Yayınlar, Geçmiş ve Taslaklar aynı etkinlik detayına açılır. Taslak kartı doğrudan düzenleme formuna atlamaz; düzenleme ortak detayın içinden açılır. Özet, bölüm sekmeleri, katılımcılar ve özel davetlilerin dört sütunlu tabloları bütün durumlarda aynı yerleşimdedir; boş tabloların sütun başlıkları da korunur. Yetkiye bağlı satır işlemleri kişi adının yanında kompakt ikonlarla, özel davet bağlantısı oluşturma formu “Özel davetli ekle” penceresinde sunulur. Mevcut yetki ve durum koşulları korunur.

### 27 Ekim 2026 — Viva: güncel uygulama ve dosya envanteri

Bu kayıt, `23ba51ff`, `1b5b94d8`, `e5ec344a`, `f6e3d22b` ve `d9c68ea4` commitleriyle oluşan kaynak yapısını ve kullanıcı kararlarını açıklar. Aşağıdaki dosya listesi Git tarafından izlenen yolların bu tarihteki görüntüsüdür; tek başına canlı kurulum, gerçek teslimat veya test başarısı kanıtı değildir. Önceki aşama belgeleri hazırlandıkları tarihin kapsamını korur.

**Giriş, form ve mobil:** Viva cebi `/viva` adresindeki etkinlik oluşturma formuna gider; sayfa başlığı “Etkinlik düzenleyin”dir. Planlı ve anlık etkinlik seçimi, davet kapsamı ve `/viva/yayinlar` yönlendirmeleri yukarıdaki kayıtlarda açıklanır. Başlangıç saati `VivaSaatSecimi` ile aranabilir ve yazılabilir: listede 15 dakika aralıklı 96 seçenek vardır, geçerli diğer `SS:DD` değerleri de girilebilir. Mobilde tarih, saat ve süre alanları dar ekranda alt alta yerleşir; davet alanları ve işlem düğmeleri ekrana uyarlanır. Mobil Viva cebinin simgesi yukarı alınmış, cebin gövdesi navbar sınırına bağlı bırakılmıştır. Viva sayfalarında form, liste, detay, kayıt, oda ve misafir görünümlerinin dar ekran stilleri ile kılavuz erişimi düzenlenmiştir.

**Ortak detay:** İleri Tarihli, Başlayan, Geçmiş ve Taslaklar aynı detay yapısını kullanır. Katılımcı tablosu kurum, ad soyad, unvan ve e-posta sütunlarından oluşur. İlk başlık yalnız E-Club kişilerinde “Eczane Adı”, yalnız firma çalışanlarında “Firma Adı”, karma listede “Eczane / Firma Adı” olur; değer ilgili eczane veya firmadan gelir. Özel davetli tablosunun ilk sütunu “Kurum Adı”dır. Tabloların listesi on satırdan sonra kendi alanında kaydırılır; mobilde geniş tablo kendi içinde yatay kaydırılabilir. Özel davetli ekleme formu pencerede açılır. Yetkiye bağlı katılımcı ve davet işlemleri korunur.

**Durum ve işlem kapıları:** Detay durumu `lib/viva/detay.ts` içindeki gerçek durum, başlangıç ve bitiş bilgileriyle hesaplanır. İptal Edildi, Taslak, Gerçekleşmedi, Gerçekleşti, Başladı, Devam ediyor ve Planlandı etiketleri kullanılır; gerçek başlangıç kaydından beş dakika sonra devam eden yayın “Devam ediyor” gösterilir. Başlamamış ve başlangıç zamanı geçmiş veya sonlanmış etkinliklerde düzenleme işlemleri kapatılır; iptal edilen etkinlikte de eylemler kapalıdır. Ayrıca kullanıcı ve sunucu yetkisi kontrolleri uygulanır.

**Daily görüşmesi:** Görüşme alanı Daily Prebuilt kullanır. Kamera, mikrofon, sohbet, ekran paylaşımı, arka plan ve kayıt gibi görüşme kontrollerinin Daily karşılıkları kullanılır. Sunucunun alt çubuğundaki özel “Yayını bitir” düğmesi Viva’nın bitirme işlemine bağlanır; Daily’nin “Ayrıl” düğmesi kişisel ayrılma kontrolüdür. Üstteki ayrı büyük bitirme bandı, Viva yardım penceresi ve tekrarlanan görüşme durum metni kaldırılmıştır. Eski Viva soru/anket arayüzü ve bağlantılı uygulama kodu kaldırılmıştır; `scripts/sql/viva_anket_kaldir.sql` kaldırma kaynağıdır. Bu kayıt Daily’de soru/anket özelliğinin kurulduğu veya etkinleştirildiği anlamına gelmez.

**Ortam ve doğrulama sınırı:** Daily bağlantısı sunucu tarafındaki `DAILY_API_KEY` ve `DAILY_DOMAIN` yapılandırmasına bağlıdır; gizli değerler belgelenmez. Kullanıcı 27 Ekim’de mobil yayının açıldığını bildirmiştir. `d9c68ea4` çalışmasında dar/geniş tarayıcı görünümleri, hedefli testler ve TypeScript kontrolü yapılmıştır; bu, bütün cihazlarda veya tüm test paketinde doğrulama yapıldığı anlamına gelmez. Fiziksel iPhone/Safari ve bu değişikliklerden sonraki gerçek Daily görüşmesi ayrıca sınanmamıştır. E-posta teslimatının uçtan uca durumu için REDBOOK TB-03 takip edilir. SQL dosyasının kaynakta bulunması canlı veritabanına uygulandığını göstermez.

**Güncel Git dosya envanteri:** Aşağıdaki yollar, önceki genel envanterde bulunmayan Viva dosyalarını tamamlar. Sayfalar/API rota ve yetki akışını, bileşenler görünümü, `lib/viva` iş kuralları ve entegrasyonu, SQL dosyaları kurulum/değişim veya denetim kaynaklarını, testler ise senaryo kaynaklarını içerir. Tarihsel aşama belgeleri mevcut uygulamanın tek başına güncel durum kaydı değildir.

**Sayfalar ve API uçları (19):**

- `app/(panel)/viva/[etkinlikId]/duzenle/page.tsx`
- `app/(panel)/viva/[etkinlikId]/oda/page.tsx`
- `app/(panel)/viva/[etkinlikId]/page.tsx`
- `app/(panel)/viva/api/katilim/route.ts`
- `app/(panel)/viva/api/kayit-kutuphanesi/route.ts`
- `app/(panel)/viva/api/kayit/route.ts`
- `app/(panel)/viva/api/oda/route.ts`
- `app/(panel)/viva/api/route.ts`
- `app/(panel)/viva/api/yasam/route.ts`
- `app/(panel)/viva/kayitlar/page.tsx`
- `app/(panel)/viva/page.tsx`
- `app/(panel)/viva/yayinlar/page.tsx`
- `app/(panel)/viva/yeni/page.tsx`
- `app/api/cron/viva/route.ts`
- `app/api/viva/daily-webhook/route.ts`
- `app/viva/davet/[token]/api/route.ts`
- `app/viva/davet/[token]/katilim/route.ts`
- `app/viva/davet/[token]/page.tsx`
- `app/viva/entegrasyon-onizleme/page.tsx`

**Arayüz bileşenleri ve stiller (20):**

- `components/viva/VivaDetayIcerigi.tsx`
- `components/viva/VivaDurumAlani.tsx`
- `components/viva/VivaEkrani.tsx`
- `components/viva/VivaEntegrasyonOnizleme.tsx`
- `components/viva/VivaEpostaAlani.tsx`
- `components/viva/VivaKaydirilabilirTablo.tsx`
- `components/viva/VivaKayitKutuphanesi.tsx`
- `components/viva/VivaKayitlar.tsx`
- `components/viva/VivaListeEkrani.tsx`
- `components/viva/VivaMisafir.tsx`
- `components/viva/VivaOdaAlani.tsx`
- `components/viva/VivaSaatSecimi.tsx`
- `components/viva/viva-detay.module.css`
- `components/viva/viva-eposta.module.css`
- `components/viva/viva-form.module.css`
- `components/viva/viva-liste.module.css`
- `components/viva/viva-oda.module.css`
- `components/viva/viva-saat.module.css`
- `components/viva/viva-yardimci.module.css`
- `components/viva/viva.module.css`

**İş mantığı ve Daily entegrasyonu (23):**

- `lib/viva/daily.ts`
- `lib/viva/davetSecimi.ts`
- `lib/viva/detay.ts`
- `lib/viva/dosyaLinki.ts`
- `lib/viva/eposta.ts`
- `lib/viva/epostaGonderimSunucu.ts`
- `lib/viva/indirme.ts`
- `lib/viva/katilim.ts`
- `lib/viva/katilimSunucu.ts`
- `lib/viva/kayitKutuphaneSunucu.ts`
- `lib/viva/kayitSunucu.ts`
- `lib/viva/liste.ts`
- `lib/viva/listeSunucu.ts`
- `lib/viva/oda.ts`
- `lib/viva/onizleme.ts`
- `lib/viva/prebuilt.ts`
- `lib/viva/sozlesme.ts`
- `lib/viva/sunucu.ts`
- `lib/viva/takvim.ts`
- `lib/viva/webhook-events.mjs`
- `lib/viva/webhook.ts`
- `lib/viva/yasam.ts`
- `lib/viva/yasamSunucu.ts`

**SQL kaynakları (22):**

- `scripts/sql/viva_anket_kaldir.sql`
- `scripts/sql/viva_anlik_planlama.sql`
- `scripts/sql/viva_asama1.sql`
- `scripts/sql/viva_asama2_1.sql`
- `scripts/sql/viva_asama2_1_test.sql`
- `scripts/sql/viva_asama2_2.sql`
- `scripts/sql/viva_asama2_2_test.sql`
- `scripts/sql/viva_asama2_4.sql`
- `scripts/sql/viva_asama2_4_cron.sql`
- `scripts/sql/viva_asama2_4_test.sql`
- `scripts/sql/viva_asama2_5.sql`
- `scripts/sql/viva_asama2_5_test.sql`
- `scripts/sql/viva_asama2_6_yaris_A.sql`
- `scripts/sql/viva_asama2_6_yaris_B.sql`
- `scripts/sql/viva_davet_kapsami.sql`
- `scripts/sql/viva_eposta_davetleri.sql`
- `scripts/sql/viva_eposta_gonderim_isleyici.sql`
- `scripts/sql/viva_eposta_yeniden_dene.sql`
- `scripts/sql/viva_hatirlatma_kaldir.sql`
- `scripts/sql/viva_kayit_indirme_7gun.sql`
- `scripts/sql/viva_kayit_kutuphanesi.sql`
- `scripts/sql/viva_liste_ekrani.sql`

**Test ve test verisi kaynakları (26):**

- `tests/_viva-dom.mjs`
- `tests/fixtures/viva-asama1-postgres.sql`
- `tests/vivaArayuz.hedef.test.ts`
- `tests/vivaAsama1.hedef.test.ts`
- `tests/vivaAsama1.postgres.mjs`
- `tests/vivaDailyKatilim.hedef.test.ts`
- `tests/vivaDailyOda.hedef.test.ts`
- `tests/vivaDavetKapsami.hedef.test.ts`
- `tests/vivaDavetKapsami.postgres.mjs`
- `tests/vivaDetay.hedef.test.ts`
- `tests/vivaEposta.hedef.test.ts`
- `tests/vivaEpostaGonderim.hedef.test.ts`
- `tests/vivaEpostaGonderim.postgres.mjs`
- `tests/vivaEpostaIstegi.hedef.test.ts`
- `tests/vivaEpostaKayit.postgres.mjs`
- `tests/vivaEpostaMisafirZinciri.postgres.mjs`
- `tests/vivaEpostaYenidenDene.postgres.mjs`
- `tests/vivaIndirme.hedef.test.ts`
- `tests/vivaKayit.hedef.test.ts`
- `tests/vivaListe.hedef.test.ts`
- `tests/vivaMisafir.hedef.test.ts`
- `tests/vivaPlanlama.hedef.test.ts`
- `tests/vivaPlanlama.postgres.mjs`
- `tests/vivaPrebuilt.hedef.test.ts`
- `tests/vivaTeslim.hedef.test.ts`
- `tests/vivaYasam.hedef.test.ts`

**Viva belgeleri (31):**

- `docs/VIVA_ASAMA_1_ARAYUZ_KONTROLU.md`
- `docs/VIVA_ASAMA_1_DETAYLI_CHECKLIST.md`
- `docs/VIVA_ASAMA_1_KULLANICI_SQL_SONUCU.md`
- `docs/VIVA_ASAMA_1_TEST_SONUCLARI.json`
- `docs/VIVA_ASAMA_1_UYGULAMA.md`
- `docs/VIVA_ASAMA_2_1_DAILY_CANLI_SONUC.json`
- `docs/VIVA_ASAMA_2_1_KULLANICI_SQL_SONUCU.md`
- `docs/VIVA_ASAMA_2_1_TEST_SONUCLARI.json`
- `docs/VIVA_ASAMA_2_1_UYGULAMA.md`
- `docs/VIVA_ASAMA_2_2_DAILY_CANLI_SONUC.json`
- `docs/VIVA_ASAMA_2_2_KULLANICI_SQL_SONUCU.md`
- `docs/VIVA_ASAMA_2_2_TEST_SONUCLARI.json`
- `docs/VIVA_ASAMA_2_2_UYGULAMA.md`
- `docs/VIVA_ASAMA_2_3_TEST_SONUCLARI.json`
- `docs/VIVA_ASAMA_2_3_UYGULAMA.md`
- `docs/VIVA_ASAMA_2_4_KULLANICI_SQL_SONUCU.md`
- `docs/VIVA_ASAMA_2_4_TEST_SONUCLARI.json`
- `docs/VIVA_ASAMA_2_4_UYGULAMA.md`
- `docs/VIVA_ASAMA_2_5_DAILY_CANLI_SONUC.json`
- `docs/VIVA_ASAMA_2_5_KULLANICI_SQL_SONUCU.md`
- `docs/VIVA_ASAMA_2_5_TEST_SONUCLARI.json`
- `docs/VIVA_ASAMA_2_5_UYGULAMA.md`
- `docs/VIVA_ASAMA_2_6_TESLIM.md`
- `docs/VIVA_ASAMA_2_6_TEST_SONUCLARI.json`
- `docs/VIVA_ASAMA_2_DETAYLI_CHECKLIST.md`
- `docs/VIVA_DAILY_EK_OZELLIKLER.md`
- `docs/VIVA_DAILY_ON_ARASTIRMA.md`
- `docs/VIVA_GELISTIRME_PROJE_ADIMLARI.md`
- `docs/VIVA_HATIRLATMA_KALDIRMA.md`
- `docs/VIVA_SOHBET_METNI_INDIRME.md`
- `docs/VIVA_YAYIN_PLANLAMA.md`

**Marka varlıkları ve operasyon betiği (3):**

- `public/marka/viva/viva-mavi-ribon-simge.svg`
- `public/marka/viva/viva-mavi-ribon-yatay.svg`
- `scripts/viva-daily-webhook.mjs`
