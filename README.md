# 治言齋 - 洪惟仁教授個人網站

這是洪惟仁 (Ang Uijin) 教授的個人網站，使用 Hugo 靜態網站生成器建置。

## 安裝 Hugo

### 方法一：使用 Winget（Windows 推薦）

打開 PowerShell 或命令提示字元，執行：

```bash
winget install Hugo.Hugo.Extended
```

### 方法二：使用 Chocolatey

如果您已安裝 Chocolatey，可以執行：

```bash
choco install hugo-extended -y
```

### 方法三：手動安裝

1. 前往 [Hugo Releases 頁面](https://github.com/gohugoio/hugo/releases)
2. 下載最新的 `hugo_extended_*_windows-amd64.zip`
3. 解壓縮檔案
4. 將 `hugo.exe` 複製到一個在 PATH 中的目錄（例如 `C:\Windows\System32`）

### 驗證安裝

安裝完成後，在命令提示字元中執行：

```bash
hugo version
```

如果看到版本資訊，表示安裝成功！

## 本地預覽網站

在專案目錄下執行：

```bash
hugo server
```

然後在瀏覽器中開啟 `http://localhost:1313` 即可預覽網站。

## 建置網站

執行以下命令來建置靜態網站檔案：

```bash
hugo
```

建置完成的檔案會放在 `public/` 目錄中。

## 部署到 GitHub Pages

### 1. 建立 GitHub Repository

在 GitHub 上建立一個新的 repository，名稱可以是 `ang-uijin` 或您偏好的名稱。

### 2. 初始化 Git 並推送

在專案目錄下執行：

```bash
git init
git add .
git commit -m "Initial commit: 洪惟仁教授網站"
git branch -M main
git remote add origin https://github.com/您的使用者名稱/ang-uijin.git
git push -u origin main
```

### 3. 設定 GitHub Actions

建立 `.github/workflows/hugo.yml` 檔案，內容如下：

```yaml
name: Deploy Hugo site to Pages

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

defaults:
  run:
    shell: bash

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Hugo
        uses: peaceiris/actions-hugo@v2
        with:
          hugo-version: 'latest'
          extended: true
      - name: Build
        run: hugo --minify
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2
        with:
          path: ./public

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v2
```

### 4. 啟用 GitHub Pages

1. 前往 Repository 的 Settings > Pages
2. 在 "Source" 下選擇 "GitHub Actions"
3. 推送變更後，網站會自動建置並部署

## 網站結構

```
ang-uijin/
├── content/          # 網站內容（Markdown 檔案）
│   └── aboutme.md   # 簡介頁面
├── layouts/         # 網站模板
│   ├── index.html   # 首頁模板
│   ├── _default/    # 預設模板
│   │   ├── baseof.html
│   │   └── single.html
│   └── partials/    # 部分模板
│       └── navbar.html
├── static/          # 靜態檔案
│   ├── css/         # CSS 樣式
│   ├── js/          # JavaScript
│   └── images/      # 圖片
├── hugo.toml        # Hugo 配置檔
└── README.md        # 說明文件
```

## 新增內容

要新增新的頁面，在 `content/` 目錄下建立 Markdown 檔案。例如：

```bash
hugo new bio.md
```

然後編輯該檔案，加入內容。

## 技術支援

如有任何問題，請聯絡網站開發者。
