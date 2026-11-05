/** Eğitim adı ve PE kodu metin; fiyat Türkçe veya düz sayısal biçimle aranır. */
export function partnerAramaFiyati(metin:string):number|null {
  const s=metin.trim().replace(/₺|TL/gi,"").replace(/\s/g,"");
  let sayi:string;
  if(/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(s))sayi=s.replaceAll(".","").replace(",",".");
  else if(/^\d{1,10}([.,]\d{1,2})?$/.test(s))sayi=s.replace(",",".");
  else return null;
  const n=Number(sayi);return Number.isFinite(n)&&n>=0&&n<=9999999999.99?n:null;
}
