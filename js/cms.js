(function () {
  const page = document.body.dataset.page;
  if (!page) return;

  let isAdmin = false;
  let editMode = false;
  let toolbar = null;

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

  function showToolbar() {
    if (toolbar) return;
    toolbar = document.createElement("div");
    toolbar.id = "cms-toolbar";
    toolbar.innerHTML = `
      <span>MyPainter admin</span>
      <button type="button" id="cms-edit-toggle">Edit text</button>
      <a href="/admin/gallery.html">Gallery</a>
      <a href="/admin/">Dashboard</a>
      <button type="button" id="cms-logout">Log out</button>`;
    document.body.appendChild(toolbar);

    document.getElementById("cms-edit-toggle").addEventListener("click", () => {
      editMode = !editMode;
      document.body.classList.toggle("cms-editing", editMode);
      document.getElementById("cms-edit-toggle").textContent = editMode ? "Stop editing" : "Edit text";
    });

    document.getElementById("cms-logout").addEventListener("click", async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      location.reload();
    });
  }

  async function loadBlocks() {
    try {
      const res = await fetch(`/api/public/content/${page}`);
      const data = await res.json();
      for (const [key, content] of Object.entries(data.blocks || {})) {
        document.querySelectorAll(`[data-block="${key}"]`).forEach((el) => {
          el.textContent = content;
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
        const content = el.textContent.trim();
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

  async function loadGallery() {
    const grid = document.getElementById("gallery-grid");
    if (!grid) return;
    try {
      const res = await fetch("/api/public/gallery");
      const data = await res.json();
      if (!data.albums?.length) return;
      grid.innerHTML = data.albums
        .flatMap((album) =>
          (album.photos || []).map(
            (p) => `
        <figure class="gallery-item">
          <img src="${p.url}" alt="${p.altText || p.caption}" width="1000" height="1333" loading="lazy" />
          <figcaption>${p.caption}</figcaption>
        </figure>`,
          ),
        )
        .join("");
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
      document.querySelectorAll("[data-block]").forEach((el) => {
        el.setAttribute("contenteditable", "true");
        el.setAttribute("spellcheck", "true");
      });
    }
  });
})();
