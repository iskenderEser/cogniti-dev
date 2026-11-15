# Cogniti repo inceleme planı

## Görevleri nasıl vereceğiz?

Codex her turda tek bir iş kuralını küçük bir göreve dönüştürür. Antigravity ilgili dosyaları okur ve sonucu döner. Sonuç geldikten sonra Codex bulguyu değerlendirir ve sıradaki görevi yazar.

Her görev bir ekran veya işlemle başlar. İnceleme için birincil dosyayı ve gerekirse doğrudan kullanılan bir yardımcı dosyayı belirt. Daha fazla dosya gerekirse eksik kanıtı kaydet ve o bağlantıyı ayrı bir görev olarak ele al. Kod, SQL ve canlı veriler üzerinde işlem yapma.

## İlk görev

Antigravity’ye aşağıdaki bloğu tek başına gönder.

```text
Cogniti’de BM ana sayfası ilk açıldığında ölçüm zamanı Haftalık seçili mi?

Beklenen davranış: AGENTS.md içindeki «Zorunlu ölçüm zamanı standardı» bölümüne göre BM ana sayfası Haftalık seçimle başlar.
İncele: components/ana-sayfa/BmAnaSayfa.tsx. İlk seçim doğrudan bir yardımcı dosyadan geliyorsa yalnız o dosyayı da oku.
Rapor: Beklenen davranış, mevcut davranış, dosya:satır kanıtı ve durum (Uygun / Hatalı / Doğrulanamadı). Kanıt eksikse neyin eksik olduğunu yaz.
Yalnız bu kontrolü yap. Dosyaları değiştirme veya test çalıştırma.
```

## Sıradaki küçük kontroller

1. TM ana sayfasının ilk açılışta Haftalık başlaması.
2. BM ana sayfasındaki ölçüm seçeneklerinin ortak `PERIYOTLAR` kaynağından gelmesi.
3. TM ana sayfasındaki ölçüm seçeneklerinin ortak `PERIYOTLAR` kaynağından gelmesi.

Bu sıra Codex’in görev hazırlaması içindir. Antigravity’ye her turda yalnız o turun talimatı gider. Bir bulgu başka bir dosyanın incelenmesini gerektirirse sonraki turu o bulguya ayır.
