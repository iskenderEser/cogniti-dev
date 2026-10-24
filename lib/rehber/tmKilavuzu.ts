// Onaylı içerik kaynağı: docs/KULLANIM_KILAVUZU_TM.md
// Metin değişikliklerinde iki dosya birlikte güncellenir.
import type { KilavuzParcasi } from "./ureticiKilavuzu";

type Modul = "cc" | "eclub" | "eclubStore" | "eczanem" | "kulup";
export interface TmKilavuzModulleri {
  ccAcik: boolean;
  eclubAcik: boolean;
  eclubStoreAcik: boolean;
  eczanemAcik: boolean;
}
type KosulluParca = KilavuzParcasi & { modul?: Modul; ccKapaliMetin?: string; yalnizCcMetin?: string };
const TM_KILAVUZU: {
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
          "metin": "Giriş yaptıktan sonra **Ana Sayfa** ekranına ulaşabilirsiniz. Sayfanın üst bölümünde, takımınıza bağlı bölgelerdeki temsilcilerin çalışmalarını özetleyen dört alan bulunur:"
        },
        {
          "tip": "liste",
          "sirali": false,
          "maddeler": [
            "**Öğrenmeye Katılım:** Seçtiğiniz sürede en az bir yayın tamamlayan temsilci sayısını, takımınızdaki aktif temsilci sayısıyla birlikte görebilirsiniz.",
            "**Tamamlanan Öğrenme:** Temsilcilerinizin toplam kaç tamamlama yaptığını görebilirsiniz. Aynı yayının tekrar tamamlanması da bu sayıya dahildir.",
            "**Öneri Takibi:** Bölge müdürlerinizin temsilcilere gönderdiği önerilerin kaçının tamamlandığını, kaçının beklediğini ve kaçının süresinin geçtiğini takip edebilirsiniz.",
            "**Net Saha Puanı:** Temsilcilerinizin kazandıkları ve kaybettikleri puanların sonucunu görebilirsiniz."
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
          "metin": "Zaman seçimi, alttaki yayın raflarını yalnızca o sürede yayımlanan içeriklerle sınırlandırmaz."
        },
        {
          "tip": "baslik",
          "metin": "Yayınları inceleme"
        },
        {
          "tip": "paragraf",
          "metin": "Ana sayfada iki yayın alanı bulunur:",
          "ccKapaliMetin": "Ana sayfada temsilcilere sunulan yayınları inceleyebilirsiniz:"
        },
        {
          "tip": "liste",
          "sirali": false,
          "maddeler": [
            "**T Club Yayınları:** Temsilcilere sunulan yayınları inceleyebilirsiniz."
          ]
        },
        {
          "tip": "liste",
          "sirali": false,
          "maddeler": [
            "**C Club Yayınları:** Bölge müdürlerine sunulan Challenge Club yayınlarını inceleyebilirsiniz."
          ],
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Yayınları açarak içeriklerini görebilirsiniz. Bu incelemeler, sizin adınıza kişisel puan kazanımı veya soru cevaplama işlemi oluşturmaz."
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
            "**Öneri Takibi:** Bölge müdürlerinizin temsilcilere gönderdiği önerileri ve sonuçlarını takip edebilirsiniz.",
            "**Eğitim Yayınları:** Eğitim konularına göre yayınları inceleyebilirsiniz.",
            "**T-Club Raporları:** Takımınızın, bölgelerinizin ve temsilcilerinizin öğrenme sonuçlarını inceleyebilirsiniz.",
            "**T-Club Ligi:** Saha teşkilatının puanlarını ve sıralamalarını takip edebilirsiniz."
          ]
        },
        {
          "tip": "liste",
          "sirali": false,
          "maddeler": [
            "**C-Club Ligi:** Bölge müdürlerinin Challenge Club puanlarını ve sıralamalarını görebilirsiniz."
          ],
          "modul": "cc"
        },
        {
          "tip": "liste",
          "sirali": false,
          "maddeler": [
            "**E-Club Takımım:** Takımınıza bağlı temsilcilerin eczanelerini ve E-Club üyelerini inceleyebilirsiniz.",
            "**E-Club Yayınları:** Bölge müdürü ve temsilci seçerek E-Club yayın gönderimlerini takip edebilirsiniz.",
            "**E-Club Ligi:** Eczacı ve eczane teknisyenlerinden oluşan takımların puanlarını ve sıralamalarını görebilirsiniz."
          ],
          "modul": "eclub"
        },
        {
          "tip": "liste",
          "sirali": false,
          "maddeler": [
            "**Mutabakat Takip:** Bölge müdürlerinizin size ilettiği Eczanem mutabakatlarını değerlendirebilir ve sonuçlarını takip edebilirsiniz."
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
          "metin": "Takımınızın öğrenme çalışmalarını takip etme"
        },
        {
          "tip": "paragraf",
          "metin": "Takımınıza bağlı bölgelerin ve temsilcilerin öğrenme sonuçlarını inceleyebilirsiniz. Takımın genel durumundan başlayarak bölge müdürü ve temsilci seçebilir, ilgili kişilerin çalışmalarına ulaşabilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "Tamamlanan yayınları, doğru ve yanlış cevapları, tekrarları, kazanılan puanları ve puan kayıplarını takip edebilirsiniz. İki bölgenin sonuçlarını karşılaştırarak hangi alanlarda desteğe ihtiyaç olduğunu değerlendirebilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "Bölge müdürlerinizin önerilerini izleme"
        },
        {
          "tip": "paragraf",
          "metin": "Bölge müdürlerinizin temsilcilere önerdiği yayınları, başlangıç ve bitiş tarihlerini ve tamamlanma durumlarını görebilirsiniz. Bölge müdürü ve temsilci seçerek önerileri ayrı ayrı inceleyebilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "Temsilcilere yayın önerme işlemi bölge müdürleri tarafından yürütülür. Sizin ekranınızdan bu çalışmalar takip edilir."
        },
        {
          "tip": "baslik",
          "metin": "Yayınları ve Challenge Club sonuçlarını inceleme",
          "ccKapaliMetin": "Yayınları inceleme"
        },
        {
          "tip": "paragraf",
          "metin": "Temsilcilere ve bölge müdürlerine sunulan yayınları açarak içeriklerini inceleyebilirsiniz. Bu incelemeler kişisel puan veya soru cevaplama işlemi oluşturmaz.",
          "ccKapaliMetin": "Temsilcilere sunulan yayınları açarak içeriklerini inceleyebilirsiniz. Bu incelemeler kişisel puan veya soru cevaplama işlemi oluşturmaz."
        },
        {
          "tip": "paragraf",
          "metin": "Bölge müdürlerinin Challenge Club puanlarını ve sıralamalarını **C-Club Ligi** üzerinden takip edebilirsiniz. Challenge gönderme ve yanıtlama işlemleri bölge müdürleri tarafından yürütülür.",
          "modul": "cc"
        },
        {
          "tip": "baslik",
          "metin": "E-Club takımlarını takip etme",
          "modul": "eclub"
        },
        {
          "tip": "paragraf",
          "metin": "Takımınıza bağlı temsilcilerin oluşturduğu E-Club takımlarını inceleyebilirsiniz. Bölge müdürü ve temsilci seçerek eczanelere, eczacılara ve eczane teknisyenlerine ulaşabilirsiniz.",
          "modul": "eclub"
        },
        {
          "tip": "paragraf",
          "metin": "Üyelere gönderilen yayınları ve tamamlama sonuçlarını takip edebilirsiniz. Eczane ve üye yönetimi ile yayın gönderimleri temsilcileriniz tarafından yürütülür.",
          "modul": "eclub"
        },
        {
          "tip": "baslik",
          "metin": "Hediye çeki taleplerinin son onayını verme",
          "modul": "eclubStore"
        },
        {
          "tip": "paragraf",
          "metin": "Temsilci ve bölge müdürü onayından geçerek size ulaşan E-Club hediye çeki taleplerini inceleyebilir, son onayınızı verebilirsiniz.",
          "modul": "eclubStore"
        },
        {
          "tip": "paragraf",
          "metin": "Onayınızdan sonra talep, çek kodlarının tanımlanacağı aşamaya geçer.",
          "modul": "eclubStore"
        },
        {
          "tip": "baslik",
          "metin": "Eczanem mutabakatlarını sonuçlandırma",
          "modul": "eczanem"
        },
        {
          "tip": "paragraf",
          "metin": "Bölge müdürlerinizin onaylayarak size ilettiği Eczanem mutabakatlarını **Mutabakat Takip** ekranından inceleyebilirsiniz. İndirim işlemlerini, kullanılan puanların kaynaklarını ve önceki kararları görebilirsiniz.",
          "modul": "eczanem"
        },
        {
          "tip": "paragraf",
          "metin": "İşlemler için **Onay**, **Beklet** veya **Ret** kararı verebilirsiniz. Onayınız veya reddiniz, mutabakatın son kararıdır. **Beklet** seçtiğiniz işlem ise kararınızı beklemeye devam eder.",
          "modul": "eczanem"
        },
        {
          "tip": "paragraf",
          "metin": "Sonuçlandırdığınız mutabakat için verdiğiniz onay veya ret kararı sonradan değiştirilemez.",
          "modul": "eczanem"
        }
      ]
    },
    {
      "baslik": "Yayın İşlemleri",
      "parcalar": [
        {
          "tip": "baslik",
          "metin": "Yayınları açma ve inceleme"
        },
        {
          "tip": "paragraf",
          "metin": "Ana sayfadaki **T Club Yayınları** alanından temsilcilere, **C Club Yayınları** alanından bölge müdürlerine sunulan yayınları inceleyebilirsiniz. Yayın aracı seçimiyle video, podcast, dijital broşür veya literatür içeriklerini görüntüleyebilirsiniz.",
          "ccKapaliMetin": "Ana sayfadaki **T Club Yayınları** alanından temsilcilere sunulan yayınları inceleyebilirsiniz. Yayın aracı seçimiyle video, podcast, dijital broşür veya literatür içeriklerini görüntüleyebilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "İncelemek istediğiniz yayının kartına basarak içeriği açabilirsiniz. Bu incelemeler sizin adınıza puan kazanımı veya soru cevaplama işlemi oluşturmaz."
        },
        {
          "tip": "paragraf",
          "metin": "Eğitim konusuna göre içerik aradığınızda **Eğitim Yayınları** menüsünden ilgili konuya geçebilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "Bölge müdürlerinizin önerilerini takip etme"
        },
        {
          "tip": "paragraf",
          "metin": "Temsilcilere gönderilen önerilere **Öneri Takibi** menüsünden ulaşabilirsiniz."
        },
        {
          "tip": "liste",
          "sirali": true,
          "maddeler": [
            "Haftalık, aylık, dönemlik veya yıllık seçeneklerden incelemek istediğiniz süreyi belirleyebilirsiniz.",
            "**Toplam Öneri**, **Tamamlanan**, **Bekleyen** veya **Süresi Geçmiş** alanlarından birini seçebilirsiniz.",
            "Listeden bölge müdürünü seçerek önerilerini açabilirsiniz.",
            "Açılan bölümde temsilci seçerek yalnızca o kişiye gönderilen önerileri görüntüleyebilirsiniz.",
            "Yayının adını, kime önerildiğini, gönderim tarihini, başlangıç ve bitiş tarihlerini ve tamamlanma durumunu inceleyebilirsiniz."
          ]
        },
        {
          "tip": "paragraf",
          "metin": "Başlangıç günü henüz gelmeyen öneriler **Planlandı** olarak gösterilir. Bu öneriler de **Bekleyen** toplamına dahildir."
        },
        {
          "tip": "paragraf",
          "metin": "Öneri oluşturma işlemleri bölge müdürleri tarafından yapılır. Bu ekrandan gönderimleri ve sonuçlarını takip edebilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "E-Club yayın gönderimlerini inceleme",
          "modul": "eclub"
        },
        {
          "tip": "paragraf",
          "metin": "**E-Club Yayınları** menüsünden takımınızdaki temsilcilerin yayın gönderimlerini inceleyebilirsiniz.",
          "modul": "eclub"
        },
        {
          "tip": "liste",
          "sirali": true,
          "maddeler": [
            "Eczacı, eczane teknisyeni veya her iki gruba yönelik yayın alanını seçebilirsiniz.",
            "Bölge müdürü ve temsilci seçerek incelemek istediğiniz kişiye ulaşabilirsiniz.",
            "**Tümü**, **Gönderime Hazır** veya **Gönderilenler** seçenekleriyle yayınları daraltabilirsiniz.",
            "Yayın aracı seçimiyle ilgili içerikleri görüntüleyebilirsiniz.",
            "Yayını açarak içeriğini, gönderim ayrıntılarından ise seçili temsilcinin gönderim kayıtlarını inceleyebilirsiniz."
          ],
          "modul": "eclub"
        },
        {
          "tip": "paragraf",
          "metin": "**Gönderime Hazır**, seçtiğiniz temsilcinin yayın incelemesini tamamladığını gösterir. Yayının bütün üyelere gönderilebileceği anlamına gelmez; alıcının uygunluğu ve gönderim hakları ayrıca değerlendirilir.",
          "modul": "eclub"
        },
        {
          "tip": "paragraf",
          "metin": "Üyelere gönderim işlemleri temsilcileriniz tarafından yürütülür. Siz, bu ekrandan yapılan gönderimleri takip edebilirsiniz.",
          "modul": "eclub"
        }
      ]
    },
    {
      "baslik": "Puanlar ve Kazanımlar",
      "parcalar": [
        {
          "tip": "baslik",
          "metin": "Takım puanı neyi gösterir?"
        },
        {
          "tip": "paragraf",
          "metin": "Ana sayfada ve T-Club raporlarında gördüğünüz takım puanı, takımınıza bağlı temsilcilerin çalışmalarından oluşur. Yayınları incelemeniz sizin adınıza kişisel puan oluşturmaz."
        },
        {
          "tip": "paragraf",
          "metin": "Temsilcilerin kazandığı puanlar, önce kendi sonuçlarına; ardından bölge ve takım toplamlarına katılır."
        },
        {
          "tip": "baslik",
          "metin": "Takımınızın puanı nasıl oluşur?"
        },
        {
          "tip": "paragraf",
          "metin": "Temsilcileriniz şu çalışmalardan puan kazanabilir:"
        },
        {
          "tip": "liste",
          "sirali": false,
          "maddeler": [
            "Yayınları tamamlama.",
            "Soruları doğru yanıtlama.",
            "Bölge müdürlerinin önerdiği yayınları belirtilen süre içinde tamamlama.",
            "Tekrar tamamlama koşullarını sağlayarak Extra puan kazanma."
          ]
        },
        {
          "tip": "liste",
          "sirali": false,
          "maddeler": [
            "E-Club üyelerine gönderilen yayınların üyeler tarafından tamamlanması."
          ],
          "modul": "eclub"
        },
        {
          "tip": "paragraf",
          "metin": "İleri sarma, yanlış cevap ve süresinde tamamlanmayan öneriler nedeniyle oluşan kayıplar ise bu kazanımlardan düşülür."
        },
        {
          "tip": "paragraf",
          "metin": "Örneğin, takımınızdaki temsilciler seçtiğiniz sürede toplam **5.000 puan kazanmış ve 300 puan kaybetmişse takımınızın net puanı 4.700’dür.**"
        },
        {
          "tip": "baslik",
          "metin": "Bölge puanı ile takım puanının ilişkisi"
        },
        {
          "tip": "paragraf",
          "metin": "Bölge puanı, o bölgedeki temsilcilerin net puanlarının toplamıdır. Takım puanı ise takımınıza bağlı temsilcilerin net puanlarından oluşur."
        },
        {
          "tip": "paragraf",
          "metin": "Örneğin, iki bölgenizin net puanları **2.000 ve 2.700** ise takımınızın net puanı **4.700** olur. Bölge veya temsilci seçerek bu toplamın nasıl oluştuğunu inceleyebilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "Bölge müdürlerinin kişisel puanları",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Bölge müdürlerinin Challenge Club yayınlarını tamamlayarak, soruları yanıtlayarak ve challenge göndererek kazandıkları puanlar **C-Club Ligi**’nde değerlendirilir.",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Bu kişisel puanlar, temsilcilerin çalışmalarını gösteren **T-Club takım puanına eklenmez**. Böylece temsilcilerin öğrenme sonuçları ile bölge müdürlerinin kendi öğrenme sonuçları ayrı ayrı takip edilebilir.",
          "modul": "cc"
        },
        {
          "tip": "baslik",
          "metin": "E-Club kazanımlarını ayırt etme",
          "modul": "eclub"
        },
        {
          "tip": "paragraf",
          "metin": "E-Club’da iki farklı sonuç bulunur:",
          "modul": "eclub"
        },
        {
          "tip": "liste",
          "sirali": false,
          "maddeler": [
            "**Üyelerin puanları:** Eczacı ve eczane teknisyenlerinin yayınlardan kazandıkları puanlar, temsilcinin oluşturduğu E-Club takımının sonucuna katılır.",
            "**Temsilcinin kazanımı:** Gönderdiği yayın üye tarafından gerekli süre içinde tamamlandığında temsilciye verilen puan, temsilcinin kişisel T-Club sonucuna ve dolayısıyla bölge ve takım toplamına katılır."
          ],
          "modul": "eclub"
        },
        {
          "tip": "paragraf",
          "metin": "Örneğin, temsilcinizin gönderdiği yayını üç üye gerekli süre içinde tamamladığında temsilciniz **30 puan** kazanabilir. Üyelerin aynı yayından kazandıkları puanlar ise ayrıca **E-Club** hesabında değerlendirilir.",
          "modul": "eclub"
        },
        {
          "tip": "baslik",
          "metin": "Puanları nereden inceleyebilirsiniz?"
        },
        {
          "tip": "paragraf",
          "metin": "**T-Club Raporları** üzerinden takımınızın, bölgelerinizin ve temsilcilerinizin kazanım ve kayıplarını inceleyebilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "Bölge müdürlerinin kişisel sonuçlarını **C-Club Ligi**, eczacı ve eczane teknisyenlerinden oluşan takımların sonuçlarını ise **E-Club Ligi** üzerinden takip edebilirsiniz.",
          "modul": "kulup",
          "yalnizCcMetin": "Bölge müdürlerinin kişisel sonuçlarını **C-Club Ligi** üzerinden takip edebilirsiniz.",
          "ccKapaliMetin": "Eczacı ve eczane teknisyenlerinden oluşan takımların sonuçlarını **E-Club Ligi** üzerinden takip edebilirsiniz."
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
          "metin": "Takımınızın öğrenme sonuçlarına **T-Club Raporları** menüsünden ulaşabilirsiniz. İlk görünümde takımınızın toplam sonuçları gösterilir."
        },
        {
          "tip": "paragraf",
          "metin": "Bir bölge müdürü seçerek o bölgenin, ardından temsilci seçerek ilgili kişinin çalışmalarını inceleyebilirsiniz."
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
            "**Öneri:** Bölge müdürlerinin gönderdiği önerilerin sonuçları ve temsilcilerin kazandığı öneri puanları.",
            "**Extra:** Tekrar tamamlanan yayınlar ve kazanılan Extra puanlar."
          ]
        },
        {
          "tip": "liste",
          "sirali": false,
          "maddeler": [
            "**E-Club:** Temsilcilerin üyelere gönderdiği yayınların tamamlanma durumları ve temsilcilere puan kazandıran sonuçlar."
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
          "metin": "Üst bölümde takımınızın net puanını ve firma toplamına katkısını görebilirsiniz. Bölge veya temsilci seçtiğinizde katkı bilgileri de seçiminize göre değişir."
        },
        {
          "tip": "baslik",
          "metin": "İki bölgeyi karşılaştırma"
        },
        {
          "tip": "paragraf",
          "metin": "**Karşılaştırma** seçeneğiyle takımınıza bağlı iki bölge müdürünü seçebilirsiniz. Seçtiğiniz bölgelerin temsilcilerine ait sonuçlar yan yana gösterilir."
        },
        {
          "tip": "paragraf",
          "metin": "Tamamlanan yayınları, cevapları, kazanımları ve kayıpları aynı süre ve eğitim konusu için karşılaştırabilirsiniz. Temsilci sayısını ve **temsilci başına net puanı** da görebilirsiniz. Böylece farklı büyüklükteki bölgeleri yalnızca toplam puanlarıyla değerlendirmek zorunda kalmazsınız."
        },
        {
          "tip": "baslik",
          "metin": "T-Club Ligi"
        },
        {
          "tip": "paragraf",
          "metin": "Temsilcilerin çalışmalarından oluşan sıralamaları **T-Club Ligi** menüsünden takip edebilirsiniz."
        },
        {
          "tip": "liste",
          "sirali": false,
          "maddeler": [
            "**Takım:** Takımınıza bağlı bölgelerin sıralamasını görebilirsiniz. Bölgenin satırını açarak temsilcilerinin sıralamasına ulaşabilirsiniz.",
            "**Firma:** Firma genelindeki takımların toplam puanlarını ve sıralamalarını görebilirsiniz."
          ]
        },
        {
          "tip": "paragraf",
          "metin": "Haftalık, aylık, dönemlik veya yıllık sonuçları seçebilirsiniz. Aynı net puana sahip bölgeler veya takımlar aynı sırayı paylaşır."
        },
        {
          "tip": "paragraf",
          "metin": "Üstteki aylık liderler alanı, başlığında belirtilen ayın takım öğrenme liderlerini gösterir."
        },
        {
          "tip": "baslik",
          "metin": "C-Club Ligi",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Bölge müdürlerinin kişisel Challenge Club sonuçlarını **C-Club Ligi** üzerinden inceleyebilirsiniz.",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Yayın tamamlama, cevaplama, Extra, challenge gönderme ve gönderilen challenge’ın yanıtlanmasından oluşan kazanımları; ileri sarma ve yanlış cevap kayıplarını görebilirsiniz.",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Lig sonuçlarında haftalık, aylık, dönemlik veya yıllık seçim yapabilirsiniz. Sayfanın altındaki **Challenge Listesi — Bu Ay** alanı ise bu seçimden bağımsız olarak içinde bulunulan ayın gönderimlerini gösterir.",
          "modul": "cc"
        },
        {
          "tip": "baslik",
          "metin": "E-Club Ligi",
          "modul": "eclub"
        },
        {
          "tip": "paragraf",
          "metin": "Temsilcilerin eczacı ve eczane teknisyenlerinden oluşturduğu takımların sıralamalarını **E-Club Ligi** üzerinden takip edebilirsiniz.",
          "modul": "eclub"
        },
        {
          "tip": "paragraf",
          "metin": "Takımların üye ve aktif üye sayılarını, tamamlanan yayınlarını, doğru cevaplarını, çekli ve çeksiz puanlarını inceleyebilirsiniz. **Lig puanı, çekli ve çeksiz performans puanlarının toplamıdır.**",
          "modul": "eclub"
        },
        {
          "tip": "paragraf",
          "metin": "Bu sonuçlar, temsilcilerin T-Club puanlarından ve bölge müdürlerinin kişisel C-Club puanlarından ayrı değerlendirilir.",
          "modul": "eclub",
          "ccKapaliMetin": "Bu sonuçlar, temsilcilerin T-Club puanlarından ayrı değerlendirilir."
        }
      ]
    },
    {
      "baslik": "Sık Karşılaşılan Durumlar",
      "parcalar": [
        {
          "tip": "baslik",
          "metin": "Raporda temsilciyi neden seçemiyorum?"
        },
        {
          "tip": "paragraf",
          "metin": "Önce temsilcinin bağlı olduğu bölge müdürünü seçmeniz gerekir. İlgili bölgenin bilgileri yüklendikten sonra temsilci seçebilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "Bölge müdürünü değiştirdiğinizde önceki temsilci seçimi temizlenir. Yeni bölgeden yeniden seçim yapabilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "İki temsilciyi karşılaştırmak istiyorum, ancak bölge müdürü seçimi görünüyor."
        },
        {
          "tip": "paragraf",
          "metin": "TM raporundaki **Karşılaştırma** alanı, iki bölgenin sonuçlarını yan yana incelemeniz içindir. İki bölge müdürü seçerek bu bölgelerdeki temsilcilerin toplam sonuçlarını karşılaştırabilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "Tek temsilcinin çalışmalarını incelemek istediğinizde **Rapor** görünümüne dönerek bölge müdürü ve temsilci seçebilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "Haftalık seçtim, yayın raflarında neden daha eski yayınlar da görünüyor?"
        },
        {
          "tip": "paragraf",
          "metin": "Ana sayfadaki zaman seçimi, üstteki dört özet alanının hangi süreyi göstereceğini belirler. Yayın rafları yalnızca o sürede yayımlanan içeriklerle sınırlandırılmaz."
        },
        {
          "tip": "paragraf",
          "metin": "Raflarda belirli bir araç türünü görmek için video, podcast, dijital broşür veya literatür seçebilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "T-Club, C-Club ve E-Club puanları neden farklı?",
          "modul": "kulup",
          "yalnizCcMetin": "T-Club ve C-Club puanları neden farklı?",
          "ccKapaliMetin": "T-Club ve E-Club puanları neden farklı?"
        },
        {
          "tip": "paragraf",
          "metin": "Bu alanlarda farklı kişilerin çalışmaları değerlendirilir:",
          "modul": "kulup"
        },
        {
          "tip": "liste",
          "sirali": false,
          "maddeler": [
            "**T-Club:** Temsilcilerin öğrenme sonuçları ve bunlardan oluşan bölge ve takım puanları."
          ],
          "modul": "kulup"
        },
        {
          "tip": "liste",
          "sirali": false,
          "maddeler": [
            "**C-Club:** Bölge müdürlerinin kişisel Challenge Club sonuçları."
          ],
          "modul": "cc"
        },
        {
          "tip": "liste",
          "sirali": false,
          "maddeler": [
            "**E-Club:** Eczacı ve eczane teknisyenlerinden oluşan takımların sonuçları."
          ],
          "modul": "eclub"
        },
        {
          "tip": "paragraf",
          "metin": "Bu nedenle puanların birbirine eşit olması beklenmez. Karşılaştırma yaparken seçtiğiniz süreyi de kontrol edebilirsiniz.",
          "modul": "kulup"
        },
        {
          "tip": "baslik",
          "metin": "Bölge müdürüm Eczanem mutabakatını onayladı, ancak işlem neden benim onayımı beklemiyor?",
          "modul": "eczanem"
        },
        {
          "tip": "paragraf",
          "metin": "Bölge müdürünün **Onay** kararı vermesi ve mutabakatı **TM onayına göndermesi** ayrı işlemlerdir. Size ulaşması için gönderme adımının da tamamlanması gerekir.",
          "modul": "eczanem"
        },
        {
          "tip": "paragraf",
          "metin": "Kayıt görünmüyorsa seçili ayı ve durum filtresini de kontrol edebilirsiniz.",
          "modul": "eczanem"
        },
        {
          "tip": "baslik",
          "metin": "Mutabakatta “Beklet” seçtim. Daha sonra karar verebilir miyim?",
          "modul": "eczanem"
        },
        {
          "tip": "paragraf",
          "metin": "Evet. **Beklet**, işlemi sonuçlandırmaz; mutabakat sizin kararınızı beklemeye devam eder. İncelemenizi tamamladığınızda onay veya ret kararı verebilirsiniz.",
          "modul": "eczanem"
        },
        {
          "tip": "paragraf",
          "metin": "**Onay** veya **Ret** ile sonuçlandırdığınız mutabakatın son kararını ise değiştiremezsiniz.",
          "modul": "eczanem"
        },
        {
          "tip": "baslik",
          "metin": "Hediye çeki talebini onayladım. Çek hemen hazır olur mu?",
          "modul": "eclubStore"
        },
        {
          "tip": "paragraf",
          "metin": "Onayınız, talebin son yönetici onayını tamamlar. Ardından çek kodlarının tanımlanması aşamasına geçilir. Bu nedenle talebin onaylanması ile çekin hazırlanması aynı işlem değildir.",
          "modul": "eclubStore"
        },
        {
          "tip": "baslik",
          "metin": "Rapor veya lig sonucu beklediğim gibi görünmüyor."
        },
        {
          "tip": "paragraf",
          "metin": "Seçili süreyi, eğitim konusunu, yayın aracını ve varsa bölge müdürü ile temsilci seçimini kontrol edebilirsiniz. Bu seçimler, gösterilen sonuçları değiştirir."
        },
        {
          "tip": "paragraf",
          "metin": "Ardından **Yenile** düğmesiyle güncel bilgileri alabilirsiniz. Ekranda hata mesajı varsa bunu çalışmaların veya puanların bulunmadığı şeklinde değerlendirmeyiniz; yeniden yüklemeyi deneyebilirsiniz."
        }
      ]
    }
  ]
};

/** Menüdeki modül durumları kullanılır; Eczanem ve çek işlemleri E-Club'a bağlıdır. */
export function tmKilavuzunuSec(moduller: TmKilavuzModulleri) {
  const acik: Record<Modul, boolean> = {
    cc: moduller.ccAcik,
    eclub: moduller.eclubAcik,
    eclubStore: moduller.eclubAcik && moduller.eclubStoreAcik,
    eczanem: moduller.eclubAcik && moduller.eczanemAcik,
    kulup: moduller.ccAcik || moduller.eclubAcik,
  };
  return {
    giris: [...TM_KILAVUZU.giris],
    bolumler: TM_KILAVUZU.bolumler.map(bolum => {
      const parcalar: KilavuzParcasi[] = [];
      for (const parca of bolum.parcalar) {
        if (parca.modul && !acik[parca.modul]) continue;
        if (parca.tip === "liste") {
          const onceki = parcalar.at(-1);
          if (onceki?.tip === "liste" && onceki.sirali === parca.sirali) onceki.maddeler.push(...parca.maddeler);
          else parcalar.push({ tip: "liste", sirali: parca.sirali, maddeler: [...parca.maddeler] });
        } else {
          const metin = !moduller.ccAcik && parca.ccKapaliMetin ? parca.ccKapaliMetin
            : !moduller.eclubAcik && parca.yalnizCcMetin ? parca.yalnizCcMetin : parca.metin;
          parcalar.push({ tip: parca.tip, metin });
        }
      }
      return { baslik: bolum.baslik, parcalar };
    }),
  };
}
