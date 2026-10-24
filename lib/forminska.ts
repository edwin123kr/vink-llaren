/** Förminskar en bild i webbläsaren (max 1568 px, JPEG) så att uppladdningen går snabbt. */
export async function forminska(fil: File): Promise<Blob> {
  const bmp = await createImageBitmap(fil);
  const skala = Math.min(1, 1568 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * skala);
  c.height = Math.round(bmp.height * skala);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("Kunde inte läsa bilden."))), "image/jpeg", 0.85));
}
