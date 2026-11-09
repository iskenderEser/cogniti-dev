import assert from 'node:assert/strict';
import test from 'node:test';
import { eczanemGonderimSuresi, eczanemGonderimSuresiHatasi, ECZANEM_GONDERIM_OMRU_MS } from '@/lib/eczanem/gonderimSuresi';
import { eczanemGonderimBaslangiclari } from '@/lib/eczanem/gonderimSuresiSunucu';
const start='2026-01-20T12:30:00+03:00',begin=Date.parse(start),end=begin+30*86400000;
test('30×24 saat: takvim ayı değil; tam sınır kapalı',()=>{
 assert.equal(ECZANEM_GONDERIM_OMRU_MS,2592000000);
 assert.equal(eczanemGonderimSuresi(start,begin).acik,true);
 assert.equal(eczanemGonderimSuresi(start,end-1).acik,true);
 assert.equal(eczanemGonderimSuresi(start,end).acik,false);
 assert.equal(eczanemGonderimSuresi(start,end+1).acik,false);
 assert.equal(new Date(end).toISOString(),'2026-02-19T09:30:00.000Z');
});
test('eksik/bozuk/gelecek başlangıç güvenli kapanır; son dakikada gün yazmaz',()=>{
 for(const s of [null,undefined,'bozuk'])assert.equal(eczanemGonderimSuresi(s,begin).acik,false);
 assert.equal(eczanemGonderimSuresi(start,begin-1).acik,false);
 assert.match(eczanemGonderimSuresi(start,end-1000).metin,/1 dakika/);
 assert.match(eczanemGonderimSuresi(start,begin+24*3600000).metin,/29 gün/);
});
test('veritabanı süre hataları açık mesaj olur',()=>{
 assert.match(eczanemGonderimSuresiHatasi({message:'ECZANEM_GONDERIM:sure_doldu'})!,/30 günlük/);
 assert.match(eczanemGonderimSuresiHatasi({message:'ECZANEM_GONDERIM:sure_dogrulanamadi'})!,/doğrulanamadı/);
 assert.equal(eczanemGonderimSuresiHatasi({message:'other'}),null);
});
test('süre okuma yalnız istenen kimlikleri gruplar, eksik şemada geri düşüş yapmaz',async()=>{
 const calls:{key:string;ids:string[]}[]=[];
 const db={from:(table:string)=>table==='eczanem_medikal_eski_yayinlar'?{select:()=>({in:async()=>({data:[],error:null})})}:({select:()=>({in:(_key:string,ids:string[])=>({in:async(key:string,roles:string[])=>{calls.push({key,ids:roles});return {data:ids.map(yayin_id=>({yayin_id,baslangic_at:start})),error:null};}})})})};
 const ids=Array.from({length:401},(_,i)=>String(i));const x=await eczanemGonderimBaslangiclari(db as never,[...ids,ids[0]]);
 assert.equal(calls.length,3);assert.equal(x.size,401);assert.deepEqual(calls[0],{key:'uretici_rol',ids:['pm','jr_pm','kd_pm','med_md']});
 const errorDb={from:()=>({select:()=>({in:()=>({in:async()=>({error:{code:'42P01'}})})})})};
 await assert.rejects(eczanemGonderimBaslangiclari(errorDb as never,['x']),/SQL kurulumunu/);
});

test('Medikal kaynak açıkça belirtilmedikçe muafiyet yoktur',()=>{
 assert.equal(eczanemGonderimSuresi(start,end+1,true).acik,true);
 assert.equal(eczanemGonderimSuresi(start,end+1).acik,false);
 assert.equal(eczanemGonderimSuresi(null,end+1).acik,false);
});

test('Sunucu yalnız geçmiş Medikal yayına muafiyet verir, yenisine ve PMye vermez',async()=>{
 const db={from:(table:string)=>table==='eczanem_medikal_eski_yayinlar'?{select:()=>({in:async()=>({data:[{yayin_id:'old'}],error:null})})}:{select:()=>({in:()=>({in:async()=>({data:[{yayin_id:'old',baslangic_at:start,uretici_rol:'med_md'},{yayin_id:'new',baslangic_at:start,uretici_rol:'med_md'},{yayin_id:'p',baslangic_at:start,uretici_rol:'pm'}],error:null})})})}};
 const x=await eczanemGonderimBaslangiclari(db as never,['old','new','p']);assert.equal(x.get('old')?.sureMuaf,true);assert.equal(x.get('new')?.sureMuaf,false);assert.equal(x.get('p')?.sureMuaf,false);assert.equal(x.get('missing'),undefined);
});
test('Geçmiş Medikal işareti okunamazsa güvenli hata verir',async()=>{
 const db={from:(table:string)=>({select:()=>({in:()=>{
  if(table==='eczanem_medikal_eski_yayinlar') return Promise.resolve({data:null,error:{code:'42P01'}});
  return {in:async()=>({data:[],error:null})};
 }})})};
 await assert.rejects(eczanemGonderimBaslangiclari(db as never,['old']),/Medikal geçiş SQL/);
});
