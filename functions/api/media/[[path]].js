export async function onRequestGet(context) {
  const { GALLERY } = context.env;
  if (!GALLERY) return new Response("Not configured", { status: 503 });

  const key = (context.params.path || []).join("/");
  if (!key) return new Response("Not found", { status: 404 });

  const obj = await GALLERY.get(key);
  if (!obj) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  headers.set("Content-Type", obj.httpMetadata?.contentType || "image/jpeg");
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return new Response(obj.body, { headers });
}
