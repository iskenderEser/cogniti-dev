import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { TUM_ROLLER, TUKETICI_ROLLER, ECLUB_TUKETICI_ROLLERI, MUSTERI_ROLU } from '@/lib/utils/roller';
import { fiyatlariGorebilir } from '@/lib/fiyat/erisim';

function yukle(path:string, deps:Record<string,unknown>) {
 const exports:Record<string,any>={};
 const code=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,{exports,AbortSignal,require:(n:string)=>{assert.ok(n in deps,n);return deps[n];}});
 return exports;
}
const sonuc=(tip:string)=>()=>{throw new Error(tip)};
const jsx={jsx:(_type:unknown,props:unknown)=>({props})};
test('yetkiler: tüm geçerli iç roller; UTT/KD_UTT, BM ve İU hariç',()=>{
 for(const rol of TUM_ROLLER) assert.equal(fiyatlariGorebilir(rol), !TUKETICI_ROLLER.includes(rol)&&rol!=='bm'&&rol!=='iu',rol);
 for(const rol of [...ECLUB_TUKETICI_ROLLERI,MUSTERI_ROLU,'partner','', 'bilinmeyen']) assert.equal(fiyatlariGorebilir(rol),false,rol);
});
test('iç fiyat sayfası sunucuda oturum ve rol kontrolü yapar',async()=>{
 let user:unknown=null,rol='';
 const p=yukle('app/fiyatlar/page.tsx',{
  'react/jsx-runtime':jsx,'next/navigation':{redirect:sonuc('giris'),notFound:sonuc('yasak')},
  '@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user}})}}),createAdminClient:()=>({})},
  '@/lib/utils/rolCozucu':{rolCozucu:async()=>rol},'@/lib/fiyat/erisim':{fiyatlariGorebilir},'@/app/_components/UyeFiyatlar':{default:()=>null},
 });
 await assert.rejects(p.default(),/giris/);
 user={id:'test'};
 for(rol of ['utt','kd_utt','bm','iu','eczaci','ikinci_eczaci','yardimci_eczaci','eczane_teknisyeni','musteri',''])await assert.rejects(p.default(),/yasak/);
 for(rol of ['admin','firma_admin','tm','pm','gm']) assert.equal((await p.default()).props.rol,rol);
});
test('partner fiyat ve planlama sayfaları doğrudan erişime kapalıdır',()=>{
 for(const yol of ['fiyatlar','planlama-araci']) {
  const p=yukle(`app/partner/${yol}/page.tsx`,{'next/navigation':{notFound:sonuc('yasak')}});
  assert.throws(()=>p.default(),/yasak/);
 }
});
test('partner fiyat API erişimi kapalıdır',async()=>{
 const p=yukle('app/partner/api/fiyatlar/route.ts',{'@/lib/agora/partnerHttp':{partnerYanit:(body:unknown,status:number)=>({body,status})}});
 assert.equal((await p.GET()).status,403);
});
