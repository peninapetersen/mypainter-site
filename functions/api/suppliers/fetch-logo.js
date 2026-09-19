async function verifySupabaseUser(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;
  const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL || "https://jkampxliebnzsevvmqre.supabase.co";
  const anon = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
  if (!anon) return null;
  const res = await fetch(`${url}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: anon },
  });
  if (!res.ok) return null;
  return res.json();
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function normalizeWebsite(raw) {
  let u = String(raw || "").trim();
  if (!u) return null;
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  try {
    return new URL(u);
  } catch {
    return null;
  }
}

function absUrl(href, base) {
  try {
    return new URL(href, base).href;
  } catch {
    return null;
  }
}

async function logoCandidates(pageUrl) {
  const origin = pageUrl.origin;
  const list = [
    `https://www.google.com/s2/favicons?domain=${pageUrl.hostname}&sz=128`,
    `${origin}/apple-touch-icon.png`,
    `${origin}/apple-touch-icon-precomposed.png`,
    `${origin}/favicon.ico`,
  ];

  try {
    const res = await fetch(pageUrl.href, {
      headers: { "User-Agent": "MyPainter/1.0 (+https://mypainter.co.nz)" },
      redirect: "follow",
    });
    if (res.ok) {
      const html = await res.text();
      const linkRe = /<link[^>]+rel=["'](?:shortcut icon|icon|apple-touch-icon)["'][^>]*>/gi;
      let m;
      while ((m = linkRe.exec(html))) {
        const href = m[0].match(/href=["']([^"']+)["']/i)?.[1];
        if (href) {
          const u = absUrl(href, pageUrl);
          if (u) list.unshift(u);
        }
      }
      const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
      if (og?.[1]) {
        const u = absUrl(og[1], pageUrl);
        if (u) list.unshift(u);
      }
    }
  } catch {
    /* page fetch optional */
  }

  return [...new Set(list)];
}

async function downloadLogo(candidates) {
  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "MyPainter/1.0 (+https://mypainter.co.nz)" },
        redirect: "follow",
      });
      if (!res.ok) continue;
      const ct = (res.headers.get("content-type") || "").split(";")[0].trim();
      const buf = await res.arrayBuffer();
      if (buf.byteLength < 80) continue;
      if (!ct.startsWith("image/") && !url.includes("favicon") && !url.includes("google.com/s2/favicons")) continue;
      const ext =
        ct.includes("png") ? "png" : ct.includes("webp") ? "webp" : ct.includes("svg") ? "svg" : ct.includes("gif") ? "gif" : "ico";
      return { buf, contentType: ct.startsWith("image/") ? ct : "image/x-icon", ext };
    } catch {
      /* try next */
    }
  }
  return null;
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const user = await verifySupabaseUser(request, env);
  if (!user?.id) return json({ error: "Not signed in" }, 401);

  const body = await request.json().catch(() => ({}));
  const pageUrl = normalizeWebsite(body.website);
  if (!pageUrl) return json({ error: "Enter a valid website URL" }, 400);

  const downloaded = await downloadLogo(await logoCandidates(pageUrl));
  if (!downloaded) return json({ error: "Could not find a logo on that website" }, 404);

  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || "https://jkampxliebnzsevvmqre.supabase.co";
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const anon = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
  const userToken = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const authHeader = serviceKey ? `Bearer ${serviceKey}` : `Bearer ${userToken}`;
  const apiKey = serviceKey || anon;
  if (!apiKey) return json({ error: "Supabase not configured on server" }, 503);

  const objectPath = `supplier-logos/${user.id}/${crypto.randomUUID()}.${downloaded.ext}`;
  const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/mypainter-gallery/${objectPath}`, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      apikey: apiKey,
      "Content-Type": downloaded.contentType,
      "x-upsert": "false",
    },
    body: downloaded.buf,
  });

  if (!uploadRes.ok) {
    const detail = await uploadRes.text();
    return json({ error: detail || "Upload failed" }, uploadRes.status);
  }

  const signRes = await fetch(
    `${supabaseUrl}/storage/v1/object/sign/mypainter-gallery/${objectPath}`,
    {
      method: "POST",
      headers: { Authorization: authHeader, apikey: apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ expiresIn: 3600 }),
    },
  );
  let previewUrl = "";
  if (signRes.ok) {
    const signed = await signRes.json();
    if (signed?.signedURL) previewUrl = `${supabaseUrl}/storage/v1${signed.signedURL}`;
  }

  return json({ path: objectPath, previewUrl });
}
