# 📕 HapBilgi — REDBOOK (Açık İşler ve Teknik Borç Sicili)

*Açık işler ve teknik borçların çalışma nüshası. Kesin/mühürlü kararlar BLUEBOOK'ta; burada henüz kapanmamış, bekleyen veya sonraya bırakılmış kalemler tutulur.*

---

## § 6.4 — Açık İşler / Çalışma Nüshası

### Kasada Bekleyen Geliştirmeler

- **Eczanem–E-Club bağımlılığının veritabanı kurulumu.** Uygulama erişimi ve admin aç/kapat işlemleri aynı firmada iki modülün açık olmasını zorunlu kılacak şekilde düzeltildi. `scripts/sql/eczanem_eclub_modul_bagimliligi.sql` hazırlanmıştır; canlıda çalıştırılmadı. SQL, tutarsız mevcut bayrakları kapatır, CHECK ve kapanış trigger'ını kurar. Kullanıcı başarı sonucunda `sql_sonucu=TAMAMLANDI`, `tutarsiz_firma_sayisi=0`, `kisit_mevcut=true`, `tetikleyici_mevcut=true` değerlerini doğrulamadan bu iş kapanmış sayılmaz. *21 Ekim 2026.*

- **HBStore: dönemlik kullanım.** Mağaza kullanımını takvim çeyreklerine göre düzenle. Önceden belirtilen kurgu: her dönemin son haftasında açık; dönemin son günü 23:59'da kapanır ve sonraki dönemin son haftasında yeniden açılır.
- **E-Club Store: aylık kullanım.** Mağaza kullanımını aylık olarak düzenle. Ay içindeki açılış/kapanış günleri henüz belirlenmedi.

*Kayıt tarihi: 9 Eylül 2026 — İskender talebiyle hatırlatma olarak kasaya alındı; uygulama yapılmadı.*

- **API–RPC iş kuralı uyumu incelemesi.** HapBilgi API'lerini tarayarak hangilerinin RPC kullandığını, hangilerinde RPC gerekip gerekmediğini ve RPC kullanan işlemlerde API ile RPC'nin yetki, kapsam ve iş kurallarının paralel olup olmadığını kontrol et. Bulguları ve olası güvenlik boşluklarını raporla; bu hatırlatma uygulama değişikliği yetkisi vermez.

*Kayıt tarihi: 2 Ekim 2026 — İskender talebiyle hatırlatma olarak eklendi; inceleme yapılmadı.*

### Teknik Borç

- **[TB-01] İzleme tablolarında soru-hakkı alan asimetrisi (tek-kaynak yönetimi).**
  Dört izleme tablosu soru hakkını tek tip tutmuyor: `izleme_kayitlari` (UTT) ve
  `eclub_izleme_kayitlari` (E-Club) `soru_hakki_var_mi` + `soru_hakki_nedeni`
  kullanırken; `cc_izleme_kayitlari` (BM) ve `eczanem_izleme_kayitlari` (müşteri)
  `cevaplandi_mi` kullanıyor. Soru-kesinti kuralı, dördüne eklenen tek tip
  `soru_erisimi_acik_mi` kapısıyla **davranış olarak** tekleştirildi; ancak eski
  iki alan yerinde kaldığından aynı alanda **üç bayrak** yan yana yaşıyor.
  **Bekleyen iş:** soru-hakkı kavramını tek alan/tek kaynağa indirgeyen refactor.
  Puan ve uygunluk mantığına dokunacağı için ayrı, kapsamlı ve riskli bir iştir;
  soru-kesinti kuralı canlıda oturduktan sonra ele alınmalıdır.
  *Kayıt tarihi: 30 Ağustos 2026 — İskender talebiyle.*

- **[TB-02] Dijital Broşür ve Literatür üretici inceleme/revizyon deneyimi.**
  İÜ yükleme ve teslim güvenliği modernize edildi; üretici inceleme arayüzünün
  kalan iyileştirmeleri kullanıcı kararıyla sonraya bırakıldı. Literatür
  incelemesinde isteğe bağlı yayın görseli PDF yanında gösterilmeli; kapak yoksa
  varsayılan Literatür kapağı kullanılmalı. Dijital Broşür ve Literatürde dosya
  doğrulama bilgileri açık gösterilmeli, revizyonda mevcut dosyalar korunmalı ve
  yalnız değiştirilen PDF/kapak/ana görselin yeniden yüklenmesine izin veren akış
  tamamlanmalıdır. Ham Bunny Storage yolları istemciye açılmamalıdır.
  *Kayıt tarihi: 15 Eylül 2026 — İskender talebiyle Faz 4 ertelendi.*

- **[TB-03] Viva özel davetinde gerçek e-posta teslimatı ve uçtan uca doğrulama kontrolü.**
  Mevcut test hesaplarının e-posta adresleri sentetiktir. Gerçek adrese kodun
  ulaşması, kodla giriş ve HttpOnly misafir oturumunun gerçek tarayıcıda
  sürmesi henüz doğrulanmadı. SQL erişim/kod/süre kuralları kullanıcı tarafından;
  uygulama gönderim davranışı sahte taşıma katmanıyla sınandı. Bu kontroller
  gerçek e-posta teslimatı yerine geçmez. Gönderici domaini/adresi ve Resend
  yapılandırması hazır olduğunda izinli gerçek test adresiyle kontrol edilecek;
  kod ve oturum bilgileri belgelere yazılmayacak. Davet iptali ve etkinlik
  bitiminde doğrulanmış misafir oturumunun kapanması da aynı akışta sınanacak.
  **Durum: AÇIK — kullanıcı kararıyla teknik borca alındı; Viva 1. aşamasının
  kapanışını bekletmeyecek.** Doğrulama gereksinimi uygulamada korunur.
  *Kayıt tarihi: 25 Ekim 2026 — İskender talebiyle.*
