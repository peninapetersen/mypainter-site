import { useEffect, useState } from "react";

/** Total row count for a list API — used on start pages for "View all (n)". */
export function useListCount(loader: () => Promise<unknown[]>) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    loader()
      .then((rows) => {
        if (!cancelled) setCount(rows.length);
      })
      .catch(() => {
        if (!cancelled) setCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [loader]);

  return count;
}
