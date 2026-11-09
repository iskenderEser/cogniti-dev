const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
const {Window}=require('happy-dom');const win=new Window({url:'http://localhost/eczanem'});
for(const k of ['window','document','navigator'])Object.defineProperty(globalThis,k,{configurable:true,value:win[k]});globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const React=require('react'),{createRoot}=require('react-dom/client');
const compile=(path,deps,extra={})=>{const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText,{exports,...extra,require:n=>n in deps?deps[n]:assert.fail(n)});return exports;};
const rules=compile('lib/eczanem/gonderimSuresi.ts',{}, {Date});
const clock=compile('components/eczanem/GonderimSuresi.tsx',{'react':React,'react/jsx-runtime':require('react/jsx-runtime'),'@/lib/eczanem/gonderimSuresi':rules},{window,document,Date});
const deps={'react':React,'react/jsx-runtime':require('react/jsx-runtime'),'@/lib/eczanem/gonderimSuresi':rules,'@/components/eczanem/GonderimSuresi':clock,'@/lib/utils/yayinKodu':{yayin_kodu:()=>''},'@/components/yayin/YayinKarti':{YayinKarti:p=>React.createElement('div',null,p.tarihSatiriSagAksiyon,p.altEkIcerik)}};
const Cards=[compile('app/(panel)/eczanem/yayinlar/_components/EczanemYayinGonderimKarti.tsx',deps).EczanemYayinGonderimKarti,compile('app/(panel)/eczanem/eczane/uye-yayinlari/_components/EczaneDanisanYayinKarti.tsx',deps).EczaneDanisanYayinKarti];
(async()=>{
 const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
 const begin=Date.parse('2026-11-01T12:00:00+03:00'),end=begin+30*86400000;
 const base={yayin:{yayin_id:'test',urun_adi:'Yayın',arac_turu:'video',gonderim_baslangic_at:new Date(begin).toISOString(),gonderim_incelemesi_tamamlandi:true},ozet:{aktif_uye_sayisi:10,gonderilebilir_uye_sayisi:10,gonderilen_uye_sayisi:0},esik:10,eczaneler:[],gonderimler:[],secili:false,secilebilir:true,gonderilecekGoster:true,gonderimDetayiGoster:false,gonderimDetayiAcik:false,gonderilenDanisanlar:[],onSecim:()=>{},onOnizle:()=>{},onGonderimDetayiAc:()=>{},onGonderimDetayiKapat:()=>{}};
 for(const Card of Cards){
  await React.act(async()=>root.render(React.createElement(Card,{...base,simdi:end-60000})));
  assert.ok(host.textContent.includes('Gönderim için kalan: 1 dakika'));assert.equal(host.querySelector('input').disabled,false);assert.ok(host.querySelector('time').dateTime);
  await React.act(async()=>root.render(React.createElement(Card,{...base,simdi:end})));
  assert.ok(host.textContent.includes('Gönderim süresi doldu'));assert.equal(host.querySelector('input').disabled,true);
  await React.act(async()=>root.render(React.createElement(Card,{...base,yayin:{...base.yayin,gonderim_sure_muaf:true},simdi:end+86400000})));
  assert.equal(host.querySelector('input').disabled,false);assert.equal(host.querySelector('time'),null);
  assert.ok(!host.textContent.includes('Gönderim süresi doldu'));
  assert.ok(!host.textContent.includes('Token'));assert.ok(!host.textContent.includes('Bakiye'));
 }
 await React.act(async()=>root.unmount());await win.happyDOM.close();console.log('Başarılı: iki gerçek kartta kalan süre, tam sınırda seçim kilidi ve eczane ekranında token bilgisi olmaması. Geometri doğrulanmadı.');
})().catch(e=>{console.error(e);process.exitCode=1;});
