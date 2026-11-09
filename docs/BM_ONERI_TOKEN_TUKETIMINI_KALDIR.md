# BM önerisini token tüketiminden ayırma — 9 Kasım 2026

Kullanıcı kararı: Üreticinin yayın açılışında ücretlendirdiği içerik için BM'nin UTT'ye önerisi ikinci tüketim oluşturmayacak. BM önerisinin token hesabı/yeterliliğiyle ilişkisi olmayacak.

**Durum:** Kod ve SQL hazır; hedefli yerel testler başarılı. Kullanıcı `bm_oneri_token_tuketimi_kaldirildi = true` sonucuyla Supabase kurulumunu doğruladı. Gerçek kullanıcı/tarayıcı testi yapılmadı.

SQL: `scripts/sql/bm_oneri_token_tuketimini_kaldir.sql` (14 satır). Beklenen sonuç: `bm_oneri_token_tuketimi_kaldirildi = true`.

- Yalnız `oneri_kayitlari` tablosundaki `trg_cogniti_token_tclub_oneri` ve onun `cogniti_token_tclub_oneri_kaydet()` işlevi kaldırılır. CASCADE yoktur. Diğer öneri/yayın/öğrenme tetikleyicileri ve veri tabloları kaldırılmaz.
- BM öneri API'sindeki token yetersizliği/hesap yokluğu için özel engel mesajları kaldırıldı. Token hesabı sorgulanmaz. Yetki, aktif alıcının firma/bölge kapsamı, haftalık alıcı limiti, aylık BM kotası, tarih ve UTT hedefli aktif yayın kontrolü korunur. Öneriler yine tek INSERT ile kaydedilir; bildirimler başarılı kayıt sonrasında oluşur.
- Token raporları BM önerisi tüketimini `cogniti_token_tuketimleri` içindeki `tclub_oneri` kayıtlarından okuyor; öneri sayısından bağımsız yeni token üretmiyor. Bu nedenle rapor SQL'ini değiştirmeye gerek yoktur. Yeni tüketim yazılmayınca yeni BM önerileri tüketim raporuna girmez; geçmiş tüketimler ve tarihsel rapor satırları korunur. Geriye dönük silme/iade yapılmaz.
- Üreticinin UTT/BM ve E-Club yayın açılışı tüketimi ile PM/Medikal Eczanem bloklama zinciri değiştirilmez. Eski `cogniti_token_tclub_kurulum.sql` tarihsel migrationdır; tekrar çalıştırılması tüketimi geri kurar. Güncel son migration bu kaldırma dosyasıdır.

**Doğrulama:** Yerel PostgreSQL 18.6, yalnız /tmp Unix socket, sahte temel tablolar. Repodaki eski token tetikleyicisi ve kaldırma SQL'i değiştirilmeden çalıştırıldı; 6 senaryo geçti: önceki tüketimin kanıtı, kaldırma/tekrar kurulum, kalan ve geçmiş rapor kaynağının korunması, sıfır tokenla öneri, hesapsız öneri, token dışı DB kontrolünün korunması. Alt tüketim işlevi gözlemci stub kullanır; bütün canlı şema testi değildir. Yerel PostgreSQL test sonunda durduruldu.

API'de 4 hedefli test geçti: başarılı toplu kayıt/bildirim, DB hatasında başarı yok, tarih kontrolü, rol/alıcı/haftalık/aylık limit engelleri. TypeScript başarılı; değişen API ESLint hatasız/uyarısız. Hedefli diff kontrolü temiz. Sonuç: `BM_ONERI_TOKEN_KALDIR_TEST_SONUCLARI.json`.

SQL kurulumu kullanıcı başarı sonucuyla doğrulandı; gerçek kullanıcıyla canlı öneri testi henüz yapılmadı. Commit/push yapılmadı.
