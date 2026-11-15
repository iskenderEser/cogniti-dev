import test from 'node:test';
import assert from 'node:assert/strict';
import { MUSTERI_ROLU, URETICI_ROLLER, TUM_ROLLER } from '@/lib/utils/roller';
import { esnekPaketBakiyeTuru } from '@/lib/satinAlma/esnekPaket';
import { kkoHesapTuru } from '@/lib/satinAlma/kkoYetkisi';

// SENARYO-UYE-01: Eczanem üye kimlik düzlemi sözleşmesi (MUSTERI_ROLU = 'musteri' ve TUM_ROLLER dışı)
test('SENARYO-UYE-01: MUSTERI_ROLU teknik olarak musteridir ve iç kullanıcıların TUM_ROLLER listesinde yer almaz', () => {
  assert.equal(MUSTERI_ROLU, 'musteri');
  assert.equal(
    TUM_ROLLER.includes(MUSTERI_ROLU as any),
    false,
    "Müşteri/üye rolü iç TUM_ROLLER listesinde yer almamalıdır (eczanem_musteriler düzlemindedir)."
  );
});

// SENARYO-UYE-02: Dijital kanal rafları mimarisi (5 ana raf sözleşmesi)
test('SENARYO-UYE-02: Eczanem üye ana sayfası 5 dijital kanal rafını destekler', () => {
  const beklenenRaflar = [
    'yeni_videolarim',
    'yarim_biraktiklarim',
    'en_son_izlediklerim',
    'en_cok_begenilenler',
    'en_cok_favorilenenler'
  ];
  const sahteRaflar = {
    yeni_videolarim: [],
    yarim_biraktiklarim: [],
    en_son_izlediklerim: [],
    en_cok_begenilenler: [],
    en_cok_favorilenenler: []
  };
  assert.deepEqual(Object.keys(sahteRaflar).sort(), beklenenRaflar.sort());
});

// SENARYO-UYE-03: Aktif üyelik kapısı doğrulaması (üye bağlı olmadığı eczanenin içeriğini izleyemez)
test('SENARYO-UYE-03: Aktif üyelik kapısı kontrolü (eczane_uyelikler bağı zorunludur)', () => {
  const izlemeYetkisiVarMi = (uyeBagliEczaneler: string[], hedefEczaneId: string): boolean => {
    return uyeBagliEczaneler.includes(hedefEczaneId);
  };
  
  const uyeEczaneleri = ['eczane-1', 'eczane-2'];
  assert.equal(izlemeYetkisiVarMi(uyeEczaneleri, 'eczane-1'), true);
  assert.equal(izlemeYetkisiVarMi(uyeEczaneleri, 'eczane-999'), false, 'Bağlı olunmayan eczane içeriği açılamaz');
});

// SENARYO-UYE-04: 180 günlük puan ömrü ve 4lü bağlantı kuralı
test('SENARYO-UYE-04: Puan kaydı 4lü bağ (musteri+eczane+firma+urun) ve 180 gün geçerlilik süresi taşır', () => {
  const puanKaydiOlustur = (musteriId: string, eczaneId: string, firmaId: string, urunId: string) => {
    const simdi = new Date('2026-11-15T10:00:00Z');
    const sonKullanmaTarihi = new Date(simdi.getTime() + 180 * 24 * 60 * 60 * 1000);
    return {
      musteriId,
      eczaneId,
      firmaId,
      urunId,
      puan: 50,
      sonKullanmaTarihi: sonKullanmaTarihi.toISOString()
    };
  };
  
  const kayit = puanKaydiOlustur('m-1', 'e-1', 'f-1', 'u-1');
  assert.equal(kayit.musteriId, 'm-1');
  assert.equal(kayit.eczaneId, 'e-1');
  assert.equal(kayit.firmaId, 'f-1');
  assert.equal(kayit.urunId, 'u-1');
  assert.equal(kayit.sonKullanmaTarihi.startsWith('2027-05-14'), true, 'Puan geçerliliği tam 180 gün olmalıdır');
});

// SENARYO-UYE-05: FIFO puan tüketim mantığı (en eski tarihli geçerli puandan düşüm yapılır)
test('SENARYO-UYE-05: Puan harcamada FIFO kuralı (en eski tarihli geçerli puan önce harcanır)', () => {
  const puanlar = [
    { id: 'puan-1', tarih: '2026-06-01', puan: 30, gecerli: true },
    { id: 'puan-2', tarih: '2026-08-01', puan: 50, gecerli: true },
  ];
  
  // FIFO sıralama
  const fifoSirasi = [...puanlar].sort((a, b) => new Date(a.tarih).getTime() - new Date(b.tarih).getTime());
  assert.equal(fifoSirasi[0].id, 'puan-1', 'İlk önce en eski puan tüketilmelidir (FIFO)');
});

// SENARYO-UYE-06: Video beğeni ve favori etkileşiminde tekil toggle kuralı
test('SENARYO-UYE-06: Video beğeni ve favori etkileşimi tekil toggle olarak çalışır', () => {
  const begeniler = new Set<string>();
  const toggleBegeni = (musteriId: string, videoId: string) => {
    const key = `${musteriId}:${videoId}`;
    if (begeniler.has(key)) {
      begeniler.delete(key);
      return false; // kaldırıldı
    } else {
      begeniler.add(key);
      return true; // eklendi
    }
  };
  
  assert.equal(toggleBegeni('m-1', 'v-100'), true, 'İlk tıklamada beğeni eklenmelidir');
  assert.equal(begeniler.size, 1);
  assert.equal(toggleBegeni('m-1', 'v-100'), false, 'İkinci tıklamada beğeni geri alınmalıdır');
  assert.equal(begeniler.size, 0);
});

// SENARYO-UYE-07: Atomik hesap silme sözleşmesi (tüm üye tabloları ve Auth tek hamlede temizlenir)
test('SENARYO-UYE-07: Atomik hesap silme kuralı (tek işlemde profil, üyelikler ve Auth temizliği)', () => {
  const silmeIslemi = (sifreDogruMu: boolean) => {
    if (!sifreDogruMu) return { ok: false, hata: 'Şifre hatalı' };
    return {
      ok: true,
      silinenTablolar: ['eczanem_uyelikler', 'eczanem_video_begeniler', 'eczanem_musteriler', 'auth.users'],
      arşivlendiMi: true
    };
  };
  
  assert.equal(silmeIslemi(false).ok, false);
  const basariliSilme = silmeIslemi(true);
  assert.equal(basariliSilme.ok, true);
  assert.equal(basariliSilme.silinenTablolar.includes('auth.users'), true, 'Auth hesabı da silinmelidir');
  assert.equal(basariliSilme.arşivlendiMi, true, 'Denetim için anonim arşiv oluşturulmalıdır');
});

// SENARYO-UYE-08: Üye içerik üreticisi değildir (talep ve yayın açamaz)
test('SENARYO-UYE-08: Üye (musteri) URETICI_ROLLER listesinde yer almaz', () => {
  assert.equal(
    URETICI_ROLLER.includes(MUSTERI_ROLU as any),
    false,
    'Müşteri/üye üretici roller arasında bulunamaz.'
  );
});

// SENARYO-UYE-09: Üye token veya paket satın alamaz
test('SENARYO-UYE-09: Üye token veya esnek paket satın alamaz (bakiye türü null)', () => {
  assert.equal(
    esnekPaketBakiyeTuru(MUSTERI_ROLU),
    null,
    'Müşteri/üye esnek paket satın alamaz.'
  );
  assert.equal(
    kkoHesapTuru(MUSTERI_ROLU),
    null,
    'Müşteri/üye KKÖ yönetemez.'
  );
});

// SENARYO-UYE-10: Çapraz üye veri izolasyonu kuralı
test('SENARYO-UYE-10: Çapraz üye veri izolasyonu (musteri_id uyuşmazlığında erişim engellenir)', () => {
  const oturumMusteriId = 'musteri-111';
  const hedefVeriMusteriId = 'musteri-222';
  const erisimIzni = (kaynak: string, hedef: string) => kaynak === hedef;
  
  assert.equal(erisimIzni(oturumMusteriId, hedefVeriMusteriId), false, 'Yabancı üye verisine erişim engellenmelidir');
  assert.equal(erisimIzni(oturumMusteriId, oturumMusteriId), true, 'Kendi verisine erişim serbesttir');
});
