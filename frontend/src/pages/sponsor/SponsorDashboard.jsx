import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Award } from "lucide-react";
import Layout from "../../components/Layout";
import ProtectedRoute from "../../components/ProtectedRoute";
import StatusBadge from "../../components/StatusBadge";
import { getMySponsorships } from "../../lib/api";
import t from "../../i18n/en";

export default function SponsorDashboard() {
  const [sponsorships, setSponsorships] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMySponsorships()
      .then((r) => setSponsorships(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedRoute roles={["sponsor"]}>
      <Layout>
        <div className="flex items-center justify-between mb-5">
          <h1 className="page-title">My sponsorships</h1>
          <Link to="/sponsor" className="btn-accent text-sm py-2.5 px-4">
            <Heart size={16} /> Sponsor more
          </Link>
        </div>

        {loading ? (
          <p className="text-muted text-center py-12">{t.loading}</p>
        ) : sponsorships.length === 0 ? (
          <div className="card text-center py-12">
            <Heart size={36} className="text-accent/30 mx-auto mb-3" />
            <p className="text-muted mb-4">You haven't sponsored any books yet.</p>
            <Link to="/sponsor" className="btn-accent inline-flex">Sponsor a school</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sponsorships.map((s) => (
              <div key={s.id} className="card">
                <div className="flex items-center justify-between mb-2">
                  <span className="badge bg-accent-light text-accent capitalize">{s.tier}</span>
                  <span className="price text-primary">₹{s.amount?.toFixed(2)}</span>
                </div>
                <p className="text-sm font-medium">{s.fulfilled ? "Fulfilled" : "Pending"}</p>
                {s.message && <p className="text-xs text-muted italic mt-1">{s.message}</p>}
                <p className="text-xs text-muted font-mono mt-1">{new Date(s.created_at).toLocaleDateString()}</p>
                {s.fulfilled && (
                  <Link to={`/certificate/sponsorship/${s.id}`} className="btn-ghost mt-2 w-full text-sm py-2 justify-center">
                    <Award size={16} /> {t.donor_cert_download}
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </Layout>
    </ProtectedRoute>
  );
}
