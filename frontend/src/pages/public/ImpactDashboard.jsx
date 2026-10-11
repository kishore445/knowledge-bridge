import { useEffect, useState } from "react";
import { MapPin, User, BookOpen, Image } from "lucide-react";
import Layout from "../../components/Layout";
import ImpactStats from "../../components/ImpactStats";
import { getImpactFeed, getDistricts } from "../../lib/api";
import t from "../../i18n/en";

export default function ImpactDashboard() {
  const [feed, setFeed] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ district: "" });

  useEffect(() => {
    getDistricts().then((r) => setDistricts(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (filters.district) params.district = filters.district;
    getImpactFeed(params)
      .then((r) => setFeed(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filters.district]);

  return (
    <Layout>
      <h1 className="page-title mb-1">{t.impact_title}</h1>
      <p className="text-muted text-sm mb-6">Live updates as books reach students.</p>

      <ImpactStats />

      {/* Filters */}
      <div className="flex gap-3 mt-6 mb-4 overflow-x-auto pb-1">
        <select
          className="input flex-shrink-0 w-44"
          value={filters.district}
          onChange={(e) => setFilters({ district: e.target.value })}
        >
          <option value="">{t.impact_filter_district}</option>
          {districts.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="text-muted text-center py-12">{t.loading}</p>
      ) : feed.length === 0 ? (
        <p className="text-muted text-center py-12">{t.impact_feed_empty}</p>
      ) : (
        <div className="space-y-4">
          {feed.map((item) => (
            <FeedCard key={item.delivery_id} item={item} />
          ))}
        </div>
      )}
    </Layout>
  );
}

function FeedCard({ item }) {
  return (
    <div className="card flex gap-4">
      {/* Photo */}
      <div className="shrink-0 w-20 h-20 rounded-xl bg-primary-light flex items-center justify-center overflow-hidden">
        {item.photo_url ? (
          <img src={item.photo_url} alt="Delivery" className="w-full h-full object-cover" />
        ) : (
          <Image size={28} className="text-primary/30" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        {item.school && (
          <p className="font-semibold text-sm text-ink leading-tight truncate">
            {item.school.name}
          </p>
        )}
        <div className="flex items-center gap-1 text-xs text-muted mt-0.5">
          <MapPin size={11} />
          {item.school?.district || "Hyderabad"}
        </div>

        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-ink font-mono">
            <BookOpen size={12} className="text-primary" />
            {item.book_count} book{item.book_count !== 1 ? "s" : ""}
          </span>
          {item.sponsor && (
            <span className="flex items-center gap-1 text-xs text-accent font-medium">
              <User size={12} />
              Sponsored by {item.sponsor.name}
            </span>
          )}
        </div>

        {item.sponsor?.message && (
          <p className="text-xs text-muted italic mt-1 line-clamp-1">{item.sponsor.message}</p>
        )}

        <p className="text-xs text-muted mt-1 font-mono">
          {item.delivered_at ? new Date(item.delivered_at).toLocaleDateString() : "—"}
        </p>
      </div>
    </div>
  );
}
