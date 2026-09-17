# 2026-09-17 實際服務驗證

使用正式專案公開金鑰，透過 `node tests/live-cloud.cjs` 測試：

- Anonymous Sign-Ins 已開啟，公開排行榜可不登入讀取。
- 未登入者不能開局、刪除成績或直接讀取資料表。
- 已登入者仍不能直接讀寫資料表。
- 玩家 B 不能替玩家 A 提交場次，B 的刪除不影響 A。
- 不合理距離被拒絕；合理輸入由伺服器計為 25 分。
- 重複提交不能修改已結算分數。
- 今日排行可取得自己的名次，回傳不含玩家 ID、token 或場次 ID。
- 兩位測試身分的測試場次皆已刪除；匿名驗證帳號仍留在 Supabase Auth，不含玩家個资。

遠端行為與目前 setup.sql 的權限設計相符；Safari SQL Editor 也顯示包含公開排行與自行刪除授權的 SQL 成功執行。未以管理 API 比對每個函式的完整原始碼。

## CAPTCHA 待完成

前端已接上 Turnstile widget、取消／逾時處理及 Supabase `gotrue_meta_security.captcha_token`。
目前 `js/captcha.js` 的 siteKey 為空，**正式 CAPTCHA 尚未啟用**。

1. Cloudflare Turnstile 建立 Managed widget，允許 hostname `sunsyuewei.github.io`。
2. 將公開 Site Key 填入 `js/captcha.js` 並部署。
3. 將 Secret Key 只填入 Supabase Authentication 的 CAPTCHA 設定，provider 選 Turnstile。
4. 用全新瀏覽器身分確認合法驗證可登入、沒有 token 的 signup 被拒絕。

CAPTCHA 啟用後 live-cloud.cjs 的無 token 註冊應失敗；這是預期保護，不能為了測試而關掉 CAPTCHA。CAPTCHA 保護註冊，不能保證已登入玩家不偽造成績。
