import { ureticiYetenegi } from "@/lib/uretici/yetenekler";

export function ureticiOlusturmaHaritasi(rol: string) {
  const yetenek = ureticiYetenegi(rol.trim().toLowerCase());
  switch (yetenek?.icerikTuru) {
    case "urun": return "ureticiPm";
    case "medikal": return "ureticiMedikal";
    case "egitim": return "ureticiEgitim";
    case "ik": return "ureticiIk";
    default: return null;
  }
}

export function ureticiYayinaAcmaHaritasi(rol: string) {
  const yetenek = ureticiYetenegi(rol.trim().toLowerCase());
  switch (yetenek?.icerikTuru) {
    case "urun": case "medikal": return "ureticiYayinFull";
    case "egitim": return "ureticiYayinEgitim";
    case "ik": return "ureticiYayinIk";
    default: return null;
  }
}
