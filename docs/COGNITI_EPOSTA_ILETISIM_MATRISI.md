# Cogniti E-posta İletişim Şeması (Rol Bazlı Tam Matris)

> **Durum:** Taslak — Kullanıcı incelemesi ve onayı bekleniyor.  
> **Kapsam:** Cogniti’deki tüm rollerin otomatik e-posta iletişimi, gönderen adres standardı, gerekçesi ve taslak içerikleri.

---

## 1. Temel İlke: E-posta vs. Uygulama İçi Bildirim / Push

| Kanal | Ne Zaman Kullanılır? | Örnekler |
|---|---|---|
| **E-posta** | Kalıcı kayıt, ticari/hukuki kanıt, dış erişim bağlantısı (oturumsuz/ilk giriş), şifre, çek kodu, sipariş/hak ediş veya zamanlı etkinlik daveti | Şifre oluşturma/sıfırlama, çek teslimatı, Agora sipariş bildirimi, Viva/BOLIS daveti, başvuru onay/ret |
| **Push / Uygulama İçi** | Günlük operasyonel akış ve sık tekrarlanan olaylar (e-posta kutusunu boğmamak için) | Yeni yayın açıldı, yeni öneri geldi, senaryo/video revizyonu, izleme hatırlatması |

---

## 2. Önerilen Standart Gönderici Adresleri (`from`)

*(Tek alan adı altında Resend’de doğrulanmış 4 kimlik — mevcut Vercel env değişkenleri bu adreslere eşlenebilir.)*

| Gönderici Adresi | Kullanım Alanı | Mevcut Env Karşılığı |
|---|---|---|
| `bildirim@cogniti.net` | Üyelik davetleri, şifre, Viva & BOLIS bağlantıları, genel sistem bildirimleri | `ECLUB_DAVET_EMAIL_FROM`, `VIVA_DAVET_EMAIL_FROM` |
| `odul@cogniti.net` | E-Club ve FirmaStore hediye çeki teslimat ve iptal bildirimleri | `ECLUB_CEK_EMAIL_FROM`, `FIRMASTORE_CEK_EMAIL_FROM` |
| `partner@cogniti.net` | Agora İş Partnerliği onay, sipariş, canlı yayın ve hak ediş bildirimleri | `COGNITI_UYELIK_EMAIL_FROM` *(veya yeni `AGORA_PARTNER_EMAIL_FROM`)* |
| `destek@cogniti.net` *(veya `info@mill.tr`)* | Kurumsal üyelik ve müşteri talepleri (yanıtlanabilir iletişim) | `MUSTERI_TALEP_EMAIL_FROM`, `COGNITI_UYELIK_EMAIL_FROM` |

---

## 3. Rol Bazlı E-posta İletişim Matrisi

### A. Ziyaretçi / Kurumsal Aday & Merkezi Admin

| # | Olay / Durum | Kimden | Kime | Neden E-posta? | Konu ve Taslak İçerik | Durum |
|---|---|---|---|---|---|---|
| 1 | Fiyat/paket talep formu gönderildiğinde | `destek@cogniti.net` | `info@mill.tr` *(Reply-To: talep eden)* | Satış ekibine anında düşmesi ve yanıtlanabilmesi için | **Konu:** `Cogniti müşteri talebi`<br>Firma, ad soyad, e-posta, telefon, seçilen paket ve ek not. | **VAR** |
| 2 | Fiyat/paket talep formu gönderildiğinde (alındı teyidi) | `destek@cogniti.net` | Talep eden aday | Adaya talebinin ulaştığına dair kurumsal güven ve kayıt | **Konu:** `Cogniti talebiniz alındı`<br>`Merhaba {ad}, {firma} adına ilettiğiniz {secim} talebiniz bize ulaştı. Ekibimiz en kısa sürede sizinle iletişime geçecektir.` | **YENİ** |
| 3 | Kurumsal üyelik ön başvurusu yapıldığında | `destek@cogniti.net` | Başvuran firma yetkilisi **+** `info@mill.tr` | Başvurunun alındığını teyit etmek ve Admin’i haberdar etmek | **Konu:** `Cogniti kurumsal üyelik ön başvurunuz alındı`<br>`Merhaba {ad}, {firma} adına ön başvurunuz alınmıştır; inceleme sonrası bilgi verilecektir.` | **YENİ** |
| 4 | Kurumsal üyelik ön başvurusu onaylandığında | `destek@cogniti.net` | Firma yetkilisi | 48 saatlik tekil kurumsal üyelik formu bağlantısını iletmek | **Konu:** `Cogniti kurumsal üyelik formu davetiniz`<br>`{firma} adına ön başvurunuz onaylandı. [Kurumsal üyelik daveti bağlantısı] (48 saat geçerli).` | **VAR** |
| 5 | Kurumsal üyelik ön başvurusu reddedildiğinde | `destek@cogniti.net` | Firma yetkilisi | Adayı belirsizlikte bırakmamak, profesyonel kapanış | **Konu:** `Cogniti kurumsal üyelik başvurunuz hakkında`<br>`Merhaba {ad}, başvurunuz değerlendirilmiş olup şu aşamada olumlu sonuçlandırılamamıştır. Sorularınız için info@mill.tr adresinden ulaşabilirsiniz.` | **YENİ** |

---

### B. Tüm İç Kullanıcılar & Firma Admini (Hesap Güvenliği)

| # | Olay / Durum | Kimden | Kime | Neden E-posta? | Konu ve Taslak İçerik | Durum |
|---|---|---|---|---|---|---|
| 6 | Şifre sıfırlama istendiğinde | Supabase Auth SMTP | İlgili kayıtlı kullanıcı | Güvenli tek kullanımlık şifre yenileme bağlantısı | **Konu:** Supabase şifre yenileme şablonu → `/sifre-yenile` | **VAR** |
| 7 | Yeni iç kullanıcı (manuel/toplu) eklendiğinde | `bildirim@cogniti.net` | Yeni firma çalışanı | İlk giriş bilgisi ve şifre belirleme bağlantısı | **Konu:** `Cogniti hesabınız oluşturuldu`<br>`Merhaba {ad}, {firma} adına Cogniti hesabınız açıldı. Giriş yapmak için şifrenizi oluşturun: [Şifre Oluştur]` | **YENİ** |
| 8 | Firma hesabı pasife alındığında / yeniden açıldığında | `destek@cogniti.net` | Firma Admini | Kritik erişim kesintisi/açılışı hakkında resmi bilgilendirme | **Konu:** `Cogniti firma hesabı durum bildirimi`<br>`{firma} hesabınızın durumu {pasif/aktif} olarak güncellenmiştir.` | **YENİ** |

---

### C. Üretici (PM, Eğitim, Medikal, İK) & Yönetici (GM, Direktör, Paz. Md. vb.)

| # | Olay / Durum | Kimden | Kime | Neden E-posta? | Konu ve Taslak İçerik | Durum |
|---|---|---|---|---|---|---|
| 9 | Agora Video / Podcast siparişi tamamlandığında | `partner@cogniti.net` | Siparişi veren Üretici | Token harcaması ve içerik lisansının yazılı kanıtı | **Konu:** `Agora yayın siparişiniz tamamlandı`<br>`{yayin_adi} ({partner_adi}) yayını {token} Token karşılığında sipariş edildi ve Agora Yayınları havuzunuza eklendi.` | **YENİ** |
| 10 | Agora Viva Canlı Yayın siparişi tamamlandığında | `partner@cogniti.net` | Siparişi veren Üretici | Canlı yayın tarih/saati, kontenjan ve davet hatırlatması | **Konu:** `Agora canlı yayın siparişiniz onaylandı`<br>`{yayin_adi} ({partner_adi}) · Tarih: {tarih_saat} · Kontenjan: {kapasite} kişi · Tutar: {token} Token. Katılımcı daveti için Agora Yayınları > Viva Canlı Yayınlar ekranını kullanabilirsiniz.` | **YENİ** |
| 11 | Firma token bakiyesi kritik eşiğe düştüğünde / borç oluştuğunda | `destek@cogniti.net` | Firma Admini + Yönetici | Yayın/sipariş kesintisi yaşanmadan önlem alınması | **Konu:** `Cogniti token bakiye bilgilendirmesi`<br>`{firma} token bakiyeniz {bakiye} seviyesindedir (varsa borç: {borc} Token).` | **YENİ** |
| — | *Üretim hattı (Talep / Senaryo / Video / Soru Seti)* | *E-posta yok* | *Üretici / İU* | *Sık operasyonel olay — e-posta kutusunu boğar* | *Yalnız uygulama içi bildirim + Push Notification* | *Kural* |

---

### D. Saha Kadrosu (TM, BM, Temsilci / UTT & KD_UTT)

| # | Olay / Durum | Kimden | Kime | Neden E-posta? | Konu ve Taslak İçerik | Durum |
|---|---|---|---|---|---|---|
| 12 | FirmaStore (T-Club) hediye çeki teslim edildiğinde | `odul@cogniti.net` | Talebi açan çalışan | Çek kodu ve kullanım bağlantısının kalıcı kaydı | **Konu:** `FirmaStore hediye çekiniz hazır`<br>`{firma} FirmaStore talebiniz tamamlandı. {urun} · {toplam_tl} TL · Çek kodu: {cek_kodu} [Kullanım bağlantısı]` | **VAR** |
| 13 | FirmaStore çek talebi iptal edildiğinde | `odul@cogniti.net` | Talebi açan çalışan | İptal gerekçesi ve puan iadesi bildirimi | **Konu:** `FirmaStore talebiniz iptal edildi`<br>`{urun} talebiniz "{iptal_nedeni}" gerekçesiyle iptal edilmiş, puanınız hesabınıza iade edilmiştir.` | **YENİ** |
| 14 | BOLIS sınavına hazır listeden davet edildiğinde | `bildirim@cogniti.net` | Davetli katılımcı | Sınav tarih/saati ve doğrudan giriş bağlantısı | **Konu:** `BOLIS sınav davetiniz: {sinav_baslik}`<br>`Merhaba {ad}, {tarih_saat} aralığında yapılacak "{sinav_baslik}" sınavına davet edildiniz. Giriş bağlantısı: {link} (Tek giriş hakkı).` | **YENİ** |
| 15 | Viva canlı yayına harici e-posta ile davet edildiğinde | `bildirim@cogniti.net` | Davet edilen e-posta | Harici katılım bağlantısı ve yayın saati | **Konu:** `Cogniti Viva yayın daveti`<br>`{baslik} Viva yayınına davet edildiniz. Yayın zamanı: {zaman} (TR). Katılım bağlantısı: {link}` | **VAR** |

---

### E. E-Club (Eczacı & Eczane Teknisyeni) & Eczanem (Danışan)

| # | Olay / Durum | Kimden | Kime | Neden E-posta? | Konu ve Taslak İçerik | Durum |
|---|---|---|---|---|---|---|
| 16 | E-Club üyelik daveti gönderildiğinde | `bildirim@cogniti.net` | Davet edilen eczane çalışanı | 24 saatlik tek kullanımlık şifre oluşturma bağlantısı | **Konu:** `Cogniti E-Club üyelik davetiniz`<br>`E-Club üyeliğinizi tamamlamak için kendi şifrenizi oluşturun: [Şifre oluştur] (24 saat geçerli).` | **VAR** |
| 17 | E-Club hediye çeki teslim edildiğinde | `odul@cogniti.net` | Çeki talep eden eczacı *(+ eczanedeki tüm E-Club üyelerine push)* | Çek kodu ve kullanım bağlantısının kalıcı teslimatı | **Konu:** `Hediye çekiniz hazır`<br>`{tutar} TL değerindeki hediye çekiniz hazırdır. Çek kodunuz: {cek_kodu} [Hediye çekini kullan].` | **VAR** |
| 18 | E-Club hediye çeki talebi iptal/reddedildiğinde | `odul@cogniti.net` | Eczacı | İptal gerekçesi ve puan durumu bildirimi | **Konu:** `Hediye çeki talebiniz hakkında`<br>`{tutar} TL tutarındaki hediye çeki talebiniz "{neden}" gerekçesiyle iptal edilmiştir.` | **YENİ** |
| 19 | BOLIS sınavına davet edildiğinde (Eczacı / Teknisyen / Danışan) | `bildirim@cogniti.net` | Hazır listedeki katılımcı | Oturumsuz doğrudan sınav linki + saat bilgisi | **Konu:** `BOLIS sınav davetiniz: {sinav_baslik}`<br>`{tarih_saat} aralığında yapılacak "{sinav_baslik}" sınavına davet edildiniz. Katılım bağlantısı: {link}` | **YENİ** |

---

### F. Agora İş Partneri

| # | Olay / Durum | Kimden | Kime | Neden E-posta? | Konu ve Taslak İçerik | Durum |
|---|---|---|---|---|---|---|
| 20 | İş partnerliği başvurusu yapıldığında | `partner@cogniti.net` | Başvuran partner **+** `info@mill.tr` | Başvuru alındı teyidi + Admin’e yeni başvuru haberi | **Konu:** `Cogniti İş Partnerliği başvurunuz alındı`<br>`Merhaba {ad}, başvurunuz incelenmek üzere alınmıştır; sonuç e-posta ile bildirilecektir.` | **YENİ** |
| 21 | İş partnerliği başvurusu onaylandığında | `partner@cogniti.net` | Onaylanan partner | 48 saatlik partner şifre oluşturma daveti | **Konu:** `Cogniti İş Partnerliği başvurunuz onaylandı`<br>`Partner panelinize giriş yapabilmek için şifrenizi belirleyin: [Şifre oluşturma bağlantısı] (48 saat geçerli).` | **VAR** |
| 22 | İş partnerliği başvurusu reddedildiğinde | `partner@cogniti.net` | Başvuran partner | Profesyonel geri bildirim ve kapanış | **Konu:** `Cogniti İş Partnerliği başvurunuz hakkında`<br>`Merhaba {ad}, başvurunuz değerlendirilmiş olup şu aşamada onaylanamamıştır.` | **YENİ** |
| 23 | Partner şirket profili onaylandığında / revizyon istendiğinde | `partner@cogniti.net` | Partner | Yayın yüklemeye açıldığını veya eksik bilgisini bildirmek | **Konu:** `Partner profiliniz onaylandı` / `Partner profilinizde güncelleme gerekiyor`<br>`Şirket profiliniz onaylandı; artık Agora’da yayın oluşturabilirsiniz.` *(veya eksik alan notu)* | **YENİ** |
| 24 | Agora’da Video / Podcast siparişi geldiğinde | `partner@cogniti.net` | Yayının sahibi Partner | Ticari satış ve net hak ediş bildirimi | **Konu:** `Yeni Agora yayını siparişi: {yayin_adi}`<br>`"{yayin_adi}" yayınınız için yeni sipariş oluşturuldu. Net hak ediş tutarınız: {net_hakedis} TL. Detayları Partner Paneli > Hak Edişlerim ekranından görebilirsiniz.` | **YENİ** |
| 25 | Agora’da Viva Canlı Yayın siparişi geldiğinde | `partner@cogniti.net` | Yayının sahibi Partner | **Kritik:** Partner canlı yayına gireceği tarih/saati mutlaka kaçırmamalı | **Konu:** `Yeni Viva Canlı Yayın siparişi: {yayin_adi}`<br>`"{yayin_adi}" canlı yayınınızın {tarih_saat} oturumu {firma_adi} tarafından sipariş edildi. Kapasite: {kapasite} kişi · Net hak ediş: {net_hakedis} TL. Yayın odası başlangıçtan 15 dk önce açılır.` | **YENİ** |
| 26 | Viva Canlı Yayın başlamadan 1 saat önce hatırlatma | `partner@cogniti.net` | Partner *(ve siparişi veren Üretici)* | Canlı yayının unutulmasını / gecikmesini önlemek | **Konu:** `Hatırlatma: "{yayin_adi}" canlı yayını 1 saat içinde başlıyor`<br>`Saat {saat}’te başlayacak canlı yayınınız için oda 15 dakika önce açılacaktır.` | **YENİ** |
| 27 | Aylık hak ediş / ödeme özeti | `partner@cogniti.net` | Partner | Fatura kesimi ve mutabakat kolaylığı | **Konu:** `{ay_yil} Agora hak ediş özetiniz hazır`<br>`{ay_yil} dönemi toplam satış: {adet}, toplam net hak ediş: {tutar} TL. Ayrıntılar Partner Paneli > Hak Edişlerim ekranındadır.` | **YENİ** |

---

## 4. Önerilen Uygulama Önceliği

| Öncelik | Kapsam | Neden İlk? |
|---|---|---|
| **1. Dalga (Kritik Ticari & Operasyonel)** | #24 Agora Video/Podcast siparişi (Partner), #25 Agora Canlı Yayın siparişi (Partner + #10 Alıcı), #26 Canlı yayın 1 saat kala hatırlatma, #14/#19 BOLIS hazır liste daveti | Canlı yayın kaçırma riskini ve ticari sipariş körlüğünü ortadan kaldırır |
| **2. Dalga (Başvuru & Hesap Döngüsü)** | #2 Müşteri talebi teyidi, #3/#5 Kurumsal başvuru alındı/reddi, #20/#22/#23 Partner başvuru alındı/reddi/profil onayı, #13/#18 Çek iptal bildirimi | Dış paydaşlara eksiksiz kurumsal iletişim sağlar |
| **3. Dalga (Finansal & Yönetimsel)** | #7 Yeni iç kullanıcı daveti, #11 Token bakiye uyarısı, #27 Aylık partner hak ediş özeti, #8 Firma durum bildirimi | Operasyon büyüdükçe manuel takibi sıfırlar |
