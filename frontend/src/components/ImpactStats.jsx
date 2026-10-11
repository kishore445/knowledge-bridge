import { BookOpen, School, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { getImpactStats } from "../lib/api";
import t from "../i18n/en";

export default function ImpactStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getImpactStats().then((r) => setStats(r.data)).catch(() => {});
  }, []);

  if (!stats) return null;

  return (
    <div className="grid grid-cols-3 gap-3">
      <StatCard
        icon={<BookOpen size={22} className="text-primary" />}
        value={stats.books_delivered}
        label={t.impact_books_delivered}
      />
      <StatCard
        icon={<School size={22} className="text-accent" />}
        value={stats.schools_reached}
        label={t.impact_schools_reached}
      />
      <StatCard
        icon={<CheckCircle size={22} className="text-success" />}
        value={stats.confirmed_deliveries}
        label={t.impact_deliveries}
      />
    </div>
  );
}

function StatCard({ icon, value, label }) {
  return (
    <div className="card text-center py-4">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="price text-2xl text-ink font-bold">{value ?? "—"}</p>
      <p className="text-xs text-muted mt-0.5 leading-tight">{label}</p>
    </div>
  );
}
