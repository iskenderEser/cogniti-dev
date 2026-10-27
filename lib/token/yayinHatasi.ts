/** Yayına alma işlemini durduran bilinen token hataları. */
export function yayinTokenHatasi(error: { code?: string; message?: string }): string | null {
  if (error.code !== "P0001") return null;
  if (error.message === "COGNITI_TOKEN:bakiye_yetersiz") return "Firmanızın token bakiyesi hedef kişilere gönderim için yetersiz. Yayın açılmadı, token düşülmedi.";
  if (error.message === "COGNITI_TOKEN:hesap_yok") return "Firmanızın token hesabı henüz açılmamış. Yayın açılmadı.";
  if (error.message === "COGNITI_TOKEN:yayin_firma_yok") return "Yayının gönderici firma bilgisi doğrulanamadı. Yayın açılmadı.";
  return null;
}
