/** Bu politika yalnız Agora satın alma öncesi incelemesine aittir. */
export const AGORA_KORUMA_SURUMU = 1;
export const AGORA_SESLI_UYARI_ARALIGI = 30;
export const AGORA_SESLI_UYARI = "/agora/kogniti-deneme-yayini.wav";
export interface AgoraDenemeKaynagi {
  tur: "video" | "podcast";
  url: string;
  korumaSurumu: number;
  uyari?: string;
}
