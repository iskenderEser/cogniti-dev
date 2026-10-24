# Cogniti

**Cogniti · bilgi taşır**

Cogniti, ilaç ve sağlık sektöründe içerik üretimi, yayın, öğrenme ve ölçüm süreçlerini bir araya getiren, rol temelli bir dijital platformdur. Firma ekipleri, eczane kullanıcıları ve Eczanem üyeleri kendi yetki ve üyelik kapsamlarında çalışır.

[Uygulamayı aç](https://cogniti-dev.vercel.app)

## Platformun kapsamı

- **İçerik üretimi ve yayın:** Talep, senaryo, içerik üretimi, inceleme, yayın ve hedef kitleye dağıtım süreçleri.
- **Öğrenme araçları:** Video, podcast, dijital broşür ve literatür; araç ve role göre öğrenme, soru ve puan kuralları.
- **Ölçüm ve raporlama:** Firma, takım, bölge ve kullanıcı kapsamlarında yayın tüketimi ve performans takibi.
- **E-Club:** Eczane kullanıcıları için yayınlar, gönderim ve planlama, performans, lig ve hediye çeki süreçleri.
- **Eczanem:** Eczane bazlı üyelik, öğrenme içerikleri ve ilgili platform işlemleri.
- **Yönetim:** Firma, kullanıcı, rol, yetki ve platform ayarlarının yönetimi.

## Teknoloji altyapısı

- **Uygulama:** Next.js 16, React 19 ve TypeScript.
- **Arayüz:** Tailwind CSS 4, Radix UI ve ECharts.
- **Veritabanı ve kimlik doğrulama:** Supabase / PostgreSQL.
- **Medya:** Bunny Stream ve Bunny Storage; videolar için doğrudan TUS yükleme.
- **E-posta ve bildirimler:** Resend ve Web Push.
- **Dağıtım:** Vercel.

## Yerel geliştirme

Node.js ve npm kurulu bir ortamda bağımlılıkları yükleyin:

```bash
npm install
```

[`.env.example`](.env.example) dosyasını temel alarak `.env.local` dosyasını oluşturun ve kullanacağınız servislerin ortam değişkenlerini tanımlayın. Ardından geliştirme sunucusunu başlatın:

```bash
npm run dev
```

Uygulama varsayılan olarak [localhost:3000](http://localhost:3000) adresinde çalışır.

## Temel kontroller

```bash
npm run typecheck:build
npm run lint
npm run test:smoke
npm run build
```

Hedefli test grupları:

```bash
npm run test:hedef
npm run test:eclub
npm run test:uretim
npm run test:tuketim
```

Veritabanı şema anlık görüntüsü ve kod kullanımı denetimleri:

```bash
npm run denetim:sema
npm run denetim
npm run denetim:tutarlilik
```

`denetim:sema`, canlı veritabanını yalnız şema anlık görüntüsünü yenilemek amacıyla okur ve geçerli bağlantı bilgileri gerektirir.

## Proje kayıtları

- [Sistem mimarisi ve iş kuralları](docs/BLUEBOOK.MD)
- [Açık işler ve teknik borçlar](docs/REDBOOK.MD)
- [Hukuki metinler ve KVKK takip kaydı](docs/hukuki/)
- [Veritabanı değişiklikleri ve SQL betikleri](scripts/sql/)
- [Geliştirme kuralları](AGENTS.md)

SQL dosyalarının repoda bulunması, canlı veritabanına uygulandıkları anlamına gelmez. Canlı veritabanı komutları proje sahibi tarafından çalıştırılır ve sonuç ayrıca doğrulanır.

Cogniti'nin önceki adı **HapBilgi**'dir. Geçmiş belgelerde, paket adında ve `HAPBILGI_SITE_URL` gibi teknik anahtarlarda bu ad korunabilir.

## Proje sahibi ve katkılar (Contributors)

**Proje sahibi ve geliştirici:** [İskender Eser (@iskenderEser)](https://github.com/iskenderEser)

Geliştirme sürecinde **OpenAI Codex**, **Claude** ve **Devin** araçlarından yapay zekâ desteği alınmıştır.

GitHub'ın sağ sütunundaki **Contributors** listesi, commit yazarı ve ortak yazar kayıtlarından otomatik oluşturulur.
