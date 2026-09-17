# Supabase 共用排行榜啟用

目標專案：`https://awudkucbxwviqikwxcuz.supabase.co`

1. Supabase Dashboard → Authentication → Sign In / Providers → Anonymous Sign-Ins，開啟匿名登入並儲存。
2. SQL Editor 建立查詢，貼入 `setup.sql` 全部內容並 Run。這個腳本只建立本遊戲的 `cosmic_runs` 資料表及四個 `cosmic_` 函式，不修改其他專案資料；若先前已執行舊版，請重新執行（可重複安全套用）。
3. `js/cloud-config.js` 只放 Publishable Key 與 URL；本原型已把 `enabled` 設為 true。部署前先確認 SQL 成功、匿名登入可用，再推送 GitHub。
4. 若活動公開且要再降低機器人灌分，請在 Authentication → CAPTCHA 開啟 Turnstile；同時需把 CAPTCHA token 介接到 `cloud.js` 的匿名註冊請求，否則不要只在 Dashboard 單方面強制開啟。

公開金鑰可出現在 GitHub；不能放入 secret、service_role 或資料庫密碼。資料表啟用 RLS 且撤銷匿名／已登入用戶直接讀寫權限；只有公開排行榜函式可由 anon 讀取，其餘函式只允許 authenticated 開局、提交或刪除自己的成績。使用者 ID、匿名登入 token、場次 ID 不在排行榜回傳。

只有勾選「參加共用排行榜」後才會建立匿名身分並上傳本局成績；單純查看共用排行榜不建立帳號。換裝置或清除網站資料會變成新玩家，不會因暱稱相同覆蓋他人成績。今日排行以台灣日期計算，返回前 100 名以及本人名次。舊本機紀錄不匯入共用排行榜，避免把示範或未驗證分數當真實成績。遊戲頁可刪除目前匿名身分的所有雲端成績。

伺服器從距離、光門前後邀請卡數重新計分，核對遊戲時間與合理距離，場次只能提交一次。這是基本合理性驗證，不是完整的伺服器重播防作弊；可偽造合理範圍的客戶端輸入。每位身分每日最多 500 場，開局至少間隔 2 秒；匿名建立帳號仍受 Supabase Auth 本身的 IP 限制，活動前需用多支手機、同 Wi-Fi 測試。

測試：`node tests/cloud.cjs`、`node tests/privacy.cjs`、`node tests/smoke.cjs`、`node tests/audio.cjs`。HTTP mock 測試不代表遠端 SQL 已完成安裝。

本局連不上伺服器時仍可遊玩，結算明示僅存本機；查詢失敗顯示連線錯誤，不以示範資料冒充共用排名。收藏卡繼續只留在本機。Free 專案可能因低活動暫停，活動前確認狀態。
