/* 專著閱讀頁（/song/books/<書名>/）的翻頁。
   頁的資料都在頁面上的「全部頁面」清單（data-p 流水號、data-pp 書上印的頁碼、data-t 類型），這裡不另外載資料。
   網址 #p=032 直接到第 32 張；左右方向鍵翻頁；下一張先偷偷載好。 */
(function () {
  var root = document.getElementById('bkr');
  if (!root) return;
  var N = parseInt(root.getAttribute('data-n'), 10);
  var pages = {}, songs = {};
  root.querySelectorAll('.bkr-page-list a').forEach(function (a) {
    pages[+a.dataset.p] = { src: a.getAttribute('href'), pp: a.dataset.pp, t: a.dataset.t, w: +a.dataset.w, h: +a.dataset.h };
  });
  root.querySelectorAll('.bkr-toc-list a').forEach(function (a) {
    var p = +a.dataset.p, no = a.querySelector('.bkr-tno').textContent, tt = a.querySelector('.bkr-t').textContent;
    (songs[p] = songs[p] || []).push((no ? no + '. ' : '') + tt);
  });
  var img = root.querySelector('.bkr-img'), link = root.querySelector('.bkr-imglink'), info = root.querySelector('.bkr-info');
  var num = root.querySelector('.bkr-num'), fig = root.querySelector('.bkr-fig');
  var title = img.getAttribute('alt').replace(/第 \d+ 張$/, '');
  var cur = 0;
  function pad(n) { return ('00' + n).slice(-3); }
  function fromHash() {
    var m = /(?:^|[#&])p=(\d+)/.exec(location.hash);
    var n = m ? parseInt(m[1], 10) : 1;
    return Math.min(Math.max(n || 1, 1), N);
  }
  function show(n, push, scroll) {
    n = Math.min(Math.max(n, 1), N);
    var pg = pages[n];
    if (!pg) return;
    if (n !== cur) {
      fig.classList.add('is-loading');
      if (pg.w) { img.width = pg.w; img.height = pg.h; }
      img.src = pg.src;
      img.alt = title + '第 ' + n + ' 張';
      link.href = pg.src;
    }
    cur = n;
    num.value = n;
    var parts = ['第 ' + n + ' ／ ' + N + ' 張'];
    if (pg.pp) parts.push('書上頁碼 ' + pg.pp);
    if (pg.t && pg.t !== '正文') parts.push(pg.t);
    info.textContent = parts.join('　');
    if (songs[n]) {
      var s = document.createElement('span');
      s.className = 'bkr-info-songs';
      s.textContent = songs[n].join('；');
      info.appendChild(s);
    }
    root.querySelectorAll('.bkr-prev').forEach(function (b) { b.disabled = n <= 1; });
    root.querySelectorAll('.bkr-next').forEach(function (b) { b.disabled = n >= N; });
    root.querySelectorAll('a.is-cur').forEach(function (a) { a.classList.remove('is-cur'); });
    root.querySelectorAll('a[data-p="' + n + '"]').forEach(function (a) { a.classList.add('is-cur'); });
    if (push) {
      var h = '#p=' + pad(n);
      if (location.hash !== h) history.pushState(null, '', h);
    }
    if (scroll) document.getElementById('reader').scrollIntoView({ block: 'start' });
    if (pages[n + 1]) { var pre = new Image(); pre.src = pages[n + 1].src; }
  }
  img.addEventListener('load', function () { fig.classList.remove('is-loading', 'is-missing'); });
  img.addEventListener('error', function () { fig.classList.remove('is-loading'); fig.classList.add('is-missing'); });
  root.querySelectorAll('.bkr-bar').forEach(function (b) { b.hidden = false; });
  root.querySelectorAll('.bkr-prev').forEach(function (b) { b.addEventListener('click', function () { show(cur - 1, true, b.closest('.bkr-bar-bottom')); }); });
  root.querySelectorAll('.bkr-next').forEach(function (b) { b.addEventListener('click', function () { show(cur + 1, true, b.closest('.bkr-bar-bottom')); }); });
  root.querySelector('.bkr-jump').addEventListener('submit', function (e) { e.preventDefault(); show(parseInt(num.value, 10) || 1, true, false); });
  // 目錄、全部頁面：點了在閱讀器裡開（沒有 JavaScript 時是直接開圖）
  root.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[data-p]') : null;
    if (!a || e.ctrlKey || e.metaKey || e.shiftKey || e.button) return;
    e.preventDefault();
    show(+a.dataset.p, true, true);
  });
  document.addEventListener('keydown', function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    var t = e.target.tagName;
    if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return;
    if (e.key === 'ArrowLeft') show(cur - 1, true, false);
    else if (e.key === 'ArrowRight') show(cur + 1, true, false);
  });
  window.addEventListener('hashchange', function () { if (/p=\d+/.test(location.hash)) show(fromHash(), false, false); });
  window.addEventListener('popstate', function () { show(fromHash(), false, false); });

  // 目錄搜尋：子字串比對，不分大小寫
  var q = root.querySelector('.bkr-q'), cnt = root.querySelector('.bkr-count');
  if (q) {
    root.querySelector('.bkr-filter').hidden = false;
    var items = Array.prototype.slice.call(root.querySelectorAll('.bkr-toc-list li'));
    q.addEventListener('input', function () {
      var k = q.value.trim().toLowerCase(), n = 0;
      items.forEach(function (li) {
        var hit = !k || (li.textContent + ' ' + (li.getAttribute('data-k') || '')).toLowerCase().indexOf(k) >= 0;
        li.hidden = !hit; if (hit) n++;
      });
      cnt.textContent = k ? (n ? '找到 ' + n + ' 條' : '找不到，換個字試試') : '';
    });
  }
  show(fromHash(), false, /p=\d+/.test(location.hash));
})();
