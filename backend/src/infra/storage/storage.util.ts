import * as fs from "node:fs";
import * as path from "node:path";

export function resolveUploadDir() {
  const raw = process.env.UPLOAD_DIR ?? "uploads";
  const dir = path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}
