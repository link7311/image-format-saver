export const formats = {
  jpg: { mime: 'image/jpeg', quality: 0.95 },
  png: { mime: 'image/png' },
  webp: { mime: 'image/webp', quality: 0.95 }
};

export function filenameFor(source, format) {
  let name = 'image';
  try {
    const url = new URL(source);
    if (['http:', 'https:'].includes(url.protocol)) {
      name = decodeURIComponent(url.pathname.split('/').pop()) || name;
    }
  } catch { /* Keep the fallback for malformed URLs / encoding. */ }
  name = name.replace(/\.(?:avif|bmp|gif|ico|jfif|jpe?g|png|svg|tiff?|webp)$/i, '')
    .replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g, '_')
    .replace(/^[.\s]+|[.\s]+$/g, '').slice(0, 100);
  if (!name) name = 'image';
  if (/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name)) name = `image_${name}`;
  return `${name}.${format}`;
}

export async function convertImage(blob, format) {
  const spec = formats[format];
  if (!spec) throw new Error('請選擇 JPG、PNG 或 WEBP。');
  const url = URL.createObjectURL(blob);
  const img = new Image();
  try {
    img.src = url;
    await img.decode();
    const { naturalWidth: width, naturalHeight: height } = img;
    if (!width || !height || width > 16384 || height > 16384 || width * height > 40000000) {
      throw new Error('圖片尺寸過大或無效（上限 4,000 萬像素、單邊 16,384 像素）。');
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('瀏覽器無法建立圖片轉換畫布。');
    if (format === 'jpg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(img, 0, 0);
    const result = await new Promise(resolve => canvas.toBlob(resolve, spec.mime, spec.quality));
    canvas.width = canvas.height = 0;
    if (!result || result.type !== spec.mime) throw new Error('瀏覽器無法輸出指定格式。');
    return { blob: result, width, height };
  } finally {
    URL.revokeObjectURL(url);
  }
}
