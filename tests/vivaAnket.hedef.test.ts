import assert from 'node:assert/strict';
import test from 'node:test';
import type {DailyCall} from '@daily-co/daily-js';
import {vivaAnketBagla,vivaAnketDosyasi,vivaAnketTaslagi,type VivaAnketDurumu} from '@/lib/viva/anket';
const soru={question:'Hangi konu?',options:['Birinci','İkinci']};
function ortam(){
 const insanlar:Record<string,{session_id:string;user_id:string;owner:boolean;local?:boolean;permissions:{canSend:boolean}}>={
 h:{session_id:'h',user_id:'host',owner:true,permissions:{canSend:true}},
 p:{session_id:'p',user_id:'uye',owner:false,permissions:{canSend:true}},
 g:{session_id:'g',user_id:'guest',owner:false,permissions:{canSend:false}},
 };
 const events=new Map<string,Map<string,Function>>(),states:Record<string,VivaAnketDurumu>={},messages:{from:string;data:Record<string,unknown>;to:string}[]=[];
 const bekleyen:(()=>void)[]=[];
 const call=(id:string)=>({participants:()=>Object.fromEntries(Object.entries(insanlar).map(([k,p])=>[k===id?'local':k,{...p,local:k===id}])),
 on:(n:string,f:Function)=>{if(!events.has(id))events.set(id,new Map());events.get(id)!.set(n,f);},off:(n:string)=>events.get(id)?.delete(n),
 sendAppMessage:(data:Record<string,unknown>,to='*')=>{messages.push({from:id,data,to});bekleyen.push(()=>{for(const [k,ev]of events)if(k!==id&&(to==='*'||k===to))ev.get('app-message')?.({fromId:id,data});});}
 } as unknown as DailyCall);
 const flush=()=>{for(let i=0;bekleyen.length&&i<100;i++)bekleyen.shift()!();assert.equal(bekleyen.length,0);};
 const host=vivaAnketBagla(call('h'),'sunucu',d=>states.h=d),uye=vivaAnketBagla(call('p'),'katilimci',d=>states.p=d),misafir=vivaAnketBagla(call('g'),'izleyici',d=>states.g=d);
 return{host,uye,misafir,states,messages,flush,events,call,insanlar,close:()=>{host.temizle();uye.temizle();misafir.temizle();}};
}
test('Daily question/options biçimi yüklenir; bozuk veya tekrarlı seçenekler reddedilir',()=>{
 assert.deepEqual(vivaAnketDosyasi(JSON.stringify([soru])),[soru]);assert.deepEqual(vivaAnketTaslagi(soru),soru);
 for(const options of [[],['Tek'],['A','A'],['A',' ']])assert.throws(()=>vivaAnketTaslagi({...soru,options}));
 assert.throws(()=>vivaAnketDosyasi('bozuk'));assert.throws(()=>vivaAnketDosyasi(JSON.stringify(Array(51).fill(soru))));
});
test('yayıncı açar, üye cevaplar, sonuç yalnız yayıncıda toplanır ve yayıncı kapatır',()=>{
 const a=ortam();try{a.host.ac(soru);a.flush();assert.equal(a.states.p.acik,true);assert.equal(a.states.g.acik,true);
 a.uye.cevapla(1);a.flush();assert.deepEqual(a.states.h.sayilar,[0,1]);assert.equal(a.states.p.secim,1);assert.deepEqual(a.states.g.sayilar,[]);
 a.uye.cevapla(0);a.flush();assert.deepEqual(a.states.h.sayilar,[0,1]);
 a.host.kapat();a.flush();assert.equal(a.states.p.acik,false);assert.equal(a.states.h.acik,false);
 }finally{a.close();}
});
test('sahte yayıncı mesajı, izleyici cevabı ve mükerrer oy sayılmaz',()=>{
 const a=ortam();try{assert.throws(()=>a.uye.ac(soru));a.call('p').sendAppMessage({channel:'viva-poll-v1',type:'poll',...soru,id:crypto.randomUUID(),surum:999,acik:true});a.flush();assert.equal(a.states.h,undefined);assert.equal(a.states.p,undefined);
 a.host.ac(soru);a.flush();const id=a.states.h.soru!.id;
 a.call('g').sendAppMessage({channel:'viva-poll-v1',type:'selected-answer-poll',id,answer:0},'h');a.flush();assert.deepEqual(a.states.h.sayilar,[0,0]);
 a.call('p').sendAppMessage({channel:'viva-poll-v1',type:'selected-answer-poll',id,answer:0},'h');a.flush();
 a.call('p').sendAppMessage({channel:'viva-poll-v1',type:'selected-answer-poll',id,answer:1},'h');a.flush();assert.deepEqual(a.states.h.sayilar,[1,0]);
 }finally{a.close();}
});
test('geç katılan aktif soruyu alır; kapanmış eski mesaj soruyu yeniden açmaz',()=>{
 const a=ortam();try{a.host.ac(soru);a.flush();const onceki=a.messages.find(m=>m.data.type==='poll')!.data;
 a.host.kapat();a.flush();a.call('h').sendAppMessage(onceki);a.flush();assert.equal(a.states.p.acik,false);
 a.host.ac(soru);a.flush();a.events.get('p')!.get('joined-meeting')!();a.flush();assert.equal(a.states.p.acik,true);assert.equal(a.states.p.soru!.id,a.states.h.soru!.id);
 }finally{a.close();}
});
test('oturum kapatılınca anket dinleyicileri ve cevap zamanlayıcısı temizlenir',()=>{
 const a=ortam();a.host.ac(soru);a.flush();a.uye.cevapla(0);a.close();assert.equal(a.events.get('h')!.size,0);assert.equal(a.events.get('p')!.size,0);assert.equal(a.events.get('g')!.size,0);a.flush();
});
