import { useEffect, useRef, useState } from "react";
import { FolderOpen, Trash2, Upload } from "lucide-react";
import { getRequestImageUrl, MAX_IMAGES, uploadRequestImage } from "@/lib/request-images";

type RequestImage = { path: string; caption?: string };

export function RequestImageUpload({
  images,
  onChange,
  folderId,
  onError,
}: {
  images: RequestImage[];
  onChange: (images: RequestImage[]) => void;
  folderId: string;
  onError: (msg: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState("");
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    images.forEach((img) => {
      getRequestImageUrl(img.path)
        .then((url) => setUrls((u) => (u[img.path] ? u : { ...u, [img.path]: url })))
        .catch(() => {});
    });
  }, [images]);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      onError(`Maximum ${MAX_IMAGES} images.`);
      return;
    }
    setUploading(true);
    setLocalError("");
    try {
      const added: RequestImage[] = [];
      for (const file of Array.from(files).slice(0, remaining)) {
        const path = await uploadRequestImage(file, folderId);
        added.push({ path });
      }
      onChange([...images, ...added]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setLocalError(msg);
      onError(msg);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">Share images of the work to be done</p>
        <span className="text-sm text-slate-400">
          {images.length}/{MAX_IMAGES}
        </span>
      </div>
      {images.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {images.map((img) => (
            <div key={img.path} className="relative h-20 w-20 overflow-hidden rounded-lg border border-slate-200">
              {urls[img.path] ? (
                <img src={urls[img.path]} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center bg-slate-100 text-xs text-slate-400">…</div>
              )}
              <button
                type="button"
                onClick={() => onChange(images.filter((i) => i.path !== img.path))}
                className="absolute right-0.5 top-0.5 rounded bg-white/90 p-0.5 text-red-600 shadow"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <button
          type="button"
          disabled={uploading || images.length >= MAX_IMAGES}
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 rounded-lg bg-[var(--mp-orange)] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          <FolderOpen size={16} />
          Choose Images
        </button>
        <button
          type="button"
          disabled={uploading || images.length >= MAX_IMAGES}
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
        >
          <Upload size={16} />
          Upload New
        </button>
      </div>
      {uploading && <p className="mt-2 text-center text-sm text-slate-500">Uploading…</p>}
      {localError && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{localError}</p>
      )}
    </div>
  );
}
