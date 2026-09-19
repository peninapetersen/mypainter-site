/** SPA fallback for /app/* — return index.html body with 200 (keep URL). */
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;

  if (path.startsWith("/app/assets/") || /\.[a-z0-9]+$/i.test(path)) {
    return context.env.ASSETS.fetch(context.request);
  }

  const indexReq = new Request(new URL("/app/index.html", url.origin), {
    redirect: "follow",
  });
  const indexRes = await context.env.ASSETS.fetch(indexReq);
  const headers = new Headers(indexRes.headers);
  headers.set("Content-Type", "text/html; charset=utf-8");
  headers.delete("Content-Length");

  return new Response(indexRes.body, { status: 200, headers });
}
