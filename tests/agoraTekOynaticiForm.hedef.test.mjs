import { createRequire } from 'node:module';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const repo=new URL('../',import.meta.url).pathname.replace(/\/$/,'');
const require=createRequire(repo+'/package.json');
const {Window}=require('happy-dom');
const win=new Window({url:'http://localhost/partner/egitimler'});
for(const k of ['window','document','navigator','HTMLElement','HTMLInputElement','HTMLTextAreaElement','HTMLSelectElement','Event','MouseEvent','Node'])Object.defineProperty(globalThis,k,{value:k==='window'?win:k==='document'?win.document:win[k],configurable:true});
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const React=require('react'),{act}=React,{createRoot}=require('react-dom/client'),ts=require('typescript');
const cache=new Map();
function load(file){
 if(cache.has(file))return cache.get(file).exports;
 const mod={exports:{}};cache.set(file,mod);
 const localRequire=id=>{
  if(id==='@/components/SoruIceAktar')return {SoruIceAktar:()=>null};
  if(id==='@/components/SoruSetiFormu')return {SoruSetiFormu:()=>null};
  if(id==='@/app/(panel)/talepler/_components/SoruSetiAyarlari')return {SoruSetiAyarlari:()=>null};
  if(id==='@/components/ui/button')return {Button:({children,variant,...props})=>React.createElement('button',props,children)};
  if(id.endsWith('.css'))return {__esModule:true,default:new Proxy({},{get:(_,key)=>String(key)})};
  if(!id.startsWith('@/')&&!id.startsWith('.'))return require(id);
  const base=id.startsWith('@/')?path.join(repo,id.slice(2)):path.resolve(path.dirname(file),id);
  const full=[base,base+'.ts',base+'.tsx',base+'/index.ts'].find(p=>existsSync(p)&&!require('node:fs').statSync(p).isDirectory());
  if(!full)throw new Error('Missing '+id);
  return load(full);
 };
 const js=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 vm.runInThisContext('(function(require,module,exports){'+js.replaceAll('import.meta.url',JSON.stringify('file://'+file))+'\n})',{filename:file})(localRequire,mod,mod.exports);
 return mod.exports;
}


const Form=load(repo+'/app/partner/egitimler/PartnerEgitimFormu.tsx').default;
const container=document.createElement('div');document.body.append(container);const root=createRoot(container);
win.HTMLMediaElement.prototype.play=function(){return Promise.resolve();};win.HTMLMediaElement.prototype.pause=function(){};
const results=[];const check=(name,c)=>{assert.ok(c,name);results.push(name);};
const settle=async(fn=()=>{})=>{await act(async()=>{await fn();await new Promise(r=>setTimeout(r,5));});};
const id='10000000-0000-4000-8000-000000000001';let durum='taslak',reads=[];
globalThis.fetch=async(url)=>{
 reads.push(url);
 if(url.includes('/api/egitimler?'))return Response.json({egitim_id:id,egitim_adi:'Podcast Test',surum:1,durum,bilgiler:{yayin_araci:'podcast'}});
 if(url.includes('/medya/video'))return Response.json({videolar:[]});
 if(url.includes('/medya/podcast'))return Response.json({podcast:{yukleme_id:id,durum:'hazir',dosya_adi:'podcast-test.mp3',dinleme_url:'https://original.test.invalid/file.mp3'}});
 return Response.json({tur:'podcast',url:'/partner/api/koruma/'+id+'?akis=1',korumaSurumu:durum==='taslak'?0:1});
};
const render=async()=>{await settle(()=>root.render(React.createElement(Form,{key:durum,egitim:{egitim_id:id,egitim_adi:'Podcast Test',durum,surum:1},istekId:id,onKapat:()=>{},onKaydedildi:async()=>{},onIslem:()=>{}})));await settle();await settle();};
try {
 await render();
 check('Taslak formunda yalnız bir yayın oynatıcısı vardır',container.querySelectorAll('[data-agora-oynatici]').length===1);
 check('Ek koruma testi düğmesi ve paralel orijinal oynatıcı yoktur',!container.textContent.includes('Korumasını Test Et')&&!container.querySelector('audio[src^="https://original.test.invalid"]'));
 check('Taslak tek içerik akışını açar; filigran sesi yoktur',container.querySelectorAll('audio').length===1);
 const dinle=()=>[...container.querySelectorAll('button')].find(b=>b.textContent==='Dinle');
 check('Taslak Dinle düzenleme fieldsetinden bağımsız çalışır',!!dinle()&&!dinle().closest('fieldset[disabled]'));
 durum='yayinda';await render();
 check('Yayımlama sonrası aynı formda tek oynatıcı kalır',container.querySelectorAll('[data-agora-oynatici]').length===1);
 check('Yayımlanan tek içerik akışına Kogniti uyarısı bağlanır',container.querySelectorAll('audio[src*="?akis=1"]').length===1&&!!container.querySelector('audio[src="/agora/kogniti-deneme-yayini.wav"]'));
 check('Yayımlanan formun düzenleme alanları kilitli olsa da Dinle kilitlenmez',!!container.querySelector('fieldset[disabled]')&&!!dinle()&&!dinle().closest('fieldset[disabled]'));
 check('İki durumda da mevcut eğitim kimliğiyle aynı kaynak API kullanılır',reads.filter(u=>u.includes('/api/koruma/')).every(u=>u.includes(id)));
 console.log(JSON.stringify({passed:results.length,tests:results}));
} finally {await settle(()=>root.unmount());win.happyDOM.abort();}
