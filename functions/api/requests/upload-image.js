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

export async function onRequestPost(context) {
  const { request, env } = context;
  const user = await verifySupabaseUser(request, env);
  if (!user?.id) return json({ error: "Not signed in" }, 401);

  const form = await request.formData();
  const file = form.get("file");
  const folderId = String(form.get("folderId") || "").trim();
  if (!(file instanceof File) || !folderId) return json({ error: "Missing file or folderId" }, 400);

  const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL || "https://jkampxliebnzsevvmqre.supabase.co";
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const anon = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
  const userToken = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const objectPath = `request-images/${user.id}/${folderId}/${crypto.randomUUID()}.${ext}`;
  const contentType = file.type || "image/jpeg";
  const body = await file.arrayBuffer();

  const authHeader = serviceKey ? `Bearer ${serviceKey}` : `Bearer ${userToken}`;
  const apiKey = serviceKey || anon;

  if (!apiKey) return json({ error: "Supabase not configured on server" }, 503);

  const uploadRes = await fetch(`${url}/storage/v1/object/mypainter-gallery/${objectPath}`, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      apikey: apiKey,
      "Content-Type": contentType,
      "x-upsert": "false",
    },
    body,
  });

  if (!uploadRes.ok) {
    const detail = await uploadRes.text();
    if (detail.includes("Bucket not found") || detail.includes("not found")) {
      return json(
        { error: "Storage bucket missing — run migration 008 in Supabase SQL Editor." },
        503,
      );
    }
    return json({ error: detail || "Upload failed" }, uploadRes.status);
  }

  return json({ path: objectPath });
}
