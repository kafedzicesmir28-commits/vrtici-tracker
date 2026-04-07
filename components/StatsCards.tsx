type StatsCardsProps = {
  total: number;
  sent: number;
  replied: number;
  positive: number;
  successRate: number;
};

export default function StatsCards({
  total,
  sent,
  replied,
  positive,
  successRate
}: StatsCardsProps) {
  const cards = [
    { label: "Ukupno vrtića", value: total, icon: "🏫", tint: "bg-blue-50" },
    { label: "Poslano mailova", value: sent, icon: "✉️", tint: "bg-yellow-50" },
    { label: "Odgovorili", value: replied, icon: "💬", tint: "bg-sky-50" },
    { label: "Pozitivni odgovori", value: positive, icon: "✅", tint: "bg-green-50" },
    {
      label: "Postotak uspješnosti",
      value: `${successRate}%`,
      icon: "📈",
      tint: "bg-blue-50"
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-2xl border border-white/60 p-4 shadow-sm backdrop-blur-sm transition-all duration-200 ease-out hover:-translate-y-[1px] hover:shadow-md ${card.tint}`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">{card.icon}</span>
            <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
          </div>
          <p className="mt-2 text-xs text-gray-600">{card.label}</p>
        </div>
      ))}
    </div>
  );
}
