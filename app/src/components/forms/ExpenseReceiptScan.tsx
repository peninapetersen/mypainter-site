import { useRef, useState } from "react";
import { Camera, Loader2, Upload } from "lucide-react";
import { scanReceiptImage } from "@/lib/scan-receipt";
import type { ReceiptScanResult } from "@/types/entities";

export function ExpenseReceiptScan({
  onScanned,
  onError,
  disabled,
}: {
  onScanned: (file: File, scan: ReceiptScanResult, raw: Record<string, unknown>) => void;
  onError: (msg: string) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  async function handleFile(file: File | null) {
    if (!file || disabled || scanning) return;
    setPreview(URL.createObjectURL(file));
    setScanning(true);
    try {
      const { scan, raw } = await scanReceiptImage(file);
      onScanned(file, scan, raw);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Could not read receipt");
      setPreview(null);
    } finally {
      setScanning(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-[#faf8f5] p-6">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
      {preview && (
        <div className="mb-4 flex justify-center">
          <img src={preview} alt="Receipt preview" className="max-h-48 rounded-lg border border-slate-200 object-contain" />
        </div>
      )}
      {scanning ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-[var(--mp-orange)]" />
          <p className="text-sm font-semibold text-[var(--mp-navy)]">Reading receipt…</p>
          <p className="text-xs text-slate-500">AI is filling in the form — no typing needed.</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-2 rounded-lg bg-[var(--mp-orange)] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            <Camera size={18} />
            Take photo of receipt
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-2 rounded-lg border border-[var(--mp-orange)] bg-white px-5 py-3 text-sm font-bold text-[var(--mp-orange)] disabled:opacity-50"
          >
            <Upload size={18} />
            Upload receipt
          </button>
        </div>
      )}
      <p className="mt-3 text-center text-xs text-slate-500">JPEG, PNG or WEBP · AI reads merchant, date, total & GST</p>
    </div>
  );
}
