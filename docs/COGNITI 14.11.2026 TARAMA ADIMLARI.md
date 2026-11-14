# COGNITI 14.11.2026 TARAMA ADIMLARI

Bu sekiz adım tüm Cogniti rolleri ve rol grupları için ortaktır. **İlk adım açık onayınla başlar. Her adımın sonunda yapılan çalışma, doğrulanan bulgular ve açık kalan noktalar kısaca değerlendirilir. Bir sonraki adıma geçmek için açık onayın beklenir.** Kod, belge veya veri değişiklikleri ayrıca açık talimatına ve onayına bağlıdır.

## 1. Beklenen görev ve yetkileri çıkar

- Bluebook’taki son onaylı kararlardan rolün görevlerini ve sorumluluklarını belirle.
- Hangi kayıtları görebildiğini, hangi işlemleri başlatabildiğini, neleri değiştirebildiğini veya onaylayabildiğini yaz.
- Her yetkinin firma, takım, bölge, eczane, kayıt sahipliği, aktif üyelik ve modül koşullarını belirt.
- Ortak görevleri bir kez kaydet. Rol grubundaki her rolün yetkisini ve varsa istisnalarını kendi satırında göster. Belirsiz veya çelişkili kararları açık nokta olarak kaydet.

## 2. Giriş sonrası işlevleri listele

- Giriş yönlendirmesini, başlangıç ekranını, masaüstü ve mobil menüleri belirle.
- Her ekranın adresini ve sunduğu işlemleri kaydet. Menü bağlantılarını, ekran içi geçişleri ve doğrudan açılabilen adresleri kontrol et.
- Ekran ve işlemlerin hangi rol, modül veya kayıt durumu koşulunda kullanılabildiğini yaz.
- Roller arası iş devrinde işlemi kimin başlattığını, kimin devraldığını ve kimin sonuçlandırdığını göster.

## 3. Her işlevi koddan veriye kadar izle

- Ekrandan başlayarak bileşeni, API veya sunucu işlevini, iş kuralını ve çağrılan veri kaynağını izle.
- Hangi tablo, görünüm ve RPC’nin kullanıldığını, hangi alanların okunduğunu veya yazıldığını kaydet.
- Tablo ve kolon adlarını doğrulanmış şema ile kaynak SQL üzerinden kontrol et. Canlı şemaya ilişkin eksik teyidi belirt.
- İlgili tetikleyicileri, zamanlanmış işleri, webhook’ları, bildirimleri ve dış servisleri işleme bağla.

## 4. Yetki sınırlarını doğrula

- Giriş ve oturum kontrolünü, ekran görünürlüğünü, doğrudan sayfa ve API erişimini incele.
- Her rol için kayıt okuma, oluşturma, değiştirme, silme ve onay yetkilerinin nerede denetlendiğini kontrol et.
- Sunucunun firma, takım, bölge, eczane ve kayıt sahipliğini nasıl doğruladığını belirle. İlgili veritabanı yetkilerini, RLS politikalarını ve RPC kontrollerini karşılaştır.
- Yetkili işlemler ile kapsam dışında engellenmesi gereken işlemler için doğrulanacak senaryoları kaydet.

## 5. İş akışının sonucunu kontrol et

- İşlemi başlangıçtan sonuca kadar izle. Durum geçişlerini, onay sırasını, zaman ve dönem kurallarını beklenen davranışla karşılaştır.
- İşlem sonucunda oluşan veya güncellenen kayıtları, ilgili puan ve token hareketlerini, rapor hesaplarını ve bildirim alıcılarını kontrol et.
- İş akışı gerektiriyorsa tekrar deneme, eşzamanlı işlem, kısmi hata ve yarıda kalma durumlarında kayıtların tutarlılığını incele.
- Ekranda görülen sonucun ilgili kaynak kayıtlarla uyuşup uyuşmadığını kaydet.

## 6. Artık kullanılmayan yapıları kanıtla

- Kullanım dışı görünen dosya, bileşen, rota, işlev, tablo, görünüm ve RPC adaylarını belirle.
- Doğrudan çağrıları, dinamik bağlantıları, SQL bağımlılıklarını, cron ve webhook girişlerini ve ilgili değişiklik geçmişini araştır.
- Eski kayıtlar, yönlendirmeler veya geriye dönük uyumluluk için süren bir görev olup olmadığını kontrol et.
- Her aday için kullanım durumunu dayanaklarıyla yaz. Karar için eksik olan kanıtı belirt.

## 7. Tüm rollerde hedefli yazılım testi yap

- Her rolün izinli ve engellenmesi gereken işlemlerini sahte verilerle sınayacak senaryoları çalıştır.
- İlgili kaynak SQL’i değiştirmeden, yalnız yerel Unix socket üzerinden çalışan izole PostgreSQL ortamında doğrula. Gerekli yarış senaryolarını iki bağımsız bağlantıyla sınayarak sonuçları kaydet.
- API ve ekran davranışlarını sahte bağımlılıklarla doğrula. İlgili TypeScript ve lint kontrollerini çalıştır.
- Canlı veritabanı teyidi gerektiğinde salt okunur kontrol SQL’ini hazırla. Sen çalıştırdıktan sonra paylaştığın sonucu doğrulama kaydına işle.

## 8. Bulguları kanıtlarıyla teslim et

- Her bulguda etkilenen rolü, ekranı veya işlemi ve ilgili kayıt kapsamını belirt.
- Beklenen davranışı, gözlenen davranışı ve farkın etkisini açıkça yaz.
- Bulguyu dosya ve satır, veritabanı nesnesi veya test sonucu gibi somut kanıtlara bağla.
- Test ve canlı doğrulama durumunu kaydet. Açık kalan noktaları, bunları kapatmak için gereken kanıtla birlikte teslim et.
