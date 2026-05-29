"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Cropper, { Area, Point } from "react-easy-crop";
import { getCroppedImageBlob } from "@/src/utils/cropExport";

type Props = {
  isOpen: boolean;
  imageSrc: string;
  aspect: number;
  aspectLabel: string;
  onClose: () => void;
  onConfirmCrop: (blob: Blob) => void | Promise<void>;
};

export default function AspectRatioCropModal({
  isOpen,
  imageSrc,
  aspect,
  aspectLabel,
  onClose,
  onConfirmCrop,
}: Props) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [busy, setBusy] = useState(false);
  const croppedPixelsRef = useRef<Area | null>(null);

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    croppedPixelsRef.current = areaPixels;
  }, []);

  useEffect(() => {
    if (isOpen && imageSrc) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      croppedPixelsRef.current = null;
    }
  }, [isOpen, imageSrc]);

  const handleApply = async () => {
    const pixels = croppedPixelsRef.current;
    if (!pixels) return;
    setBusy(true);
    try {
      const blob = await getCroppedImageBlob(imageSrc, pixels);
      await onConfirmCrop(blob);
    } catch (e) {
      console.error("Crop failed", e);
    } finally {
      setBusy(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close crop dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Crop image"
        className="relative z-10 flex w-full max-w-lg flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-800 dark:bg-gray-950"
      >
        <h3 className="text-center text-theme-sm font-semibold text-gray-900 dark:text-white">
          Crop preview
        </h3>
        <p className="mt-1 text-center text-theme-xs text-gray-500 dark:text-gray-400">
          Match widget grid ratio {aspectLabel}. Drag to reposition, zoom to frame.
        </p>

        <div className="relative mt-4 h-[min(50vh,320px)] w-full overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape="rect"
            showGrid
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <label className="mt-4 flex items-center gap-3 text-theme-xs text-gray-600 dark:text-gray-400">
          <span className="shrink-0">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-brand-500"
          />
        </label>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="h-9 rounded-lg border border-gray-200 px-4 text-theme-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={busy}
            className="h-9 rounded-lg bg-brand-500 px-4 text-theme-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {busy ? "Applying…" : "Apply crop"}
          </button>
        </div>
      </div>
    </div>
  );
}
