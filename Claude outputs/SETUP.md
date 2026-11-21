# Jain Wire Item Catalogue — setup (v1.0.0)

## 1. Folder sharing (needed so photos show on salesmen's phones)
Drive → folder **JAIN WIRE ITEMS** → Share → General access → **Anyone with the link: Viewer**.

## 2. Code.gs
1. Go to script.google.com → New project → name it "Item Catalogue".
2. Delete the default code, paste all of `Code.gs`.
3. Project Settings (gear) → Script properties → Add `ADMIN_PASSWORD` = your password.
4. Deploy → New deployment → type **Web app** → Execute as **Me** → Who has access **Anyone** → Deploy → allow permissions.
5. Copy the Web app URL.
(After any later change to Code.gs: Deploy → Manage deployments → Edit → New version.)

## 3. index.html
1. Open `index.html`, find the line `const API_URL='';` and paste the web app URL between the quotes.
2. Upload to GitHub Pages (same as your other tools). Send that link to the salesmen.
   (With API_URL empty, the page opens in DEMO mode with fake items; admin password in demo is 1234.)

## 4. Adding details
Open the page → **Admin** → password → tap an item → fill Sizes / Weight / Length / Notes → Save.
Details are saved in `item-details.json` inside the JAIN WIRE ITEMS folder. New photos added to Drive appear within 10 minutes, or press **Refresh** (admin).

## 5. Sharing (salesman)
- Tap a photo → **Share on WhatsApp** (sends the photo, with details text if ticked).
- Several items: tap **Select**, tick photos, then **Share on WhatsApp**.
- On a computer, sharing copies the details and photo links instead.
