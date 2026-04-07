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

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "kindergartens.json");

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
  await ensureStoreFile();
  const raw = await readFile(dataFile, "utf8");
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isValidRecord) : [];
  } catch {
    return [];
  }
}

export async function writeKindergartens(rows: KindergartenRecord[]) {
  await ensureStoreFile();
  await writeFile(dataFile, JSON.stringify(rows, null, 2), "utf8");
}
