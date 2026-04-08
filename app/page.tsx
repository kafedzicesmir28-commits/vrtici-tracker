"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import ExportButton from "@/components/ExportButton";
import FilterBar, { FilterType } from "@/components/FilterBar";
import SearchBar from "@/components/SearchBar";
import { supabase } from "@/lib/supabaseClient";

type KindergartenRecord = {
  id: string;
  email: string;
  kindergartenName: string;
  city: string;
  emailSent: boolean;
  replied: boolean;
  positiveResponse: boolean;
};

type KindergartenRow = {
  id: string;
  email: string;
  name: string;
  city: string | null;
  email_sent: boolean;
  replied: boolean;
  positive_response: boolean;
};

export default function HomePage() {
  const [rows, setRows] = useState<KindergartenRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [kindergartenName, setKindergartenName] = useState("");
  const [city, setCity] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editName, setEditName] = useState("");
  const [editCity, setEditCity] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const showError = useCallback((message: string) => {
    setErrorToast(message);
    setTimeout(() => setErrorToast(null), 3000);
  }, []);

  const getSupabaseErrorMessage = (error: { message: string } | null) => {
    if (!error) return "Neočekivana greška.";
    if (error.message.toLowerCase().includes("city")) {
      return "Nedostaje kolona 'city' u bazi. Pokreni SQL migraciju za city kolonu.";
    }
    return error.message;
  };

  const loadRows = useCallback(async () => {
    if (!hasLoadedOnce) {
      setIsLoading(true);
    }
    const { data, error } = await supabase
      .from("kindergartens")
      .select("*")
      .order("created_at", { ascending: true });

    if (error || !data) {
      showError("Greška pri učitavanju podataka.");
      setIsLoading(false);
      return;
    }

    const mapped = (data as KindergartenRow[]).map((row) => ({
      id: row.id,
      email: row.email,
      kindergartenName: row.name,
      city: row.city ?? "",
      emailSent: row.email_sent,
      replied: row.replied,
      positiveResponse: row.positive_response
    }));

    setRows(mapped);
    setHasLoadedOnce(true);
    setIsLoading(false);
  }, [hasLoadedOnce, showError]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  useEffect(() => {
    const channel = supabase
      .channel("kindergartens-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "kindergartens"
        },
        () => {
          void loadRows();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadRows]);

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
        row.email.toLowerCase().includes(debouncedSearch) ||
        row.city.toLowerCase().includes(debouncedSearch);

      if (!matchesSearch) return false;

      switch (activeFilter) {
        case "emailSent":
          return row.emailSent;
        case "emailNotSent":
          return !row.emailSent;
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
    if (isMutating) return;
    const trimmedEmail = email.trim();
    const trimmedName = kindergartenName.trim();
    const trimmedCity = city.trim();
    if (!trimmedEmail || !trimmedName || !trimmedCity) return;

    setIsMutating(true);
    const { error } = await supabase.from("kindergartens").insert({
      name: trimmedName,
      email: trimmedEmail,
      city: trimmedCity
    });
    if (error) {
      showError(getSupabaseErrorMessage(error));
      setIsMutating(false);
      return;
    }
    await loadRows();
    setEmail("");
    setKindergartenName("");
    setCity("");
    setShowForm(false);
    setIsMutating(false);
  };

  const toggleField = async (
    id: string,
    field: "emailSent" | "replied" | "positiveResponse"
  ) => {
    if (isMutating) return;
    const target = rows.find((row) => row.id === id);
    if (!target) return;

    const dbField =
      field === "emailSent"
        ? "email_sent"
        : field === "positiveResponse"
        ? "positive_response"
        : "replied";

    setIsMutating(true);
    const { error } = await supabase
      .from("kindergartens")
      .update({ [dbField]: !target[field] })
      .eq("id", id);

    if (error) {
      showError(getSupabaseErrorMessage(error));
      setIsMutating(false);
      return;
    }
    await loadRows();
    setIsMutating(false);
  };

  const deleteRow = async (id: string) => {
    if (isMutating) return;
    setIsMutating(true);
    const { error } = await supabase.from("kindergartens").delete().eq("id", id);
    if (error) {
      showError(getSupabaseErrorMessage(error));
      setIsMutating(false);
      return;
    }
    await loadRows();
    setIsMutating(false);
  };

  const startEdit = (row: KindergartenRecord) => {
    setEditingId(row.id);
    setEditEmail(row.email);
    setEditName(row.kindergartenName);
    setEditCity(row.city);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditEmail("");
    setEditName("");
    setEditCity("");
  };

  const saveEdit = async (id: string) => {
    if (isMutating) return;
    const emailValue = editEmail.trim();
    const nameValue = editName.trim();
    const cityValue = editCity.trim();
    if (!emailValue || !nameValue || !cityValue) return;

    setIsMutating(true);
    const { error } = await supabase
      .from("kindergartens")
      .update({
        email: emailValue,
        name: nameValue,
        city: cityValue
      })
      .eq("id", id);

    if (error) {
      showError(getSupabaseErrorMessage(error));
      setIsMutating(false);
      return;
    }
    await loadRows();
    cancelEdit();
    setIsMutating(false);
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

  const checkboxGridClass =
    "grid min-w-0 grid-cols-[minmax(0,1fr)_90px_90px_90px] items-center gap-x-2";

  return (
    <main className="min-h-screen w-full max-w-full overflow-x-hidden bg-gray-50 px-4 py-8 md:px-6">
      <div className="mx-auto w-full max-w-6xl min-w-0 overflow-x-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <section className="border-b border-gray-100 px-4 py-4">
          <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-gray-900">
                Tracker komunikacije sa vrtićima
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Ukupno: {counts.total} · Poslano: {counts.sent} · Odgovorili:{" "}
                {counts.replied} · Pozitivni: {counts.positive} · Uspješnost:{" "}
                {counts.successRate}%
              </p>
            </div>

            <div className="flex min-w-0 w-full flex-wrap items-center gap-2 xl:w-auto">
              <SearchBar value={searchInput} onChange={setSearchInput} />
              <FilterBar activeFilter={activeFilter} onChange={setActiveFilter} />
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-blue-700 active:scale-95"
                onClick={() => setShowForm((prev) => !prev)}
                disabled={isMutating}
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
              className="grid min-w-0 gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
            >
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email vrtića"
                className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none transition-all duration-150 placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                required
                disabled={isMutating}
              />
              <input
                type="text"
                value={kindergartenName}
                onChange={(event) => setKindergartenName(event.target.value)}
                placeholder="Ime vrtića"
                className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none transition-all duration-150 placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                required
                disabled={isMutating}
              />
              <input
                type="text"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="Grad"
                className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none transition-all duration-150 placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                required
                disabled={isMutating}
              />
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-blue-700 active:scale-95"
                disabled={isMutating}
              >
                Spremi
              </button>
            </form>
          </section>
        )}

        <section className="max-h-[65vh] min-w-0 overflow-y-auto overflow-x-hidden [scrollbar-width:thin] [scrollbar-color:rgb(209_213_219)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
          {isLoading ? (
            <div className="flex min-h-60 flex-col items-center justify-center gap-3 px-4 text-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
              <p className="text-sm text-gray-600">Učitavanje podataka...</p>
            </div>
          ) : filteredRows.length === 0 ? (
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
            <div className="min-w-0">
              <div className={`${checkboxGridClass} border-b border-gray-100 px-4 py-3`}>
                <div />
                <span className="text-center text-xs font-medium uppercase tracking-wide text-gray-500">
                  Poslano
                </span>
                <span className="text-center text-xs font-medium uppercase tracking-wide text-gray-500">
                  Odgovor
                </span>
                <span className="text-center text-xs font-medium uppercase tracking-wide text-gray-500">
                  Anketirano
                </span>
              </div>
              {filteredRows.map((row) => {
                const statusBadge = getStatusBadge(row);
                return (
                  <article
                    key={row.id}
                    className="group min-w-0 border-b border-gray-100 px-4 py-3 transition-all duration-150 hover:translate-x-[2px] hover:bg-gray-50"
                  >
                    <div className={checkboxGridClass}>
                      <div className="min-w-0">
                      {editingId === row.id ? (
                        <div className="grid min-w-0 gap-2 sm:grid-cols-3">
                          <input
                            value={editName}
                            onChange={(event) => setEditName(event.target.value)}
                            placeholder="Ime vrtića"
                            className="rounded-md border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                          />
                          <input
                            value={editEmail}
                            onChange={(event) => setEditEmail(event.target.value)}
                            placeholder="Email"
                            className="rounded-md border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                          />
                          <input
                            value={editCity}
                            onChange={(event) => setEditCity(event.target.value)}
                            placeholder="Grad"
                            className="rounded-md border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>
                      ) : (
                        <>
                          <p
                            className={`whitespace-normal break-words text-sm font-semibold ${
                              row.positiveResponse
                                ? "text-gray-400 line-through"
                                : "text-gray-900"
                            }`}
                          >
                            {row.kindergartenName}
                          </p>
                          <div className="flex items-center gap-2">
                            <div
                              className={`h-5 w-1 shrink-0 rounded-full ${
                                row.positiveResponse
                                  ? "bg-green-500"
                                  : row.replied
                                  ? "bg-blue-500"
                                  : row.emailSent
                                  ? "bg-amber-400"
                                  : "bg-gray-300"
                              }`}
                            />
                            <p
                              className={`min-w-0 whitespace-normal break-all text-sm ${
                                row.positiveResponse
                                  ? "text-gray-400 line-through"
                                  : "text-gray-500"
                              }`}
                            >
                              {row.email} · {row.city}
                            </p>
                          </div>
                        </>
                      )}
                      </div>
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={row.emailSent}
                          onChange={() => toggleField(row.id, "emailSent")}
                          className="h-5 w-5 cursor-pointer accent-green-500 transition-transform duration-150 [&:checked]:scale-110"
                          disabled={isMutating}
                        />
                      </div>
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={row.replied}
                          onChange={() => toggleField(row.id, "replied")}
                          className="h-5 w-5 cursor-pointer accent-green-500 transition-transform duration-150 [&:checked]:scale-110"
                          disabled={isMutating}
                        />
                      </div>
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={row.positiveResponse}
                          onChange={() => toggleField(row.id, "positiveResponse")}
                          className="h-5 w-5 cursor-pointer accent-green-500 transition-transform duration-150 [&:checked]:scale-110"
                          disabled={isMutating}
                        />
                      </div>
                    </div>

                    <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1 sm:justify-end">
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
                      {editingId === row.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => saveEdit(row.id)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-emerald-600 transition-all duration-150 hover:bg-emerald-50 active:scale-95"
                            disabled={isMutating}
                          >
                            <Save className="h-3.5 w-3.5" />
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-gray-500 transition-all duration-150 hover:bg-gray-100 hover:text-gray-700 active:scale-95"
                            disabled={isMutating}
                          >
                            <X className="h-3.5 w-3.5" />
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => startEdit(row)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-blue-600 transition-all duration-150 hover:bg-blue-50 active:scale-95"
                            disabled={isMutating}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteRow(row.id)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-gray-500 transition-all duration-150 hover:bg-gray-100 hover:text-gray-700 active:scale-95"
                            disabled={isMutating}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Obrisi
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
      {errorToast && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-lg">
          {errorToast}
        </div>
      )}

    </main>
  );
}
