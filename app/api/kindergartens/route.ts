import { NextRequest, NextResponse } from "next/server";
import {
  KindergartenRecord,
  readKindergartens,
  writeKindergartens
} from "@/lib/kindergarten-store";

export async function GET() {
  const rows = await readKindergartens();
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Partial<KindergartenRecord>;
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const kindergartenName =
    typeof body.kindergartenName === "string" ? body.kindergartenName.trim() : "";

  if (!email || !kindergartenName) {
    return NextResponse.json({ message: "Neispravan unos." }, { status: 400 });
  }

  const rows = await readKindergartens();
  const newRow: KindergartenRecord = {
    id: crypto.randomUUID(),
    email,
    kindergartenName,
    emailSent: false,
    replied: false,
    positiveResponse: false
  };
  const updated = [...rows, newRow];
  await writeKindergartens(updated);
  return NextResponse.json(updated);
}
