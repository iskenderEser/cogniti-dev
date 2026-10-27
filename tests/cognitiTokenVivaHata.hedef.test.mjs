import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as crypto from 'node:crypto';
const src=readFileSync(new URL('../lib/viva/sunucu.ts',import.meta.url),'utf8');
const code=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const exports={};
vm.runInNewContext(code,{exports,console:{error(){}},require:name=>{
 if(name==='node:crypto')return crypto;
 if(name==='next/server')return {NextResponse:{json:Response.json.bind(Response)}};
 if(name.startsWith('@/')||name.startsWith('./'))return {};
 throw new Error(name);
}});
for(const [reason,expected] of [['bakiye_yetersiz',/bakiyesi.*yetersiz/],['hesap_yok',/hesabı.*açılmamış/],['viva_firma_yok',/gönderici firma/],['viva_kimlik_belirsiz',/birden fazla davetli/]]){
 test(`Viva token hatası ${reason} anlaşılır olarak iletilir`,async()=>{
  const res=exports.vivaHata({code:'P0001',message:`COGNITI_TOKEN:${reason}`});
  assert.equal(res.status,422);assert.match((await res.json()).hata,expected);
 });
}
test('Bilinmeyen veritabanı hatasının teknik içeriği kullanıcıya gösterilmez',async()=>{
 const res=exports.vivaHata({code:'P0001',message:'gizli teknik ayrıntı'});
 assert.equal(res.status,503);assert.doesNotMatch((await res.json()).hata,/gizli/);
});
