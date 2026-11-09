import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
export async function testGeriAl({db,id,version}){
 const tests=[];const check=async(n,f)=>{await f();tests.push(n);console.log(`GERI AL ${tests.length}: ${n}`);};
 const sql=readFileSync('scripts/sql/eclub_utt_hesap_secimi_geri_al.sql','utf8');
 const snapshot=async()=>(await db.query(`SELECT jsonb_build_object(
  'yuklemeler',(SELECT jsonb_agg(to_jsonb(t) ORDER BY yukleme_id) FROM cogniti_esnek_paket_yuklemeleri t),
  'tuketimler',(SELECT jsonb_agg(to_jsonb(t) ORDER BY tuketim_id) FROM cogniti_esnek_gonderim_tuketimleri t),
  'istekler',(SELECT jsonb_agg(to_jsonb(t) ORDER BY gonderen_id,anahtar) FROM cogniti_esnek_gonderim_istekleri t),
  'yayinlar',(SELECT count(*) FROM yayin_yonetimi),
  'oneriler',(SELECT count(*) FROM eclub_oneri_kayitlari)) r`)).rows[0].r;
 const before=await snapshot();
 await check('Geri alma iki kez kurulur; yanlış RPC bulunmaz',async()=>{await db.query(sql);await db.query(sql);assert.equal((await db.query("SELECT to_regprocedure('public.cogniti_esnek_eclub_gonder(uuid,text,uuid[],uuid[],uuid)') x")).rows[0].x,null);});
 await check('Yanlış UTT hesap bağlamı tetikleyiciden tamamen kalkar; eski tek tetikleyici korunur',async()=>{
  const f=(await db.query("SELECT pg_get_functiondef('public.cogniti_token_eclub_oneri_kaydet()'::regprocedure) f")).rows[0].f;
  assert.doesNotMatch(f,/cogniti\.esnek_|cogniti_esnek_gonderim_tuket/);assert.match(f,/cogniti_token_tuket/);
  assert.equal((await db.query("SELECT count(*)::int n FROM pg_trigger WHERE tgrelid='public.eclub_oneri_kayitlari'::regclass AND tgname='trg_cogniti_token_eclub_oneri' AND tgenabled='O' AND NOT tgisinternal")).rows[0].n,1);
 });
 await check('Sipariş/yükleme/tüketim geçmişi ve yayınlar değişmez',async()=>{assert.deepEqual(await snapshot(),before);assert.notEqual((await db.query("SELECT to_regprocedure('public.cogniti_token_yayin_acilis_kaydet()') x")).rows[0].x,null);});
 await check('Service_role yanlış RPCden artık gönderim başlatamaz',async()=>{await db.query('SET ROLE service_role');try{await assert.rejects(db.query('SELECT cogniti_esnek_eclub_gonder($1,$2,$3,$4,$5)',[id(300),'firma_ortak',[id(500)],[id(800)],id(9000)]),e=>e.code==='42883');}finally{await db.query('RESET ROLE');}assert.deepEqual(await snapshot(),before);});
 writeFileSync('docs/ECLUB_UTT_HESAP_SECIMI_GERI_AL_TEST_SONUCLARI.json',JSON.stringify({postgres:version,passed:tests.length,tests,scope:'Yerel Unix socket ve sahte temel tablolar. Gerçek Adım 4 kurulumunun ardından değiştirilmemiş geri alma SQLi iki kez çalıştırıldı. Supabase/gerçek kullanıcı testi değildir.'},null,2)+'\n');
}
