// Onaylı içerik kaynağı: docs/KULLANIM_KILAVUZU_YONETICI.md
// Metin değişikliklerinde iki dosya birlikte güncellenir.
import type { KilavuzParcasi } from "./ureticiKilavuzu";
type KosulluParca = KilavuzParcasi & { modul?: "cc" | "eclub"; ccKapaliMetin?: string; eclubKapaliMetin?: string };
const YONETICI_KILAVUZU: { giris: string[]; bolumler: { baslik: string; parcalar: KosulluParca[] }[] } = {
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
          "metin": "Giriş yaptıktan sonra **Ana Sayfa** ekranına ulaşabilirsiniz. Yönetici rol ailesindeki kullanıcılar, firma genelindeki yayın ve saha sonuçlarını bu ekrandan takip edebilir."
        },
        {
          "tip": "paragraf",
          "metin": "Sayfanın üst bölümünde altı özet alan bulunur:"
        },
        {
          "tip": "liste",
          "sirali": false,
          "maddeler": [
            "**Yayında Toplam Video:** Firmanızdaki yayında olan video sayısını görebilirsiniz.",
            "**Toplam İzleme:** İzleme sayısını takip edebilirsiniz.",
            "**En Çok İzlenen Video:** En fazla izlenen videoyu görebilirsiniz.",
            "**En Çok İzleyen Takım:** İzleme sayısında öne çıkan takımı görebilirsiniz.",
            "**En Çok İzleyen Bölge:** İzleme sayısında öne çıkan bölgeyi görebilirsiniz.",
            "**En Çok İzleyen UTT:** İzleme sayısında öne çıkan temsilciyi görebilirsiniz."
          ]
        },
        {
          "tip": "baslik",
          "metin": "Haftanın En’leri"
        },
        {
          "tip": "paragraf",
          "metin": "Bu alanda, içinde bulunulan haftada en yüksek net puana ulaşan **ilk beş temsilci** gösterilir. Temsilcilerin adlarını ve haftalık net puanlarını birlikte görebilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "Liste, firmanızdaki aktif Ürün Tanıtım Temsilcileri ve Kıdemli Ürün Tanıtım Temsilcileri arasından oluşturulur. Pozitif net puanı bulunan temsilciler listelenir."
        },
        {
          "tip": "baslik",
          "metin": "Yayınları inceleme"
        },
        {
          "tip": "paragraf",
          "metin": "Ana sayfanın yayın alanından veya **Eğitim Yayınları** menüsünden içeriklere ulaşabilirsiniz. Yayının kartına basarak içeriği açabilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "Bu incelemeler sizin adınıza kişisel puan kazanımı veya soru cevaplama işlemi oluşturmaz."
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
            "**Yayın Raporları:** Yayınların üretim yöntemlerini, saha sonuçlarını ve öğrenme araçlarının performansını inceleyebilirsiniz.",
            "**Eğitim Yayınları:** Ürün, medikal, ürün-medikal, satış, yönetim ve insan kaynakları eğitimlerini inceleyebilirsiniz.",
            "**T-Club Raporları:** Takım, bölge ve temsilci seçerek saha teşkilatının öğrenme sonuçlarına ulaşabilirsiniz.",
            "**T-Club Ligi:** Firma genelindeki takımların, bölgelerin ve temsilcilerin puanlarını ve sıralamalarını takip edebilirsiniz."
          ]
        },
        {
          "tip": "liste",
          "sirali": false,
          "maddeler": [
            "**C-Club Ligi:** Bölge müdürlerinin Challenge Club sonuçlarını inceleyebilirsiniz."
          ],
          "modul": "cc"
        },
        {
          "tip": "liste",
          "sirali": false,
          "maddeler": [
            "**E-Club Ligi:** Temsilcilerin eczacı ve eczane teknisyenlerinden oluşturduğu takımların sonuçlarını ve sıralamalarını görebilirsiniz."
          ],
          "modul": "eclub"
        },
        {
          "tip": "baslik",
          "metin": "Mobil kullanım"
        },
        {
          "tip": "paragraf",
          "metin": "Mobil görünümde sağ kenardaki bölüm seçicisinden **Haftanın En’leri** ve **Yayınlar** alanları arasında geçiş yapabilirsiniz. **Tümünü Göster** seçeneğiyle genel görünüme dönebilirsiniz."
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
          "metin": "Firma genelindeki sonuçları değerlendirme"
        },
        {
          "tip": "paragraf",
          "metin": "Firmanızdaki yayınların ve saha teşkilatının sonuçlarını inceleyebilirsiniz. Takım, bölge ve temsilci düzeyinde ilerleyerek genel sonuçların hangi çalışmalardan oluştuğunu görebilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "Tamamlanan yayınları, cevapları, tekrarları, kazanılan puanları ve puan kayıplarını takip edebilirsiniz. Bu bilgilerden yararlanarak öğrenmenin güçlü olduğu ve desteklenmesi gereken alanları değerlendirebilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "Yayınların performansını inceleme"
        },
        {
          "tip": "paragraf",
          "metin": "**Yayın Raporları** üzerinden firmanızdaki yayınların üretim yöntemlerini, eğitim konularına göre sonuçlarını ve öğrenme araçlarının performansını inceleyebilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "Rol ve zaman seçimleriyle farklı kullanıcı gruplarının sonuçlarına ulaşabilirsiniz. Video, podcast, dijital broşür ve literatür araçlarının kullanımını ve puan katkılarını değerlendirebilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "Eğitim içeriklerini inceleme"
        },
        {
          "tip": "paragraf",
          "metin": "Firmanızdaki eğitim yayınlarını açarak içeriklerini inceleyebilirsiniz. Bu incelemeler kişisel puan kazanımı veya soru cevaplama işlemi oluşturmaz."
        },
        {
          "tip": "paragraf",
          "metin": "Yayınların hazırlanması, onaylanması ve yayımlanması ilgili üretici roller tarafından yürütülür. Yönetici olarak bu çalışmaların sonuçlarını raporlardan takip edebilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "Takım ve bölgeleri karşılaştırma"
        },
        {
          "tip": "paragraf",
          "metin": "T-Club raporlarında firma içindeki takımları seçebilir, seçtiğiniz takımın bölgelerine ve temsilcilerine ulaşabilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "Aynı takım içindeki iki bölgenin sonuçlarını karşılaştırabilirsiniz. Tamamlama, cevaplama, öneri ve tekrar sonuçlarını birlikte inceleyerek bölgeler arasındaki farklılıkları değerlendirebilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "Ligleri takip etme"
        },
        {
          "tip": "paragraf",
          "metin": "**T-Club Ligi** üzerinden saha teşkilatının, **C-Club Ligi** üzerinden bölge müdürlerinin kişisel öğrenme sonuçlarını takip edebilirsiniz.",
          "ccKapaliMetin": "**T-Club Ligi** üzerinden saha teşkilatının öğrenme sonuçlarını takip edebilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "**E-Club Ligi** üzerinden ise temsilcilerin eczacı ve eczane teknisyenlerinden oluşturduğu takımların sonuçlarını inceleyebilirsiniz.",
          "modul": "eclub"
        },
        {
          "tip": "paragraf",
          "metin": "Bu ligler farklı kişilerin çalışmalarını gösterir. Her birini kendi katılımcıları ve puanları üzerinden değerlendirebilirsiniz."
        }
      ]
    },
    {
      "baslik": "Yayın İşlemleri",
      "parcalar": [
        {
          "tip": "baslik",
          "metin": "Eğitim yayınlarına ulaşma"
        },
        {
          "tip": "paragraf",
          "metin": "**Eğitim Yayınları** menüsünden incelemek istediğiniz eğitim konusunu seçebilirsiniz. Ürün, medikal, ürün-medikal, satış, yönetim ve insan kaynakları eğitimlerine ilgili başlıklardan ulaşabilirsiniz."
        },
        {
          "tip": "liste",
          "sirali": true,
          "maddeler": [
            "İncelemek istediğiniz eğitim konusunu açabilirsiniz.",
            "Video, podcast, dijital broşür veya literatür seçerek yayınları araç türüne göre daraltabilirsiniz.",
            "Arama alanından ilgili yayını bulabilirsiniz.",
            "Yayının kartını veya **Önizle** seçeneğini kullanarak içeriği açabilirsiniz."
          ]
        },
        {
          "tip": "paragraf",
          "metin": "Ürün seçimi sunulan ekranlarda, ilgili ürünü seçerek yalnızca o ürünün yayınlarını görüntüleyebilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "İçeriği inceleme"
        },
        {
          "tip": "paragraf",
          "metin": "Yayının aracına göre videoyu izleyebilir, podcast’i dinleyebilir, dijital broşürü inceleyebilir veya literatürü okuyabilirsiniz. İncelemeyi kapatarak yayın listesine dönebilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "Bu kullanım, içeriği değerlendirmeniz içindir. Sizin adınıza puan kazanımı veya soru cevaplama işlemi oluşturmaz."
        },
        {
          "tip": "baslik",
          "metin": "Ana sayfadan yayın açma"
        },
        {
          "tip": "paragraf",
          "metin": "Ana sayfadaki yayın kartlarından da içerikleri açabilirsiniz. İncelemeyi kapattığınızda ana sayfaya dönebilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "Mobil görünümde ilk gösterilen yayınların ardından **Daha Fazla Göster** düğmesiyle diğer içeriklere ulaşabilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "Yayın listesinde aradığınızı bulma"
        },
        {
          "tip": "paragraf",
          "metin": "Aradığınız yayın görünmüyorsa seçili eğitim konusunu, ürün ve araç türünü kontrol edebilirsiniz. Arama alanındaki ifadeyi temizleyerek listeyi yeniden inceleyebilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "**Yenile** düğmesiyle güncel yayın listesini alabilirsiniz."
        }
      ]
    },
    {
      "baslik": "Puanlar ve Kazanımlar",
      "parcalar": [
        {
          "tip": "baslik",
          "metin": "Ekranlarda gördüğünüz puanlar"
        },
        {
          "tip": "paragraf",
          "metin": "Yönetici olarak, kullanıcıların çalışmalarından oluşan puanları inceleyebilirsiniz. Yayınları açıp incelemeniz sizin adınıza kişisel puan kazandırmaz."
        },
        {
          "tip": "paragraf",
          "metin": "Yayın kartındaki puan, ilgili yayını tamamlayan kullanıcının kazanabileceği tutarı gösterir. Raporlardaki kazanılan puan ise kullanıcıların yaptığı çalışmalar sonucunda oluşur."
        },
        {
          "tip": "baslik",
          "metin": "T-Club puanları"
        },
        {
          "tip": "paragraf",
          "metin": "T-Club’da temsilcilerin yayın tamamlama, doğru cevap, öneri ve Extra kazanımları değerlendirilir. E-Club gönderimlerinden temsilcilere verilen puanlar da bu hesaba katılır.",
          "eclubKapaliMetin": "T-Club’da temsilcilerin yayın tamamlama, doğru cevap, öneri ve Extra kazanımları değerlendirilir."
        },
        {
          "tip": "paragraf",
          "metin": "İleri sarma, yanlış cevap ve süresinde tamamlanmayan öneriler nedeniyle oluşan kayıplar, kazanılan puanlardan düşülür."
        },
        {
          "tip": "paragraf",
          "metin": "Temsilcilerin net puanları bölge, takım ve firma toplamlarını oluşturur. Aynı puan bu düzeylerde yeniden kazanılmaz; toplam içindeki yeri gösterilir."
        },
        {
          "tip": "paragraf",
          "metin": "Örneğin, bir takımın temsilcileri toplam **10.000 puan kazanmış ve 500 puan kaybetmişse takımın net puanı 9.500’dür.**"
        },
        {
          "tip": "baslik",
          "metin": "Firma katkısı neyi gösterir?"
        },
        {
          "tip": "paragraf",
          "metin": "Katkı oranı, seçtiğiniz takımın, bölgenin veya temsilcinin net puanının ilgili toplam içindeki payını gösterir."
        },
        {
          "tip": "paragraf",
          "metin": "Örneğin, firmanın net T-Club puanı **20.000**, seçtiğiniz takımın net puanı **5.000** ise takımın firma katkısı **%25** olur. Bu oran, takımın firma toplamının dörtte birini oluşturduğunu gösterir."
        },
        {
          "tip": "baslik",
          "metin": "C-Club puanları",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "C-Club puanları, bölge müdürlerinin kendi çalışmalarından oluşur. Yayın tamamlama, doğru cevap, Extra, challenge gönderme ve gönderilen challenge’ın yanıtlanması puan kazandırabilir. İleri sarma ve yanlış cevaplar puan kaybına neden olur.",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Bu sonuçları **C-Club Ligi** üzerinden inceleyebilirsiniz. Bölge müdürlerinin kişisel C-Club puanları, temsilcilerin T-Club puanlarına eklenmez.",
          "modul": "cc"
        },
        {
          "tip": "baslik",
          "metin": "E-Club puanları",
          "modul": "eclub"
        },
        {
          "tip": "paragraf",
          "metin": "Eczacı ve eczane teknisyenlerinin yayınları tamamlayarak ve soruları yanıtlayarak kazandıkları puanlar, E-Club takımlarının sonuçlarını oluşturur.",
          "modul": "eclub"
        },
        {
          "tip": "liste",
          "sirali": false,
          "maddeler": [
            "**Çekli puan:** E-Club performansına ve ligine katılır. Yayının koşullarına göre hediye çeki hesabında da kullanılır.",
            "**Çeksiz puan:** E-Club performansına ve ligine katılır; hediye çeki oluşturmaz."
          ],
          "modul": "eclub"
        },
        {
          "tip": "paragraf",
          "metin": "**E-Club Ligi’nde çekli ve çeksiz performans puanları birlikte değerlendirilir.**",
          "modul": "eclub"
        },
        {
          "tip": "paragraf",
          "metin": "Üyenin kazandığı puan ile gönderimi yapan temsilcinin kazandığı puan ayrıdır. Temsilcinin gönderimden doğan kazanımı kendi T-Club hesabına, üyenin kazanımı ise E-Club hesabına katılır.",
          "modul": "eclub"
        }
      ]
    },
    {
      "baslik": "Raporlar ve Ligler",
      "parcalar": [
        {
          "tip": "baslik",
          "metin": "Yayın Raporları"
        },
        {
          "tip": "paragraf",
          "metin": "Firmanızdaki yayınların üretim yöntemlerini, saha sonuçlarını ve öğrenme araçlarının performansını **Yayın Raporları** menüsünden inceleyebilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "**Haftalık, Aylık, Dönemlik veya Yıllık** seçenekleriyle süreyi belirleyebilirsiniz. Rol seçiminden tüm kullanıcıların sonuçlarını birlikte veya ilgili kullanıcı grubunu ayrı görüntüleyebilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "Sayfada üç ana alan bulunur:"
        },
        {
          "tip": "liste",
          "sirali": false,
          "maddeler": [
            "**Yayın Üretim Yöntemleri ve Dağılımları:** Yayınların dört üretim yöntemine göre sayılarını ve dağılımlarını görebilirsiniz. **Varyantları** bağlantısından yöntemlerin açıklamalarını açabilirsiniz.",
            "**Yayın Konusu ve Saha Etkisi:** Eğitim konularını seçerek yayınların tamamlanma ve puan sonuçlarını inceleyebilirsiniz.",
            "**Öğrenme Aracı Performansı:** Video, podcast, dijital broşür ve literatürün kullanımını, kazanılan ve kaybedilen puanlarını ve net sonuçlarını görebilirsiniz. Etkileşim ayrıntılarından yayın bazındaki sonuçlara ulaşabilirsiniz."
          ]
        },
        {
          "tip": "baslik",
          "metin": "T-Club Raporları"
        },
        {
          "tip": "paragraf",
          "metin": "Saha teşkilatının öğrenme sonuçlarını **T-Club Raporları** üzerinden inceleyebilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "Önce takımı seçebilirsiniz. Bölge müdürü seçmediğinizde takımın toplam sonuçları gösterilir. Bölge müdürü ve ardından temsilci seçerek daha ayrıntılı sonuçlara ulaşabilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "Raporda yayın tamamlama, cevaplama, öneri, Extra ve E-Club kazanımları ile puan kayıpları ayrı alanlarda gösterilir. Süre, eğitim konusu ve yayın aracı seçimleriyle incelemenizi daraltabilirsiniz.",
          "eclubKapaliMetin": "Raporda yayın tamamlama, cevaplama, öneri, Extra kazanımları ile puan kayıpları ayrı alanlarda gösterilir. Süre, eğitim konusu ve yayın aracı seçimleriyle incelemenizi daraltabilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "Üst bölümde seçtiğiniz takımın net puanını ve firma toplamına katkısını görebilirsiniz. Bölge veya temsilci seçtiğinizde katkı bilgileri de seçiminize göre değişir."
        },
        {
          "tip": "baslik",
          "metin": "Bölgeleri karşılaştırma"
        },
        {
          "tip": "paragraf",
          "metin": "T-Club raporundaki **Karşılaştırma** seçeneğiyle, seçtiğiniz takımdan iki bölge müdürünü belirleyebilirsiniz. Bu bölgelerdeki temsilcilerin sonuçları yan yana gösterilir."
        },
        {
          "tip": "paragraf",
          "metin": "Tamamlanan yayınları, cevapları, kazanımları ve kayıpları karşılaştırabilirsiniz. Temsilci sayısını ve **temsilci başına net puanı** da görebilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "T-Club Ligi"
        },
        {
          "tip": "paragraf",
          "metin": "Takım seçerek o takıma bağlı bölgelerin sıralamasını inceleyebilirsiniz. Bölgenin satırını açarak temsilcilerin sıralamalarına ve puan ayrıntılarına ulaşabilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "Haftalık, aylık, dönemlik veya yıllık sonuçları seçebilirsiniz. Aynı net puana sahip katılımcılar aynı sırayı paylaşır."
        },
        {
          "tip": "baslik",
          "metin": "C-Club Ligi",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Bölge müdürlerinin kişisel Challenge Club çalışmalarını, takımlar halinde inceleyebilirsiniz.",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Takım satırını açarak bağlı bölge müdürlerine, bölge müdürünün satırını açarak kazanım ve kayıplarının ayrıntılarına ulaşabilirsiniz.",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Lig için seçtiğiniz süreden bağımsız olarak, sayfanın altındaki **Challenge Listesi — Bu Ay** alanında içinde bulunulan ayın gönderimleri gösterilir.",
          "modul": "cc"
        },
        {
          "tip": "baslik",
          "metin": "E-Club Ligi",
          "modul": "eclub"
        },
        {
          "tip": "paragraf",
          "metin": "Firma genelindeki E-Club takımlarının sıralamalarını ve ilk üç takımı görebilirsiniz. Takımların üye ve aktif üye sayılarını, tamamlanan yayınlarını, doğru cevaplarını, çekli ve çeksiz puanlarını inceleyebilirsiniz.",
          "modul": "eclub"
        },
        {
          "tip": "paragraf",
          "metin": "**Lig puanı, çekli ve çeksiz performans puanlarının toplamıdır.**",
          "modul": "eclub"
        }
      ]
    },
    {
      "baslik": "Sık Karşılaşılan Durumlar",
      "parcalar": [
        {
          "tip": "baslik",
          "metin": "Temsilci seçimi neden kullanılamıyor?"
        },
        {
          "tip": "paragraf",
          "metin": "Önce temsilcinin bağlı olduğu bölge müdürünü seçmeniz gerekir. İlgili bölgenin bilgileri yüklendikten sonra temsilci seçebilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "Tekrar takımın genel sonuçlarını görmek istediğinizde bölge seçimini **Tüm Bölgeler** olarak değiştirebilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "Karşılaştırma ekranında neden iki temsilci yerine iki bölge müdürü seçiliyor?"
        },
        {
          "tip": "paragraf",
          "metin": "Yönetici raporundaki **Karşılaştırma** alanı, seçili takım içindeki iki bölgenin sonuçlarını yan yana gösterir."
        },
        {
          "tip": "paragraf",
          "metin": "Tek temsilcinin ayrıntılarını incelemek için **Rapor** görünümüne dönerek bölge müdürü ve temsilci seçebilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "Net puan neden eksi görünüyor?"
        },
        {
          "tip": "paragraf",
          "metin": "Net puan, kazanılan puanlardan kayıplar çıkarıldıktan sonra kalan tutardır. Seçtiğiniz sürede kayıplar kazanımlardan fazlaysa sonuç eksi olabilir."
        },
        {
          "tip": "paragraf",
          "metin": "Örneğin, **100 puan kazanılmış ve 150 puan kaybedilmişse net puan −50’dir.** Kazanım ve kayıp ayrıntılarını inceleyerek sonucun nasıl oluştuğunu görebilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "C-Club Ligi’nde yıllık seçtim, challenge listesi neden yalnızca bu ayı gösteriyor?",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "Ligdeki süre seçimi puanları ve sıralamayı değiştirir. Sayfanın altındaki **Challenge Listesi — Bu Ay** alanı ise bu seçimden bağımsız olarak içinde bulunulan ayın gönderimlerini gösterir.",
          "modul": "cc"
        },
        {
          "tip": "paragraf",
          "metin": "**Raporda beklediğim kayıtları göremiyorum.**"
        },
        {
          "tip": "paragraf",
          "metin": "Seçili süreyi, rolü, eğitim konusunu, yayın aracını ve varsa takım, bölge müdürü ve temsilci seçimlerini kontrol edebilirsiniz. Yayın listesinde arama yaptıysanız arama ifadesini de temizleyebilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "Ardından **Yenile** düğmesiyle güncel bilgileri alabilirsiniz. Ekranda hata mesajı gösteriliyorsa bunu kayıt veya puan bulunmadığı şeklinde değerlendirmeyiniz; yeniden yüklemeyi deneyebilirsiniz."
        }
      ]
    }
  ]
};

export function yoneticiKilavuzunuSec(ccAcik: boolean, eclubAcik: boolean) {
  return {
    giris: [...YONETICI_KILAVUZU.giris],
    bolumler: YONETICI_KILAVUZU.bolumler.map(bolum => {
      const parcalar: KilavuzParcasi[] = [];
      for (const parca of bolum.parcalar) {
        if ((parca.modul === "cc" && !ccAcik) || (parca.modul === "eclub" && !eclubAcik)) continue;
        if (parca.tip === "liste") {
          const onceki = parcalar.at(-1);
          if (onceki?.tip === "liste" && onceki.sirali === parca.sirali) onceki.maddeler.push(...parca.maddeler);
          else parcalar.push({ tip: "liste", sirali: parca.sirali, maddeler: [...parca.maddeler] });
        } else {
          const metin = !ccAcik && parca.ccKapaliMetin ? parca.ccKapaliMetin
            : !eclubAcik && parca.eclubKapaliMetin ? parca.eclubKapaliMetin : parca.metin;
          parcalar.push({ tip: parca.tip, metin });
        }
      }
      return { baslik: bolum.baslik, parcalar };
    }),
  };
}
