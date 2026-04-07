import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export type KindergartenRecord = {
  id: string;
  email: string;
  kindergartenName: string;
  emailSent: boolean;
  replied: boolean;
  positiveResponse: boolean;
};

const dataDir = process.env.VERCEL
  ? path.join("/tmp", "vrtici-tracker")
  : path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "kindergartens.json");
let memoryFallback: KindergartenRecord[] = [];

function isValidRecord(value: unknown): value is KindergartenRecord {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.email === "string" &&
    typeof record.kindergartenName === "string" &&
    typeof record.emailSent === "boolean" &&
    typeof record.replied === "boolean" &&
    typeof record.positiveResponse === "boolean"
  );
}

async function ensureStoreFile() {
  await mkdir(dataDir, { recursive: true });
  try {
    await readFile(dataFile, "utf8");
  } catch {
    await writeFile(dataFile, "[]", "utf8");
  }
}

export async function readKindergartens(): Promise<KindergartenRecord[]> {
  try {
    await ensureStoreFile();
    const raw = await readFile(dataFile, "utf8");
    const parsed = JSON.parse(raw);
    const safeRows = Array.isArray(parsed) ? parsed.filter(isValidRecord) : [];
    memoryFallback = safeRows;
    return safeRows;
  } catch {
    return memoryFallback;
  }
}

export async function writeKindergartens(rows: KindergartenRecord[]) {
  try {
    await ensureStoreFile();
    await writeFile(dataFile, JSON.stringify(rows, null, 2), "utf8");
    memoryFallback = rows;
  } catch {
    memoryFallback = rows;
  }
}
