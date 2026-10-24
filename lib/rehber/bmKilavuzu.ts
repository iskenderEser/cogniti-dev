// Onaylı içerik kaynağı: docs/KULLANIM_KILAVUZU_BM.md
// Metin değişikliklerinde iki dosya birlikte güncellenir.
import type { KilavuzParcasi } from "./ureticiKilavuzu";

type Modul = "cc" | "eclub" | "eclubStore" | "eczanem";
export interface BmKilavuzModulleri {
  ccAcik: boolean;
  eclubAcik: boolean;
  eclubStoreAcik: boolean;
  eczanemAcik: boolean;
}
type KosulluParca = KilavuzParcasi & { modul?: Modul; ccKapaliMetin?: string };
const BM_KILAVUZU: {
  giris: string[];
  bolumler: { baslik: string; parcalar: KosulluParca[] }[];
} = {
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
          "metin": "Giriş yaptıktan sonra **Ana Sayfa** ekranına ulaşabilirsiniz. Sayfanın üst bölümünde, bölgenizdeki temsilcilerin çalışmalarını özetleyen dört alan bulunur:"
        },
        {
          "tip": "liste",
          "sirali": false,
          "maddeler": [
            "**Öğrenmeye Katılım:** Seçtiğiniz sürede en az bir yayın tamamlayan temsilci sayısını, bölgenizdeki aktif temsilci sayısıyla birlikte görebilirsiniz.",
            "**Tamamlanan Öğrenme:** Temsilcilerinizin toplam kaç tamamlama yaptığını görebilirsiniz. Aynı yayının tekrar tamamlanması da bu sayıya dahildir.",
            "**Öneri Takibi:** Gönderdiğiniz önerilerin kaçının tamamlandığını, kaçının beklediğini ve kaçının süresinin geçtiğini takip edebilirsiniz.",
            "**Net Saha Puanı:** Bölgenizdeki temsilcilerin kazandıkları ve kaybettikleri puanların sonucunu görebilirsiniz."
          ]
        },
        {
          "tip": "paragraf",
          "metin": "Bu alanlara basarak ilgili rapora veya öneri takip ekranına geçebilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "Zaman ve yayın aracı seçimi"
        },
        {
          "tip": "paragraf",
          "metin": "**Haftalık, Aylık, Dönemlik veya Yıllık** seçenekleriyle özetlerin gösterdiği süreyi değiştirebilirsiniz. Video, podcast, dijital broşür veya literatür seçerek ilgili aracın sonuçlarını inceleyebilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "Bu seçimler, üstteki özetleri değiştirir. Zaman seçimi, alttaki yayın raflarını yalnızca o sürede yayımlanan içeriklerle sınırlandırmaz."
        },
        {
          "tip": "baslik",
          "metin": "Yayın önerme"
        },
        {
          "tip": "paragraf",
          "metin": "Ana sayfadaki **Yayın Öneriniz** düğmesiyle eğitim yayınlarına geçebilirsiniz. Buradan bölgenizdeki temsilcilere önereceğiniz yayınları inceleyebilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "Kendi yayın raflarınız",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Ana sayfanın alt bölümündeki raflardan size sunulan yayınlara ulaşabilirsiniz. **En Son İzlediklerim**, **En Çok İzlenenler**, **En Çok Beğenilenler** ve **En Çok Favorilenenler** gibi rafları inceleyebilirsiniz.",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Bu raflardan açtığınız yayınlar, kendi Challenge Club öğrenme alanınıza aittir. Üstteki dört özet alanı ise temsilcilerinizin çalışmalarını gösterir.",
          "modul": "cc"
        },
        {
          "tip": "baslik",
          "metin": "Menüler"
        },
        {
          "tip": "paragraf",
          "metin": "Masaüstünde sol menüden, mobil cihazlarda üst bölümdeki menü düğmesinden ilgili alana geçebilirsiniz."
        },
        {
          "tip": "liste",
          "sirali": false,
          "maddeler": [
            "**Öneri Takibi:** Temsilcilerinize gönderdiğiniz önerileri ve tamamlanma durumlarını takip edebilirsiniz.",
            "**Eğitim Yayınları:** Eğitim konularına göre yayınları inceleyebilir, temsilcilerinize önereceğiniz içerikleri seçebilirsiniz.",
            "**T-Club Raporları:** Bölgenizin ve temsilcilerinizin öğrenme sonuçlarını inceleyebilirsiniz.",
            "**T-Club Ligi:** Saha teşkilatının puanlarını ve sıralamalarını takip edebilirsiniz."
          ]
        },
        {
          "tip": "liste",
          "sirali": false,
          "maddeler": [
            "**Challenge Club:** Kendi yayınlarınızı tamamlayabilir, diğer bölge müdürlerine challenge gönderebilir ve size gelenleri takip edebilirsiniz.",
            "**C-Club Ligi:** Bölge müdürleri arasındaki kişisel puanınızı ve sıralamanızı görebilirsiniz."
          ],
          "modul": "cc"
        },
        {
          "tip": "liste",
          "sirali": false,
          "maddeler": [
            "**E-Club Takımım:** Bölgenizdeki temsilcilerin E-Club takımlarını, eczanelerini ve üyelerini inceleyebilirsiniz.",
            "**E-Club Yayınları:** Bölgenizdeki E-Club yayın gönderimlerini ve sonuçlarını takip edebilirsiniz.",
            "**E-Club Ligi:** E-Club takımlarının puanlarını ve sıralamalarını görebilirsiniz."
          ],
          "modul": "eclub"
        },
        {
          "tip": "liste",
          "sirali": false,
          "maddeler": [
            "**Mutabakat Takip:** Temsilcilerinizin size ilettiği Eczanem mutabakatlarını değerlendirebilir ve onay sürecini takip edebilirsiniz."
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
          "metin": "Temsilcilerinizin öğrenmesini yönlendirme"
        },
        {
          "tip": "paragraf",
          "metin": "Bölgenizdeki Ürün Tanıtım Temsilcileri ve Kıdemli Ürün Tanıtım Temsilcilerine eğitim yayınları önerebilirsiniz. Önerdiğiniz yayınların başlangıç ve bitiş tarihlerini belirleyebilir; kimlerin tamamladığını, kimlerin henüz tamamlamadığını takip edebilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "Yayın seçimlerinizi ürün, medikal, ürün-medikal, satış, yönetim ve insan kaynakları eğitimleri arasından yapabilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "Bölgenizin sonuçlarını değerlendirme"
        },
        {
          "tip": "paragraf",
          "metin": "Temsilcilerinizin tamamladıkları yayınları, cevaplarını, tekrarlarını ve puan sonuçlarını inceleyebilirsiniz. Bölgenizin genel durumunu görebilir, temsilci seçerek kişisel sonuçlarına ulaşabilir veya iki temsilcinin sonuçlarını karşılaştırabilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "Bu bilgilerden yararlanarak hangi konularda öğrenmenin desteklenmesi gerektiğini değerlendirebilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "Kendi öğrenme süreciniz ve Challenge Club",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Size sunulan Challenge Club yayınlarını tamamlayabilir, sorularını yanıtlayabilir ve puan kazanabilirsiniz.",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Kendinizin tamamladığı yayınları, firmanızdaki diğer bölge müdürlerine challenge olarak gönderebilirsiniz. Size gelen challenge’ları tamamlayabilir, gönderdiğiniz challenge’ların sonuçlarını takip edebilirsiniz. Kişisel sıralamanızı **C-Club Ligi** üzerinden izleyebilirsiniz.",
          "modul": "cc"
        },
        {
          "tip": "baslik",
          "metin": "E-Club takımlarını takip etme",
          "modul": "eclub"
        },
        {
          "tip": "paragraf",
          "metin": "Bölgenizdeki temsilcilerin oluşturduğu E-Club takımlarını inceleyebilirsiniz. Temsilci seçerek bağlı eczaneleri, eczacıları ve eczane teknisyenlerini görebilirsiniz.",
          "modul": "eclub"
        },
        {
          "tip": "paragraf",
          "metin": "Temsilcilerinizin yayın gönderimlerini ve üyelerin tamamlama sonuçlarını takip edebilirsiniz. Eczane ve üye ekleme ile üyelere yayın gönderme işlemleri temsilcileriniz tarafından yürütülür.",
          "modul": "eclub"
        },
        {
          "tip": "baslik",
          "metin": "Hediye çeki taleplerini değerlendirme",
          "modul": "eclubStore"
        },
        {
          "tip": "paragraf",
          "metin": "E-Club kapsamında, temsilcilerinizin onayından geçerek size ulaşan hediye çeki taleplerini inceleyebilirsiniz. Onayladığınız talepler, takım müdürünüzün onayına iletilir.",
          "modul": "eclubStore"
        },
        {
          "tip": "baslik",
          "metin": "Eczanem mutabakatlarını değerlendirme",
          "modul": "eczanem"
        },
        {
          "tip": "paragraf",
          "metin": "Temsilcilerinizin size ilettiği Eczanem mutabakatlarını **Mutabakat Takip** ekranından inceleyebilirsiniz. İndirim işlemlerinin ayrıntılarını ve kullanılan puanların hangi yayınlardan kazanıldığını görebilirsiniz.",
          "modul": "eczanem"
        },
        {
          "tip": "paragraf",
          "metin": "İşlemler için **Onay**, **Beklet** veya **Ret** kararı verebilirsiniz. Onayladığınız işlemleri ayrıca takım müdürünüzün onayına gönderebilirsiniz. Onay vermek ve takım müdürüne göndermek ayrı işlemlerdir.",
          "modul": "eczanem"
        }
      ]
    },
    {
      "baslik": "Yayın İşlemleri",
      "parcalar": [
        {
          "tip": "baslik",
          "metin": "Temsilcilerinize yayın önerme"
        },
        {
          "tip": "paragraf",
          "metin": "Ana sayfadaki **Yayın Öneriniz** düğmesinden veya **Eğitim Yayınları** menüsünden önermek istediğiniz yayınlara ulaşabilirsiniz."
        },
        {
          "tip": "liste",
          "sirali": true,
          "maddeler": [
            "Önermek istediğiniz yayınları seçebilirsiniz.",
            "**Gönderim oluştur** alanında, bölgenizdeki temsilciler arasından alıcıyı seçebilirsiniz.",
            "**Zaman** aşamasında başlangıç ve bitiş günlerini belirleyebilirsiniz. Başlangıç en erken yarın, bitiş ise başlangıç gününden sonraki bir gün olabilir.",
            "**Özet** aşamasında yayınları, alıcıyı ve tarihleri gözden geçirebilirsiniz.",
            "**Önerileri oluştur** düğmesiyle işlemi tamamlayabilirsiniz."
          ]
        },
        {
          "tip": "paragraf",
          "metin": "Tek işlemde seçtiğiniz yayınlar **tek temsilciye** önerilir. Başka bir temsilciye de öneride bulunmak için ayrıca seçim yapabilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "Her temsilciye haftada en fazla **üç yayın** önerebilirsiniz. Gönderim sırasında kalan haftalık ve aylık öneri haklarınızı görebilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "Önerilerin sonuçlarını takip etme"
        },
        {
          "tip": "paragraf",
          "metin": "Gönderdiğiniz önerilere **Öneri Takibi** menüsünden ulaşabilirsiniz. Başlangıç günü henüz gelmeyenleri, tamamlanmayı bekleyenleri, tamamlananları ve süresi geçenleri inceleyebilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "Başlangıç günü gelmeyen öneriler de **Bekleyen** toplamına dahildir. Önerinin ayrıntısından henüz başlamadığını veya tamamlanma süresinin devam ettiğini ayırt edebilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "Kendi yayınlarınızı açma ve tamamlama",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "**Challenge Club → Yayınlar** alanından size sunulan içeriklere ulaşabilirsiniz. Yayının aracına göre videoyu izleyebilir, podcast’i dinleyebilir, dijital broşürü inceleyebilir veya literatürü okuyabilirsiniz.",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Yayını ileri sarmadan tamamladığınızda açılan soruları yanıtlayabilir, ardından sonuçlarınızı görebilirsiniz. Sorular açıldıktan sonra yanıtlamadan ayrılıp yayını yeniden başlatmanız, önceki soruları yanıtlama hakkınızı kapatır.",
          "modul": "cc"
        },
        {
          "tip": "baslik",
          "metin": "Diğer bölge müdürlerine challenge gönderme",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Challenge gönderebilmek için önce ilgili yayını kendiniz tamamlamalısınız.",
          "modul": "cc"
        },
        {
          "tip": "liste",
          "sirali": true,
          "maddeler": [
            "**Challenge Gönder** bölümünü açabilirsiniz.",
            "Tamamladığınız yayınlar arasından göndermek istediğiniz yayını bulabilirsiniz.",
            "Yayının yanındaki **Bölge Müdürleri** alanından uygun alıcıları seçebilirsiniz.",
            "**Gönder** düğmesiyle işlemi tamamlayabilirsiniz."
          ],
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Seçilemeyen alıcının yanında neden gösterilir. Örneğin, alıcının yayını zaten tamamlamış olması veya aynı yayın için bekleyen challenge’ının bulunması gönderimi engelleyebilir.",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Gönderimden sonra kaç challenge’ın gönderildiğini ve varsa hangi seçimlerin gönderilemediğini görebilirsiniz.",
          "modul": "cc"
        },
        {
          "tip": "baslik",
          "metin": "Size gelen challenge’ları tamamlama",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "**Gelen Challengelar** bölümünden size gönderilen yayınları açabilirsiniz. Aynı yayın için bekleyen challenge bulunuyorsa, yayını bu bölümden açmanız gerekir.",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Challenge’lar için tamamlanması gereken son tarih bulunmaz. Yayını tamamladıktan sonra açılan soruları yanıtlayabilirsiniz.",
          "modul": "cc"
        },
        {
          "tip": "baslik",
          "metin": "Gönderdiğiniz challenge’ları takip etme",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "**Gönderilen Challengelar** bölümünden gönderimlerinizi ve alıcıların tamamlama durumlarını inceleyebilirsiniz. Sayfanın üstündeki **Challenge Limiti** alanından o ay kalan gönderim hakkınızı görebilirsiniz.",
          "modul": "cc"
        }
      ]
    },
    {
      "baslik": "Puanlar ve Kazanımlar",
      "parcalar": [
        {
          "tip": "baslik",
          "metin": "Kendi puanınız ile bölgenizin puanı",
          "ccKapaliMetin": "Bölgenizin puanı"
        },
        {
          "tip": "paragraf",
          "metin": "Challenge Club’da tamamladığınız yayınlardan, cevaplarınızdan ve gönderdiğiniz challenge’lardan **kişisel puan** kazanabilirsiniz. Bu puanlarla **C-Club Ligi**’nde yer alırsınız.",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Temsilcilerinizin çalışmalarından oluşan puanlar ise bölgenizin **T-Club** sonuçlarını oluşturur. Temsilcinizin kazandığı puan, sizin kişisel puanınıza eklenmez.",
          "ccKapaliMetin": "Temsilcilerinizin çalışmalarından oluşan puanlar ise bölgenizin **T-Club** sonuçlarını oluşturur."
        },
        {
          "tip": "baslik",
          "metin": "Hangi saatlerde puan kazanabilirsiniz?",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Challenge Club yayınlarını günün her saatinde ve hafta sonunda tamamlayarak puan kazanabilirsiniz. Temsilcilerin eğitimlerinde uygulanan hafta içi saat sınırlaması, sizin Challenge Club çalışmalarınızda uygulanmaz.",
          "modul": "cc"
        },
        {
          "tip": "baslik",
          "metin": "Yayını tamamladığınızda ne kazanırsınız?",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Yayını ilk kez, ileri sarmadan tamamladığınızda kartında gösterilen puanı kazanabilirsiniz. Bu kural hem kendiniz açtığınız yayınlar hem de size challenge olarak gelen yayınlar için geçerlidir.",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Örneğin, **50 puanlık videoyu ileri sarmadan tamamladığınızda 50 puan** kazanırsınız. Aynı videoyu yeniden izlemek, her defasında tekrar 50 puan kazandırmaz.",
          "modul": "cc"
        },
        {
          "tip": "baslik",
          "metin": "Doğru ve yanlış cevaplar",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Yayını tamamladıktan sonra açılan soruları yanıtlayarak puanınızı artırabilirsiniz. Doğru cevapta, soruya tanımlanan puan kazanılır. Yanlış cevapta aynı tutarda puan düşülür.",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Örneğin, **10 puanlık soruyu doğru yanıtlarsanız 10 puan kazanırsınız; yanlış yanıtlarsanız 10 puan kaybedersiniz.**",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Sorular açıldığında, yayından ayrılmadan yanıtlamanız önerilir. Yanıtlamadan ayrılıp yayını yeniden başlatmanız, önceki soruları yanıtlama hakkınızı kapatır.",
          "modul": "cc"
        },
        {
          "tip": "baslik",
          "metin": "Extra puan nasıl kazanılır?",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Kartında **Extra** puanı gösterilen yayını ilk kez tamamladıktan sonra, **aynı ay içinde iki kez daha baştan sona ve ileri sarmadan** tamamlayarak Extra puan kazanabilirsiniz.",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Örneğin, kartında **50 Puan ve +10 Extra** yazan videoyu ilk kez bu ay izliyorsanız:",
          "modul": "cc"
        },
        {
          "tip": "liste",
          "sirali": false,
          "maddeler": [
            "İlk tamamlamada **50 puan** kazanırsınız.",
            "İkinci tamamlamada Extra puan kazanılmaz.",
            "Üçüncü tamamlamada iki tekrar tamamlanmış olur ve **10 Extra puan** kazanırsınız."
          ],
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "İlk tamamlamayı önceki ay yaptıysanız, bu ay yapacağınız iki tekrar yeterlidir. Önceki ayın tekrarları yeni aya taşınmaz. Aynı ayda daha fazla tekrar yapmanız yeniden Extra puan kazandırmaz.",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Tekrar izlemelerinde sorular yeniden açılmaz.",
          "modul": "cc"
        },
        {
          "tip": "baslik",
          "metin": "Challenge gönderdiğinizde ne kazanırsınız?",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Challenge gönderimi başarıyla tamamlandığında **gönderme puanı** kazanabilirsiniz.",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Gönderdiğiniz kişi yayını tamamlayıp sorularını yanıtladığında ayrıca puan kazanabilirsiniz. Bu ikinci kazanım, C-Club Ligi’nde **Referral** adıyla gösterilir.",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Yalnızca yayının tamamlanması ikinci puan için yeterli değildir; soruların da yanıtlanması gerekir. Cevapların tamamının doğru olması şart değildir. Yanlış cevaplardan doğan kayıp, cevaplayan kişinin puanına işlenir.",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Aynı challenge için gönderme ve yanıtlanma kazanımları birer kez verilir.",
          "modul": "cc"
        },
        {
          "tip": "baslik",
          "metin": "Videoyu ileri sararsanız ne olur?",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Videonun bir bölümünü atlarsanız, atladığınız süreye göre puan kaybedersiniz. Ayrıca **o izlemede videoyu tamamlama puanını kazanamaz ve soruları yanıtlayamazsınız.**",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Örneğin, **10 dakikalık ve 50 puanlık videonun 2 dakikasını atlarsanız 10 puan kaybedersiniz.** Kalan kısmı tamamlamanız, o izleme için 50 puanı kazandırmaz.",
          "modul": "cc"
        },
        {
          "tip": "baslik",
          "metin": "Gelen challenge’ı bekletmek puan kaybettirir mi?",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Challenge’larda son tamamlama tarihi bulunmaz. Size gelen challenge’ı henüz tamamlamamış olmanız nedeniyle süre aşımı puanı düşülmez.",
          "modul": "cc"
        },
        {
          "tip": "baslik",
          "metin": "Net puanınız",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Net puanınız; yayın tamamlama, doğru cevap, Extra, challenge gönderme ve gönderdiğiniz challenge’ın yanıtlanmasından kazandığınız puanlardan, ileri sarma ve yanlış cevap kayıplarının çıkarılmasıyla hesaplanır.",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Örneğin, **150 puan kazanmış ve 20 puan kaybetmişseniz net puanınız 130’dur.** Kişisel puan ayrıntılarınızı **C-Club Ligi** üzerinden inceleyebilirsiniz.",
          "modul": "cc"
        }
      ]
    },
    {
      "baslik": "Raporlar ve Ligler",
      "parcalar": [
        {
          "tip": "baslik",
          "metin": "T-Club Raporları"
        },
        {
          "tip": "paragraf",
          "metin": "Bölgenizdeki temsilcilerin çalışmalarını **T-Club Raporları** menüsünden inceleyebilirsiniz. Temsilci seçmediğinizde bölgenizin toplam sonuçları gösterilir. Temsilci seçerek yalnızca o kişinin sonuçlarına ulaşabilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "**Haftalık, Aylık, Dönemlik veya Yıllık** seçenekleriyle incelemek istediğiniz süreyi belirleyebilirsiniz. Eğitim konusunu ve yayın aracını seçerek sonuçları daraltabilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "Raporda şu bilgileri takip edebilirsiniz:"
        },
        {
          "tip": "liste",
          "sirali": false,
          "maddeler": [
            "**Yayın Tamamlama:** Başlanan, tamamlanan ve yarım kalan çalışmalar ile kazanılan tamamlama puanları.",
            "**Cevaplama:** Yanıtlanan sorular, doğru cevaplar, doğru cevap oranı ve kazanılan cevap puanları.",
            "**Öneri:** Gönderdiğiniz önerilerin tamamlanma durumları ve temsilcilerin kazandığı öneri puanları.",
            "**Extra:** Tekrar tamamlanan yayınlar ve kazanılan Extra puanlar."
          ]
        },
        {
          "tip": "liste",
          "sirali": false,
          "maddeler": [
            "**E-Club:** Temsilcilerinizin üyelere gönderdiği yayınların tamamlanma durumları ve temsilcilere puan kazandıran sonuçlar."
          ],
          "modul": "eclub"
        },
        {
          "tip": "liste",
          "sirali": false,
          "maddeler": [
            "**Puan kayıpları:** İleri sarma, yanlış cevap ve süresinde tamamlanmayan öneriler nedeniyle oluşan kayıplar."
          ]
        },
        {
          "tip": "paragraf",
          "metin": "Üst bölümde bölgenizin net puanını, takım ve firma toplamına katkısını görebilirsiniz. Temsilci seçtiğinizde ise o kişinin bölge, takım ve firma toplamındaki payı gösterilir."
        },
        {
          "tip": "baslik",
          "metin": "İki temsilciyi karşılaştırma"
        },
        {
          "tip": "paragraf",
          "metin": "Rapordaki **Karşılaştırma** seçeneğiyle bölgenizden iki temsilci seçebilirsiniz. Aynı süre, eğitim konusu ve yayın aracı için sonuçları yan yana inceleyebilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "Örneğin, iki temsilcinin kaç yayın tamamladığını, soruları hangi doğruluk oranıyla yanıtladığını ve nerelerde puan kaybettiğini karşılaştırabilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "T-Club Ligi"
        },
        {
          "tip": "paragraf",
          "metin": "**T-Club Ligi**, temsilcilerinizin puanlarına göre oluşan sıralamaları gösterir."
        },
        {
          "tip": "liste",
          "sirali": false,
          "maddeler": [
            "**Bölge:** Kendi bölgenizdeki temsilcilerin sıralamasını görebilirsiniz. Temsilcinin satırını açarak kazandığı ve kaybettiği puanların ayrıntılarını inceleyebilirsiniz.",
            "**Takım:** Bağlı olduğunuz takımdaki bölgelerin toplam puanlarını ve birbirlerine göre sıralamalarını görebilirsiniz."
          ]
        },
        {
          "tip": "paragraf",
          "metin": "Haftalık, aylık, dönemlik veya yıllık sonuçları seçebilirsiniz. Aynı net puana sahip temsilciler veya bölgeler aynı sırayı paylaşır."
        },
        {
          "tip": "paragraf",
          "metin": "Sayfanın üstündeki aylık liderler alanında, başlıkta belirtilen ayın bölge öğrenme liderleri gösterilir."
        },
        {
          "tip": "baslik",
          "metin": "C-Club Ligi",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Kendi Challenge Club puanınızı ve diğer bölge müdürleri arasındaki yerinizi **C-Club Ligi** menüsünden takip edebilirsiniz.",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Yayın tamamlama, cevaplama, Extra, challenge gönderme ve gönderdiğiniz challenge’ın yanıtlanmasından kazandığınız puanları; ileri sarma ve yanlış cevap kayıplarınızı inceleyebilirsiniz.",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Lig için haftalık, aylık, dönemlik veya yıllık sonuçları seçebilirsiniz. Sayfanın altındaki **Challenge Listesi — Bu Ay** alanı ise ligde seçtiğiniz süreden bağımsız olarak içinde bulunulan ayın gönderimlerini gösterir.",
          "modul": "cc"
        },
        {
          "tip": "baslik",
          "metin": "E-Club Ligi",
          "modul": "eclub"
        },
        {
          "tip": "paragraf",
          "metin": "Temsilcilerin eczacı ve eczane teknisyenlerinden oluşturduğu takımların sonuçlarını **E-Club Ligi** üzerinden inceleyebilirsiniz.",
          "modul": "eclub"
        },
        {
          "tip": "paragraf",
          "metin": "Takımların üye ve aktif üye sayılarını, tamamlanan yayınlarını, doğru cevaplarını, çekli ve çeksiz puanlarını görebilirsiniz. **Lig puanı, çekli ve çeksiz performans puanlarının toplamıdır.**",
          "modul": "eclub"
        },
        {
          "tip": "paragraf",
          "metin": "Bu ligdeki sonuçlar eczacı ve eczane teknisyenlerinin çalışmalarından oluşur. Temsilcilerinizin kişisel T-Club puanından ve sizin kişisel C-Club puanınızdan ayrıdır.",
          "modul": "eclub",
          "ccKapaliMetin": "Bu ligdeki sonuçlar eczacı ve eczane teknisyenlerinin çalışmalarından oluşur. Temsilcilerinizin kişisel T-Club puanından ayrıdır."
        }
      ]
    },
    {
      "baslik": "Sık Karşılaşılan Durumlar",
      "parcalar": [
        {
          "tip": "baslik",
          "metin": "Temsilcime neden yeni yayın öneremiyorum?"
        },
        {
          "tip": "paragraf",
          "metin": "Aynı temsilciye haftada en fazla **üç yayın** önerebilirsiniz. Daha önce gönderdiğiniz önerilerle birlikte bu sayı aşılacaksa yeni gönderim yapılamaz."
        },
        {
          "tip": "paragraf",
          "metin": "Aylık toplam öneri hakkınız da kontrol edilir. Gönderim ekranında kalan haklarınızı görebilirsiniz. Birden fazla yayın seçtiyseniz, seçtiğiniz yayınların tamamı için yeterli hakkınız bulunmalıdır."
        },
        {
          "tip": "baslik",
          "metin": "Öneri için neden bugünü seçemiyorum?"
        },
        {
          "tip": "paragraf",
          "metin": "Önerinin başlangıç günü en erken **yarın** olabilir. Bitiş günü de başlangıç gününden sonra olmalıdır."
        },
        {
          "tip": "paragraf",
          "metin": "Örneğin, başlangıç için salı gününü seçtiğinizde bitişi en erken çarşamba olarak belirleyebilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "Gönderdiğim öneri neden “Bekleyen” sayısına dahil? Başlangıç günü henüz gelmedi."
        },
        {
          "tip": "paragraf",
          "metin": "**Bekleyen** toplamı, hem başlangıç günü henüz gelmeyen hem de süresi devam eden önerileri kapsar. Önerinin ayrıntısında başlangıç ve bitiş tarihlerini kontrol edebilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "Challenge göndermek istediğim yayın listede görünmüyor.",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "**Challenge Gönder** bölümünde, kendinizin tamamladığı yayınlar listelenir. Henüz tamamlamadığınız yayını önce **Yayınlar** bölümünden açıp tamamlayabilirsiniz.",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Yayın türü seçiminizi de kontrol edebilirsiniz. Örneğin, yalnızca podcast seçiliyse videolar gösterilmez.",
          "modul": "cc"
        },
        {
          "tip": "baslik",
          "metin": "Challenge göndermek istediğim bölge müdürünü neden seçemiyorum?",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Seçilemeyen kişinin yanında neden gösterilir. Başlıca nedenler şunlardır:",
          "modul": "cc"
        },
        {
          "tip": "liste",
          "sirali": false,
          "maddeler": [
            "O ayki toplam **üç challenge** gönderim hakkınızın dolması.",
            "Aynı bölge müdürüne o ay zaten challenge göndermiş olmanız.",
            "Alıcının ilgili yayını zaten tamamlamış olması.",
            "Aynı yayının alıcıya daha önce gönderilmiş olması.",
            "Alıcının aynı yayın için bekleyen challenge’ının bulunması."
          ],
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Yeni aya geçilmesi, bütün engellerin kalkacağı anlamına gelmez. Alıcının yayını tamamlama veya bekleyen challenge durumu ayrıca değerlendirilir.",
          "modul": "cc"
        },
        {
          "tip": "baslik",
          "metin": "Yayını açarken “Gelen challenge var” uyarısı görüyorum.",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Bu yayın size başka bir bölge müdürü tarafından challenge olarak gönderilmiştir. **Gelen Challengelar** bölümüne geçerek yayını oradan açabilirsiniz.",
          "modul": "cc"
        },
        {
          "tip": "baslik",
          "metin": "Gönderdiğim kişi yayını tamamladı, ancak yanıtlanma puanım gelmedi.",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Yayının tamamlanması ile sorularının yanıtlanması farklı aşamalardır. İkinci kazanımınız olan **Referral** puanı, alıcı soruları yanıtladığında oluşur.",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Soruların tamamının doğru yanıtlanması gerekmez; ancak yalnızca yayının izlenip bitirilmesi yeterli değildir.",
          "modul": "cc"
        },
        {
          "tip": "baslik",
          "metin": "Videoyu bitirdim, neden tamamlama puanı kazanamadım?",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Videoyu ileri sardıysanız o izlemede tamamlama puanı verilmez ve sorular açılmaz. Atladığınız süre için ayrıca puan kaybı oluşur.",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Daha önce tamamladığınız videoyu tekrar izlediyseniz de ilk tamamlama puanı yeniden verilmez. Tekrarlar, Extra puan kurallarına göre değerlendirilir.",
          "modul": "cc"
        },
        {
          "tip": "baslik",
          "metin": "Extra puan neden gelmedi?",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "İlk tamamlamanızdan sonra, aynı ay içinde **iki kez daha baştan sona ve ileri sarmadan** tamamlamanız gerekir.",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Örneğin, videoyu bu ay ilk kez tamamladıysanız Extra puan, toplam üçüncü tamamlamada kazanılır. Önceki ayda yaptığınız tekrarlar bu ayın hesabına eklenmez. Aynı ayda Extra puanı zaten kazandıysanız sonraki tekrarlar yeniden Extra puan kazandırmaz.",
          "modul": "cc"
        },
        {
          "tip": "baslik",
          "metin": "Eczanem mutabakatını onayladım, neden takım müdürüne gitmedi?",
          "modul": "eczanem"
        },
        {
          "tip": "paragraf",
          "metin": "Eczanem mutabakatında **Onay** kararı vermek ve işlemi **TM onayına göndermek** ayrı adımlardır. Onay kararınızın ardından gönderme işlemini de tamamlamanız gerekir.",
          "modul": "eczanem"
        },
        {
          "tip": "paragraf",
          "metin": "Takım müdürüne gönderdiğiniz mutabakat için verdiğiniz kararı artık değiştiremezsiniz.",
          "modul": "eczanem"
        },
        {
          "tip": "baslik",
          "metin": "Rapordaki puanla kendi C-Club puanım neden farklı?",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "**T-Club Raporları**, bölgenizdeki temsilcilerin çalışmalarını gösterir. **C-Club Ligi** ise sizin Challenge Club çalışmalarınızdan oluşan kişisel puanınızı gösterir.",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Ayrıca süre, eğitim konusu ve yayın aracı seçimleri sonuçları değiştirir. Karşılaştırmadan önce bu seçimleri kontrol edebilir, **Yenile** düğmesiyle güncel bilgileri alabilirsiniz.",
          "modul": "cc"
        }
      ]
    }
  ]
};

/** Panel menüsüyle aynı firma bayrakları kullanılır; alt modüller E-Club'a bağlıdır. */
export function bmKilavuzunuSec(moduller: BmKilavuzModulleri) {
  const acik: Record<Modul, boolean> = {
    cc: moduller.ccAcik,
    eclub: moduller.eclubAcik,
    eclubStore: moduller.eclubAcik && moduller.eclubStoreAcik,
    eczanem: moduller.eclubAcik && moduller.eczanemAcik,
  };
  return {
    giris: [...BM_KILAVUZU.giris],
    bolumler: BM_KILAVUZU.bolumler.map(bolum => {
      const parcalar: KilavuzParcasi[] = [];
      for (const parca of bolum.parcalar) {
        if (parca.modul && !acik[parca.modul]) continue;
        if (parca.tip === "liste") {
          const onceki = parcalar.at(-1);
          if (onceki?.tip === "liste" && onceki.sirali === parca.sirali) onceki.maddeler.push(...parca.maddeler);
          else parcalar.push({ tip: "liste", sirali: parca.sirali, maddeler: [...parca.maddeler] });
        } else parcalar.push({ tip: parca.tip, metin: !moduller.ccAcik && parca.ccKapaliMetin ? parca.ccKapaliMetin : parca.metin });
      }
      return { baslik: bolum.baslik, parcalar };
    }),
  };
}
