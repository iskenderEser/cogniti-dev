import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as crypto from 'node:crypto';
import * as sozlesme from '@/lib/viva/sozlesme';
import * as eposta from '@/lib/viva/eposta';
import * as roller from '@/lib/utils/roller';

const id = '00000000-0000-4000-8000-000000000001';
const baskaId = '00000000-0000-4000-8000-000000000002';
const form = { etkinlik_id: id, baslik: 'Eğitim', aciklama: '', yayin_turu: 'planli', durum: 'planlandi',
  baslangic: '2027-01-01T21:30:00Z', bitis: '2027-01-01T22:00:00Z', katilimcilar: [] };
type Ayarlar = { rol?: string; oturum?: boolean; sahip?: string; yonetebilir?: boolean;
  olusturabilir?: boolean; mevcutSahip?: string; yetkiHatasi?: { code: string }; okumaHatasi?: { code: string };
  kayitHatasi?: { code: string }; yenidenDeneHatasi?: { code: string }; anahtar?: string | null;
  detay?: Record<string, unknown>; kisiEpostalari?: { tur: string; id: string; eposta: string | null; firma_id?: string | null }[];
  firmalar?: { firma_id: string; firma_adi: string }[];
  eczaneBaglari?: { kisi_id: string; eczane_adi: string; aktif_mi: boolean }[];
  yayinOturumu?: string | null; sunucuGirisleri?: { joined_at?: string | number; timestamp?: string | number }[] };
type Istek = { ad: string; girdi: Record<string, unknown> };

function ortam(ayar: Ayarlar = {}) {
  const istekler: Istek[] = [];
  const exports: Record<string, unknown> = {};
  const db = {
    rpc: async (ad: string, girdi: Record<string, unknown>) => {
      istekler.push({ ad, girdi });
      if (ad === 'viva_davet_baglami') return { data: { olusturabilir: ayar.olusturabilir ?? true }, error: ayar.yetkiHatasi ?? null };
      if (ad === 'viva_eposta_detay' && ayar.detay) return { data: ayar.detay, error: null };
      if (ad === 'viva_eposta_kaydet') return { data: { etkinlik: { etkinlik_id: id }, eposta_davetleri: [] }, error: ayar.kayitHatasi ?? null };
      if (ad === 'viva_eposta_yeniden_dene') return { data: { etkinlik: { etkinlik_id: id }, eposta_davetleri: [{ davet_id: baskaId, durum: 'bekliyor' }] }, error: ayar.yenidenDeneHatasi ?? null };
      if (girdi.p_islem === 'detay') return { data: { etkinlik: { sahip_id: ayar.sahip ?? id, yonetebilir: ayar.yonetebilir ?? true } }, error: ayar.yetkiHatasi ?? null };
      return { data: { etkinlik: { etkinlik_id: id } }, error: null };
    },
    from: (tablo: string) => {
      if (['viva_daily_yasam','viva_daily_odalar'].includes(tablo)) return {select:()=>({eq:(kolon:string,deger:string)=>{
        assert.equal(kolon,'etkinlik_id');assert.equal(deger,id);
        return {maybeSingle:async()=>({data:tablo==='viva_daily_yasam'?{oturum_id:ayar.yayinOturumu??null}:{domain:'cogniti-viva.daily.co',oda_adi:'viva-test-n1'},error:null})};
      }})};
      if (tablo==='viva_daily_olaylar') {
        const filtreler:Record<string,unknown>={};
        const sorgu={eq:(alan:string,deger:string)=>{filtreler[alan]=deger;return sorgu;},or:(filtre:string)=>{filtreler.oda=filtre;return sorgu;},order:()=>sorgu,limit:async()=>{
          istekler.push({ad:tablo,girdi:filtreler});return {data:(ayar.sunucuGirisleri??[]).map(veri=>({veri})),error:null};
        }};
        return {select:()=>sorgu};
      }
      if (tablo==='eclub_kisi_eczane') return { select: (alan:string) => ({ in: (kolon:string,ids:string[]) => ({ eq: async (filtre:string,aktif:boolean) => {
        assert.equal(kolon,'kisi_id');assert.equal(filtre,'aktif_mi');assert.equal(aktif,true);
        istekler.push({ad:tablo,girdi:{alan,kolon,ids}});
        return {data:(ayar.eczaneBaglari??[]).filter(b=>ids.includes(b.kisi_id)&&b.aktif_mi===aktif).map(b=>({kisi_id:b.kisi_id,eclub_eczaneler:{eclub_eczane_master:{eczane_adi:b.eczane_adi}}})),error:null};
      } }) }) };
      if (tablo==='firmalar') return {select:(alan:string)=>({in:async(kolon:string,ids:string[])=>{
        istekler.push({ad:tablo,girdi:{alan,kolon,ids}});
        return {data:(ayar.firmalar??[]).filter(f=>ids.includes(f.firma_id)),error:ayar.okumaHatasi??null};
      }})};
      if (['kullanicilar','eclub_kisiler'].includes(tablo)) return { select: (alan: string) => ({ in: async (kolon: string, ids: string[]) => {
        istekler.push({ ad: tablo, girdi: { alan, kolon, ids } });
        const tur=tablo==='kullanicilar'?'ic':'eclub';
        return { data: (ayar.kisiEpostalari ?? []).filter(k=>k.tur===tur&&ids.includes(k.id)).map(k=>({[kolon]:k.id,eposta:k.eposta,firma_id:k.firma_id??null})), error: ayar.okumaHatasi ?? null };
      } }) };
      assert.equal(tablo, 'viva_etkinlikler');
      return { select: (alan: string) => {
        assert.equal(alan, 'sahip_id');
        return { eq: (kolon: string, deger: unknown) => {
          assert.equal(kolon, 'etkinlik_id'); assert.equal(deger, id);
          return { maybeSingle: async () => ({ data: ayar.mevcutSahip ? { sahip_id: ayar.mevcutSahip } : null, error: ayar.okumaHatasi ?? null }) };
        } };
      } };
    },
  };
  const modules: Record<string, unknown> = {
    'node:crypto': crypto, 'next/server': { NextResponse: {} },
    '@/lib/supabase/server': {
      createClient: async () => ({ auth: { getUser: async () => ({ data: { user: ayar.oturum === false ? null : { id } }, error: null }) } }),
      createAdminClient: () => db,
    },
    '@/lib/utils/rolCozucu': { rolCozucu: async () => ayar.rol ?? 'utt' },
    '@/lib/utils/roller': roller, './sozlesme': sozlesme, './eposta': eposta,
  };
  const code = ts.transpileModule(readFileSync('lib/viva/sunucu.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { exports, require: (ad: string) => { assert.ok(ad in modules, ad); return modules[ad]; },
    process: { env: { SUPABASE_SERVICE_ROLE_KEY: ayar.anahtar === null ? undefined : ayar.anahtar ?? 'yalniz-yerel-test-anahtari' } },
    fetch: () => { throw new Error('Bu adımda e-posta gönderilmemeli.'); },
  });
  return { istekler, yaz: exports.vivaYaz as (islem: string, veri: Record<string, unknown>) => Promise<unknown>,
    oku: exports.vivaOku as (islem: string, veri: Record<string, unknown>) => Promise<unknown>,
    token: exports.vivaEpostaDavetToken as (davetId: string) => string,
    mutasyonlar: () => istekler.filter(x => ['viva_eposta_kaydet', 'viva_eposta_yeniden_dene'].includes(x.ad) || (x.ad === 'viva_islem' && x.girdi.p_islem !== 'detay')) };
}

const durum = (status: number, metin?: RegExp) => (hata: unknown) => {
  assert.equal((hata as { status: number }).status, status);
  if (metin) assert.match((hata as Error).message, metin);
  return true;
};

test('Katılımcı e-postaları yalnız düzenleyenin yetkili detayında ve seçili kişi kimliklerinden okunur',async()=>{
  const detay={etkinlik:{sahip_id:id,yonetebilir:true},katilimcilar:[{tur:'ic',id:baskaId},{tur:'eclub',id:baskaId}],davetler:[]};
  const kisiEpostalari=[{tur:'ic',id:baskaId,eposta:'ekip@example.invalid'},{tur:'eclub',id:baskaId,eposta:'uye@example.invalid'},{tur:'ic',id,eposta:'secili-degil@example.invalid'}];
  const eczaneBaglari=[{kisi_id:baskaId,eczane_adi:'Örnek Eczanesi',aktif_mi:true},{kisi_id:baskaId,eczane_adi:'Eski Eczane',aktif_mi:false},{kisi_id:id,eczane_adi:'Seçilmemiş Eczane',aktif_mi:true}];
  const o=ortam({detay,kisiEpostalari,eczaneBaglari});
  const sonuc=await o.oku('detay',{etkinlik_id:id}) as {katilimcilar:{eposta:string;eczane_adi:string|null}[]};
  assert.deepEqual(sonuc.katilimcilar.map(k=>k.eposta),['ekip@example.invalid','uye@example.invalid']);
  assert.deepEqual(sonuc.katilimcilar.map(k=>k.eczane_adi),[null,'Örnek Eczanesi']);
  assert.equal(JSON.stringify(o.istekler.find(i=>i.ad==='eclub_kisi_eczane')?.girdi.ids),JSON.stringify([baskaId]));
  const okumalar=o.istekler.filter(i=>['kullanicilar','eclub_kisiler'].includes(i.ad));
  assert.equal(okumalar.length,2);assert(okumalar.every(i=>JSON.stringify(i.girdi.ids)===JSON.stringify([baskaId])));
  for(const etkinlik of [{sahip_id:baskaId,yonetebilir:true},{sahip_id:id,yonetebilir:false}]){
    const kapali=ortam({detay:{...detay,etkinlik},kisiEpostalari});
    await kapali.oku('detay',{etkinlik_id:id});
    assert(!kapali.istekler.some(i=>['kullanicilar','eclub_kisiler'].includes(i.ad)));
  }
  const hata={code:'42501'};const kapali=ortam({detay,kisiEpostalari,okumaHatasi:hata});
  await assert.rejects(kapali.oku('detay',{etkinlik_id:id}),e=>e===hata);
});
test('detay yayın başlangıcını gerçek sunucu girişinden alır; hiç açılmamış sona eren yayını ayırır',async()=>{
 const etkinlik={...form,sahip_id:id,yonetebilir:false,durum:'canli'};
 const o=ortam({detay:{etkinlik,katilimcilar:[],davetler:[]},yayinOturumu:baskaId,sunucuGirisleri:[{joined_at:'2026-10-26T14:03:00Z'},{joined_at:'2026-10-26T14:00:00Z'}]});
 const sonuc=await o.oku('detay',{etkinlik_id:id}) as {etkinlik:{yayin_basladi:boolean;yayin_baslangici:string|null}};
 assert.equal(sonuc.etkinlik.yayin_basladi,true);assert.equal(sonuc.etkinlik.yayin_baslangici,'2026-10-26T14:00:00.000Z');
 const okuma=o.istekler.find(i=>i.ad==='viva_daily_olaylar');assert(okuma);
 const kimlik=`vi_${crypto.createHash('sha256').update(`viva:uye:${id}`).digest('hex').slice(0,32)}`;
 assert.equal(okuma.girdi['veri->>user_id'],kimlik);assert.equal(okuma.girdi.tur,'participant.joined');assert.match(String(okuma.girdi.oda),/viva-test-n1/);
 const acilmadi=ortam({detay:{etkinlik:{...etkinlik,durum:'sona_erdi'},katilimcilar:[],davetler:[]}});
 const gecmis=await acilmadi.oku('detay',{etkinlik_id:id}) as {etkinlik:{yayin_basladi:boolean;yayin_baslangici:string|null}};
 assert.equal(gecmis.etkinlik.yayin_basladi,false);assert.equal(gecmis.etkinlik.yayin_baslangici,null);
 assert(!acilmadi.istekler.some(i=>i.ad==='viva_daily_olaylar'));
});

test('E-posta kaydı: oluşturma ve düzenleme normalize adreslerle atomik RPCye bağlanır', async () => {
  for (const islem of ['olustur', 'kaydet']) for (const durumAdi of ['taslak', 'planlandi']) {
    const o = ortam();
    await o.yaz(islem, { ...form, surum: 1, durum: durumAdi, davet_epostalari: [' BIR@EXAMPLE.COM ', 'bir@example.com', 'iki@example.com'] });
    assert.equal(o.mutasyonlar().length, 1);
    const kayit = o.mutasyonlar()[0]; assert.equal(kayit.ad, 'viva_eposta_kaydet');
    assert.deepEqual((kayit.girdi.p_veri as Record<string, unknown>).davet_epostalari, ['bir@example.com', 'iki@example.com']);
    const adaylar = kayit.girdi.p_davetler as { eposta: string; davet_id: string; token_hash: string }[];
    assert.equal(adaylar.length, 2); assert.equal(new Set(adaylar.map(x => x.davet_id)).size, 2);
    for (const aday of adaylar) {
      assert(sozlesme.vivaUuidMu(aday.davet_id)); assert.match(aday.token_hash, /^[a-f0-9]{64}$/);
      const hamToken = o.token(aday.davet_id);
      assert.equal(aday.token_hash, crypto.createHash('sha256').update(hamToken).digest('hex'));
      assert.equal(JSON.stringify(kayit.girdi).includes(hamToken), false);
    }
    assert(o.istekler.every(x => x.girdi.p_auth === id));
  }
});

test('E-posta sözleşmesi: boş alan mevcut kayıt ve tekrar deneme verisini korur', async () => {
  for (const islem of ['olustur', 'kaydet']) {
    const o = ortam(); const veri = { ...form, surum: 1 };
    await o.yaz(islem, veri); await o.yaz(islem, { ...veri, davet_epostalari: [] });
    const mutasyonlar = o.mutasyonlar(); assert.equal(mutasyonlar.length, 2);
    assert.equal(mutasyonlar[0].ad, 'viva_islem'); assert.equal(mutasyonlar[1].ad, 'viva_eposta_kaydet');
    const { davet_epostalari, ...bosAlanHaric } = mutasyonlar[1].girdi.p_veri as Record<string, unknown>;
    assert.deepEqual(davet_epostalari, []); assert.equal((mutasyonlar[1].girdi.p_davetler as unknown[]).length, 0);
    assert.deepEqual(JSON.parse(JSON.stringify(mutasyonlar[0].girdi.p_veri)), bosAlanHaric);
    assert.equal(mutasyonlar[0].girdi.p_islem, islem);
  }
});

test('E-posta kaydı: aday kimlikleri ayrı tutulur, tekrar denemede yayın formu değişmez', async () => {
  const o = ortam(); const veri = { ...form, davet_epostalari: ['bir@example.com'] };
  await o.yaz('olustur', veri); await o.yaz('olustur', veri);
  const kayitlar = o.mutasyonlar(); assert.deepEqual(kayitlar[0].girdi.p_veri, kayitlar[1].girdi.p_veri);
  assert.notDeepEqual(kayitlar[0].girdi.p_davetler, kayitlar[1].girdi.p_davetler);
  assert.equal('p_davetler' in (kayitlar[0].girdi.p_veri as object), false);
  assert.deepEqual(veri.davet_epostalari, ['bir@example.com']);
});

test('E-posta kaydı: sunucu bağlantı anahtarı eksikse adresli kayıt başlamaz', async () => {
  const o = ortam({ anahtar: null });
  await assert.rejects(o.yaz('olustur', { ...form, davet_epostalari: ['bir@example.com'] }), durum(503, /bağlantısı/));
  assert.equal(o.mutasyonlar().length, 0);
  await o.yaz('olustur', { ...form, davet_epostalari: [] }); assert.equal(o.mutasyonlar().length, 1);
});

test('E-posta kaydı: RPC başarısızsa adresleri düşüren eski kayıt yoluna dönülmez', async () => {
  for (const code of ['PGRST202', '40001', '42501']) {
    const error = { code }; const o = ortam({ kayitHatasi: error });
    await assert.rejects(o.yaz('kaydet', { ...form, surum: 1, davet_epostalari: ['bir@example.com'] }), (hata: unknown) => hata === error);
    assert.equal(o.mutasyonlar().length, 1); assert.equal(o.mutasyonlar()[0].ad, 'viva_eposta_kaydet');
  }
});

test('E-posta kaydı: ayrıntı yeni RPCden okunur; ham davet tokenı kimlik ve sunucu anahtarına bağlıdır', async () => {
  const o = ortam(); await o.oku('detay', { etkinlik_id: id });
  assert.equal(o.istekler[0].ad, 'viva_eposta_detay'); assert.deepEqual(JSON.parse(JSON.stringify(o.istekler[0].girdi)), { p_auth: id, p_id: id });
  const token = o.token(id); assert.match(token, /^[A-Za-z0-9_-]{43}$/); assert.equal(o.token(id), token);
  assert.notEqual(o.token(baskaId), token); assert.notEqual(ortam({ anahtar: 'baska-yerel-test-anahtari' }).token(id), token);
  assert.throws(() => o.token('bozuk'), /Geçersiz davet/);
});

test('E-posta sunucu: bozuk liste ve hatalı adres doğrudan API çağrısında 400 ile reddedilir', async () => {
  for (const islem of ['olustur', 'kaydet']) for (const adresler of [null, 'bir@example.com', {}, [null], ['ok@example.com', 'eksik@'], ['ad..soyad@example.com']]) {
    const o = ortam();
    await assert.rejects(o.yaz(islem, { ...form, surum: 1, davet_epostalari: adresler }), durum(400, /e-posta/));
    assert.equal(o.istekler.length, 0);
  }
});

test('E-posta sunucu: oturumsuz, E-Club ve tanımsız rol davet yönetemez', async () => {
  for (const ayar of [{ oturum: false }, ...roller.ECLUB_TUKETICI_ROLLERI.map(rol => ({ rol })), { rol: 'bilinmeyen' }]) {
    const o = ortam(ayar);
    for (const [islem, veri] of [['olustur', { ...form, davet_epostalari: ['bir@example.com'] }],
      ['davet_ekle', { ...form, surum: 1, ad: 'Misafir', eposta: 'bir@example.com' }],
      ['davet_iptal', { ...form, surum: 1, davet_id: baskaId }],
      ['davet_yeniden_dene', { ...form, surum: 1, davet_id: baskaId }]] as const) {
      await assert.rejects(o.yaz(islem, veri), durum('oturum' in ayar ? 401 : 403));
    }
    assert.equal(o.istekler.length, 0);
  }
});

test('E-posta sunucu: tüm iç roller yalnız kendi yayınlarının davetini ekleyebilir/iptal edebilir', async () => {
  for (const rol of roller.TUM_ROLLER) {
    const o = ortam({ rol });
    await o.yaz('davet_ekle', { ...form, surum: 1, ad: ' Misafir ', eposta: ' BIR@EXAMPLE.COM ' });
    await o.yaz('davet_iptal', { ...form, surum: 2, davet_id: baskaId });
    const mutasyonlar = o.mutasyonlar(); assert.equal(mutasyonlar.length, 2);
    assert.equal((mutasyonlar[0].girdi.p_veri as Record<string, unknown>).eposta, 'bir@example.com');
    assert.equal((mutasyonlar[0].girdi.p_veri as Record<string, unknown>).ad, 'Misafir');
    assert.match(String((mutasyonlar[0].girdi.p_veri as Record<string, unknown>).hash), /^[a-f0-9]{64}$/);
    assert(o.istekler.every(x => x.girdi.p_auth === id));
  }
});

test('E-posta sunucu: sahibi olmayan kullanıcı sahte sahip/rol alanlarıyla davetleri değiştiremez', async () => {
  for (const islem of ['kaydet', 'davet_ekle', 'davet_iptal', 'davet_yeniden_dene']) {
    const o = ortam({ sahip: baskaId, yonetebilir: false });
    await assert.rejects(o.yaz(islem, { ...form, surum: 1, sahip_id: id, rol: 'admin', yonetebilir: true,
      davet_epostalari: [], ad: 'Misafir', eposta: 'bir@example.com', davet_id: baskaId }), durum(403, /davetlerini yönetme/));
    assert.equal(o.mutasyonlar().length, 0);
  }
});

test('E-posta sunucu: kimlik ve yönetim izni birlikte doğrulanır', async () => {
  for (const ayar of [{ sahip: baskaId, yonetebilir: true }, { sahip: id, yonetebilir: false }]) {
    const o = ortam(ayar);
    await assert.rejects(o.yaz('davet_iptal', { ...form, surum: 1, davet_id: baskaId }), durum(403));
    assert.equal(o.mutasyonlar().length, 0);
  }
});

test('E-posta sunucu: yeni yayında oluşturma izni ve mevcut kimliğin sahibi kontrol edilir', async () => {
  for (const ayar of [{ olusturabilir: false }, { mevcutSahip: baskaId }]) {
    const o = ortam(ayar);
    await assert.rejects(o.yaz('olustur', { ...form, davet_epostalari: ['bir@example.com'], sahip_id: id }), durum(403));
    assert.equal(o.mutasyonlar().length, 0);
  }
});

test('E-posta sunucu: yetki okuması başarısızsa işlem ilerlemez', async () => {
  for (const [ayar, islem] of [[{ yetkiHatasi: { code: '42501' } }, 'kaydet'],
    [{ yetkiHatasi: { code: 'PGRST202' } }, 'olustur'], [{ okumaHatasi: { code: 'XX000' } }, 'olustur']] as const) {
    const o = ortam(ayar); const error = 'okumaHatasi' in ayar ? ayar.okumaHatasi : ayar.yetkiHatasi;
    await assert.rejects(o.yaz(islem, { ...form, surum: 1, davet_epostalari: ['bir@example.com'] }), (hata: unknown) => hata === error);
    assert.equal(o.mutasyonlar().length, 0);
  }
});

test('E-posta sunucu: manuel bağlantı davetinde de aynı adres doğrulaması kullanılır', async () => {
  for (const adres of ['ad..soyad@example.com', 'a@example.com,b@example.com', 'eksik@', null]) {
    const o = ortam();
    await assert.rejects(o.yaz('davet_ekle', { ...form, surum: 1, ad: 'Misafir', eposta: adres }), durum(400));
    assert.equal(o.istekler.length, 0);
  }
});

test('E-posta yeniden deneme yalnız sahibin ayrı RPCsine gider; etkinlik veya davet yazılmaz', async () => {
  const o = ortam();
  const sonuc = await o.yaz('davet_yeniden_dene', { etkinlik_id: id, surum: 4, davet_id: baskaId }) as { eposta_davetleri: { durum: string }[] };
  assert.equal(sonuc.eposta_davetleri[0].durum, 'bekliyor');
  assert.deepEqual(JSON.parse(JSON.stringify(o.mutasyonlar())), [{ ad: 'viva_eposta_yeniden_dene', girdi: {
    p_auth: id, p_etkinlik: id, p_davet: baskaId, p_surum: 4,
  } }]);
  for (const ayar of [{ sahip: baskaId, yonetebilir: false }, { yenidenDeneHatasi: { code: '22023' } }]) {
    const x = ortam(ayar);
    await assert.rejects(x.yaz('davet_yeniden_dene', { etkinlik_id: id, surum: 4, davet_id: baskaId }));
  }
  await assert.rejects(ortam().yaz('davet_yeniden_dene', { etkinlik_id: id, surum: 4, davet_id: 'bozuk' }), durum(400));
});

test('Katılımcının firma adı kendi firma kimliğinden okunur; etkinliğin firması veya seçilmemiş kişi kullanılmaz',async()=>{
 const firmaId='00000000-0000-4000-8000-000000000003';
 const detay={etkinlik:{sahip_id:id,yonetebilir:true,firma_adi:'Etkinliği düzenleyen firma'},katilimcilar:[{tur:'ic',id:baskaId},{tur:'eclub',id:baskaId}],davetler:[]};
 const kisiEpostalari=[{tur:'ic',id:baskaId,eposta:'ekip@example.invalid',firma_id:firmaId},{tur:'ic',id,eposta:'secili-degil@example.invalid',firma_id:id}];
 const firmalar=[{firma_id:firmaId,firma_adi:'Çalışanın firması'},{firma_id:id,firma_adi:'Seçilmemiş firma'}];
 const o=ortam({detay,kisiEpostalari,firmalar});
 const sonuc=await o.oku('detay',{etkinlik_id:id}) as {katilimcilar:{firma_adi:string|null}[]};
 assert.deepEqual(sonuc.katilimcilar.map(k=>k.firma_adi),['Çalışanın firması',null]);
 assert.equal(JSON.stringify(o.istekler.find(i=>i.ad==='firmalar')?.girdi.ids),JSON.stringify([firmaId]));
 for(const etkinlik of [{sahip_id:baskaId,yonetebilir:true},{sahip_id:id,yonetebilir:false}]){
  const kapali=ortam({detay:{...detay,etkinlik},kisiEpostalari,firmalar});await kapali.oku('detay',{etkinlik_id:id});assert(!kapali.istekler.some(i=>i.ad==='firmalar'));
 }
});
