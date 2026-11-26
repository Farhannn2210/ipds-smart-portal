# IPDS Smart Portal — BPS Provinsi Sulawesi Tengah

Sistem terintegrasi untuk manajemen tautan operasional, pipeline ETL data statistik 13 Kabupaten/Kota Sulawesi Tengah ke PostgreSQL Star Schema, serta analitik klastering (K-Means) dan proyeksi tren indikator makro (Ridge Regression).

## Arsitektur Sistem
1. **Portal Link (`/`):** Direktori tautan cepat dan dokumen kerja Fungsi IPDS terhubung ke database PostgreSQL.
2. **ETL Data Warehouse (`/etl`):** Parser otomatis Excel/CSV BPS (format *long* maupun *wide*), standarisasi kode wilayah `72.01`–`72.71`, audit kualitas data, dan *upsert* ke Star Schema (`dim_wilayah`, `dim_tahun`, `dim_indikator`, `fakta_indikator`, `etl_audit_logs`).
3. **Analytics & AI (`/analytics`):** Pengelompokan 13 Kabupaten/Kota menggunakan **Scikit-Learn K-Means** dan proyeksi tren 2026–2027 menggunakan **Ridge Regression**.

## Cara Menjalankan di Lokal
1. Salin `.env.example` menjadi `.env` dan isi `DATABASE_URL` Supabase.
2. Jalankan layanan Python FastAPI:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
3. Jalankan layanan Web (pada folder `service-web`):
   ```bash
   npm install
   node server.js
   ```