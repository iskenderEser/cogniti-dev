import assert from "node:assert/strict";
import test from "node:test";

import { yayinKoduNumarasiniCoz } from "../lib/admin/yayinKodu.ts";

test("admin tekil silme yayın kodunun sonundaki numarayı çözer", () => {
  assert.equal(yayinKoduNumarasiniCoz("hepifarma_30058"), 30058);
  assert.equal(yayinKoduNumarasiniCoz("Firma_Alt_Ad_40001"), 40001);
  assert.equal(yayinKoduNumarasiniCoz("  hepifarma_30058  "), 30058);
});

test("admin tekil silme geçersiz veya güvenli olmayan kimlikleri reddeder", () => {
  assert.equal(yayinKoduNumarasiniCoz("hepifarma_"), null);
  assert.equal(yayinKoduNumarasiniCoz("hepifarma_abc"), null);
  assert.equal(yayinKoduNumarasiniCoz("hepifarma_-1"), null);
  assert.equal(yayinKoduNumarasiniCoz("0"), null);
  assert.equal(yayinKoduNumarasiniCoz(null), null);
});
