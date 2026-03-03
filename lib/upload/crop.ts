/**
 * Helpers for exporting cropped images from react-easy-crop.
 * Output is a square image at OUTPUT_SIZE for consistent avatar display.
 */
const OUTPUT_SIZE = 512;

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', reject);
    image.src = url;
  });
}

export type CroppedAreaPixels = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Returns a 512x512 WebP blob from the cropped area.
 * WebP gives good size/quality. JPEG would be smaller but no transparency support.
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: CroppedAreaPixels
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2d context not available');

  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed'));
      },
      'image/webp',
      0.92
    );
  });
}
