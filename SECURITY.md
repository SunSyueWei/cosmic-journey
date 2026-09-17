# 安全與事件處理

## 目前設計

- `js/cloud-config.js` 只含 Supabase URL 與 `sb_publishable_` Publishable Key。這是瀏覽器必須取得的公開設定，不是密碼。
- 絕不提交 `service_role`、`sb_secret_`、資料庫密碼、OAuth client secret、JWT signing key 或任何 `.env` 內容。
- 共用排行榜採匿名登入；玩家必須勾選參加才上傳。排行榜只回傳暱稱、分數、距離與名次，暱稱限制 10 個字，並提醒不要填個資。
- Supabase table 開啟 RLS，撤銷直接讀寫；公開排行榜 RPC 只回傳排名欄位，其餘受限 RPC 才可開局、提交及刪除自己的成績。分數由資料庫依距離、時間、卡片數重算。
- GitHub Pages 使用 HTTPS；前端 CSP 限制腳本、樣式、圖片及網路請求來源，並設定 `no-referrer`。GitHub Pages 無法自訂所有 HTTP security headers，因此要更嚴格的 clickjacking／Permissions-Policy 防護時，應在 Cloudflare Pages 或自有反向代理補上 headers。

## 發布前檢查

1. 在 Supabase 確認 Anonymous Sign-Ins、RLS 及 `supabase/setup.sql` 已成功套用。
2. 活動公開時，將 CAPTCHA/Turnstile 與匿名註冊 token 介接後再強制開啟；同時觀察 Auth 與 RPC 請求量。
3. GitHub 帳號開啟 2FA；Repository 設定只允許受信任帳號推送 `main`，並檢查 Pages 網域與 HTTPS。
4. 活動前用手機測試：未勾選不上傳、勾選可上傳、排行榜可見、刪除自己的成績、清除網站資料後不會誤認成原玩家。

## 如果不小心洩漏私密金鑰

1. 立即在 Supabase Dashboard 撤銷／輪替該 `service_role`、`sb_secret_` 或資料庫密碼；不要只刪 GitHub 檔案。
2. 檢查 Supabase Auth、Database 與 GitHub audit/logs，必要時刪除受影響的匿名成績及重新部署。
3. 從 Git 歷史移除洩漏內容並通知所有曾取得該金鑰的人；新的金鑰只能透過本機環境變數或 CI secret 注入，不能寫入前端。

Publishable Key 洩漏不需要當作私密金鑰輪替；但若它與 RLS/函式權限設定不符，應先停用 `enabled`、修正資料庫權限，再重新測試。

## 玩家資料請求

玩家可在遊戲頁取消後續上傳或按「刪除我的雲端成績」。若玩家清除瀏覽器資料而失去匿名身分，主辦人需依暱稱、時間與分數等資訊人工確認歸屬後再處理刪除，避免刪到同名玩家。
