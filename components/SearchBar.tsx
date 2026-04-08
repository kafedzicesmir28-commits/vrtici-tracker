import { Search } from "lucide-react";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative w-full min-w-0">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Pretraži vrtić, email ili grad..."
        className="h-10 w-full rounded-lg border border-gray-200 bg-white px-4 py-2 pl-10 text-sm text-gray-700 outline-none transition-all duration-150 placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
      />
    </div>
  );
}
