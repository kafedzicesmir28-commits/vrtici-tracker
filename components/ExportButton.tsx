"use client";

import { Download } from "lucide-react";
import * as XLSX from "xlsx";

type KindergartenRecord = {
  id: string;
  email: string;
  kindergartenName: string;
  emailSent: boolean;
  replied: boolean;
  positiveResponse: boolean;
};

type ExportButtonProps = {
  rows: KindergartenRecord[];
};

export default function ExportButton({ rows }: ExportButtonProps) {
  const handleExport = () => {
    const exportData = rows.map((row) => ({
      Email: row.email,
      "Ime vrtića": row.kindergartenName,
      "Mail poslan": row.emailSent ? "Da" : "Ne",
      Odgovorili: row.replied ? "Da" : "Ne",
      "Pozitivan odgovor": row.positiveResponse ? "Da" : "Ne"
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Vrtići");
    XLSX.writeFile(workbook, "vrtici-tracker.xlsx");
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-all duration-150 hover:bg-gray-50 active:scale-95"
    >
      <Download className="h-4 w-4" />
      Export u Excel
    </button>
  );
}
