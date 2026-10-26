import assert from 'node:assert/strict';
import test from 'node:test';
import {vivaIndirmeAcik} from '@/lib/viva/indirme';
import {vivaDailyDosyaLinki} from '@/lib/viva/dosyaLinki';
const simdi=Date.parse('2026-10-25T10:00:00Z'),son=simdi+7*86400000;
test('7 günlük sınırın öncesi açık, sınır ve sonrası kapalıdır',()=>{
 const b={indirme_bitis:new Date(son).toISOString()};
 assert.equal(vivaIndirmeAcik(b,son-1),true);assert.equal(vivaIndirmeAcik(b,son),false);assert.equal(vivaIndirmeAcik(b,son+1),false);
 assert.equal(vivaIndirmeAcik({indirme_bitis:null},simdi),true);assert.equal(vivaIndirmeAcik({indirme_bitis:'bozuk'},simdi),false);
 assert.equal(vivaIndirmeAcik({suresi_doldu:true},simdi),false);
});
test('video ve etiketli sohbet bağlantısı sağlayıcı yanıtından aynen alınır',()=>{
 // Sentetik yanıt: gerçek Daily sohbet yanıtı yerine geçmez.
 const bitis=Math.floor(simdi/1000)+900,url='https://b.daily.co/video?Signature=a%2Fb&Expires=1',sohbet='https://b.daily.co/chat.vtt?Signature=c%2Fd&Expires=1';
 const d={download_link:url,expires:bitis,outputs:[{type:'chat-webvtt',download_link:sohbet}]};
 assert.deepEqual(vivaDailyDosyaLinki(d,'video',simdi),{url,bitis});assert.deepEqual(vivaDailyDosyaLinki(d,'sohbet',simdi),{url:sohbet,bitis});
 assert.equal(vivaDailyDosyaLinki({download_link:url,expires:bitis},'sohbet',simdi),null);
 for(const u of ['https://evil.test/chat.vtt','http://b.daily.co/chat.vtt','https://user:pass@b.daily.co/chat.vtt'])assert.equal(vivaDailyDosyaLinki({expires:bitis,outputs:[{type:'chat-webvtt',download_link:u}]},'sohbet',simdi),null);
 assert.equal(vivaDailyDosyaLinki({...d,expires:Math.floor(simdi/1000)},'sohbet',simdi),null);
});
