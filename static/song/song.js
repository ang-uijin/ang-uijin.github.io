/* 民間歌謠站：影片（點了才載入 YouTube；合輯只播這一首的那一段）、歌詞／中譯切換、曲目表篩選 */
(function () {
  "use strict";

  /* ---------- 影片 ---------- */
  function fmt(n) { return String(Math.round(n)); }
  document.querySelectorAll(".yt-lite").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var id = btn.dataset.yt, start = parseFloat(btn.dataset.start || "0"), end = parseFloat(btn.dataset.end || "0");
      var src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id) + "?autoplay=1&rel=0&playsinline=1&enablejsapi=1";
      if (end) src += "&start=" + fmt(start) + "&end=" + fmt(end);
      var f = document.createElement("iframe");
      f.src = src; f.title = "影片"; f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen"; f.allowFullscreen = true;
      f.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
      btn.replaceWith(f);
      if (!end) return;
      /* 合輯：播到這一首的結尾就停；重播或拖到別首的範圍就拉回這一首的開頭。用 YouTube 播放器的 postMessage 介面，不另外載程式。 */
      function cmd(func, args) {
        f.contentWindow.postMessage(JSON.stringify({ event: "command", func: func, args: args || [] }), "*");
      }
      f.addEventListener("load", function () {
        f.contentWindow.postMessage(JSON.stringify({ event: "listening", id: 1, channel: "widget" }), "*");
      });
      window.addEventListener("message", function (ev) {
        if (ev.source !== f.contentWindow) return;
        var d; try { d = JSON.parse(ev.data); } catch (e) { return; }
        if (!d || d.event !== "infoDelivery" || !d.info || typeof d.info.currentTime !== "number") return;
        var t = d.info.currentTime;
        if (t >= end - 0.15) { cmd("pauseVideo"); cmd("seekTo", [start, true]); }
        else if (t < start - 1) { cmd("seekTo", [start, true]); }
      });
    });
  });
  /* 影片與錄音不要同時出聲 */
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
    var total = rows.length;
    rows.forEach(function (r) { r._text = r.textContent.replace(/\s+/g, " "); });
    var qs = new URLSearchParams(location.search);
    ["region", "place", "kind", "q"].forEach(function (k) { if (qs.get(k)) form.elements[k].value = qs.get(k); });
    ["v", "l"].forEach(function (k) { if (qs.get(k) === "1") form.elements[k].checked = true; });
    function apply(push) {
      var region = form.elements.region.value, place = form.elements.place.value, kind = form.elements.kind.value;
      var v = form.elements.v.checked, l = form.elements.l.checked, q = form.elements.q.value.trim();
      /* 選了地區，鄉鎮選單只留那一區的 */
      Array.prototype.forEach.call(form.elements.place.options, function (o) {
        o.hidden = !!(region && o.dataset.region && o.dataset.region !== region);
      });
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
