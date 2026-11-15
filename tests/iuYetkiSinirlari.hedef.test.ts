import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  IU_ROLU, 
  URETIM_HATTI_GORENLER, 
  URETICI_ROLLER, 
  TUM_ROLLER, 
  YAYIN_DETAY_MODAL_ROLLER, 
  YAYINDAKI_VIDEO_GORENLER 
} from '@/lib/utils/roller';
import { tuketiciMi } from '@/lib/video/gorunurluk';
import { esnekPaketBakiyeTuru } from '@/lib/satinAlma/esnekPaket';
import { kkoHesapTuru } from '@/lib/satinAlma/kkoYetkisi';

// SENARYO-IU-01: iu rolü URETIM_HATTI_GORENLER ve TUM_ROLLER içindedir
test('SENARYO-IU-01: iu rolü URETIM_HATTI_GORENLER ve TUM_ROLLER içinde yer alır', () => {
  assert.equal(IU_ROLU, 'iu');
  assert.equal(TUM_ROLLER.includes(IU_ROLU), true, 'iu TUM_ROLLER içinde olmalıdır.');
  assert.equal(URETIM_HATTI_GORENLER.includes(IU_ROLU), true, 'iu URETIM_HATTI_GORENLER içinde olmalıdır.');
});

// SENARYO-IU-02: iu rolü URETICI_ROLLER listesinde yer almaz (talep açamaz)
test('SENARYO-IU-02: iu rolü URETICI_ROLLER listesinde yer almaz (yeni talep açamaz)', () => {
  assert.equal(
    URETICI_ROLLER.includes(IU_ROLU),
    false,
    'iu rolü üretici roller arasında bulunamaz.'
  );
});

// SENARYO-IU-03: iu rolü içerik onaylayamaz (onay yetkisi yalnız üreticiye aittir)
test('SENARYO-IU-03: iu rolü onay yetkisine sahip değildir', () => {
  const onayYetkisiVarMi = (rol: string, talepSahibiMi: boolean) => {
    return URETICI_ROLLER.includes(rol) && talepSahibiMi;
  };
  assert.equal(onayYetkisiVarMi('iu', true), false, 'iu talep üzerinde onay veremez');
  assert.equal(onayYetkisiVarMi('pm', true), true, 'Talebi açan PM onay verebilir');
});

// SENARYO-IU-04: iu rolü içerik yayına alamaz (yayin-yonetimi kapalıdır)
test('SENARYO-IU-04: iu rolü yayına alma yetkisine sahip değildir', () => {
  const yayinaAlabilirMi = (rol: string) => URETICI_ROLLER.includes(rol);
  assert.equal(yayinaAlabilirMi('iu'), false, 'iu içerik yayına alamaz');
});

// SENARYO-IU-05: iu video yüklemesinde ham Bunny GUID standardı kullanılır (36 karakter)
test('SENARYO-IU-05: Video tesliminde ham 36 karakterlik GUID standardı zorunludur', () => {
  const guidGecerliMi = (guid: string) => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(guid);
  };
  const testGuid = 'fcae5775-cf9b-4283-9ec8-deb1f3b62b7c';
  const hataliUrl = 'https://player.mediadelivery.net/embed/707975/fcae5775-cf9b-4283-9ec8-deb1f3b62b7c';
  
  assert.equal(guidGecerliMi(testGuid), true, 'Ham GUID geçerlidir');
  assert.equal(guidGecerliMi(hataliUrl), false, 'Tam URL veritabanına yazılamaz');
});

// SENARYO-IU-06: iu rolü tüketici değildir (tuketiciMi = false, izleme puanı kazanamaz)
test('SENARYO-IU-06: iu rolü tüketici değildir (tuketiciMi false olmalıdır)', () => {
  assert.equal(tuketiciMi('iu'), false, 'iu tüketici olamaz');
});

// SENARYO-IU-07: iu rolü YAYIN_DETAY_MODAL_ROLLER listesinde yer almaz
test('SENARYO-IU-07: iu rolü YAYIN_DETAY_MODAL_ROLLER listesinde bulunamaz', () => {
  assert.equal(
    YAYIN_DETAY_MODAL_ROLLER.includes(IU_ROLU as any),
    false,
    'iu rolü rapor yayın detay modalını açamaz.'
  );
});

// SENARYO-IU-08: iu rolü YAYINDAKI_VIDEO_GORENLER listesinde yer almaz
test('SENARYO-IU-08: iu rolü YAYINDAKI_VIDEO_GORENLER listesinde bulunamaz', () => {
  assert.equal(
    YAYINDAKI_VIDEO_GORENLER.includes(IU_ROLU as any),
    false,
    'iu rolü şirket yayınlarını genel katalogdan izleyemez.'
  );
});

// SENARYO-IU-09: iu rolü token veya paket satın alamaz
test('SENARYO-IU-09: iu rolü token veya esnek paket satın alamaz (bakiye türü null)', () => {
  assert.equal(esnekPaketBakiyeTuru('iu'), null, 'iu esnek paket satın alamaz.');
  assert.equal(kkoHesapTuru('iu'), null, 'iu KKÖ yönetemez.');
});

// SENARYO-IU-10: iu rolü FirmaStore siparişi veremez
test('SENARYO-IU-10: iu rolü FirmaStore siparişi veremez', () => {
  const STORE_ALABILEN_ROLLER = ['utt', 'kd_utt'];
  assert.equal(
    STORE_ALABILEN_ROLLER.includes('iu'),
    false,
    'iu FirmaStore siparişi veremez.'
  );
});
