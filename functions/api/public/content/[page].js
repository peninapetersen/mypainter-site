import { json } from "../../../_lib/auth.js";
import { rowsToBlocks } from "../../../_lib/content.js";

export async function onRequestGet(context) {
  const { DB } = context.env;
  const page = context.params.page;
  if (!DB) return json({ page, blocks: {} });

  try {
    const { results } = await DB.prepare(
      "SELECT block_key, content FROM page_blocks WHERE page_slug = ?",
    )
      .bind(page)
      .all();
    return json({ page, blocks: rowsToBlocks(results) });
  } catch {
    return json({ page, blocks: {} });
  }
}
