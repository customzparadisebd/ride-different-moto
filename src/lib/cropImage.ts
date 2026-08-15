export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  rotation = 0
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  const rotRad = (rotation * Math.PI) / 180;

  // calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  // set canvas size to match the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // translate canvas context to a central point to allow rotating and flipping around the center
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);

  // draw rotated image
  ctx.drawImage(image, 0, 0);

  // croppedAreaPixels values are bounding box relative
  // extract the cropped image using these values
  const data = ctx.getImageData(
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height
  );

  // set canvas width to final desired crop size - resizing to 400x400
  canvas.width = 400;
  canvas.height = 400;

  // paste generated rotate image with correct offsets for x,y crop values.
  ctx.putImageData(data, 0, 0);

  // We want to scale the 400x400 area if the data is different size, 
  // but putImageData doesn't scale.
  // Instead, we use another canvas to resize.
  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = 400;
  finalCanvas.height = 400;
  const finalCtx = finalCanvas.getContext("2d");
  
  if (!finalCtx) throw new Error("No 2d context for final canvas");

  // Create a temporary canvas to draw the cropped data
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = pixelCrop.width;
  tempCanvas.height = pixelCrop.height;
  const tempCtx = tempCanvas.getContext("2d");
  if (!tempCtx) throw new Error("No 2d context for temp canvas");
  tempCtx.putImageData(data, 0, 0);

  // Draw scaled
  finalCtx.drawImage(tempCanvas, 0, 0, pixelCrop.width, pixelCrop.height, 0, 0, 400, 400);

  // As a blob
  return new Promise((resolve, reject) => {
    finalCanvas.toBlob((file) => {
      if (file) resolve(file);
      else reject(new Error("Canvas is empty"));
    }, "image/webp", 0.9);
  });
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous"); // needed to avoid cross-origin issues on CodeSandbox
    image.src = url;
  });

function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = (rotation * Math.PI) / 180;

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}
