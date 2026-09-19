(function () {
  const page = document.body.dataset.page;
  if (!page) return;

  let isAdmin = false;
  let editMode = false;
  let toolbar = null;
  const embedded =
    window.parent !== window || new URLSearchParams(location.search).get("embedded") === "1";
  let galleryAlbums = [];
  let activeGalleryFilter = "all";

  const GALLERY_PASTELS = [
    "#fdd85d",
    "#9ef4ff",
    "#f5d0e8",
    "#c8f0e4",
    "#ffe6a8",
    "#bfe4ec",
    "#ffd6a5",
    "#d4c4fb",
  ];

  function esc(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  async function checkAdmin() {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      isAdmin = !!data.authenticated;
      if (isAdmin) showToolbar();
    } catch {
      /* offline / no functions yet */
    }
  }

  function notifyParentEditState() {
    if (!embedded) return;
    try {
      window.parent.postMessage({ type: "mp-cms-edit-state", on: editMode }, location.origin);
    } catch {
      /* cross-origin guard */
    }
  }

  function setEditMode(on) {
    editMode = on;
    document.body.classList.toggle("cms-editing", editMode);
    document.querySelectorAll("[data-block]").forEach((el) => {
      if (editMode) {
        el.setAttribute("contenteditable", "true");
        el.setAttribute("spellcheck", "true");
      } else {
        el.removeAttribute("contenteditable");
      }
    });
    const btn = document.getElementById("cms-edit-toggle");
    const hint = document.getElementById("cms-edit-hint");
    const count = document.querySelectorAll("[data-block]").length;
    if (btn) btn.textContent = editMode ? "Stop editing" : "Edit text";
    if (hint) {
      hint.textContent = editMode
        ? `Click a yellow box to edit (${count} on this page) — click away to save`
        : "Press Edit text — works on every page while you're logged in";
    }
    if (on) sessionStorage.setItem("mp-edit-mode", "1");
    else sessionStorage.removeItem("mp-edit-mode");
    notifyParentEditState();
  }

  function showToolbar() {
    if (toolbar) return;
    toolbar = document.createElement("div");
    toolbar.id = "cms-toolbar";
    toolbar.innerHTML = embedded
      ? `<span>Editing in app</span>
      <button type="button" id="cms-edit-toggle">Edit text</button>
      <p class="cms-hint" id="cms-edit-hint">Click a yellow box — click away to save</p>`
      : `<span>MyPainter admin</span>
      <button type="button" id="cms-edit-toggle">Edit text</button>
      <a href="/admin/gallery.html">Gallery</a>
      <a href="/admin/">Dashboard</a>
      <button type="button" id="cms-logout">Log out</button>
      <p class="cms-hint" id="cms-edit-hint">Press Edit text, then click a yellow box (heading or intro)</p>`;
    document.body.appendChild(toolbar);

    document.getElementById("cms-edit-toggle").addEventListener("click", () => {
      setEditMode(!editMode);
    });

    const logoutBtn = document.getElementById("cms-logout");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        sessionStorage.removeItem("mp-edit-mode");
        await fetch("/api/auth/logout", { method: "POST" });
        location.reload();
      });
    }
  }

  window.addEventListener("message", (e) => {
    if (e.origin !== location.origin) return;
    if (e.data?.type === "mp-cms-edit" && isAdmin) setEditMode(!!e.data.on);
  });

  async function loadBlocks() {
    try {
      const res = await fetch(`/api/public/content/${page}`);
      const data = await res.json();
      for (const [key, content] of Object.entries(data.blocks || {})) {
        document.querySelectorAll(`[data-block="${key}"]`).forEach((el) => {
          if (el.dataset.blockHtml === "true") el.innerHTML = content;
          else el.textContent = content;
        });
      }
    } catch {
      /* keep static HTML */
    }
  }

  function bindEditable() {
    document.querySelectorAll("[data-block]").forEach((el) => {
      el.addEventListener("blur", async () => {
        if (!editMode || !isAdmin) return;
        const key = el.dataset.block;
        const content = el.dataset.blockHtml === "true" ? el.innerHTML.trim() : el.textContent.trim();
        el.classList.add("cms-saving");
        try {
          await fetch(`/api/content/${page}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key, content }),
          });
          el.classList.remove("cms-saving");
          el.classList.add("cms-saved");
          setTimeout(() => el.classList.remove("cms-saved"), 1200);
        } catch {
          el.classList.remove("cms-saving");
        }
      });
    });
  }

  function renderGalleryFilters() {
    const filters = document.getElementById("gallery-filters");
    if (!filters) return;

    const published = galleryAlbums.filter((a) => a.published !== false);
    if (!published.length) {
      filters.hidden = true;
      return;
    }

    filters.hidden = false;
    const allActive = activeGalleryFilter === "all" ? " active" : "";
    let html = `<button type="button" class="gallery-filter-pill gallery-filter-pill--all${allActive}" data-album="all">All photos</button>`;

    published.forEach((album, i) => {
      const bg = GALLERY_PASTELS[i % GALLERY_PASTELS.length];
      const active = activeGalleryFilter === album.id ? " active" : "";
      html += `<button type="button" class="gallery-filter-pill${active}" data-album="${esc(album.id)}" style="background:${bg}">${esc(album.title)}</button>`;
    });

    filters.innerHTML = html;
    filters.querySelectorAll(".gallery-filter-pill").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeGalleryFilter = btn.dataset.album;
        renderGalleryFilters();
        renderGalleryGrid();
      });
    });
  }

  function renderGalleryGrid() {
    const grid = document.getElementById("gallery-grid");
    if (!grid) return;

    let items = galleryAlbums.flatMap((album) =>
      (album.photos || []).map((p) => ({ ...p, albumId: album.id })),
    );

    if (activeGalleryFilter !== "all") {
      items = items.filter((p) => p.albumId === activeGalleryFilter);
    }

    if (!items.length) {
      grid.innerHTML = `<p class="gallery-empty">No photos in this folder yet.</p>`;
      return;
    }

    grid.innerHTML = items
      .map(
        (p) => `
        <figure class="gallery-item" data-album-id="${esc(p.albumId)}">
          <img src="${esc(p.url)}" alt="${esc(p.altText || p.caption)}" width="1000" height="1333" loading="lazy" />
          <figcaption>${esc(p.caption)}</figcaption>
        </figure>`,
      )
      .join("");
  }

  async function loadGallery() {
    const grid = document.getElementById("gallery-grid");
    if (!grid) return;
    try {
      const res = await fetch("/api/public/gallery");
      const data = await res.json();
      if (!data.albums?.length) return;
      galleryAlbums = data.albums;
      renderGalleryFilters();
      renderGalleryGrid();
    } catch {
      /* keep static gallery */
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    await loadBlocks();
    bindEditable();
    await loadGallery();
    await checkAdmin();
    if (isAdmin) {
      document.body.classList.add("cms-admin");
      if (embedded) document.body.classList.add("cms-embedded");
      if (new URLSearchParams(location.search).get("edit") === "1") {
        sessionStorage.setItem("mp-edit-mode", "1");
      }
      if (embedded || sessionStorage.getItem("mp-edit-mode") === "1") {
        setEditMode(true);
      }
    }
  });
})();
