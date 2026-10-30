import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(path, modules = {}) {
  const source = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(source, { exports, console: { error() {} }, require: name => modules[name] });
  return exports;
}
const roller = load('lib/utils/roller.ts');
const turler = load('lib/ogrenmeAraci/turSunumu.ts');
const yayinKodu = load('lib/utils/yayinKodu.ts');
const sunum = load('lib/token/detay.ts', { '@/lib/utils/roller': roller, '@/lib/ogrenmeAraci/turSunumu': turler, '@/lib/utils/yayinKodu': yayinKodu });
function setup({ user = { id: 'session-user' }, authError = null, error = null, data = { satirlar: [], devami_var: false } } = {}) {
  const calls = [];
  const route = load('app/(panel)/token/api/detay/route.ts', {
    'next/server': { NextResponse: { json: Response.json.bind(Response) } },
    '@/lib/supabase/server': {
      createClient: async () => ({ auth: { getUser: async () => ({ data: { user }, error: authError }) } }),
      createAdminClient: () => ({ rpc: async (name, args) => { calls.push({ name, args: JSON.parse(JSON.stringify(args)) }); return { data, error }; } }),
    },
    '@/lib/utils/hataIsle': { yetkiHatasi: () => Response.json({ hata: 'Yetkisiz' }, { status: 401 }), validasyonHatasi: () => Response.json({ hata: 'Geçersiz' }, { status: 400 }), sunucuHatasi: () => Response.json({ hata: 'Hata' }, { status: 500 }) },
    '@/lib/token/detay': sunum,
  });
  return { calls, get: (query = '') => route.GET({ nextUrl: { searchParams: new URLSearchParams(query) } }) };
}
test('Token detay: oturum ve kimlik doğrulama zorunlu', async () => {
  for (const options of [{ user: null }, { authError: { message: 'expired' } }]) {
    const s = setup(options); assert.equal((await s.get()).status, 401); assert.equal(s.calls.length, 0);
  }
});
test('Token detay: firma, kişi ve kapsam istemciden alınmaz', async () => {
  const s = setup(); const response = await s.get('firma_id=foreign&kullanici_id=foreign&kapsam=firma&sayfa=2');
  assert.equal(response.status, 200);
  assert.deepEqual(s.calls, [{ name: 'cogniti_token_detay_raporu', args: { p_kullanici: 'session-user', p_sayfa: 2 } }]);
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
});
test('Token detay: geçersiz sayfa veritabanına ulaşmaz', async () => {
  for (const value of ['-1', '1.5', '2e2', '10001', 'abc', '']) {
    const s = setup(); assert.equal((await s.get(`sayfa=${value}`)).status, 400); assert.equal(s.calls.length, 0);
  }
});
test('Token detay: kapsüller doğrulanarak filtreli RPC’ye aktarılır', async () => {
  for (const arac of ['tumu','video','podcast','gorsel','flip_pdf','viva']) {
    const s = setup(); assert.equal((await s.get(`gonderi=eclub&arac=${arac}&sayfa=1`)).status,200);
    assert.deepEqual(s.calls,[{name:'cogniti_token_detay_raporu_filtreli',args:{p_kullanici:'session-user',p_sayfa:1,p_gonderi:'eclub',p_arac:arac}}]);
  }
  for (const query of ['gonderi=foreign','gonderi=','arac=unknown','arac=']) {
    const s=setup(); assert.equal((await s.get(query)).status,400); assert.equal(s.calls.length,0);
  }
});
test('Eczanem detayları yalnız oturum kimliğiyle istenir ve eczane sayısı korunur',async()=>{
  const s=setup({data:{satirlar:[{id:'ecza',tarih:'2026-10-29',firma_adi:'Hepifarma',talep_no:30037,urun:'Ürün',arac:'video',rol:'musteri',eczane_sayisi:2,gonderilen:37,token:10}],devami_var:false}});
  const r=await s.get('gonderi=eczanem&arac=video&sayfa=2&kullanici_id=foreign');assert.equal(r.status,200);
  assert.deepEqual(s.calls,[{name:'cogniti_token_eczanem_detay_raporu',args:{p_kullanici:'session-user',p_sayfa:2,p_arac:'video'}}]);
  const row=(await r.json()).satirlar[0];assert.equal(row.eczaneSayisi,2);assert.equal(row.gonderilenSayi,37);assert.equal(row.toplamToken,10);
});
test('Token detay: yedi sunum alanı gerçek HOYK yayın koduyla döner, kişi verisi sızmaz', async () => {
  const s = setup({ data: { satirlar: [{ id: 'row', tarih: '2026-10-29', yayin_id: '00000000-0000-4000-8000-000000000300', firma_adi: 'hepifarma', talep_no: 30008, urun: 'Ürün', arac: 'gorsel', rol: 'eczaci', gonderilen: 24, token: 24, alici_kimligi: 'private', eposta: 'private' }], devami_var: true } });
  assert.deepEqual(await (await s.get()).json(), { satirlar: [{ id: 'row', gonderimTarihi: '29.10.2026', yayinKodu: 'hepifarma_30008', yayinId: '00000000-0000-4000-8000-000000000300', yayinAdi: '—', urun: 'Ürün', yayinAraci: 'Dijital Broşür', gonderilenRol: 'Eczacı', gonderilenSayi: 24, toplamToken: 24 }], devamiVar: true });
});
test('Token detay: Viva tutarı kayıt adediyle karıştırılmaz, eksik bilgiler uydurulmaz', async () => {
  const s = setup({ data: { satirlar: [{ id: 'viva', tarih: '2026-10-29', urun: null, arac: 'viva', rol: 'viva_katilim', gonderilen: null, token: 200 }], devami_var: false } });
  const data = await (await s.get()).json();
  assert.equal(data.satirlar[0].toplamToken, 200); assert.equal(data.satirlar[0].gonderilenSayi, null);
  assert.equal(data.satirlar[0].urun, '—'); assert.equal(data.satirlar[0].yayinAraci, 'Viva');
  assert.equal(data.satirlar[0].yayinKodu, '—');
  assert.equal(data.satirlar[0].yayinId, null);
  assert.equal(data.satirlar[0].davetliler,'—');assert.equal(data.satirlar[0].davetliSayisi,null);assert.equal(data.satirlar[0].katilimSayisi,null);
});
test('Viva davetli türü, davetli sayısı ve Daily katılım sayısı ayrı aktarılır',async()=>{
  const raw={id:'viva',tarih:'2026-10-28',yayin_adi:'Deneme_13',urun:null,arac:'viva',rol:'viva_katilim',gonderilen:null,token:1,davetli_turleri:['ic','eclub'],davetli_sayisi:20,katilim_sayisi:13,eposta:'private'};
  const s=setup({data:{satirlar:[raw],devami_var:false}});const row=(await(await s.get('gonderi=eclub&arac=viva')).json()).satirlar[0];
  assert.equal(row.davetliler,'Firma üyesi / Eclub üyesi');assert.equal(row.davetliSayisi,20);assert.equal(row.katilimSayisi,13);assert.equal(row.toplamToken,1);assert(!('eposta'in row));
  const zero=sunum.tokenDetaySunumu({...raw,davetli_sayisi:0,katilim_sayisi:0});assert.equal(zero.davetliSayisi,0);assert.equal(zero.katilimSayisi,0);
  const other=sunum.tokenDetaySunumu({...raw,arac:'video'});assert(!('davetliSayisi'in other));assert(!('katilimSayisi'in other));
});
test('Token detay: eksik veya geçersiz yayın kimliği ve Viva için HOYK açılmaz', () => {
  for (const alanlar of [{}, { yayin_id: null }, { yayin_id: 'javascript:alert(1)' }, { yayin_id: '../foreign' }, { yayin_id: '00000000-0000-4000-8000-000000000300', arac: 'viva' }]) {
    assert.equal(sunum.tokenDetaySunumu({ id: 'row', tarih: '2026-10-29', urun: 'Ürün', arac: 'video', rol: 'eczaci', gonderilen: 1, token: 1, ...alanlar }).yayinId, null);
  }
});
test('Token detay: Viva etkinlik adı korunur; diğer araçlara etkinlik adı atanmaz',()=>{
  for(const arac of ['viva','video']){
    const row=sunum.tokenDetaySunumu({id:'r',tarih:'2026-10-27',yayin_adi:'Deneme_11_27_10_2026',urun:null,arac,rol:'eczaci',gonderilen:3,token:3});
    assert.equal(row.yayinAdi,arac==='viva'?'Deneme_11_27_10_2026':'—');
  }
});
test('Token detay: yayın kodu alanları bulunmayan eski SQL yanıtı kod uydurmaz', async () => {
  for (const alanlar of [{}, { firma_adi: 'hepifarma', talep_no: null }, { firma_adi: null, talep_no: 30008 }]) {
    const s = setup({ data: { satirlar: [{ id: 'old', tarih: '2026-10-29', urun: 'Ürün', arac: 'video', rol: 'utt', gonderilen: 1, token: 1, ...alanlar }], devami_var: false } });
    assert.equal((await (await s.get()).json()).satirlar[0].yayinKodu, '—');
  }
});
test('Token detay: yetki ve SQL hataları ayrılır, teknik ayrıntılar gizlenir', async () => {
  assert.equal((await setup({ error: { code: '42501' } }).get()).status, 401);
  const response = await setup({ error: { code: 'XX000', message: 'private sql' } }).get();
  assert.equal(response.status, 500); assert.doesNotMatch(JSON.stringify(await response.json()), /private sql/);
});
test('BM iki tabloyu tüm temsilciler/seçili UTT kapsamıyla ayrı RPCye bağlar',async()=>{
 const utt='00000000-0000-4000-8000-000000000004';
 for(const target of [null,utt])for(const gonderi of ['eclub','eczanem'])for(const arac of ['tumu','video','podcast','gorsel','flip_pdf','viva']){
  const s=setup();const res=await s.get(`gorunum=bm&gonderi=${gonderi}&arac=${arac}&sayfa=2${target?`&utt_id=${target}`:''}&kullanici_id=baska`);
  assert.equal(res.status,200);assert.deepEqual(s.calls,[{name:gonderi==='eclub'?'cogniti_token_bm_detay_raporu':'cogniti_token_bm_eczanem_detay_raporu',args:{p_kullanici:'session-user',p_utt:target,p_sayfa:2,...(gonderi==='eclub'?{p_gonderi:'eclub'}:{}),p_arac:arac}}]);
 }
 for(const q of ['gorunum=bm&gonderi=eclub&utt_id=invalid','gorunum=bm',`gonderi=eclub&utt_id=${utt}`]){const s=setup();assert.equal((await s.get(q)).status,400);assert.equal(s.calls.length,0);}
 assert.equal((await setup({error:{code:'42501'}}).get(`gorunum=bm&gonderi=eclub&utt_id=${utt}`)).status,401);
});
test('TM iki tablo ve altı aracı takım/BM/UTT kapsamıyla bağlar; BM olmadan UTT reddedilir',async()=>{
 const bm='00000000-0000-4000-8000-000000000003',utt='00000000-0000-4000-8000-000000000004';
 for(const [region,target] of [[null,null],[bm,null],[bm,utt]])for(const gonderi of ['eclub','eczanem'])for(const arac of ['tumu','video','podcast','gorsel','flip_pdf','viva']){
  const s=setup();const response=await s.get(`gorunum=tm&gonderi=${gonderi}&arac=${arac}&sayfa=2${region?`&bm_id=${region}`:''}${target?`&utt_id=${target}`:''}`);
  assert.equal(response.status,200);assert.deepEqual(s.calls,[{name:gonderi==='eclub'?'cogniti_token_tm_detay_raporu':'cogniti_token_tm_eczanem_detay_raporu',args:{p_kullanici:'session-user',p_bm:region,p_utt:target,p_sayfa:2,...(gonderi==='eclub'?{p_gonderi:'eclub'}:{}),p_arac:arac}}]);
 }
 for(const q of [`gorunum=tm&gonderi=eclub&utt_id=${utt}`,'gorunum=tm&gonderi=eclub&bm_id=invalid','gorunum=tm',`gorunum=bm&gonderi=eclub&bm_id=${bm}`]){const s=setup();assert.equal((await s.get(q)).status,400);assert.equal(s.calls.length,0);}
 assert.equal((await setup({error:{code:'42501'}}).get(`gorunum=tm&gonderi=eclub&bm_id=${bm}`)).status,401);
});
test('Yönetici iki tabloyu altı araçta firma/TM/BM/UTT kapsamıyla sorgular',async()=>{
 const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
 for(const [tm,bm,utt]of [[null,null,null],[id(2),null,null],[id(2),id(3),null],[id(2),id(3),id(4)]])for(const gonderi of ['eclub','eczanem'])for(const arac of ['tumu','video','podcast','gorsel','flip_pdf','viva']){
  const s=setup();const response=await s.get(`gorunum=yonetici&gonderi=${gonderi}&arac=${arac}&sayfa=2${tm?`&tm_id=${tm}`:''}${bm?`&bm_id=${bm}`:''}${utt?`&utt_id=${utt}`:''}`);
  assert.equal(response.status,200);assert.deepEqual(s.calls,[{name:gonderi==='eclub'?'cogniti_token_yonetici_detay_raporu':'cogniti_token_yonetici_eczanem_detay_raporu',args:{p_kullanici:'session-user',p_tm:tm,p_bm:bm,p_utt:utt,p_sayfa:2,...(gonderi==='eclub'?{p_gonderi:'eclub'}:{}),p_arac:arac}}]);
 }
 for(const q of ['gorunum=yonetici',`gorunum=yonetici&gonderi=eclub&bm_id=${id(3)}`,`gorunum=yonetici&gonderi=eclub&tm_id=${id(2)}&utt_id=${id(4)}`,`gorunum=tm&gonderi=eclub&tm_id=${id(2)}`]){const s=setup();assert.equal((await s.get(q)).status,400);assert.equal(s.calls.length,0);}
 assert.equal((await setup({error:{code:'42501'}}).get(`gorunum=yonetici&gonderi=eclub&tm_id=${id(2)}`)).status,401);
});
