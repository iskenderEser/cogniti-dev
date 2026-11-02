export function cekKoduGecerli(value: unknown): value is string {
 return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9 _./-]{2,199}$/.test(value.trim());
}
export function cekBaglantisiGecerli(value: unknown): value is string {
 if (typeof value !== "string" || value.length > 2048 || /[\s\\]/.test(value)) return false;
 if (!value) return true;
 try { const u = new URL(value); return u.protocol === "https:" && !!u.hostname && !u.username && !u.password; } catch { return false; }
}
