# Kimchi Terminal

Real web-based terminal emulator. A full Linux shell in your browser via WebSocket.

## Deploy on Render (Free)

1. Fork/push this repo to GitHub
2. Go to [render.com](https://render.com) > New > Web Service
3. Connect your GitHub repo
4. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
5. Deploy!

## Local Development

```bash
npm install
npm start
# Open http://localhost:3000
```

## Tech Stack

- **Backend:** Node.js + Express + express-ws + node-pty
- **Frontend:** xterm.js (loaded from CDN)
- **Protocol:** WebSocket for real-time I/O

## License

MIT
