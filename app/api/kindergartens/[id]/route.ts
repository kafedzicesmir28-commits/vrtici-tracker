import { NextRequest, NextResponse } from "next/server";
import {
  KindergartenRecord,
  readKindergartens,
  writeKindergartens
} from "@/lib/kindergarten-store";

type BooleanField = "emailSent" | "replied" | "positiveResponse";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  let body: {
    field?: BooleanField;
    value?: boolean;
  };
  try {
    body = (await request.json()) as {
      field?: BooleanField;
      value?: boolean;
    };
  } catch {
    return NextResponse.json({ message: "Neispravan JSON body." }, { status: 400 });
  }

  try {
    const { id } = await context.params;

    if (
      (body.field !== "emailSent" &&
        body.field !== "replied" &&
        body.field !== "positiveResponse") ||
      typeof body.value !== "boolean"
    ) {
      return NextResponse.json({ message: "Neispravan update." }, { status: 400 });
    }

    const rows = await readKindergartens();
    const updated = rows.map((row) =>
      row.id === id ? { ...row, [body.field as BooleanField]: body.value } : row
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
