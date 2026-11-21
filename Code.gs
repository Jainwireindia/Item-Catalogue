/**
 * JAIN WIRE ITEM CATALOGUE — Code.gs  v1.0.0
 * Reads the "JAIN WIRE ITEMS" Drive folder (and its sub-folders) and serves the list to index.html.
 * Item details (sizes, kg, length, notes) are kept in ONE JSON file inside that same folder: item-details.json
 *
 * SETUP: see SETUP.md. Admin password goes in Project Settings -> Script properties -> ADMIN_PASSWORD
 */
var VERSION = '1.0.0';
var ROOT_FOLDER_ID = '1NNoo0xCCNERDlTbacpIX3sGcppaLAYin';   // JAIN WIRE ITEMS
var DETAILS_FILE = 'item-details.json';
var CACHE_KEY = 'catalogue_list_v1';
var CACHE_SECS = 600;            // folder scan is cached for 10 min; admin can force refresh
var MAX_SHARE_BYTES = 8 * 1024 * 1024;

function doPost(e) {
  var out;
  try {
    var req = JSON.parse(e.postData.contents);
    switch (req.action) {
      case 'ping':    out = { ok: true, version: VERSION }; break;
      case 'list':    out = actionList(req); break;
      case 'auth':    out = { ok: checkPw(req.pw) }; break;
      case 'save':    out = actionSave(req); break;
      case 'file':    out = actionFile(req); break;
      default:        out = { ok: false, error: 'Unknown action' };
    }
  } catch (err) {
    out = { ok: false, error: String(err && err.message || err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, version: VERSION, note: 'POST only' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ---------- auth ---------- */
function checkPw(pw) {
  var real = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
  return !!real && String(pw || '') === real;
}

/* ---------- list ---------- */
function actionList(req) {
  var refresh = !!req.refresh && checkPw(req.pw);
  var items = getItems(refresh);
  var d = readDetails();
  return { ok: true, version: VERSION, items: items, details: d.data, detailsUpdated: d.updated };
}

function getItems(refresh) {
  var cache = CacheService.getScriptCache();
  if (!refresh) {
    var n = cache.get(CACHE_KEY + '_n');
    if (n) {
      var parts = [];
      for (var i = 0; i < Number(n); i++) {
        var p = cache.get(CACHE_KEY + '_' + i);
        if (p === null) { parts = null; break; }
        parts.push(p);
      }
      if (parts) { try { return JSON.parse(parts.join('')); } catch (x) {} }
    }
  }
  var items = [];
  walk(DriveApp.getFolderById(ROOT_FOLDER_ID), [], items);
  items.sort(function (a, b) {
    return (a.cat + '|' + a.sub + '|' + a.name).toLowerCase() < (b.cat + '|' + b.sub + '|' + b.name).toLowerCase() ? -1 : 1;
  });
  var s = JSON.stringify(items), size = 90000, chunks = [];
  for (var j = 0; j < s.length; j += size) chunks.push(s.substring(j, j + size));
  try {
    var obj = {};
    obj[CACHE_KEY + '_n'] = String(chunks.length);
    chunks.forEach(function (c, k) { obj[CACHE_KEY + '_' + k] = c; });
    cache.putAll(obj, CACHE_SECS);
  } catch (x) {}
  return items;
}

function walk(folder, path, out) {
  var files = folder.getFiles();
  while (files.hasNext()) {
    var f = files.next();
    var mt = f.getMimeType();
    var isImg = mt.indexOf('image/') === 0, isVid = mt.indexOf('video/') === 0;
    if (!isImg && !isVid) continue;
    out.push({
      id: f.getId(),
      name: f.getName().replace(/\.[A-Za-z0-9_]{2,5}$/, '').replace(/[_]+/g, ' ').trim(),
      cat: path.length ? path[0] : 'Other',
      sub: path.length > 1 ? path.slice(1).join(' › ') : '',
      type: isVid ? 'video' : 'image',
      mtime: f.getLastUpdated().getTime()
    });
  }
  var subs = folder.getFolders();
  while (subs.hasNext()) {
    var sf = subs.next();
    walk(sf, path.concat([sf.getName()]), out);
  }
}

/* ---------- details json ---------- */
function findDetailsFile() {
  var it = DriveApp.getFolderById(ROOT_FOLDER_ID).getFilesByName(DETAILS_FILE);
  return it.hasNext() ? it.next() : null;
}
function readDetails() {
  var f = findDetailsFile();
  if (!f) return { data: {}, updated: 0 };
  try {
    var j = JSON.parse(f.getBlob().getDataAsString());
    return { data: j.items || {}, updated: f.getLastUpdated().getTime() };
  } catch (e) { return { data: {}, updated: 0 }; }
}

// fields kept per item: title, sizes, weight, length, notes
var FIELDS = ['title', 'sizes', 'weight', 'length', 'notes'];

function actionSave(req) {
  if (!checkPw(req.pw)) return { ok: false, error: 'Wrong password' };
  var ids = {};
  getItems(false).forEach(function (it) { ids[it.id] = 1; });
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var f = findDetailsFile();
    var cur = {};
    if (f) { try { cur = JSON.parse(f.getBlob().getDataAsString()).items || {}; } catch (e) {} }
    var changes = req.changes || {};           // { fileId: {title,sizes,...} }  (empty object = clear)
    Object.keys(changes).forEach(function (id) {
      if (!ids[id]) return;
      var src = changes[id] || {}, row = {}, any = false;
      FIELDS.forEach(function (k) {
        var v = String(src[k] == null ? '' : src[k]).substring(0, 600).trim();
        if (v) { row[k] = v; any = true; }
      });
      if (any) cur[id] = row; else delete cur[id];
    });
    var text = JSON.stringify({ version: 1, items: cur }, null, 1);
    if (f) f.setContent(text);
    else DriveApp.getFolderById(ROOT_FOLDER_ID).createFile(DETAILS_FILE, text, 'application/json');
    return { ok: true, details: cur };
  } finally { lock.releaseLock(); }
}

/* ---------- file bytes for WhatsApp sharing ---------- */
function actionFile(req) {
  var id = String(req.id || '');
  var found = getItems(false).filter(function (it) { return it.id === id; })[0];
  if (!found) return { ok: false, error: 'Not in catalogue' };
  var blob = DriveApp.getFileById(id).getBlob();
  var bytes = blob.getBytes();
  if (bytes.length > MAX_SHARE_BYTES) return { ok: false, error: 'File too large to share directly' };
  return { ok: true, mime: blob.getContentType(), name: found.name, b64: Utilities.base64Encode(bytes) };
}
