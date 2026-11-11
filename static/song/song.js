/* 民間歌謠站：影片（點了才載入 YouTube；合輯只播這一首的那一段）、歌詞／中譯切換、曲目表篩選 */
(function () {
  "use strict";

  /* ---------- 影片 ---------- */
  document.querySelectorAll(".yt-lite").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var id = btn.dataset.yt, start = parseFloat(btn.dataset.start || "0") || 0, end = parseFloat(btn.dataset.end || "0") || 0;
      var src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id) + "?autoplay=1&rel=0&playsinline=1&enablejsapi=1";
      /* 合輯：網址的 start／end 只能是整數秒。start 取整數秒往前、end 多留 2 秒當保險（萬一下面的程式沒收到播放器的回報，
         也只會多播一兩秒）；精確的起訖（小數）由下面的程式守。 */
      if (end) src += "&start=" + Math.floor(start) + "&end=" + (Math.ceil(end) + 2);
      var f = document.createElement("iframe");
      f.src = src; f.title = "影片"; f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen"; f.allowFullscreen = true;
      f.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
      btn.replaceWith(f);
      try { f.focus(); } catch (e) {}
      /* 影片與錄音不要同時出聲 */
      document.querySelectorAll(".sg-audio audio").forEach(function (a) { a.pause(); });
      if (!end) return;
      /* 用 YouTube 播放器的 postMessage 介面（不另外載程式）：
         第一次回報時間時跳到這一首精確的起點；播到終點前 0.2 秒就拉回起點並暫停；
         拖到別首的範圍、或播放器自己走到結束狀態，也拉回這一首的起點。 */
      var aligned = false, state = -1;
      function cmd(func, args) {
        f.contentWindow.postMessage(JSON.stringify({ event: "command", func: func, args: args || [] }), "*");
      }
      function backToStart() { cmd("seekTo", [start, true]); cmd("pauseVideo"); }
      f.addEventListener("load", function () {
        f.contentWindow.postMessage(JSON.stringify({ event: "listening", id: 1, channel: "widget" }), "*");
      });
      window.addEventListener("message", function (ev) {
        if (ev.source !== f.contentWindow) return;
        var d; try { d = JSON.parse(ev.data); } catch (e) { return; }
        if (!d || d.event !== "infoDelivery" || !d.info) return;
        if (typeof d.info.playerState === "number") state = d.info.playerState;
        if (state === 0) { state = 2; backToStart(); return; }             /* 播放器自己結束了（合輯的最後一首） */
        if (typeof d.info.currentTime !== "number") return;
        var t = d.info.currentTime;
        if (!aligned) {
          /* 等播放器真的開始播（狀態 1）才對齊：還沒開始播就 seekTo，有時會讓自動播放停在原地 */
          if (state !== 1) return;
          aligned = true;
          if (t < start - 0.1 && t > start - 2) { cmd("seekTo", [start, true]); cmd("playVideo"); }
          return;
        }
        if (t >= end - 0.2) backToStart();
        else if (t < start - 1.2) cmd("seekTo", [start, true]);
      });
    });
  });
  document.querySelectorAll(".sg-audio audio").forEach(function (a) {
    a.addEventListener("play", function () {
      var f = document.querySelector(".sg-video iframe");
      if (f) f.contentWindow.postMessage(JSON.stringify({ event: "command", func: "pauseVideo", args: [] }), "*");
    });
  });

  /* ---------- 歌詞／中譯（窄螢幕才切換；寬螢幕兩欄都顯示） ---------- */
  var tabs = document.querySelectorAll(".sg-tab");
  function showPane(name) {
    tabs.forEach(function (t) { t.classList.toggle("is-on", t.dataset.pane === name); });
    document.querySelectorAll(".sg-pane").forEach(function (p) { p.classList.toggle("is-on", p.id === name); });
  }
  tabs.forEach(function (t) { t.addEventListener("click", function () { showPane(t.dataset.pane); }); });
  if (tabs.length && location.hash === "#trans") showPane("trans");

  /* ---------- 曲目表篩選 ---------- */
  var form = document.getElementById("sg-filter");
  if (form) {
    var rows = Array.prototype.slice.call(document.querySelectorAll(".sg-catalog .sg-table tbody tr"));
    var count = document.getElementById("sg-count"), empty = document.getElementById("sg-empty");
    var total = rows.length, el = form.elements;
    rows.forEach(function (r) { r._text = r.textContent.replace(/\s+/g, " "); });
    function hasOption(sel, v) {
      return Array.prototype.some.call(sel.options, function (o) { return o.value === v; });
    }
    var qs = new URLSearchParams(location.search);
    ["region", "place", "kind"].forEach(function (k) { var v = qs.get(k); if (v && hasOption(el[k], v)) el[k].value = v; });   /* 網址給了不存在的值就當沒給 */
    if (qs.get("q")) el.q.value = qs.get("q");
    ["v", "l"].forEach(function (k) { if (qs.get(k) === "1") el[k].checked = true; });
    function apply(push, changed) {
      var region = el.region.value;
      /* 選了地區：鄉鎮選單只留那一區的（iOS Safari 藏不了 option，所以同時設成不能選）；原本選的鄉鎮不在這一區就清掉 */
      Array.prototype.forEach.call(el.place.options, function (o) {
        var off = !!(region && o.dataset.region && o.dataset.region !== region);
        o.hidden = off; o.disabled = off;
      });
      var sel = el.place.options[el.place.selectedIndex];
      if (sel && sel.disabled) el.place.value = "";
      /* 反過來：選了鄉鎮、地區還沒選，不必動地區 */
      var place = el.place.value, kind = el.kind.value, v = el.v.checked, l = el.l.checked, q = el.q.value.trim();
      var n = 0;
      rows.forEach(function (r) {
        var ok = (!region || r.dataset.region === region) && (!kind || r.dataset.kind === kind) &&
                 (!place || (" " + r.dataset.place + " ").indexOf(" " + place + " ") >= 0) &&
                 (!v || r.dataset.v === "1") && (!l || r.dataset.l === "1") && (!q || r._text.indexOf(q) >= 0);
        r.hidden = !ok; if (ok) n++;
      });
      count.textContent = n === total ? "共 " + total + " 首" : "符合 " + n + " 首（共 " + total + " 首）";
      empty.hidden = n !== 0;
      if (push) {
        var p = new URLSearchParams();
        if (region) p.set("region", region); if (place) p.set("place", place); if (kind) p.set("kind", kind);
        if (v) p.set("v", "1"); if (l) p.set("l", "1"); if (q) p.set("q", q);
        var s = p.toString();
        history.replaceState(null, "", location.pathname + (s ? "?" + s : "") + location.hash);
      }
    }
    form.addEventListener("input", function () { apply(true); });
    form.addEventListener("reset", function () { setTimeout(function () { apply(true); }, 0); });
    apply(false);
  }
})();
