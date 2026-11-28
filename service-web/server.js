const express = require("express");
const path = require("path");
const cors = require("cors");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const PYTHON_SERVICE_URL = process.env.PYTHON_API_URL || "https://ipds-smart-portal.vercel.app";
const ADMIN_PIN = process.env.ADMIN_PIN || "ipds2026";

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sajikan file HTML statis dari folder public
app.use(express.static(path.join(__dirname, "public")));

// Koneksi PostgreSQL Supabase
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const upload = multer({ storage: multer.memoryStorage() });

// ==========================================================
// 1. ENDPOINT PORTAL LINK (CRUD LANGSUNG KE POSTGRESQL)
// ==========================================================
app.get("/api/portal/links", async (req, res) => {
  try {
    const catResult = await pool.query("SELECT * FROM categories ORDER BY urutan ASC, id ASC;");
    const linkResult = await pool.query(`
      SELECT l.*, c.nama AS category_name
      FROM links l
      LEFT JOIN categories c ON l.category_id = c.id
      ORDER BY l.is_pinned DESC, l.created_at DESC, l.id DESC;
    `);
    res.json({
      categories: catResult.rows,
      links: linkResult.rows,
    });
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil data portal link", detail: err.message });
  }
});

app.post("/api/portal/links", async (req, res) => {
  const { category_id, judul, deskripsi, url, pic, badge_info, is_pinned, pin } = req.body;
  if (pin && pin !== ADMIN_PIN) {
    return res.status(401).json({ error: "PIN Admin IPDS salah!" });
  }
  if (!judul || !url) {
    return res.status(400).json({ error: "Judul dan URL wajib diisi." });
  }
  try {
    const insertRes = await pool.query(
      `INSERT INTO links (category_id, judul, deskripsi, url, pic, badge_info, is_pinned)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;`,
      [
        category_id || 1,
        judul,
        deskripsi || "",
        url,
        pic || "Tim IPDS",
        badge_info || "Web Internal",
        Boolean(is_pinned),
      ]
    );
    res.status(201).json({ message: "Link berhasil ditambahkan", data: insertRes.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Gagal menyimpan link baru", detail: err.message });
  }
});

app.delete("/api/portal/links/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM links WHERE id = $1;", [req.params.id]);
    res.json({ message: "Link berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ error: "Gagal menghapus link", detail: err.message });
  }
});

// ==========================================================
// 2. API GATEWAY KE LAYANAN PYTHON FASTAPI (DISTRIBUTED)
// ==========================================================
app.post("/api/gateway/etl/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "File Excel/CSV belum dipilih." });
  }
  try {
    const form = new FormData();
    form.append("file", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });
    form.append("nama_indikator", req.body.nama_indikator || "Persentase Kemiskinan Makro");
    form.append("satuan", req.body.satuan || "Persen (%)");
    form.append("tahun_default", req.body.tahun_default || "2025");

    const response = await axios.post(`${PYTHON_SERVICE_URL}/api/etl/upload`, form, {
      headers: form.getHeaders(),
    });
    res.json(response.data);
  } catch (err) {
    const status = err.response?.status || 500;
    const detail = err.response?.data?.detail || err.message;
    res.status(status).json({ error: "Gagal memproses ETL di service Python", detail });
  }
});

app.get("/api/gateway/etl/logs", async (req, res) => {
  try {
    const response = await axios.get(`${PYTHON_SERVICE_URL}/api/etl/logs`);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil log ETL dari Python", detail: err.message });
  }
});

app.get("/api/gateway/analytics/run", async (req, res) => {
  try {
    const indikator = req.query.indikator || "Persentase Kemiskinan Makro";
    const response = await axios.get(`${PYTHON_SERVICE_URL}/api/analytics/run`, {
      params: { indikator },
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Gagal menjalankan model AI Python", detail: err.message });
  }
});

// Route halaman bersih
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/etl", (req, res) => res.sendFile(path.join(__dirname, "public", "etl.html")));
app.get("/analytics", (req, res) => res.sendFile(path.join(__dirname, "public", "analytics.html")));

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`IPDS Smart Portal Web Server aktif di: http://localhost:${PORT}`);
  console.log(`Terhubung ke Python Analytics Engine: ${PYTHON_SERVICE_URL}`);
  console.log(`====================================================`);
});