// Onaylı içerik: docs/KULLANIM_KILAVUZU_ECZANELER.md
import { eclubFirmaAdiYolu } from "../eclub/firmaGezinme";
import type { KilavuzParcasi } from "./ureticiKilavuzu";
import { eclubCekTalebiOlusturabilirMi } from "../eclub/store/cekTalebiYetkisi";
export interface EczaneKilavuzFirmasi { firma_id: string; firma_adi: string; eclub_store_aktif: boolean; eczanem_aktif: boolean }
type KosulluParca = KilavuzParcasi & { modul?: "cek" | "cek_diger" | "eczanem"; cekKapaliMetin?: string };
const ECZANE_KILAVUZU: { giris: string[]; bolumler: { baslik: string; parcalar: KosulluParca[] }[] } = {
  "giris": [],
  "bolumler": [
    {
      "baslik": "Ekranınızı Tanıyın",
      "parcalar": [
        {
          "tip": "baslik",
          "metin": "Başlangıç ekranınız"
        },
        {
          "tip": "paragraf",
          "metin": "Giriş yaptıktan sonra E-Club ana sayfasına ulaşabilirsiniz. Bu alanda, firmaların size gönderdiği yayınları ve kendi çalışmalarınızın sonuçlarını görebilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "Üst bölümde üç özet alan bulunur:"
        },
        {
          "tip": "liste",
          "sirali": false,
          "maddeler": [
            "**Yeni Yayınlar:** Henüz başlamadığınız ve tamamlama süresi devam eden yayınları görebilirsiniz.",
            "**Tamamlananlar:** Tamamladığınız yayınları görebilirsiniz.",
            "**Net Puan:** Kazandığınız puanlardan ileri sarma kayıpları çıkarıldıktan sonra kalan puanı görebilirsiniz."
          ]
        },
        {
          "tip": "paragraf",
          "metin": "**Yeni Yayınlar** veya **Tamamlananlar** alanına basarak ilgili yayınları görüntüleyebilirsiniz. Aynı seçeneğe yeniden basarak bu seçimi kaldırabilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "Firmalar ve Yayınları"
        },
        {
          "tip": "paragraf",
          "metin": "Sol menüdeki **Firmalar ve Yayınları** alanından erişiminiz bulunan firmaları görebilirsiniz. Mobil cihazlarda menüyü üst bölümdeki menü düğmesiyle açabilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "Firmalar, adları ve logolarıyla gösterilir. Her firmanın altında **Yeni Yayın** ve **Toplam Yayın** sayıları bulunur. Firma kartına basarak ilgili firmanın çalışma alanına geçebilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "Firma ve ürün seçimi"
        },
        {
          "tip": "paragraf",
          "metin": "Firma sayfasında ürün seçerek ilgili ürünün yayınlarına ve sonuçlarına ulaşabilirsiniz. Firma veya ürün değiştirdiğinizde gösterilen bilgiler de seçiminize göre değişir."
        },
        {
          "tip": "paragraf",
          "metin": "Bu alanda şu bölümler bulunur:"
        },
        {
          "tip": "liste",
          "sirali": false,
          "maddeler": [
            "**Yayınlar:** Size gönderilen yayınları açıp tamamlayabilirsiniz.",
            "**Yayın Tamamlama Performansı:** Eczanenizdeki üyelerin yayın tamamlama ve puan katkılarını inceleyebilirsiniz."
          ]
        },
        {
          "tip": "liste",
          "sirali": false,
          "maddeler": [
            "**Hediye Çeki Talebi:** Koşulları sağlanan yayınlar için hediye çeki işlemlerine ulaşabilirsiniz. Talep oluşturma işlemi eczanenin sahibi olan eczacı tarafından yapılır.",
            "**Hediye Çeki Takibi:** Taleplerin hangi aşamada olduğunu ve çek bilgilerini takip edebilirsiniz."
          ],
          "modul": "cek"
        },
        {
          "tip": "baslik",
          "metin": "Eczanem menüsü",
          "modul": "eczanem"
        },
        {
          "tip": "paragraf",
          "metin": "Eczanem kullanıma açıksa sol menüde şu alanlar gösterilir:",
          "modul": "eczanem"
        },
        {
          "tip": "liste",
          "sirali": false,
          "maddeler": [
            "**Üyeler:** Eczanenize bağlı Eczanem üyelerinin işlemlerine ulaşabilirsiniz.",
            "**Üye Yayınları:** Eczanenize gönderilen yayınları Eczanem üyelerine iletebilirsiniz.",
            "**İndirim Onayı:** Üyelerin puanlarıyla yararlanacağı indirim işlemlerini inceleyebilirsiniz."
          ],
          "modul": "eczanem"
        },
        {
          "tip": "baslik",
          "metin": "Görünüm tercihi"
        },
        {
          "tip": "paragraf",
          "metin": "Görünüm düğmesinden mavi veya yeşil renk düzenini seçebilirsiniz."
        }
      ]
    },
    {
      "baslik": "Görevleriniz ve Yetkileriniz",
      "parcalar": [
        {
          "tip": "baslik",
          "metin": "Kendi öğrenme süreciniz"
        },
        {
          "tip": "paragraf",
          "metin": "Temsilcilerin size gönderdiği yayınları video, podcast, dijital broşür veya literatür araçlarıyla inceleyebilirsiniz. Yayınları tamamlayabilir, açılan soruları yanıtlayabilir ve puan kazanabilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "Eczanenizin öğrenme sonuçlarını takip etme"
        },
        {
          "tip": "paragraf",
          "metin": "Firma ve ürün seçerek kendi yayınlarınıza ve eczanenizin yayın tamamlama sonuçlarına ulaşabilirsiniz. Eczanenizdeki üyelerin tamamladıkları yayınları ve puan katkılarını inceleyebilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "Farklı firmaların ve ürünlerin sonuçlarını, ilgili firma ve ürün alanından ayrı ayrı takip edebilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "Hediye çeki işlemleri",
          "modul": "cek"
        },
        {
          "tip": "paragraf",
          "metin": "Aynı eczanedeki E-Club üyelerinin kazandığı çekli puanlar, ilgili yayın ve dönem için eczanenin hediye çeki hesabında birlikte değerlendirilir.",
          "modul": "cek"
        },
        {
          "tip": "paragraf",
          "metin": "Hediye çeki talebini, koşullar sağlandığında **eczanenin sahibi olan eczacı** oluşturabilir. İkinci eczacı, yardımcı eczacı ve eczane teknisyenleri puan kazanarak bu hesaba katkıda bulunabilir; talep başlatma işlemi eczanenin sahibi olan eczacı tarafından yapılır.",
          "modul": "cek"
        },
        {
          "tip": "paragraf",
          "metin": "Taleplerin ilerleyişini ve çek bilgilerini **Hediye Çeki Takibi** alanından takip edebilirsiniz.",
          "modul": "cek"
        },
        {
          "tip": "baslik",
          "metin": "Eczanem üyelerini yönetme",
          "modul": "eczanem"
        },
        {
          "tip": "paragraf",
          "metin": "Eczanem kullanıma açıksa eczanenize üye ekleyebilir, mevcut üyeleri görüntüleyebilir ve üyeliklerini aktif veya pasif duruma getirebilirsiniz.",
          "modul": "eczanem"
        },
        {
          "tip": "paragraf",
          "metin": "Üyeyi eczanenizin listesinden çıkarmanız, kişinin Cogniti hesabını tamamen silmez; eczanenizle olan üyelik bağlantısını kaldırır.",
          "modul": "eczanem"
        },
        {
          "tip": "baslik",
          "metin": "Eczanem yayınlarını üyelere ulaştırma",
          "modul": "eczanem"
        },
        {
          "tip": "paragraf",
          "metin": "Temsilcinin eczanenize gönderdiği yayınları **Üye Yayınları** alanından inceleyebilir ve aktif Eczanem üyelerine gönderebilirsiniz.",
          "modul": "eczanem"
        },
        {
          "tip": "paragraf",
          "metin": "Bu işlem, eczanenize ulaşan yayının üyelerinize iletilmesini sağlar. Üyelere gönderim ayrıca sizin tarafınızdan yapılır.",
          "modul": "eczanem"
        },
        {
          "tip": "baslik",
          "metin": "İndirim işlemlerini değerlendirme",
          "modul": "eczanem"
        },
        {
          "tip": "paragraf",
          "metin": "**İndirim Onayı** alanından Eczanem üyelerinin puanlarıyla yararlanmak istedikleri indirim işlemlerini inceleyebilirsiniz. İşlemi uygun bulduğunuzda onaylayabilir veya reddedebilirsiniz.",
          "modul": "eczanem"
        },
        {
          "tip": "paragraf",
          "metin": "Eczanem üye yönetimi, yayın gönderimi ve indirim işlemleri; eczacı, ikinci eczacı, yardımcı eczacı ve eczane teknisyeni unvanlarıyla, bağlı bulunduğunuz eczane için yapılabilir.",
          "modul": "eczanem"
        }
      ]
    },
    {
      "baslik": "Yayın İşlemleri",
      "parcalar": [
        {
          "tip": "baslik",
          "metin": "Yayınlara ulaşma"
        },
        {
          "tip": "paragraf",
          "metin": "Ana sayfadan veya **Firmalar ve Yayınları** menüsünden size gönderilen içeriklere ulaşabilirsiniz."
        },
        {
          "tip": "liste",
          "sirali": true,
          "maddeler": [
            "İncelemek istediğiniz firmayı ve firmanın ürünlerini seçebilirsiniz.",
            "**Yayınlar** bölümünden içeriği açabilirsiniz.",
            "Yayının aracına göre videoyu izleyebilir, podcast’i dinleyebilir, dijital broşürü inceleyebilir veya literatürü okuyabilirsiniz."
          ]
        },
        {
          "tip": "paragraf",
          "metin": "Ana sayfadaki **Yeni Yayınlar** ve **Tamamlananlar** alanlarından da ilgili yayınları görüntüleyebilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "Yayını tamamlama ve soruları yanıtlama"
        },
        {
          "tip": "paragraf",
          "metin": "Yayını tamamladığınızda, soru hakkınız bulunuyorsa sorular açılır. Bütün sorular için cevaplarınızı seçerek gönderebilir, ardından doğru ve yanlış cevaplarınızı görebilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "Sorular açıldığında yayından ayrılmadan yanıtlamanız önerilir. Yanıtlamadan ayrılıp yayını yeniden başlatmanız durumunda önceki soruları yanıtlama hakkınız yeniden açılmaz."
        },
        {
          "tip": "baslik",
          "metin": "Yayınları ne zamana kadar tamamlayabilirsiniz?"
        },
        {
          "tip": "paragraf",
          "metin": "Gönderilen yayından puan kazanma ve soruları yanıtlama süresi, gönderimden itibaren **15 gündür**."
        },
        {
          "tip": "paragraf",
          "metin": "Bu süre geçtikten sonra da yayını inceleyebilirsiniz; ancak süresi geçen gönderimden puan kazanamaz ve soruları yanıtlayamazsınız. Bu nedenle yeni yayınları zamanında tamamlamanız önerilir."
        },
        {
          "tip": "baslik",
          "metin": "Eczanem üyelerine yayın gönderme",
          "modul": "eczanem"
        },
        {
          "tip": "paragraf",
          "metin": "Seçili firma Eczanem’i kullanıma açmışsa, eczanenize ulaşan ilgili yayınları **Üye Yayınları** alanından Eczanem üyelerinize gönderebilirsiniz.",
          "modul": "eczanem"
        },
        {
          "tip": "liste",
          "sirali": true,
          "maddeler": [
            "Göndermek istediğiniz yayınları seçebilirsiniz.",
            "**Gönderim oluştur** düğmesiyle gönderim alanını açabilirsiniz.",
            "Yayınları alacak aktif üyeleri seçebilirsiniz.",
            "Özette yayınları ve alıcıları gözden geçirerek gönderimi onaylayabilirsiniz.",
            "İşlem sonunda gönderilen ve varsa gönderilemeyen kayıtların sonucunu görebilirsiniz."
          ],
          "modul": "eczanem"
        },
        {
          "tip": "paragraf",
          "metin": "Aynı yayının aynı üyeye yeniden gönderilmesi engellenir. Birden fazla yayın seçtiğinizde alıcının, seçtiğiniz yayınların tamamını alabilecek durumda olması gerekir.",
          "modul": "eczanem"
        },
        {
          "tip": "baslik",
          "metin": "Gönderimleri takip etme",
          "modul": "eczanem"
        },
        {
          "tip": "paragraf",
          "metin": "**Üye Yayınları** alanındaki **Tümü**, **Gönderime Hazır** ve **Gönderilenler** seçenekleriyle yayınları inceleyebilirsiniz.",
          "modul": "eczanem"
        },
        {
          "tip": "paragraf",
          "metin": "Gönderilmiş yayınların ayrıntılarından hangi üyelere ulaştırıldığını takip edebilirsiniz.",
          "modul": "eczanem"
        }
      ]
    },
    {
      "baslik": "Puanlar ve Kazanımlar",
      "parcalar": [
        {
          "tip": "baslik",
          "metin": "Yayınları tamamlayarak puan kazanma"
        },
        {
          "tip": "paragraf",
          "metin": "Size gönderilen yayını tamamladığınızda, yayın için tanımlanan puanı kazanabilirsiniz. Videoyu izleyebilir, podcast’i dinleyebilir, dijital broşürü inceleyebilir veya literatürü okuyabilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "Örneğin, **50 puanlık yayını tamamladığınızda 50 puan** kazanabilirsiniz. Aynı gönderiyi tekrar açıp tamamlamak, her defasında yeniden puan kazandırmaz. E-Club’da Extra puan uygulanmaz."
        },
        {
          "tip": "paragraf",
          "metin": "Puan kazanma ve soruları yanıtlama süresi, yayının size gönderilmesinden itibaren **15 gündür**. Bu süre içinde hafta sonunda da yayınları tamamlayarak puan kazanabilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "Doğru ve yanlış cevaplar"
        },
        {
          "tip": "paragraf",
          "metin": "Yayını tamamladıktan sonra açılan soruları yanıtlayarak puanınızı artırabilirsiniz. Her doğru cevap için o soruya tanımlanan puan kazanılır."
        },
        {
          "tip": "baslik",
          "metin": "İleri sarma ve net puan"
        },
        {
          "tip": "paragraf",
          "metin": "Videonun bir bölümünü ileri sararak atlarsanız, atladığınız süreye göre puan kaybedersiniz. Ayrıca o izlemede soruları yanıtlama hakkınız kapanır."
        },
        {
          "tip": "paragraf",
          "metin": "Örneğin, **10 dakikalık ve 50 puanlık videonun 2 dakikasını atlarsanız 10 puan kaybedersiniz.**"
        },
        {
          "tip": "paragraf",
          "metin": "Net puanınız, kazandığınız puanlardan ileri sarma kayıplarının çıkarılmasıyla hesaplanır. **100 puan kazanmış ve 10 puan kaybetmişseniz net puanınız 90’dır.**"
        },
        {
          "tip": "baslik",
          "metin": "Çekli ve çeksiz puan"
        },
        {
          "tip": "paragraf",
          "metin": "Yayının kazanım koşulları ilgili firma tarafından belirlenir:"
        },
        {
          "tip": "liste",
          "sirali": false,
          "maddeler": [
            "**Çekli puan:** Öğrenme performansına ve E-Club Ligi’ne katılır. Yayının koşullarına göre hediye çeki hesabında da kullanılır.",
            "**Çeksiz puan:** Öğrenme performansına ve E-Club Ligi’ne katılır; hediye çeki oluşturmaz."
          ]
        },
        {
          "tip": "paragraf",
          "metin": "Aynı eczanedeki üyelerin çekli puanları, **ilgili yayın ve dönem için** birlikte değerlendirilir. Farklı firmaların veya ayrı yayınların puanları tek çek hesabında birleştirilmez."
        },
        {
          "tip": "baslik",
          "metin": "Hediye çeki koşulları",
          "modul": "cek"
        },
        {
          "tip": "paragraf",
          "metin": "Çekli puan bulunan yayınlarda şu koşullarla karşılaşabilirsiniz:",
          "modul": "cek"
        },
        {
          "tip": "liste",
          "sirali": false,
          "maddeler": [
            "**Siparişsiz çek:** Ürün siparişi vermeden hediye çeki talep edilebilir.",
            "**Siparişle artan çek:** Sipariş verilmeden çek alınabilir; ürün siparişi verildiğinde çek tutarı artırılabilir.",
            "**Sipariş zorunlu çek:** Çek alınabilmesi için belirtilen ürün siparişinin verilmesi gerekir."
          ],
          "modul": "cek"
        },
        {
          "tip": "paragraf",
          "metin": "Puanın çek tutarına karşılığı ve sipariş koşulları yayına göre değişir. İşlem öncesinde ilgili yayının koşullarını inceleyebilirsiniz.",
          "modul": "cek"
        },
        {
          "tip": "baslik",
          "metin": "Hediye çeki ne zaman talep edilir?",
          "modul": "cek"
        },
        {
          "tip": "paragraf",
          "metin": "Puanlar iki aylık dönemlerde birikir. Hediye çeki talebi, bu dönemi takip eden ayın **1–7. günleri arasında**, eczanenin sahibi olan eczacı tarafından oluşturulabilir.",
          "modul": "cek"
        },
        {
          "tip": "paragraf",
          "metin": "Örneğin, **ocak–şubat dönemindeki kazanımlar için 1–7 Mart arasında** talepte bulunulabilir.",
          "modul": "cek"
        },
        {
          "tip": "baslik",
          "metin": "Kullanılmayan çekli puanlar",
          "modul": "cek"
        },
        {
          "tip": "paragraf",
          "metin": "Siparişsiz veya siparişi isteğe bağlı yayınlarda kullanılmayan çekli puanlar, aynı eczane ve yayın için sonraki döneme aktarılır.",
          "modul": "cek"
        },
        {
          "tip": "paragraf",
          "metin": "Sipariş zorunlu yayınlarda, talep süresi içinde geçerli bir siparişli çek talebi oluşturulmamışsa ilgili dönemin kullanılmayan puanları silinir.",
          "modul": "cek"
        },
        {
          "tip": "paragraf",
          "metin": "Ayrıca her yıl **8 Ocak’ta**, önceki yıldan kullanılmadan kalan puanlar silinir. Önceki yılın son dönemi için **1–7 Ocak talep hakkı korunur**. Geçerli talepler için ayrılmış puanlar bu yıllık silinmeden etkilenmez.",
          "modul": "cek"
        }
      ]
    },
    {
      "baslik": "Raporlar ve Sonuçları Takip Etme",
      "parcalar": [
        {
          "tip": "baslik",
          "metin": "Firma ve ürün seçimi"
        },
        {
          "tip": "paragraf",
          "metin": "**Firmalar ve Yayınları** menüsünden incelemek istediğiniz firmayı ve firmanın ürünlerini seçebilirsiniz. Yayın, performans ve hediye çeki bilgileri bu seçime göre gösterilir.",
          "cekKapaliMetin": "**Firmalar ve Yayınları** menüsünden incelemek istediğiniz firmayı ve firmanın ürünlerini seçebilirsiniz. Yayın ve performans bilgileri bu seçime göre gösterilir."
        },
        {
          "tip": "baslik",
          "metin": "Yayın Tamamlama Performansı"
        },
        {
          "tip": "paragraf",
          "metin": "Eczanenizdeki üyelerin çalışmalarını **Yayın Tamamlama Performansı** bölümünden inceleyebilirsiniz. Dönem seçerek şu sonuçları görebilirsiniz:"
        },
        {
          "tip": "liste",
          "sirali": false,
          "maddeler": [
            "**Bu dönemde kazanılan puan:** Seçili ürünün yayınlarından oluşan puan toplamı.",
            "**Tamamlanan yayın:** Eczanenizdeki üyelerin yaptığı toplam tamamlama sayısı.",
            "**Katkı sağlayan üye:** Sonuçlara katkıda bulunan E-Club üyesi sayısı."
          ]
        },
        {
          "tip": "paragraf",
          "metin": "Bu bilgiler yalnızca sizin çalışmalarınızı değil, eczanenizdeki üyelerin ortak sonuçlarını gösterir."
        },
        {
          "tip": "baslik",
          "metin": "Haftalara göre inceleme"
        },
        {
          "tip": "paragraf",
          "metin": "**Haftalık puan cetvelinde** video, podcast, dijital broşür ve literatür sonuçlarını ayrı satırlarda görebilirsiniz. Puanlar, yayınların tamamlandığı haftada gösterilir."
        },
        {
          "tip": "paragraf",
          "metin": "Cetveldeki noktaya basarak ilgili yayın aracını ve haftayı seçebilirsiniz. Alt bölümdeki hafta bağlantılarından da seçiminizi değiştirebilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "Üyelerin katkılarını görme"
        },
        {
          "tip": "paragraf",
          "metin": "Seçtiğiniz araç ve hafta için, alttaki **Üye katkıları** alanında şu bilgileri inceleyebilirsiniz:"
        },
        {
          "tip": "liste",
          "sirali": false,
          "maddeler": [
            "Üyenin adı.",
            "Tamamladığı yayın sayısı.",
            "Yayın tamamlamadan kazandığı puan.",
            "Doğru cevaplardan kazandığı puan.",
            "Puan kaybı ve toplam puan katkısı."
          ]
        },
        {
          "tip": "paragraf",
          "metin": "Böylece eczanenizin sonucuna hangi üyelerin, hangi çalışmalarla katkıda bulunduğunu görebilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "Performans puanı ile çek bakiyesinin farkı",
          "modul": "cek"
        },
        {
          "tip": "paragraf",
          "metin": "Performans ekranı, seçtiğiniz dönemde yapılan çalışmaların sonucunu gösterir. Çekli ve çeksiz puanlar birlikte değerlendirilir.",
          "modul": "cek"
        },
        {
          "tip": "paragraf",
          "metin": "Hediye çeki hesabında ise çekli puanlar, önceki dönemden aktarılan puanlar, talepler için kullanılan puanlar ve yayının kazanım koşulları dikkate alınır. Bu nedenle performans puanı ile çek için kullanılabilecek puan aynı olmayabilir.",
          "modul": "cek"
        },
        {
          "tip": "baslik",
          "metin": "Hediye Çeki Takibi",
          "modul": "cek"
        },
        {
          "tip": "paragraf",
          "metin": "Seçili firmanın **Hediye Çeki Takibi** bölümünden taleplerinizi ve hangi aşamada olduklarını görebilirsiniz.",
          "modul": "cek"
        },
        {
          "tip": "paragraf",
          "metin": "Üst bölümde **Toplam Talep**, **Onay Sürecinde**, **Teslim Edilen** ve **İptal** sayıları gösterilir. İlgili talebin ayrıntılarından yayın bilgisini, talep tarihini, çek tutarını ve işlem durumunu inceleyebilirsiniz.",
          "modul": "cek"
        },
        {
          "tip": "paragraf",
          "metin": "Teslim edilen dijital çeklerin kodlarına da bu alandan ulaşabilirsiniz.",
          "modul": "cek"
        }
      ]
    },
    {
      "baslik": "Sık Karşılaşılan Durumlar",
      "parcalar": [
        {
          "tip": "baslik",
          "metin": "Yayını tamamladım, neden puan kazanamadım?"
        },
        {
          "tip": "paragraf",
          "metin": "Yayının size gönderilmesinden itibaren **15 günlük süre** geçmişse yayını inceleyebilirsiniz; ancak puan kazanamazsınız."
        },
        {
          "tip": "paragraf",
          "metin": "Aynı gönderiden daha önce tamamlama puanı kazandıysanız, yeniden tamamlamanız bu puanı tekrar kazandırmaz."
        },
        {
          "tip": "baslik",
          "metin": "Yayını tamamladım, sorular neden açılmadı?"
        },
        {
          "tip": "paragraf",
          "metin": "Gönderimin puan kazanma süresi dolmuşsa veya videoyu ileri sarmışsanız sorular açılmaz."
        },
        {
          "tip": "paragraf",
          "metin": "Sorular açıldıktan sonra yanıtlamadan ayrılıp yayını yeniden başlatmanız durumunda da önceki soruları yanıtlama hakkınız yeniden açılmaz."
        },
        {
          "tip": "baslik",
          "metin": "Puanımız var, neden hediye çeki talep edemiyoruz?",
          "modul": "cek"
        },
        {
          "tip": "paragraf",
          "metin": "Önce ilgili firma, ürün ve yayının koşullarını kontrol edebilirsiniz:",
          "modul": "cek"
        },
        {
          "tip": "liste",
          "sirali": false,
          "maddeler": [
            "Çek için kullanılabilecek yeterli **çekli puan** bulunmalıdır.",
            "Talep, ilgili iki aylık dönemi takip eden ayın **1–7. günleri arasında** oluşturulmalıdır.",
            "Sipariş zorunluysa yayında belirtilen ürün siparişi koşulu sağlanmalıdır.",
            "Talep işlemi eczanenin sahibi olan eczacı tarafından yapılmalıdır."
          ],
          "modul": "cek"
        },
        {
          "tip": "paragraf",
          "metin": "Çeksiz puanlar öğrenme sonuçlarına katılır; hediye çeki hesabında kullanılamaz.",
          "modul": "cek"
        },
        {
          "tip": "baslik",
          "metin": "İkinci eczacı, yardımcı eczacı veya eczane teknisyeni olarak çek talebi oluşturabilir miyim?",
          "modul": "cek_diger"
        },
        {
          "tip": "paragraf",
          "metin": "Çekli puan kazanarak eczanenizin hesabına katkıda bulunabilirsiniz. Hediye çeki talebini ise eczanenin sahibi olan eczacı oluşturur.",
          "modul": "cek_diger"
        },
        {
          "tip": "baslik",
          "metin": "Hediye çeki talebimiz onaylandı, ancak çek kodu neden henüz görünmüyor?",
          "modul": "cek"
        },
        {
          "tip": "paragraf",
          "metin": "Talebin onaylanması ile çek kodlarının hazırlanması farklı aşamalardır. Temsilci, bölge müdürü ve takım müdürü onaylarının ardından çek kodları tanımlanır.",
          "modul": "cek"
        },
        {
          "tip": "paragraf",
          "metin": "Güncel aşamayı **Hediye Çeki Takibi** alanından inceleyebilirsiniz. Kodları gönderilen çekler **Teslim Edilen** olarak gösterilir.",
          "modul": "cek"
        },
        {
          "tip": "baslik",
          "metin": "Performans ekranındaki puan ile çek için kullanılabilecek puan neden farklı?",
          "modul": "cek"
        },
        {
          "tip": "paragraf",
          "metin": "Performans ekranında seçtiğiniz dönemin çekli ve çeksiz puanları birlikte gösterilir.",
          "modul": "cek"
        },
        {
          "tip": "paragraf",
          "metin": "Çek için kullanılabilecek tutarda ise yalnızca çekli puanlar, önceki dönemden aktarılan puanlar, taleplerde kullanılan puanlar ve yayının kazanım koşulları dikkate alınır. Bu nedenle iki tutar aynı olmayabilir.",
          "modul": "cek"
        },
        {
          "tip": "baslik",
          "metin": "Eczanem yayınını göndermek istediğim üyeyi neden seçemiyorum?",
          "modul": "eczanem"
        },
        {
          "tip": "paragraf",
          "metin": "Üyenin eczanenizde aktif olması ve seçtiğiniz yayını daha önce almamış olması gerekir.",
          "modul": "eczanem"
        },
        {
          "tip": "paragraf",
          "metin": "Birden fazla yayın seçtiğinizde üyenin bunların tamamını alabilecek durumda olması gerekir. Seçilemeyen üyenin yanında gösterilen açıklamadan nedeni öğrenebilirsiniz.",
          "modul": "eczanem"
        },
        {
          "tip": "baslik",
          "metin": "Üyeyi pasife aldığımda veya listeden çıkardığımda hesabı silinir mi?",
          "modul": "eczanem"
        },
        {
          "tip": "paragraf",
          "metin": "Pasife alma, kişinin eczanenizdeki üyeliğini pasif duruma getirir. Listeden çıkarma ise eczanenizle olan üyelik bağlantısını kaldırır.",
          "modul": "eczanem"
        },
        {
          "tip": "paragraf",
          "metin": "Bu işlemler kişinin Cogniti hesabını tamamen silmez.",
          "modul": "eczanem"
        },
        {
          "tip": "paragraf",
          "metin": "**Beklediğim yayın veya sonuç görünmüyor.**"
        },
        {
          "tip": "paragraf",
          "metin": "Seçili firma ve ürünü kontrol edebilirsiniz. Ana sayfada **Yeni Yayınlar** veya **Tamamlananlar** seçiliyse aynı seçeneğe yeniden basarak seçimi kaldırabilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "Performans ekranında seçtiğiniz dönemi, yayın aracını ve haftayı da kontrol edebilirsiniz. Hata mesajı gösteriliyorsa bunu kayıt bulunmadığı şeklinde değerlendirmeyiniz; sunulan **Tekrar dene** seçeneğini kullanabilirsiniz."
        }
      ]
    }
  ]
};

/** Bayraklar yalnız seçili, erişilebilir firmadan alınır; başka firmanın açık modülü kullanılmaz. */
export function eczaneKilavuzunuSec(firma: EczaneKilavuzFirmasi | null, rol: string) {
  const cek = firma?.eclub_store_aktif === true;
  const acik = { cek, cek_diger: cek && !eclubCekTalebiOlusturabilirMi(rol), eczanem: firma?.eczanem_aktif === true };
  return { giris: [...ECZANE_KILAVUZU.giris], bolumler: ECZANE_KILAVUZU.bolumler.map(bolum => {
    const parcalar: KilavuzParcasi[] = [];
    for (const parca of bolum.parcalar) {
      if (parca.modul && !acik[parca.modul]) continue;
      if (parca.tip === "liste") {
        const onceki = parcalar.at(-1);
        if (onceki?.tip === "liste" && onceki.sirali === parca.sirali) onceki.maddeler.push(...parca.maddeler);
        else parcalar.push({ tip: "liste", sirali: parca.sirali, maddeler: [...parca.maddeler] });
      } else parcalar.push({ tip: parca.tip, metin: !cek && parca.cekKapaliMetin ? parca.cekKapaliMetin : parca.metin });
    }
    return { baslik: bolum.baslik, parcalar };
  }) };
}

/** Açık firma sayfası manuel seçime üstün gelir; eşleşmeyen rota başka firmaya düşmez. */
export function eczaneKilavuzFirmasiniSec(firmalar: EczaneKilavuzFirmasi[], pathname: string, firmaId: string | null, manuelId: string) {
  const kodluRota = pathname.match(/^\/eclub\/(?:ana-sayfa\/)?firma\/([^/]+)/)?.[1];
  let rota = firmaId;
  if (kodluRota) {
    try { rota = decodeURIComponent(kodluRota); } catch { return { firma: null, rotaSecimi: true }; }
  }
  const firma = firmalar.find(f => rota ? f.firma_id === rota || eclubFirmaAdiYolu(f.firma_adi) === rota : f.firma_id === manuelId) ?? null;
  return { firma, rotaSecimi: !!rota };
}
