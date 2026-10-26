# Viva — Daily ek görüşme özellikleri

25 Ekim 2026. Daily'nin hazır kontrollerine ek olarak Viva görüşme başlığında görünür bir **Arka plan** kontrolü eklendi.

## Uygulama

- Arka plan bulanıklaştırma/değiştirme: `enable_video_processing_ui: true` ve Viva başlığında **Arka plan** → **Bulanıklaştır / Görsel seç / Efekti kaldır**. `updateInputSettings()` ile aynı Daily iframe'inin yerel kamera işleyicisine bağlanır; kamera veya mikrofon otomatik açılmaz.
- Küçük grup odaları: `enable_breakout_rooms: true`. Odaları Daily arayüzünden sunucu yönetir.
- Yüzen görüşme penceresi: `enable_pip_ui: true`.
- Emoji tepkileri: `enable_emoji_reactions: true`.
- Konuşmacı sabitleme ve görünüm seçimi Daily Prebuilt'in kendi kontrollerindedir; bunları gizleyen veya kullanıcı seçimini zorlayan bir ayar eklenmedi.
- Aynı anda iki kişinin ekran paylaşımı mevcut `enable_screenshare: true` ve medya izinleri üzerinden Daily arayüzüne bırakılır; Viva tek paylaşım kilidi koymaz. Tek kişinin iki ayrı ekran yakalaması için yeni bir kontrol eklenmedi.
- Sekme/sistem sesi, Daily ekran paylaşımında tarayıcının sunduğu ses paylaşımı seçeneğiyle kullanılır. Yeni bir oda bayrağı yoktur; ses yakalama kullanıcı seçimine ve tarayıcı/işletim sistemi desteğine bağlıdır.

Sunucu her katılımda mevcut oda hazırlama/kira akışından geçer. Böylece daha önce hazır olarak kaydedilmiş odalar da aynı Daily oda kimliğiyle güncellenir; yeni oda oluşturulmaz. Daily ayarları tekrar okunup doğrulanmadan token teslim edilmez. Katılımcı ve izleyici oda ayarlarını değiştiremez.

İzleyici kamera, mikrofon ve ekran/ses paylaşımı gönderemez; yönetici olamaz. Kamera ve mikrofon başlangıçta kapalıdır. Kayıt yalnız sunucunun Viva düğmeleriyle başlatılır; bu değişiklik kayıt veya transkript başlatmaz.

## Kullanım ve canlı kabul

### Görünür arka plan kontrolü

Kullanıcı canlı oturumda Daily'nin arka plan kontrolünü göremediğini bildirdi. Önceki oda ayarı tek başına canlı arayüz kabulü değildi. Sunucu ve katılımcı görüşmeye katıldığında, Viva canlı görüşme başlığındaki **Arka plan** düğmesi kendi panelini açar. Bulanıklaştırma, JPEG/PNG dosyası seçimi (en fazla 5 MB) ve efekti kaldırma desteklenir. Dosya `ArrayBuffer` olarak Daily'ye iletilir; yeni sunucu yükleme uç noktası veya kalıcı dosya kaydı eklenmez.

`supportedBrowser().supportsVideoProcessing` denetlenir. Desteklenmeyen cihazda Arka plan düğmesi yine görünür ve panelde destek gereksinimi açıklanır. İzleyici kontrolü görmez ve controller seviyesinde de efekti uygulayamaz. SDK'nın işleme hataları panelde gösterilir, görüşme kapatılmaz. Efekt kameranın görüntüsünde görünür; kamera kapalıyken açılmaya zorlanmaz.

Bu ekleme için `tests/vivaPrebuilt.hedef.test.ts` **30/30** geçti: kontrolün canlıda oluşturulması, sunucu/katılımcı/izleyici ayrımı, görsel dosyası iletimi, geçersiz dosya, bulanıklaştırma, kaldırma, destek kontrolü ve SDK hatasında görüşmenin korunması. TypeScript ve değişen iki üretim dosyasının ESLint kontrolü geçti. Bunlar sentetik SDK/DOM testleridir; gerçek kamera görüntüsü ve başka katılımcıya ulaşan efekt henüz canlıda doğrulanmadı. Yeni SQL gerekmez.

Destekleyen cihazda Daily kamera ayarlarından arka plan efektleri, görüşme menüsünden PiP, tepki kontrolünden emojiler, kişi menüsünden sabitleme ve görünüm kontrolleri kullanılabilir. Menü adları ve yerleşimi Daily sürümüne/cihaza göre değişebilir. Küçük grup odalarını sunucu oluşturup katılımcıları atar ve ana görüşmeye geri çağırır.

Canlı kabulde iki ayrı katılımcıyla eşzamanlı ekran paylaşımı, ses paylaşımı seçilerek sekme sesi, sunucuyla grup oluşturma/geri çağırma, PiP ve arka plan efektleri denenmelidir. İzleyicinin bu işlemlerle medya gönderme veya yönetici yetkisi kazanmadığı da kontrol edilir. Küçük gruplar açıkken kayıt kapsamı, anket iletimi, erişim iptali ve herkes için bitirme gerçek görüşmede ayrıca doğrulanmalıdır.

Mobil webde ekran paylaşımı başlatma ve bazı efektler desteklenmeyebilir; PiP ve sistem sesi tüm tarayıcılarda aynı değildir. Oda bayrağının açık olması cihaz desteği garantisi değildir.

Kod ve sentetik API testleri gerçek görüşme kabulü değildir. Bu değişiklik için yeni SQL gerekmez; Daily hesabında canlı işlem, deployment veya cihaz testi yapılmadı.

## Teknik doğrulama

- Oda, katılım ve Prebuilt test dosyalarında 73/73 test başarılı. Eksik/kapalı özellikli eski odanın aynı kimlikle güncellenmesi, sunucu tokenından önce ayarların uzlaştırılması ve başarısız güncellemede token verilmemesi sınandı.
- Mevcut rol testi, sohbet çıktısını da isteyen Viva kayıt düğmesi nedeniyle zaten kapalı olan Daily kayıt arayüzüyle uyumlu hale getirildi; kayıt yetkisi değiştirilmedi.
- `node node_modules/typescript/bin/tsc -p tsconfig.build.json --noEmit --incremental false` başarılı. Next typegen veya production build çalıştırılmadı.
- Değişen dört TypeScript dosyasında ESLint 0 hata, 0 uyarı.

## Kaynaklar

- [Daily oda özellikleri](https://docs.daily.co/reference/rest-api/rooms/create-room)
- [Daily küçük grup odaları](https://www.daily.co/blog/daily-prebuilt-breakout-rooms-demo/)
- [Daily Prebuilt görünüm seçenekleri](https://docs.daily.co/docs/prebuilt/customizing-daily-prebuilt)
- [Daily ekran ve ses paylaşımı](https://docs.daily.co/docs/daily-js/features/screen-sharing)
- [Tarayıcı desteği](https://docs.daily.co/reference/daily-js/static-methods/supported-browser)
- [Daily kamera işleme ve arka plan API'si](https://docs.daily.co/reference/daily-js/instance-methods/update-input-settings)
