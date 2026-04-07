import { NextRequest, NextResponse } from "next/server";
import {
  KindergartenRecord,
  readKindergartens,
  writeKindergartens
} from "@/lib/kindergarten-store";

export async function GET() {
  try {
    const rows = await readKindergartens();
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ message: "Greška pri učitavanju." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body: Partial<KindergartenRecord>;
  try {
    body = (await request.json()) as Partial<KindergartenRecord>;
  } catch {
    return NextResponse.json({ message: "Neispravan JSON body." }, { status: 400 });
  }

  try {
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const kindergartenName =
      typeof body.kindergartenName === "string"
        ? body.kindergartenName.trim()
        : "";
    const city = typeof body.city === "string" ? body.city.trim() : "";

    if (!email || !kindergartenName || !city) {
      return NextResponse.json({ message: "Neispravan unos." }, { status: 400 });
    }

    const rows = await readKindergartens();
    const generatedId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newRow: KindergartenRecord = {
      id: generatedId,
      email,
      kindergartenName,
      city,
      emailSent: false,
      replied: false,
      positiveResponse: false
    };
    const updated = [...rows, newRow];
    await writeKindergartens(updated);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("POST /api/kindergartens failed:", error);
    return NextResponse.json({ message: "Greška pri spremanju." }, { status: 500 });
  }
}
