// アップロードした画像を、AIへ送る前にブラウザ側でリサイズする(通信量・API画像トークン量を抑えるため)。
// スクリーンショットの文字が潰れないよう、圧縮のかからないPNGで書き出す。
const MAX_DIMENSION = 1568;

export async function resizeImageForUpload(
  file: File,
  maxDimension: number = MAX_DIMENSION,
): Promise<{ base64: string; mediaType: "image/png" }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("画像の処理に失敗しました");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const dataUrl = canvas.toDataURL("image/png");
  const base64 = dataUrl.split(",")[1];
  if (!base64) throw new Error("画像の処理に失敗しました");
  return { base64, mediaType: "image/png" };
}
