import { requireAuth, json } from "../../_lib/auth.js";

export async function onRequestGet(context) {
  const ok = await requireAuth(context.request, context.env);
  return json({ authenticated: ok });
}
