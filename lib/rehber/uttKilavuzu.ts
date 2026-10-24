// Onaylı içerik kaynağı: docs/KULLANIM_KILAVUZU_UTT.md
// Metin değişikliklerinde iki dosya birlikte güncellenir.
import type { KilavuzParcasi } from "./ureticiKilavuzu";

type Modul = "eclub" | "eczanem";
type KosulluParca = KilavuzParcasi & { modul?: Modul; eczanemKapaliMetin?: string };
interface UttKilavuzu {
  giris: { metin: string; modul?: Modul }[];
  bolumler: { baslik: string; parcalar: KosulluParca[] }[];
}
const UTT_KILAVUZU: UttKilavuzu = {
  "giris": [
    {
      "metin": "Cogniti’de size sunulan yayınları inceleyebilir, tamamlayabilir ve sorularını yanıtlayarak puan kazanabilirsiniz. Bölge müdürünüzün önerdiği yayınları takip edebilir, kişisel sonuçlarınızı raporlardan ve liglerden izleyebilirsiniz."
    },
    {
      "metin": "E-Club kapsamında eczacı ve eczane teknisyenlerinden takım oluşturabilir, ilgili yayınları üyelerinize ulaştırabilirsiniz.",
      "modul": "eclub"
    }
  ],
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
          "metin": "Giriş yaptıktan sonra **Ana Sayfa** ekranına ulaşabilirsiniz. Yeni, devam eden ve tamamlanan yayınlarınızı; bu hafta kazandığınız puanı ve toplam puanınızı görebilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "**Yeni İçerikler**, **Devam Edenler** veya **Tamamlananlar** alanına basarak ilgili yayınları görüntüleyebilirsiniz. Aynı seçeneğe yeniden basarak genel görünüme dönebilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "Yayın rafları"
        },
        {
          "tip": "paragraf",
          "metin": "Devam ettiğiniz yayınlara, yeni yayınlara ve son tamamladıklarınıza raflardan ulaşabilirsiniz. Beğendiğiniz, favorilerinize eklediğiniz ve en çok izlenen yayınları da ilgili raflarda bulabilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "Araç seçiminden video, podcast, dijital broşür veya literatür yayınlarını görüntüleyebilirsiniz."
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
            "**Eğitim Yayınları:** Ürün, medikal, ürün-medikal, satış, yönetim ve insan kaynakları eğitimlerine ulaşabilirsiniz.",
            "**Önerilen Yayınlar:** Bölge müdürünüzün önerilerini, tamamladıklarınızı ve süresi dolanları takip edebilirsiniz.",
            "**T-Club Raporları:** Kendi çalışmalarınızın ve puanlarınızın sonuçlarını inceleyebilirsiniz.",
            "**T-Club Ligi:** Kişisel puanınızı ve sıralamanızı görebilirsiniz."
          ]
        },
        {
          "tip": "liste",
          "sirali": false,
          "maddeler": [
            "**E-Club Takımım:** Eczanelerinizi ve takım üyelerinizi yönetebilirsiniz.",
            "**E-Club Yayınları:** Üyelere gönderilecek yayınları inceleyebilir ve gönderebilirsiniz.",
            "**E-Club Ligi:** E-Club takımınızın puanını ve sıralamasını takip edebilirsiniz."
          ],
          "modul": "eclub"
        },
        {
          "tip": "liste",
          "sirali": false,
          "maddeler": [
            "**Eczanem Yayınları:** İlgili yayınları eczanelere gönderebilirsiniz.",
            "**Mutabakat:** Eczanem indirim işlemlerini değerlendirebilir ve onay sürecini takip edebilirsiniz."
          ],
          "modul": "eczanem"
        },
        {
          "tip": "baslik",
          "metin": "Mobil kullanım"
        },
        {
          "tip": "paragraf",
          "metin": "Mobil cihazlarda yayınlar alt alta gösterilir. **Daha Fazla Göster** düğmesiyle diğer yayınlara ulaşabilirsiniz. Sağ kenardaki bölüm seçicisinden yayın rafları arasında geçiş yapabilirsiniz."
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
          "metin": "Size sunulan yayınları video, podcast, dijital broşür veya literatür araçlarıyla inceleyebilirsiniz. Yayınları tamamlayabilir, açılan soruları yanıtlayabilir ve ilgili koşulları sağlayarak puan kazanabilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "Bölge müdürünüzün önerdiği yayınları, belirtilen başlangıç ve bitiş tarihleriyle takip edebilirsiniz. Kişisel sonuçlarınızı T-Club Raporları’ndan, sıralamanızı T-Club Ligi’nden izleyebilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "E-Club takımınız",
          "modul": "eclub"
        },
        {
          "tip": "paragraf",
          "metin": "Sorumluluğunuzdaki eczaneleri listenize ekleyebilir, eczacı ve eczane teknisyenlerinden E-Club takımınızı oluşturabilirsiniz. Takımınıza ad verebilir, üyelerin bilgilerini güncelleyebilir ve eczanedeki üyeliklerini pasife alabilirsiniz.",
          "modul": "eclub"
        },
        {
          "tip": "paragraf",
          "metin": "Cogniti havuz listesinde bulunmayan eczane için bilgilerini girerek onay gelmesini bekleyiniz. Eczaneyi, onaylandıktan sonra listenize ekleyebilirsiniz.",
          "modul": "eclub"
        },
        {
          "tip": "baslik",
          "metin": "E-Club yayınlarını ulaştırma",
          "modul": "eclub"
        },
        {
          "tip": "paragraf",
          "metin": "İncelemesini tamamladığınız uygun yayınları, takımınızdaki ilgili üyelere gönderebilir veya ileri tarihli gönderim planlayabilirsiniz. Gönderimlerin tamamlanma, cevap ve puan sonuçlarını takip edebilirsiniz.",
          "modul": "eclub"
        },
        {
          "tip": "baslik",
          "metin": "Eczanem yayınlarını ulaştırma",
          "modul": "eczanem"
        },
        {
          "tip": "paragraf",
          "metin": "Eczanem yayınlarını inceleyerek yetkili olduğunuz eczanelere gönderebilirsiniz. Eczaneye ulaşan yayınlar, yetkili eczane personeli tarafından Eczanem üyelerine iletilir.",
          "modul": "eczanem"
        },
        {
          "tip": "baslik",
          "metin": "Mutabakat işlemleri",
          "modul": "eczanem"
        },
        {
          "tip": "paragraf",
          "metin": "Eczanelerde gerçekleşen Eczanem indirim işlemlerini inceleyebilir; **Onay**, **Beklet** veya **Ret** kararı verebilirsiniz. Karar verdiğiniz işlemleri bölge müdürünüzün onayına gönderebilir ve sürecin ilerleyişini takip edebilirsiniz.",
          "modul": "eczanem"
        }
      ]
    },
    {
      "baslik": "Yayın İşlemleri",
      "parcalar": [
        {
          "tip": "baslik",
          "metin": "Yayınları açma ve tamamlama"
        },
        {
          "tip": "paragraf",
          "metin": "Ana sayfadaki raflardan veya **Eğitim Yayınları** menüsünden incelemek istediğiniz yayını açabilirsiniz. Yayının aracına göre videoyu izleyebilir, podcast’i dinleyebilir, dijital broşürü inceleyebilir veya literatürü okuyabilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "Yarım kalan yayınlarınıza **Devam Edenler** alanından ulaşabilirsiniz. Tamamlama koşulları sağlandığında ve soru hakkınız bulunduğunda sorular açılır. Yanıtlarınızı seçerek gönderebilir, ardından sonuçlarınızı görebilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "Sorular açıldığında yanıtlamadan ayrılıp yayını yeniden başlatmanız, önceki soru hakkınızın kapanmasına neden olabilir. Soruları aynı oturumda yanıtlamanız önerilir."
        },
        {
          "tip": "baslik",
          "metin": "Önerilen yayınları takip etme"
        },
        {
          "tip": "paragraf",
          "metin": "Bölge müdürünüzün önerdiği yayınlara **Önerilen Yayınlar** menüsünden ulaşabilirsiniz. Yayınların başlangıç ve bitiş tarihlerini görebilir; tamamlanan ve süresi dolan önerileri ayrı ayrı takip edebilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "E-Club yayınlarını gönderme",
          "modul": "eclub"
        },
        {
          "tip": "paragraf",
          "metin": "E-Club yayınlarını eczacı veya eczane teknisyeni hedef kitlesine göre görüntüleyebilirsiniz. Göndermek istediğiniz yayınların incelemesini tamamladıktan sonra gönderim oluşturabilirsiniz.",
          "modul": "eclub"
        },
        {
          "tip": "liste",
          "sirali": true,
          "maddeler": [
            "Göndermek istediğiniz yayınları seçebilirsiniz.",
            "**Gönderim oluştur** alanında **Şimdi gönder** veya **Bir güne planla** seçeneğini belirleyebilirsiniz.",
            "Alıcıları, eczanelerine göre listelenen takım üyeleriniz arasından seçebilirsiniz. Seçilemeyen üyelerin yanında uygun olmama nedeni gösterilir.",
            "**Özeti göster** düğmesiyle yayınları, alıcıları ve gönderim zamanını gözden geçirebilirsiniz.",
            "Seçiminize göre **Gönderimi oluştur** veya **Planı kaydet** düğmesiyle işlemi tamamlayabilirsiniz."
          ],
          "modul": "eclub"
        },
        {
          "tip": "paragraf",
          "metin": "İleri tarihli gönderimler için hafta içi gün seçebilirsiniz. Planlama, mevcut iki aylık dönem içinde kalmak üzere en fazla takip eden haftaya yapılabilir. Plan kaydı oluşturulduğunda üyeye hemen yayın gönderilmez; tamamlama süresi gerçek gönderimle başlar.",
          "modul": "eclub"
        },
        {
          "tip": "paragraf",
          "metin": "**Planlananlar** alanından bekleyen gönderimleri ve gerçekleşmeyen gönderimlerin nedenlerini takip edebilirsiniz. **Gönderilenler** alanından gönderilmiş yayınlara ulaşabilirsiniz.",
          "modul": "eclub"
        },
        {
          "tip": "baslik",
          "metin": "Eczanem yayınlarını gönderme",
          "modul": "eczanem"
        },
        {
          "tip": "paragraf",
          "metin": "Eczanem yayınlarını, incelemelerini tamamladıktan sonra uygun eczanelere gönderebilirsiniz.",
          "modul": "eczanem"
        },
        {
          "tip": "liste",
          "sirali": true,
          "maddeler": [
            "**Eczanem Yayınları** sayfasında göndermek istediğiniz yayınları seçebilirsiniz.",
            "**Gönderim oluştur** alanından uygun eczaneleri seçebilirsiniz. Seçilemeyen eczanelerin yanında nedenleri gösterilir.",
            "**Özet** aşamasında yayınları ve alıcı eczaneleri gözden geçirebilirsiniz.",
            "**Eczanelere gönder** düğmesiyle gönderimi tamamlayabilirsiniz."
          ],
          "modul": "eczanem"
        },
        {
          "tip": "paragraf",
          "metin": "Bu işlemle yayınlar seçtiğiniz eczanelere hemen ulaştırılır. Eczanem üyelerine gönderim, eczanedeki yetkili personel tarafından yapılır.",
          "modul": "eczanem"
        }
      ]
    },
    {
      "baslik": "Puanlar ve Kazanımlar",
      "parcalar": [
        {
          "tip": "baslik",
          "metin": "Hangi saatlerde puan kazanabilirsiniz?"
        },
        {
          "tip": "paragraf",
          "metin": "Puan kazanabilmek için yayını **pazartesi–cuma günleri, Türkiye saatiyle 07.00’den itibaren ve 20.30’dan önce** açıp izlemeye, dinlemeye veya okumaya başlamanız gerekir."
        },
        {
          "tip": "paragraf",
          "metin": "Örneğin, salı günü saat **20.20’de izlemeye başladığınız videoyu 20.40’ta bitirmeniz**, puan kazanmanıza engel olmaz. Ancak aynı videoya 20.30’da başlamanız durumunda puan kazanamazsınız."
        },
        {
          "tip": "paragraf",
          "metin": "Diğer saatlerde ve hafta sonunda da yayınlardan yararlanabilirsiniz; bu zamanlarda yaptığınız çalışmalar puan kazandırmaz."
        },
        {
          "tip": "baslik",
          "metin": "Yayını tamamladığınızda ne kazanırsınız?"
        },
        {
          "tip": "paragraf",
          "metin": "Videoyu izleyip, podcast’i dinleyip, dijital broşürü inceleyip veya literatürü okuyup tamamladığınızda yayının kartında gösterilen puanı kazanabilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "Örneğin, **50 puanlık videoyu ilk kez tamamladığınızda 50 puan** kazanırsınız. Aynı videoyu tekrar izlemek, her defasında yeniden 50 puan kazandırmaz. Tekrarlar için ayrıca **Extra puan** kazanılabilir."
        },
        {
          "tip": "baslik",
          "metin": "Soruları yanıtladığınızda ne olur?"
        },
        {
          "tip": "paragraf",
          "metin": "Yayını tamamladıktan sonra açılan soruları yanıtlayarak puanınızı artırabilirsiniz. Her sorunun doğru cevap puanı ayrı belirlenir."
        },
        {
          "tip": "paragraf",
          "metin": "Örneğin, doğru cevap puanı **10** olan soruyu doğru yanıtlarsanız **10 puan kazanırsınız**. Yanlış yanıtlarsanız toplam puanınızdan **10 puan düşülür**."
        },
        {
          "tip": "paragraf",
          "metin": "Sorular, yayını ilk kez açıp ileri sarmadan tamamlamanıza bağlıdır. İlk başladığınız yayını yarım bırakıp yeniden başlatmanız veya videoyu ileri sarmanız soru hakkınızı kaybetmenize neden olabilir. Sorular açıldığında, yayından ayrılmadan yanıtlamanız önerilir."
        },
        {
          "tip": "baslik",
          "metin": "Extra puan nasıl kazanılır?"
        },
        {
          "tip": "paragraf",
          "metin": "Kartında **Extra** puanı gösterilen yayınları tekrar tamamlayarak ek puan kazanabilirsiniz. Bunun için, puanını daha önce kazandığınız yayını **aynı ay içinde üç kez daha, baştan sona ve ileri sarmadan** tamamlamanız gerekir. Bu tekrarlara da puan kazanılabilen gün ve saatlerde başlanmalıdır."
        },
        {
          "tip": "paragraf",
          "metin": "Örneğin, kartında **50 Puan ve +10 Extra** yazan videoyu ilk kez bu ay izliyorsanız:"
        },
        {
          "tip": "liste",
          "sirali": false,
          "maddeler": [
            "İlk tamamlamada **50 puan** kazanırsınız.",
            "İkinci tamamlamada Extra puan kazanılmaz.",
            "Üçüncü tamamlamada Extra puan kazanılmaz.",
            "Dördüncü tamamlamada üç tekrar tamamlanmış olur ve **10 Extra puan** kazanırsınız."
          ]
        },
        {
          "tip": "paragraf",
          "metin": "Videonun ilk 50 puanını önceki ayda kazandıysanız, bu ay yapacağınız üç tekrar yeterlidir. Tekrarlar her ay yeniden sayılır; önceki ayın tekrarları yeni aya taşınmaz."
        },
        {
          "tip": "paragraf",
          "metin": "Extra için yayını kendiniz seçerek tekrar açmanız gerekir. Bölge müdürünüzün önerisi üzerinden yaptığınız izlemeler bu üç tekrara dahil edilmez. Aynı yayın için aynı ayda daha fazla tekrar yapmanız, yeniden Extra puan kazandırmaz."
        },
        {
          "tip": "baslik",
          "metin": "Videoyu ileri sararsanız ne olur?"
        },
        {
          "tip": "paragraf",
          "metin": "Videonun bir bölümünü ileri sararak atlarsanız puanınızdan düşülür. Atlama süresi arttıkça kaybınız da artar."
        },
        {
          "tip": "paragraf",
          "metin": "Örneğin, **10 dakikalık ve 50 puanlık videonun 2 dakikasını atlarsanız 10 puan kaybedersiniz.** Ayrıca o izlemede soruları yanıtlama hakkınız kapanır."
        },
        {
          "tip": "baslik",
          "metin": "Bölge müdürünüzün önerdiği yayınlar"
        },
        {
          "tip": "paragraf",
          "metin": "Önerilen yayına belirtilen tarihler içinde ve puan kazanılabilen saatlerde başlayıp ileri sarmadan tamamladığınızda, ayrıca **öneri puanı** kazanabilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "Öneriyi süresi içinde tamamlamazsanız, öneriyi tamamlayarak kazanabileceğiniz puan kadar kayıp oluşur. Bu nedenle **Önerilen Yayınlar** sayfasındaki bitiş tarihlerini takip etmeniz önerilir."
        },
        {
          "tip": "baslik",
          "metin": "E-Club gönderimlerinden nasıl puan kazanırsınız?",
          "modul": "eclub"
        },
        {
          "tip": "paragraf",
          "metin": "Gönderdiğiniz yayını takımınızdaki üye, gönderimden sonraki **15 günlük süre içinde** tamamladığında **10 puan** kazanabilirsiniz. Yalnızca gönderim yapmak puan kazandırmaz.",
          "modul": "eclub"
        },
        {
          "tip": "paragraf",
          "metin": "Örneğin, yayını gönderdiğiniz üç üyenin üçü de bu süre içinde tamamladığında toplam **30 puan** kazanabilirsiniz. Üyenin aynı gönderiyi tekrar tamamlaması size yeniden 10 puan kazandırmaz.",
          "modul": "eclub"
        },
        {
          "tip": "paragraf",
          "metin": "Bu kazanım, üyenin kendi puanından ayrıdır; sizin **T-Club puanınıza** eklenir.",
          "modul": "eclub"
        },
        {
          "tip": "baslik",
          "metin": "Net puanınız neyi gösterir?"
        },
        {
          "tip": "paragraf",
          "metin": "Net puan, kazandığınız puanlardan kayıplarınız çıkarıldıktan sonra kalan tutardır."
        },
        {
          "tip": "paragraf",
          "metin": "Örneğin, **100 puan kazanmış ve 20 puan kaybetmişseniz net puanınız 80’dir.** Puanınızın nereden geldiğini ve hangi işlemlerde azaldığını **T-Club Raporları** üzerinden inceleyebilirsiniz."
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
          "metin": "Kendi çalışmalarınızın sonuçlarına **T-Club Raporları** menüsünden ulaşabilirsiniz. Bu sayfada puanınızın hangi çalışmalardan kazanıldığını, nerelerde puan kaybettiğinizi ve tamamlanmayı bekleyen çalışmalarınızı görebilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "**Haftalık, Aylık, Dönemlik veya Yıllık** seçeneklerinden incelemek istediğiniz süreyi seçebilirsiniz. Eğitim konusunu ve yayın aracını değiştirerek sonuçları daraltabilirsiniz. Örneğin, yalnızca videolarla yaptığınız çalışmaların sonuçlarını inceleyebilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "**Kazandıranlar** alanında şu bilgiler gösterilir:"
        },
        {
          "tip": "liste",
          "sirali": false,
          "maddeler": [
            "**Yayın Tamamlama:** Başladığınız, tamamladığınız ve yarım bıraktığınız çalışmalar ile tamamlamadan kazandığınız puanlar.",
            "**Cevaplama:** Yanıtladığınız sorular, doğru cevaplarınız, doğru cevap oranınız ve kazandığınız cevap puanları.",
            "**Öneri:** Bölge müdürünüzden gelen öneriler, süresinde tamamladıklarınız, bekleyenler ve kazandığınız öneri puanları.",
            "**Extra:** Tekrar tamamladığınız yayınlar, Extra puana yaklaşan tekrarlarınız ve kazandığınız Extra puanlar."
          ]
        },
        {
          "tip": "liste",
          "sirali": false,
          "maddeler": [
            "**E-Club:** Üyelere gönderdiğiniz yayınlar, ulaştığınız kişi sayısı, tamamlanan ve bekleyen gönderimler ile size puan kazandıran tamamlamalar."
          ],
          "modul": "eclub"
        },
        {
          "tip": "paragraf",
          "metin": "**Kaybettirenler** alanında ise ileri sarma, yanlış cevap ve süresinde tamamlanmayan öneriler nedeniyle oluşan puan kayıplarını ayrı ayrı inceleyebilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "Sayfanın üstündeki **Bölge Katkısı, Takım Katkısı ve Firma Katkısı** alanları, kendi net puanınızın ilgili grubun toplam net puanı içindeki payını gösterir."
        },
        {
          "tip": "baslik",
          "metin": "T-Club Ligi"
        },
        {
          "tip": "paragraf",
          "metin": "Kişisel sıralamanızı **T-Club Ligi** menüsünden takip edebilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "**Bölge, Takım veya Firma** seçimiyle kimlerle karşılaştırıldığınızı değiştirebilirsiniz. Böylece kendi bölgenizdeki, bağlı olduğunuz takımdaki veya firma genelindeki temsilciler arasındaki yerinizi görebilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "Sıralama, seçtiğiniz süredeki net puanlara göre yapılır. Aynı net puana sahip temsilciler aynı sırayı paylaşır. Haftalık, aylık, dönemlik ve yıllık sonuçları ayrı ayrı inceleyebilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "Sayfanın üstündeki aylık liderler alanı, firma genelinde ayın ilk üç temsilcisini gösterir."
        },
        {
          "tip": "baslik",
          "metin": "E-Club Ligi",
          "modul": "eclub"
        },
        {
          "tip": "paragraf",
          "metin": "Eczacı ve eczane teknisyenlerinden oluşturduğunuz takımın sıralamasına **E-Club Ligi** menüsünden ulaşabilirsiniz.",
          "modul": "eclub"
        },
        {
          "tip": "paragraf",
          "metin": "Bu ligde takım üyelerinizin yayınları tamamlayarak ve soruları yanıtlayarak oluşturdukları sonuçlar değerlendirilir. **Çekli ve çeksiz puanlar birlikte** lig puanını oluşturur.",
          "modul": "eclub"
        },
        {
          "tip": "paragraf",
          "metin": "Takımların sıralamasının yanında şu bilgileri görebilirsiniz:",
          "modul": "eclub"
        },
        {
          "tip": "liste",
          "sirali": false,
          "maddeler": [
            "Üye ve aktif üye sayıları.",
            "Tamamlanan yayın ve doğru cevap sayıları.",
            "Çekli puan, çeksiz puan ve toplam lig puanı."
          ],
          "modul": "eclub"
        },
        {
          "tip": "paragraf",
          "metin": "Kendi takımınız listede **Benim Takımım** ifadesiyle belirtilir. Seçtiğiniz süreye göre takımınızın yerini ve diğer takımların sonuçlarını inceleyebilirsiniz.",
          "modul": "eclub"
        },
        {
          "tip": "baslik",
          "metin": "Kişisel puanınız ile E-Club takım puanınızın farkı",
          "modul": "eclub"
        },
        {
          "tip": "paragraf",
          "metin": "E-Club üyesinin yayını tamamlamasıyla size verilen **10 puan**, sizin kişisel T-Club hesabınıza eklenir. Üyenin yayından ve cevaplarından kazandığı puanlar ise **E-Club takımınızın** sonucuna katılır.",
          "modul": "eclub"
        },
        {
          "tip": "paragraf",
          "metin": "Bu nedenle T-Club Ligi’ndeki kişisel puanınız ile E-Club Ligi’ndeki takım puanınız farklıdır.",
          "modul": "eclub"
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
          "metin": "Öncelikle yayına başladığınız günü ve saati kontrol edebilirsiniz. Hafta sonunda veya hafta içi 07.00’den önce ya da 20.30’dan itibaren başladığınız yayınlar puan kazandırmaz."
        },
        {
          "tip": "paragraf",
          "metin": "Aynı yayından daha önce tamamlama puanı kazandıysanız, tekrar tamamlamanız bu puanı yeniden kazandırmaz. Ek puan kazanabileceğiniz tekrarlar, **4. Puanlar ve Kazanımlar** bölümündeki Extra kurallarına göre değerlendirilir."
        },
        {
          "tip": "paragraf",
          "metin": "E-Club veya Eczanem gönderimi öncesinde yaptığınız inceleme de kişisel eğitimden farklıdır; bu incelemede puan ve soru bulunmaz.",
          "modul": "eclub",
          "eczanemKapaliMetin": "E-Club gönderimi öncesinde yaptığınız inceleme de kişisel eğitimden farklıdır; bu incelemede puan ve soru bulunmaz."
        },
        {
          "tip": "baslik",
          "metin": "Yayını tamamladım, sorular neden açılmadı?"
        },
        {
          "tip": "paragraf",
          "metin": "Videoyu ileri sarmanız veya daha önce başladığınız yayını yarım bırakıp yeniden başlatmanız soru hakkınızı kaybetmenize neden olabilir. Puan kazanılabilen saatlerin dışında başladığınız yayınlarda da sorular açılmaz."
        },
        {
          "tip": "paragraf",
          "metin": "Sorular açıldıktan sonra yanıtlamadan ayrılıp yayını yeniden başlatmanız durumunda, önceki soruları yeniden yanıtlama hakkı verilmez."
        },
        {
          "tip": "baslik",
          "metin": "E-Club yayını “Gönderime Hazır” görünüyor, ancak üyeyi seçemiyorum.",
          "modul": "eclub"
        },
        {
          "tip": "paragraf",
          "metin": "**Gönderime Hazır**, sizin yayını incelemeyi tamamladığınızı gösterir. Her üyeye hemen gönderilebileceği anlamına gelmez.",
          "modul": "eclub"
        },
        {
          "tip": "paragraf",
          "metin": "Üyenin rolünün yayına uygun olmaması, haftalık gönderim hakkının dolması veya aynı yayın için bekleme süresinin devam etmesi seçimi engelleyebilir. Üyenin yanında gösterilen açıklamadan nedeni öğrenebilirsiniz.",
          "modul": "eclub"
        },
        {
          "tip": "baslik",
          "metin": "Aynı E-Club yayınını üyeye neden yeniden gönderemiyorum?",
          "modul": "eclub"
        },
        {
          "tip": "paragraf",
          "metin": "Aynı üyeye aynı yayının gönderimleri arasında en az **15 gün** bulunmalıdır. Önceden oluşturduğunuz gönderim planları da bu hesapta dikkate alınır.",
          "modul": "eclub"
        },
        {
          "tip": "paragraf",
          "metin": "Ayrıca her iki aylık dönemde, ilk gönderimin ardından en fazla **iki yeniden gönderim** yapılabilir. Yeni döneme geçilmesi, 15 günlük bekleme süresini kaldırmaz.",
          "modul": "eclub"
        },
        {
          "tip": "baslik",
          "metin": "Planladığım E-Club yayını neden gönderilmemiş?",
          "modul": "eclub"
        },
        {
          "tip": "paragraf",
          "metin": "**Planlananlar** alanından gönderimin durumunu inceleyebilirsiniz. Gerçekleşmeyen gönderimin yanında nedeni gösterilir.",
          "modul": "eclub"
        },
        {
          "tip": "paragraf",
          "metin": "Planladığınız gün geldiğinde yayın hâlâ yayında olmalı ve alıcı gönderim koşullarını karşılamalıdır. Plan oluşturmanız, bu koşullar sonradan değişse de gönderimin mutlaka yapılacağı anlamına gelmez.",
          "modul": "eclub"
        },
        {
          "tip": "baslik",
          "metin": "Eklemek istediğim eczane Cogniti havuz listesinde bulunmuyor.",
          "modul": "eclub"
        },
        {
          "tip": "paragraf",
          "metin": "Eczanenin bilgilerini girerek onay gelmesini bekleyiniz. Eczaneyi, onaylandıktan sonra listenize ekleyebilirsiniz. Onay bekleyen eczane, bu aşamada listenize eklenemez.",
          "modul": "eclub"
        },
        {
          "tip": "baslik",
          "metin": "Takımıma eklediğim üye giriş yapamıyor.",
          "modul": "eclub"
        },
        {
          "tip": "paragraf",
          "metin": "Yeni üye, e-postasına gönderilen davet bağlantısından kendi şifresini oluşturmalıdır. Üye adına şifre belirlemeniz gerekmez.",
          "modul": "eclub"
        },
        {
          "tip": "paragraf",
          "metin": "Davet bağlantısı **24 saat geçerlidir ve bir kez kullanılabilir**. Bağlantının süresi dolmuşsa daveti yeniden gönderebilirsiniz. Yeni davet gönderildiğinde önceki bağlantı geçersizleşir.",
          "modul": "eclub"
        },
        {
          "tip": "baslik",
          "metin": "Eczanem gönderiminde eczaneyi neden seçemiyorum?",
          "modul": "eczanem"
        },
        {
          "tip": "paragraf",
          "metin": "Eczanenin gerekli aktif üye sayısına ulaşmamış olması veya seçtiğiniz yayını daha önce almış olması gönderimi engelleyebilir. Nedeni, eczanenin yanında gösterilir.",
          "modul": "eczanem"
        },
        {
          "tip": "paragraf",
          "metin": "Birden fazla yayın seçtiğinizde eczanenin, seçilen yayınların tamamını alabilecek durumda olması gerekir.",
          "modul": "eczanem"
        },
        {
          "tip": "baslik",
          "metin": "Eczanem yayınını eczaneye gönderdim. Üyelere de ulaşmış oluyor mu?",
          "modul": "eczanem"
        },
        {
          "tip": "paragraf",
          "metin": "Gönderiminiz önce eczaneye ulaşır. Yayının Eczanem üyelerine iletilmesi, eczanedeki yetkili personel tarafından ayrıca yapılır.",
          "modul": "eczanem"
        },
        {
          "tip": "baslik",
          "metin": "Rapor veya lig sonucu güncel görünmüyor."
        },
        {
          "tip": "paragraf",
          "metin": "Önce seçtiğiniz süreyi kontrol edebilirsiniz. Raporda eğitim konusu ve yayın aracı seçimleri de gösterilen sonuçları değiştirir."
        },
        {
          "tip": "paragraf",
          "metin": "Ardından **Yenile** düğmesiyle güncel bilgileri alabilirsiniz. Ekranda hata mesajı gösteriliyorsa, bunu puanınızın veya çalışmalarınızın bulunmadığı şeklinde değerlendirmeyiniz; yeniden yüklemeyi deneyebilirsiniz."
        }
      ]
    }
  ]
};

/** Menüyle aynı firma bayrakları; Eczanem için E-Club da açık olmalıdır. */
export function uttKilavuzunuSec(eclubAcik: boolean, eczanemAcik: boolean) {
  const gorunur = (modul?: Modul) => !modul || (eclubAcik && (modul === "eclub" || eczanemAcik));
  return {
    giris: UTT_KILAVUZU.giris.filter(p => gorunur(p.modul)).map(p => p.metin),
    bolumler: UTT_KILAVUZU.bolumler.map(bolum => {
      const parcalar: KilavuzParcasi[] = [];
      for (const parca of bolum.parcalar) {
        if (!gorunur(parca.modul)) continue;
        if (parca.tip === "liste") {
          const onceki = parcalar.at(-1);
          if (onceki?.tip === "liste" && onceki.sirali === parca.sirali) {
            onceki.maddeler.push(...parca.maddeler);
          } else parcalar.push({ tip: "liste", sirali: parca.sirali, maddeler: [...parca.maddeler] });
        } else parcalar.push({ tip: parca.tip, metin: !eczanemAcik && parca.eczanemKapaliMetin ? parca.eczanemKapaliMetin : parca.metin });
      }
      return { baslik: bolum.baslik, parcalar };
    }),
  };
}
