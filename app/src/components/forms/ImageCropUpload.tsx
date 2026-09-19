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
  onUploaded?: (path: string) => void | Promise<void>;
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
  onUploaded,
  round = true,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const localPreviewRef = useRef<string>("");
  const boundsRef = useRef({ minSize: 80, maxSize: 400 });
  const [previewUrl, setPreviewUrl] = useState("");
  const [cropOpen, setCropOpen] = useState(false);
  const [cropImage, setCropImage] = useState<HTMLImageElement | null>(null);
  const [cropSize, setCropSize] = useState(0);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [zoom, setZoom] = useState(0);
  const [uploading, setUploading] = useState(false);

  function setLocalPreview(url: string) {
    if (localPreviewRef.current) URL.revokeObjectURL(localPreviewRef.current);
    localPreviewRef.current = url;
    setPreviewUrl(url);
  }

  useEffect(() => {
    return () => {
      if (localPreviewRef.current) URL.revokeObjectURL(localPreviewRef.current);
    };
  }, []);

  useEffect(() => {
    if (!photoPath) {
      if (!localPreviewRef.current) setPreviewUrl("");
      return;
    }
    getGalleryImageUrl(photoPath)
      .then((url) => {
        if (localPreviewRef.current) URL.revokeObjectURL(localPreviewRef.current);
        localPreviewRef.current = "";
        setPreviewUrl(url);
      })
      .catch(() => {
        if (!localPreviewRef.current) setPreviewUrl("");
      });
  }, [photoPath]);

  function clampPosition(x: number, y: number, size: number, img: HTMLImageElement) {
    const maxX = Math.max(0, img.naturalWidth - size);
    const maxY = Math.max(0, img.naturalHeight - size);
    return {
      x: Math.min(Math.max(0, x), maxX),
      y: Math.min(Math.max(0, y), maxY),
    };
  }

  function applyZoom(z: number, img: HTMLImageElement, sizeOverride?: number) {
    const { minSize, maxSize } = boundsRef.current;
    const size = sizeOverride ?? Math.round(maxSize - (z / 100) * (maxSize - minSize));
    const { x, y } = clampPosition(cropX, cropY, size, img);
    setZoom(z);
    setCropSize(size);
    setCropX(x);
    setCropY(y);
  }

  function openFile(file: File) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const maxSize = Math.min(img.naturalWidth, img.naturalHeight);
      const minSize = Math.max(48, Math.round(maxSize * 0.25));
      boundsRef.current = { minSize, maxSize };
      const startX = Math.floor((img.naturalWidth - maxSize) / 2);
      const startY = Math.floor((img.naturalHeight - maxSize) / 2);
      setCropImage(img);
      setCropSize(maxSize);
      setCropX(startX);
      setCropY(startY);
      setZoom(0);
      setCropOpen(true);
    };
    img.onerror = () => onError("Could not read that image.");
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
    setCropImage(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function saveCrop() {
    if (!cropImage) return;
    setUploading(true);
    try {
      const file = await cropSquareToFile(cropImage, cropX, cropY, cropSize, "headshot.jpg");
      setLocalPreview(URL.createObjectURL(file));
      const path = await uploadGalleryImage(file, folder, folderId);
      onChange(path);
      await onUploaded?.(path);
      closeCrop();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const shape = round ? "rounded-full" : "rounded-xl";
  const maxX = cropImage ? Math.max(0, cropImage.naturalWidth - cropSize) : 0;
  const maxY = cropImage ? Math.max(0, cropImage.naturalHeight - cropSize) : 0;

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
            <label className="mb-2 block text-xs font-semibold text-slate-500">Zoom</label>
            <input
              type="range"
              min={0}
              max={100}
              value={zoom}
              onChange={(e) => applyZoom(Number(e.target.value), cropImage)}
              className="mb-3 w-full"
            />
            <label className="mb-2 block text-xs font-semibold text-slate-500">Horizontal</label>
            <input
              type="range"
              min={0}
              max={maxX}
              value={cropX}
              onChange={(e) => setCropX(Number(e.target.value))}
              className="mb-3 w-full"
            />
            <label className="mb-2 block text-xs font-semibold text-slate-500">Vertical</label>
            <input
              type="range"
              min={0}
              max={maxY}
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
