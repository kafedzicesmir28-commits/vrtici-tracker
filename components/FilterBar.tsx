export type FilterType =
  | "all"
  | "emailSent"
  | "emailNotSent"
  | "replied"
  | "positive"
  | "noReply";

type FilterBarProps = {
  activeFilter: FilterType;
  onChange: (filter: FilterType) => void;
};

const FILTERS: { key: FilterType; label: string }[] = [
  { key: "all", label: "Svi" },
  { key: "emailSent", label: "Mail poslan" },
  { key: "emailNotSent", label: "Mail nije poslan" },
  { key: "replied", label: "Odgovorili" },
  { key: "positive", label: "Pozitivan odgovor" },
  { key: "noReply", label: "Bez odgovora" }
];

export default function FilterBar({ activeFilter, onChange }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {FILTERS.map((filter) => {
        const isActive = filter.key === activeFilter;
        return (
          <button
            key={filter.key}
            type="button"
            onClick={() => onChange(filter.key)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-all duration-150 hover:-translate-y-[1px] active:scale-95 ${
              isActive
                ? "border-blue-600 bg-blue-600 text-white shadow-md"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
