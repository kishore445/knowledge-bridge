import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import Layout from "../../components/Layout";
import ProtectedRoute from "../../components/ProtectedRoute";
import StatusBadge from "../../components/StatusBadge";
import { getOrdersBoard } from "../../lib/api";
import api from "../../lib/api";
import t from "../../i18n/en";

const COLUMNS = [
  { key: "paid", label: "Paid" },
  { key: "packed", label: "Packed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

export default function OrdersBoard() {
  const [board, setBoard] = useState({});
  const [loading, setLoading] = useState(true);

  function reload() {
    setLoading(true);
    getOrdersBoard()
      .then((r) => setBoard(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(reload, []);

  async function advance(orderId, newStatus) {
    await api.patch(`/api/orders/${orderId}/status`, null, { params: { new_status: newStatus } });
    reload();
  }

  const NEXT = { paid: "packed", packed: "shipped", shipped: "delivered" };

  return (
    <ProtectedRoute roles={["admin"]}>
      <Layout>
        <h1 className="page-title mb-5">{t.admin_orders_board}</h1>

        {loading ? (
          <p className="text-muted text-center py-12">{t.loading}</p>
        ) : (
          <div className="overflow-x-auto -mx-4 px-4">
            <div className="flex gap-3 min-w-max pb-4">
              {COLUMNS.map((col) => (
                <div key={col.key} className="w-64">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-mono font-semibold text-sm">{col.label}</span>
                    <span className="bg-border text-muted text-xs font-mono px-2 py-0.5 rounded-full">
                      {(board[col.key] || []).length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {(board[col.key] || []).map((o) => (
                      <div key={o.id} className="card text-sm">
                        <p className="font-mono text-xs text-muted mb-1">#{o.id.slice(-8)}</p>
                        <p className="font-semibold">{o.items?.length} books</p>
                        <p className="text-xs text-muted">{o.delivery_pincode}</p>
                        {NEXT[col.key] && (
                          <button
                            className="btn-primary w-full mt-2 text-xs py-1.5"
                            onClick={() => advance(o.id, NEXT[col.key])}
                          >
                            Move to {NEXT[col.key]}
                          </button>
                        )}
                      </div>
                    ))}
                    {(board[col.key] || []).length === 0 && (
                      <div className="border-2 border-dashed border-border rounded-xl p-4 text-center text-xs text-muted">Empty</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Layout>
    </ProtectedRoute>
  );
}
