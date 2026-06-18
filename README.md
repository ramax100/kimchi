# 🥬 Kimchi Terminal

Terminal Linux asli yang berjalan di browser. Bisa dipakai untuk coding, menjalankan command, dan menggunakan Kimchi Coding AI agent.

---

## 🚀 Deploy Gratis di Render.com

### Langkah 1: Buat Akun Render
1. Buka https://render.com
2. Klik **Get Started** → Sign up pakai GitHub

### Langkah 2: Deploy
1. Klik **New** → **Web Service**
2. Pilih repo **`ramax100/kimchi`**
3. Isi:
   - **Name:** `kimchi-terminal`
   - **Branch:** `main`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** **Free**
4. Klik **Deploy Web Service**
5. Tunggu 2-3 menit. URL akan muncul seperti: `https://kimchi-terminal.onrender.com`

---

## 📖 Cara Menggunakan

### Buka Terminal
1. Buka URL Render kamu di browser (misal `https://kimchi-terminal.onrender.com`)
2. Tunggu sampai status "Connected" (hijau)
3. Kamu sekarang punya terminal Linux asli!

### Command Dasar
```bash
# Cek lokasi
pwd

# Lihat isi folder
ls

# Buat folder
mkdir project-saya

# Masuk folder
cd project-saya

# Buat file
echo "Hello World" > hello.txt

# Lihat isi file
cat hello.txt
```

---

## 🥬 Menggunakan Kimchi Coding (AI Agent)

### Langkah 1: Buat Akun Kimchi
1. Buka https://app.kimchi.dev
2. Daftar akun baru (gratis)
3. Setelah login, buka **Settings** → buat **API Key**
4. Copy API key-nya

### Langkah 2: Install Kimchi di Terminal
Buka terminal di browser, lalu ketik:
```bash
curl -fsSL https://github.com/getkimchi/kimchi/releases/latest/download/install.sh | bash
```

### Langkah 3: Login dengan API Key
```bash
export KIMCHI_API_KEY="paste-api-key-kamu-disini"
```

### Langkah 4: Jalankan Kimchi
```bash
kimchi
```

### Langkah 5: Pilih Mode
Setelah jalan, pilih salah satu:
- **[1] /ferment workflow** — Kimchi bekerja sendiri secara otomatis
- **[2] Just chat and code** — Kamu ngobrol dan kasih instruksi

---

## 💡 Contoh Penggunaan Kimchi

### Chat Mode (Mode Ngobrol)
```
> Buatkan website landing page dengan HTML dan CSS
> Fix bug di file server.js
> Jelaskan cara kerja kode ini
```

### Ferment Mode (Mode Otomatis)
```bash
/ferment Buatkan REST API dengan Express.js
```
Kimchi akan:
1. Menganalisis task
2. Membuat rencana
3. Menulis kode
4. Mengevaluasi hasilnya

### Command Berguna Lainnya
```bash
kimchi --plan          # Mode perencanaan saja (tidak edit file)
kimchi setup           # Setup ulang
kimchi update          # Update ke versi terbaru
kimchi --version       # Cek versi

# Dalam session:
/help                  # Lihat semua command
/ferment [tugas]       # Mulai ferment workflow
/bug [deskripsi]       # Laporkan bug
/login                 # Login ulang
```

---

## ⚠️ Catatan Penting

- **Free tier Render** akan sleep setelah 15 menit tidak dipakai. Pertama buka butuh ~30 detik.
- **Kimchi butuh API key** karena terminal ini headless (tidak bisa buka browser untuk login).
- **Data tidak permanen** — setiap kali Render restart, file yang dibuat hilang.
- Untuk menyimpan kode, gunakan `git` untuk push ke GitHub.

---

## 🛠️ Jalankan Lokal

```bash
git clone https://github.com/ramax100/kimchi.git
cd kimchi
npm install
npm start
# Buka http://localhost:3000
```

---

## Tech Stack

| Komponen | Teknologi |
|----------|-----------|
| Backend | Node.js, Express, express-ws, node-pty |
| Frontend | xterm.js (dari CDN) |
| Koneksi | WebSocket real-time |
| Hosting | Render.com (gratis) |

## License

MIT
