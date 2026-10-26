import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import * as crypto from 'node:crypto';
import vm from 'node:vm';
import ts from 'typescript';

const id = '00000000-0000-4000-8000-000000000001';
const lease = '00000000-0000-4000-8000-000000000002';
const token = crypto.createHmac('sha256','test-key').update(`viva-eposta-davet-v1:${id}`).digest('base64url');
const hash = crypto.createHash('sha256').update(token).digest('hex');
const icerik = { from:'Cogniti Viva <viva@example.invalid>',to:'alici@example.invalid',
 subject:'Cogniti Viva yayın daveti',baslik:'Ekip toplantısı',baslangic:'2027-01-02T11:00:00Z',site:'https://cogniti.example' };
const is = (deneme_sayisi=1) => ({davet_id:id,kilit_id:lease,token_hash:hash,deneme_sayisi,icerik});

function ortam(yanitlar: Array<unknown>, aktif=true) {
 const exports: Record<string,unknown> = {};
 const bitisler: Record<string,unknown>[]=[];
 const cagri: Array<{url:string;init:Record<string,unknown>}> = [];
 const isler = [...yanitlar];
 const db = { rpc: async (ad:string,girdi:Record<string,unknown>) => {
  if(ad==='viva_eposta_is_al') return { data:isler.shift() ?? null,error:null };
  assert.equal(ad,'viva_eposta_is_bitir');bitisler.push(girdi);return {data:true,error:null};
 } };
 const source=ts.transpileModule(readFileSync('lib/viva/epostaGonderimSunucu.ts','utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
 }).outputText;
 const modules:Record<string,unknown>={
  'node:crypto':crypto,
  '@/lib/eclub/uyelikDaveti':{davetSiteAdresi:(origin:string)=>origin},
  './sunucu':{vivaEpostaDavetToken:()=>token,vivaHash:(v:string)=>crypto.createHash('sha256').update(v).digest('hex')},
 };
 let send: (url:string,init:Record<string,unknown>)=>Promise<unknown> = async () => ({ok:true,status:200,json:async()=>({id:'resend-1'})});
 vm.runInNewContext(source,{ exports, require:(ad:string)=>{assert.ok(ad in modules,ad);return modules[ad];},
  process:{env:{VIVA_EPOSTA_GONDERIM_AKTIF:aktif?'true':'',RESEND_API_KEY:'test-resend',VIVA_DAVET_EMAIL_FROM:icerik.from}},
  fetch:async(url:string,init:Record<string,unknown>)=>{cagri.push({url,init});return send(url,init);},
  AbortSignal,URL,Date,Intl,
 });
 return { db,bitisler,cagri,ayarla:(fn:typeof send)=>{send=fn;},
  isle:exports.vivaEpostaKuyrugunuIsle as (db:unknown,origin:string,son:number,max:number)=>Promise<Record<string,unknown>>,
  govde:exports.vivaDavetEpostaGovdesi as (work:ReturnType<typeof is>,key:string)=>Record<string,unknown> };
}

test('kapalı geçiş anahtarı hiçbir işi sahiplenmez ve ağ çağrısı yapmaz',async()=>{
 const o=ortam([is()],false);const sonuc=await o.isle(o.db,'https://cogniti.example',Date.now()+20000,1);
 assert.equal(sonuc.aktif,false);assert.equal(o.cagri.length,0);assert.equal(o.bitisler.length,0);
});
test('tekil bağlantı ve sabit sağlayıcı anahtarıyla kişiye özel davet gönderilir',async()=>{
 const o=ortam([is()]);const sonuc=await o.isle(o.db,'https://cogniti.example',Date.now()+20000,1);
 assert.equal(sonuc.gonderilen,1);assert.equal(o.cagri.length,1);
 assert.equal(o.cagri[0].url,'https://api.resend.com/emails');
 const headers=o.cagri[0].init.headers as Record<string,string>;
 assert.equal(headers['Idempotency-Key'],`viva-davet/${id}`);
 const body=JSON.parse(String(o.cagri[0].init.body));
 assert.deepEqual(JSON.parse(JSON.stringify(body.to)),[icerik.to]);
 assert.match(body.text,new RegExp(`https://cogniti\\.example/viva/davet/${token}`));
 assert.match(body.text,/Ekip toplantısı/);
 assert.equal(o.bitisler[0].p_sonuc,'gonderildi');assert.equal(o.bitisler[0].p_saglayici_id,'resend-1');
 assert.equal(JSON.stringify(o.bitisler).includes(token),false);
});
test('ağ yanıtı belirsizse aynı gövde ve anahtarla tekrar denenir',async()=>{
 const o=ortam([is(1),is(2)]);let n=0;
 o.ayarla(async()=>{if(n++===0)throw new Error('timeout');return {ok:true,status:200,json:async()=>({id:'resend-2'})};});
 const bir=await o.isle(o.db,'https://cogniti.example',Date.now()+20000,1);
 const iki=await o.isle(o.db,'https://cogniti.example',Date.now()+20000,1);
 assert.equal(bir.hatali,1);assert.equal(iki.gonderilen,1);
 assert.equal(o.cagri[0].init.body,o.cagri[1].init.body);
 assert.deepEqual(JSON.parse(JSON.stringify(o.cagri.map(x=>(x.init.headers as Record<string,string>)['Idempotency-Key']))),[`viva-davet/${id}`,`viva-davet/${id}`]);
 assert.equal(o.bitisler[0].p_sonuc,'hata');assert.equal(o.bitisler[0].p_bekleme_saniye,60);
});
test('sağlayıcı çakışması ve kalıcı ret otomatik tekrar kuyruğuna girmez',async()=>{
 const o=ortam([is()]);
 o.ayarla(async()=>({ok:false,status:409,json:async()=>({name:'invalid_idempotent_request'})}));
 await o.isle(o.db,'https://cogniti.example',Date.now()+20000,1);
 assert.equal(o.bitisler[0].p_sonuc,'kontrol');assert.equal(o.bitisler[0].p_bekleme_saniye,0);
 const p=ortam([is()]);p.ayarla(async()=>({ok:false,status:400,json:async()=>({})}));
 await p.isle(p.db,'https://cogniti.example',Date.now()+20000,1);
 assert.equal(p.bitisler[0].p_sonuc,'hata');assert.equal(p.bitisler[0].p_bekleme_saniye,0);
});
test('hatalı bağlantı özeti gönderimi durdurur',async()=>{
 const o=ortam([{...is(),token_hash:'0'.repeat(64)}]);
 await o.isle(o.db,'https://cogniti.example',Date.now()+20000,1);
 assert.equal(o.cagri.length,0);assert.equal(o.bitisler[0].p_sonuc,'kontrol');
});
