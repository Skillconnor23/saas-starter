'use client';

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { getCroppedImg, type CroppedAreaPixels } from '@/lib/upload/crop';

type Props = {
  imageSrc: string;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
};

export function AvatarCropModal({ imageSrc, onConfirm, onCancel }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedAreaPixels | null>(null);
  const [pending, setPending] = useState(false);

  const onCropComplete = useCallback((_croppedArea: Area, pixels: CroppedAreaPixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function handleConfirm() {
    if (!croppedAreaPixels) return;
    setPending(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onConfirm(blob);
    } catch (err) {
      console.error('Crop failed:', err);
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-labelledby="crop-modal-title"
    >
      <h2 id="crop-modal-title" className="sr-only">
        Crop profile photo
      </h2>
      <div className="relative h-[min(70vh,400px)] w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          style={{
            containerStyle: { borderRadius: 8 },
            cropAreaStyle: { border: '2px solid white', boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' },
          }}
        />
      </div>
      <div className="mt-4 flex gap-3">
        <Button variant="outline" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button onClick={handleConfirm} disabled={pending || !croppedAreaPixels}>
          {pending ? 'Processing...' : 'Use photo'}
        </Button>
      </div>
    </div>
  );
}
