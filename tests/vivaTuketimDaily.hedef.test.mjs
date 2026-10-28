import { test } from 'node:test';
import assert from 'node:assert/strict';
import { vivaDailyKullanimi } from '../lib/viva/tuketimDaily.mjs';
const oda = 'viva-00000000000040008000000000000001-n1';
const uid = n => `00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;

test('birden fazla oturum ve sayfada katılım sürelerini toplar', async () => {
 const requests=[];
 const oku=async path => { requests.push(path); const u=new URL(path,'https://example.invalid');
  if(u.pathname==='/meetings') return {data:u.searchParams.has('starting_after')?[]:[{id:uid(1),room:oda,ongoing:false},{id:uid(2),room:oda,ongoing:false}]};
  if(u.pathname.includes(uid(1))) return {data:u.searchParams.has('joined_after')?[]:[{participant_id:uid(10),duration:150},{participant_id:uid(11),duration:165}]};
  return {data:[{participant_id:uid(12),duration:300}]};
 };
 assert.deepEqual(await vivaDailyKullanimi({oda,oku,sayfaBoyutu:2}),{toplam_saniye:615,oturum_sayisi:2,katilim_sayisi:3,oturum_idleri:[uid(1),uid(2)],katilimlar:[{id:uid(10),saniye:150},{id:uid(11),saniye:165},{id:uid(12),saniye:300}]});
 assert.equal(requests.length,5);
});

test('devam eden oturum, tekrar kayıt ve geçersiz süre sonuç üretmez', async()=>{
 await assert.rejects(vivaDailyKullanimi({oda,oku:async()=>({data:[{id:uid(1),room:oda,ongoing:true}]})}),/DEVAM/);
 for(const rows of [[{participant_id:uid(3),duration:-1}],[{participant_id:uid(3),duration:1},{participant_id:uid(3),duration:1}]]){
  await assert.rejects(vivaDailyKullanimi({oda,oku:async path=>path.startsWith('meetings?')?{data:[{id:uid(1),room:oda,ongoing:false}]}:{data:rows}}),/GECERSIZ/);
 }
});

 test('bir kişinin aynı bağlantısı farklı Daily oturumlarında göründüğünde iki süreyi birleştirir',async()=>{
 const r=await vivaDailyKullanimi({oda,oku:async path=>path.startsWith('meetings?')?{data:[{id:uid(1),room:oda,ongoing:false},{id:uid(2),room:oda,ongoing:false}]}:{data:[{participant_id:uid(3),duration:600}]}});
 assert.deepEqual(r,{toplam_saniye:1200,oturum_sayisi:2,katilim_sayisi:2,oturum_idleri:[uid(1),uid(2)],katilimlar:[{id:uid(3),saniye:1200}]});
});
