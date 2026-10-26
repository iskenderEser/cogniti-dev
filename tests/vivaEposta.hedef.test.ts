import assert from 'node:assert/strict';
import test from 'node:test';
import { vivaDavetEpostalariDogrula, vivaEpostaGecerliMi, vivaEpostalariAyir } from '@/lib/viva/eposta';

test('Viva e-posta: yaygın adresler, alt alan ve + etiketi kabul edilir',()=>{
 for(const adres of ['ad.soyad@example.com','ad+egitim@example.com','isim@posta.example.com','o\'neil@example.com','A@EXAMPLE.COM']) assert.equal(vivaEpostaGecerliMi(adres),true,adres);
});
test('Viva e-posta: bozuk adres, alan ve uzunluklar reddedilir',()=>{
 for(const adres of ['ad','ad@','@example.com','ad@@example.com','ad @example.com','.ad@example.com','ad..soyad@example.com','ad@-example.com','ad@example-.com','ad@example','ad@example..com',`${'a'.repeat(65)}@example.com`]) assert.equal(vivaEpostaGecerliMi(adres),false,adres);
});
test('Viva e-posta: tamamlanmamış adres korunur; ayırıcı pill üretir',()=>{
 assert.deepEqual(vivaEpostalariAyir('ilk@example.com',[]),{adresler:[],girdi:'ilk@example.com',hatali:false,tekrarVar:false});
 const r=vivaEpostalariAyir('ilk@example.com; ikinci@example.com, ucuncu@example.com\n devam@',[]);
 assert.deepEqual(r.adresler,['ilk@example.com','ikinci@example.com','ucuncu@example.com']);
 assert.equal(r.girdi,' devam@');assert.equal(r.hatali,false);
});
test('Viva e-posta: harf boyutu ve boşluk farkı aynı adresi tekrar eklemez',()=>{
 const mevcut=['ilk@example.com'];
 const r=vivaEpostalariAyir(' ILK@EXAMPLE.COM, ikinci@example.com;ikinci@example.com;',mevcut);
 assert.deepEqual(r.adresler,['ilk@example.com','ikinci@example.com']);assert.equal(r.tekrarVar,true);
 assert.deepEqual(mevcut,['ilk@example.com']);
});
test('Viva e-posta: hatalı adres kaybolmaz; geçerliler ayrı eklenir',()=>{
 const r=vivaEpostalariAyir('hatalı;ok@example.com;eksik@, son@',[]);
 assert.deepEqual(r.adresler,['ok@example.com']);assert.equal(r.girdi,'hatalı, eksik@,  son@');assert.equal(r.hatali,true);
});
test('Viva e-posta: yapıştırma veya blur son geçerli adresi de tamamlar',()=>{
 const r=vivaEpostalariAyir('a@example.com\r\nb@example.com',[],true);
 assert.deepEqual(r.adresler,['a@example.com','b@example.com']);assert.equal(r.girdi,'');
 const bad=vivaEpostalariAyir('a@example.com;bozuk',[],true);
 assert.equal(bad.girdi,'bozuk');assert.equal(bad.hatali,true);
});

test('Viva sunucu e-posta: boşluklar ve harf boyutu normalize edilir, tekrarlar sırası korunarak ayıklanır',()=>{
 const girdi=[' BIR@EXAMPLE.COM ','iki@example.com','bir@example.com',' IKI@example.com '];
 assert.deepEqual(vivaDavetEpostalariDogrula(girdi),{adresler:['bir@example.com','iki@example.com'],hata:null});
 assert.equal(girdi[0],' BIR@EXAMPLE.COM ');
 assert.deepEqual(vivaDavetEpostalariDogrula([]),{adresler:[],hata:null});
 assert.deepEqual(vivaDavetEpostalariDogrula(undefined),{adresler:[],hata:null});
});

test('Viva sunucu e-posta: dizi olmayan HTTP alanı ve string olmayan adres reddedilir',()=>{
 for(const girdi of [null,{},'bir@example.com',42,true,[null],[{}],[42],[false]]){
  const sonuc=vivaDavetEpostalariDogrula(girdi);assert(sonuc.hata);assert.deepEqual(sonuc.adresler,[]);
 }
});

test('Viva sunucu e-posta: tek hatalı adres bütün listeyi durdurur, hatalı adres yanıt metnine yazılmaz',()=>{
 for(const adres of ['', ' ', 'eksik@', 'ad..soyad@example.com','ad@-example.com','ad@example','ad\r\n@example.com','a@example.com,b@example.com',`${'a'.repeat(65)}@example.com`]){
  const sonuc=vivaDavetEpostalariDogrula(['ok@example.com',adres]);assert(sonuc.hata);
  assert.deepEqual(sonuc.adresler,[]);assert.equal(sonuc.hata.includes('ok@example.com'),false);
 }
});
