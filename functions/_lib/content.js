export function rowsToBlocks(rows) {
  const blocks = {};
  for (const row of rows || []) {
    blocks[row.block_key] = row.content;
  }
  return blocks;
}
