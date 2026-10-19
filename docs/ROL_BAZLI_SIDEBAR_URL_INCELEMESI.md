# Cogniti — rol bazlı sidebar ve URL incelemesi

> Bu dosya ilk inceleme ve önerileri içerir. Kullanıcının son kararları ve uygulanan adresler: [Onaylı URL değişiklikleri](ONAYLI_URL_DEGISIKLIKLERI_2026_10_18.md).

Tarih: 18.10.2026. Durum: mevcut kaynak koddan çıkarılmış inceleme ve öneri; uygulama yapılmadı.

## Okuma anahtarı

- Mevcut adresler tıklanabilir yerel bağlantılardır. İlgili rolün oturumuyla kontrol edilmelidir.
- Üçüncü sütunda **—**, mevcut adresin menü adıyla benzer olduğu ve korunmasının önerildiği anlamına gelir. Yeni adres önerileri henüz mevcut değildir; bu yüzden bağlantı yapılmadı.
- Firma modüllerinin açık olduğu durumda görülebilen menüler listelendi. Kapalı modüller ilgili kullanıcıda görünmez.
- Aynı sidebar yapısına sahip roller birlikte gösterildi; rol farklılıkları ayrıca belirtildi.
- Eğitim Yayınları üst satırı açılır/kapanır menüdür. Tıklanabilir hedefleri altındaki altı eğitim kategorisidir. BM/TM/yöneticilerde yapılandırmada bulunan /yayindaki-videolar kökü ilk kategoriye yönlenir; üst menü tıklaması sayfa geçişi değildir.
- Sidebar dışındaki ortak navbar ve mobil ek bağlantılar ayrı başlıklardadır. Sayfa içindeki her dinamik detay veya API uç noktası bu sidebar tablosunun kapsamına dahil değildir.
- Aynı yeni URL önerisinin farklı rollerde kullanılması, mevcut rol yetkilerinin ve sayfa davranışlarının birleştirilmesi anlamına gelmez; uygulamada bunlar korunmalıdır.
- Eski bağlantılar için yeni yönlendirme eklenmesi planlanmıyor; proje geliştirme aşamasındadır.
- Tarayıcıya girilmedi; oturum ve HTTP erişim testi yapılmadı. Mevcut hedeflerin sayfa dosyaları kontrol edildi.

## 1. Üretici aileleri

Ürün Müdürü (`pm`), Ürün Müdürü (Jr.) (`jr_pm`), Kıdemli Ürün Müdürü (`kd_pm`), Medikal Müdür (`med_md`), Eğitim Müdürü (`egt_md`), Eğitim Müdür Yardımcısı (`egt_yrd_md`), Eğitim Yöneticisi (`egt_yon`), Eğitim Uzmanı (`egt_uz`), İK Direktörü (`ik_drk`), İK Müdürü (`ik_md`), İK Müdür Yardımcısı (`ik_yrd_md`), İK Uzmanı (`ik_uz`), İK Personeli (`ik_per`).

Rol aileleri: Ürün (3), Medikal (1), Eğitim (4), İK (5). Bu dört ailenin sidebar bağlantıları aynıdır.

| Menü / seçim | Mevcut adres — tıklanabilir | Yeni URL önerisi / durum |
| --- | --- | --- |
| Yayınlar ve Raporlar › Yayın Oluşturma ve Takip | [/yayin-takip](http://localhost:3000/yayin-takip) | — |
| Yayınlar ve Raporlar › Yayın Yönetimi | [/yayin-yonetimi](http://localhost:3000/yayin-yonetimi) | — |
| Yayınlar ve Raporlar › Sizin Yayınlarınız | [/sizin-yayinlariniz](http://localhost:3000/sizin-yayinlariniz) | — |
| Yayınlar ve Raporlar › Tüm Yayınlar | [/tum-yayinlar](http://localhost:3000/tum-yayinlar) | — |
| Yayınlar ve Raporlar › Yayın Raporları | [/raporlar/yayin-raporlari](http://localhost:3000/raporlar/yayin-raporlari) | — |
| T-Club › T-Club Ligi | [/t-club-ligi](http://localhost:3000/t-club-ligi) | — |
| T-Club › T-Club Raporları | [/raporlar/tclub-uretici](http://localhost:3000/raporlar/tclub-uretici) | `/t-club/raporlar` |
| C-Club › C-Club Ligi | [/cc-ligi](http://localhost:3000/cc-ligi) | `/c-club-ligi` |
| E-Club › E-Club Ligi | [/eclub/ligi](http://localhost:3000/eclub/ligi) | — |


## 2. Yönetici ailesi

Genel Müdür (`gm`), Genel Müdür Yardımcısı (`gm_yrd`), Direktör (`drk`), Pazarlama Müdürü (`paz_md`), Bölüm Müdürü (`blm_md`), Grup Ürün Müdürü (`grp_pm`), Satış Müdürü (`sm`).

| Menü / seçim | Mevcut adres — tıklanabilir | Yeni URL önerisi / durum |
| --- | --- | --- |
| Yayınlar ve Raporlar › Yayın Raporları | [/raporlar/yayin-raporlari](http://localhost:3000/raporlar/yayin-raporlari) | — |
| T-Club › Eğitim Yayınları › Ürün Eğitimleri | [/yayindaki-videolar/urun](http://localhost:3000/yayindaki-videolar/urun) | `/egitim-yayinlari/urun` |
| T-Club › Eğitim Yayınları › Medikal Eğitimler | [/yayindaki-videolar/medikal](http://localhost:3000/yayindaki-videolar/medikal) | `/egitim-yayinlari/medikal` |
| T-Club › Eğitim Yayınları › Ürün-Medikal Eğitimleri | [/yayindaki-videolar/urun-medikal](http://localhost:3000/yayindaki-videolar/urun-medikal) | `/egitim-yayinlari/urun-medikal` |
| T-Club › Eğitim Yayınları › Satış Eğitimleri | [/yayindaki-videolar/satis](http://localhost:3000/yayindaki-videolar/satis) | `/egitim-yayinlari/satis` |
| T-Club › Eğitim Yayınları › Yönetim Eğitimleri | [/yayindaki-videolar/yonetim](http://localhost:3000/yayindaki-videolar/yonetim) | `/egitim-yayinlari/yonetim` |
| T-Club › Eğitim Yayınları › İK Eğitimleri | [/yayindaki-videolar/ik](http://localhost:3000/yayindaki-videolar/ik) | `/egitim-yayinlari/ik` |
| T-Club › T-Club Ligi | [/t-club-ligi](http://localhost:3000/t-club-ligi) | — |
| T-Club › T-Club Raporları | [/raporlar/yonetici](http://localhost:3000/raporlar/yonetici) | `/t-club/raporlar` |
| T-Club › Ekip Mağaza Siparişleri | [/store/siparisler](http://localhost:3000/store/siparisler) | `/store/ekip-magaza-siparisleri` |
| C-Club › C-Club Ligi | [/cc-ligi](http://localhost:3000/cc-ligi) | `/c-club-ligi` |
| E-Club › E-Club Ligi | [/eclub/ligi](http://localhost:3000/eclub/ligi) | — |


## 3. Bölge Müdürü

Bölge Müdürü (`bm`).

| Menü / seçim | Mevcut adres — tıklanabilir | Yeni URL önerisi / durum |
| --- | --- | --- |
| T-Club › Öneri Takibi | [/oneriler](http://localhost:3000/oneriler) | — |
| T-Club › Eğitim Yayınları › Ürün Eğitimleri | [/yayindaki-videolar/urun](http://localhost:3000/yayindaki-videolar/urun) | `/egitim-yayinlari/urun` |
| T-Club › Eğitim Yayınları › Medikal Eğitimler | [/yayindaki-videolar/medikal](http://localhost:3000/yayindaki-videolar/medikal) | `/egitim-yayinlari/medikal` |
| T-Club › Eğitim Yayınları › Ürün-Medikal Eğitimleri | [/yayindaki-videolar/urun-medikal](http://localhost:3000/yayindaki-videolar/urun-medikal) | `/egitim-yayinlari/urun-medikal` |
| T-Club › Eğitim Yayınları › Satış Eğitimleri | [/yayindaki-videolar/satis](http://localhost:3000/yayindaki-videolar/satis) | `/egitim-yayinlari/satis` |
| T-Club › Eğitim Yayınları › Yönetim Eğitimleri | [/yayindaki-videolar/yonetim](http://localhost:3000/yayindaki-videolar/yonetim) | `/egitim-yayinlari/yonetim` |
| T-Club › Eğitim Yayınları › İK Eğitimleri | [/yayindaki-videolar/ik](http://localhost:3000/yayindaki-videolar/ik) | `/egitim-yayinlari/ik` |
| T-Club › T-Club Ligi | [/t-club-ligi](http://localhost:3000/t-club-ligi) | — |
| T-Club › T-Club Raporları | [/raporlar/bm](http://localhost:3000/raporlar/bm) | `/t-club/raporlar` |
| T-Club › Ekip Mağaza Siparişleri | [/store/siparisler](http://localhost:3000/store/siparisler) | `/store/ekip-magaza-siparisleri` |
| C-Club › Challenge Club | [/challenge-club](http://localhost:3000/challenge-club) | — |
| C-Club › C-Club Ligi | [/cc-ligi](http://localhost:3000/cc-ligi) | `/c-club-ligi` |
| E-Club › E-Club Takımım | [/eclub/eczanelerim](http://localhost:3000/eclub/eczanelerim) | `/eclub/takimim` |
| E-Club › E-Club Yayınları | [/eclub/yayinlar](http://localhost:3000/eclub/yayinlar) | — |
| E-Club › E-Club Ligi | [/eclub/ligi](http://localhost:3000/eclub/ligi) | — |
| Eczanem › Mutabakat Takip | [/eczanem/bm/mutabakat](http://localhost:3000/eczanem/bm/mutabakat) | `/eczanem/bm/mutabakat-takip` |


## 4. Takım Müdürü

Takım Müdürü (`tm`).

| Menü / seçim | Mevcut adres — tıklanabilir | Yeni URL önerisi / durum |
| --- | --- | --- |
| T-Club › Öneri Takibi | [/oneriler](http://localhost:3000/oneriler) | — |
| T-Club › Eğitim Yayınları › Ürün Eğitimleri | [/yayindaki-videolar/urun](http://localhost:3000/yayindaki-videolar/urun) | `/egitim-yayinlari/urun` |
| T-Club › Eğitim Yayınları › Medikal Eğitimler | [/yayindaki-videolar/medikal](http://localhost:3000/yayindaki-videolar/medikal) | `/egitim-yayinlari/medikal` |
| T-Club › Eğitim Yayınları › Ürün-Medikal Eğitimleri | [/yayindaki-videolar/urun-medikal](http://localhost:3000/yayindaki-videolar/urun-medikal) | `/egitim-yayinlari/urun-medikal` |
| T-Club › Eğitim Yayınları › Satış Eğitimleri | [/yayindaki-videolar/satis](http://localhost:3000/yayindaki-videolar/satis) | `/egitim-yayinlari/satis` |
| T-Club › Eğitim Yayınları › Yönetim Eğitimleri | [/yayindaki-videolar/yonetim](http://localhost:3000/yayindaki-videolar/yonetim) | `/egitim-yayinlari/yonetim` |
| T-Club › Eğitim Yayınları › İK Eğitimleri | [/yayindaki-videolar/ik](http://localhost:3000/yayindaki-videolar/ik) | `/egitim-yayinlari/ik` |
| T-Club › T-Club Ligi | [/t-club-ligi](http://localhost:3000/t-club-ligi) | — |
| T-Club › T-Club Raporları | [/raporlar/tm](http://localhost:3000/raporlar/tm) | `/t-club/raporlar` |
| T-Club › Ekip Mağaza Siparişleri | [/store/siparisler](http://localhost:3000/store/siparisler) | `/store/ekip-magaza-siparisleri` |
| C-Club › C-Club Ligi | [/cc-ligi](http://localhost:3000/cc-ligi) | `/c-club-ligi` |
| E-Club › E-Club Takımım | [/eclub/eczanelerim](http://localhost:3000/eclub/eczanelerim) | `/eclub/takimim` |
| E-Club › E-Club Yayınları | [/eclub/yayinlar](http://localhost:3000/eclub/yayinlar) | — |
| E-Club › E-Club Ligi | [/eclub/ligi](http://localhost:3000/eclub/ligi) | — |
| Eczanem › Mutabakat Takip | [/eczanem/tm/mutabakat](http://localhost:3000/eczanem/tm/mutabakat) | `/eczanem/tm/mutabakat-takip` |


## 5. UTT ve Kıdemli UTT

Ürün Tanıtım Temsilcisi (`utt`), Kıdemli Ürün Tanıtım Temsilcisi (`kd_utt`).

Kıdemli UTT, Mutabakat satırını görmez. Diğer satırlar iki rol için ortaktır.

| Menü / seçim | Mevcut adres — tıklanabilir | Yeni URL önerisi / durum |
| --- | --- | --- |
| T-Club › Eğitim Yayınları › Ürün Eğitimleri | [/videolarim/urun](http://localhost:3000/videolarim/urun) | `/egitim-yayinlari/urun` |
| T-Club › Eğitim Yayınları › Medikal Eğitimler | [/videolarim/medikal](http://localhost:3000/videolarim/medikal) | `/egitim-yayinlari/medikal` |
| T-Club › Eğitim Yayınları › Ürün-Medikal Eğitimleri | [/videolarim/urun-medikal](http://localhost:3000/videolarim/urun-medikal) | `/egitim-yayinlari/urun-medikal` |
| T-Club › Eğitim Yayınları › Satış Eğitimleri | [/videolarim/satis](http://localhost:3000/videolarim/satis) | `/egitim-yayinlari/satis` |
| T-Club › Eğitim Yayınları › Yönetim Eğitimleri | [/videolarim/yonetim](http://localhost:3000/videolarim/yonetim) | `/egitim-yayinlari/yonetim` |
| T-Club › Eğitim Yayınları › İK Eğitimleri | [/videolarim/ik](http://localhost:3000/videolarim/ik) | `/egitim-yayinlari/ik` |
| T-Club › Önerilen Yayınlar | [/oneriler](http://localhost:3000/oneriler) | — |
| T-Club › T-Club Ligi | [/t-club-ligi](http://localhost:3000/t-club-ligi) | — |
| T-Club › T-Club Raporları | [/raporlar/utt](http://localhost:3000/raporlar/utt) | `/t-club/raporlar` |
| E-Club › E-Club Takımım | [/eclub/eczanelerim](http://localhost:3000/eclub/eczanelerim) | `/eclub/takimim` |
| E-Club › E-Club Yayınları | [/eclub/yayinlar](http://localhost:3000/eclub/yayinlar) | — |
| E-Club › E-Club Ligi | [/eclub/ligi](http://localhost:3000/eclub/ligi) | — |
| Eczanem › Eczanem Yayınları | [/eczanem/yayinlar](http://localhost:3000/eczanem/yayinlar) | — |
| Eczanem › Mutabakat — yalnız UTT | [/eczanem/utt/mutabakat](http://localhost:3000/eczanem/utt/mutabakat) | — |


## 6. İçerik Üreticisi

İçerik Üreticisi (`iu`).

| Menü / seçim | Mevcut adres — tıklanabilir | Yeni URL önerisi / durum |
| --- | --- | --- |
| Yayınlar ve Raporlar › Senaryolar | [/senaryolar](http://localhost:3000/senaryolar) | — |
| Yayınlar ve Raporlar › Öğrenme Araçları | [/videolar](http://localhost:3000/videolar) | `/ogrenme-araclari` |
| Yayınlar ve Raporlar › Soru Setleri | [/soru-setleri](http://localhost:3000/soru-setleri) | — |
| Yayınlar ve Raporlar › Onaylanan Talepler | [/onaylanan-talepler](http://localhost:3000/onaylanan-talepler) | — |
| T-Club › T-Club Ligi | [/t-club-ligi](http://localhost:3000/t-club-ligi) | — |


## 7. E-Club kişi rolleri

Eczacı (`eczaci`), İkinci Eczacı (`ikinci_eczaci`), Yardımcı Eczacı (`yardimci_eczaci`), Eczane Teknisyeni (`eczane_teknisyeni`).

| Menü / seçim | Mevcut adres — tıklanabilir | Yeni URL önerisi / durum |
| --- | --- | --- |
| E-Club › Firmalar ve Yayınları | [/eclub/firmalar](http://localhost:3000/eclub/firmalar) | — |
| Eczanem › Üyeler | [/eczanem/eczane/uyeler](http://localhost:3000/eczanem/eczane/uyeler) | — |
| Eczanem › Üye Yayınları | [/eczanem/eczane/uye-yayinlari](http://localhost:3000/eczanem/eczane/uye-yayinlari) | — |
| Eczanem › İndirim Onayı | [/eczanem/eczane/inidirm-onayi](http://localhost:3000/eczanem/eczane/inidirm-onayi) | `/eczanem/eczane/indirim-onayi` |


Firmalar ve Yayınları, en az bir erişilebilir firma ve açık E-Club modülü olduğunda görünür. Eczanem satırları da Eczanem modülüne bağlıdır. Firma detayları seçilen gerçek firma kimliğiyle açılır; uydurma kimlikli bağlantı eklenmedi.

## 8. Eczanem üyesi

Teknik rol: `musteri`. Bu hesap E-Club kişi rolünden ayrıdır.

| Menü / seçim | Mevcut adres — tıklanabilir | Yeni URL önerisi / durum |
| --- | --- | --- |
| Sidebar › Tüm İçerikler | [/eczanem](http://localhost:3000/eczanem) | Ayrı URL yok; sayfa içi seçim. |
| Sidebar › Eczanelerim › Eczane | [/eczanem](http://localhost:3000/eczanem) | Ayrı URL yok; sayfa içi seçim. |
| Sidebar › Eczanelerim › Eczane › Firma | [/eczanem](http://localhost:3000/eczanem) | Ayrı URL yok; sayfa içi seçim. |
| Sidebar › Eczanelerim › Eczane › Firma › Ürün | [/eczanem](http://localhost:3000/eczanem) | Ayrı URL yok; sayfa içi seçim. |
| Sidebar › … › Ürün › Yayın › Video / Podcast / Görsel / Literatür | [/eczanem](http://localhost:3000/eczanem) | Ayrı URL yok; sayfa içi seçim. |
| Navbar › Ana Sayfa | [/eczanem](http://localhost:3000/eczanem) | — |
| Navbar › Puanlarım | [/eczanem/puanlarim](http://localhost:3000/eczanem/puanlarim) | — |
| Navbar › Cogniti Nedir | [/eczanem/hapbilgi-nedir](http://localhost:3000/eczanem/hapbilgi-nedir) | `/eczanem/cogniti-nedir` |
| Navbar › Nasıl Çalışır | [/eczanem/nasil-calisir](http://localhost:3000/eczanem/nasil-calisir) | — |


Bu sidebar seçimleri React state ile yönetilir; tabloda tekrarlanan /eczanem bağlantısı yalnız sayfayı açar, ilgili eczane/firma/ürün seçimini açmaz. Her seçime ayrı URL verilmesi basit ad değişiminden farklı bir geliştirmedir; nasıl adresleneceği için karar gereklidir. Profil menüsü de bu kabukta açılır menüdür; ayrı profil sayfası bağlantısı yoktur.

## 9. Admin

Rol: `admin`. Ortak firma paneli sidebarı kullanılmaz. Sol sidebar firma seçer; aşağıdaki firma sekmeleri ve global bölümler aynı /admin adresinde durum değiştirir.

| Menü / seçim | Mevcut adres — tıklanabilir | Yeni URL önerisi / durum |
| --- | --- | --- |
| Sol sidebar › Firma seçimi | [/admin](http://localhost:3000/admin) | Ayrı firma URL’si yok. |
| Firma seçildikten sonra › Kullanıcılar | [/admin](http://localhost:3000/admin) | Ayrı sekme URL’si yok. |
| Firma seçildikten sonra › Kullanıcılar › Tekil Giriş | [/admin](http://localhost:3000/admin) | Ayrı sekme URL’si yok. |
| Firma seçildikten sonra › Kullanıcılar › Toplu Giriş | [/admin](http://localhost:3000/admin) | Ayrı sekme URL’si yok. |
| Firma seçildikten sonra › Organizasyon | [/admin](http://localhost:3000/admin) | Ayrı sekme URL’si yok. |
| Firma seçildikten sonra › Ürün ve Teknik | [/admin](http://localhost:3000/admin) | Ayrı sekme URL’si yok. |
| Firma seçildikten sonra › Logo ve Kimlik | [/admin](http://localhost:3000/admin) | Ayrı sekme URL’si yok. |
| Firma seçildikten sonra › T-Club | [/admin](http://localhost:3000/admin) | Ayrı sekme URL’si yok. |
| Firma seçildikten sonra › C-Club | [/admin](http://localhost:3000/admin) | Ayrı sekme URL’si yok. |
| Firma seçildikten sonra › E-Club | [/admin](http://localhost:3000/admin) | Ayrı sekme URL’si yok. |
| Firma seçildikten sonra › Eczanem | [/admin](http://localhost:3000/admin) | Ayrı sekme URL’si yok. |
| Üst bar › HBStore | [/admin](http://localhost:3000/admin) | Ayrı bölüm URL’si yok. |
| Üst bar › Çek Teslimatı | [/admin](http://localhost:3000/admin) | Ayrı bölüm URL’si yok. |
| Üst bar › İçerik Üretimi | [/admin](http://localhost:3000/admin) | Ayrı bölüm URL’si yok. |
| Üst bar › Sistem Ayarları | [/admin](http://localhost:3000/admin) | Ayrı bölüm URL’si yok. |


Admin için her sekmeye adres verilmesi ayrıca karar gerektirir. /admin/store, /admin/eclub ve /admin/eclub-cek-teslimat dosyaları mevcut olsa da /admin adresine yönlenir; güncel üst barın doğrudan bölüm bağlantıları değillerdir. Bunlara yeni yönlendirme önerilmiyor.

## 10. Ortak navbar ve mobil ekleri

Firma paneli rollerinde ortak navbar:

| Menü / seçim | Mevcut adres — tıklanabilir | Yeni URL önerisi / durum |
| --- | --- | --- |
| Ana Sayfa | [/ana-sayfa](http://localhost:3000/ana-sayfa) | — |
| Cogniti Nedir | [/hapbilgi-nedir](http://localhost:3000/hapbilgi-nedir) | `/cogniti-nedir` |
| Nasıl Çalışır | [/nasil-calisir](http://localhost:3000/nasil-calisir) | — |
| Profil | [/profil](http://localhost:3000/profil) | — |


E-Club kişi rolleri için Ana Sayfa adresi farklıdır; diğer üç bağlantı aynıdır:

| Menü / seçim | Mevcut adres — tıklanabilir | Yeni URL önerisi / durum |
| --- | --- | --- |
| Ana Sayfa | [/eclub/ana-sayfa](http://localhost:3000/eclub/ana-sayfa) | — |


UTT, Kıdemli UTT ve BM için, mağaza modülü açıksa mobil sidebarın ek HBStore grubu (masaüstünde mağaza erişimi navbar üzerinden):

| Menü / seçim | Mevcut adres — tıklanabilir | Yeni URL önerisi / durum |
| --- | --- | --- |
| HBStore › HBStore | [/store](http://localhost:3000/store) | — |
| HBStore › Siparişlerim | [/store/siparislerim](http://localhost:3000/store/siparislerim) | — |
| HBStore › Adreslerim | [/store/adreslerim](http://localhost:3000/store/adreslerim) | — |


/store, HBStore mağaza anlamıyla benzer olduğu için korunabilir. Ancak Ekip Mağaza Siparişleri, kişisel Siparişlerim bağlantısından ayırt edilsin diye /store/ekip-magaza-siparisleri önerildi. “Öneriler” ve “Yayın Takip” adresleri de menüleriyle benzer anlam taşıdığı için korunmuştur.

## 11. Değişiklik önerilerinin özeti


| Mevcut adres | Önerilen adres | Gerekçe |
| --- | --- | --- |
| [/raporlar/tclub-uretici](http://localhost:3000/raporlar/tclub-uretici) | `/t-club/raporlar` | Menü T-Club Raporları; mevcut adres rol adı taşıyor. |
| [/cc-ligi](http://localhost:3000/cc-ligi) | `/c-club-ligi` | C-Club Ligi adıyla uyum. |
| [/yayindaki-videolar/urun](http://localhost:3000/yayindaki-videolar/urun) | `/egitim-yayinlari/urun` | Menü Eğitim Yayınları; mevcut kök video adında. |
| [/yayindaki-videolar/medikal](http://localhost:3000/yayindaki-videolar/medikal) | `/egitim-yayinlari/medikal` | Menü Eğitim Yayınları; mevcut kök video adında. |
| [/yayindaki-videolar/urun-medikal](http://localhost:3000/yayindaki-videolar/urun-medikal) | `/egitim-yayinlari/urun-medikal` | Menü Eğitim Yayınları; mevcut kök video adında. |
| [/yayindaki-videolar/satis](http://localhost:3000/yayindaki-videolar/satis) | `/egitim-yayinlari/satis` | Menü Eğitim Yayınları; mevcut kök video adında. |
| [/yayindaki-videolar/yonetim](http://localhost:3000/yayindaki-videolar/yonetim) | `/egitim-yayinlari/yonetim` | Menü Eğitim Yayınları; mevcut kök video adında. |
| [/yayindaki-videolar/ik](http://localhost:3000/yayindaki-videolar/ik) | `/egitim-yayinlari/ik` | Menü Eğitim Yayınları; mevcut kök video adında. |
| [/raporlar/yonetici](http://localhost:3000/raporlar/yonetici) | `/t-club/raporlar` | Menü T-Club Raporları; mevcut adres rol adı taşıyor. |
| [/store/siparisler](http://localhost:3000/store/siparisler) | `/store/ekip-magaza-siparisleri` | Ekip Mağaza Siparişleri adıyla uyum. |
| [/raporlar/bm](http://localhost:3000/raporlar/bm) | `/t-club/raporlar` | Menü T-Club Raporları; mevcut adres rol adı taşıyor. |
| [/eclub/eczanelerim](http://localhost:3000/eclub/eczanelerim) | `/eclub/takimim` | Menü E-Club Takımım. |
| [/eczanem/bm/mutabakat](http://localhost:3000/eczanem/bm/mutabakat) | `/eczanem/bm/mutabakat-takip` | Mutabakat Takip adıyla uyum. |
| [/raporlar/tm](http://localhost:3000/raporlar/tm) | `/t-club/raporlar` | Menü T-Club Raporları; mevcut adres rol adı taşıyor. |
| [/eczanem/tm/mutabakat](http://localhost:3000/eczanem/tm/mutabakat) | `/eczanem/tm/mutabakat-takip` | Mutabakat Takip adıyla uyum. |
| [/videolarim/urun](http://localhost:3000/videolarim/urun) | `/egitim-yayinlari/urun` | Menü Eğitim Yayınları; mevcut kök video adında. |
| [/videolarim/medikal](http://localhost:3000/videolarim/medikal) | `/egitim-yayinlari/medikal` | Menü Eğitim Yayınları; mevcut kök video adında. |
| [/videolarim/urun-medikal](http://localhost:3000/videolarim/urun-medikal) | `/egitim-yayinlari/urun-medikal` | Menü Eğitim Yayınları; mevcut kök video adında. |
| [/videolarim/satis](http://localhost:3000/videolarim/satis) | `/egitim-yayinlari/satis` | Menü Eğitim Yayınları; mevcut kök video adında. |
| [/videolarim/yonetim](http://localhost:3000/videolarim/yonetim) | `/egitim-yayinlari/yonetim` | Menü Eğitim Yayınları; mevcut kök video adında. |
| [/videolarim/ik](http://localhost:3000/videolarim/ik) | `/egitim-yayinlari/ik` | Menü Eğitim Yayınları; mevcut kök video adında. |
| [/raporlar/utt](http://localhost:3000/raporlar/utt) | `/t-club/raporlar` | Menü T-Club Raporları; mevcut adres rol adı taşıyor. |
| [/videolar](http://localhost:3000/videolar) | `/ogrenme-araclari` | Menü Öğrenme Araçları; video ile sınırlı bir ad olmamalı. |
| [/eczanem/eczane/inidirm-onayi](http://localhost:3000/eczanem/eczane/inidirm-onayi) | `/eczanem/eczane/indirim-onayi` | Yazım hatası. |
| [/hapbilgi-nedir](http://localhost:3000/hapbilgi-nedir) | `/cogniti-nedir` | Görünen Cogniti adıyla uyum. |
| [/eczanem/hapbilgi-nedir](http://localhost:3000/eczanem/hapbilgi-nedir) | `/eczanem/cogniti-nedir` | Görünen Cogniti adıyla uyum. |


BM/TM Mutabakat Takip önerilerinde mevcut rol ayrımı korundu; burada yalnız “takip” sözcüğü tamamlandı. UTT Mutabakat adresi zaten menüyle benzer olduğu için korunmuştur. Eğitim kategorilerinin mevcut urun, medikal, urun-medikal, satis, yonetim ve ik son parçaları da menüyle benzer olduğu için korunmuştur.

## Kaynaklar


- docs/BLUEBOOK.MD — rol aileleri ve kimlik düzlemleri.
- lib/utils/roller.ts — rol kümeleri ve etiketler.
- components/panel/panelNav.config.ts — ortak sidebar ve rol koşulları, mobil HBStore, E-Club kişi menüsü.
- components/panel/SolListe.tsx ve components/panel/MobilDrawer.tsx — açılır menü davranışı, mobil ekleri.
- components/panel/PanelNavbar.tsx — ortak navbar.
- app/eczanem/_components/EczanemMusteriSidebar.tsx ve EczanemMusteriNavbar.tsx, app/eczanem/page.tsx — üye gezinmesi.
- app/admin/_constants.ts, app/admin/page.tsx ve app/admin/_components — admin gezinmesi.
- app altındaki mevcut page.tsx dosyaları — menü hedeflerinin varlığı.
