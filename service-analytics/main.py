import io
import os
import re
from typing import Any, Dict, List, Optional, Sequence, Set, Tuple

import numpy as np
import pandas as pd
import psycopg2
from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, File, Form, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from psycopg2.extras import RealDictCursor
from sklearn.cluster import KMeans
from sklearn.linear_model import Ridge

load_dotenv()

app = FastAPI(title="IPDS Smart Portal - ETL & AI Engine", version="2.7.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MASTER_WILAYAH = [
    ("72.01", "Banggai Kepulauan", ["72.01", "7201", "banggai kepulauan", "banggai kep", "bangkep"]),
    ("72.11", "Banggai Laut", ["72.11", "7211", "banggai laut", "balut"]),
    ("72.02", "Banggai", ["72.02", "7202", "banggai"]),
    ("72.12", "Morowali Utara", ["72.12", "7212", "morowali utara", "morut"]),
    ("72.03", "Morowali", ["72.03", "7203", "morowali"]),
    ("72.04", "Poso", ["72.04", "7204", "poso"]),
    ("72.05", "Donggala", ["72.05", "7205", "donggala"]),
    ("72.06", "Toli-Toli", ["72.06", "7206", "toli-toli", "tolitoli", "toli toli"]),
    ("72.07", "Buol", ["72.07", "7207", "buol"]),
    ("72.08", "Parigi Moutong", ["72.08", "7208", "parigi moutong", "parimo"]),
    ("72.09", "Tojo Una-Una", ["72.09", "7209", "tojo una-una", "tojo una una", "touna"]),
    ("72.10", "Sigi", ["72.10", "7210", "sigi"]),
    ("72.71", "Kota Palu", ["72.71", "7271", "kota palu", "palu"]),
]

KODE_NUMERIC_SET = {float(k) for k, _, _ in MASTER_WILAYAH}
IGNORE_KEYWORDS = [
    "sulawesi tengah",
    "provinsi",
    "72.00",
    "7200",
    "jumlah",
    "total",
    "rata-rata",
    "rata rata",
]


def get_db_connection():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        raise RuntimeError("DATABASE_URL belum diatur di file .env")
    if "supabase.co" in db_url and "sslmode=" not in db_url:
        sep = "&" if "?" in db_url else "?"
        db_url = f"{db_url}{sep}sslmode=require"
    return psycopg2.connect(db_url, cursor_factory=RealDictCursor)


def get_table_schema(cur, table_name: str) -> List[Tuple[str, str]]:
    cur.execute(
        """
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = %s
        ORDER BY ordinal_position;
        """,
        (table_name,),
    )
    return [(row["column_name"], row["data_type"]) for row in cur.fetchall()]


def pick_col(
    schema_cols: Sequence[Tuple[str, str]],
    candidates: Sequence[str],
    exclude: Optional[Set[str]] = None,
    prefer_types: Optional[Sequence[str]] = None,
) -> Optional[str]:
    exclude = exclude or set()
    col_names = [c for c, _ in schema_cols]
    for cand in candidates:
        if cand in col_names and cand not in exclude:
            return cand
    if prefer_types:
        for c, dtype in schema_cols:
            if c not in exclude and any(t in dtype for t in prefer_types):
                return c
    return None


def ensure_schema(conn):
    with conn.cursor() as cur:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS dim_wilayah (
                kode_bps VARCHAR(10) PRIMARY KEY,
                nama_wilayah VARCHAR(100) NOT NULL
            );
            CREATE TABLE IF NOT EXISTS dim_tahun (
                tahun INT PRIMARY KEY
            );
            CREATE TABLE IF NOT EXISTS dim_indikator (
                id SERIAL PRIMARY KEY,
                nama_indikator VARCHAR(255) UNIQUE NOT NULL
            );
            CREATE TABLE IF NOT EXISTS fakta_indikator (
                id SERIAL PRIMARY KEY,
                indikator_id INT,
                kode_bps VARCHAR(10),
                tahun INT,
                nilai DOUBLE PRECISION NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS etl_audit_logs (
                id SERIAL PRIMARY KEY,
                file_sumber VARCHAR(255) NOT NULL,
                kode_bps VARCHAR(10) NOT NULL,
                nama_mentah VARCHAR(255) NOT NULL,
                nama_standar VARCHAR(100) NOT NULL,
                nilai DOUBLE PRECISION NOT NULL,
                status VARCHAR(50) DEFAULT 'Valid',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """
        )
        cur.execute(
            """
            ALTER TABLE etl_audit_logs
            ADD COLUMN IF NOT EXISTS indikator VARCHAR(255) DEFAULT 'Persentase Kemiskinan Makro';
            """
        )
        cur.execute(
            """
            ALTER TABLE etl_audit_logs
            ADD COLUMN IF NOT EXISTS tahun INT DEFAULT 2025;
            """
        )

        # Deteksi otomatis nama kolom asli pada tabel dim_wilayah di Supabase
        wil_schema = get_table_schema(cur, "dim_wilayah")
        wil_name_col = pick_col(
            wil_schema,
            [
                "nama_wilayah",
                "nama_kab_kota",
                "nama_kabupaten",
                "kabupaten_kota",
                "nama_daerah",
                "nama",
                "wilayah",
                "label",
            ],
            exclude={"id", "kode_bps", "created_at", "updated_at"},
            prefer_types=["char", "text"],
        )

        for kode, nama, _ in MASTER_WILAYAH:
            cur.execute("SELECT 1 FROM dim_wilayah WHERE kode_bps = %s;", (kode,))
            exists = cur.fetchone() is not None
            if exists:
                if wil_name_col:
                    cur.execute(
                        f"UPDATE dim_wilayah SET {wil_name_col} = %s WHERE kode_bps = %s;",
                        (nama, kode),
                    )
            else:
                if wil_name_col:
                    cur.execute(
                        f"INSERT INTO dim_wilayah (kode_bps, {wil_name_col}) VALUES (%s, %s);",
                        (kode, nama),
                    )
                else:
                    cur.execute("INSERT INTO dim_wilayah (kode_bps) VALUES (%s);", (kode,))
    conn.commit()


@app.on_event("startup")
def on_startup():
    try:
        conn = get_db_connection()
        try:
            ensure_schema(conn)
        finally:
            conn.close()
    except Exception as exc:
        print(f"[PERINGATAN STARTUP DB] {exc}")


def match_wilayah(cell_val: Any):
    if pd.isna(cell_val):
        return None
    raw = str(cell_val).strip()
    if not raw:
        return None

    norm = re.sub(r"[^a-z0-9.\-\s]", " ", raw.lower())
    norm = re.sub(r"\s+", " ", norm).strip()

    if any(ig == norm or (ig in norm and "72." not in norm) for ig in IGNORE_KEYWORDS):
        return None

    clean_name = re.sub(r"^(kabupaten|kab\.?|kota)\s+", "", norm).strip()
    for kode, standar, aliases in MASTER_WILAYAH:
        for alias in aliases:
            if norm == alias or clean_name == alias or (len(alias) >= 4 and alias in norm):
                return (kode, standar, raw)
    return None


def parse_numeric(val: Any) -> Optional[float]:
    if pd.isna(val):
        return None
    if isinstance(val, (int, float)):
        return None if pd.isna(val) else float(val)

    s = str(val).strip()
    if s.lower() in ["", "-", "–", "—", "...", "na", "n/a", "null", "none"]:
        return None

    s = re.sub(r"[*%]", "", s).strip()
    if "," in s and "." in s:
        if s.rfind(",") > s.rfind("."):
            s = s.replace(".", "").replace(",", ".")
        else:
            s = s.replace(",", "")
    elif "," in s:
        s = s.replace(",", ".")

    try:
        return float(s)
    except ValueError:
        return None


def extract_year_from_text(val: Any) -> Optional[int]:
    if pd.isna(val):
        return None
    s = str(val).strip()
    m = re.search(r"(?<!\d)(20[0-3][0-9])(?!\d)", s)
    return int(m.group(1)) if m else None


def parse_bps_sheet(df_raw: pd.DataFrame, default_year: int) -> List[Dict[str, Any]]:
    if df_raw is None or df_raw.empty:
        return []

    header_idx = None
    for i in range(min(25, len(df_raw))):
        row_vals = [str(v).lower().strip() for v in df_raw.iloc[i].tolist() if pd.notna(v)]
        if not row_vals:
            continue
        joined = " ".join(row_vals)
        has_header_kw = any(
            k in joined
            for k in [
                "wilayah",
                "kabupaten",
                "kota",
                "kode_bps",
                "kode bps",
                "daerah",
                "tahun",
                "nilai",
                "indikator",
            ]
        )
        year_count = sum(1 for v in row_vals if extract_year_from_text(v) is not None)
        if has_header_kw or year_count >= 2:
            header_idx = i
            break

    if header_idx is not None:
        cols = []
        seen = {}
        for idx, c in enumerate(df_raw.iloc[header_idx].tolist()):
            base_c = str(c).strip() if pd.notna(c) and str(c).strip() else f"col_{idx}"
            if base_c in seen:
                seen[base_c] += 1
                base_c = f"{base_c}_{seen[base_c]}"
            else:
                seen[base_c] = 0
            cols.append(base_c)
        df = df_raw.iloc[header_idx + 1 :].copy()
        df.columns = cols
    else:
        df = df_raw.copy()
        df.columns = [f"col_{idx}" for idx in range(df.shape[1])]

    df = df.dropna(how="all").reset_index(drop=True)
    if df.empty:
        return []

    year_cols: Dict[str, int] = {}
    for col in df.columns:
        cl = str(col).lower().strip()
        if any(k in cl for k in ["tahun", "year", "periode", "thn"]):
            continue
        yr = extract_year_from_text(col)
        if yr is not None:
            year_cols[col] = yr

    explicit_year_col = next(
        (c for c in df.columns if any(k in str(c).lower() for k in ["tahun", "year", "periode", "thn"])),
        None,
    )
    explicit_val_col = next(
        (
            c
            for c in df.columns
            if any(
                k in str(c).lower()
                for k in [
                    "nilai",
                    "value",
                    "persentase",
                    "persen",
                    "angka",
                    "indeks",
                    "jumlah",
                    "skor",
                    "capaian",
                    "realisasi",
                    "data",
                ]
            )
        ),
        None,
    )

    records: List[Dict[str, Any]] = []
    for _, row in df.iterrows():
        matches = []
        for col in df.columns:
            m = match_wilayah(row[col])
            if m:
                matches.append((col, m))
        if not matches:
            continue

        kode_bps, nama_standar, nama_mentah = matches[0][1]
        for _, m in matches:
            if not re.match(r"^72\.?\d{2}$", m[2]):
                nama_mentah = m[2]
                break

        if len(year_cols) >= 2:
            for ycol, yr in year_cols.items():
                val = parse_numeric(row[ycol])
                if val is not None:
                    records.append(
                        {
                            "kode_bps": kode_bps,
                            "nama_mentah": nama_mentah,
                            "nama_standar": nama_standar,
                            "tahun": yr,
                            "nilai": round(val, 4),
                        }
                    )
        else:
            yr = default_year
            if explicit_year_col and pd.notna(row[explicit_year_col]):
                y_parsed = extract_year_from_text(row[explicit_year_col])
                if y_parsed:
                    yr = y_parsed

            val = parse_numeric(row[explicit_val_col]) if explicit_val_col else None
            if val is None:
                matched_cols = {c for c, _ in matches}
                for col in reversed(df.columns):
                    if col in matched_cols or col == explicit_year_col:
                        continue
                    v_try = parse_numeric(row[col])
                    if v_try is not None and round(v_try, 2) not in KODE_NUMERIC_SET:
                        val = v_try
                        break

            if val is not None:
                records.append(
                    {
                        "kode_bps": kode_bps,
                        "nama_mentah": nama_mentah,
                        "nama_standar": nama_standar,
                        "tahun": yr,
                        "nilai": round(val, 4),
                    }
                )

    return records


def extract_records_from_file(filename: str, content: bytes, default_year: int) -> List[Dict[str, Any]]:
    lower_name = filename.lower()
    if lower_name.endswith(".csv"):
        for sep in [",", ";", "\t"]:
            try:
                df_csv = pd.read_csv(io.BytesIO(content), header=None, sep=sep)
                recs = parse_bps_sheet(df_csv, default_year)
                if recs:
                    return recs
            except Exception:
                continue
        return []

    xls = pd.ExcelFile(io.BytesIO(content))
    for sheet_name in xls.sheet_names:
        df_sheet = pd.read_excel(xls, sheet_name=sheet_name, header=None)
        recs = parse_bps_sheet(df_sheet, default_year)
        if recs:
            return recs
    return []


router = APIRouter()


@router.post("/etl/upload")
async def upload_etl_file(
    file: UploadFile = File(...),
    nama_indikator: str = Form("Persentase Kemiskinan Makro"),
    tahun_default: int = Form(2025),
):
    content = await file.read()
    filename = file.filename or "dataset_bps.xlsx"
    indikator_clean = nama_indikator.strip() or "Persentase Kemiskinan Makro"

    try:
        records = extract_records_from_file(filename, content, int(tahun_default))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Gagal membaca berkas Excel/CSV: {exc}")

    if not records:
        raise HTTPException(
            status_code=400,
            detail="Tidak ada baris 13 Kabupaten/Kota Sulawesi Tengah yang valid ditemukan di file.",
        )

    dedup_map = {}
    for r in records:
        dedup_map[(r["kode_bps"], r["tahun"])] = r
    clean_records = list(dedup_map.values())

    conn = get_db_connection()
    try:
        ensure_schema(conn)
        with conn.cursor() as cur:
            wil_schema = get_table_schema(cur, "dim_wilayah")
            ind_schema = get_table_schema(cur, "dim_indikator")
            fakta_schema = get_table_schema(cur, "fakta_indikator")

            wil_cols = {c for c, _ in wil_schema}
            ind_cols = {c for c, _ in ind_schema}
            fakta_cols = {c for c, _ in fakta_schema}

            wilayah_id_map = {}
            if "id" in wil_cols:
                cur.execute("SELECT id, kode_bps FROM dim_wilayah;")
                wilayah_id_map = {row["kode_bps"]: row["id"] for row in cur.fetchall()}

            ind_name_col = pick_col(
                ind_schema,
                ["nama_indikator", "indikator", "judul_indikator", "nama", "label"],
                exclude={"id", "satuan", "created_at", "updated_at"},
                prefer_types=["char", "text"],
            ) or "nama_indikator"

            cur.execute(f"SELECT * FROM dim_indikator WHERE {ind_name_col} = %s;", (indikator_clean,))
            ind_row = cur.fetchone()
            if not ind_row:
                if "satuan" in ind_cols:
                    cur.execute(
                        f"INSERT INTO dim_indikator ({ind_name_col}, satuan) VALUES (%s, %s) RETURNING *;",
                        (indikator_clean, "Persen / Poin"),
                    )
                else:
                    cur.execute(
                        f"INSERT INTO dim_indikator ({ind_name_col}) VALUES (%s) RETURNING *;",
                        (indikator_clean,),
                    )
                ind_row = cur.fetchone()
            indikator_id = ind_row.get("id")

            f_wil_col = "wilayah_id" if "wilayah_id" in fakta_cols else "kode_bps"
            f_thn_col = "tahun_id" if "tahun_id" in fakta_cols else "tahun"
            f_ind_col = (
                "indikator_id"
                if "indikator_id" in fakta_cols
                else (pick_col(fakta_schema, ["nama_indikator", "indikator"], exclude={"id", "kode_bps"}) or "indikator_id")
            )
            f_val_col = pick_col(
                fakta_schema,
                ["nilai", "value", "angka", "skor", "jumlah"],
                exclude={"id", "indikator_id", "wilayah_id", "tahun_id", "tahun"},
                prefer_types=["double", "numeric", "real", "float"],
            ) or "nilai"

            for r in clean_records:
                cur.execute("SELECT * FROM dim_tahun WHERE tahun = %s;", (r["tahun"],))
                thn_row = cur.fetchone()
                if not thn_row:
                    cur.execute("INSERT INTO dim_tahun (tahun) VALUES (%s) RETURNING *;", (r["tahun"],))
                    thn_row = cur.fetchone()

                wil_val = wilayah_id_map[r["kode_bps"]] if f_wil_col == "wilayah_id" else r["kode_bps"]
                thn_val = thn_row["id"] if (f_thn_col == "tahun_id" and "id" in thn_row) else r["tahun"]
                ind_val = indikator_id if f_ind_col == "indikator_id" else indikator_clean

                cur.execute(
                    f"""
                    SELECT 1 FROM fakta_indikator
                    WHERE {f_ind_col} = %s AND {f_wil_col} = %s AND {f_thn_col} = %s;
                    """,
                    (ind_val, wil_val, thn_val),
                )
                if cur.fetchone():
                    cur.execute(
                        f"""
                        UPDATE fakta_indikator
                        SET {f_val_col} = %s
                        WHERE {f_ind_col} = %s AND {f_wil_col} = %s AND {f_thn_col} = %s;
                        """,
                        (r["nilai"], ind_val, wil_val, thn_val),
                    )
                else:
                    cur.execute(
                        f"""
                        INSERT INTO fakta_indikator ({f_ind_col}, {f_wil_col}, {f_thn_col}, {f_val_col})
                        VALUES (%s, %s, %s, %s);
                        """,
                        (ind_val, wil_val, thn_val, r["nilai"]),
                    )

                cur.execute(
                    """
                    INSERT INTO etl_audit_logs
                        (file_sumber, indikator, kode_bps, nama_mentah, nama_standar, tahun, nilai, status)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, 'Valid');
                    """,
                    (
                        filename,
                        indikator_clean,
                        r["kode_bps"],
                        r["nama_mentah"],
                        r["nama_standar"],
                        r["tahun"],
                        r["nilai"],
                    ),
                )
        conn.commit()
    except Exception as exc:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Database Error: {exc}")
    finally:
        conn.close()

    return {
        "status": "success",
        "file": filename,
        "indikator": indikator_clean,
        "total_baris_valid": len(clean_records),
    }


@router.get("/etl/logs")
def get_etl_logs(limit: int = Query(100, ge=1, le=500)):
    conn = get_db_connection()
    try:
        ensure_schema(conn)
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT file_sumber, indikator, kode_bps, nama_mentah, nama_standar, tahun, nilai, status
                FROM etl_audit_logs
                ORDER BY id DESC
                LIMIT %s;
                """,
                (limit,),
            )
            logs = cur.fetchall()

            ind_schema = get_table_schema(cur, "dim_indikator")
            ind_name_col = pick_col(
                ind_schema,
                ["nama_indikator", "indikator", "judul_indikator", "nama", "label"],
                exclude={"id", "satuan", "created_at", "updated_at"},
                prefer_types=["char", "text"],
            ) or "nama_indikator"
            cur.execute(f"SELECT {ind_name_col} AS nama_indikator FROM dim_indikator ORDER BY id DESC;")
            indikator_list = [row["nama_indikator"] for row in cur.fetchall()]
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Gagal memuat log ETL: {exc}")
    finally:
        conn.close()

    return {
        "logs": logs,
        "indikator_tersedia": indikator_list,
    }


@router.get("/analytics/run")
def run_analytics(indikator: str = Query("Persentase Kemiskinan Makro")):
    conn = get_db_connection()
    try:
        ensure_schema(conn)
        with conn.cursor() as cur:
            wil_schema = get_table_schema(cur, "dim_wilayah")
            ind_schema = get_table_schema(cur, "dim_indikator")
            fakta_schema = get_table_schema(cur, "fakta_indikator")
            fakta_cols = {c for c, _ in fakta_schema}

            wil_name_col = pick_col(
                wil_schema,
                [
                    "nama_wilayah",
                    "nama_kab_kota",
                    "nama_kabupaten",
                    "kabupaten_kota",
                    "nama_daerah",
                    "nama",
                    "wilayah",
                    "label",
                ],
                exclude={"id", "kode_bps", "created_at", "updated_at"},
                prefer_types=["char", "text"],
            )
            ind_name_col = pick_col(
                ind_schema,
                ["nama_indikator", "indikator", "judul_indikator", "nama", "label"],
                exclude={"id", "satuan", "created_at", "updated_at"},
                prefer_types=["char", "text"],
            ) or "nama_indikator"

            cur.execute(
                f"SELECT id, {ind_name_col} AS nama_indikator FROM dim_indikator WHERE {ind_name_col} = %s;",
                (indikator,),
            )
            ind_row = cur.fetchone()
            if not ind_row:
                cur.execute(f"SELECT id, {ind_name_col} AS nama_indikator FROM dim_indikator ORDER BY id DESC LIMIT 1;")
                ind_row = cur.fetchone()

            if not ind_row:
                raise HTTPException(status_code=404, detail="Belum ada data indikator di Data Warehouse.")

            ind_id = ind_row["id"]
            ind_name = ind_row["nama_indikator"]

            join_wil = "w.id = f.wilayah_id" if "wilayah_id" in fakta_cols else "w.kode_bps = f.kode_bps"
            join_thn = "JOIN dim_tahun t ON t.id = f.tahun_id" if "tahun_id" in fakta_cols else ""
            sel_thn = "t.tahun AS tahun" if "tahun_id" in fakta_cols else "f.tahun AS tahun"
            sel_wil = f"w.{wil_name_col} AS nama_wilayah" if wil_name_col else "w.kode_bps AS nama_wilayah"
            where_ind = "f.indikator_id = %s" if "indikator_id" in fakta_cols else f"f.{ind_name_col} = %s"
            ind_param = ind_id if "indikator_id" in fakta_cols else ind_name
            val_col = pick_col(
                fakta_schema,
                ["nilai", "value", "angka", "skor", "jumlah"],
                exclude={"id", "indikator_id", "wilayah_id", "tahun_id", "tahun"},
                prefer_types=["double", "numeric", "real", "float"],
            ) or "nilai"

            cur.execute(
                f"""
                SELECT w.kode_bps, {sel_wil}, {sel_thn}, f.{val_col} AS nilai
                FROM fakta_indikator f
                JOIN dim_wilayah w ON {join_wil}
                {join_thn}
                WHERE {where_ind}
                ORDER BY w.kode_bps ASC, tahun ASC;
                """,
                (ind_param,),
            )
            rows = cur.fetchall()
    finally:
        conn.close()

    if not rows:
        raise HTTPException(status_code=404, detail="Data fakta kosong untuk indikator ini.")

    # Lengkapi nama standar jika tabel dim_wilayah tidak memiliki kolom nama
    kode_to_standar = {k: n for k, n, _ in MASTER_WILAYAH}
    for r in rows:
        if r["nama_wilayah"] in kode_to_standar:
            r["nama_wilayah"] = kode_to_standar[r["nama_wilayah"]]

    df = pd.DataFrame(rows)
    tahun_terkini = int(df["tahun"].max())
    df_latest = df[df["tahun"] == tahun_terkini].sort_values("kode_bps").reset_index(drop=True)

    vals = df_latest[["nilai"]].values
    n_clusters = min(3, len(df_latest))
    if n_clusters >= 2:
        km = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        raw_labels = km.fit_predict(vals)
        centers = km.cluster_centers_.flatten()
        order = np.argsort(centers)
        rank_map = {orig_idx: rank_idx for rank_idx, orig_idx in enumerate(order)}
        mapped_clusters = [int(rank_map[lbl]) for lbl in raw_labels]
    else:
        mapped_clusters = [0 for _ in range(len(df_latest))]

    label_names = {
        0: "Klaster 1 (Rendah / Optimal)",
        1: "Klaster 2 (Menengah / Transisi)",
        2: "Klaster 3 (Tinggi / Prioritas)",
    }

    wilayah_output = []
    for idx, r in df_latest.iterrows():
        kode = r["kode_bps"]
        sub = df[df["kode_bps"] == kode].sort_values("tahun")
        if len(sub) >= 2:
            model = Ridge(alpha=1.0)
            model.fit(sub[["tahun"]].values, sub["nilai"].values)
            pred_2026 = float(model.predict(np.array([[2026]]))[0])
        else:
            pred_2026 = float(r["nilai"])

        cid = mapped_clusters[idx]
        wilayah_output.append(
            {
                "kode_bps": kode,
                "nama_wilayah": r["nama_wilayah"],
                "nilai_terkini": round(float(r["nilai"]), 3),
                "prediksi_2026": round(pred_2026, 3),
                "cluster_id": cid,
                "cluster_label": label_names.get(cid, "Klaster 1"),
            }
        )

    prov_trend_df = df.groupby("tahun", as_index=False)["nilai"].mean().sort_values("tahun")
    if len(prov_trend_df) >= 2:
        prov_model = Ridge(alpha=1.0)
        prov_model.fit(prov_trend_df[["tahun"]].values, prov_trend_df["nilai"].values)
        pred_prov_2026 = round(float(prov_model.predict(np.array([[2026]]))[0]), 2)
        pred_prov_2027 = round(float(prov_model.predict(np.array([[2027]]))[0]), 2)
    else:
        only_val = round(float(prov_trend_df["nilai"].iloc[0]), 2)
        pred_prov_2026 = only_val
        pred_prov_2027 = only_val

    trend_historis = [
        {"tahun": int(tr["tahun"]), "nilai": round(float(tr["nilai"]), 2), "is_forecast": False}
        for _, tr in prov_trend_df.iterrows()
    ]
    trend_historis.append({"tahun": 2026, "nilai": pred_prov_2026, "is_forecast": True})
    trend_historis.append({"tahun": 2027, "nilai": pred_prov_2027, "is_forecast": True})

    rata_terkini = round(float(df_latest["nilai"].mean()), 2)

    return {
        "indikator": ind_name,
        "tahun_terkini": tahun_terkini,
        "kpi": {
            "total_wilayah": int(len(df_latest)),
            "rata_rata_terkini": rata_terkini,
            "prediksi_provinsi_2026": pred_prov_2026,
            "prediksi_provinsi_2027": pred_prov_2027,
        },
        "wilayah": wilayah_output,
        "trend_historis": trend_historis,
    }


app.include_router(router)
app.include_router(router, prefix="/api")
app.include_router(router, prefix="/api/v1")
app.include_router(router, prefix="/api/gateway")