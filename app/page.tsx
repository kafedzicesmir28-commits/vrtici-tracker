"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import ExportButton from "@/components/ExportButton";
import FilterBar, { FilterType } from "@/components/FilterBar";
import SearchBar from "@/components/SearchBar";

type KindergartenRecord = {
  id: string;
  email: string;
  kindergartenName: string;
  emailSent: boolean;
  replied: boolean;
  positiveResponse: boolean;
};

export default function HomePage() {
  const [rows, setRows] = useState<KindergartenRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [kindergartenName, setKindergartenName] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const loadRows = async () => {
    const response = await fetch("/api/kindergartens", { cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as KindergartenRecord[];
    setRows(data);
  };

  useEffect(() => {
    void loadRows();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      void loadRows();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim().toLowerCase());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const counts = useMemo(
    () => {
      const total = rows.length;
      const sent = rows.filter((row) => row.emailSent).length;
      const replied = rows.filter((row) => row.replied).length;
      const positive = rows.filter((row) => row.positiveResponse).length;
      const successRate = total === 0 ? 0 : Math.round((positive / total) * 100);
      return { total, sent, replied, positive, successRate };
    },
    [rows]
  );

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesSearch =
        debouncedSearch.length === 0 ||
        row.kindergartenName.toLowerCase().includes(debouncedSearch) ||
        row.email.toLowerCase().includes(debouncedSearch);

      if (!matchesSearch) return false;

      switch (activeFilter) {
        case "emailSent":
          return row.emailSent;
        case "replied":
          return row.replied;
        case "positive":
          return row.positiveResponse;
        case "noReply":
          return row.emailSent && !row.replied;
        default:
          return true;
      }
    });
  }, [rows, debouncedSearch, activeFilter]);

  const addKindergarten = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedName = kindergartenName.trim();
    if (!trimmedEmail || !trimmedName) return;

    const response = await fetch("/api/kindergartens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: trimmedEmail,
        kindergartenName: trimmedName
      })
    });
    if (!response.ok) return;
    const updated = (await response.json()) as KindergartenRecord[];
    setRows(updated);
    setEmail("");
    setKindergartenName("");
    setShowForm(false);
  };

  const toggleField = async (
    id: string,
    field: "emailSent" | "replied" | "positiveResponse"
  ) => {
    const target = rows.find((row) => row.id === id);
    if (!target) return;

    const response = await fetch(`/api/kindergartens/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        field,
        value: !target[field]
      })
    });
    if (!response.ok) return;
    const updated = (await response.json()) as KindergartenRecord[];
    setRows(updated);
  };

  const deleteRow = async (id: string) => {
    const response = await fetch(`/api/kindergartens/${id}`, {
      method: "DELETE"
    });
    if (!response.ok) return;
    const updated = (await response.json()) as KindergartenRecord[];
    setRows(updated);
  };

  const getStatusBadge = (row: KindergartenRecord) => {
    if (row.positiveResponse) {
      return {
        label: "● Pozitivno",
        className: "bg-green-100 text-green-700"
      };
    }
    if (row.replied) {
      return {
        label: "● Odgovorili",
        className: "bg-blue-100 text-blue-700"
      };
    }
    if (row.emailSent) {
      return {
        label: "● Poslan",
        className: "bg-yellow-100 text-yellow-700"
      };
    }
    return {
      label: "● Nije kontaktiran",
      className: "bg-gray-100 text-gray-600"
    };
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <section className="border-b border-gray-100 px-4 py-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Tracker komunikacije sa vrtićima
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Ukupno: {counts.total} · Poslano: {counts.sent} · Odgovorili:{" "}
                {counts.replied} · Pozitivni: {counts.positive} · Uspješnost:{" "}
                {counts.successRate}%
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <SearchBar value={searchInput} onChange={setSearchInput} />
              <FilterBar activeFilter={activeFilter} onChange={setActiveFilter} />
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-blue-700 active:scale-95"
                onClick={() => setShowForm((prev) => !prev)}
              >
                <Plus className="h-4 w-4" />
                Dodaj vrtić
              </button>
              <ExportButton rows={rows} />
            </div>
          </div>
        </section>

        {showForm && (
          <section className="border-b border-gray-100 px-4 py-3">
            <form
              onSubmit={addKindergarten}
              className="grid gap-2 md:grid-cols-[1fr_1fr_auto]"
            >
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email vrtića"
                className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none transition-all duration-150 placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                required
              />
              <input
                type="text"
                value={kindergartenName}
                onChange={(event) => setKindergartenName(event.target.value)}
                placeholder="Ime vrtića"
                className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none transition-all duration-150 placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                required
              />
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-blue-700 active:scale-95"
              >
                Spremi
              </button>
            </form>
          </section>
        )}

        <section className="max-h-[65vh] overflow-y-auto [scrollbar-width:thin] [scrollbar-color:rgb(209_213_219)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
          {filteredRows.length === 0 ? (
            <div className="flex min-h-60 flex-col items-center justify-center px-4 text-center">
              <div className="text-3xl">✅</div>
              <p className="mt-3 text-base font-medium text-gray-700">
                Nema zadataka još
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Klikni Dodaj vrtić da započneš.
              </p>
            </div>
          ) : (
            <div>
              {filteredRows.map((row) => {
                const statusBadge = getStatusBadge(row);
                return (
                  <article
                    key={row.id}
                    className="group flex min-h-14 items-center gap-3 border-b border-gray-100 px-4 py-3 transition-all duration-150 hover:translate-x-[2px] hover:bg-gray-50"
                  >
                    <div
                      className={`h-10 w-1 rounded-full ${
                        row.positiveResponse
                          ? "bg-green-500"
                          : row.replied
                          ? "bg-blue-500"
                          : row.emailSent
                          ? "bg-amber-400"
                          : "bg-gray-300"
                      }`}
                    />

                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm font-semibold ${
                          row.positiveResponse
                            ? "text-gray-400 line-through"
                            : "text-gray-900"
                        }`}
                      >
                        {row.kindergartenName}
                      </p>
                      <p
                        className={`truncate text-sm ${
                          row.positiveResponse
                            ? "text-gray-400 line-through"
                            : "text-gray-500"
                        }`}
                      >
                        {row.email}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={row.emailSent}
                        onChange={() => toggleField(row.id, "emailSent")}
                        className="h-5 w-5 cursor-pointer accent-green-500 transition-transform duration-150 [&:checked]:scale-110"
                      />
                      <input
                        type="checkbox"
                        checked={row.replied}
                        onChange={() => toggleField(row.id, "replied")}
                        className="h-5 w-5 cursor-pointer accent-green-500 transition-transform duration-150 [&:checked]:scale-110"
                      />
                      <input
                        type="checkbox"
                        checked={row.positiveResponse}
                        onChange={() => toggleField(row.id, "positiveResponse")}
                        className="h-5 w-5 cursor-pointer accent-green-500 transition-transform duration-150 [&:checked]:scale-110"
                      />
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        statusBadge.className
                      }`}
                    >
                      {row.positiveResponse
                        ? "Završeno"
                        : row.replied
                        ? "Odgovor"
                        : row.emailSent
                        ? "Poslano"
                        : "Novo"}
                    </span>

                    <button
                      type="button"
                      onClick={() => deleteRow(row.id)}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-gray-500 transition-all duration-150 hover:bg-gray-100 hover:text-gray-700 active:scale-95"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Obrisi
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

    </main>
  );
}
