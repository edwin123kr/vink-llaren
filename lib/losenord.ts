import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

/** Lösenord hashas med scrypt (inbyggt i Node) och ett slumpat salt per konto. */
const LANGD = 64;

function scryptAsync(losenord: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => scrypt(losenord.normalize("NFKC"), salt, LANGD, { N: 16384, r: 8, p: 1 }, (e, k) => (e ? reject(e) : resolve(k))));
}

export async function hashaLosenord(losenord: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(losenord, salt);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function stammerLosenord(losenord: string, lagrad: string): Promise<boolean> {
  const [algo, salt, hash] = lagrad.split("$");
  if (algo !== "scrypt" || !salt || !hash) return false;
  const vantat = Buffer.from(hash, "base64");
  const faktiskt = await scryptAsync(losenord, Buffer.from(salt, "base64"));
  return vantat.length === faktiskt.length && timingSafeEqual(vantat, faktiskt);
}
