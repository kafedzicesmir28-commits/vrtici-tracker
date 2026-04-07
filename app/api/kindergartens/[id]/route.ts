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
  const { id } = await context.params;
  const body = (await request.json()) as {
    field?: BooleanField;
    value?: boolean;
  };

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
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const rows = await readKindergartens();
  const updated = rows.filter((row) => row.id !== id);
  await writeKindergartens(updated);
  return NextResponse.json(updated);
}
