import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const ON_EK = "scrypt$32768$8$1$";
const SAHTE_OZET = ON_EK + "00".repeat(16) + "$" + "00".repeat(64);
const turet = (sifre: string, tuz: string) => new Promise<Buffer>((resolve, reject) => {
  scrypt(sifre, Buffer.from(tuz, "hex"), 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (error, key) => error ? reject(error) : resolve(key));
});
export function partnerTestSifresiGecerli(sifre: unknown): sifre is string {
  return typeof sifre === "string" && sifre.length >= 6 && sifre.length <= 128;
}
export async function partnerSifreOzeti(sifre: string) {
  if (!partnerTestSifresiGecerli(sifre)) throw new Error("Şifre en az 6, en fazla 128 karakter olmalıdır.");
  const tuz = randomBytes(16).toString("hex");
  return ON_EK + tuz + "$" + (await turet(sifre, tuz)).toString("hex");
}
export async function partnerSifreDogrula(sifre: string, ozet: string | null) {
  const gecerli = typeof ozet === "string" && /^scrypt\$32768\$8\$1\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(ozet);
  const parcalar = (gecerli ? ozet : SAHTE_OZET).split("$");
  const sonuc = await turet(sifre, parcalar[4]);
  return timingSafeEqual(sonuc, Buffer.from(parcalar[5], "hex")) && gecerli;
}
