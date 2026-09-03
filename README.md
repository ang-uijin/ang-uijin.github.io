# 治言齋 — 洪惟仁教授個人網站

洪惟仁（Ang Uijin）教授的個人網站，以 [Hugo](https://gohugo.io/) 建置的靜態網站，內容為繁體中文。

## 本地預覽

需要 Hugo extended 0.154 以上版本。

```bash
hugo server          # 開啟 http://localhost:1313
hugo --gc --minify   # 建置到 public/
```

站內搜尋使用 [Pagefind](https://pagefind.app/)，建置後執行：

```bash
npx -y pagefind@1.5.2 --site public
```

## 目錄結構

```
content/        網站內容（Markdown）；每個單元是一個資料夾，內有 _index.md
content/news/   最新動態，一篇文章一個檔案
layouts/        版面模板
static/css      樣式
static/js       前端腳本（輪播、選單、燈箱、教學網站分頁）
static/files    論文、講義等 PDF
static/images   照片與圖片
static/song     民間歌謠教學研究網（2004 年建置的靜態站，原樣保存）
static/admin    後台（Sveltia CMS）
hugo.toml       網站設定與選單
```

## 內容管理

網站內容可在 `/admin/` 以 [Sveltia CMS](https://github.com/sveltia/sveltia-cms) 編輯，登入需要具備此 repository 寫入權限的 GitHub 帳號。儲存後會自動 commit 並觸發部署。

## 部署

推送到 `main` 分支後，GitHub Actions（`.github/workflows/hugo.yml`）會建置網站並發佈到 GitHub Pages。`netlify.toml` 提供 Netlify 的同等設定。

## 版權

網站內容 © 洪惟仁 Uijin Ang，版權所有。
