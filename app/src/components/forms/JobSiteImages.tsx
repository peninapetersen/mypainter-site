import { useEffect, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { type GalleryImage, getGalleryImageUrl, uploadGalleryImage } from "@/lib/app-images";

const MAX = 20;

export function JobSiteImages({
  images,
  onChange,
  jobsOnId,
  onError,
}: {
  images: GalleryImage[];
  onChange: (images: GalleryImage[]) => void;
  jobsOnId: string;
  onError: (msg: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    images.forEach((img) => {
      if (urls[img.path]) return;
      getGalleryImageUrl(img.path)
        .then((u) => setUrls((prev) => ({ ...prev, [img.path]: u })))
        .catch(() => {});
    });
  }, [images, urls]);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const room = MAX - images.length;
    if (room <= 0) {
      onError(`Maximum ${MAX} photos.`);
      return;
    }
    setUploading(true);
    try {
      const added: GalleryImage[] = [];
      for (const file of Array.from(files).slice(0, room)) {
        const path = await uploadGalleryImage(file, "jobs-on", jobsOnId);
        added.push({ path, caption: "" });
      }
      onChange([...images, ...added]);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function updateCaption(path: string, caption: string) {
    onChange(images.map((i) => (i.path === path ? { ...i, caption } : i)));
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-3">
        {images.map((img) => (
          <div key={img.path} className="w-36 shrink-0">
            <div className="relative aspect-square overflow-hidden rounded-lg border border-slate-200">
              {urls[img.path] ? (
                <img src={urls[img.path]} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center bg-slate-100 text-xs text-slate-400">…</div>
              )}
              <button
                type="button"
                onClick={() => onChange(images.filter((i) => i.path !== img.path))}
                className="absolute right-1 top-1 rounded bg-white/90 p-1 text-red-600 shadow"
              >
                <Trash2 size={12} />
              </button>
            </div>
            <input
              value={img.caption ?? ""}
              onChange={(e) => updateCaption(img.path, e.target.value)}
              placeholder="e.g. Bedroom"
              className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-xs"
            />
          </div>
        ))}
        {images.length < MAX && (
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square w-36 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-500 hover:border-[var(--mp-orange)]"
          >
            <Plus size={24} />
            <span className="mt-1 text-xs font-semibold">{uploading ? "Uploading…" : "Add photo"}</span>
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple capture="environment" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      <p className="text-xs text-slate-500">Label photos (Bedroom, Kitchen…) — linked to this job on site.</p>
    </div>
  );
}
