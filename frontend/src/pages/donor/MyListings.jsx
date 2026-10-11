import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, BookOpen } from "lucide-react";
import Layout from "../../components/Layout";
import StatusBadge from "../../components/StatusBadge";
import ProtectedRoute from "../../components/ProtectedRoute";
import { getMyDonorListings } from "../../lib/api";
import t from "../../i18n/en";

export default function MyListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyDonorListings()
      .then((r) => setListings(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedRoute roles={["donor"]}>
      <Layout>
        <div className="flex items-center justify-between mb-5">
          <h1 className="page-title">My books</h1>
          <Link to="/donor/add" className="btn-primary text-sm py-2.5 px-4">
            <Plus size={16} />
            {t.donor_add_listing}
          </Link>
        </div>

        {loading ? (
          <p className="text-muted text-center py-12">{t.loading}</p>
        ) : listings.length === 0 ? (
          <div className="card text-center py-12">
            <BookOpen size={36} className="text-primary/30 mx-auto mb-3" />
            <p className="text-muted">{t.donor_no_listings}</p>
            <Link to="/donor/add" className="btn-primary mt-4 inline-flex">
              <Plus size={16} /> Add your first book
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map((l) => (
              <div key={l.id} className="card flex items-center gap-4">
                <div className="bg-primary-light rounded-xl w-12 h-12 flex items-center justify-center shrink-0">
                  <BookOpen size={22} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">
                    Class {l.book_class} — {l.subject}
                  </p>
                  <p className="text-xs text-muted font-mono">{l.board} · {l.edition_year}</p>
                </div>
                <StatusBadge status={l.status} />
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <Link to="/donor/impact" className="btn-outline text-sm flex-1 text-center justify-center">
            My impact
          </Link>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
