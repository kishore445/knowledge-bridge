import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, ArrowRight } from "lucide-react";
import Layout from "../../components/Layout";
import StatusBadge from "../../components/StatusBadge";
import ProtectedRoute from "../../components/ProtectedRoute";
import PriceBreakdown from "../../components/PriceBreakdown";
import { getMyOrders } from "../../lib/api";
import t from "../../i18n/en";

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyOrders()
      .then((r) => setOrders(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedRoute roles={["school"]}>
      <Layout>
        <h1 className="page-title mb-5">My orders</h1>
        {loading ? (
          <p className="text-muted text-center py-12">{t.loading}</p>
        ) : orders.length === 0 ? (
          <div className="card text-center py-12">
            <Package size={36} className="text-primary/30 mx-auto mb-3" />
            <p className="text-muted">No orders yet.</p>
            <Link to="/school/order" className="btn-primary mt-4 inline-flex">Order books</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <div key={o.id} className="card">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-muted">#{o.id.slice(-8)}</span>
                  <StatusBadge status={o.status} />
                </div>
                <p className="font-semibold text-sm mb-2">{o.items?.length} book{o.items?.length !== 1 ? "s" : ""}</p>
                {o.price_breakdown && (
                  <PriceBreakdown breakdown={o.price_breakdown} />
                )}
                {o.sponsorship_id && (
                  <p className="text-xs text-success font-medium mt-2">{t.school_sponsored_label}</p>
                )}
                <div className="flex gap-2 mt-3">
                  {o.status === "delivered" && (
                    <Link to={`/school/delivery?order_id=${o.id}`} className="btn-outline text-sm py-2 px-3">
                      Confirm delivery
                    </Link>
                  )}
                  <Link to={`/sponsor?order_id=${o.id}`} className="btn-ghost text-sm py-2 px-3">
                    Find a sponsor <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Layout>
    </ProtectedRoute>
  );
}
