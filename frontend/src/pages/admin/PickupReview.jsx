import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Package, Star } from "lucide-react";
import Layout from "../../components/Layout";
import ProtectedRoute from "../../components/ProtectedRoute";
import StatusBadge from "../../components/StatusBadge";
import { getPickupQueue, acceptPickup, rejectPickup, getPricing } from "../../lib/api";
import t from "../../i18n/en";

export default function PickupReview() {
  const [pickups, setPickups] = useState([]);
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(true);

  function reload() {
    setLoading(true);
    Promise.all([getPickupQueue(), getPricing()])
      .then(([p, pr]) => { setPickups(p.data); setPricing(pr.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(reload, []);

  async function handleAccept(pickup) {
    const count = prompt("How many books are you accepting?", pickup.declared_count);
    if (!count) return;
    const rate = pricing?.kabadiwala_rate_per_book || 8;
    await acceptPickup(pickup.id, { accepted_count: parseInt(count), amount_per_book: rate });
    reload();
  }

  async function handleReject(id) {
    const reason = prompt("Rejection reason (optional):");
    await rejectPickup(id, reason || "");
    reload();
  }

  return (
    <ProtectedRoute roles={["admin"]}>
      <Layout>
        <h1 className="page-title mb-5">{t.admin_pickup_queue}</h1>
        {pricing && (
          <div className="card mb-4 flex items-center gap-3 bg-accent-light border-accent/20">
            <p className="text-sm text-accent">Current rate: <span className="font-mono font-bold">₹{pricing.kabadiwala_rate_per_book}/book</span></p>
          </div>
        )}

        {loading ? (
          <p className="text-muted text-center py-12">{t.loading}</p>
        ) : pickups.length === 0 ? (
          <div className="card text-center py-12">
            <Package size={36} className="text-primary/30 mx-auto mb-3" />
            <p className="text-muted">No pickups pending review.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pickups.map((p) => (
              <div key={p.id} className="card">
                <div className="flex items-start gap-3 mb-3">
                  <Package size={20} className="text-accent mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{p.kabadiwala_name || "Kabadiwala"}</p>
                    <p className="text-xs text-muted font-mono">{p.declared_count} books declared</p>
                    {p.govt_issued && <span className="tag-govt mt-1">Contains govt books</span>}
                    {p.trust_score != null && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted">
                        <Star size={12} className="text-accent" />
                        Trust: {Math.round(p.trust_score * 100)}%
                      </div>
                    )}
                  </div>
                  <StatusBadge status={p.status} />
                </div>

                {p.photos && p.photos.length > 0 && (
                  <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                    {p.photos.map((url, i) => (
                      <img key={i} src={url} alt="pickup" className="w-20 h-20 rounded-xl object-cover shrink-0" />
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={() => handleAccept(p)} className="btn-primary flex-1 text-sm py-2">
                    <CheckCircle size={16} /> Accept
                  </button>
                  <button onClick={() => handleReject(p.id)} className="btn-ghost flex-1 text-sm py-2 text-danger">
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Layout>
    </ProtectedRoute>
  );
}
