import { partnerYanit } from "@/lib/agora/partnerHttp";

export async function GET() {
  return partnerYanit({ hata: "Bu sayfaya erişim yetkiniz yok." }, 403);
}
