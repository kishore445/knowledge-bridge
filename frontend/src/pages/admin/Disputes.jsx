import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle } from "lucide-react";
import Layout from "../../components/Layout";
import ProtectedRoute from "../../components/ProtectedRoute";
import StatusBadge from "../../components/StatusBadge";
import api from "../../lib/api";
import t from "../../i18n/en";

export default function Disputes() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  function reload() {
    setLoading(true);
    api.get("/api/admin/disputes")
      .then((r) => setDisputes(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(reload, []);

  async function handleResolve(id) {
    const res = prompt("Resolution notes:");
    if (!res) return;
    await api.patch(`/api/admin/disputes/${id}/resolve`, null, { params: { resolution: res } });
    reload();
  }

  return (
    <ProtectedRoute roles={["admin"]}>
      <Layout>
        <h1 className="page-title mb-5">{t.admin_disputes}</h1>

        {loading ? (
          <p className="text-muted text-center py-12">{t.loading}</p>
        ) : disputes.length === 0 ? (
          <div className="card text-center py-12">
            <CheckCircle size={36} className="text-success mx-auto mb-3" />
            <p className="text-muted">No open disputes.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {disputes.map((d) => (
              <div key={d.id} className="card">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={20} className={d.status === "open" ? "text-warning" : "text-success"} />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{d.reference_type}: <span className="font-mono">{d.reference_id?.slice(-8)}</span></p>
                    <p className="text-xs text-muted mt-1">{d.description}</p>
                    {d.resolution && <p className="text-xs text-success mt-1">Resolution: {d.resolution}</p>}
                    <p className="text-xs text-muted font-mono mt-1">{new Date(d.created_at).toLocaleDateString()}</p>
                  </div>
                  <StatusBadge status={d.status} />
                </div>
                {d.status === "open" && (
                  <button className="btn-primary w-full mt-3 text-sm py-2" onClick={() => handleResolve(d.id)}>
                    <CheckCircle size={16} /> Resolve
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Layout>
    </ProtectedRoute>
  );
}
