// Onaylı içerik kaynağı: docs/KULLANIM_KILAVUZU_URETICI.md
// Metin değişikliklerinde iki dosya birlikte güncellenir.
export type KilavuzParcasi =
  | { tip: "baslik" | "paragraf"; metin: string }
  | { tip: "liste"; sirali: boolean; maddeler: string[] };

export const URETICI_KILAVUZU: {
  giris: string[];
  bolumler: { baslik: string; parcalar: KilavuzParcasi[] }[];
} = {
  "giris": [
    "Cogniti’de yayın oluşturabilir, içeriğinizin hazırlanma sürecini takip edebilir ve incelemenize sunulan çalışmaları değerlendirebilirsiniz. Onayladığınız içerikleri yayımlayabilir, yayınlarınızın sonuçlarını raporlardan izleyebilirsiniz.",
    "Oluşturabileceğiniz yayın konuları, görev ve yetkilerinize göre belirlenir. Yalnızca kendi oluşturduğunuz yayınları yönetebilirsiniz."
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
          "metin": "Giriş yaptıktan sonra **Yayın Yönetimi** ekranına ulaşabilirsiniz. Yayına hazır içeriklerinizi, planlanan, yayında olan ve durdurulan yayınlarınızı bu ekrandan takip edebilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "Menüler"
        },
        {
          "tip": "paragraf",
          "metin": "Sol menüden ilgili çalışma alanına geçebilirsiniz. Mobil cihazlarda menüyü üst bölümdeki menü düğmesiyle açabilirsiniz."
        },
        {
          "tip": "liste",
          "sirali": false,
          "maddeler": [
            "**Yayın Oluşturma ve Takip:** Yeni yayın oluşturabilir, hazırlık aşamalarını takip edebilir ve incelemenize sunulan çalışmaları değerlendirebilirsiniz.",
            "**Yayın Yönetimi:** Hazırlığı tamamlanan içeriklerin yayın ayarlarını belirleyebilir ve yayın işlemlerini yapabilirsiniz.",
            "**Sizin Yayınlarınız:** Kendi yayındaki içeriklerinizi inceleyebilirsiniz.",
            "**Tüm Yayınlar:** Firmanızdaki diğer üreticilerin yayındaki içeriklerini inceleyebilirsiniz."
          ]
        },
        {
          "tip": "paragraf",
          "metin": "Rapor ve lig ekranlarına da sol menüden ulaşabilirsiniz."
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
          "metin": "Yayın konularınız"
        },
        {
          "tip": "paragraf",
          "metin": "Oluşturabileceğiniz yayın konuları, görevinize göre belirlenir:"
        },
        {
          "tip": "liste",
          "sirali": false,
          "maddeler": [
            "**Ürün yönetimi rolleri:** Ürün Eğitimi.",
            "**Medikal Müdür:** Medikal Eğitim ve Ürün-Medikal Eğitim.",
            "**Eğitim rolleri:** Satış Teknikleri ve Yönetim Eğitimleri.",
            "**İnsan Kaynakları rolleri:** İK Eğitimi/Bilgilendirme ve Yönetim Eğitimleri."
          ]
        },
        {
          "tip": "baslik",
          "metin": "Üretim sürecindeki göreviniz"
        },
        {
          "tip": "paragraf",
          "metin": "Yayının konusunu, hedef kitlesini ve kullanılacak aracı belirleyebilirsiniz. Dört üretim yönteminden birini seçerek içeriğin hazırlanmasını sağlayabilir veya hazır içeriklerinizi ekleyebilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "İçerik üreticisiyle hazırlanan çalışmaları inceleyebilir, onaylayabilir veya açıklama yazarak revizyon isteyebilirsiniz. Hazırlığı tamamlanan içerikleri yayın ayarlarını belirleyerek yayımlayabilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "Hedef kitleniz"
        },
        {
          "tip": "paragraf",
          "metin": "Seçebileceğiniz hedef kitleler, rolünüze göre sunulur. Eczacı ve eczane teknisyeni birlikte seçilebilir; diğer hedef kitleler için ayrı yayın oluşturulur."
        }
      ]
    },
    {
      "baslik": "Yayın İşlemleri",
      "parcalar": [
        {
          "tip": "baslik",
          "metin": "Yayın Oluşturma"
        },
        {
          "tip": "paragraf",
          "metin": "**Yayın Oluşturma ve Takip** ekranından yeni yayın oluşturabilirsiniz. Yayın konusunu, hedef kitlesini ve öğrenme aracını seçebilir; hazırlanmasını istediğiniz içeriği açıklayabilirsiniz. Konuya göre gerekli ürün ve teknik bilgilerini belirleyebilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "Video, podcast, dijital broşür veya literatür araçlarından birini seçebilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "Üretim Yöntemi Seçimi"
        },
        {
          "tip": "paragraf",
          "metin": "Dört yöntemden birini seçebilirsiniz:"
        },
        {
          "tip": "liste",
          "sirali": true,
          "maddeler": [
            "**İçerik üreticisiyle birlikte:** Senaryo, öğrenme aracı ve soru seti içerik üreticisi tarafından hazırlanır.",
            "**Öğrenme aracı sizden:** Hazır öğrenme aracınızı ekleyebilirsiniz. Soru seti içerik üreticisi tarafından hazırlanır.",
            "**Soru seti sizden:** Hazır soru setinizi ekleyebilirsiniz. Senaryo ve öğrenme aracı içerik üreticisi tarafından hazırlanır.",
            "**Öğrenme aracı ve soru seti sizden:** Her ikisini de hazır olarak ekleyebilirsiniz. Dosyaların gerekli kontrolleri tamamlandıktan sonra yayın ayarlarına geçebilirsiniz."
          ]
        },
        {
          "tip": "baslik",
          "metin": "İnceleme ve Onay"
        },
        {
          "tip": "paragraf",
          "metin": "Eğer içerik üreticisiyle birlikte yayın hazırladıysanız, hazırlanan çalışmalar incelemenize sunulur. İçeriği uygun bulduğunuzda onaylayabilir, değişiklik gerektiğinde açıklama yazarak revizyon isteyebilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "Hazırlık aşamalarını **Yayın Oluşturma ve Takip** ekranından izleyebilirsiniz. Onayları tamamlanan içerikler **Yayın Yönetimi** ekranına aktarılır."
        },
        {
          "tip": "baslik",
          "metin": "Yayımlama"
        },
        {
          "tip": "paragraf",
          "metin": "Yayın Yönetimi’nde araç puanını, doğru cevap puanlarını ve hedef kitleye göre gereken diğer ayarları tamamlayabilirsiniz. Gerekli alanlar tamamlandığında yayını açabilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "Videonuzun oynatım, kapak görseli ve önizleme hazırlıkları arka planda sürdürülür. Diğer yayın koşulları tamamlandığında, bu işlemi beklemeden yayınınızı açabilirsiniz. İşleme sonucu bildirimle iletilir."
        },
        {
          "tip": "baslik",
          "metin": "İleri Tarihli Yayınlama"
        },
        {
          "tip": "paragraf",
          "metin": "Bir yayın günü seçerek ileri tarihli yayın planlayabilirsiniz. Planlanan yayını **Hemen Yayınla**, **Tarihi Değiştir** veya **Planı İptal** seçenekleriyle yönetebilirsiniz. Plan iptal edildiğinde içerik, yayına bekleyenler arasına döner."
        },
        {
          "tip": "baslik",
          "metin": "Durdurma ve Yeniden Başlatma"
        },
        {
          "tip": "paragraf",
          "metin": "Yayındaki içeriğinizi **Durdur** seçeneğiyle durdurabilir, durdurulan yayını **Başlat** seçeneğiyle yeniden açabilirsiniz."
        }
      ]
    },
    {
      "baslik": "Puanlar ve Kazanımlar",
      "parcalar": [
        {
          "tip": "baslik",
          "metin": "Yayın Puanlarını Belirleme"
        },
        {
          "tip": "paragraf",
          "metin": "Yayını açmadan önce puanlarını Yayın Yönetimi ekranından belirleyebilirsiniz. Hedef kitleye uygun puan seçenekleri ilgili alanlarda sunulur."
        },
        {
          "tip": "baslik",
          "metin": "Yayın Bitirme Puanı"
        },
        {
          "tip": "paragraf",
          "metin": "Kullanıcının öğrenme aracını puan kazanma koşullarına uygun olarak tamamladığında kazanacağı puanı belirleyebilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "Doğru Cevap Puanı"
        },
        {
          "tip": "paragraf",
          "metin": "Her soru için ayrı doğru cevap puanı belirleyebilir veya bütün sorulara aynı puanı atayabilirsiniz. Yayının açılabilmesi için soru setindeki bütün soruların puanlarının tanımlanması gerekir."
        },
        {
          "tip": "baslik",
          "metin": "Extra Bitirme Puanı"
        },
        {
          "tip": "paragraf",
          "metin": "Saha teşkilatına yönelik yayınlarda, tekrar tamamlama koşulları sağlandığında kazanılacak Extra puanı belirleyebilirsiniz. E-Club ve Eczanem yayınlarında Extra puan bulunmaz."
        },
        {
          "tip": "baslik",
          "metin": "E-Club Yayınlarında Kazanım Koşulları"
        },
        {
          "tip": "paragraf",
          "metin": "Eczacı ve eczane teknisyenlerine yönelik yayınlarda dört kazanım modelinden birini seçebilirsiniz:"
        },
        {
          "tip": "liste",
          "sirali": false,
          "maddeler": [
            "**Yalnız puan:** Puanlar E-Club Ligi’ne katılır; hediye çeki oluşturmaz.",
            "**Siparişsiz çek:** Puanlar, belirlenen karşılıkla hediye çekine dönüşür; sipariş şartı aranmaz.",
            "**Siparişle artan çek:** Sipariş verilmeden normal çek alınabilir; sipariş verildiğinde çek tutarı belirlediğiniz oranda artırılır.",
            "**Sipariş zorunlu çek:** Hediye çeki alınabilmesi için ürün siparişi verilmesi gerekir."
          ]
        },
        {
          "tip": "paragraf",
          "metin": "Seçtiğiniz modele göre puanın TL karşılığını, puan aralıklarını ve sipariş koşullarını belirleyebilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "Eczanem Yayınlarında Karşılık"
        },
        {
          "tip": "paragraf",
          "metin": "Eczanem üyelerine yönelik yayınlarda ürün barkodunu, satış fiyatını ve puanın TL karşılığını tanımlayabilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "Kazanımları İzleme"
        },
        {
          "tip": "paragraf",
          "metin": "Yayınlarınızdan oluşan kazanılan, kaybedilen ve net puanları raporlardan takip edebilirsiniz. Net puan, kazanılan puandan kaybedilen puanın çıkarılmasıyla hesaplanır."
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
          "metin": "Kendi yayınlarınızın üretim yöntemlerini, saha etkisini ve öğrenme araçlarının performansını inceleyebilirsiniz. Haftalık, aylık, dönemlik ve yıllık seçeneklerle sonuçları takip edebilirsiniz. Rol filtresinden Tümü, Temsilci, BM, Eczacı, Eczane Teknisyeni veya Eczanem Üyesi seçebilirsiniz."
        },
        {
          "tip": "liste",
          "sirali": false,
          "maddeler": [
            "**Yayın Üretim Yöntemleri (Varyantlar) ve Dağılımları:** Dört üretim yöntemine göre yayın sayılarını ve dağılım yüzdelerini görebilirsiniz. Varyant açıklamalarına başlıktaki bağlantıdan ulaşabilirsiniz.",
            "**Yayın Konusu ve Saha Etkisi:** Yayın konularına göre yayına alınan yayınları, tamamlanma sayılarını, kazanılan ve net puanları inceleyebilirsiniz. Ürün eğitimlerinde ürün kulakçıklarını seçerek ürün bazındaki puan dağılımını görebilirsiniz.",
            "**Öğrenme Aracı Performansı:** Video, podcast, dijital broşür ve literatür için toplam içerik, başlatılan ve tamamlanan kullanım sayılarını, tamamlama oranını ve puan bilgilerini inceleyebilirsiniz. Tamamlamaların rollere göre dağılımını görebilir, etkileşim detaylarından yayın bazındaki sonuçlara ulaşabilirsiniz."
          ]
        },
        {
          "tip": "baslik",
          "metin": "T-Club Raporları"
        },
        {
          "tip": "paragraf",
          "metin": "Firmanızın kazanılan, kaybedilen ve net T-Club puanlarını takip edebilirsiniz. Puanların oluştuğu kalemleri, kendi yayınlarınızın öğrenme aracı, yayın konusu ve ürün bazındaki dağılımlarını inceleyebilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "Saha puanlarını takım, bölge ve UTT düzeyinde görebilirsiniz. Kendi yayınlarınızın firma puanına katkısını, etkileşim alan yayınlarınızı ve tamamlanma sayılarını takip edebilirsiniz. Yayın performansı listesinden yayın ayrıntılarına ve yayını tamamlayan UTT’lere ulaşabilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "T-Club Ligi"
        },
        {
          "tip": "paragraf",
          "metin": "Saha teşkilatının puanlarını ve sıralamalarını bölge, takım veya firma kapsamında inceleyebilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "**T-Club Ligi** görünümünde tüm yayınlardan oluşan sonuçları, **Yayınlarımın Ligi** görünümünde yalnızca kendi yayınlarınızdan oluşan sonuçları görebilirsiniz. Seçtiğiniz kapsamın kazanılan, kaybedilen ve net puanlarını takip edebilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "C-Club Ligi"
        },
        {
          "tip": "paragraf",
          "metin": "Firmanızdaki bölge müdürlerinin Challenge Club puanlarını ve sıralamalarını takip edebilirsiniz. İzleme, cevaplama ve challenge gönderimi gibi faaliyetlerden oluşan puanları, puan kayıplarını ve net sonuçları inceleyebilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "Haftalık, aylık, dönemlik veya yıllık sonuçları seçebilirsiniz. Sayfanın altındaki challenge listesinden içinde bulunulan ayın gönderimlerini takip edebilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "E-Club Ligi"
        },
        {
          "tip": "paragraf",
          "metin": "UTT’lerin eczacı ve eczane teknisyenlerinden oluşturduğu E-Club takımlarının dönemsel puanlarını ve sıralamalarını takip edebilirsiniz. İlk üç takımı podyumda, takımların tamamını sıralama tablosunda görebilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "Takımların üye ve aktif üye sayılarını, tamamlanan yayınlarını, doğru cevaplarını, çekli ve çeksiz puanlarını inceleyebilirsiniz. Lig puanı, çekli ve çeksiz performans puanlarının toplamından oluşur."
        }
      ]
    },
    {
      "baslik": "Sık Karşılaşılan Durumlar",
      "parcalar": [
        {
          "tip": "baslik",
          "metin": "Yayınımı listede bulamıyorum."
        },
        {
          "tip": "paragraf",
          "metin": "Seçili hedef kitleyi, yayın durumunu, zaman aralığını ve araç türünü kontrol edebilirsiniz. Arama alanında yazılı bir ifade varsa temizleyebilirsiniz. Yayının hazırlık aşamalarını **Yayın Oluşturma ve Takip**, yayımlanma durumunu ise **Yayın Yönetimi** ekranından takip edebilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "Videoyu yükledim, ancak hâlâ “İşleniyor” görünüyor."
        },
        {
          "tip": "paragraf",
          "metin": "Videonuzun oynatım, kapak görseli ve önizleme hazırlıkları arka planda sürdürülür. Diğer yayın koşulları tamamlandığında, bu işlemi beklemeden yayınınızı açabilirsiniz. İşleme sonucu bildirimle iletilir."
        },
        {
          "tip": "baslik",
          "metin": "“Yayınla” düğmesi neden etkin değil?"
        },
        {
          "tip": "paragraf",
          "metin": "Yayın bitirme puanı ve bütün soruların doğru cevap puanları tamamlanmalıdır. Hedef kitleye göre Extra puan, E-Club kazanım koşulları veya Eczanem ürün ve karşılık bilgileri de gerekebilir. Yayın ayarlarındaki eksik alanları tamamlayabilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "“Onayla” veya “Revizyon İste” düğmesini neden göremiyorum?"
        },
        {
          "tip": "paragraf",
          "metin": "Bu işlemler, ilgili hazırlık aşaması incelemenize sunulduğunda gösterilir. Çalışmanın hangi aşamada olduğunu takip ekranından görebilirsiniz."
        },
        {
          "tip": "paragraf",
          "metin": "Revizyon hakkı dolduğunda **Revizyon İste** düğmesi gösterilmez. İçerik teknik olarak incelemeye hazır değilse onay ve revizyon işlemleri kullanılamaz; nedeni ilgili alanda açıklanır."
        },
        {
          "tip": "baslik",
          "metin": "Dosya yüklemem yarım kaldı. Ne yapabilirim?"
        },
        {
          "tip": "paragraf",
          "metin": "Podcast, dijital broşür veya literatür yüklemesi için yarım kalan yükleme bildirimi gösterildiğinde aynı kayıt üzerinden devam edebilirsiniz. Bildirimde istenen dosyaları seçerek yüklemeyi tamamlayabilir veya ilgili yüklemeyi iptal edebilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "İleri tarihli planladığım yayın neden henüz görünmüyor?"
        },
        {
          "tip": "paragraf",
          "metin": "Planlanan içerik, yayın zamanı gelene kadar hedef kitlenin kullanımına açılmaz. Kaydı, Yayın Yönetimi’nin **Yayında** sekmesinde **Planlandı** durumuyla takip edebilirsiniz. Daha erken açmak istediğinizde **Hemen Yayınla** seçeneğini kullanabilirsiniz."
        },
        {
          "tip": "baslik",
          "metin": "Yayın sayısıyla başlatılma ve tamamlanma sayıları neden farklı?"
        },
        {
          "tip": "paragraf",
          "metin": "Yayın sayısı içerikleri, başlatılma ve tamamlanma sayıları ise kullanıcıların hareketlerini gösterir. Aynı yayın birden fazla kullanıcı tarafından açılıp tamamlanabilir."
        },
        {
          "tip": "paragraf",
          "metin": "Öğrenme Aracı Performansı’ndaki **Toplam içerik**, seçili dönemde yayımlanan ve hâlen yayında olan içerikleri sayar. Başlatılma ve tamamlanma sayıları ise daha önce yayımlanmış içeriklerin seçili dönemdeki kullanımlarını da kapsar."
        },
        {
          "tip": "baslik",
          "metin": "Raporlarda beklediğim sonucu göremiyorum."
        },
        {
          "tip": "paragraf",
          "metin": "Seçili rolü ve zaman aralığını kontrol edebilirsiniz. Yayın Raporları kendi yayınlarınızın sonuçlarını gösterir. T-Club Raporları’nda ise firma puanları ve kendi yayınlarınızın bu puanlara katkısı ayrı alanlarda sunulur. Güncel sonuçları almak için **Yenile** düğmesini kullanabilirsiniz."
        }
      ]
    }
  ]
};
