import{timingSafeEqual}from"node:crypto";
import{NextRequest,NextResponse}from"next/server";
import{createAdminClient}from"@/lib/supabase/server";
import{firmaStoreEpostalariniIsle}from"@/lib/tclub/store/cekEposta";
export const maxDuration=60;export const dynamic="force-dynamic";
async function isle(r:NextRequest){const secret=process.env.CRON_SECRET,a=Buffer.from(r.headers.get("authorization")||""),b=Buffer.from(`Bearer ${secret||""}`);if(!secret||a.length!==b.length||!timingSafeEqual(a,b))return NextResponse.json({hata:"Yetkisiz erişim."},{status:401});try{const sonuc=await firmaStoreEpostalariniIsle(createAdminClient());return NextResponse.json(sonuc,{status:sonuc.ayar_hazir?200:503,headers:{"Cache-Control":"no-store"}});}catch{return NextResponse.json({hata:"FirmaStore e-posta kuyruğu işlenemedi."},{status:500});}}
export async function GET(r:NextRequest){return isle(r);}export async function POST(r:NextRequest){return isle(r);}
