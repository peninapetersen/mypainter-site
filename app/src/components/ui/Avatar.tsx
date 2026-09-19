import { useEffect, useState } from "react";
import { getGalleryImageUrl } from "@/lib/app-images";
import { avatarInitials } from "@/lib/crew-avatars";

export function Avatar({
  photoPath,
  name,
  size = 36,
  rounded = "full",
  className = "",
}: {
  photoPath?: string;
  name: string;
  size?: number;
  rounded?: "full" | "lg";
  className?: string;
}) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!photoPath) {
      setUrl("");
      return;
    }
    getGalleryImageUrl(photoPath)
      .then(setUrl)
      .catch(() => setUrl(""));
  }, [photoPath]);

  const style = { width: size, height: size, minWidth: size };
  const radius = rounded === "lg" ? "rounded-lg" : "rounded-full";

  if (url) {
    return (
      <img
        src={url}
        alt=""
        style={style}
        className={`shrink-0 object-cover ring-2 ring-white ${radius} ${className}`}
      />
    );
  }

  return (
    <span
      style={style}
      className={`flex shrink-0 items-center justify-center bg-sky-100 text-xs font-bold text-sky-800 ring-2 ring-white ${radius} ${className}`}
      aria-hidden
    >
      {avatarInitials(name)}
    </span>
  );
}
