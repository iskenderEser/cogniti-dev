// Radix, tarayıcı useLayoutEffect seçimini import anında yapar. Bu dosya UI testlerinden önce yüklenir.
import { Window } from 'happy-dom';
import { after } from 'node:test';
const bootstrap = new Window({ url: 'http://localhost/viva' });
for (const k of ['window', 'document', 'navigator']) Object.defineProperty(globalThis, k, { configurable: true, value: bootstrap[k] });
after(async () => { await bootstrap.happyDOM.close(); });
