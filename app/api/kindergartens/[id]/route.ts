import { NextRequest, NextResponse } from "next/server";
import {
  KindergartenRecord,
  readKindergartens,
  writeKindergartens
} from "@/lib/kindergarten-store";

type BooleanField = "emailSent" | "replied" | "positiveResponse";
type PatchBody = {
  field?: BooleanField;
  value?: boolean;
  email?: string;
  kindergartenName?: string;
  city?: string;
};

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ message: "Neispravan JSON body." }, { status: 400 });
  }

  try {
    const { id } = await context.params;
    const rows = await readKindergartens();

    if ("field" in body || "value" in body) {
      if (
        (body.field !== "emailSent" &&
          body.field !== "replied" &&
          body.field !== "positiveResponse") ||
        typeof body.value !== "boolean"
      ) {
        return NextResponse.json({ message: "Neispravan update." }, { status: 400 });
      }

      const updated = rows.map((row) =>
        row.id === id ? { ...row, [body.field as BooleanField]: body.value } : row
      );
      await writeKindergartens(updated);
      return NextResponse.json(updated);
    }

    const email = typeof body.email === "string" ? body.email.trim() : "";
    const kindergartenName =
      typeof body.kindergartenName === "string" ? body.kindergartenName.trim() : "";
    const city = typeof body.city === "string" ? body.city.trim() : "";

    if (!email || !kindergartenName || !city) {
      return NextResponse.json({ message: "Neispravan update." }, { status: 400 });
    }

    const updated = rows.map((row) =>
      row.id === id ? { ...row, email, kindergartenName, city } : row
    );
    await writeKindergartens(updated);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/kindergartens/[id] failed:", error);
    return NextResponse.json({ message: "Greška pri izmjeni." }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const rows = await readKindergartens();
    const updated = rows.filter((row) => row.id !== id);
    await writeKindergartens(updated);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("DELETE /api/kindergartens/[id] failed:", error);
    return NextResponse.json({ message: "Greška pri brisanju." }, { status: 500 });
  }
}
