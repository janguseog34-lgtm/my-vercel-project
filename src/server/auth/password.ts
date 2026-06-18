import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const keyLength = 64;
const algorithm = "scrypt";

export async function createPasswordHash(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const derivedKey = (await scrypt(password, salt, keyLength)) as Buffer;

  return `${algorithm}:${salt}:${derivedKey.toString("base64url")}`;
}

export async function verifyPassword(password: string, passwordHash: string) {
  const [storedAlgorithm, salt, storedKey] = passwordHash.split(":");

  if (storedAlgorithm !== algorithm || !salt || !storedKey) {
    return false;
  }

  const expectedKey = Buffer.from(storedKey, "base64url");
  const actualKey = (await scrypt(password, salt, expectedKey.byteLength)) as Buffer;

  if (expectedKey.byteLength !== actualKey.byteLength) {
    return false;
  }

  return timingSafeEqual(expectedKey, actualKey);
}

