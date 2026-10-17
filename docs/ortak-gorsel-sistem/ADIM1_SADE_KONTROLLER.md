# Adım 1 — Sade Kontroller kaynak ve görünüm referansı

**Durum:** Tarihsel kaynak referansı. Bileşen ortaklaştırması kullanıcı kararıyla kapsamdan çıkarıldı (17 Ekim 2026); çalışma yalnız renk sistemi ve çift tema üzerinden devam edecek. Kaynak eşlemesi ve kısmi örnek ekran kaydı renk çalışmasında referans olarak korunur. Bu hazırlıkta uygulama kaynakları değiştirilmedi. Güncel kapsam [tema altyapısı kaydındadır](../TEMA_ALTYAPISI.md); her kullanımın farkları korunur ve bu tek ekran platformu temsil etmez.

## 1. Kaynak kapsamı

Renk envanteri yeniden çıkarılmadı. Mevcut 1.205 kaynak üzerinden çalışma zamanı import/reexport, sabit adresli dinamik import ve JSX bağlantıları çıkarıldı. 59 dosyada doğrudan import bulunur; bunların 2'si aile içindedir, **57'si aile dışı kullanım dosyasıdır**. Dolaylı grafikte 3 aile kaynağı dahil 129 dosya, 47 rota kaynağı bulunur. İzlenen aile ve sarmalayıcılarda 195 JSX kaynak noktası kayıtlıdır. Bunlar ekranda aynı anda çizilen öğe sayıları değildir.

İthalat erişimi olası etkidir. Koşullu çizim, yönlendirme, rol yetkisi veya layout üzerinden gelen görünüm ayrıca doğrulanır. Her sayfa/rolün tarayıcıdan sınandığı sonucu çıkarılmaz.

## 2. Önceden kaydedilen örnek ekran

- **UTT → Eğitim Yayınları → Ürün Eğitimleri**: `/videolarim/urun`.
- Menü: `panelNav.config.ts`; kategori: `uttVideoKategorileri.ts`; sayfa guardı `TUKETICI_ROLLER` (UTT/KD_UTT).
- Bileşen zinciri: `UttAnaSayfa` → `UttYayinTuruToggle` → `PeriyotButonlari` → `SadeKapsulFiltre`. Arama alanı: `ListeArama` → `SadeListeSecimi`.
- Gerçek Chrome ekranında seçili filtre **Tümü**; yayın türü sayıları, kart bilgileri ve puanlar mevcut halleriyle görüldü. Veri/ölçü/renk değiştiren işlem yapılmadı.

### Kaydedilen ekranlar

- [utt-urun-egitimleri-1440x1000.jpg](referanslar/utt-urun-egitimleri-1440x1000.jpg): **1440 × 1000** piksel.
- [utt-urun-egitimleri-baslangic.jpg](referanslar/utt-urun-egitimleri-baslangic.jpg): **651 × 773** piksel.

**Tarihsel açık kontrol:** Mobil görüntü ve hesaplanmış DOM stil/ölçü kaydı alınamadı. Chrome otomasyon bağlantısında zaman aşımı/kopma yaşandı; yeniden bağlanma, geçici viewport reset ve geçici sekme kapatma çağrıları debugger bağlantı hatası verdi. Bu kontroller tamamlanmış sayılmadı. Son kullanıcı düzeltmesiyle bu ekranın pilot/temsilci rolü kaldırıldı; eksik kayıtlar genel kaynak eşlemesinin veya renk karşılıklarının hazırlanmasının ön koşulu değildir. Gerekli ekran kontrolü değişiklikten etkilenen gerçek kullanım bağlamına göre belirlenir.

## 3. Mevcut farklar — korunacak kaynak tanımları

| Kaynak / durum | Mevcut tanım | İşlem durumu |
| --- | --- | --- |
| Kişi seçimi | 40 px yükseklik, 14 px köşe, 11 px / 800 yazı | Değer kaydı; değişiklik yok |
| Tablo sürümü | 40 px yükseklik, 10 px köşe, ayrı min-width | Değer kaydı; değişiklik yok |
| Kapsül filtre | 30 px iç buton, 4 px padding, 1 px kenarlık, 11 px / 800 yazı | Değer kaydı; değişiklik yok |
| Altı çizgili sekme | 13 px / 800 yazı, 24 px gap; 480 px altında 16 px gap | Değer kaydı; değişiklik yok |
| Menü / seçenek / arama | Menü 260 px; seçenek ve arama yazısı 13 px; alt bilgi 11 px | Aynı aile içindeki farklı değerler korunur |
| Dokunmatik cihaz | Seçenek min-height 44 px; arama/native/form tetikleyicisinde 16 px yazı | Mevcut medya koşulu korunur |
| Radix Select | Aynı CSS ile Radix Select olay/portal/scroll sözleşmesi ve ek Tailwind stilleri | SadeSecim ile birleştirme kapsam dışı |
| Eczanem sipariş kuyruğu tablo filtresi | `h-auto`, `w-auto`, `text-[10px]`, `border-0`, `bg-transparent`, özel metin rengi | Görünümü eşitleme/standarda çekme onayı yok |
| Kişi sarmalayıcısı | Ecz./Ecz.Tekn. önekleri; otomatik seçim başlığı ve mevcut kimlikler | Davranış kaydı; değişiklik yok |
| Depo seçimi | Asenkron arama/kayıt/ref ve klavye sözleşmesi | Görsel kaynak kaydı; veri/kayıt akışı ayrı kalır |

Bu tablo CSS kaynak değerlerini gösterir. Hesaplanmış ekran stilleri ölçülmüş gibi sunulmaz. Bütün 221 bildirim, seçici ve medya koşulu [JSON referansında](SADE_KONTROL_CSS_REFERANSI.json) değişmeden kayıtlıdır.

## 4. Ortak kaynakların dışa aktarımları

| Kaynak | İşlev |
| --- | --- |
| [components/kontrol/KisiKontroller.tsx:16](</Users/iskendereser/Desktop/hapbilgi/components/kontrol/KisiKontroller.tsx:16>) | `kisiGorunenAdi` |
| [components/kontrol/KisiKontroller.tsx:35](</Users/iskendereser/Desktop/hapbilgi/components/kontrol/KisiKontroller.tsx:35>) | `SadeKisiSecimi` |
| [components/kontrol/KisiKontroller.tsx:42](</Users/iskendereser/Desktop/hapbilgi/components/kontrol/KisiKontroller.tsx:42>) | `SadeKisiCokluSecimi` |
| [components/kontrol/SadeKontroller.tsx:18](</Users/iskendereser/Desktop/hapbilgi/components/kontrol/SadeKontroller.tsx:18>) | `SadeAsagiOk` |
| [components/kontrol/SadeKontroller.tsx:44](</Users/iskendereser/Desktop/hapbilgi/components/kontrol/SadeKontroller.tsx:44>) | `SadeSecim` |
| [components/kontrol/SadeKontroller.tsx:89](</Users/iskendereser/Desktop/hapbilgi/components/kontrol/SadeKontroller.tsx:89>) | `SadeTabloSecimi` |
| [components/kontrol/SadeKontroller.tsx:93](</Users/iskendereser/Desktop/hapbilgi/components/kontrol/SadeKontroller.tsx:93>) | `SadeKapsulFiltre` |
| [components/kontrol/SadeKontroller.tsx:101](</Users/iskendereser/Desktop/hapbilgi/components/kontrol/SadeKontroller.tsx:101>) | `SadeZamanToggle` |
| [components/kontrol/SadeKontroller.tsx:108](</Users/iskendereser/Desktop/hapbilgi/components/kontrol/SadeKontroller.tsx:108>) | `SadeSekmeler` |
| [components/kontrol/SadeKontroller.tsx:123](</Users/iskendereser/Desktop/hapbilgi/components/kontrol/SadeKontroller.tsx:123>) | `SadeCokluAliciSecimi` |
| [components/kontrol/SadeKontroller.tsx:152](</Users/iskendereser/Desktop/hapbilgi/components/kontrol/SadeKontroller.tsx:152>) | `SadeAySecimi` |
| [components/kontrol/SadeKontroller.tsx:174](</Users/iskendereser/Desktop/hapbilgi/components/kontrol/SadeKontroller.tsx:174>) | `SadeFormSecimi` |
| [components/kontrol/SadeKontroller.tsx:184](</Users/iskendereser/Desktop/hapbilgi/components/kontrol/SadeKontroller.tsx:184>) | `SadeTarihAlani` |
| [components/kontrol/SadeKontroller.tsx:189](</Users/iskendereser/Desktop/hapbilgi/components/kontrol/SadeKontroller.tsx:189>) | `SadeListeSecimi` |
| [components/kontrol/SadeKontroller.tsx:222](</Users/iskendereser/Desktop/hapbilgi/components/kontrol/SadeKontroller.tsx:222>) | `SadeKontrolGrubu` |
| [components/kontrol/SadeKontroller.tsx:236](</Users/iskendereser/Desktop/hapbilgi/components/kontrol/SadeKontroller.tsx:236>) | `SadeKontrolButonu` |
| [components/kontrol/SadeKontroller.tsx:240](</Users/iskendereser/Desktop/hapbilgi/components/kontrol/SadeKontroller.tsx:240>) | `SadeIslemButonu` |
| [components/kontrol/SadeKontroller.tsx:245](</Users/iskendereser/Desktop/hapbilgi/components/kontrol/SadeKontroller.tsx:245>) | `SadeSecimButonu` |
| [components/kontrol/SadeKontroller.tsx:249](</Users/iskendereser/Desktop/hapbilgi/components/kontrol/SadeKontroller.tsx:249>) | `SadeSecimMenusu` |
| [components/kontrol/SadeKontroller.tsx:253](</Users/iskendereser/Desktop/hapbilgi/components/kontrol/SadeKontroller.tsx:253>) | `SadeAramaAlani` |
| [components/kontrol/SadeKontroller.tsx:257](</Users/iskendereser/Desktop/hapbilgi/components/kontrol/SadeKontroller.tsx:257>) | `SadeSecimSecenegi` |

## 5. Bütün doğrudan importlar

| Dosya | Kaynak | İthal edilen adlar |
| --- | --- | --- |
| [app/(panel)/challenge-club/page.tsx:9](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/challenge-club/page.tsx:9>) | `components/kontrol/SadeKontroller.tsx` | SadeKontrolButonu, SadeKontrolGrubu |
| [app/(panel)/eclub/hediye-takip/_components/CekTakipFiltreleri.tsx:1](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/hediye-takip/_components/CekTakipFiltreleri.tsx:1>) | `components/kontrol/KisiKontroller.tsx` | SadeKisiSecimi |
| [app/(panel)/eclub/hediye-takip/_components/CekTakipFiltreleri.tsx:2](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/hediye-takip/_components/CekTakipFiltreleri.tsx:2>) | `components/kontrol/SadeKontroller.tsx` | SadeListeSecimi, SadeTarihAlani |
| [app/(panel)/eclub/hediye-takip/_components/HediyeTakipToggle.tsx:1](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/hediye-takip/_components/HediyeTakipToggle.tsx:1>) | `components/kontrol/SadeKontroller.tsx` | SadeKontrolButonu, SadeKontrolGrubu |
| [app/(panel)/eclub/hediye-takip/_components/SiparisTakipFiltreleri.tsx:1](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/hediye-takip/_components/SiparisTakipFiltreleri.tsx:1>) | `components/kontrol/KisiKontroller.tsx` | SadeKisiSecimi |
| [app/(panel)/eclub/hediye-takip/_components/SiparisTakipFiltreleri.tsx:2](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/hediye-takip/_components/SiparisTakipFiltreleri.tsx:2>) | `components/kontrol/SadeKontroller.tsx` | SadeListeSecimi, SadeTarihAlani |
| [app/(panel)/eclub/yayinlar/_components/BmEclubYayinlari.tsx:3](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/yayinlar/_components/BmEclubYayinlari.tsx:3>) | `components/kontrol/KisiKontroller.tsx` | SadeKisiSecimi |
| [app/(panel)/eclub/yayinlar/_components/EclubGonderimDetayKarti.tsx:3](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/yayinlar/_components/EclubGonderimDetayKarti.tsx:3>) | `components/kontrol/SadeKontroller.tsx` | SadeKontrolGrubu, SadeKontrolButonu |
| [app/(panel)/eczanem/_components/MutabakatIslemTablosu.tsx:3](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eczanem/_components/MutabakatIslemTablosu.tsx:3>) | `components/kontrol/SadeKontroller.tsx` | SadeTabloSecimi |
| [app/(panel)/eczanem/bm/mutabakat/_components/BmMutabakatTakipClient.tsx:3](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eczanem/bm/mutabakat/_components/BmMutabakatTakipClient.tsx:3>) | `components/kontrol/SadeKontroller.tsx` | SadeAySecimi |
| [app/(panel)/eczanem/eczane/_components/EczanemSiparisKuyrugu.tsx:4](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eczanem/eczane/_components/EczanemSiparisKuyrugu.tsx:4>) | `components/kontrol/SadeKontroller.tsx` | SadeKontrolButonu, SadeKontrolGrubu |
| [app/(panel)/eczanem/utt/mutabakat/page.tsx:3](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eczanem/utt/mutabakat/page.tsx:3>) | `components/kontrol/SadeKontroller.tsx` | SadeAySecimi |
| [app/(panel)/kullanicilar/page.tsx:4](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/kullanicilar/page.tsx:4>) | `components/kontrol/SadeKontroller.tsx` | SadeFormSecimi |
| [app/(panel)/oneriler/_components/BmOneriTakibi.tsx:3](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/oneriler/_components/BmOneriTakibi.tsx:3>) | `components/kontrol/KisiKontroller.tsx` | SadeKisiSecimi |
| [app/(panel)/oneriler/_components/BmOneriTakibi.tsx:4](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/oneriler/_components/BmOneriTakibi.tsx:4>) | `components/kontrol/SadeKontroller.tsx` | SadeListeSecimi |
| [app/(panel)/oneriler/_components/TmOneriTakibi.tsx:3](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/oneriler/_components/TmOneriTakibi.tsx:3>) | `components/kontrol/KisiKontroller.tsx` | SadeKisiSecimi |
| [app/(panel)/raporlar/tclub-uretici/page.tsx:3](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/raporlar/tclub-uretici/page.tsx:3>) | `components/kontrol/SadeKontroller.tsx` | SadeKontrolButonu, SadeKontrolGrubu |
| [app/(panel)/store/[urun_id]/page.tsx:8](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/store/[urun_id]/page.tsx:8>) | `components/kontrol/SadeKontroller.tsx` | SadeListeSecimi |
| [app/(panel)/store/page.tsx:8](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/store/page.tsx:8>) | `components/kontrol/SadeKontroller.tsx` | SadeKontrolButonu, SadeKontrolGrubu |
| [app/(panel)/store/siparisler/_components/SiparisFiltreleri.tsx:14](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/store/siparisler/_components/SiparisFiltreleri.tsx:14>) | `components/kontrol/KisiKontroller.tsx` | SadeKisiSecimi |
| [app/(panel)/store/siparisler/_components/SiparisFiltreleri.tsx:15](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/store/siparisler/_components/SiparisFiltreleri.tsx:15>) | `components/kontrol/SadeKontroller.tsx` | SadeListeSecimi, SadeTarihAlani |
| [app/(panel)/talepler/_components/EkDosyaYukleme.tsx:10](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/talepler/_components/EkDosyaYukleme.tsx:10>) | `components/kontrol/SadeKontroller.tsx` | SadeIslemButonu |
| [app/(panel)/talepler/_components/IsListesi.tsx:18](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/talepler/_components/IsListesi.tsx:18>) | `components/kontrol/SadeKontroller.tsx` | SadeListeSecimi |
| [app/(panel)/talepler/_components/PodcastTalepAlanlari.tsx:4](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/talepler/_components/PodcastTalepAlanlari.tsx:4>) | `components/kontrol/SadeKontroller.tsx` | SadeKapsulFiltre |
| [app/(panel)/talepler/_components/SoruSetiAyarlari.tsx:8](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/talepler/_components/SoruSetiAyarlari.tsx:8>) | `components/kontrol/SadeKontroller.tsx` | SadeFormSecimi |
| [app/(panel)/talepler/_components/UrunTeknikSecici.tsx:9](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/talepler/_components/UrunTeknikSecici.tsx:9>) | `components/kontrol/SadeKontroller.tsx` | SadeFormSecimi |
| [app/(panel)/talepler/_components/YeniTalepFormV2.tsx:13](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/talepler/_components/YeniTalepFormV2.tsx:13>) | `components/kontrol/SadeKontroller.tsx` | SadeFormSecimi, SadeIslemButonu, SadeKontrolButonu, SadeKontrolGrubu |
| [app/(panel)/yayin-yonetimi/_components/BekleyenSatir.tsx:11](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/yayin-yonetimi/_components/BekleyenSatir.tsx:11>) | `components/kontrol/SadeKontroller.tsx` | SadeFormSecimi |
| [app/(panel)/yayin-yonetimi/_components/SoruListesi.tsx:11](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/yayin-yonetimi/_components/SoruListesi.tsx:11>) | `components/kontrol/SadeKontroller.tsx` | SadeFormSecimi |
| [app/(panel)/yayin-yonetimi/_components/YayinKumandaPaneli.tsx:4](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/yayin-yonetimi/_components/YayinKumandaPaneli.tsx:4>) | `components/kontrol/SadeKontroller.tsx` | SadeKontrolButonu, SadeKontrolGrubu |
| [app/admin/_components/KullaniciDuzenleModal.tsx:15](</Users/iskendereser/Desktop/hapbilgi/app/admin/_components/KullaniciDuzenleModal.tsx:15>) | `components/kontrol/SadeKontroller.tsx` | SadeFormSecimi |
| [app/admin/_components/KullaniciListesi.tsx:9](</Users/iskendereser/Desktop/hapbilgi/app/admin/_components/KullaniciListesi.tsx:9>) | `components/kontrol/SadeKontroller.tsx` | SadeFormSecimi, SadeListeSecimi |
| [app/admin/_components/ModulSekmeBari.tsx:11](</Users/iskendereser/Desktop/hapbilgi/app/admin/_components/ModulSekmeBari.tsx:11>) | `components/kontrol/SadeKontroller.tsx` | SadeKontrolButonu, SadeKontrolGrubu |
| [app/admin/_components/TekilGirisFormu.tsx:9](</Users/iskendereser/Desktop/hapbilgi/app/admin/_components/TekilGirisFormu.tsx:9>) | `components/kontrol/SadeKontroller.tsx` | SadeFormSecimi |
| [app/admin/_components/UrunTeknikYonetimi.tsx:8](</Users/iskendereser/Desktop/hapbilgi/app/admin/_components/UrunTeknikYonetimi.tsx:8>) | `components/kontrol/SadeKontroller.tsx` | SadeFormSecimi |
| [app/admin/_components/global/UretimAtamaPaneli.tsx:3](</Users/iskendereser/Desktop/hapbilgi/app/admin/_components/global/UretimAtamaPaneli.tsx:3>) | `components/kontrol/KisiKontroller.tsx` | SadeKisiSecimi |
| [app/admin/eclub-cek-teslimat/_components/EclubStoreSiparislerSekmesi.tsx:3](</Users/iskendereser/Desktop/hapbilgi/app/admin/eclub-cek-teslimat/_components/EclubStoreSiparislerSekmesi.tsx:3>) | `components/kontrol/SadeKontroller.tsx` | SadeKontrolButonu, SadeKontrolGrubu |
| [app/admin/eclub/_components/EclubYonetimPaneli.tsx:10](</Users/iskendereser/Desktop/hapbilgi/app/admin/eclub/_components/EclubYonetimPaneli.tsx:10>) | `components/kontrol/SadeKontroller.tsx` | SadeListeSecimi |
| [app/admin/store/_components/SekmeBari.tsx:6](</Users/iskendereser/Desktop/hapbilgi/app/admin/store/_components/SekmeBari.tsx:6>) | `components/kontrol/SadeKontroller.tsx` | SadeKontrolButonu, SadeKontrolGrubu |
| [app/admin/store/_components/SiparisYonetimModal.tsx:12](</Users/iskendereser/Desktop/hapbilgi/app/admin/store/_components/SiparisYonetimModal.tsx:12>) | `components/kontrol/SadeKontroller.tsx` | SadeFormSecimi |
| [app/admin/store/_components/UrunModal.tsx:18](</Users/iskendereser/Desktop/hapbilgi/app/admin/store/_components/UrunModal.tsx:18>) | `components/kontrol/SadeKontroller.tsx` | SadeFormSecimi |
| [components/DurumAnahtari.tsx:19](</Users/iskendereser/Desktop/hapbilgi/components/DurumAnahtari.tsx:19>) | `components/kontrol/SadeKontroller.tsx` | SadeKontrolButonu, SadeKontrolGrubu |
| [components/ana-sayfa/TmAnaSayfa.tsx:5](</Users/iskendereser/Desktop/hapbilgi/components/ana-sayfa/TmAnaSayfa.tsx:5>) | `components/kontrol/SadeKontroller.tsx` | SadeKontrolButonu, SadeKontrolGrubu |
| [components/challenge-club/ChallengeGonderPaneli.tsx:3](</Users/iskendereser/Desktop/hapbilgi/components/challenge-club/ChallengeGonderPaneli.tsx:3>) | `components/kontrol/KisiKontroller.tsx` | SadeKisiCokluSecimi |
| [components/eclub/DepoAramaliSecim.tsx:3](</Users/iskendereser/Desktop/hapbilgi/components/eclub/DepoAramaliSecim.tsx:3>) | `components/kontrol/SadeKontroller.tsx` | SadeAramaAlani, SadeSecimButonu, SadeSecimMenusu, SadeSecimSecenegi |
| [components/eclub/DepoTercihFormu.tsx:3](</Users/iskendereser/Desktop/hapbilgi/components/eclub/DepoTercihFormu.tsx:3>) | `components/kontrol/SadeKontroller.tsx` | SadeFormSecimi |
| [components/eclub/EclubFirmaCalismaAlani.tsx:12](</Users/iskendereser/Desktop/hapbilgi/components/eclub/EclubFirmaCalismaAlani.tsx:12>) | `components/kontrol/SadeKontroller.tsx` | SadeKontrolGrubu, SadeKontrolButonu |
| [components/hbligi/league/BmLeaguePage.tsx:3](</Users/iskendereser/Desktop/hapbilgi/components/hbligi/league/BmLeaguePage.tsx:3>) | `components/kontrol/SadeKontroller.tsx` | SadeKontrolButonu, SadeKontrolGrubu |
| [components/hbligi/league/CompetitorComparison.tsx:5](</Users/iskendereser/Desktop/hapbilgi/components/hbligi/league/CompetitorComparison.tsx:5>) | `components/kontrol/SadeKontroller.tsx` | SadeListeSecimi |
| [components/hbligi/league/LeaguePage.tsx:8](</Users/iskendereser/Desktop/hapbilgi/components/hbligi/league/LeaguePage.tsx:8>) | `components/kontrol/SadeKontroller.tsx` | SadeKontrolButonu, SadeKontrolGrubu |
| [components/hbligi/league/TmLeaguePage.tsx:3](</Users/iskendereser/Desktop/hapbilgi/components/hbligi/league/TmLeaguePage.tsx:3>) | `components/kontrol/SadeKontroller.tsx` | SadeKontrolButonu, SadeKontrolGrubu |
| [components/hbligi/producer/ProducerLeaguePage.tsx:3](</Users/iskendereser/Desktop/hapbilgi/components/hbligi/producer/ProducerLeaguePage.tsx:3>) | `components/kontrol/SadeKontroller.tsx` | SadeKontrolButonu, SadeKontrolGrubu |
| [components/kontrol/KisiKontroller.tsx:5](</Users/iskendereser/Desktop/hapbilgi/components/kontrol/KisiKontroller.tsx:5>) | `components/kontrol/SadeKontroller.tsx` | SadeCokluAliciSecimi, SadeSecim |
| [components/kontrol/SadeKontroller.tsx:9](</Users/iskendereser/Desktop/hapbilgi/components/kontrol/SadeKontroller.tsx:9>) | `components/kontrol/sade-kontroller.module.css` | default |
| [components/liste/ListeArama.tsx:12](</Users/iskendereser/Desktop/hapbilgi/components/liste/ListeArama.tsx:12>) | `components/kontrol/SadeKontroller.tsx` | SadeListeSecimi |
| [components/ogrenme-araci/YayinTuruFiltresi.tsx:3](</Users/iskendereser/Desktop/hapbilgi/components/ogrenme-araci/YayinTuruFiltresi.tsx:3>) | `components/kontrol/SadeKontroller.tsx` | SadeKapsulFiltre |
| [components/raporlar/DagilimGrafik.tsx:12](</Users/iskendereser/Desktop/hapbilgi/components/raporlar/DagilimGrafik.tsx:12>) | `components/kontrol/SadeKontroller.tsx` | SadeKontrolButonu, SadeKontrolGrubu |
| [components/raporlar/DavranisRaporu.tsx:3](</Users/iskendereser/Desktop/hapbilgi/components/raporlar/DavranisRaporu.tsx:3>) | `components/kontrol/SadeKontroller.tsx` | SadeKontrolButonu, SadeKontrolGrubu |
| [components/raporlar/TemsilciSecici.tsx:3](</Users/iskendereser/Desktop/hapbilgi/components/raporlar/TemsilciSecici.tsx:3>) | `components/kontrol/KisiKontroller.tsx` | SadeKisiSecimi |
| [components/raporlar/YayinDetayModal.tsx:4](</Users/iskendereser/Desktop/hapbilgi/components/raporlar/YayinDetayModal.tsx:4>) | `components/kontrol/SadeKontroller.tsx` | SadeKontrolButonu, SadeKontrolGrubu |
| [components/ui/periyot-butonlari.tsx:3](</Users/iskendereser/Desktop/hapbilgi/components/ui/periyot-butonlari.tsx:3>) | `components/kontrol/SadeKontroller.tsx` | SadeKapsulFiltre |
| [components/ui/select.tsx:7](</Users/iskendereser/Desktop/hapbilgi/components/ui/select.tsx:7>) | `components/kontrol/SadeKontroller.tsx` | SadeAsagiOk |
| [components/ui/select.tsx:8](</Users/iskendereser/Desktop/hapbilgi/components/ui/select.tsx:8>) | `components/kontrol/sade-kontroller.module.css` | default |
| [components/yayin/BmOneriGonderimPaneli.tsx:3](</Users/iskendereser/Desktop/hapbilgi/components/yayin/BmOneriGonderimPaneli.tsx:3>) | `components/kontrol/SadeKontroller.tsx` | SadeTarihAlani |

## 6. Rota kaynakları ve örnek import zincirleri

| Rota | Kaynak | Örnek statik bağlantı |
| --- | --- | --- |
| `/ana-sayfa` | [app/(panel)/ana-sayfa/page.tsx](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/ana-sayfa/page.tsx>) | app/(panel)/ana-sayfa/page.tsx → components/ana-sayfa/UreticiAnaSayfa.tsx → components/liste/index.ts → components/liste/ListeArama.tsx → components/kontrol/SadeKontroller.tsx |
| `/cc-ligi` | [app/(panel)/cc-ligi/page.tsx](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/cc-ligi/page.tsx>) | app/(panel)/cc-ligi/page.tsx → components/cc-ligi/CcLigiPeriyotSecici.tsx → components/ui/periyot-butonlari.tsx → components/kontrol/SadeKontroller.tsx |
| `/challenge-club` | [app/(panel)/challenge-club/page.tsx](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/challenge-club/page.tsx>) | app/(panel)/challenge-club/page.tsx → components/kontrol/SadeKontroller.tsx |
| `/eclub/eczanelerim` | [app/(panel)/eclub/eczanelerim/page.tsx](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/eczanelerim/page.tsx>) | app/(panel)/eclub/eczanelerim/page.tsx → app/(panel)/eclub/listem/_components/EczaneBlogu.tsx → components/ui/select.tsx → components/kontrol/SadeKontroller.tsx |
| `/eclub/firma/[firma_id]/cek-talepleri` | [app/(panel)/eclub/firma/[firma_id]/cek-talepleri/page.tsx](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/firma/[firma_id]/cek-talepleri/page.tsx>) | app/(panel)/eclub/firma/[firma_id]/cek-talepleri/page.tsx → components/eclub/EclubFirmaCalismaAlani.tsx → components/kontrol/SadeKontroller.tsx |
| `/eclub/firma/[firma_id]/hediye-ceki-takibi` | [app/(panel)/eclub/firma/[firma_id]/hediye-ceki-takibi/page.tsx](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/firma/[firma_id]/hediye-ceki-takibi/page.tsx>) | app/(panel)/eclub/firma/[firma_id]/hediye-ceki-takibi/page.tsx → components/eclub/EclubFirmaCalismaAlani.tsx → components/kontrol/SadeKontroller.tsx |
| `/eclub/firma/[firma_id]/hediye-ceki-talebi` | [app/(panel)/eclub/firma/[firma_id]/hediye-ceki-talebi/page.tsx](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/firma/[firma_id]/hediye-ceki-talebi/page.tsx>) | app/(panel)/eclub/firma/[firma_id]/hediye-ceki-talebi/page.tsx → components/eclub/EclubFirmaCalismaAlani.tsx → components/kontrol/SadeKontroller.tsx |
| `/eclub/firma/[firma_id]/hediye-cekleri` | [app/(panel)/eclub/firma/[firma_id]/hediye-cekleri/page.tsx](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/firma/[firma_id]/hediye-cekleri/page.tsx>) | app/(panel)/eclub/firma/[firma_id]/hediye-cekleri/page.tsx → components/eclub/EclubFirmaCalismaAlani.tsx → components/kontrol/SadeKontroller.tsx |
| `/eclub/firma/[firma_id]/performans` | [app/(panel)/eclub/firma/[firma_id]/performans/page.tsx](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/firma/[firma_id]/performans/page.tsx>) | app/(panel)/eclub/firma/[firma_id]/performans/page.tsx → components/eclub/EclubFirmaCalismaAlani.tsx → components/kontrol/SadeKontroller.tsx |
| `/eclub/firma/[firma_id]/yayin-tamamlama-performansi` | [app/(panel)/eclub/firma/[firma_id]/yayin-tamamlama-performansi/page.tsx](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/firma/[firma_id]/yayin-tamamlama-performansi/page.tsx>) | app/(panel)/eclub/firma/[firma_id]/yayin-tamamlama-performansi/page.tsx → components/eclub/EclubFirmaCalismaAlani.tsx → components/kontrol/SadeKontroller.tsx |
| `/eclub/firma/[firma_id]/yayinlar` | [app/(panel)/eclub/firma/[firma_id]/yayinlar/page.tsx](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/firma/[firma_id]/yayinlar/page.tsx>) | app/(panel)/eclub/firma/[firma_id]/yayinlar/page.tsx → components/eclub/EclubFirmaCalismaAlani.tsx → components/kontrol/SadeKontroller.tsx |
| `/eclub/hediye-takip` | [app/(panel)/eclub/hediye-takip/page.tsx](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/hediye-takip/page.tsx>) | app/(panel)/eclub/hediye-takip/page.tsx → app/(panel)/eclub/hediye-takip/_components/HediyeTakipIstemcisi.tsx → app/(panel)/eclub/hediye-takip/_components/CekTakipFiltreleri.tsx → components/kontrol/KisiKontroller.tsx |
| `/eclub/ligi` | [app/(panel)/eclub/ligi/page.tsx](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/ligi/page.tsx>) | app/(panel)/eclub/ligi/page.tsx → components/hbligi/HbLigiPeriyotSecici.tsx → components/ui/periyot-butonlari.tsx → components/kontrol/SadeKontroller.tsx |
| `/eclub/yayinlar` | [app/(panel)/eclub/yayinlar/page.tsx](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/yayinlar/page.tsx>) | app/(panel)/eclub/yayinlar/page.tsx → components/ui/periyot-butonlari.tsx → components/kontrol/SadeKontroller.tsx |
| `/eczanem/bm/mutabakat` | [app/(panel)/eczanem/bm/mutabakat/page.tsx](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eczanem/bm/mutabakat/page.tsx>) | app/(panel)/eczanem/bm/mutabakat/page.tsx → app/(panel)/eczanem/bm/mutabakat/_components/BmMutabakatTakipClient.tsx → components/kontrol/SadeKontroller.tsx |
| `/eczanem/eczane/inidirm-onayi` | [app/(panel)/eczanem/eczane/inidirm-onayi/page.tsx](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eczanem/eczane/inidirm-onayi/page.tsx>) | app/(panel)/eczanem/eczane/inidirm-onayi/page.tsx → app/(panel)/eczanem/eczane/_components/EczanemSiparisKuyrugu.tsx → components/kontrol/SadeKontroller.tsx |
| `/eczanem/eczane/uye-yayinlari` | [app/(panel)/eczanem/eczane/uye-yayinlari/page.tsx](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eczanem/eczane/uye-yayinlari/page.tsx>) | app/(panel)/eczanem/eczane/uye-yayinlari/page.tsx → components/ui/periyot-butonlari.tsx → components/kontrol/SadeKontroller.tsx |
| `/eczanem/eczane/uyeler` | [app/(panel)/eczanem/eczane/uyeler/page.tsx](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eczanem/eczane/uyeler/page.tsx>) | app/(panel)/eczanem/eczane/uyeler/page.tsx → components/ui/select.tsx → components/kontrol/SadeKontroller.tsx |
| `/eczanem/tm/mutabakat` | [app/(panel)/eczanem/tm/mutabakat/page.tsx](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eczanem/tm/mutabakat/page.tsx>) | app/(panel)/eczanem/tm/mutabakat/page.tsx → app/(panel)/eczanem/bm/mutabakat/_components/BmMutabakatTakipClient.tsx → components/kontrol/SadeKontroller.tsx |
| `/eczanem/utt/mutabakat` | [app/(panel)/eczanem/utt/mutabakat/page.tsx](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eczanem/utt/mutabakat/page.tsx>) | app/(panel)/eczanem/utt/mutabakat/page.tsx → components/kontrol/SadeKontroller.tsx |
| `/eczanem/yayinlar` | [app/(panel)/eczanem/yayinlar/page.tsx](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eczanem/yayinlar/page.tsx>) | app/(panel)/eczanem/yayinlar/page.tsx → components/ui/periyot-butonlari.tsx → components/kontrol/SadeKontroller.tsx |
| `/kullanicilar` | [app/(panel)/kullanicilar/page.tsx](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/kullanicilar/page.tsx>) | app/(panel)/kullanicilar/page.tsx → components/kontrol/SadeKontroller.tsx |
| `/onaylanan-talepler` | [app/(panel)/onaylanan-talepler/page.tsx](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/onaylanan-talepler/page.tsx>) | app/(panel)/onaylanan-talepler/page.tsx → components/liste/index.ts → components/liste/ListeArama.tsx → components/kontrol/SadeKontroller.tsx |
| `/oneriler` | [app/(panel)/oneriler/page.tsx](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/oneriler/page.tsx>) | app/(panel)/oneriler/page.tsx → components/yayin/UttYayinListeOrtaklari.tsx → components/ui/periyot-butonlari.tsx → components/kontrol/SadeKontroller.tsx |
| `/oneriler/tamamlanan` | [app/(panel)/oneriler/tamamlanan/page.tsx](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/oneriler/tamamlanan/page.tsx>) | app/(panel)/oneriler/tamamlanan/page.tsx → app/(panel)/oneriler/_components/UyeOnerilerGorunumu.tsx → components/yayin/UttYayinListeOrtaklari.tsx → components/ui/periyot-butonlari.tsx → components/kontrol/SadeKontroller.tsx |
| `/raporlar/bm` | [app/(panel)/raporlar/bm/page.tsx](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/raporlar/bm/page.tsx>) | app/(panel)/raporlar/bm/page.tsx → components/raporlar/DavranisRaporu.tsx → components/kontrol/SadeKontroller.tsx |
| `/raporlar/tclub-uretici` | [app/(panel)/raporlar/tclub-uretici/page.tsx](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/raporlar/tclub-uretici/page.tsx>) | app/(panel)/raporlar/tclub-uretici/page.tsx → components/kontrol/SadeKontroller.tsx |
| `/raporlar/tm` | [app/(panel)/raporlar/tm/page.tsx](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/raporlar/tm/page.tsx>) | app/(panel)/raporlar/tm/page.tsx → components/raporlar/DavranisRaporu.tsx → components/kontrol/SadeKontroller.tsx |
| `/raporlar/uretici` | [app/(panel)/raporlar/uretici/page.tsx](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/raporlar/uretici/page.tsx>) | app/(panel)/raporlar/uretici/page.tsx → components/raporlar/RaporPeriyotSecici.tsx → components/ui/periyot-butonlari.tsx → components/kontrol/SadeKontroller.tsx |
| `/raporlar/utt` | [app/(panel)/raporlar/utt/page.tsx](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/raporlar/utt/page.tsx>) | app/(panel)/raporlar/utt/page.tsx → components/raporlar/DavranisRaporu.tsx → components/kontrol/SadeKontroller.tsx |
| `/raporlar/yayin-raporlari` | [app/(panel)/raporlar/yayin-raporlari/page.tsx](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/raporlar/yayin-raporlari/page.tsx>) | app/(panel)/raporlar/yayin-raporlari/page.tsx → components/raporlar/RaporPeriyotSecici.tsx → components/ui/periyot-butonlari.tsx → components/kontrol/SadeKontroller.tsx |
| `/raporlar/yonetici` | [app/(panel)/raporlar/yonetici/page.tsx](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/raporlar/yonetici/page.tsx>) | app/(panel)/raporlar/yonetici/page.tsx → components/raporlar/DavranisRaporu.tsx → components/kontrol/SadeKontroller.tsx |
| `/senaryolar` | [app/(panel)/senaryolar/page.tsx](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/senaryolar/page.tsx>) | app/(panel)/senaryolar/page.tsx → components/uretim/UretimGorevListesi.tsx → components/DurumAnahtari.tsx → components/kontrol/SadeKontroller.tsx |
| `/sizin-yayinlariniz` | [app/(panel)/sizin-yayinlariniz/page.tsx](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/sizin-yayinlariniz/page.tsx>) | app/(panel)/sizin-yayinlariniz/page.tsx → components/yayin/katalog/UreticiYayinKatalogu.tsx → components/liste/index.ts → components/liste/ListeArama.tsx → components/kontrol/SadeKontroller.tsx |
| `/soru-setleri` | [app/(panel)/soru-setleri/page.tsx](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/soru-setleri/page.tsx>) | app/(panel)/soru-setleri/page.tsx → components/uretim/UretimGorevListesi.tsx → components/DurumAnahtari.tsx → components/kontrol/SadeKontroller.tsx |
| `/store/[urun_id]` | [app/(panel)/store/[urun_id]/page.tsx](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/store/[urun_id]/page.tsx>) | app/(panel)/store/[urun_id]/page.tsx → components/kontrol/SadeKontroller.tsx |
| `/store` | [app/(panel)/store/page.tsx](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/store/page.tsx>) | app/(panel)/store/page.tsx → components/kontrol/SadeKontroller.tsx |
| `/store/siparisler` | [app/(panel)/store/siparisler/page.tsx](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/store/siparisler/page.tsx>) | app/(panel)/store/siparisler/page.tsx → app/(panel)/store/siparisler/_components/SiparisFiltreleri.tsx → components/kontrol/KisiKontroller.tsx |
| `/t-club-ligi` | [app/(panel)/t-club-ligi/page.tsx](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/t-club-ligi/page.tsx>) | app/(panel)/t-club-ligi/page.tsx → components/hbligi/HbLigiPeriyotSecici.tsx → components/ui/periyot-butonlari.tsx → components/kontrol/SadeKontroller.tsx |
| `/tum-yayinlar` | [app/(panel)/tum-yayinlar/page.tsx](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/tum-yayinlar/page.tsx>) | app/(panel)/tum-yayinlar/page.tsx → components/yayin/katalog/UreticiYayinKatalogu.tsx → components/liste/index.ts → components/liste/ListeArama.tsx → components/kontrol/SadeKontroller.tsx |
| `/videolar` | [app/(panel)/videolar/page.tsx](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/videolar/page.tsx>) | app/(panel)/videolar/page.tsx → components/uretim/UretimGorevListesi.tsx → components/DurumAnahtari.tsx → components/kontrol/SadeKontroller.tsx |
| `/videolarim/[kategori]` | [app/(panel)/videolarim/[kategori]/page.tsx](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/videolarim/[kategori]/page.tsx>) | app/(panel)/videolarim/[kategori]/page.tsx → components/ana-sayfa/UttAnaSayfa.tsx → components/liste/index.ts → components/liste/ListeArama.tsx → components/kontrol/SadeKontroller.tsx |
| `/yayin-takip` | [app/(panel)/yayin-takip/page.tsx](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/yayin-takip/page.tsx>) | app/(panel)/yayin-takip/page.tsx → app/(panel)/talepler/_components/UreticiRolGorunum.tsx → app/(panel)/talepler/_components/IsListesi.tsx → components/kontrol/SadeKontroller.tsx |
| `/yayin-yonetimi` | [app/(panel)/yayin-yonetimi/page.tsx](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/yayin-yonetimi/page.tsx>) | app/(panel)/yayin-yonetimi/page.tsx → app/(panel)/yayin-yonetimi/_components/BekleyenSatir.tsx → components/kontrol/SadeKontroller.tsx |
| `/yayindaki-videolar/[kategori]` | [app/(panel)/yayindaki-videolar/[kategori]/page.tsx](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/yayindaki-videolar/[kategori]/page.tsx>) | app/(panel)/yayindaki-videolar/[kategori]/page.tsx → components/yayin/BmEgitimYayinlari.tsx → components/liste/index.ts → components/liste/ListeArama.tsx → components/kontrol/SadeKontroller.tsx |
| `/admin` | [app/admin/page.tsx](</Users/iskendereser/Desktop/hapbilgi/app/admin/page.tsx>) | app/admin/page.tsx → app/admin/_components/ModulSekmeBari.tsx → components/kontrol/SadeKontroller.tsx |
| `/eczanem` | [app/eczanem/page.tsx](</Users/iskendereser/Desktop/hapbilgi/app/eczanem/page.tsx>) | app/eczanem/page.tsx → components/ogrenme-araci/YayinTuruFiltresi.tsx → components/kontrol/SadeKontroller.tsx |

## 7. Bütün izlenen JSX kullanım noktaları

Tam prop ifadeleri [kaynak JSON içinde](ADIM1_KAYNAK_ESLEME.json) kayıtlıdır. Aşağıda görünümü etkileyebilen className/varyant/tur/size ve spread bilgileri gösterilir. Yerel ekler kaldırılmadı veya tek değere indirgenmedi.

| Kaynak | Bileşen | Görünüm eki / spread |
| --- | --- | --- |
| [app/(panel)/challenge-club/page.tsx:424](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/challenge-club/page.tsx:424>) | `SadeKontrolGrubu` | tur="sekme" |
| [app/(panel)/challenge-club/page.tsx:428](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/challenge-club/page.tsx:428>) | `SadeKontrolButonu` | Kaynakta ek prop yok |
| [app/(panel)/eclub/hediye-takip/_components/CekTakipFiltreleri.tsx:61](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/hediye-takip/_components/CekTakipFiltreleri.tsx:61>) | `SadeKisiSecimi` | className="w-full" |
| [app/(panel)/eclub/hediye-takip/_components/CekTakipFiltreleri.tsx:66](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/hediye-takip/_components/CekTakipFiltreleri.tsx:66>) | `SadeListeSecimi` | className="w-full" |
| [app/(panel)/eclub/hediye-takip/_components/CekTakipFiltreleri.tsx:73](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/hediye-takip/_components/CekTakipFiltreleri.tsx:73>) | `SadeKisiSecimi` | className="w-full" |
| [app/(panel)/eclub/hediye-takip/_components/CekTakipFiltreleri.tsx:77](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/hediye-takip/_components/CekTakipFiltreleri.tsx:77>) | `SadeListeSecimi` | className="w-full" |
| [app/(panel)/eclub/hediye-takip/_components/CekTakipFiltreleri.tsx:84](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/hediye-takip/_components/CekTakipFiltreleri.tsx:84>) | `SadeListeSecimi` | className="w-full" |
| [app/(panel)/eclub/hediye-takip/_components/CekTakipFiltreleri.tsx:91](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/hediye-takip/_components/CekTakipFiltreleri.tsx:91>) | `SadeTarihAlani` | Kaynakta ek prop yok |
| [app/(panel)/eclub/hediye-takip/_components/CekTakipFiltreleri.tsx:95](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/hediye-takip/_components/CekTakipFiltreleri.tsx:95>) | `SadeTarihAlani` | Kaynakta ek prop yok |
| [app/(panel)/eclub/hediye-takip/_components/HediyeTakipToggle.tsx:32](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/hediye-takip/_components/HediyeTakipToggle.tsx:32>) | `SadeKontrolGrubu` | tur="sekme" |
| [app/(panel)/eclub/hediye-takip/_components/HediyeTakipToggle.tsx:36](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/hediye-takip/_components/HediyeTakipToggle.tsx:36>) | `SadeKontrolButonu` | Kaynakta ek prop yok |
| [app/(panel)/eclub/hediye-takip/_components/SiparisTakipFiltreleri.tsx:33](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/hediye-takip/_components/SiparisTakipFiltreleri.tsx:33>) | `SadeKisiSecimi` | className="w-full" |
| [app/(panel)/eclub/hediye-takip/_components/SiparisTakipFiltreleri.tsx:36](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/hediye-takip/_components/SiparisTakipFiltreleri.tsx:36>) | `SadeListeSecimi` | className="w-full" |
| [app/(panel)/eclub/hediye-takip/_components/SiparisTakipFiltreleri.tsx:42](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/hediye-takip/_components/SiparisTakipFiltreleri.tsx:42>) | `SadeListeSecimi` | className="w-full" |
| [app/(panel)/eclub/hediye-takip/_components/SiparisTakipFiltreleri.tsx:48](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/hediye-takip/_components/SiparisTakipFiltreleri.tsx:48>) | `SadeListeSecimi` | className="w-full" |
| [app/(panel)/eclub/hediye-takip/_components/SiparisTakipFiltreleri.tsx:57](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/hediye-takip/_components/SiparisTakipFiltreleri.tsx:57>) | `SadeTarihAlani` | Kaynakta ek prop yok |
| [app/(panel)/eclub/hediye-takip/_components/SiparisTakipFiltreleri.tsx:60](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/hediye-takip/_components/SiparisTakipFiltreleri.tsx:60>) | `SadeTarihAlani` | Kaynakta ek prop yok |
| [app/(panel)/eclub/listem/_components/EczaneBlogu.tsx:186](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/listem/_components/EczaneBlogu.tsx:186>) | `Select` | Kaynakta ek prop yok |
| [app/(panel)/eclub/listem/_components/EczaneBlogu.tsx:186](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/listem/_components/EczaneBlogu.tsx:186>) | `SelectTrigger` | className="w-full" |
| [app/(panel)/eclub/listem/_components/EczaneBlogu.tsx:186](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/listem/_components/EczaneBlogu.tsx:186>) | `SelectValue` | Kaynakta ek prop yok |
| [app/(panel)/eclub/listem/_components/EczaneBlogu.tsx:186](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/listem/_components/EczaneBlogu.tsx:186>) | `SelectContent` | Kaynakta ek prop yok |
| [app/(panel)/eclub/listem/_components/EczaneBlogu.tsx:186](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/listem/_components/EczaneBlogu.tsx:186>) | `SelectItem` | Kaynakta ek prop yok |
| [app/(panel)/eclub/listem/_components/EczaneBlogu.tsx:186](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/listem/_components/EczaneBlogu.tsx:186>) | `SelectItem` | Kaynakta ek prop yok |
| [app/(panel)/eclub/listem/_components/EczaneBlogu.tsx:186](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/listem/_components/EczaneBlogu.tsx:186>) | `SelectItem` | Kaynakta ek prop yok |
| [app/(panel)/eclub/listem/_components/EczaneBlogu.tsx:186](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/listem/_components/EczaneBlogu.tsx:186>) | `SelectItem` | Kaynakta ek prop yok |
| [app/(panel)/eclub/yayinlar/_components/BmEclubYayinlari.tsx:35](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/yayinlar/_components/BmEclubYayinlari.tsx:35>) | `SadeKisiSecimi` | Kaynakta ek prop yok |
| [app/(panel)/eclub/yayinlar/_components/BmEclubYayinlari.tsx:123](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/yayinlar/_components/BmEclubYayinlari.tsx:123>) | `PeriyotButonlari` | className="w-fit flex-none" |
| [app/(panel)/eclub/yayinlar/_components/EclubGonderimDetayKarti.tsx:87](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/yayinlar/_components/EclubGonderimDetayKarti.tsx:87>) | `SadeKontrolGrubu` | tur="kapsul" |
| [app/(panel)/eclub/yayinlar/_components/EclubGonderimDetayKarti.tsx:91](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/yayinlar/_components/EclubGonderimDetayKarti.tsx:91>) | `SadeKontrolButonu` | Kaynakta ek prop yok |
| [app/(panel)/eclub/yayinlar/page.tsx:179](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eclub/yayinlar/page.tsx:179>) | `PeriyotButonlari` | className="w-fit flex-none" |
| [app/(panel)/eczanem/_components/MutabakatIslemTablosu.tsx:83](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eczanem/_components/MutabakatIslemTablosu.tsx:83>) | `SadeTabloSecimi` | Kaynakta ek prop yok |
| [app/(panel)/eczanem/bm/mutabakat/_components/BmMutabakatTakipClient.tsx:81](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eczanem/bm/mutabakat/_components/BmMutabakatTakipClient.tsx:81>) | `SadeAySecimi` | ...spread=props |
| [app/(panel)/eczanem/bm/mutabakat/_components/BmMutabakatTakipClient.tsx:505](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eczanem/bm/mutabakat/_components/BmMutabakatTakipClient.tsx:505>) | `PeriyotButonlari` | className="w-fit flex-none" |
| [app/(panel)/eczanem/bm/mutabakat/_components/BmMutabakatTakipClient.tsx:512](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eczanem/bm/mutabakat/_components/BmMutabakatTakipClient.tsx:512>) | `PeriyotButonlari` | className="w-fit flex-none" |
| [app/(panel)/eczanem/eczane/_components/EczanemSiparisKuyrugu.tsx:178](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eczanem/eczane/_components/EczanemSiparisKuyrugu.tsx:178>) | `SadeKontrolGrubu` | tur="sekme" |
| [app/(panel)/eczanem/eczane/_components/EczanemSiparisKuyrugu.tsx:178](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eczanem/eczane/_components/EczanemSiparisKuyrugu.tsx:178>) | `SadeKontrolButonu` | Kaynakta ek prop yok |
| [app/(panel)/eczanem/eczane/_components/EczanemSiparisKuyrugu.tsx:178](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eczanem/eczane/_components/EczanemSiparisKuyrugu.tsx:178>) | `SadeKontrolButonu` | Kaynakta ek prop yok |
| [app/(panel)/eczanem/eczane/_components/EczanemSiparisKuyrugu.tsx:238](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eczanem/eczane/_components/EczanemSiparisKuyrugu.tsx:238>) | `Select` | Kaynakta ek prop yok |
| [app/(panel)/eczanem/eczane/_components/EczanemSiparisKuyrugu.tsx:239](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eczanem/eczane/_components/EczanemSiparisKuyrugu.tsx:239>) | `SelectTrigger` | className="mx-auto h-auto w-auto gap-1 border-0 bg-transparent p-0 text-[10px] font-extrabold uppercase tracking-wide text-[#8090a4] shadow-none" |
| [app/(panel)/eczanem/eczane/_components/EczanemSiparisKuyrugu.tsx:240](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eczanem/eczane/_components/EczanemSiparisKuyrugu.tsx:240>) | `SelectContent` | Kaynakta ek prop yok |
| [app/(panel)/eczanem/eczane/_components/EczanemSiparisKuyrugu.tsx:241](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eczanem/eczane/_components/EczanemSiparisKuyrugu.tsx:241>) | `SelectItem` | Kaynakta ek prop yok |
| [app/(panel)/eczanem/eczane/_components/EczanemSiparisKuyrugu.tsx:242](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eczanem/eczane/_components/EczanemSiparisKuyrugu.tsx:242>) | `SelectItem` | Kaynakta ek prop yok |
| [app/(panel)/eczanem/eczane/_components/EczanemSiparisKuyrugu.tsx:243](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eczanem/eczane/_components/EczanemSiparisKuyrugu.tsx:243>) | `SelectItem` | Kaynakta ek prop yok |
| [app/(panel)/eczanem/eczane/uye-yayinlari/page.tsx:227](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eczanem/eczane/uye-yayinlari/page.tsx:227>) | `PeriyotButonlari` | className="w-fit flex-none" |
| [app/(panel)/eczanem/eczane/uyeler/page.tsx:197](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eczanem/eczane/uyeler/page.tsx:197>) | `Select` | Kaynakta ek prop yok |
| [app/(panel)/eczanem/eczane/uyeler/page.tsx:197](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eczanem/eczane/uyeler/page.tsx:197>) | `SelectTrigger` | className="w-full md:w-44" |
| [app/(panel)/eczanem/eczane/uyeler/page.tsx:197](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eczanem/eczane/uyeler/page.tsx:197>) | `SelectValue` | Kaynakta ek prop yok |
| [app/(panel)/eczanem/eczane/uyeler/page.tsx:197](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eczanem/eczane/uyeler/page.tsx:197>) | `SelectContent` | Kaynakta ek prop yok |
| [app/(panel)/eczanem/eczane/uyeler/page.tsx:197](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eczanem/eczane/uyeler/page.tsx:197>) | `SelectItem` | Kaynakta ek prop yok |
| [app/(panel)/eczanem/eczane/uyeler/page.tsx:197](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eczanem/eczane/uyeler/page.tsx:197>) | `SelectItem` | Kaynakta ek prop yok |
| [app/(panel)/eczanem/eczane/uyeler/page.tsx:197](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eczanem/eczane/uyeler/page.tsx:197>) | `SelectItem` | Kaynakta ek prop yok |
| [app/(panel)/eczanem/utt/mutabakat/page.tsx:35](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eczanem/utt/mutabakat/page.tsx:35>) | `SadeAySecimi` | ...spread=props |
| [app/(panel)/eczanem/utt/mutabakat/page.tsx:251](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eczanem/utt/mutabakat/page.tsx:251>) | `PeriyotButonlari` | className="w-fit flex-none" |
| [app/(panel)/eczanem/utt/mutabakat/page.tsx:276](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eczanem/utt/mutabakat/page.tsx:276>) | `PeriyotButonlari` | className="w-fit flex-none" |
| [app/(panel)/eczanem/yayinlar/page.tsx:291](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/eczanem/yayinlar/page.tsx:291>) | `PeriyotButonlari` | className="w-fit flex-none" |
| [app/(panel)/kullanicilar/page.tsx:200](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/kullanicilar/page.tsx:200>) | `SadeFormSecimi` | className="w-full" |
| [app/(panel)/kullanicilar/page.tsx:207](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/kullanicilar/page.tsx:207>) | `SadeFormSecimi` | className="w-full" |
| [app/(panel)/kullanicilar/page.tsx:217](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/kullanicilar/page.tsx:217>) | `SadeFormSecimi` | className="w-full" |
| [app/(panel)/kullanicilar/page.tsx:224](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/kullanicilar/page.tsx:224>) | `SadeFormSecimi` | className="w-full" |
| [app/(panel)/oneriler/_components/BmOneriTakibi.tsx:201](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/oneriler/_components/BmOneriTakibi.tsx:201>) | `SadeListeSecimi` | className="w-full" |
| [app/(panel)/oneriler/_components/BmOneriTakibi.tsx:216](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/oneriler/_components/BmOneriTakibi.tsx:216>) | `SadeKisiSecimi` | className="w-full" |
| [app/(panel)/oneriler/_components/BmOneriTakibi.tsx:219](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/oneriler/_components/BmOneriTakibi.tsx:219>) | `SadeListeSecimi` | className="w-full" |
| [app/(panel)/oneriler/_components/TmOneriTakibi.tsx:104](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/oneriler/_components/TmOneriTakibi.tsx:104>) | `SadeKisiSecimi` | varyant="tablo" |
| [app/(panel)/raporlar/tclub-uretici/page.tsx:254](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/raporlar/tclub-uretici/page.tsx:254>) | `SadeKontrolGrubu` | tur="sekme"; className="mb-3" |
| [app/(panel)/raporlar/tclub-uretici/page.tsx:255](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/raporlar/tclub-uretici/page.tsx:255>) | `SadeKontrolButonu` | Kaynakta ek prop yok |
| [app/(panel)/raporlar/tclub-uretici/page.tsx:263](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/raporlar/tclub-uretici/page.tsx:263>) | `SadeKontrolGrubu` | tur="sekme" |
| [app/(panel)/raporlar/tclub-uretici/page.tsx:265](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/raporlar/tclub-uretici/page.tsx:265>) | `SadeKontrolButonu` | Kaynakta ek prop yok |
| [app/(panel)/store/[urun_id]/page.tsx:374](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/store/[urun_id]/page.tsx:374>) | `SadeListeSecimi` | className="w-full" |
| [app/(panel)/store/page.tsx:410](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/store/page.tsx:410>) | `SadeKontrolGrubu` | tur="kapsul" |
| [app/(panel)/store/page.tsx:411](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/store/page.tsx:411>) | `SadeKontrolButonu` | Kaynakta ek prop yok |
| [app/(panel)/store/page.tsx:415](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/store/page.tsx:415>) | `SadeKontrolButonu` | Kaynakta ek prop yok |
| [app/(panel)/store/siparisler/_components/SiparisFiltreleri.tsx:123](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/store/siparisler/_components/SiparisFiltreleri.tsx:123>) | `SadeListeSecimi` | className="w-full" |
| [app/(panel)/store/siparisler/_components/SiparisFiltreleri.tsx:138](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/store/siparisler/_components/SiparisFiltreleri.tsx:138>) | `SadeListeSecimi` | className="w-full" |
| [app/(panel)/store/siparisler/_components/SiparisFiltreleri.tsx:153](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/store/siparisler/_components/SiparisFiltreleri.tsx:153>) | `SadeListeSecimi` | className="w-full" |
| [app/(panel)/store/siparisler/_components/SiparisFiltreleri.tsx:167](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/store/siparisler/_components/SiparisFiltreleri.tsx:167>) | `SadeKisiSecimi` | className="w-full" |
| [app/(panel)/store/siparisler/_components/SiparisFiltreleri.tsx:173](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/store/siparisler/_components/SiparisFiltreleri.tsx:173>) | `SadeListeSecimi` | className="w-full" |
| [app/(panel)/store/siparisler/_components/SiparisFiltreleri.tsx:186](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/store/siparisler/_components/SiparisFiltreleri.tsx:186>) | `SadeTarihAlani` | Kaynakta ek prop yok |
| [app/(panel)/store/siparisler/_components/SiparisFiltreleri.tsx:193](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/store/siparisler/_components/SiparisFiltreleri.tsx:193>) | `SadeTarihAlani` | Kaynakta ek prop yok |
| [app/(panel)/talepler/_components/EkDosyaYukleme.tsx:41](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/talepler/_components/EkDosyaYukleme.tsx:41>) | `SadeIslemButonu` | Kaynakta ek prop yok |
| [app/(panel)/talepler/_components/IsListesi.tsx:68](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/talepler/_components/IsListesi.tsx:68>) | `SadeListeSecimi` | className="w-full" |
| [app/(panel)/talepler/_components/PodcastTalepAlanlari.tsx:138](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/talepler/_components/PodcastTalepAlanlari.tsx:138>) | `SadeKapsulFiltre` | className="w-fit max-w-full" |
| [app/(panel)/talepler/_components/SoruSetiAyarlari.tsx:39](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/talepler/_components/SoruSetiAyarlari.tsx:39>) | `SadeFormSecimi` | className="w-full" |
| [app/(panel)/talepler/_components/SoruSetiAyarlari.tsx:47](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/talepler/_components/SoruSetiAyarlari.tsx:47>) | `SadeFormSecimi` | className="w-full" |
| [app/(panel)/talepler/_components/SoruSetiAyarlari.tsx:57](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/talepler/_components/SoruSetiAyarlari.tsx:57>) | `SadeFormSecimi` | className="w-full" |
| [app/(panel)/talepler/_components/UrunTeknikSecici.tsx:122](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/talepler/_components/UrunTeknikSecici.tsx:122>) | `SadeFormSecimi` | className="w-full" |
| [app/(panel)/talepler/_components/UrunTeknikSecici.tsx:132](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/talepler/_components/UrunTeknikSecici.tsx:132>) | `SadeFormSecimi` | className="w-full" |
| [app/(panel)/talepler/_components/UrunTeknikSecici.tsx:187](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/talepler/_components/UrunTeknikSecici.tsx:187>) | `SadeFormSecimi` | className="w-full" |
| [app/(panel)/talepler/_components/YeniTalepFormV2.tsx:64](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/talepler/_components/YeniTalepFormV2.tsx:64>) | `SadeKontrolGrubu` | className={kapsulClassName ?? "w-fit max-w-full"} |
| [app/(panel)/talepler/_components/YeniTalepFormV2.tsx:72](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/talepler/_components/YeniTalepFormV2.tsx:72>) | `SadeKontrolButonu` | Kaynakta ek prop yok |
| [app/(panel)/talepler/_components/YeniTalepFormV2.tsx:156](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/talepler/_components/YeniTalepFormV2.tsx:156>) | `SadeFormSecimi` | Kaynakta ek prop yok |
| [app/(panel)/talepler/_components/YeniTalepFormV2.tsx:261](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/talepler/_components/YeniTalepFormV2.tsx:261>) | `SadeKontrolGrubu` | tur="kapsul"; className="w-fit max-w-full" |
| [app/(panel)/talepler/_components/YeniTalepFormV2.tsx:264](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/talepler/_components/YeniTalepFormV2.tsx:264>) | `SadeKontrolButonu` | Kaynakta ek prop yok |
| [app/(panel)/talepler/_components/YeniTalepFormV2.tsx:390](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/talepler/_components/YeniTalepFormV2.tsx:390>) | `SadeIslemButonu` | Kaynakta ek prop yok |
| [app/(panel)/yayin-yonetimi/_components/BekleyenSatir.tsx:209](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/yayin-yonetimi/_components/BekleyenSatir.tsx:209>) | `SadeFormSecimi` | className="w-full" |
| [app/(panel)/yayin-yonetimi/_components/BekleyenSatir.tsx:408](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/yayin-yonetimi/_components/BekleyenSatir.tsx:408>) | `SadeFormSecimi` | className="w-full" |
| [app/(panel)/yayin-yonetimi/_components/BekleyenSatir.tsx:588](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/yayin-yonetimi/_components/BekleyenSatir.tsx:588>) | `SadeFormSecimi` | className="w-full" |
| [app/(panel)/yayin-yonetimi/_components/BekleyenSatir.tsx:594](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/yayin-yonetimi/_components/BekleyenSatir.tsx:594>) | `SadeFormSecimi` | className="w-full" |
| [app/(panel)/yayin-yonetimi/_components/SoruListesi.tsx:49](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/yayin-yonetimi/_components/SoruListesi.tsx:49>) | `SadeFormSecimi` | className="w-full" |
| [app/(panel)/yayin-yonetimi/_components/SoruListesi.tsx:83](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/yayin-yonetimi/_components/SoruListesi.tsx:83>) | `SadeFormSecimi` | className="w-full" |
| [app/(panel)/yayin-yonetimi/_components/YayinKumandaPaneli.tsx:103](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/yayin-yonetimi/_components/YayinKumandaPaneli.tsx:103>) | `SadeKontrolGrubu` | tur="sekme" |
| [app/(panel)/yayin-yonetimi/_components/YayinKumandaPaneli.tsx:109](</Users/iskendereser/Desktop/hapbilgi/app/(panel)/yayin-yonetimi/_components/YayinKumandaPaneli.tsx:109>) | `SadeKontrolButonu` | Kaynakta ek prop yok |
| [app/admin/_components/KullaniciDuzenleModal.tsx:112](</Users/iskendereser/Desktop/hapbilgi/app/admin/_components/KullaniciDuzenleModal.tsx:112>) | `SadeFormSecimi` | className="w-full" |
| [app/admin/_components/KullaniciDuzenleModal.tsx:138](</Users/iskendereser/Desktop/hapbilgi/app/admin/_components/KullaniciDuzenleModal.tsx:138>) | `SadeFormSecimi` | className="w-full" |
| [app/admin/_components/KullaniciDuzenleModal.tsx:147](</Users/iskendereser/Desktop/hapbilgi/app/admin/_components/KullaniciDuzenleModal.tsx:147>) | `SadeFormSecimi` | className="w-full" |
| [app/admin/_components/KullaniciListesi.tsx:191](</Users/iskendereser/Desktop/hapbilgi/app/admin/_components/KullaniciListesi.tsx:191>) | `SadeListeSecimi` | varyant="tablo"; className="w-full" |
| [app/admin/_components/KullaniciListesi.tsx:199](</Users/iskendereser/Desktop/hapbilgi/app/admin/_components/KullaniciListesi.tsx:199>) | `SadeListeSecimi` | varyant="tablo"; className="w-full" |
| [app/admin/_components/KullaniciListesi.tsx:205](</Users/iskendereser/Desktop/hapbilgi/app/admin/_components/KullaniciListesi.tsx:205>) | `SadeListeSecimi` | varyant="tablo"; className="w-full" |
| [app/admin/_components/KullaniciListesi.tsx:211](</Users/iskendereser/Desktop/hapbilgi/app/admin/_components/KullaniciListesi.tsx:211>) | `SadeListeSecimi` | varyant="tablo"; className="w-full" |
| [app/admin/_components/KullaniciListesi.tsx:237](</Users/iskendereser/Desktop/hapbilgi/app/admin/_components/KullaniciListesi.tsx:237>) | `SadeFormSecimi` | className="w-full" |
| [app/admin/_components/KullaniciListesi.tsx:288](</Users/iskendereser/Desktop/hapbilgi/app/admin/_components/KullaniciListesi.tsx:288>) | `SadeListeSecimi` | varyant="tablo"; className="w-full" |
| [app/admin/_components/KullaniciListesi.tsx:298](</Users/iskendereser/Desktop/hapbilgi/app/admin/_components/KullaniciListesi.tsx:298>) | `SadeListeSecimi` | varyant="tablo"; className="w-full" |
| [app/admin/_components/ModulSekmeBari.tsx:31](</Users/iskendereser/Desktop/hapbilgi/app/admin/_components/ModulSekmeBari.tsx:31>) | `SadeKontrolButonu` | Kaynakta ek prop yok |
| [app/admin/_components/ModulSekmeBari.tsx:64](</Users/iskendereser/Desktop/hapbilgi/app/admin/_components/ModulSekmeBari.tsx:64>) | `SadeKontrolGrubu` | tur="sekme" |
| [app/admin/_components/ModulSekmeBari.tsx:78](</Users/iskendereser/Desktop/hapbilgi/app/admin/_components/ModulSekmeBari.tsx:78>) | `SadeKontrolGrubu` | tur="sekme" |
| [app/admin/_components/TekilGirisFormu.tsx:63](</Users/iskendereser/Desktop/hapbilgi/app/admin/_components/TekilGirisFormu.tsx:63>) | `SadeFormSecimi` | className="w-full" |
| [app/admin/_components/TekilGirisFormu.tsx:94](</Users/iskendereser/Desktop/hapbilgi/app/admin/_components/TekilGirisFormu.tsx:94>) | `SadeFormSecimi` | className="w-full" |
| [app/admin/_components/TekilGirisFormu.tsx:103](</Users/iskendereser/Desktop/hapbilgi/app/admin/_components/TekilGirisFormu.tsx:103>) | `SadeFormSecimi` | className="w-full" |
| [app/admin/_components/UrunTeknikYonetimi.tsx:77](</Users/iskendereser/Desktop/hapbilgi/app/admin/_components/UrunTeknikYonetimi.tsx:77>) | `SadeFormSecimi` | className="w-full" |
| [app/admin/_components/global/UretimAtamaPaneli.tsx:89](</Users/iskendereser/Desktop/hapbilgi/app/admin/_components/global/UretimAtamaPaneli.tsx:89>) | `SadeKisiSecimi` | className="w-full" |
| [app/admin/_components/global/UretimAtamaPaneli.tsx:95](</Users/iskendereser/Desktop/hapbilgi/app/admin/_components/global/UretimAtamaPaneli.tsx:95>) | `SadeKisiSecimi` | className="w-full" |
| [app/admin/eclub-cek-teslimat/_components/EclubStoreSiparislerSekmesi.tsx:62](</Users/iskendereser/Desktop/hapbilgi/app/admin/eclub-cek-teslimat/_components/EclubStoreSiparislerSekmesi.tsx:62>) | `SadeKontrolGrubu` | tur="kapsul" |
| [app/admin/eclub-cek-teslimat/_components/EclubStoreSiparislerSekmesi.tsx:66](</Users/iskendereser/Desktop/hapbilgi/app/admin/eclub-cek-teslimat/_components/EclubStoreSiparislerSekmesi.tsx:66>) | `SadeKontrolButonu` | Kaynakta ek prop yok |
| [app/admin/eclub/_components/EclubYonetimPaneli.tsx:269](</Users/iskendereser/Desktop/hapbilgi/app/admin/eclub/_components/EclubYonetimPaneli.tsx:269>) | `SadeListeSecimi` | className="w-full" |
| [app/admin/store/_components/SekmeBari.tsx:20](</Users/iskendereser/Desktop/hapbilgi/app/admin/store/_components/SekmeBari.tsx:20>) | `SadeKontrolGrubu` | tur="sekme" |
| [app/admin/store/_components/SekmeBari.tsx:22](</Users/iskendereser/Desktop/hapbilgi/app/admin/store/_components/SekmeBari.tsx:22>) | `SadeKontrolButonu` | Kaynakta ek prop yok |
| [app/admin/store/_components/SiparisYonetimModal.tsx:190](</Users/iskendereser/Desktop/hapbilgi/app/admin/store/_components/SiparisYonetimModal.tsx:190>) | `SadeFormSecimi` | className="w-full" |
| [app/admin/store/_components/UrunModal.tsx:322](</Users/iskendereser/Desktop/hapbilgi/app/admin/store/_components/UrunModal.tsx:322>) | `SadeFormSecimi` | className="w-full" |
| [app/eczanem/page.tsx:270](</Users/iskendereser/Desktop/hapbilgi/app/eczanem/page.tsx:270>) | `YayinTuruFiltresi` | Kaynakta ek prop yok |
| [components/DurumAnahtari.tsx:75](</Users/iskendereser/Desktop/hapbilgi/components/DurumAnahtari.tsx:75>) | `SadeKontrolGrubu` | tur="kapsul" |
| [components/DurumAnahtari.tsx:81](</Users/iskendereser/Desktop/hapbilgi/components/DurumAnahtari.tsx:81>) | `SadeKontrolButonu` | Kaynakta ek prop yok |
| [components/ana-sayfa/BmAnaSayfa.tsx:217](</Users/iskendereser/Desktop/hapbilgi/components/ana-sayfa/BmAnaSayfa.tsx:217>) | `PeriyotButonlari` | Kaynakta ek prop yok |
| [components/ana-sayfa/SahaVideoRaflari.tsx:227](</Users/iskendereser/Desktop/hapbilgi/components/ana-sayfa/SahaVideoRaflari.tsx:227>) | `YayinTuruFiltresi` | Kaynakta ek prop yok |
| [components/ana-sayfa/TmAnaSayfa.tsx:238](</Users/iskendereser/Desktop/hapbilgi/components/ana-sayfa/TmAnaSayfa.tsx:238>) | `SadeKontrolGrubu` | tur="sekme" |
| [components/ana-sayfa/TmAnaSayfa.tsx:242](</Users/iskendereser/Desktop/hapbilgi/components/ana-sayfa/TmAnaSayfa.tsx:242>) | `SadeKontrolButonu` | Kaynakta ek prop yok |
| [components/ana-sayfa/TmAnaSayfa.tsx:254](</Users/iskendereser/Desktop/hapbilgi/components/ana-sayfa/TmAnaSayfa.tsx:254>) | `PeriyotButonlari` | Kaynakta ek prop yok |
| [components/cc-ligi/CcLigiPeriyotSecici.tsx:19](</Users/iskendereser/Desktop/hapbilgi/components/cc-ligi/CcLigiPeriyotSecici.tsx:19>) | `PeriyotButonlari` | Kaynakta ek prop yok |
| [components/challenge-club/ChallengeGonderPaneli.tsx:114](</Users/iskendereser/Desktop/hapbilgi/components/challenge-club/ChallengeGonderPaneli.tsx:114>) | `SadeKisiCokluSecimi` | Kaynakta ek prop yok |
| [components/eclub/DepoAramaliSecim.tsx:79](</Users/iskendereser/Desktop/hapbilgi/components/eclub/DepoAramaliSecim.tsx:79>) | `SadeSecimButonu` | className={className} |
| [components/eclub/DepoAramaliSecim.tsx:80](</Users/iskendereser/Desktop/hapbilgi/components/eclub/DepoAramaliSecim.tsx:80>) | `SadeSecimMenusu` | Kaynakta ek prop yok |
| [components/eclub/DepoAramaliSecim.tsx:81](</Users/iskendereser/Desktop/hapbilgi/components/eclub/DepoAramaliSecim.tsx:81>) | `SadeAramaAlani` | Kaynakta ek prop yok |
| [components/eclub/DepoAramaliSecim.tsx:87](</Users/iskendereser/Desktop/hapbilgi/components/eclub/DepoAramaliSecim.tsx:87>) | `SadeSecimSecenegi` | Kaynakta ek prop yok |
| [components/eclub/DepoTercihFormu.tsx:66](</Users/iskendereser/Desktop/hapbilgi/components/eclub/DepoTercihFormu.tsx:66>) | `SadeFormSecimi` | className="w-full" |
| [components/eclub/DepoTercihFormu.tsx:72](</Users/iskendereser/Desktop/hapbilgi/components/eclub/DepoTercihFormu.tsx:72>) | `SadeFormSecimi` | className="w-full" |
| [components/eclub/EclubFirmaCalismaAlani.tsx:128](</Users/iskendereser/Desktop/hapbilgi/components/eclub/EclubFirmaCalismaAlani.tsx:128>) | `SadeKontrolGrubu` | tur="sekme"; className="!flex-nowrap overflow-x-auto" |
| [components/eclub/EclubFirmaCalismaAlani.tsx:129](</Users/iskendereser/Desktop/hapbilgi/components/eclub/EclubFirmaCalismaAlani.tsx:129>) | `SadeKontrolButonu` | Kaynakta ek prop yok |
| [components/eclub/EclubFirmaCalismaAlani.tsx:132](</Users/iskendereser/Desktop/hapbilgi/components/eclub/EclubFirmaCalismaAlani.tsx:132>) | `SadeKontrolGrubu` | className="max-w-full self-start !flex-nowrap overflow-x-auto" |
| [components/eclub/EclubFirmaCalismaAlani.tsx:133](</Users/iskendereser/Desktop/hapbilgi/components/eclub/EclubFirmaCalismaAlani.tsx:133>) | `SadeKontrolButonu` | Kaynakta ek prop yok |
| [components/hbligi/HbLigiPeriyotSecici.tsx:19](</Users/iskendereser/Desktop/hapbilgi/components/hbligi/HbLigiPeriyotSecici.tsx:19>) | `PeriyotButonlari` | className="hb-ligi-periyot-secici" |
| [components/hbligi/league/BmLeaguePage.tsx:41](</Users/iskendereser/Desktop/hapbilgi/components/hbligi/league/BmLeaguePage.tsx:41>) | `SadeKontrolGrubu` | tur="kapsul" |
| [components/hbligi/league/BmLeaguePage.tsx:43](</Users/iskendereser/Desktop/hapbilgi/components/hbligi/league/BmLeaguePage.tsx:43>) | `SadeKontrolButonu` | Kaynakta ek prop yok |
| [components/hbligi/league/CompetitorComparison.tsx:178](</Users/iskendereser/Desktop/hapbilgi/components/hbligi/league/CompetitorComparison.tsx:178>) | `SadeListeSecimi` | className="w-full" |
| [components/hbligi/league/CompetitorComparison.tsx:185](</Users/iskendereser/Desktop/hapbilgi/components/hbligi/league/CompetitorComparison.tsx:185>) | `SadeListeSecimi` | className="w-full" |
| [components/hbligi/league/CompetitorComparison.tsx:256](</Users/iskendereser/Desktop/hapbilgi/components/hbligi/league/CompetitorComparison.tsx:256>) | `SadeListeSecimi` | className="w-full" |
| [components/hbligi/league/CompetitorComparison.tsx:263](</Users/iskendereser/Desktop/hapbilgi/components/hbligi/league/CompetitorComparison.tsx:263>) | `SadeListeSecimi` | className="w-full" |
| [components/hbligi/league/LeaguePage.tsx:49](</Users/iskendereser/Desktop/hapbilgi/components/hbligi/league/LeaguePage.tsx:49>) | `SadeKontrolGrubu` | tur="kapsul" |
| [components/hbligi/league/LeaguePage.tsx:51](</Users/iskendereser/Desktop/hapbilgi/components/hbligi/league/LeaguePage.tsx:51>) | `SadeKontrolButonu` | Kaynakta ek prop yok |
| [components/hbligi/league/TmLeaguePage.tsx:78](</Users/iskendereser/Desktop/hapbilgi/components/hbligi/league/TmLeaguePage.tsx:78>) | `SadeKontrolGrubu` | tur="kapsul"; className="min-w-0 max-w-full" |
| [components/hbligi/league/TmLeaguePage.tsx:80](</Users/iskendereser/Desktop/hapbilgi/components/hbligi/league/TmLeaguePage.tsx:80>) | `SadeKontrolButonu` | Kaynakta ek prop yok |
| [components/hbligi/league/TmLeaguePage.tsx:84](</Users/iskendereser/Desktop/hapbilgi/components/hbligi/league/TmLeaguePage.tsx:84>) | `SadeKontrolButonu` | Kaynakta ek prop yok |
| [components/hbligi/producer/ProducerLeaguePage.tsx:228](</Users/iskendereser/Desktop/hapbilgi/components/hbligi/producer/ProducerLeaguePage.tsx:228>) | `SadeKontrolGrubu` | tur="kapsul" |
| [components/hbligi/producer/ProducerLeaguePage.tsx:233](</Users/iskendereser/Desktop/hapbilgi/components/hbligi/producer/ProducerLeaguePage.tsx:233>) | `SadeKontrolButonu` | Kaynakta ek prop yok |
| [components/hbligi/producer/ProducerLeaguePage.tsx:241](</Users/iskendereser/Desktop/hapbilgi/components/hbligi/producer/ProducerLeaguePage.tsx:241>) | `SadeKontrolGrubu` | tur="kapsul" |
| [components/hbligi/producer/ProducerLeaguePage.tsx:243](</Users/iskendereser/Desktop/hapbilgi/components/hbligi/producer/ProducerLeaguePage.tsx:243>) | `SadeKontrolButonu` | Kaynakta ek prop yok |
| [components/kontrol/KisiKontroller.tsx:38](</Users/iskendereser/Desktop/hapbilgi/components/kontrol/KisiKontroller.tsx:38>) | `SadeSecim` | ...spread=props |
| [components/kontrol/KisiKontroller.tsx:45](</Users/iskendereser/Desktop/hapbilgi/components/kontrol/KisiKontroller.tsx:45>) | `SadeCokluAliciSecimi` | ...spread=props |
| [components/liste/IcerikFiltreBari.tsx:41](</Users/iskendereser/Desktop/hapbilgi/components/liste/IcerikFiltreBari.tsx:41>) | `YayinTuruFiltresi` | Kaynakta ek prop yok |
| [components/liste/ListeArama.tsx:42](</Users/iskendereser/Desktop/hapbilgi/components/liste/ListeArama.tsx:42>) | `SadeListeSecimi` | className="w-[160px] max-[480px]:w-[140px] flex-none" |
| [components/ogrenme-araci/YayinTuruFiltresi.tsx:24](</Users/iskendereser/Desktop/hapbilgi/components/ogrenme-araci/YayinTuruFiltresi.tsx:24>) | `SadeKapsulFiltre` | Kaynakta ek prop yok |
| [components/raporlar/DagilimGrafik.tsx:183](</Users/iskendereser/Desktop/hapbilgi/components/raporlar/DagilimGrafik.tsx:183>) | `SadeKontrolButonu` | Kaynakta ek prop yok |
| [components/raporlar/DagilimGrafik.tsx:225](</Users/iskendereser/Desktop/hapbilgi/components/raporlar/DagilimGrafik.tsx:225>) | `SadeKontrolGrubu` | className="mb-2" |
| [components/raporlar/DavranisRaporu.tsx:101](</Users/iskendereser/Desktop/hapbilgi/components/raporlar/DavranisRaporu.tsx:101>) | `SadeKontrolGrubu` | tur="kapsul"; className="min-w-0 max-w-full" |
| [components/raporlar/DavranisRaporu.tsx:102](</Users/iskendereser/Desktop/hapbilgi/components/raporlar/DavranisRaporu.tsx:102>) | `SadeKontrolButonu` | Kaynakta ek prop yok |
| [components/raporlar/DavranisRaporu.tsx:125](</Users/iskendereser/Desktop/hapbilgi/components/raporlar/DavranisRaporu.tsx:125>) | `SadeKontrolGrubu` | tur="sekme"; className={styles.controlTabs} |
| [components/raporlar/DavranisRaporu.tsx:126](</Users/iskendereser/Desktop/hapbilgi/components/raporlar/DavranisRaporu.tsx:126>) | `SadeKontrolButonu` | Kaynakta ek prop yok |
| [components/raporlar/DavranisRaporu.tsx:128](</Users/iskendereser/Desktop/hapbilgi/components/raporlar/DavranisRaporu.tsx:128>) | `SadeKontrolGrubu` | tur="sekme"; className={styles.controlTabs} |
| [components/raporlar/DavranisRaporu.tsx:129](</Users/iskendereser/Desktop/hapbilgi/components/raporlar/DavranisRaporu.tsx:129>) | `SadeKontrolButonu` | Kaynakta ek prop yok |
| [components/raporlar/DavranisRaporu.tsx:132](</Users/iskendereser/Desktop/hapbilgi/components/raporlar/DavranisRaporu.tsx:132>) | `PeriyotButonlari` | Kaynakta ek prop yok |
| [components/raporlar/DavranisRaporu.tsx:136](</Users/iskendereser/Desktop/hapbilgi/components/raporlar/DavranisRaporu.tsx:136>) | `TemsilciSecici` | Kaynakta ek prop yok |
| [components/raporlar/DavranisRaporu.tsx:138](</Users/iskendereser/Desktop/hapbilgi/components/raporlar/DavranisRaporu.tsx:138>) | `TemsilciSecici` | Kaynakta ek prop yok |
| [components/raporlar/DavranisRaporu.tsx:139](</Users/iskendereser/Desktop/hapbilgi/components/raporlar/DavranisRaporu.tsx:139>) | `TemsilciSecici` | Kaynakta ek prop yok |
| [components/raporlar/DavranisRaporu.tsx:141](</Users/iskendereser/Desktop/hapbilgi/components/raporlar/DavranisRaporu.tsx:141>) | `TemsilciSecici` | Kaynakta ek prop yok |
| [components/raporlar/DavranisRaporu.tsx:144](</Users/iskendereser/Desktop/hapbilgi/components/raporlar/DavranisRaporu.tsx:144>) | `SadeKontrolGrubu` | tur="sekme" |
| [components/raporlar/DavranisRaporu.tsx:145](</Users/iskendereser/Desktop/hapbilgi/components/raporlar/DavranisRaporu.tsx:145>) | `SadeKontrolButonu` | Kaynakta ek prop yok |
| [components/raporlar/RaporPeriyotSecici.tsx:13](</Users/iskendereser/Desktop/hapbilgi/components/raporlar/RaporPeriyotSecici.tsx:13>) | `PeriyotButonlari` | Kaynakta ek prop yok |
| [components/raporlar/TemsilciSecici.tsx:13](</Users/iskendereser/Desktop/hapbilgi/components/raporlar/TemsilciSecici.tsx:13>) | `SadeKisiSecimi` | Kaynakta ek prop yok |
| [components/raporlar/YayinDetayModal.tsx:215](</Users/iskendereser/Desktop/hapbilgi/components/raporlar/YayinDetayModal.tsx:215>) | `SadeKontrolGrubu` | tur="sekme" |
| [components/raporlar/YayinDetayModal.tsx:216](</Users/iskendereser/Desktop/hapbilgi/components/raporlar/YayinDetayModal.tsx:216>) | `SadeKontrolButonu` | Kaynakta ek prop yok |
| [components/raporlar/YayinDetayModal.tsx:221](</Users/iskendereser/Desktop/hapbilgi/components/raporlar/YayinDetayModal.tsx:221>) | `SadeKontrolButonu` | Kaynakta ek prop yok |
| [components/ui/periyot-butonlari.tsx:18](</Users/iskendereser/Desktop/hapbilgi/components/ui/periyot-butonlari.tsx:18>) | `SadeKapsulFiltre` | className={className} |
| [components/ui/select.tsx:51](</Users/iskendereser/Desktop/hapbilgi/components/ui/select.tsx:51>) | `SadeAsagiOk` | Kaynakta ek prop yok |
| [components/yayin/BmOneriGonderimPaneli.tsx:118](</Users/iskendereser/Desktop/hapbilgi/components/yayin/BmOneriGonderimPaneli.tsx:118>) | `SadeTarihAlani` | className="mt-1.5 w-full" |
| [components/yayin/BmOneriGonderimPaneli.tsx:121](</Users/iskendereser/Desktop/hapbilgi/components/yayin/BmOneriGonderimPaneli.tsx:121>) | `SadeTarihAlani` | className="mt-1.5 w-full" |
| [components/yayin/UttYayinListeOrtaklari.tsx:52](</Users/iskendereser/Desktop/hapbilgi/components/yayin/UttYayinListeOrtaklari.tsx:52>) | `PeriyotButonlari` | className={className} |
| [components/yayin/katalog/UreticiYayinKatalogu.tsx:400](</Users/iskendereser/Desktop/hapbilgi/components/yayin/katalog/UreticiYayinKatalogu.tsx:400>) | `YayinTuruFiltresi` | Kaynakta ek prop yok |
| [components/yayin/katalog/UreticiYayinKatalogu.tsx:418](</Users/iskendereser/Desktop/hapbilgi/components/yayin/katalog/UreticiYayinKatalogu.tsx:418>) | `YayinTuruFiltresi` | Kaynakta ek prop yok |

## 8. Başlangıç doğrulaması

- Mevcut `tests/sadeKontroller.hedef.test.ts`: **17 başarılı, 0 başarısız**.
- Test ortamı Happy DOM ve sahte bileşen verileridir; bütün rollerin gerçek kullanıcı testi değildir.
- 1.205 kaynak imzasının başlangıç envanteriyle farkı: **0**. Belge üretimi sonrasındaki fark sayısı: **0**.
- Uygulama, SQL ve canlı veri üzerinde değişiklik yapılmadı.
- Mobil ve hesaplanmış DOM referansları ile gerekli kullanıcı ekran kontrolü bekliyor.
- Ayrıntılı sonuç: [ADIM1_DOGRULAMA.json](ADIM1_DOGRULAMA.json).
