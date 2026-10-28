import assert from "node:assert/strict";
import test from "node:test";
import { vivaTuketimIsle, vivaDailyTuketimOku } from "@/lib/viva/tuketimSunucu";
const oda="viva-00000000000040008000000000000001-n1";
const kullanim={toplam_saniye:36000,oturum_sayisi:1,katilim_sayisi:10,oturum_idleri:[],katilimlar:[]};
process.env.DAILY_DOMAIN="cogniti-viva.daily.co";
process.env.DAILY_API_KEY="test-only";
test("işleyici ortak fiyatları kullanır ve Daily verisini tek kaydetme çağrısına taşır",async()=>{
 const calls:{islem:string;veri?:Record<string,unknown>}[]=[];let first=true;
 const rpc=async(islem:string,veri?:Record<string,unknown>)=>{calls.push({islem,veri});if(islem==="ayir"){if(!first)return null;first=false;return {etkinlik_id:"e",kira:"k",oda_adi:oda,domain:process.env.DAILY_DOMAIN};}return{tamam:true};};
 assert.deepEqual(await vivaTuketimIsle(rpc,async()=>kullanim,Date.now()+1000),{islenen:1,bekleyen:0,hatali:0});
 assert.equal(calls[0].veri?.kko_fiyat,9.9);assert.equal(calls[0].veri?.kur,55);assert.equal(calls[0].veri?.katsayi,1.5);
 assert.equal(calls[1].veri?.toplam_saniye,36000);assert.match(String(calls[1].veri?.ozet),/^[a-f0-9]{64}$/);
});
test("Daily hatası işi yeniden denemeye bırakır; sıfır maliyet diye kaydetmez",async()=>{
 const calls:string[]=[];let first=true;const rpc=async(i:string)=>{calls.push(i);if(i==="ayir"){if(!first)return null;first=false;return{etkinlik_id:"e",kira:"k",oda_adi:oda,domain:process.env.DAILY_DOMAIN};}return{};};
 const r=await vivaTuketimIsle(rpc,async()=>{throw Error("test");},Date.now()+1000);assert.equal(r.hatali,1);assert.deepEqual(calls,["ayir","hata","ayir"]);
});
test("eksik mutabakat bekleyen kalır; başka domain sağlayıcıya ulaşmaz",async()=>{
 for(const domain of [process.env.DAILY_DOMAIN,"other.daily.co"]){let first=true,okuma=0;const rpc=async(i:string)=>{if(i==="ayir"){if(!first)return null;first=false;return{etkinlik_id:"e",kira:"k",oda_adi:oda,domain};}return{tamam:false};};
 const r=await vivaTuketimIsle(rpc,async()=>{okuma++;return kullanim;},Date.now()+1000);assert.equal(okuma,domain===process.env.DAILY_DOMAIN?1:0);assert.equal(r.bekleyen,okuma);}
});
test("Daily veri okuması yalnız sabit HTTPS APIye anahtarla gider ve yanıtı doğrular",async()=>{
 const oldFetch=globalThis.fetch;const urls:string[]=[];
 globalThis.fetch=(async(url,init)=>{urls.push(String(url));assert.equal(init?.redirect,"error");assert.equal(init?.cache,"no-store");assert.equal((init?.headers as Record<string,string>).Authorization,"Bearer test-only");return Response.json({data:[]});}) as typeof fetch;
 try{const r=await vivaDailyTuketimOku(oda,Date.now()+1000);assert.equal(r.toplam_saniye,0);assert.ok(urls.every(x=>x.startsWith("https://api.daily.co/v1/meetings?")));await assert.rejects(vivaDailyTuketimOku("https://evil.example",Date.now()+1000));}finally{globalThis.fetch=oldFetch;}
});

test("odasız sıfır tüketim işi, sonraki Daily ölçümünü durdurmaz",async()=>{
 let n=0,okuma=0;const rpc=async(i:string)=>{if(i==='ayir'){n++;return n===1?{tamam:true,token:0}:n===2?{etkinlik_id:'e',kira:'k',oda_adi:oda,domain:process.env.DAILY_DOMAIN}:null;}return{tamam:true};};
 assert.deepEqual(await vivaTuketimIsle(rpc,async()=>{okuma++;return kullanim;},Date.now()+1000),{islenen:2,bekleyen:0,hatali:0});assert.equal(okuma,1);
});
