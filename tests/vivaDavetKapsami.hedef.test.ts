import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as crypto from 'node:crypto';
import ts from 'typescript';
import * as roller from '@/lib/utils/roller';
import * as sozlesme from '@/lib/viva/sozlesme';
import * as eposta from '@/lib/viva/eposta';

const userId='00000000-0000-4000-8000-000000000001';
function ortam(rol='utt',hata:unknown=null) {
 const calls:{name:string;args:Record<string,unknown>}[]=[];
 const data={olusturabilir:true,eclub_davet_edebilir:true,davet_kurali_surumu:1,kapsam:'Firma',kisiler:[]};
 const modules:Record<string,unknown>={
  'node:crypto':crypto,'next/server':{NextResponse:{}},'@/lib/utils/roller':roller,'./sozlesme':sozlesme,'./eposta':eposta,
  '@/lib/utils/rolCozucu':{rolCozucu:async()=>rol},
  '@/lib/supabase/server':{
   createClient:async()=>({auth:{getUser:async()=>({data:{user:{id:userId}},error:null})}}),
   createAdminClient:()=>({rpc:async(name:string,args:Record<string,unknown>)=>{calls.push({name,args});return{data,error:hata};}}),
  },
 };
 const exports:Record<string,unknown>={};
 const code=ts.transpileModule(readFileSync('lib/viva/sunucu.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,{exports,require:(name:string)=>{assert(name in modules,name);return modules[name];},process,console,Buffer});
 return{api:exports as typeof import('@/lib/viva/sunucu'),calls,data};
}
test('davet kapsamı: her iç rol yeni bağlam RPC’sini doğrulanmış kullanıcı kimliğiyle okur',async()=>{
 for(const rol of roller.TUM_ROLLER){
  const o=ortam(rol);assert.equal(await o.api.vivaOku('baglam',{}),o.data);
  assert.equal(o.calls[0].name,'viva_davet_baglami');
  assert.equal(o.calls[0].args.p_auth,userId);assert.equal(o.calls.length,1);
 }
});
test('davet kapsamı: SQL kurulmamış veya erişim reddedilmişse eski kapsama dönülmez',async()=>{
 for(const code of ['PGRST202','42501']){
  const error={code};const o=ortam('bm',error);
  await assert.rejects(o.api.vivaOku('baglam',{}),(e:unknown)=>e===error);
  assert.equal(o.calls.length,1);assert.equal(o.calls[0].name,'viva_davet_baglami');
 }
});
test('davet kapsamı: ayrıntı e-posta metadatasını okur; eski kayıt sözleşmesi korunur',async()=>{
 const o=ortam('bm');
 await o.api.vivaOku('detay',{etkinlik_id:userId});
 const created={etkinlik_id:userId,yayin_turu:'anlik',baslik:'Toplantı',aciklama:'',sure_dakika:60,durum:'planlandi',katilimcilar:[]};
 await o.api.vivaYaz('olustur',created);
 assert.deepEqual(o.calls.map(c=>[c.name,c.args.p_islem]),[['viva_eposta_detay',undefined],['viva_islem','olustur']]);
 assert.equal(o.calls[0].args.p_id,userId);
 assert(o.calls.every(c=>c.args.p_auth===userId));
 const db=readFileSync('scripts/sql/viva_davet_kapsami.sql','utf8');
 assert.doesNotMatch(db,/CREATE OR REPLACE FUNCTION public\.viva_islem/);
});
