# Viva — Kullanıcının paylaştığı SQL test sonucu

Tarih: 25 Ekim 2026. SQL kullanıcı tarafından çalıştırıldı; ajan veritabanına erişmedi.

27 başarılı, 2 atlandı, 0 başarısız. Atlanan 05/09 kontrolleri seçilen UTT kapsamında Auth kimliği bağlı aktif EClub üyesi bulunamamasına bağlıdır. Bu sonuç tüm UTT’lerde uygun üye bulunmadığını göstermez.

| sira | test                                                             | sonuc    | detay                                                                                                                                        |
| ---- | ---------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | 01 — Test aktörü aktif iç kullanıcı                              | BAŞARILI | Rol: utt. Kimlik ve kişisel bilgiler sonuçta gösterilmez.                                                                                    |
| 2    | 02 — Taslak oluşturma                                            | BAŞARILI | null                                                                                                                                         |
| 3    | 03 — Düzenleyen kendi etkinliğine erişir                         | BAŞARILI | null                                                                                                                                         |
| 4    | 04 — Davetsiz kimlik erişemez                                    | BAŞARILI | null                                                                                                                                         |
| 5    | 05 — EClub taslak erişimi                                        | ATLANDI  | Seçilen oluşturucunun kapsamında Auth hesabı olan aktif EClub üyesi yok.                                                                     |
| 6    | 06 — Aynı işlem anahtarı ikinci etkinlik üretmez                 | BAŞARILI | null                                                                                                                                         |
| 7    | 07 — Aynı anahtarla farklı içerik reddedilir                     | BAŞARILI | null                                                                                                                                         |
| 8    | 08 — Planlama ve sürüm artışı                                    | BAŞARILI | null                                                                                                                                         |
| 9    | 09 — EClub plan erişimi                                          | ATLANDI  | 05 numaralı testteki EClub önkoşulu sağlanmadı.                                                                                              |
| 10   | 10 — Eski sürümle düzenleme reddedilir                           | BAŞARILI | null                                                                                                                                         |
| 11   | 11 — Başkası etkinliği iptal edemez                              | BAŞARILI | null                                                                                                                                         |
| 12   | 12 — Geçersiz domainli test e-postasıyla davet oluşturulur       | BAŞARILI | Adres yalnız sentetiktir; SQL e-posta göndermez ve EClub hesabı açmaz.                                                                       |
| 13   | 13 — Davet bağlantısı doğrulanmış oturum sayılmaz                | BAŞARILI | null                                                                                                                                         |
| 14   | 14 — Kod işi doğru davetin adresine ayrılır                      | BAŞARILI | null                                                                                                                                         |
| 15   | 15 — 60 saniye içinde ikinci kod isteği reddedilir               | BAŞARILI | null                                                                                                                                         |
| 16   | 16 — Yanlış kod reddedilir ve deneme sayılır                     | BAŞARILI | null                                                                                                                                         |
| 17   | 17 — Doğru kod misafir oturumu oluşturur                         | BAŞARILI | null                                                                                                                                         |
| 18   | 18 — Doğrulanmış oturum yeniden okunur                           | BAŞARILI | null                                                                                                                                         |
| 19   | 19 — Kullanılmış kod ikinci kez kabul edilmez                    | BAŞARILI | null                                                                                                                                         |
| 20   | 20 — Süresi dolmuş oturum doğrulanmış sayılmaz                   | BAŞARILI | null                                                                                                                                         |
| 21   | 21 — Beş yanlış denemeden sonra doğru kod da kabul edilmez       | BAŞARILI | null                                                                                                                                         |
| 22   | 22 — Saatlik beş kod sınırı uygulanır                            | BAŞARILI | null                                                                                                                                         |
| 23   | 23 — Davet yenileme eski bağlantıyı kapatır                      | BAŞARILI | null                                                                                                                                         |
| 24   | 24 — Süresi dolmuş kod reddedilir                                | BAŞARILI | null                                                                                                                                         |
| 25   | 25 — Etkinlik bittiğinde misafir erişimi kapanır                 | BAŞARILI | null                                                                                                                                         |
| 26   | 26 — Etkinlik iptali oda erişimini kapatır                       | BAŞARILI | null                                                                                                                                         |
| 27   | 27 — Etkinlik iptali özel daveti kapatır                         | BAŞARILI | null                                                                                                                                         |
| 28   | 28 — Anonim ve oturumlu istemcinin doğrudan tablo erişimi kapalı | BAŞARILI | null                                                                                                                                         |
| 29   | 29 — RPC doğrudan istemciye kapalı, sunucuya açık                | BAŞARILI | null                                                                                                                                         |
| 30   | 30 — Test kapsamı                                                | BİLGİ    | Bu transaction sonunda yeni test etkinliği/davetleri ROLLBACK ile geri alınır. E-posta teslimi, HTTP/çerez ve eş zamanlı yarışlar sınanmadı. |

## Tamamlayıcı EClub testi — 25 Ekim 2026

Kullanıcı `VIVA_ASAMA_1_ECLUB_SQL_TEST.sql` sonucunu paylaştı: **7 başarılı, 0 atlandı, 0 başarısız**. İlk dosyada atlanan 05/09 senaryoları bu çalıştırmada doğrulandı. Ajan veritabanına erişmedi veya SQL çalıştırmadı.

| Sıra | Test | Sonuç |
|---|---|---|
| 1 | Kapsamı uygun UTT–EClub çifti bulundu | BAŞARILI |
| 2 | Davetli EClub üyesi taslağa erişemez | BAŞARILI |
| 3 | Taslak detay isteği de reddedilir | BAŞARILI |
| 4 | Planlama sonrası davetli EClub üyesi erişir | BAŞARILI |
| 5 | Üye detay görür; yönetim ve kişi listeleri açılmaz | BAŞARILI |
| 6 | Katılımcı çıkarılınca erişim kapanır | BAŞARILI |
| 7 | Çıkarılmış üyenin detay isteği reddedilir | BAŞARILI |

Bu sonuç SQL kapsamındaki EClub erişim kontrollerini doğrular; gerçek tarayıcı, e-posta teslimatı ve eş zamanlı bağlantı testlerinin yerine geçmez.
