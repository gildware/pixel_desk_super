"use client";

import React, { useRef, useState } from "react";
import AspectRatioCropModal from "@/src/components/common/AspectRatioCropModal";
import { uploadFile } from "@/src/services/api/fileUpload.api";
import { isSvgFile } from "@/src/utils/cropExport";
import { widgetMediaUrl } from "@/src/utils/widgetMediaUrl";

type Props = {
  value: string;
  onChange: (url: string) => void;
  label: string;
  hint?: string;
  accept?: string;
  /** Compact square for icons; wide for preview screenshots */
  variant?: "icon" | "preview";
  /** Grid columns (width units), e.g. 2 for a 2×3 widget */
  gridCols?: number;
  /** Grid rows (height units), e.g. 3 for a 2×3 widget */
  gridRows?: number;
  align?: "left" | "center";
  /** Override pixel size per grid unit (default 150). */
  unitPx?: number;
  /** Hide the label row (when parent provides a section title). */
  hideLabel?: boolean;
};

/** Default pixel size per grid unit when not overridden. */
export const DEFAULT_GRID_UNIT_PX = 150;

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 16V4m0 0 8 8m-8-8-8 8" />
      <path d="M4 20h16" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export default function SimpleImageUpload({
  value,
  onChange,
  label,
  hint,
  accept = "image/png,image/jpeg,image/webp,image/gif,image/svg+xml",
  variant = "preview",
  gridCols,
  gridRows,
  align = "left",
  unitPx = DEFAULT_GRID_UNIT_PX,
  hideLabel = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [pendingFileName, setPendingFileName] = useState("image.jpg");

  const isIcon = variant === "icon";
  const cols = Math.max(1, gridCols ?? 1);
  const rows = Math.max(1, gridRows ?? 1);
  const cropAspect = cols / rows;
  const aspectLabel = `${cols}×${rows}`;

  const displayUrl = value ? widgetMediaUrl(value) : "";

  const uploadBlob = async (blob: Blob, fileName: string) => {
    setUploading(true);
    setLocalError(null);
    try {
      const file = new File([blob], fileName, {
        type: blob.type || "image/jpeg",
      });
      const url = await uploadFile(file);
      onChange(url);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;

    if (isSvgFile(file)) {
      await uploadBlob(file, file.name);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPendingFileName(file.name.replace(/\.[^.]+$/, ".jpg") || "image.jpg");
    setCropSrc(objectUrl);
  };

  const closeCrop = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleCropConfirm = async (blob: Blob) => {
    closeCrop();
    await uploadBlob(blob, pendingFileName);
  };

  const openPicker = () => {
    if (!uploading && !cropSrc) inputRef.current?.click();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (uploading) return;
    onChange("");
  };

  const boxStyle: React.CSSProperties = {
    width: cols * unitPx,
    height: rows * unitPx,
    maxWidth: "100%",
    flexShrink: 0,
  };

  const isCenter = align === "center";

  return (
    <>
      <div
        className={`flex w-full flex-col gap-1.5 ${isCenter ? "items-center text-center" : "items-start text-left"}`}
      >
        {!hideLabel && (
          <span className="text-theme-xs font-medium text-gray-700 dark:text-gray-300">
            {label}
            <span className="ml-1 font-normal text-gray-400 dark:text-gray-500">
              ({aspectLabel})
            </span>
          </span>
        )}

        <div
          role="button"
          tabIndex={0}
          onClick={openPicker}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openPicker();
            }
          }}
          style={boxStyle}
          className="group relative cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-gray-50 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 dark:border-gray-700 dark:bg-white/[0.04]"
        >
          {displayUrl ? (
            <img
              src={displayUrl}
              alt=""
              className={`block h-full w-full ${
                isIcon ? "object-contain p-2" : "object-cover object-center"
              }`}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-gray-400 dark:text-gray-500">
              <UploadIcon className="h-5 w-5 opacity-60" />
              <span className="text-[11px] font-medium">No image</span>
            </div>
          )}

          <div
            className={`absolute inset-0 flex items-center justify-center bg-black/55 transition-opacity ${
              uploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
          >
            <div className="flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-theme-xs font-semibold text-gray-800 shadow-sm">
              <UploadIcon className="h-3.5 w-3.5" />
              {uploading ? "Uploading…" : "Upload & crop"}
            </div>
          </div>

          {displayUrl && !uploading && (
            <button
              type="button"
              aria-label="Remove image"
              onClick={handleClear}
              className="absolute right-1.5 top-1.5 z-10 grid h-6 w-6 place-items-center rounded-full bg-gray-900/75 text-white shadow-sm transition hover:bg-error-600 dark:bg-black/70"
            >
              <CloseIcon className="h-3 w-3" />
            </button>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        {hint && (
          <p
            className={`max-w-full text-[11px] leading-snug text-gray-500 dark:text-gray-400 ${isCenter ? "text-center" : "text-left"}`}
          >
            {hint}
          </p>
        )}
        {localError && (
          <p
            className={`text-[11px] text-error-600 dark:text-error-400 ${isCenter ? "text-center" : "text-left"}`}
          >
            {localError}
          </p>
        )}
      </div>

      {cropSrc && (
        <AspectRatioCropModal
          isOpen
          imageSrc={cropSrc}
          aspect={cropAspect}
          aspectLabel={aspectLabel}
          onClose={closeCrop}
          onConfirmCrop={handleCropConfirm}
        />
      )}
    </>
  );
}
