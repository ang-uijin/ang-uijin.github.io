#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""PDF 內文搜尋的索引：data/pdftext/**.json（每份 PDF 的逐頁文字）→ static/pdfsearch/

用法： python tools/pdfsearch_build.py [repo 根目錄]      （只用標準函式庫；部署時在 hugo 之前跑）
輸出：
  meta.json     {"files": [[PDF 網址, 標題], …], "pages": [[檔序, 頁碼, 品質], …], "shards": N, "chunk": K, "fold": "敎教 靑青 …"}
                品質：0 原有文字層、1 模型校讀過、2 未校（只有 Windows OCR）、3 手寫稿
  idx/<n>.json  {token: [頁序的差值…]}   token 依雜湊分片；查詢時只抓用得到的幾片
  txt/<n>.json  [第 n*K … n*K+K-1 頁的原文]   查到候選頁之後抓來確認整串字、取前後文

比對規則（建索引與瀏覽器查詢共用，瀏覽器那份在 static/js/pdfsearch.js，兩邊要一致）：
  逐字做 NFKD → 去掉附加符號（調符）→ NFKC → 小寫 → 舊字形／異體折成常用字（FOLD）；
  空白只在「前後都不是漢字」時留一個，其餘拿掉。
  token：漢字單字＋相鄰雙字；拉丁字母與數字的詞 3 個字元以內整個算一個，較長的拆成三連。
"""
import json
import os
import re
import sys
import time
import unicodedata
from urllib.parse import unquote

SHARDS = 256
CHUNK = 16
FOLD_PAIRS = ("敎教 靑青 硏研 吿告 淸清 汚污 汙污 爲為 内內 却卻 眞真 尙尚 旣既 槪概 緖緒 敍敘 絶絕 説說 户戶 黄黃 産產 税稅 脱脫 閲閱 鋭銳 "
              "别別 吴吳 吕呂 没沒 温溫 兪俞 増增 徳德 麽麼 値值 卽即 鄕鄉 郞郎 晩晚 啓啟 裏裡 臺台 峯峰 羣群 牀床 衆眾 够夠 强強 脚腳 "
              "愼慎 玆茲 喩喻 嗳噯 顔顏 擧舉 歴歷 暦曆 黒黑 澁澀 僞偽 册冊 鷄雞 鑒鑑 綫線 緑綠 録錄 戯戲 揷插 査查 姉姊 "
              "凉涼 况況 冲沖 决決 净淨 减減 凑湊 咏詠 歎嘆 潜潛 濶闊 灾災 烟煙 猪豬 畧略 祕秘 綉繡 耻恥 "
              "謡謠 遥遙 隣鄰 髙高 麪麵 囘回 囬回 廻迴 徧遍 鬪鬥 鬭鬥 闘鬥 塲場 塜塚 柺枴 啟啟 爭爭 於於")
FOLD = {p[0]: p[1] for p in FOLD_PAIRS.split() if len(p) == 2 and p[0] != p[1]}


def is_han(o):
    return (0x4E00 <= o <= 0x9FFF or 0x3400 <= o <= 0x4DBF or 0x20000 <= o <= 0x3134F or 0xF900 <= o <= 0xFAFF)


def norm_char(c, _cache={}):
    r = _cache.get(c)
    if r is None:
        d = unicodedata.normalize("NFKD", c)
        d = "".join(x for x in d if not unicodedata.category(x).startswith("M"))
        d = unicodedata.normalize("NFKC", d).lower()
        r = _cache[c] = "".join(FOLD.get(x, x) for x in d)
    return r


def norm(s):
    out = []
    pending = False
    for c in s:
        if c.isspace():
            pending = True
            continue
        n = norm_char(c)
        if not n or n.isspace():
            if n:
                pending = True
            continue
        if pending and out and not (is_han(ord(out[-1][-1])) or is_han(ord(n[0]))):
            out.append(" ")
        pending = False
        out.append(n)
    return "".join(out)


RE_WORD = re.compile(r"[0-9a-z]+")


def tokens(s):
    out = set()
    run = []

    def flush():
        out.update(run)
        out.update(run[i] + run[i + 1] for i in range(len(run) - 1))
        run.clear()
    for c in s:
        if is_han(ord(c)):
            run.append(c)
        elif run:
            flush()
    flush()
    for w in RE_WORD.findall(s):
        if len(w) <= 3:
            out.add(w)
        else:
            out.update(w[i:i + 3] for i in range(len(w) - 2))
    return out


def fnv(s, n):
    h = 0x811C9DC5
    for b in s.encode("utf-8"):
        h = ((h ^ b) * 0x01000193) & 0xFFFFFFFF
    return h % n


def load_titles(root):
    """PDF 網址 → 條目標題（content/**/*.md 的 front matter file／link，與手寫 HTML 頁內文的連結文字）。"""
    titles = {}
    for d, _dirs, files in os.walk(os.path.join(root, "content")):
        for fn in files:
            if not fn.endswith(".md"):
                continue
            txt = open(os.path.join(d, fn), encoding="utf-8").read()
            fm = {}
            if txt.startswith("---"):
                end = txt.find("\n---", 3)
                for line in txt[3:end].splitlines():
                    m = re.match(r"^(\w+):\s*(.*)$", line)
                    if m:
                        v = m.group(2).strip()
                        if len(v) >= 2 and v[0] == v[-1] and v[0] in "'\"":
                            v = v[1:-1].replace("''", "'")
                        fm[m.group(1)] = v
            for k in ("file", "link"):
                v = unquote(fm.get(k, ""))
                if v.lower().endswith(".pdf") and v.startswith("/") and fm.get("title"):
                    titles.setdefault(v, re.sub(r"<[^>]+>", "", fm["title"]))
            for m in re.finditer(r'<a\s[^>]*href="(/[^"]+?\.pdf)"[^>]*>(.*?)</a>', txt, re.I | re.S):
                t = re.sub(r"<[^>]+>", "", m.group(2)).strip()
                if t:
                    titles.setdefault(unquote(m.group(1)), t)
    return titles


def quality(pg):
    flags = pg.get("flags", [])
    if "手寫" in flags:
        return 3
    if pg["source"] == "textlayer":
        return 0
    if pg["source"] == "llm":
        return 1
    return 2


def main():
    root = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
    src = os.path.join(root, "data", "pdftext")
    out = os.path.join(root, "static", "pdfsearch")
    t0 = time.time()
    titles = load_titles(root)
    files, pages, texts, post = [], [], [], {}
    paths = []
    for d, _dirs, fns in os.walk(src):
        paths += [os.path.join(d, fn) for fn in fns if fn.endswith(".pdf.json")]
    for p in sorted(paths):
        doc = json.load(open(p, encoding="utf-8"))
        url = doc["url"]
        fi = len(files)
        files.append([url, titles.get(url) or os.path.basename(url)[:-4]])
        for pg in doc["pages"]:
            text = re.sub(r"[ \t\r\f\v]+", " ", pg.get("text") or "").strip()
            n = norm(text)
            if not n:
                continue
            pid = len(pages)
            pages.append([fi, pg["n"], quality(pg)])
            texts.append(text)
            for tok in tokens(n):
                post.setdefault(tok, []).append(pid)
    for sub in ("idx", "txt"):
        d = os.path.join(out, sub)
        os.makedirs(d, exist_ok=True)
        for fn in os.listdir(d):
            os.remove(os.path.join(d, fn))
    shards = [dict() for _ in range(SHARDS)]
    for tok, ids in post.items():
        shards[fnv(tok, SHARDS)][tok] = [ids[0]] + [b - a for a, b in zip(ids, ids[1:])]
    size = 0
    for i, sh in enumerate(shards):
        s = json.dumps(sh, ensure_ascii=False, separators=(",", ":"))
        size += len(s.encode("utf-8"))
        with open(os.path.join(out, "idx", f"{i}.json"), "w", encoding="utf-8", newline="\n") as f:
            f.write(s)
    for i in range(0, len(texts), CHUNK):
        s = json.dumps(texts[i:i + CHUNK], ensure_ascii=False, separators=(",", ":"))
        size += len(s.encode("utf-8"))
        with open(os.path.join(out, "txt", f"{i // CHUNK}.json"), "w", encoding="utf-8", newline="\n") as f:
            f.write(s)
    meta = {"files": files, "pages": pages, "shards": SHARDS, "chunk": CHUNK, "fold": " ".join(k + v for k, v in FOLD.items())}
    s = json.dumps(meta, ensure_ascii=False, separators=(",", ":"))
    size += len(s.encode("utf-8"))
    with open(os.path.join(out, "meta.json"), "w", encoding="utf-8", newline="\n") as f:
        f.write(s)
    notitle = sum(1 for u, t in files if u not in titles)
    print(f"pdfsearch: {len(files)} files ({notitle} without an entry title), {len(pages)} pages, {len(post)} tokens, "
          f"{size / 1e6:.1f} MB, {time.time() - t0:.1f}s")


if __name__ == "__main__":
    main()
