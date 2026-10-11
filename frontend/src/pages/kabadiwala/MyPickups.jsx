import { useEffect, useState } from "react";
import { Plus, Package, Star } from "lucide-react";
import { Link } from "react-router-dom";
import Layout from "../../components/Layout";
import StatusBadge from "../../components/StatusBadge";
import ProtectedRoute from "../../components/ProtectedRoute";
import { getMyPickups, getMyKbProfile } from "../../lib/api";
import t from "../../i18n/en";

export default function MyPickups() {
  const [pickups, setPickups] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMyPickups(), getMyKbProfile()])
      .then(([p, pr]) => { setPickups(p.data); setProfile(pr.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedRoute roles={["kabadiwala"]}>
      <Layout>
        <div className="flex items-center justify-between mb-5">
          <h1 className="page-title">{t.kb_my_pickups}</h1>
          <Link to="/kabadiwala/pickup" className="btn-primary text-sm py-2.5 px-4">
            <Plus size={16} />
            New
          </Link>
        </div>

        {/* Trust score */}
        {profile && (
          <div className="card mb-5 flex items-center gap-4">
            <div className="bg-accent-light rounded-xl w-12 h-12 flex items-center justify-center shrink-0">
              <Star size={22} className="text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted">{t.kb_trust_score}</p>
              <p className="price font-bold text-xl text-accent">{Math.round(profile.trust_score * 100)}%</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-muted">Pickups</p>
              <p className="font-mono font-bold">{profile.accepted_pickups}/{profile.total_pickups}</p>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-muted text-center py-12">{t.loading}</p>
        ) : pickups.length === 0 ? (
          <div className="card text-center py-12">
            <Package size={36} className="text-primary/30 mx-auto mb-3" />
            <p className="text-muted">No pickups yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pickups.map((p) => (
              <div key={p.id} className="card">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Package size={18} className="text-primary" />
                    <span className="font-semibold text-sm">{p.declared_count} books</span>
                    {p.govt_issued && <span className="tag-govt">Govt</span>}
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                <div className="flex items-center gap-4 text-xs text-muted font-mono">
                  <span>{new Date(p.created_at).toLocaleDateString()}</span>
                  {p.amount_paid != null && (
                    <span className="text-success font-semibold">₹{p.amount_paid} paid</span>
                  )}
                  {p.status === "submitted" && (
                    <span className="text-warning">{t.kb_payout_pending}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Layout>
    </ProtectedRoute>
  );
}
