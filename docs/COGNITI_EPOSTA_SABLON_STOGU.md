# Cogniti e-posta şablon stoğu

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
