# Chrome 圖片轉存插件

對網頁圖片按右鍵 → **將圖片轉存為…** → **JPG / PNG / WEBP** → 選擇儲存位置。
真正重新編碼圖片，不只是修改副檔名。無需安裝套件、登入或 API 金鑰。

## 安裝

1. 如果拿到 ZIP，先解壓縮。
2. 在 Chrome 網址列輸入 `chrome://extensions`。
3. 開啟右上角「開發人員模式」。
4. 按「載入未封裝項目」，選擇本專案的 **image-format-saver** 資料夾（裡面有 `manifest.json`）。
5. 回到一般網頁，對圖片按右鍵使用。

轉換時會開啟結果分頁，顯示預覽並自動開啟另存新檔視窗；儲存完成後可以關閉。取消儲存可以按「再次另存新檔」。點擊工具列插件圖示可查看使用方式。

## 格式與限制

- JPG：品質 95%，透明區域補白底。
- PNG：無損輸出，保留透明度。
- WEBP：品質 95%，保留透明度。
- GIF、動態 WEBP 等動畫只輸出靜態畫面，不保留動畫。
- 支援 Chrome 可解碼的圖片，包括常見 JPEG、PNG、WEBP、AVIF、GIF、SVG。SVG 必須有可用尺寸，外部資源可能無法載入。
- 保留解碼後像素尺寸，不保留 EXIF 等原始中繼資料；瀏覽器可能進行色彩轉換。
- 輸入上限 50 MB、4,000 萬像素，單邊上限 16,384 像素。
- 網站登入、防盜連、付費或存取限制可能導致失敗；插件不繞過網站限制。
- 支援 `blob:` 暫存圖片（例如網頁產生的圖片預覽）；轉存完成前請保持原圖片分頁開啟，暫存網址必須仍有效。
- 不支援 `file:` 本機圖片、CSS 背景、canvas 或 Chrome 內建頁面。

## 權限與隱私

- `contextMenus`：建立圖片右鍵選單。
- `downloads`：顯示另存新檔視窗並確認下載狀態。
- `scripting`：選擇轉存暫存圖片時，在原圖片所在分頁／框架內讀取該 `blob:` 圖片，不掃描對話或網頁文字。
- HTTP / HTTPS 網站存取權：讀取使用者點選的跨網域圖片。僅在選擇轉存時請求圖片，可能隨請求攜帶網站登入 Cookie。
- 無追蹤、無外部 JavaScript、無轉檔伺服器，不讀取整個網頁內容。

## 開發參考

採用 Manifest V3。背景 service worker 建立右鍵選單，獨立擴充功能分頁使用 Canvas 重新編碼，再透過 downloads API 儲存。

- [Chrome 右鍵選單 API](https://developer.chrome.com/docs/extensions/reference/api/contextMenus)
- [Chrome 跨來源請求與主機權限](https://developer.chrome.com/docs/extensions/develop/concepts/network-requests)
- [Chrome 下載 API](https://developer.chrome.com/docs/extensions/reference/api/downloads)
- [Chrome 指定分頁與框架執行腳本](https://developer.chrome.com/docs/extensions/reference/api/scripting)

## 更新至 1.1.0

已修正暫存圖片無法轉存的問題。在 `chrome://extensions` 找到本插件，按重新載入，再回到原網頁對圖片按右鍵。若出現新增權限提示，需允許更新後才能使用。若從其他位置安裝，請使用新版 ZIP 更新該資料夾或重新載入本專案的 `image-format-saver` 資料夾。

## 驗證

已以獨立 Chromium 載入擴充功能，驗證 JPG / PNG / WEBP 下載檔案的格式簽章、像素尺寸、透明度與完成狀態，以及檔名清理、選單路由、HTTP 403、無效圖片、暫存網址錯誤處理。
測試檔為 `tests/verify.cjs`，需可解析的 Playwright 套件與支援載入擴充功能的 Chromium；可用 `TEST_CHROMIUM` 指定執行檔，執行 `node tests/verify.cjs`。
無介面測試會略過作業系統儲存視窗；實際右鍵選單外觀、Windows 儲存對話框及取消操作仍需人工確認。
