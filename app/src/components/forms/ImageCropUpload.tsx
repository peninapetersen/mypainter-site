import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, X } from "lucide-react";
import { cropSquareToFile, getGalleryImageUrl, uploadGalleryImage } from "@/lib/app-images";

type Props = {
  label: string;
  photoPath: string;
  folder: string;
  folderId: string;
  displayName: string;
  onChange: (path: string) => void;
  onError: (msg: string) => void;
  round?: boolean;
};

export function ImageCropUpload({
  label,
  photoPath,
  folder,
  folderId,
  displayName,
  onChange,
  onError,
  round = true,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState("");
  const [cropImage, setCropImage] = useState<HTMLImageElement | null>(null);
  const [cropSize, setCropSize] = useState(0);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!photoPath) {
      setPreviewUrl("");
      return;
    }
    getGalleryImageUrl(photoPath)
      .then(setPreviewUrl)
      .catch(() => setPreviewUrl(""));
  }, [photoPath]);

  function openFile(file: File) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const size = Math.min(img.naturalWidth, img.naturalHeight);
      setCropImage(img);
      setCropSrc(url);
      setCropSize(size);
      setCropX(Math.floor((img.naturalWidth - size) / 2));
      setCropY(Math.floor((img.naturalHeight - size) / 2));
      setCropOpen(true);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      onError("Could not read that image.");
    };
    img.src = url;
  }

  const drawPreview = useCallback(() => {
    if (!cropImage || !previewCanvasRef.current) return;
    const canvas = previewCanvasRef.current;
    const size = 240;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(cropImage, cropX, cropY, cropSize, cropSize, 0, 0, size, size);
  }, [cropImage, cropX, cropY, cropSize]);

  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  function closeCrop() {
    setCropOpen(false);
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc("");
    setCropImage(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function saveCrop() {
    if (!cropImage) return;
    setUploading(true);
    try {
      const file = await cropSquareToFile(cropImage, cropX, cropY, cropSize, "headshot.jpg");
      const path = await uploadGalleryImage(file, folder, folderId);
      onChange(path);
      closeCrop();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const shape = round ? "rounded-full" : "rounded-xl";

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-slate-700">{label}</p>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`relative flex h-20 w-20 items-center justify-center overflow-hidden border-2 border-dashed border-slate-300 bg-slate-50 ${shape} hover:border-[var(--mp-orange)]`}
        >
          {previewUrl ? (
            <img src={previewUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <Camera size={28} className="text-slate-400" />
          )}
        </button>
        <div className="text-sm">
          <p className="font-medium text-slate-800">{displayName || "Upload photo"}</p>
          <p className="text-xs text-slate-500">Tap to upload — square crop for best results</p>
          {photoPath && (
            <button type="button" onClick={() => onChange("")} className="mt-1 text-xs text-red-600 hover:underline">
              Remove photo
            </button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) openFile(f);
        }}
      />

      {cropOpen && cropImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold text-[var(--mp-navy)]">Crop photo</h3>
              <button type="button" onClick={closeCrop} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>
            <div className="mx-auto mb-4 flex justify-center">
              <canvas ref={previewCanvasRef} className={`h-60 w-60 bg-slate-900 ${shape}`} />
            </div>
            <label className="mb-2 block text-xs font-semibold text-slate-500">Zoom / position (horizontal)</label>
            <input
              type="range"
              min={0}
              max={Math.max(0, cropImage.naturalWidth - cropSize)}
              value={cropX}
              onChange={(e) => setCropX(Number(e.target.value))}
              className="mb-3 w-full"
            />
            <label className="mb-2 block text-xs font-semibold text-slate-500">Vertical</label>
            <input
              type="range"
              min={0}
              max={Math.max(0, cropImage.naturalHeight - cropSize)}
              value={cropY}
              onChange={(e) => setCropY(Number(e.target.value))}
              className="mb-4 w-full"
            />
            <div className="flex gap-2">
              <button type="button" onClick={closeCrop} className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-semibold">
                Cancel
              </button>
              <button
                type="button"
                disabled={uploading}
                onClick={saveCrop}
                className="flex-1 rounded-lg bg-[var(--mp-orange)] py-2 text-sm font-bold text-white disabled:opacity-60"
              >
                {uploading ? "Saving…" : "Use photo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
