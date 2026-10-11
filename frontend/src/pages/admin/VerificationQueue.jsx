import { useEffect, useState } from "react";
import { CheckCircle, XCircle, School } from "lucide-react";
import Layout from "../../components/Layout";
import ProtectedRoute from "../../components/ProtectedRoute";
import StatusBadge from "../../components/StatusBadge";
import { getVerificationQueue, verifySchool, rejectSchool } from "../../lib/api";
import t from "../../i18n/en";

export default function VerificationQueue() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);

  function reload() {
    setLoading(true);
    getVerificationQueue()
      .then((r) => setSchools(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(reload, []);

  async function handleVerify(id) {
    await verifySchool(id);
    reload();
  }

  async function handleReject(id) {
    const reason = prompt("Rejection reason (optional):");
    await rejectSchool(id, reason || "");
    reload();
  }

  return (
    <ProtectedRoute roles={["admin"]}>
      <Layout>
        <h1 className="page-title mb-5">{t.admin_verification_queue}</h1>

        {loading ? (
          <p className="text-muted text-center py-12">{t.loading}</p>
        ) : schools.length === 0 ? (
          <div className="card text-center py-12">
            <CheckCircle size={36} className="text-success mx-auto mb-3" />
            <p className="text-muted">No pending schools. All caught up!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {schools.map((s) => (
              <div key={s.id} className="card">
                <div className="flex items-start gap-3">
                  <div className="bg-primary-light rounded-xl w-10 h-10 flex items-center justify-center shrink-0">
                    <School size={20} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{s.name}</p>
                    <p className="text-xs text-muted font-mono">UDISE: {s.udise} · {s.district}</p>
                    <p className="text-xs text-muted mt-0.5">{s.address}</p>
                    <p className="text-xs text-muted">HM: {s.headmaster_name}</p>
                  </div>
                  <StatusBadge status={s.verified_status} />
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                  <button onClick={() => handleVerify(s.id)} className="btn-primary flex-1 text-sm py-2">
                    <CheckCircle size={16} /> {t.admin_accept}
                  </button>
                  <button onClick={() => handleReject(s.id)} className="btn-ghost flex-1 text-sm py-2 text-danger">
                    <XCircle size={16} /> {t.admin_reject}
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
