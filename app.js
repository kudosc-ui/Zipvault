/* ZIP Vault — vanilla JS. Sections: utils · IndexedDB · state · files · backup · views · UI · PWA */
'use strict';

/* ===== utils ===== */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};
const fmtSize = b => { if (!b) return '0 B'; const u = ['B', 'KB', 'MB', 'GB', 'TB'], i = Math.min(4, Math.floor(Math.log(b) / Math.log(1024))); return (b / 1024 ** i).toFixed(i ? 1 : 0) + ' ' + u[i]; };
const fmtDate = t => { const d = new Date(t); return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', ...(d.getFullYear() !== new Date().getFullYear() && { year: 'numeric' }) }); };
const uid = () => crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
let tt; const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 3200); };
const errMsg = e => (e && e.name === 'QuotaExceededError') ? 'Not enough free storage in this browser. Free some space or delete a file, then try again.' : 'Something went wrong with vault storage. Please try again.';


/* ===== icons ===== */
const ICO = {
  home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  files: '<path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  heart: '<path d="M12 20s-8-4.7-8-10.5A4.5 4.5 0 0112 7a4.5 4.5 0 018 2.5C20 15.3 12 20 12 20z"/>',
  music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
  book: '<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z"/><path d="M4 19V5M8 7h7"/>',
  brief: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M3 13h18"/>',
  bolt: '<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>',
  backup: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  settings: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  pad: '<rect x="2.5" y="7" width="19" height="11" rx="5"/><path d="M7 10v4M5 12h4"/><circle cx="15.5" cy="11" r=".8"/><circle cx="18" cy="13.5" r=".8"/>',
  code: '<path d="M8 8l-5 4 5 4M16 8l5 4-5 4M14 5l-4 14"/>',
  pkg: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/>',
  zip: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M10 9h2M10 12h2M10 15h2"/>',
  chev: '<path d="M9 6l6 6-6 6"/>',
  down: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
  doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  vault: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="12" cy="12" r="3.5"/><path d="M12 8.5v-1M12 16.5v-1M8.5 12h-1M16.5 12h1"/>'
};
const ico = (n, s = 24) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[n]}</svg>`;
const paintIcons = () => document.querySelectorAll('[data-i]').forEach(e => { e.innerHTML = ico(e.dataset.i, +e.dataset.s || 24); });

/* ===== IndexedDB (ZIPs stored as Blobs — never Base64) ===== */
let _db;
const openDB = () => _db || (_db = new Promise((res, rej) => {
  if (!window.indexedDB) return rej(new Error('no idb'));
  const r = indexedDB.open('zipvault', 1);
  r.onupgradeneeded = () => r.result.createObjectStore('files', { keyPath: 'id' });
  r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
}));
const tx = async (mode, fn) => {
  const db = await openDB();
  return new Promise((res, rej) => {
    const t = db.transaction('files', mode), req = fn(t.objectStore('files'));
    t.oncomplete = () => res(req.result); t.onerror = t.onabort = () => rej(t.error);
  });
};
const dbAll = () => tx('readonly', s => s.getAll());
const dbPut = r => tx('readwrite', s => s.put(r));
const dbDel = id => tx('readwrite', s => s.delete(id));

/* ===== state ===== */
const DEF = [['Website', 'globe', 0], ['Games', 'pad', 1], ['Code', 'code', 2], ['Apk', 'pkg', 3]];
const PAL = 8, PICK = ['files', 'globe', 'pad', 'code', 'pkg', 'star', 'heart', 'music', 'image', 'book', 'brief', 'bolt'];
const loadCats = () => {
  const v = LS.get('cats', null);
  if (Array.isArray(v) && v.length && v.every(c => c && typeof c.n === 'string' && c.n.trim() && ICO[c.i])) return v.map(c => ({ n: c.n, i: c.i, p: (+c.p || 0) % PAL }));
  return DEF.map(([n, i, p]) => ({ n, i, p }));
};
const saveCats = () => LS.set('cats', S.cats);
const CATS = () => S.cats;
const getCat = n => S.cats.find(c => c.n === n);
const canon = n => S.cats.find(c => c.n.toLowerCase() === String(n ?? '').trim().toLowerCase())?.n;
const hasCat = n => !!canon(n);
const nextPal = () => { const u = new Set(S.cats.map(c => c.p)); for (let k = 0; k < PAL; k++) if (!u.has(k)) return k; return S.cats.length % PAL; };
const ensureCat = (n, i = 'files', p) => { // returns the canonical category name, creating it if needed
  n = String(n ?? '').trim().slice(0, 30); if (!n) return S.cats[0].n;
  const ex = canon(n); if (ex) return ex;
  S.cats.push({ n, i: ICO[i] ? i : 'files', p: Number.isInteger(p) ? ((p % PAL) + PAL) % PAL : nextPal() }); saveCats(); return n;
};
const catIcon = c => ico((getCat(c) || { i: 'files' }).i, 20);
const cstyle = c => `style="--cc:var(--p${(getCat(c) || { p: 2 }).p})"`;
const SORTS = {
  new: ['Recently added', (a, b) => b.added - a.added], old: ['Oldest', (a, b) => a.added - b.added],
  az: ['Name A–Z', (a, b) => a.name.localeCompare(b.name)], za: ['Name Z–A', (a, b) => b.name.localeCompare(a.name)],
  big: ['Largest', (a, b) => b.size - a.size], small: ['Smallest', (a, b) => a.size - b.size]
};
const S = { cats: loadCats(), files: [], view: 'home', q: '', cat: LS.get('cat', 'all'), sort: LS.get('sort', 'new'), type: LS.get('type', 'all') };
if (!SORTS[S.sort]) S.sort = 'new';
if (S.cat !== 'all' && !hasCat(S.cat)) S.cat = 'all';
const TYPES = { zip: ['ZIP', 'zip'], image: ['Image', 'image'], text: ['Text', 'doc'], note: ['Note', 'edit'] };
const typeOf = f => f.type && TYPES[f.type] ? f.type : 'zip';
const typeIcon = f => ico(TYPES[typeOf(f)][1], 20);
const load = async () => { S.files = await dbAll(); for (const f of S.files) { if (!f.type) f.type = 'zip'; const c = canon(f.category) || ensureCat(f.category); if (c !== f.category) { f.category = c; try { await dbPut(f); } catch {} } } };

/* ===== search / filter ===== */
const shown = () => {
  const q = S.q.trim().toLowerCase();
  return S.files.filter(f => (S.cat === 'all' || f.category === S.cat) && (S.type === 'all' || typeOf(f) === S.type) &&
    (!q || [f.name, f.desc, f.snip, f.category, TYPES[typeOf(f)][0], ...(f.tags || [])].join(' ').toLowerCase().includes(q))).sort(SORTS[S.sort][1]);
};

/* ===== file handling ===== */
function saveBlob(blob, name) { // new downloadable copy; vault copy untouched
  const u = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = u; a.download = name; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 60000);
}
const cleanName = (n, t = 'zip') => { n = n.replace(/[\\/:*?"<>|]/g, '').trim(); return n ? (t === 'zip' && !/\.zip$/i.test(n) ? n + '.zip' : n) : ''; };
const uniq = name => { const m = name.match(/(\.[^.\s]{1,8})$/), ext = m ? m[1] : '', b = ext ? name.slice(0, -ext.length) : name; let i = 2, n; do n = `${b} (${i++})${ext}`; while (S.files.some(f => f.name.toLowerCase() === n.toLowerCase())); return n; };
const parseTags = s => [...new Set(s.split(',').map(t => t.trim()).filter(Boolean))].slice(0, 20);
const OKF = {
  zip: f => /\.zip$/i.test(f.name) || /zip/i.test(f.type),
  image: f => /^image\//i.test(f.type) || /\.(png|jpe?g|gif|webp|bmp|svg|avif|heic)$/i.test(f.name),
  text: f => /^text\//i.test(f.type) || /\.(txt|md|csv|log|json)$/i.test(f.name)
};
const BAD = { zip: 'That isn’t a ZIP file. Choose a file ending in .zip.', image: 'That isn’t an image. Choose a PNG, JPG, GIF or WebP.', text: 'That isn’t a text file. Choose a .txt file.' };
const defCat = () => canon(LS.get('defcat', '')) || canon(S.cat) || S.cats[0].n;

async function startAdd(list, type) {
  list = [...(list || [])];
  if (!list.length) return toast('No file selected.');
  const ok = list.filter(OKF[type]);
  if (!ok.length) return toast(BAD[type]);
  if (ok.length < list.length) toast(`Skipped ${list.length - ok.length} file(s) of the wrong type.`);
  try {
    const e = await navigator.storage?.estimate?.(), tot = ok.reduce((a, f) => a + f.size, 0);
    if (e?.quota && tot > e.quota - e.usage) return toast('These files are larger than the free space this browser allows.');
  } catch {}
  if (ok.length === 1) form('new', { name: ok[0].name, category: defCat(), type }, ok[0]);
  else form('batch', { category: defCat(), type }, ok);
}

/* ===== backup / restore (.zvault = header + raw Blobs; no Base64, no big memory use) ===== */
function createBackup() {
  if (!S.files.length) return toast('Nothing to back up yet. Add something first.');
  try {
    const items = S.files.map(({ blob, ...m }) => ({ ...m, size: blob.size }));
    const head = new TextEncoder().encode(JSON.stringify({ app: 'zipvault', v: 1, created: Date.now(), cats: S.cats, items }));
    const len = new Uint8Array(4); new DataView(len.buffer).setUint32(0, head.length);
    const out = new Blob(['ZVLT1\n', len, head, ...S.files.map(f => f.blob)], { type: 'application/octet-stream' });
    saveBlob(out, `zipvault-backup-${new Date().toISOString().slice(0, 10)}.zvault`);
    toast('Backup created successfully.');
  } catch (e) { console.error(e); toast('Couldn’t create the backup. Try again, or back up fewer files.'); }
}
async function restore(file) {
  if (!file) return toast('No backup selected.');
  const bad = 'That doesn’t look like a valid ZIP Vault backup, or the file is damaged.';
  let items, head;
  try {
    const hb = new Uint8Array(await file.slice(0, 10).arrayBuffer());
    if (new TextDecoder().decode(hb.slice(0, 6)) !== 'ZVLT1\n') throw 0;
    const hl = new DataView(hb.buffer).getUint32(6);
    if (hl > 5e7 || 10 + hl > file.size) throw 0;
    head = JSON.parse(await file.slice(10, 10 + hl).text());
    if (head.app !== 'zipvault' || !Array.isArray(head.items)) throw 0;
    let off = 10 + hl;
    items = head.items.map(m => { if (typeof m.name !== 'string' || !(m.size >= 0)) throw 0; const x = { m, start: off }; off += m.size; return x; });
    if (off > file.size) throw 0;
  } catch { return toast(bad); }
  if ((await choose('Restore this backup?', `It contains ${items.length} item(s). Nothing already in your vault is overwritten without asking.`, [['go', 'Restore', 'primary'], ['no', 'Cancel']])).k !== 'go') return;
  if (Array.isArray(head.cats)) head.cats.forEach(c => { if (c && typeof c.n === 'string' && c.n.trim()) ensureCat(c.n, c.i, Number.isInteger(c.p) ? c.p : undefined); });
  let pol = null, added = 0, skipped = 0;
  try {
    for (const { m, start } of items) {
      const rec = { id: String(m.id || uid()), name: m.name, size: m.size, added: +m.added || Date.now(), modified: +m.modified || null,
        category: ensureCat(m.category), desc: String(m.desc || ''), tags: Array.isArray(m.tags) ? m.tags.map(String) : [],
        type: TYPES[m.type] ? m.type : 'zip', mime: m.mime || '', snip: m.snip || '', blob: file.slice(start, start + m.size, m.mime || (TYPES[m.type] ? '' : 'application/zip')) };
      const ex = S.files.find(f => f.id === rec.id) || S.files.find(f => f.name === rec.name && f.size === rec.size);
      if (ex) {
        let k = pol;
        if (!k) { const r = await choose('Already in your vault', `“${rec.name}” already exists.`, [['keep', 'Keep existing'], ['replace', 'Replace', 'danger'], ['both', 'Keep both']], true); k = r.k; if (r.all) pol = k; }
        if (k === 'keep') { skipped++; continue; }
        if (k === 'replace') rec.id = ex.id; else { rec.id = uid(); rec.name = uniq(rec.name); }
      }
      await dbPut(rec); added++;
    }
    await load(); render();
    toast(`Restored ${added} file(s)${skipped ? `, kept ${skipped} existing` : ''}.`);
  } catch (e) { console.error(e); await load().catch(() => {}); render(); toast(errMsg(e)); }
}

/* ===== storage info ===== */
async function storageInfo() {
  const o = { n: S.files.length, used: S.files.reduce((a, f) => a + f.size, 0), est: null, persisted: null };
  try { if (navigator.storage?.estimate) o.est = await navigator.storage.estimate(); } catch {}
  try { if (navigator.storage?.persisted) o.persisted = await navigator.storage.persisted(); } catch {}
  return o;
}

/* ===== views ===== */
const catStat = c => { const l = S.files.filter(f => f.category === c); return { n: l.length, size: l.reduce((a, f) => a + f.size, 0) }; };
const cnt = n => `${n} ${n === 1 ? 'file' : 'files'}`;
const empty = (t = 'Nothing saved yet', p = 'Save zips, images, text files and notes here so you can find them whenever you need them.') => `<div class="empty">${ico('vault', 44)}<h3>${t}</h3><p>${p}</p>${S.files.length ? '' : '<button class="btn primary" data-act="add">Add your first item</button>'}</div>`;
const row = f => `<div class="it" ${cstyle(f.category)} data-act="open" data-id="${f.id}"><span class="ico">${typeIcon(f)}</span><div><h4>${esc(f.name)}</h4><p>${TYPES[typeOf(f)][0]} · ${fmtSize(f.size)} · ${esc(f.category)} · ${fmtDate(f.added)}</p></div><button class="dl" data-act="dl" data-id="${f.id}" aria-label="Download ${esc(f.name)}">${ico('down', 22)}</button></div>`;
const listHTML = () => { if (!S.files.length) return empty(); const l = shown(); return l.length ? l.map(row).join('') : empty('No matches', 'Try a different word or category.'); };

const catCard = c => { const st = catStat(c.n); return `<div class="cat" ${cstyle(c.n)} role="button" tabindex="0" data-act="cat" data-id="${esc(c.n)}"><span class="ico big">${ico(c.i, 28)}</span><span><b>${esc(c.n)}</b><small>${cnt(st.n)} · ${fmtSize(st.size)}</small></span><button class="dl" data-act="delcat" data-id="${esc(c.n)}" aria-label="Delete category ${esc(c.n)}">${ico('trash', 20)}</button></div>`; };
const vHome = () => {
  const used = S.files.reduce((a, f) => a + f.size, 0), recent = [...S.files].sort((a, b) => b.added - a.added).slice(0, 5);
  return `<section class="hero"><p class="mut">${cnt(S.files.length)} · ${fmtSize(used)}</p><h1>Your vault</h1></section>
<div class="sh"><h2 class="sec">Categories</h2><button class="btn ghost sm addc" data-act="newcat">${ico('plus', 18)}Add</button></div>
<div>${S.cats.map(catCard).join('')}</div>
<h2 class="sec">Recent</h2><div>${recent.length ? recent.map(row).join('') : empty()}</div>
<p class="note">${ico('lock', 16)}<span>Stored on this device only. Nothing is uploaded.</span></p>`;
};
const vFiles = () => `<div class="sbar">${ico('search', 20)}<input id="q" type="search" placeholder="Search files and notes" value="${esc(S.q)}" autocomplete="off"></div>
<div class="tabs">${[['all', 'All'], ...S.cats.map(c => [c.n, c.n])].map(([k, l]) => `<button class="${S.cat === k ? 'on' : ''}" data-act="cat" data-id="${esc(k)}">${esc(l)}</button>`).join('')}<button class="plus" data-act="newcat" aria-label="New category">${ico('plus', 20)}</button></div>
<div class="tabs sub">${[['all', 'All types'], ['zip', 'ZIPs'], ['image', 'Images'], ['text', 'Text'], ['note', 'Notes']].map(([k, l]) => `<button class="${S.type === k ? 'on' : ''}" data-act="typ" data-id="${k}">${l}</button>`).join('')}</div>
<div class="bar2"><span class="mut" id="cnt">${cnt(shown().length)}</span><select id="fsort" aria-label="Sort">${Object.entries(SORTS).map(([k, v]) => `<option value="${k}" ${S.sort === k ? 'selected' : ''}>${v[0]}</option>`).join('')}</select></div>
<div id="list">${listHTML()}</div>`;
const vBackup = () => `<h2 class="sec">Backup</h2><p class="lead" style="padding-top:0">One backup file holds everything: your categories, plus every ZIP, image, text file and note with its name, description, tags and dates.</p>
<div>${S.cats.map(c => { const s = catStat(c.n); return `<div class="it" ${cstyle(c.n)}><span class="ico">${ico(c.i)}</span><div><h4>${esc(c.n)}</h4><p>${cnt(s.n)} · ${fmtSize(s.size)}</p></div></div>`; }).join('')}</div>
<div class="pad"><button class="btn primary big" data-act="backup">Back up everything</button><button class="btn big" data-act="restore">Restore from backup</button></div>
<p class="note">${ico('lock', 16)}<span>Saved as a .zvault file on your phone. When restoring, if an item already exists you choose to keep, replace or keep both.</span></p>`;
async function vSettings() {
  const s = await storageInfo(), th = LS.get('theme', 'dark'), e = s.est;
  const pct = e?.quota ? Math.min(100, (e.usage / e.quota) * 100) : 0;
  return `<h2 class="sec">Settings</h2>
<div class="blk"><b>Appearance</b><div class="seg">${[['dark', 'Dark'], ['light', 'Light'], ['system', 'System']].map(([k, l]) => `<button class="btn ${th === k ? 'on' : ''}" data-act="theme" data-id="${k}">${l}</button>`).join('')}</div></div>
<div class="blk"><b>Storage</b>
${e?.quota ? `<div class="bar"><i style="width:${pct.toFixed(1)}%"></i></div><dl class="kv"><dt>Vault items</dt><dd>${s.n} • ${fmtSize(s.used)}</dd><dt>Used storage</dt><dd>${fmtSize(e.usage)}</dd><dt>Available</dt><dd>${fmtSize(e.quota - e.usage)}</dd><dt>Usage</dt><dd>${pct.toFixed(2)}%</dd></dl>`
  : `<dl class="kv"><dt>Vault items</dt><dd>${s.n} • ${fmtSize(s.used)}</dd></dl><p class="mut">Storage information unavailable</p>`}
${s.persisted === null ? '<p class="mut">Persistent storage isn’t supported here.</p>' : `<dl class="kv"><dt>Persistent storage</dt><dd>${s.persisted ? 'Granted' : 'Not granted'}</dd></dl>${s.persisted ? '' : '<button class="btn" data-act="persist">Request persistent storage</button>'}`}
<p class="mut sm-t">Persistent storage can reduce the chance of the browser clearing your data automatically, but it doesn’t make files impossible to lose. Your files are stored locally in this browser. Clearing this site’s browser data can remove them. Keep regular backups for important files.</p></div>
<div class="blk"><b>Vault</b><label>Default category<select id="defcat">${CATS().map(c => `<option value="${esc(c.n)}" ${(canon(LS.get('defcat', '')) || S.cats[0].n) === c.n ? 'selected' : ''}>${esc(c.n)}</option>`).join('')}</select></label>
<label>Default sorting<select id="defsort">${Object.entries(SORTS).map(([k, v]) => `<option value="${k}" ${S.sort === k ? 'selected' : ''}>${v[0]}</option>`).join('')}</select></label>
</div>
<div class="blk"><b>About</b><p>ZIP Vault • Version 2.2</p><p class="mut">Your files stay on your device. No servers, no analytics, no ads.</p></div>`;
}

/* ===== UI ===== */
const refreshList = () => { const l = $('#list'); if (l) l.innerHTML = listHTML(); const c = $('#cnt'); if (c) c.textContent = cnt(shown().length); };
let rt = 0;
async function render() {
  const m = $('#app'), v = S.view, t = ++rt;
  const html = v === 'home' ? vHome() : v === 'files' ? vFiles() : v === 'backup' ? vBackup() : await vSettings();
  if (t !== rt) return; // a newer render started while this one was waiting
  m.innerHTML = html;
  document.querySelectorAll('.nav button').forEach(b => b.classList.toggle('on', b.dataset.id === v));
}
const go = v => { S.view = v; render(); scrollTo(0, 0); };
const openSheet = h => { const s = $('#sheet'); s.innerHTML = `<div class="panel">${h}</div>`; s.hidden = false; };
const closeSheet = () => { $('#sheet').hidden = true; if (curURL) { URL.revokeObjectURL(curURL); curURL = null; } };
const choose = (t, m, btns, all) => new Promise(r => {
  const d = $('#dlg');
  d.innerHTML = `<div class="panel"><h3>${esc(t)}</h3><p class="mut">${esc(m)}</p>${all ? '<label class="chk"><input type="checkbox" id="dall"> Apply to all remaining</label>' : ''}<div class="col">${btns.map(([k, l, c]) => `<button class="btn ${c || ''}" data-k="${k}">${l}</button>`).join('')}</div></div>`;
  d.hidden = false;
  d.onclick = e => { const k = e.target.closest('[data-k]')?.dataset.k; if (!k) return; const a = !!$('#dall', d)?.checked; d.hidden = true; r({ k, all: a }); };
});

/* add / edit / rename form */
const catSelect = cur => `<label>Save in category<select id="fc">${CATS().map(c => `<option value="${esc(c.n)}" ${c.n === cur ? 'selected' : ''}>${esc(c.n)}</option>`).join('')}<option value="__new">＋ New category…</option></select></label>
<input id="fnew" placeholder="New category name" maxlength="30" autocomplete="off" hidden>`;
const pickCat = () => { const fc = $('#fc'); let cat = fc.value === '__new' ? $('#fnew').value.trim() : fc.value; if (!cat) { toast('Enter a name for the new category.'); return null; } if (cat.toLowerCase() === 'all') { toast('Please choose a different category name.'); return null; } return ensureCat(cat); };
const fail = (e, label) => { console.error(e); const b = $('#fs'); b.disabled = false; $('#prog').hidden = true; b.textContent = label; toast(errMsg(e)); };

function form(mode, f, file) {
  const t = f.type || typeOf(f), tl = TYPES[t][0];
  if (mode === 'batch') {
    openSheet(`<h3>Add ${file.length} ${t === 'image' ? 'images' : 'text files'}</h3><p class="mut">${file.length} files • ${fmtSize(file.reduce((a, x) => a + x.size, 0))}<br>The vault keeps its own copies. Your originals are left untouched.</p>
${catSelect(f.category)}<div class="bar ind" id="prog" hidden><i></i></div>
<div class="row"><button class="btn" data-act="close">Cancel</button><button class="btn primary" id="fs">Save all to Vault</button></div>`);
    $('#fs').onclick = async () => {
      const cat = pickCat(); if (!cat) return;
      $('#fs').disabled = true; $('#prog').hidden = false; $('#fs').textContent = 'Saving…';
      try {
        for (const x of file) {
          let name = cleanName(x.name, t) || 'Untitled'; if (S.files.some(y => y.name.toLowerCase() === name.toLowerCase())) name = uniq(name);
          const rec = { id: uid(), type: t, name, size: x.size, mime: x.type || '', added: Date.now(), modified: x.lastModified || null, category: cat, desc: '', tags: [], blob: x };
          if (t === 'text') rec.snip = (await x.slice(0, 2000).text()).replace(/\s+/g, ' ');
          await dbPut(rec); await load();
        }
        closeSheet(); render(); toast(`${file.length} files saved to your vault`);
      } catch (e) { await load().catch(() => {}); render(); fail(e, 'Save all to Vault'); }
    };
    return;
  }
  const lbl = mode === 'new' ? 'Save to Vault' : 'Save';
  openSheet(`<h3>${mode === 'new' ? 'Add ' + tl : mode === 'rename' ? 'Rename' : 'Edit details'}</h3>
${file ? `<p class="mut">${esc(file.name)} • ${fmtSize(file.size)}<br>The vault keeps its own copy. Your original file is left untouched.</p>` : ''}
<label>Name<input id="fn" value="${esc(f.name)}" maxlength="150"></label>
${mode === 'rename' ? '' : `${catSelect(f.category)}
<label>Description<textarea id="fd" rows="3" maxlength="500">${esc(f.desc || '')}</textarea></label>
<label>Tags (comma separated)<input id="ft" value="${esc((f.tags || []).join(', '))}"></label>`}
<div class="bar ind" id="prog" hidden><i></i></div>
<div class="row"><button class="btn" data-act="close">Cancel</button><button class="btn primary" id="fs">${lbl}</button></div>`);
  $('#fs').onclick = async () => {
    const name = cleanName($('#fn').value, t); if (!name) return toast('Enter a name.');
    const rec = mode === 'new' ? { id: uid(), type: t, size: file.size, mime: file.type || '', added: Date.now(), modified: file.lastModified || null, blob: file } : { ...f };
    rec.name = name;
    if ($('#fc')) { const cat = pickCat(); if (!cat) return; rec.category = cat; rec.desc = $('#fd').value.trim(); rec.tags = parseTags($('#ft').value); }
    const dup = S.files.find(x => x.id !== rec.id && x.name.toLowerCase() === name.toLowerCase());
    if (dup) {
      const k = (await choose('Name already used', `“${name}” already exists in your vault.`, [['both', 'Keep both (auto-number)', 'primary'], ...(mode === 'new' ? [['replace', 'Replace existing', 'danger']] : []), ['no', 'Cancel']])).k;
      if (k === 'no') return; if (k === 'replace') rec.id = dup.id; else rec.name = uniq(name);
    }
    $('#fs').disabled = true; $('#prog').hidden = false; $('#fs').textContent = 'Saving…';
    try {
      if (mode === 'new' && t === 'text') rec.snip = (await file.slice(0, 2000).text()).replace(/\s+/g, ' ');
      await dbPut(rec); await load(); closeSheet(); render();
      toast(mode === 'new' ? tl + ' saved to your vault' : 'Changes saved');
      if (mode === 'new' && navigator.storage?.persist) navigator.storage.persist().catch(() => {});
    } catch (e) { fail(e, lbl); }
  };
}

/* write / edit a note (also edits uploaded text files) */
async function noteForm(f) {
  const edit = !!f, cur = edit ? await f.blob.text() : '';
  openSheet(`<h3>${edit ? 'Edit ' + TYPES[typeOf(f)][0].toLowerCase() : 'Write a note'}</h3>
<label>Title<input id="nt" maxlength="150" placeholder="Note title" value="${esc(edit ? f.name.replace(/\.txt$/i, '') : '')}"></label>
<label>Note<textarea id="nb" rows="10" placeholder="Start writing…">${esc(cur)}</textarea></label>
${catSelect(edit ? f.category : defCat())}
<div class="bar ind" id="prog" hidden><i></i></div>
<div class="row"><button class="btn" data-act="close">Cancel</button><button class="btn primary" id="fs">Save</button></div>`);
  setTimeout(() => (edit ? $('#nb') : $('#nt'))?.focus(), 60);
  $('#fs').onclick = async () => {
    const text = $('#nb').value; let title = $('#nt').value.trim();
    if (!text.trim() && !title) return toast('Write something first.');
    if (!title) title = text.trim().split('\n')[0].slice(0, 40);
    const cat = pickCat(); if (!cat) return;
    let name = cleanName(title, 'note'); if (edit && typeOf(f) === 'text' && !/\.[a-z0-9]{1,5}$/i.test(name)) name += '.txt';
    const id = edit ? f.id : uid();
    if (S.files.some(x => x.id !== id && x.name.toLowerCase() === name.toLowerCase())) name = uniq(name);
    const blob = new Blob([text], { type: 'text/plain' });
    const rec = edit ? { ...f, name, category: cat, blob, size: blob.size, modified: Date.now(), snip: text.slice(0, 2000).replace(/\s+/g, ' ') }
      : { id, type: 'note', name, category: cat, blob, size: blob.size, mime: 'text/plain', added: Date.now(), modified: null, desc: '', tags: [], snip: text.slice(0, 2000).replace(/\s+/g, ' ') };
    $('#fs').disabled = true; $('#prog').hidden = false; $('#fs').textContent = 'Saving…';
    try { await dbPut(rec); await load(); closeSheet(); render(); toast(edit ? 'Changes saved' : 'Note saved to your vault'); }
    catch (e) { fail(e, 'Save'); }
  };
}

/* the “+” sheet: four ways to add */
const addSheet = () => openSheet(`<h3>Add to vault</h3>
<div class="col opts">${[['zip', 'zip', 'Upload ZIP', 'Projects, websites, games, apps'], ['image', 'image', 'Upload image', 'Photos and screenshots'], ['text', 'doc', 'Upload text file', '.txt and other text files'], ['write', 'edit', 'Write & save', 'Type a note right here']].map(([k, i, t, d]) => `<button class="opt" data-act="up" data-id="${k}"><span class="ico">${ico(i, 24)}</span><span><b>${t}</b><small>${d}</small></span>${ico('chev', 20)}</button>`).join('')}</div>
<button class="btn ghost" data-act="close">Cancel</button>`);

let curURL = null;
function detail(f) {
  const t = typeOf(f), txt = t === 'note' || t === 'text';
  if (curURL) { URL.revokeObjectURL(curURL); curURL = null; }
  let prev = '';
  if (t === 'image') { curURL = URL.createObjectURL(f.blob); prev = `<img class="pv" src="${curURL}" alt="${esc(f.name)}">`; }
  else if (txt) prev = `<pre class="pv txt" id="pvt">Loading…</pre>`;
  openSheet(`<h3 style="overflow-wrap:anywhere">${typeIcon(f)} ${esc(f.name)}</h3>${prev}
<dl class="kv"><dt>Type</dt><dd>${TYPES[t][0]}</dd><dt>Size</dt><dd>${fmtSize(f.size)}</dd><dt>Added</dt><dd>${fmtDate(f.added)}</dd>${f.modified ? `<dt>Last modified</dt><dd>${fmtDate(f.modified)}</dd>` : ''}<dt>Category</dt><dd>${esc(f.category)}</dd></dl>
${t === 'note' ? '' : `<p>${f.desc ? esc(f.desc) : '<span class="mut">No description</span>'}</p><div>${(f.tags || []).map(x => `<span class="tag">#${esc(x)}</span>`).join('') || '<span class="mut">No tags</span>'}</div>`}
<div class="col">${txt ? `<button class="btn primary" data-act="note" data-id="${f.id}">${ico('edit', 20)}Open &amp; edit</button><div class="row"><button class="btn" data-act="dl" data-id="${f.id}">Download</button><button class="btn" data-act="edit" data-id="${f.id}">Move / details</button></div>`
    : `<button class="btn primary" data-act="dl" data-id="${f.id}">Download</button><div class="row"><button class="btn" data-act="rename" data-id="${f.id}">Rename</button><button class="btn" data-act="edit" data-id="${f.id}">Move / details</button></div>`}
<button class="btn danger" data-act="del" data-id="${f.id}">Delete</button><button class="btn ghost" data-act="close">Close</button></div>`);
  if (txt) f.blob.slice(0, 4000).text().then(x => { const e = $('#pvt'); if (e) e.textContent = (x || '(empty)') + (f.size > 4000 ? '\n…' : ''); });
}
const byId = id => S.files.find(f => f.id === id);
let NC = { i: 'files', p: 0 };
const ACT = {
  go, close: closeSheet, add: addSheet, up: k => { closeSheet(); if (k === 'write') noteForm(); else $('#pick_' + k).click(); },
  note: id => { const f = byId(id); if (f) noteForm(f); },
  typ: id => { S.type = id; LS.set('type', id); render(); }, backup: createBackup, restore: () => $('#rest').click(),
  search: () => { go('files'); setTimeout(() => $('#q')?.focus(), 50); },
  open: id => { const f = byId(id); if (f) detail(f); },
  dl: id => { const f = byId(id); if (!f) return; try { saveBlob(f.blob, typeOf(f) === 'note' && !/\.[a-z0-9]{1,5}$/i.test(f.name) ? f.name + '.txt' : f.name); toast('Download started. Your vault copy stays safe.'); } catch { toast('Download failed. Please try again.'); } },
  rename: id => form('rename', byId(id)), edit: id => form('edit', byId(id)),
  del: async id => {
    const f = byId(id); if (!f) return;
    if ((await choose(`Delete ${f.name}?`, 'This will permanently remove this copy from your vault.', [['del', 'Delete', 'danger'], ['no', 'Cancel']])).k !== 'del') return;
    try { await dbDel(id); await load(); closeSheet(); render(); toast('Deleted from your vault.'); } catch (e) { toast(errMsg(e)); }
  },
  cat: id => { S.cat = id; LS.set('cat', id); go('files'); },
  newcat: () => {
    NC = { i: 'files', p: nextPal() };
    openSheet(`<h3>New category</h3><label>Name<input id="nc" maxlength="30" autocomplete="off" placeholder="e.g. Music, Work, Photos"></label>
<label>Icon</label><div class="pick" id="pi">${PICK.map(k => `<button type="button" class="${k === NC.i ? 'on' : ''}" data-act="pi" data-id="${k}" aria-label="Icon ${k}">${ico(k, 22)}</button>`).join('')}</div>
<label>Colour</label><div class="pick sw" id="pc">${[...Array(PAL).keys()].map(k => `<button type="button" class="${k === NC.p ? 'on' : ''}" style="--cc:var(--p${k})" data-act="pcol" data-id="${k}" aria-label="Colour ${k + 1}"></button>`).join('')}</div>
<div class="row"><button class="btn" data-act="close">Cancel</button><button class="btn primary" data-act="savecat">Create</button></div>`);
    setTimeout(() => $('#nc')?.focus(), 60);
  },
  pi: id => { NC.i = id; document.querySelectorAll('#pi button').forEach(b => b.classList.toggle('on', b.dataset.id === id)); },
  pcol: id => { NC.p = +id; document.querySelectorAll('#pc button').forEach(b => b.classList.toggle('on', b.dataset.id === id)); },
  savecat: () => {
    const n = ($('#nc').value || '').trim();
    if (!n) return toast('Enter a category name.');
    if (n.toLowerCase() === 'all' || n === '__new') return toast('Please choose a different category name.');
    if (hasCat(n)) return toast('A category with that name already exists.');
    ensureCat(n, NC.i, NC.p); closeSheet(); render(); toast(`Category “${n}” added.`);
  },
  delcat: async id => {
    if (!getCat(id)) return;
    if (S.cats.length < 2) return toast('You need to keep at least one category.');
    const list = S.files.filter(f => f.category === id), dest = S.cats.find(c => c.n !== id).n;
    const msg = list.length ? `Your ${cnt(list.length)} in this category will NOT be deleted. They will be moved to “${dest}”.` : 'This category is empty. It will be removed.';
    if ((await choose(`Delete category “${id}”?`, msg, [['del', 'Delete category', 'danger'], ['no', 'Cancel']])).k !== 'del') return;
    try {
      for (const f of list) { f.category = dest; await dbPut(f); }
      S.cats = S.cats.filter(c => c.n !== id); saveCats();
      if (S.cat === id) { S.cat = 'all'; LS.set('cat', 'all'); }
      if (LS.get('defcat', '') === id) LS.set('defcat', dest);
      await load(); render(); toast(`Category “${id}” deleted.`);
    } catch (e) { console.error(e); await load().catch(() => {}); render(); toast(errMsg(e)); }
  },
  theme: id => { LS.set('theme', id); theme(); render(); },
  persist: async () => { try { toast(await navigator.storage.persist() ? 'Persistent storage granted.' : 'The browser declined persistent storage.'); } catch { toast('Persistent storage isn’t available.'); } render(); }
};
document.addEventListener('click', e => { const el = e.target.closest('[data-act]'); if (el && ACT[el.dataset.act]) ACT[el.dataset.act](el.dataset.id); });
document.addEventListener('click', e => { if (e.target.id === 'sheet') closeSheet(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && $('#dlg').hidden && !$('#sheet').hidden) closeSheet();
  if (e.key === 'Enter' && e.target.id === 'nc') ACT.savecat();
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('[role=button]')) { e.preventDefault(); e.target.click(); }
});
document.addEventListener('input', e => { if (e.target.id === 'q') { S.q = e.target.value; refreshList(); } });
document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'fc') { const n = $('#fnew'); n.hidden = t.value !== '__new'; if (!n.hidden) n.focus(); }
  if (t.id === 'fsort' || t.id === 'defsort') { S.sort = t.value; LS.set('sort', S.sort); if (S.view === 'files') refreshList(); }
  if (t.id === 'defcat') LS.set('defcat', t.value);
  if (t.id?.startsWith('pick_')) { const l = [...t.files]; t.value = ''; startAdd(l, t.id.slice(5)); }
  if (t.id === 'rest') { const f = t.files[0]; t.value = ''; restore(f); }
});
['pick_zip', 'pick_image', 'pick_text', 'rest'].forEach(i => $('#' + i).addEventListener('cancel', () => toast('No file selected.')));

/* theme */
const mq = matchMedia('(prefers-color-scheme: light)');
function theme() { const t = LS.get('theme', 'dark'), r = t === 'system' ? (mq.matches ? 'light' : 'dark') : t; document.documentElement.dataset.theme = r; $('meta[name=theme-color]').content = r === 'light' ? '#f5f7fb' : '#06080d'; }
mq.addEventListener?.('change', theme);

/* ===== PWA + init ===== */
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('service-worker.js').catch(() => {}));
(async () => {
  theme(); paintIcons();
  try { await load(); } catch (e) { toast('Storage isn’t available in this browser mode. Try a normal (non-private) window.'); }
  render();
})();
