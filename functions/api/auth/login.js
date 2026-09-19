import { createSessionCookie, json } from "../../_lib/auth.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const password = String(body.password || "");
  const expected = env.ADMIN_PASSWORD;
  if (!expected) {
    return json({ error: "ADMIN_PASSWORD not configured on Cloudflare" }, 500);
  }
  if (password !== expected) {
    return json({ error: "Wrong password" }, 401);
  }
  const cookie = await createSessionCookie(env);
  return json({ ok: true }, 200, { "Set-Cookie": cookie });
}
