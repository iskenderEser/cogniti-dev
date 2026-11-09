import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {Window} from 'happy-dom';
const source=JSON.parse(fs.readFileSync('tests/fixtures/esnekPaket20261109.json','utf8'));
const tariff={surum:1,sm2:source.map(h=>({...h,katsayi:h.birim_fiyat/9.9})),paketler:[
 {ad:'Paket 1',token:5000,birim:5.9,aylik:29500},{ad:'Paket 2',token:10000,birim:4.85,aylik:48500},
 {ad:'Paket 3',token:15000,birim:3.9,aylik:58500},{ad:'Paket 4',token:25000,birim:2.9,aylik:72500}],kko:{limit:1500,birim:9.9}};
function load(file,mocks={}){const result={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:result,AbortSignal,require:n=>mocks[n]??load('lib/fiyat/'+n.replace('./','')+'.ts',mocks)});return result;}
const {planlamaTarifesiGecerli}=load('lib/fiyat/planlama.ts');
function form(){
 const html=JSON.parse(fs.readFileSync('app/planlama-araci/icerik.json','utf8')),w=new Window();
 w.document.write(html.replace(/<script>[\s\S]*?<\/script>/g,''));
 const parent={postMessage(){}},handlers={};
 vm.runInNewContext([...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1],{document:w.document,Intl,window:{parent,addEventListener:(type,fn)=>{handlers[type]=fn;}}});
 const message=data=>handlers.message({source:parent,data});
 message({type:'cogniti-planlama-yukle',draft:null});
 const el=id=>w.document.getElementById(id);
 const set=(id,value)=>{el(id).value=String(value);el(id).dispatchEvent(new w.Event('input',{bubbles:true}));};
 for(const k of ['c','e','m']){el('on-'+k).checked=false;el('on-'+k).dispatchEvent(new w.Event('change',{bubbles:true}));}
 set('tAudience',1);set('tRecommendationAudience',0);set('tRecommendations',0);
 return {el,set,message,toggle:(key,value)=>{el('on-'+key).checked=value;el('on-'+key).dispatchEvent(new w.Event('change',{bubbles:true}));},close:()=>w.happyDOM.close()};
}
test('Planlama merkezi fiyatları kullanır: KKÖ sınırı, dört abonelik, Esnek kademeler ve güncelleme',async()=>{
 const f=form();try{
 assert.equal(planlamaTarifesiGecerli(tariff),true);
 for(const bad of [{...tariff,sm2:tariff.sm2.slice(1)},{...tariff,paketler:tariff.paketler.slice(1)},{...tariff,kko:{limit:1500,birim:0}}])assert.equal(planlamaTarifesiGecerli(bad),false);
 f.set('tPublications',6500);
 assert.equal(f.el('recommendedPackage').textContent,'');assert.match(f.el('recommendedTerms').textContent,/yükleniyor/);
 f.message({type:'cogniti-planlama-tarife',tarife:tariff});
 assert.equal(f.el('recommendedPackage').textContent,'44.915,00 TL');assert.equal(f.el('recommendedTerms').textContent,'6,91 TL / token');
 assert.equal(f.el('summaryTcost').textContent,'44.915,00 TL');
 for(const [need,quantity,cost,subscriptionQuantity,subscriptionCost] of [[1500,2500,'21.250,00 TL',5000,'29.500,00 TL'],[1501,2500,'21.250,00 TL',5000,'29.500,00 TL'],[5000,5000,'36.700,00 TL',5000,'29.500,00 TL'],[10000,10000,'61.900,00 TL',10000,'48.500,00 TL'],[15000,15000,'82.650,00 TL',15000,'58.500,00 TL'],[25000,25000,'116.500,00 TL',25000,'72.500,00 TL'],[50000,50000,'175.000,00 TL',null,null]]){
  f.set('tPublications',need);assert.equal(f.el('recommendedPackage').textContent,cost);assert.equal(f.el('recommendedTokens').textContent,quantity.toLocaleString('tr-TR'));
  if(subscriptionQuantity){assert.equal(f.el('subscriptionTokens').textContent,subscriptionQuantity.toLocaleString('tr-TR'));assert.equal(f.el('subscriptionPackage').textContent,subscriptionCost);}
  else{assert.equal(f.el('subscriptionTokens').textContent,'—');assert.match(f.el('subscriptionTerms').textContent,/paket bulunmuyor/);}
 }
 f.set('tPublications',6260);assert.equal(f.el('recommendedTokens').textContent,'6.500');assert.equal(f.el('subscriptionTokens').textContent,'10.000');assert.equal(f.el('subscriptionPackage').textContent,'48.500,00 TL');
 f.set('tPublications',50001);assert.equal(f.el('recommendedPackage').textContent,'');assert.match(f.el('recommendedTerms').textContent,/paket bulunmuyor/);
 const onlyFlex={...tariff,paketler:tariff.paketler.map(p=>({...p,aylik:99999999}))};
 f.message({type:'cogniti-planlama-tarife',tarife:onlyFlex});
 for(const row of source){f.set('tPublications',row.token_adedi);assert.equal(f.el('recommendedTokens').textContent,row.token_adedi.toLocaleString('tr-TR'));assert.equal(f.el('recommendedPackage').textContent,(row.token_adedi*row.birim_fiyat).toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2})+' TL');}
 const changed=structuredClone(tariff);changed.surum=2;changed.paketler[1].birim=4.7;changed.paketler[1].aylik=47000;changed.kko.birim=8.8;
 f.message({type:'cogniti-planlama-tarife',tarife:changed});f.set('tPublications',10000);assert.equal(f.el('subscriptionPackage').textContent,'47.000,00 TL');assert.equal(f.el('recommendedPackage').textContent,'61.900,00 TL');
 f.set('tPublications',100);assert.equal(f.el('summaryTcost').textContent,'850,00 TL');
 f.message({type:'cogniti-planlama-tarife',tarife:null,hata:'Güncel fiyatlar okunamadı.'});assert.equal(f.el('recommendedPackage').textContent,'');assert.match(f.el('recommendedTerms').textContent,/okunamadı/);assert.equal(f.el('summaryTcost').textContent,'—');
 }finally{await f.close();}
});
test('İki modül tablosu aynı tokenları kendi paket birim fiyatıyla gösterir',async()=>{
 const f=form();try{
 f.message({type:'cogniti-planlama-tarife',tarife:tariff});
 for(const [id,value] of Object.entries({tAudience:20,tPublications:12,cAudience:10,cPublications:2,cChallenges:0,ePharmacies:2000,eEmployees:4,eMembership:20,eSends:3,mTransition:10,mRecipients:10,mSends:3}))f.set(id,value);
 for(const key of ['c','e','m'])f.toggle(key,true);
 assert.equal(f.el('monthlyTokens').textContent,'6.260');
 for(const [key,tokens,flex,sub] of [['T','240','1.658,40 TL','1.164,00 TL'],['C','20','138,20 TL','97,00 TL'],['E','4.800','33.168,00 TL','23.280,00 TL'],['M','1.200','8.292,00 TL','5.820,00 TL']]){
  assert.equal(f.el('summary'+key+'tokens').textContent,tokens);assert.equal(f.el('subscriptionSummary'+key+'tokens').textContent,tokens);
  assert.equal(f.el('summary'+key+'cost').textContent,flex);assert.equal(f.el('subscriptionSummary'+key+'cost').textContent,sub);
 }
 assert.equal(f.el('flexibleConsumptionTotal').textContent,'43.256,60 TL');assert.equal(f.el('subscriptionConsumptionTotal').textContent,'30.361,00 TL');
 f.toggle('e',false);assert.equal(f.el('summaryEtokens').textContent,'0');assert.equal(f.el('subscriptionSummaryEtokens').textContent,'0');assert.equal(f.el('subscriptionSummaryEcost').textContent,'0,00 TL');assert.equal(f.el('flexibleConsumptionTotal').textContent,'12.410,00 TL');assert.equal(f.el('subscriptionConsumptionTotal').textContent,'8.614,00 TL');
 f.message({type:'cogniti-planlama-tarife',tarife:null,hata:'Fiyat okunamadı'});assert.equal(f.el('summaryTcost').textContent,'—');assert.equal(f.el('subscriptionSummaryTcost').textContent,'—');assert.equal(f.el('flexibleConsumptionTotal').textContent,'—');assert.equal(f.el('subscriptionConsumptionTotal').textContent,'—');
 }finally{await f.close();}
});
test('Fiyat API yardımcısı yalnız yetkili RPC kullanır; eksik KKÖ veya eski listeyi reddeder',async()=>{
 let data=tariff,error=null;
 const db={rpc:async()=>({data,error})};
 const {sm2FiyatYaniti}=load('lib/fiyat/sm2Sunucu.ts',{'@/lib/supabase/server':{createAdminClient:()=>db},'@/lib/agora/partnerHttp':{partnerYanit:(data,status=200)=>({data,status})}});
 let result=await sm2FiyatYaniti();assert.equal(result.status,200);assert.deepEqual(JSON.parse(JSON.stringify(result.data.kko)),{limit:1500,birim:9.9});assert.equal(result.data.degerler,undefined);
 data={...tariff,kko:undefined};assert.equal((await sm2FiyatYaniti()).status,503);
 data={...tariff,sm2:tariff.sm2.slice(1)};assert.equal((await sm2FiyatYaniti()).status,503);
 data=tariff;error={code:'test'};assert.equal((await sm2FiyatYaniti()).status,503);
});
