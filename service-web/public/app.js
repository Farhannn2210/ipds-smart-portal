document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;
  const ADMIN_PIN_STORAGE = "ipds_admin_unlocked";

  // ==========================================================
  // 0. PENYERAGAMAN FONT TANPA MERUSAK IKON MATERIAL SYMBOLS
  // ==========================================================
  if (!document.getElementById("ipds-uniform-font")) {
    const styleEl = document.createElement("style");
    styleEl.id = "ipds-uniform-font";
    styleEl.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
      body, button:not(.material-symbols-outlined), input, select, textarea, table,
      h1, h2, h3, h4, p, div:not(.material-symbols-outlined), a:not(.material-symbols-outlined),
      span:not(.material-symbols-outlined):not(.material-icons) {
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      }
      .material-symbols-outlined, .material-icons {
        font-family: 'Material Symbols Outlined' !important;
        font-weight: normal !important;
        font-style: normal !important;
        line-height: 1 !important;
        letter-spacing: normal !important;
        text-transform: none !important;
        display: inline-block !important;
        white-space: nowrap !important;
      }
      @keyframes ipdsSpin {
        to { transform: rotate(360deg); }
      }
      .ipds-spinner {
        width: 14px;
        height: 14px;
        border: 2px solid #cbd5e1;
        border-top-color: #1d4ed8;
        border-radius: 50%;
        display: inline-block;
        animation: ipdsSpin 0.7s linear infinite;
      }
    `;
    document.head.appendChild(styleEl);
  }

  // ==========================================================
  // 1. SERAGAMKAN TAMPILAN & UKURAN NAVBAR DI SEMUA HALAMAN
  // ==========================================================
  const isPortal = path === "/" || path.endsWith("index.html");
  const isEtl = path === "/etl" || path.endsWith("etl.html");
  const isAnalytics = path === "/analytics" || path.endsWith("analytics.html");

  const headerEl = document.querySelector("header, nav");
  if (headerEl) {
    headerEl.style.minHeight = "68px";
  }

  document.querySelectorAll("a, button").forEach((el) => {
    // Bersihkan ikon teks jika ikut terbaca saat cek label
    const clone = el.cloneNode(true);
    clone.querySelectorAll(".material-symbols-outlined, .material-icons").forEach((ic) => ic.remove());
    const label = clone.textContent.replace(/\s+/g, " ").trim();

    const applyNavStyle = (targetUrl, isActive) => {
      if (el.tagName === "A") el.setAttribute("href", targetUrl);
      el.style.fontSize = "13px";
      el.style.fontWeight = isActive ? "700" : "500";
      el.style.padding = "8px 16px";
      el.style.borderRadius = "8px";
      el.style.lineHeight = "1.2";
      el.style.whiteSpace = "nowrap";
      el.style.transition = "all 0.15s ease";

      if (isActive) {
        el.style.backgroundColor = "#1d4ed8";
        el.style.color = "#ffffff";
        el.style.boxShadow = "0 1px 3px rgba(29,78,216,0.25)";
      } else {
        el.style.backgroundColor = "transparent";
        el.style.color = "#475569";
        el.style.boxShadow = "none";
      }

      el.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = targetUrl;
      });
    };

    if (label === "Portal Link") applyNavStyle("/", isPortal);
    else if (label === "ETL Data Warehouse") applyNavStyle("/etl", isEtl);
    else if (label === "Analytics & AI") applyNavStyle("/analytics", isAnalytics);
  });

  if (isPortal) initPortalPage();
  if (isEtl) initEtlPage();
  if (isAnalytics) initAnalyticsPage();

  // ==========================================================
  // 2. HALAMAN 1: PORTAL LINK (TERHUBUNG SUPABASE)
  // ==========================================================
  function initPortalPage() {
    const searchInput = document.querySelector('input[type="text"], input[type="search"]');
    let activeCategory = "Semua Tautan";
    let allLinksCache = [];

    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k" && searchInput) {
        e.preventDefault();
        searchInput.focus();
      }
    });

    function findCardGridForSection(headingText) {
      const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4"));
      const targetH = headings.find((h) => h.textContent.includes(headingText));
      if (!targetH) return null;

      let container = targetH.parentElement;
      while (container && container !== document.body) {
        const gridEl = container.querySelector('[class*="grid-cols"]');
        if (gridEl && !gridEl.contains(targetH)) {
          return gridEl;
        }
        container = container.parentElement;
      }
      return null;
    }

    const pinnedGrid = findCardGridForSection("Tersemat & Prioritas Pekan Ini");
    const directoryGrid = findCardGridForSection("Direktori Tautan & Dokumen Operasional IPDS");

    function updateCategoryButtons() {
      const categoryNames = [
        "Semua Tautan",
        "Aplikasi Pusat",
        "Monitoring Survei",
        "Pengolahan & Publikasi",
        "SOP & Template",
      ];

      document.querySelectorAll("button").forEach((btn) => {
        if (!btn.dataset.catName) {
          const clone = btn.cloneNode(true);
          clone.querySelectorAll(".material-symbols-outlined, .material-icons").forEach((ic) => ic.remove());
          const rawText = clone.textContent.replace(/[0-9]/g, "").trim();
          const matched = categoryNames.find((c) => rawText === c);
          if (matched) btn.dataset.catName = matched;
        }

        const catName = btn.dataset.catName;
        if (!catName) return;

        const count =
          catName === "Semua Tautan"
            ? allLinksCache.length
            : allLinksCache.filter((l) => (l.category_name || "").toLowerCase() === catName.toLowerCase()).length;

        const spans = Array.from(btn.querySelectorAll("span")).filter(
          (s) => !s.classList.contains("material-symbols-outlined")
        );
        if (spans.length >= 2) {
          spans[spans.length - 1].textContent = count;
        } else if (spans.length === 1 && /^[0-9]+$/.test(spans[0].textContent.trim())) {
          spans[0].textContent = count;
        } else {
          btn.innerHTML = `${catName} <span style="margin-left:6px;padding:1px 7px;border-radius:999px;font-size:11px;background:rgba(148,163,184,0.2);">${count}</span>`;
        }

        if (activeCategory === catName) {
          btn.style.backgroundColor = "#0f172a";
          btn.style.color = "#ffffff";
          btn.style.borderColor = "#0f172a";
        } else {
          btn.style.backgroundColor = "#ffffff";
          btn.style.color = "#475569";
          btn.style.borderColor = "#e2e8f0";
        }

        btn.onclick = () => {
          activeCategory = catName;
          updateCategoryButtons();
          renderFilteredGrids();
        };
      });
    }

    function renderFilteredGrids() {
      const q = (searchInput?.value || "").toLowerCase().trim();
      const isAdmin = sessionStorage.getItem(ADMIN_PIN_STORAGE) === "true";

      const filtered = allLinksCache.filter((item) => {
        const text = `${item.judul} ${item.deskripsi} ${item.category_name} ${item.pic}`.toLowerCase();
        const matchSearch = !q || text.includes(q);
        const matchCat =
          activeCategory === "Semua Tautan" ||
          (item.category_name || "").toLowerCase() === activeCategory.toLowerCase();
        return matchSearch && matchCat;
      });

      const pinnedItems = filtered.filter((i) => i.is_pinned);
      const regularItems = filtered.filter((i) => !i.is_pinned);

      if (pinnedGrid) {
        pinnedGrid.innerHTML = pinnedItems.length
          ? pinnedItems
              .map(
                (item) => `
              <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:22px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 2px 6px rgba(15,23,42,0.03);">
                <div>
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                    <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#1d4ed8;background:#eff6ff;padding:4px 10px;border-radius:6px;">${item.category_name || "Prioritas"}</span>
                    <span style="font-size:11px;color:#64748b;">PIC: ${item.pic || "Tim IPDS"}</span>
                  </div>
                  <h3 style="font-size:17px;font-weight:700;color:#0f172a;margin:0 0 8px;line-height:1.35;">${item.judul}</h3>
                  <p style="font-size:13px;color:#475569;margin:0 0 16px;line-height:1.55;">${item.deskripsi || ""}</p>
                </div>
                <div>
                  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:10px 12px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;font-size:12px;">
                    <span style="color:#059669;font-weight:600;">&#9679; Terhubung Supabase</span>
                    <span style="color:#334155;font-weight:600;">${item.badge_info || "Aktif"}</span>
                  </div>
                  <div style="display:flex;gap:8px;align-items:center;">
                    <a href="${item.url}" target="_blank" rel="noopener noreferrer" style="flex:1;text-align:center;background:#1d4ed8;color:#fff;text-decoration:none;padding:10px 14px;border-radius:10px;font-size:13px;font-weight:600;">Buka Tautan &#8599;</a>
                    <button type="button" data-copy-url="${item.url}" style="background:#f8fafc;border:1px solid #cbd5e1;color:#334155;padding:10px 12px;border-radius:10px;cursor:pointer;font-size:13px;" title="Salin URL">&#128203;</button>
                    ${
                      isAdmin
                        ? `<button type="button" data-del-id="${item.id}" style="background:#fef2f2;color:#dc2626;border:1px solid #fecaca;padding:10px 12px;border-radius:10px;cursor:pointer;font-size:12px;font-weight:600;">Hapus</button>`
                        : ""
                    }
                  </div>
                </div>
              </div>`
              )
              .join("")
          : `<p style="color:#64748b;font-size:13px;grid-column:1/-1;">Tidak ada tautan tersemat pada kategori ini.</p>`;
      }

      if (directoryGrid) {
        directoryGrid.innerHTML = regularItems.length
          ? regularItems
              .map(
                (item) => `
              <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:20px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 1px 4px rgba(15,23,42,0.03);">
                <div>
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                    <span style="font-size:11px;font-weight:600;color:#475569;background:#f1f5f9;padding:4px 10px;border-radius:6px;">${item.category_name || "Direktori"}</span>
                    <span style="font-size:11px;color:#64748b;">${item.badge_info || item.pic || "Web Internal"}</span>
                  </div>
                  <h3 style="font-size:16px;font-weight:700;color:#0f172a;margin:0 0 6px;">${item.judul}</h3>
                  <p style="font-size:13px;color:#475569;margin:0 0 16px;line-height:1.5;">${item.deskripsi || ""}</p>
                </div>
                <div style="display:flex;gap:8px;align-items:center;">
                  <a href="${item.url}" target="_blank" rel="noopener noreferrer" style="flex:1;text-align:center;background:#f8fafc;color:#0f172a;border:1px solid #cbd5e1;text-decoration:none;padding:9px 14px;border-radius:10px;font-size:13px;font-weight:600;">Buka Layanan &#8599;</a>
                  <button type="button" data-copy-url="${item.url}" style="background:#f8fafc;border:1px solid #cbd5e1;color:#334155;padding:9px 12px;border-radius:10px;cursor:pointer;font-size:13px;" title="Salin URL">&#128203;</button>
                  ${
                    isAdmin
                      ? `<button type="button" data-del-id="${item.id}" style="background:#fef2f2;color:#dc2626;border:1px solid #fecaca;padding:9px 12px;border-radius:10px;cursor:pointer;font-size:12px;font-weight:600;">Hapus</button>`
                      : ""
                  }
                </div>
              </div>`
              )
              .join("")
          : `<p style="color:#64748b;font-size:13px;grid-column:1/-1;">Tidak ada tautan direktori pada kategori ini.</p>`;
      }

      document.querySelectorAll("[data-copy-url]").forEach((btn) => {
        btn.onclick = () => {
          navigator.clipboard.writeText(btn.getAttribute("data-copy-url"));
          const orig = btn.innerHTML;
          btn.innerHTML = "&#10003;";
          setTimeout(() => (btn.innerHTML = orig), 1200);
        };
      });

      document.querySelectorAll("[data-del-id]").forEach((btn) => {
        btn.onclick = async () => {
          if (!confirm("Hapus tautan ini dari database Supabase?")) return;
          await fetch(`/api/portal/links/${btn.getAttribute("data-del-id")}`, { method: "DELETE" });
          loadLinksFromSupabase();
        };
      });
    }

    if (searchInput) searchInput.addEventListener("input", renderFilteredGrids);

    const adminBtn = Array.from(document.querySelectorAll("button, a")).find((el) =>
      el.textContent.includes("Admin Login")
    );

    const modalHtml = `
      <div id="ipds-admin-modal" style="display:none;position:fixed;inset:0;background:rgba(15,23,42,0.6);z-index:9999;align-items:center;justify-content:center;padding:16px;">
        <div style="background:#fff;border-radius:16px;max-width:480px;width:100%;padding:24px;box-shadow:0 20px 40px rgba(0,0,0,0.2);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
            <h3 id="ipds-modal-title" style="font-size:18px;font-weight:700;color:#0f172a;margin:0;">Login Admin IPDS</h3>
            <button id="ipds-close-modal" style="background:none;border:none;font-size:22px;cursor:pointer;color:#64748b;">&times;</button>
          </div>
          <div id="ipds-pin-section">
            <p style="font-size:13px;color:#475569;margin-bottom:12px;">Masukkan PIN Admin IPDS untuk mengelola tautan (Default: <b>ipds2026</b>).</p>
            <input id="ipds-pin-input" type="password" placeholder="Masukkan PIN Admin..." style="width:100%;padding:10px 12px;border:1px solid #cbd5e1;border-radius:8px;margin-bottom:12px;font-size:14px;" />
            <button id="ipds-pin-submit" style="width:100%;background:#1d4ed8;color:#fff;border:none;padding:10px;border-radius:8px;font-weight:600;cursor:pointer;">Buka Akses Admin</button>
          </div>
          <form id="ipds-add-link-form" style="display:none;flex-direction:column;gap:10px;">
            <input name="judul" required placeholder="Judul Tautan (misal: Web Absensi Magang BPS)" style="padding:9px 12px;border:1px solid #cbd5e1;border-radius:8px;font-size:13px;" />
            <select name="category_id" style="padding:9px 12px;border:1px solid #cbd5e1;border-radius:8px;font-size:13px;">
              <option value="1">Aplikasi Pusat</option>
              <option value="2">Monitoring Survei</option>
              <option value="3">Pengolahan & Publikasi</option>
              <option value="4">SOP & Template</option>
            </select>
            <input name="url" type="url" required placeholder="https://..." style="padding:9px 12px;border:1px solid #cbd5e1;border-radius:8px;font-size:13px;" />
            <input name="pic" placeholder="PIC / Tim (misal: Tim IPDS)" style="padding:9px 12px;border:1px solid #cbd5e1;border-radius:8px;font-size:13px;" />
            <input name="badge_info" placeholder="Info Badge (misal: 13 Kab/Kota • Aktif)" style="padding:9px 12px;border:1px solid #cbd5e1;border-radius:8px;font-size:13px;" />
            <textarea name="deskripsi" rows="2" placeholder="Deskripsi singkat kegunaan link..." style="padding:9px 12px;border:1px solid #cbd5e1;border-radius:8px;font-size:13px;"></textarea>
            <label style="font-size:13px;color:#334155;display:flex;align-items:center;gap:8px;">
              <input type="checkbox" name="is_pinned" /> Sematkan di Prioritas Pekan Ini (Bagian Atas)
            </label>
            <button type="submit" style="background:#1d4ed8;color:#fff;border:none;padding:10px;border-radius:8px;font-weight:600;cursor:pointer;margin-top:4px;">Simpan ke Database Supabase</button>
          </form>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", modalHtml);

    const modal = document.getElementById("ipds-admin-modal");
    const pinSection = document.getElementById("ipds-pin-section");
    const addForm = document.getElementById("ipds-add-link-form");
    const modalTitle = document.getElementById("ipds-modal-title");

    function updateAdminBtn() {
      if (adminBtn && sessionStorage.getItem(ADMIN_PIN_STORAGE) === "true") {
        adminBtn.innerHTML = "+ Tambah Link IPDS";
      }
    }
    updateAdminBtn();

    if (adminBtn) {
      adminBtn.addEventListener("click", (e) => {
        e.preventDefault();
        modal.style.display = "flex";
        if (sessionStorage.getItem(ADMIN_PIN_STORAGE) === "true") {
          modalTitle.textContent = "Tambah Tautan Baru ke PostgreSQL";
          pinSection.style.display = "none";
          addForm.style.display = "flex";
        } else {
          modalTitle.textContent = "Login Admin IPDS";
          pinSection.style.display = "block";
          addForm.style.display = "none";
        }
      });
    }

    document.getElementById("ipds-close-modal").onclick = () => (modal.style.display = "none");
    document.getElementById("ipds-pin-submit").onclick = () => {
      if (document.getElementById("ipds-pin-input").value.trim() === "ipds2026") {
        sessionStorage.setItem(ADMIN_PIN_STORAGE, "true");
        updateAdminBtn();
        modalTitle.textContent = "Tambah Tautan Baru ke PostgreSQL";
        pinSection.style.display = "none";
        addForm.style.display = "flex";
        renderFilteredGrids();
      } else {
        alert("PIN salah! Gunakan PIN: ipds2026");
      }
    };

    addForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(addForm);
      const res = await fetch("/api/portal/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          judul: fd.get("judul"),
          category_id: Number(fd.get("category_id")),
          url: fd.get("url"),
          pic: fd.get("pic") || "Tim IPDS",
          badge_info: fd.get("badge_info") || "Web Internal",
          deskripsi: fd.get("deskripsi") || "",
          is_pinned: fd.get("is_pinned") === "on",
          pin: "ipds2026",
        }),
      });
      if (res.ok) {
        addForm.reset();
        modal.style.display = "none";
        loadLinksFromSupabase();
      }
    });

    async function loadLinksFromSupabase() {
      const res = await fetch("/api/portal/links");
      if (!res.ok) return;
      const data = await res.json();
      allLinksCache = data.links || [];
      updateCategoryButtons();
      renderFilteredGrids();
    }

    loadLinksFromSupabase();
  }

  // ==========================================================
  // 3. HALAMAN 2: ETL DATA WAREHOUSE (ATAS RINGKAS + PIPELINE REAL-TIME)
  // ==========================================================
  function initEtlPage() {
    const mainEl = document.querySelector("main") || document.body;
    mainEl.innerHTML = `
      <section style="max-width:1240px;margin:28px auto;padding:0 24px;">
        <div style="background:#fff;border:1px solid #cbd5e1;border-radius:16px;padding:24px;margin-bottom:20px;box-shadow:0 4px 12px rgba(15,23,42,0.03);">
          <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px;">
            <span style="font-size:11px;font-weight:700;color:#059669;background:#ecfdf5;padding:4px 10px;border-radius:999px;letter-spacing:0.03em;">PYTHON PANDAS + FASTAPI ETL ENGINE</span>
            <span style="font-size:12px;color:#64748b;">Target: <b>PostgreSQL Star Schema</b></span>
          </div>
          <h1 style="font-size:22px;font-weight:700;color:#0f172a;margin:4px 0 4px;">Pipeline ETL &amp; Sinkronisasi Star Schema</h1>
          <p style="font-size:13px;color:#64748b;margin:0 0 18px;">Unggah file Excel/CSV indikator 13 Kabupaten/Kota Sulawesi Tengah untuk standarisasi otomatis kode wilayah 72.xx ke PostgreSQL Data Warehouse.</p>

          <form id="ipds-etl-form" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;align-items:end;">
            <div>
              <label style="display:block;font-size:12px;font-weight:600;color:#334155;margin-bottom:5px;">File Excel / CSV (.xlsx, .csv)</label>
              <input id="ipds-file-input" type="file" name="file" accept=".xlsx,.xls,.csv" required style="width:100%;font-size:13px;padding:7px 9px;border:1px solid #cbd5e1;border-radius:9px;background:#fff;" />
            </div>
            <div>
              <label style="display:block;font-size:12px;font-weight:600;color:#334155;margin-bottom:5px;">Nama Indikator</label>
              <input type="text" name="nama_indikator" value="Persentase Kemiskinan Makro" required style="width:100%;font-size:13px;padding:9px 11px;border:1px solid #cbd5e1;border-radius:9px;" />
            </div>
            <div>
              <label style="display:block;font-size:12px;font-weight:600;color:#334155;margin-bottom:5px;">Tahun Default</label>
              <input type="number" name="tahun_default" value="2025" required style="width:100%;font-size:13px;padding:9px 11px;border:1px solid #cbd5e1;border-radius:9px;" />
            </div>
            <div>
              <button type="submit" id="ipds-etl-btn" style="width:100%;background:#1d4ed8;color:#fff;border:none;padding:10px 16px;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer;">Jalankan ETL &amp; Load Warehouse</button>
            </div>
          </form>
          <div id="ipds-etl-status" style="margin-top:10px;font-size:13px;"></div>
        </div>

        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:22px 24px;margin-bottom:20px;box-shadow:0 2px 6px rgba(15,23,42,0.03);">
          <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px;margin-bottom:14px;">
            <div>
              <h2 style="font-size:16px;font-weight:700;color:#0f172a;margin:0;">Status Pipeline &amp; Eksekusi Real-Time</h2>
              <p style="font-size:12px;color:#64748b;margin:2px 0 0;">Tahapan otomatis pembacaan file Excel, pembersihan kode wilayah 72.xx, hingga penyimpanan ke Star Schema.</p>
            </div>
            <span id="ipds-pipe-badge" style="background:#f1f5f9;color:#475569;font-size:12px;font-weight:700;padding:5px 12px;border-radius:999px;">Menunggu File Excel</span>
          </div>

          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;margin-bottom:14px;">
            <div id="ipds-step-1" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px;transition:all 0.2s;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="font-size:13px;font-weight:700;color:#0f172a;">1. Extract Multi-Excel</span>
                <span id="ipds-step-1-badge" style="font-size:11px;font-weight:700;color:#64748b;">Siap</span>
              </div>
              <div id="ipds-step-1-desc" style="font-size:12px;color:#64748b;">Membaca struktur sheet, header tahun, dan kolom kabupaten/kota dari berkas.</div>
            </div>

            <div id="ipds-step-2" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px;transition:all 0.2s;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="font-size:13px;font-weight:700;color:#0f172a;">2. Transform &amp; Standarisasi</span>
                <span id="ipds-step-2-badge" style="font-size:11px;font-weight:700;color:#64748b;">Siap</span>
              </div>
              <div id="ipds-step-2-desc" style="font-size:12px;color:#64748b;">Memetakan teks mentah ke kode BPS 72.xx dan membersihkan nilai kosong/spasi.</div>
            </div>

            <div id="ipds-step-3" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px;transition:all 0.2s;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="font-size:13px;font-weight:700;color:#0f172a;">3. Load ke Star Schema</span>
                <span id="ipds-step-3-badge" style="font-size:11px;font-weight:700;color:#64748b;">Siap</span>
              </div>
              <div id="ipds-step-3-desc" style="font-size:12px;color:#64748b;">Upsert fakta indikator ke PostgreSQL dan memperbarui riwayat audit database.</div>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;">
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:11px 14px;">
              <div style="font-size:11px;color:#64748b;">Cakupan dim_wilayah</div>
              <div id="ipds-dim-wilayah" style="font-size:16px;font-weight:700;color:#0f172a;">Memuat...</div>
              <div style="font-size:11px;color:#059669;">&#9679; Master Kode 72.xx</div>
            </div>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:11px 14px;">
              <div style="font-size:11px;color:#64748b;">Periode dim_tahun</div>
              <div id="ipds-dim-tahun" style="font-size:16px;font-weight:700;color:#0f172a;">Memuat...</div>
              <div style="font-size:11px;color:#1d4ed8;">&#9679; Rentang Data Aktual</div>
            </div>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:11px 14px;">
              <div style="font-size:11px;color:#64748b;">Total Audit &amp; Fakta</div>
              <div id="ipds-total-rows" style="font-size:16px;font-weight:700;color:#0f172a;">Memuat...</div>
              <div style="font-size:11px;color:#059669;">&#9679; Tersimpan di PostgreSQL</div>
            </div>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:11px 14px;">
              <div style="font-size:11px;color:#64748b;">Indikator Tersedia</div>
              <div id="ipds-total-indikator" style="font-size:16px;font-weight:700;color:#0f172a;">Memuat...</div>
              <div style="font-size:11px;color:#7c3aed;">&#9679; Siap Analisis AI</div>
            </div>
          </div>
        </div>

        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:24px;box-shadow:0 2px 6px rgba(15,23,42,0.03);">
          <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px;">
            <div>
              <h3 style="font-size:16px;font-weight:700;color:#0f172a;margin:0;">Audit Kualitas Data (Sebelum vs Sesudah Pembersihan)</h3>
              <p style="font-size:12px;color:#64748b;margin:2px 0 0;">Log pemetaan string mentah Excel terhadap master kode wilayah BPS Sulawesi Tengah.</p>
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
              <input id="ipds-audit-search" type="text" placeholder="Cari wilayah atau file..." style="padding:8px 12px;border:1px solid #cbd5e1;border-radius:8px;font-size:12px;" />
              <button id="ipds-download-audit" type="button" style="background:#f8fafc;border:1px solid #cbd5e1;color:#0f172a;padding:8px 12px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;">Unduh Log CSV</button>
            </div>
          </div>

          <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:13px;text-align:left;">
              <thead>
                <tr style="background:#f8fafc;border-bottom:1px solid #e2e8f0;color:#475569;">
                  <th style="padding:10px;">File Sumber</th>
                  <th style="padding:10px;">Kode BPS</th>
                  <th style="padding:10px;">Teks Mentah Excel (Sebelum)</th>
                  <th style="padding:10px;">Nama Standar Master (Sesudah)</th>
                  <th style="padding:10px;">Nilai</th>
                  <th style="padding:10px;">Status</th>
                </tr>
              </thead>
              <tbody id="ipds-etl-tbody">
                <tr><td colspan="6" style="padding:14px;color:#64748b;">Memuat riwayat ETL dari database...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    `;

    let auditCache = [];

    function setStepState(stepNum, state, descText) {
      const box = document.getElementById(`ipds-step-${stepNum}`);
      const badge = document.getElementById(`ipds-step-${stepNum}-badge`);
      const desc = document.getElementById(`ipds-step-${stepNum}-desc`);
      if (descText) desc.textContent = descText;

      if (state === "running") {
        box.style.background = "#eff6ff";
        box.style.borderColor = "#93c5fd";
        badge.innerHTML = `<span class="ipds-spinner"></span> <span style="color:#1d4ed8;margin-left:4px;">Memproses...</span>`;
      } else if (state === "done") {
        box.style.background = "#ecfdf5";
        box.style.borderColor = "#6ee7b7";
        badge.innerHTML = `<span style="color:#059669;">&#10003; Selesai</span>`;
      } else {
        box.style.background = "#f8fafc";
        box.style.borderColor = "#e2e8f0";
        badge.innerHTML = `<span style="color:#64748b;">Siap</span>`;
      }
    }

    function renderAuditTable() {
      const q = (document.getElementById("ipds-audit-search").value || "").toLowerCase().trim();
      const tbody = document.getElementById("ipds-etl-tbody");
      const filtered = auditCache.filter(
        (r) => !q || `${r.file_sumber} ${r.kode_bps} ${r.nama_mentah} ${r.nama_standar}`.toLowerCase().includes(q)
      );

      if (!filtered.length) {
        tbody.innerHTML = `<tr><td colspan="6" style="padding:14px;color:#64748b;">Belum ada riwayat upload. Unggah file Excel di atas untuk memulai.</td></tr>`;
        return;
      }

      tbody.innerHTML = filtered
        .map(
          (r) => `
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:10px;font-weight:500;color:#334155;">${r.file_sumber}</td>
          <td style="padding:10px;font-family:monospace;color:#1d4ed8;font-weight:700;">${r.kode_bps}</td>
          <td style="padding:10px;"><span style="background:#fef2f2;color:#b91c1c;padding:2px 8px;border-radius:6px;font-size:12px;">"${r.nama_mentah}"</span></td>
          <td style="padding:10px;font-weight:600;color:#0f172a;">${r.nama_standar} (${r.kode_bps})</td>
          <td style="padding:10px;font-weight:700;color:#0f172a;">${r.nilai}</td>
          <td style="padding:10px;"><span style="background:#ecfdf5;color:#059669;padding:2px 9px;border-radius:999px;font-size:11px;font-weight:700;">${r.status}</span></td>
        </tr>`
        )
        .join("");
    }

    async function loadEtlLogs() {
      try {
        const res = await fetch("/api/gateway/etl/logs?limit=100");
        const data = await res.json();
        auditCache = data.logs || [];

        const uniqueWilayah = new Set(auditCache.map((r) => r.kode_bps)).size;
        const indikatorList = data.indikator_tersedia || [];

        document.getElementById("ipds-dim-wilayah").textContent = `${uniqueWilayah || 13} Kab/Kota`;
        document.getElementById("ipds-total-rows").textContent = `${auditCache.length} Baris Tervalidasi`;
        document.getElementById("ipds-total-indikator").textContent = `${indikatorList.length} Indikator`;

        if (indikatorList.length > 0) {
          try {
            const aiRes = await fetch(`/api/gateway/analytics/run?indikator=${encodeURIComponent(indikatorList[0])}`);
            const aiData = await aiRes.json();
            const histYears = (aiData.trend_historis || []).filter((t) => !t.is_forecast).map((t) => t.tahun);
            if (histYears.length > 0) {
              const minY = Math.min(...histYears);
              const maxY = Math.max(...histYears);
              document.getElementById("ipds-dim-tahun").textContent = minY === maxY ? `${minY}` : `${minY}–${maxY}`;
            } else {
              document.getElementById("ipds-dim-tahun").textContent = "2023–2025";
            }
          } catch (_) {
            document.getElementById("ipds-dim-tahun").textContent = "2023–2025";
          }
        } else {
          document.getElementById("ipds-dim-tahun").textContent = "Belum ada data";
        }

        renderAuditTable();
      } catch (err) {
        document.getElementById("ipds-etl-tbody").innerHTML = `<tr><td colspan="6" style="padding:14px;color:#dc2626;">Gagal terhubung ke Python FastAPI: ${err.message}</td></tr>`;
      }
    }

    document.getElementById("ipds-audit-search").addEventListener("input", renderAuditTable);
    document.getElementById("ipds-download-audit").addEventListener("click", () => {
      if (!auditCache.length) return;
      const csv = [
        "File_Sumber,Kode_BPS,Nama_Mentah,Nama_Standar,Nilai,Status",
        ...auditCache.map((r) => `"${r.file_sumber}",${r.kode_bps},"${r.nama_mentah}","${r.nama_standar}",${r.nilai},${r.status}`),
      ].join("\n");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
      a.download = "Log_Audit_ETL_BPS_Sulteng.csv";
      a.click();
    });

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    document.getElementById("ipds-etl-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = document.getElementById("ipds-etl-btn");
      const statusBox = document.getElementById("ipds-etl-status");
      const pipeBadge = document.getElementById("ipds-pipe-badge");
      const fileObj = document.getElementById("ipds-file-input").files[0];
      const fileName = fileObj ? fileObj.name : "dataset.xlsx";

      btn.disabled = true;
      btn.textContent = "Menjalankan Pipeline...";
      statusBox.innerHTML = "";
      pipeBadge.style.background = "#eff6ff";
      pipeBadge.style.color = "#1d4ed8";
      pipeBadge.textContent = "Tahap 1/3: Extract...";

      setStepState(1, "running", `Membaca lembar kerja dan header dari berkas "${fileName}"...`);
      setStepState(2, "idle");
      setStepState(3, "idle");
      await sleep(350);

      const uploadPromise = fetch("/api/gateway/etl/upload", { method: "POST", body: new FormData(e.target) });

      setStepState(1, "done", `Berkas "${fileName}" berhasil diekstrak oleh Pandas Reader.`);
      pipeBadge.textContent = "Tahap 2/3: Transform...";
      setStepState(2, "running", "Menyocokkan nama kabupaten/kota ke master kode BPS 72.xx...");
      await sleep(350);

      try {
        const res = await uploadPromise;
        const result = await res.json();

        if (res.ok) {
          setStepState(2, "done", `${result.total_baris_valid} baris wilayah terstandarisasi ke kode 72.xx.`);
          pipeBadge.textContent = "Tahap 3/3: Load Warehouse...";
          setStepState(3, "running", "Menyimpan fakta indikator ke PostgreSQL Data Warehouse...");
          await sleep(300);

          setStepState(3, "done", `${result.total_baris_valid} baris dimuat ke Star Schema (0 duplikasi).`);
          pipeBadge.style.background = "#ecfdf5";
          pipeBadge.style.color = "#059669";
          pipeBadge.textContent = "3/3 Tahap Selesai";

          statusBox.innerHTML = `<span style="color:#059669;font-weight:600;">Berhasil! ${result.total_baris_valid} baris data standar dari "${fileName}" telah dimuat ke Data Warehouse.</span>`;
          await loadEtlLogs();
        } else {
          pipeBadge.style.background = "#fef2f2";
          pipeBadge.style.color = "#dc2626";
          pipeBadge.textContent = "Pipeline Gagal";
          setStepState(2, "idle", "Terjadi kesalahan saat validasi isi berkas.");
          statusBox.innerHTML = `<span style="color:#dc2626;font-weight:600;">Error: ${result.detail || result.error}</span>`;
        }
      } catch (err) {
        pipeBadge.style.background = "#fef2f2";
        pipeBadge.style.color = "#dc2626";
        pipeBadge.textContent = "Koneksi Terputus";
        statusBox.innerHTML = `<span style="color:#dc2626;">Gagal mengirim file: ${err.message}</span>`;
      } finally {
        btn.disabled = false;
        btn.textContent = "Jalankan ETL & Load Warehouse";
      }
    });

    loadEtlLogs();
  }

  // ==========================================================
  // 4. HALAMAN 3: ANALYTICS & AI (ATAS RINGKAS + GRAFIK REAL-TIME)
  // ==========================================================
  function initAnalyticsPage() {
    const mainEl = document.querySelector("main") || document.body;
    mainEl.innerHTML = `
      <section style="max-width:1240px;margin:28px auto;padding:0 24px;">
        <div style="background:#fff;border:1px solid #cbd5e1;border-radius:16px;padding:24px;margin-bottom:20px;box-shadow:0 4px 12px rgba(15,23,42,0.03);">
          <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px;margin-bottom:18px;">
            <div>
              <span style="font-size:11px;font-weight:700;color:#7c3aed;background:#f5f3ff;padding:4px 10px;border-radius:999px;letter-spacing:0.03em;">SCIKIT-LEARN ENGINE: K-MEANS &amp; RIDGE REGRESSION</span>
              <h1 style="font-size:22px;font-weight:700;color:#0f172a;margin:8px 0 2px;">Analisis Spasial &amp; Prediksi Indikator 13 Kab/Kota Sulawesi Tengah</h1>
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
              <select id="ipds-indikator-select" style="padding:9px 12px;border:1px solid #cbd5e1;border-radius:9px;font-size:13px;font-weight:600;color:#0f172a;background:#fff;">
                <option value="Persentase Kemiskinan Makro">Persentase Kemiskinan Makro</option>
              </select>
              <button id="ipds-export-csv" style="background:#0f172a;color:#fff;border:none;padding:9px 16px;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer;">Ekspor CSV</button>
            </div>
          </div>

          <div id="ipds-ai-kpis" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;"></div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(440px,1fr));gap:20px;margin-bottom:20px;">
          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:22px;box-shadow:0 2px 6px rgba(15,23,42,0.03);">
            <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:14px;">
              <div>
                <h2 style="font-size:16px;font-weight:700;color:#0f172a;margin:0;">Pemetaan Klaster Indikator Kabupaten/Kota</h2>
                <p style="font-size:12px;color:#64748b;margin:2px 0 0;">Pengelompokan 13 daerah berdasarkan hasil klastering K-Means terkini.</p>
              </div>
              <div id="ipds-cluster-legend" style="display:flex;flex-wrap:wrap;gap:6px;font-size:11px;font-weight:700;"></div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700;color:#94a3b8;margin-bottom:10px;">
              <span>SATUAN WILAYAH (13 DAERAH)</span>
              <span>NILAI TERKINI</span>
            </div>
            <div id="ipds-bar-chart" style="display:flex;flex-direction:column;gap:10px;"></div>
          </div>

          <div style="display:flex;flex-direction:column;gap:20px;">
            <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:22px;box-shadow:0 2px 6px rgba(15,23,42,0.03);">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <div>
                  <h2 style="font-size:16px;font-weight:700;color:#0f172a;margin:0;">Proyeksi Tren Indikator 2026–2027</h2>
                  <p style="font-size:12px;color:#64748b;margin:2px 0 0;">Kurva historis database dan proyeksi Ridge Regression.</p>
                </div>
                <span style="background:#1d4ed8;color:#fff;font-size:11px;font-weight:700;padding:4px 10px;border-radius:8px;">Real-Time AI</span>
              </div>
              <div style="display:flex;gap:16px;font-size:11px;font-weight:600;margin-bottom:8px;">
                <span style="color:#2563eb;">&#9473; Data Historis (PostgreSQL)</span>
                <span style="color:#d97706;">&#9476; Proyeksi AI (2026–2027)</span>
              </div>
              <div id="ipds-trend-chart" style="width:100%;overflow-x:auto;"></div>
            </div>

            <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:22px;box-shadow:0 2px 6px rgba(15,23,42,0.03);">
              <h2 style="font-size:16px;font-weight:700;color:#0f172a;margin:0 0 12px;">Insight Otomatis AI &amp; Rekomendasi Kebijakan</h2>
              <div id="ipds-ai-insights" style="display:flex;flex-direction:column;gap:10px;font-size:13px;"></div>
            </div>
          </div>
        </div>

        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:24px;box-shadow:0 2px 6px rgba(15,23,42,0.03);">
          <h3 style="font-size:16px;font-weight:700;color:#0f172a;margin:0 0 14px;">Tabel Hasil Klastering &amp; Proyeksi 13 Kabupaten/Kota</h3>
          <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:13px;text-align:left;">
              <thead>
                <tr style="background:#f8fafc;border-bottom:1px solid #e2e8f0;color:#475569;">
                  <th style="padding:11px;">Kode BPS</th>
                  <th style="padding:11px;">Kabupaten / Kota</th>
                  <th style="padding:11px;">Nilai Terkini</th>
                  <th style="padding:11px;">Prediksi 2026 (Ridge)</th>
                  <th style="padding:11px;">Segmen Klaster (K-Means)</th>
                </tr>
              </thead>
              <tbody id="ipds-ai-tbody">
                <tr><td colspan="5" style="padding:14px;color:#64748b;">Menjalankan model Scikit-Learn dari server Python...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    `;

    let lastWilayahData = [];

    function renderSvgLineChart(trendList) {
      if (!trendList || trendList.length === 0) return "";
      const width = 520;
      const height = 205;
      const padL = 44;
      const padR = 28;
      const padT = 28;
      const padB = 34;

      const vals = trendList.map((d) => Number(d.nilai));
      const minV = Math.min(...vals);
      const maxV = Math.max(...vals);
      const span = maxV - minV || 1;
      const yMin = minV - span * 0.25;
      const yMax = maxV + span * 0.25;

      const pts = trendList.map((d, idx) => {
        const x =
          trendList.length === 1
            ? width / 2
            : padL + (idx / (trendList.length - 1)) * (width - padL - padR);
        const y = padT + ((yMax - Number(d.nilai)) / (yMax - yMin)) * (height - padT - padB);
        return { ...d, x, y };
      });

      const histPts = pts.filter((p) => !p.is_forecast);
      const lastHist = histPts[histPts.length - 1];
      const forePts = lastHist ? [lastHist, ...pts.filter((p) => p.is_forecast)] : pts.filter((p) => p.is_forecast);

      const histPath = histPts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
      const forePath = forePts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

      const gridLines = [0, 0.5, 1]
        .map((t) => {
          const y = padT + t * (height - padT - padB);
          const v = (yMax - t * (yMax - yMin)).toFixed(2);
          return `<line x1="${padL}" y1="${y}" x2="${width - padR}" y2="${y}" stroke="#f1f5f9" stroke-width="1" />
                  <text x="${padL - 8}" y="${y + 4}" text-anchor="end" font-size="10" fill="#94a3b8">${v}</text>`;
        })
        .join("");

      const circlesAndLabels = pts
        .map((p) => {
          const color = p.is_forecast ? "#d97706" : "#2563eb";
          const yrLabel = p.is_forecast ? `${p.tahun}*` : `${p.tahun}`;
          return `
            <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4.5" fill="#fff" stroke="${color}" stroke-width="2.5" />
            <text x="${p.x.toFixed(1)}" y="${(p.y - 10).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="700" fill="${color}">${Number(p.nilai).toFixed(2)}</text>
            <text x="${p.x.toFixed(1)}" y="${height - 10}" text-anchor="middle" font-size="11" font-weight="${p.is_forecast ? "700" : "500"}" fill="${p.is_forecast ? "#d97706" : "#64748b"}">${yrLabel}</text>
          `;
        })
        .join("");

      return `
        <svg viewBox="0 0 ${width} ${height}" style="width:100%;height:auto;display:block;">
          ${gridLines}
          ${histPath ? `<path d="${histPath}" fill="none" stroke="#2563eb" stroke-width="2.8" stroke-linecap="round" />` : ""}
          ${forePath ? `<path d="${forePath}" fill="none" stroke="#d97706" stroke-width="2.8" stroke-dasharray="6,5" stroke-linecap="round" />` : ""}
          ${circlesAndLabels}
        </svg>
      `;
    }

    async function loadIndicators() {
      try {
        const res = await fetch("/api/gateway/etl/logs");
        const data = await res.json();
        const select = document.getElementById("ipds-indikator-select");
        if (data.indikator_tersedia && data.indikator_tersedia.length > 0) {
          select.innerHTML = data.indikator_tersedia.map((ind) => `<option value="${ind}">${ind}</option>`).join("");
        }
      } catch (_) {}
    }

    async function runAiModel(indikator) {
      const tbody = document.getElementById("ipds-ai-tbody");
      try {
        const res = await fetch(`/api/gateway/analytics/run?indikator=${encodeURIComponent(indikator)}`);
        const data = await res.json();
        lastWilayahData = data.wilayah || [];

        document.getElementById("ipds-ai-kpis").innerHTML = `
          <div style="background:#f8fafc;padding:14px 16px;border-radius:12px;border:1px solid #e2e8f0;">
            <div style="font-size:12px;color:#64748b;">Cakupan Wilayah</div>
            <div style="font-size:22px;font-weight:700;color:#0f172a;margin-top:2px;">${data.kpi.total_wilayah} Kab/Kota</div>
          </div>
          <div style="background:#f8fafc;padding:14px 16px;border-radius:12px;border:1px solid #e2e8f0;">
            <div style="font-size:12px;color:#64748b;">Rata-Rata Provinsi (${data.tahun_terkini})</div>
            <div style="font-size:22px;font-weight:700;color:#1d4ed8;margin-top:2px;">${data.kpi.rata_rata_terkini}</div>
          </div>
          <div style="background:#f8fafc;padding:14px 16px;border-radius:12px;border:1px solid #e2e8f0;">
            <div style="font-size:12px;color:#64748b;">Proyeksi Regresi 2026</div>
            <div style="font-size:22px;font-weight:700;color:#059669;margin-top:2px;">${data.kpi.prediksi_provinsi_2026}</div>
          </div>
          <div style="background:#f8fafc;padding:14px 16px;border-radius:12px;border:1px solid #e2e8f0;">
            <div style="font-size:12px;color:#64748b;">Proyeksi Regresi 2027</div>
            <div style="font-size:22px;font-weight:700;color:#7c3aed;margin-top:2px;">${data.kpi.prediksi_provinsi_2027}</div>
          </div>
        `;

        const sortedByVal = [...lastWilayahData].sort((a, b) => b.nilai_terkini - a.nilai_terkini);
        const maxVal = Math.max(...sortedByVal.map((w) => w.nilai_terkini), 1);

        const highList = sortedByVal.filter((w) => w.cluster_id === 2);
        const midList = sortedByVal.filter((w) => w.cluster_id === 1);
        const lowList = sortedByVal.filter((w) => w.cluster_id === 0);

        document.getElementById("ipds-cluster-legend").innerHTML = `
          <span style="background:#fef2f2;color:#dc2626;padding:3px 8px;border-radius:999px;">&#9679; Tinggi (${highList.length})</span>
          <span style="background:#fefce8;color:#ca8a04;padding:3px 8px;border-radius:999px;">&#9679; Sedang (${midList.length})</span>
          <span style="background:#ecfdf5;color:#059669;padding:3px 8px;border-radius:999px;">&#9679; Rendah (${lowList.length})</span>
        `;

        const barColors = { 2: "#dc2626", 1: "#eab308", 0: "#059669" };
        document.getElementById("ipds-bar-chart").innerHTML = sortedByVal
          .map((w) => {
            const pct = Math.max(8, Math.round((w.nilai_terkini / maxVal) * 100));
            const color = barColors[w.cluster_id] || "#2563eb";
            return `
              <div style="display:grid;grid-template-columns:135px 1fr 52px;align-items:center;gap:10px;font-size:12px;">
                <span style="font-weight:600;color:#334155;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${w.nama_wilayah}</span>
                <div style="background:#f1f5f9;border-radius:6px;height:13px;overflow:hidden;">
                  <div style="width:${pct}%;background:${color};height:100%;border-radius:6px;transition:width 0.35s ease;"></div>
                </div>
                <span style="text-align:right;font-weight:700;color:${color};">${Number(w.nilai_terkini).toFixed(2)}</span>
              </div>
            `;
          })
          .join("");

        document.getElementById("ipds-trend-chart").innerHTML = renderSvgLineChart(data.trend_historis);

        const diff = (data.kpi.prediksi_provinsi_2027 - data.kpi.rata_rata_terkini).toFixed(2);
        const trendWord = Number(diff) <= 0 ? `penurunan sebesar <b>${diff}</b>` : `kenaikan sebesar <b>+${diff}</b>`;
        const topNames = highList.map((w) => w.nama_wilayah).join(", ") || "-";
        const optNames = lowList.map((w) => w.nama_wilayah).join(", ") || "-";

        document.getElementById("ipds-ai-insights").innerHTML = `
          <div style="background:#f8fafc;border-left:4px solid #2563eb;padding:10px 12px;border-radius:8px;color:#334155;">
            <b>Arah Tren Provinsi (${indikator}):</b> Rata-rata diproyeksikan mengalami ${trendWord} hingga 2027 (menjadi <b>${data.kpi.prediksi_provinsi_2027}</b>).
          </div>
          <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:10px 12px;border-radius:8px;color:#7f1d1d;">
            <b>Wilayah Prioritas (Klaster Tinggi):</b> Fokus perhatian diarahkan pada <b>${topNames}</b>.
          </div>
          <div style="background:#ecfdf5;border-left:4px solid #059669;padding:10px 12px;border-radius:8px;color:#065f46;">
            <b>Wilayah Optimal (Klaster Rendah):</b> Capaian terbaik berada di <b>${optNames}</b>.
          </div>
        `;

        const badgeColors = [
          "background:#ecfdf5;color:#059669;",
          "background:#fefce8;color:#ca8a04;",
          "background:#fef2f2;color:#dc2626;",
        ];

        tbody.innerHTML = lastWilayahData
          .map(
            (w) => `
          <tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:11px;font-family:monospace;color:#1d4ed8;font-weight:700;">${w.kode_bps}</td>
            <td style="padding:11px;font-weight:600;color:#0f172a;">${w.nama_wilayah}</td>
            <td style="padding:11px;">${w.nilai_terkini}</td>
            <td style="padding:11px;font-weight:700;color:#059669;">${w.prediksi_2026}</td>
            <td style="padding:11px;"><span style="${badgeColors[w.cluster_id] || badgeColors[0]}padding:4px 10px;border-radius:999px;font-size:11px;font-weight:700;">${w.cluster_label}</span></td>
          </tr>`
          )
          .join("");
      } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" style="padding:14px;color:#dc2626;">Gagal menjalankan model Python: ${err.message}</td></tr>`;
      }
    }

    document.getElementById("ipds-indikator-select").addEventListener("change", (e) => runAiModel(e.target.value));
    document.getElementById("ipds-export-csv").addEventListener("click", () => {
      if (!lastWilayahData.length) return;
      const headers = ["Kode_BPS", "Kabupaten_Kota", "Nilai_Terkini", "Prediksi_2026", "Klaster_KMeans"];
      const rows = lastWilayahData.map((w) => [w.kode_bps, `"${w.nama_wilayah}"`, w.nilai_terkini, w.prediksi_2026, `"${w.cluster_label}"`]);
      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
      a.download = "Hasil_Analisis_AI_BPS_Sulteng_2026.csv";
      a.click();
    });

    loadIndicators().then(() => runAiModel(document.getElementById("ipds-indikator-select").value));
  }
});