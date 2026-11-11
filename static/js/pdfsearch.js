/* PDF 內文搜尋（查詢端）。索引由 tools/pdfsearch_build.py 產生在 /pdfsearch/；比對規則要跟那支程式一致：
   逐字 NFKD → 去調符 → NFKC → 小寫 → 異體折疊；空白只在前後都不是漢字時留一個。
   用法：PdfSearch.search('佫').then(function (r) { r.candidates; return r.verify(r.candidates.slice(0, 40)); }) */
(function () {
  var BASE = '/pdfsearch/';
  var meta = null, fold = {}, shardCache = {}, txtCache = {}, charCache = new Map();

  function getJSON(u) { return fetch(u).then(function (r) { if (!r.ok) throw new Error(u); return r.json(); }); }
  function getMeta() {
    if (!meta) {
      meta = getJSON(BASE + 'meta.json').then(function (m) {
        m.fold.split(' ').forEach(function (p) { var a = Array.from(p); if (a.length === 2) fold[a[0]] = a[1]; });
        return m;
      });
    }
    return meta;
  }
  function getShard(i) { return shardCache[i] || (shardCache[i] = getJSON(BASE + 'idx/' + i + '.json')); }
  function getTxt(i) { return txtCache[i] || (txtCache[i] = getJSON(BASE + 'txt/' + i + '.json')); }

  function isHan(o) {
    return (o >= 0x4E00 && o <= 0x9FFF) || (o >= 0x3400 && o <= 0x4DBF) || (o >= 0x20000 && o <= 0x3134F) || (o >= 0xF900 && o <= 0xFAFF);
  }
  function normChar(c) {
    var r = charCache.get(c);
    if (r === undefined) {
      r = Array.from(c.normalize('NFKD').replace(/\p{M}/gu, '').normalize('NFKC').toLowerCase(), function (x) { return fold[x] || x; }).join('');
      charCache.set(c, r);
    }
    return r;
  }
  // 回傳 { n: 正規化後的字串, map: n 的每個 UTF-16 單位對應原文的位置 }
  function normMap(s) {
    var out = '', map = [], pending = false, lastHan = false, i = 0;
    while (i < s.length) {
      var o = s.codePointAt(i), c = String.fromCodePoint(o), at = i;
      i += c.length;
      if (/\s/.test(c)) { pending = true; continue; }
      var n = normChar(c);
      if (!n || !n.trim()) { if (n) pending = true; continue; }
      var firstHan = isHan(n.codePointAt(0));
      if (pending && out && !(lastHan || firstHan)) { out += ' '; map.push(at); }
      pending = false;
      for (var k = 0; k < n.length; k++) map.push(at);
      out += n;
      var arr = Array.from(n);
      lastHan = isHan(arr[arr.length - 1].codePointAt(0));
    }
    return { n: out, map: map };
  }
  function tokens(s) {
    var out = new Set(), run = [];
    function flush() {
      if (run.length === 1) out.add(run[0]);
      for (var i = 0; i + 1 < run.length; i++) out.add(run[i] + run[i + 1]);
      run = [];
    }
    Array.from(s).forEach(function (c) { if (isHan(c.codePointAt(0))) run.push(c); else flush(); });
    flush();
    (s.match(/[0-9a-z]+/g) || []).forEach(function (w) {
      if (w.length <= 3) out.add(w);
      else for (var i = 0; i + 3 <= w.length; i++) out.add(w.slice(i, i + 3));
    });
    return Array.from(out);
  }
  function fnv(s, n) {
    var h = 0x811c9dc5, b = new TextEncoder().encode(s);
    for (var i = 0; i < b.length; i++) h = Math.imul(h ^ b[i], 0x01000193) >>> 0;
    return h % n;
  }

  function search(q) {
    return getMeta().then(function (m) {
      var nq = normMap(q).n, toks = tokens(nq);
      if (!toks.length) return { candidates: [], verify: function () { return Promise.resolve([]); }, nq: nq };
      return Promise.all(toks.map(function (t) {
        return getShard(fnv(t, m.shards)).then(function (sh) {
          var d = sh[t] || [], ids = new Array(d.length), acc = 0;
          for (var i = 0; i < d.length; i++) ids[i] = acc += d[i];
          return ids;
        });
      })).then(function (lists) {
        lists.sort(function (a, b) { return a.length - b.length; });
        var cand = lists[0];
        lists.slice(1).forEach(function (l) { var s = new Set(l); cand = cand.filter(function (x) { return s.has(x); }); });
        function verify(ids) {
          var chunks = Array.from(new Set(ids.map(function (id) { return Math.floor(id / m.chunk); })));
          return Promise.all(chunks.map(getTxt)).then(function () {
            return Promise.all(ids.map(function (id) {
              return getTxt(Math.floor(id / m.chunk)).then(function (arr) {
                var txt = arr[id % m.chunk], nm = normMap(txt), at = nm.n.indexOf(nq);
                if (at < 0) return null;
                var a = nm.map[at], lastAt = nm.map[at + nq.length - 1];
                var b = lastAt + String.fromCodePoint(txt.codePointAt(lastAt)).length;
                var p = m.pages[id], f = m.files[p[0]];
                return { url: f[0], title: f[1], page: p[1], quality: p[2],
                  before: txt.slice(Math.max(0, a - 30), a).replace(/\s+/g, ' '),
                  hit: txt.slice(a, b),
                  after: txt.slice(b, b + 40).replace(/\s+/g, ' ') };
              });
            }));
          }).then(function (hits) { return hits.filter(Boolean); });
        }
        return { candidates: cand, verify: verify, nq: nq };
      });
    });
  }

  window.PdfSearch = { search: search, normMap: normMap, tokens: tokens };
})();
