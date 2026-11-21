# Item Catalogue — setup (v1.1.0)

Files for GitHub Pages (all in the SAME folder): index.html, manifest.json, sw.js, icon-180.png, icon-192.png, icon-512.png, icon-maskable-512.png
Code.gs is NOT uploaded to GitHub — it goes into Apps Script.

## 1. Folder sharing
Drive → JAIN WIRE ITEMS → Share → General access → Anyone with the link: Viewer (photos need this to show on salesmen's phones).

## 2. Code.gs (unchanged since v1.0.0)
1. script.google.com → New project "Item Catalogue" → paste Code.gs.
2. Project Settings → Script properties → ADMIN_PASSWORD = your password.
3. Deploy → New deployment → Web app → Execute as Me, Access Anyone → Deploy → copy the URL.

## 3. index.html
Paste the web app URL into the line `const API_URL='';` then push to GitHub and turn on Pages.
With API_URL empty the page runs in DEMO mode (admin password 1234).

## 4. Install on phone (PWA)
Open the GitHub Pages link in Chrome → tap Install app (bottom of the page) or menu → Install app / Add to Home screen.
iPhone: Safari → Share → Add to Home Screen.
After an update, the version shows at the bottom of the page (v1.1.0).

## 5. Details & sharing
Admin login (bottom of page) → tap an item → fill Sizes / Weight / Length / Notes → Save (stored in item-details.json in the Drive folder).
Salesmen: tap photo → Share on WhatsApp, or Select several → Share. "Add details text" is optional.
