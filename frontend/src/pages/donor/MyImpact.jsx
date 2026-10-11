import { useEffect, useState } from "react";
import { School, BookOpen, Award } from "lucide-react";
import Layout from "../../components/Layout";
import ProtectedRoute from "../../components/ProtectedRoute";
import { getDonorImpact } from "../../lib/api";
import t from "../../i18n/en";

export default function MyImpact() {
  const [impact, setImpact] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDonorImpact()
      .then((r) => setImpact(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedRoute roles={["donor"]}>
      <Layout>
        <h1 className="page-title mb-5">My impact</h1>

        {loading ? (
          <p className="text-muted text-center py-12">{t.loading}</p>
        ) : !impact || impact.books_donated === 0 ? (
          <div className="card text-center py-12">
            <BookOpen size={36} className="text-primary/30 mx-auto mb-3" />
            <p className="text-muted">{t.donor_impact_empty}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="card text-center py-6">
                <BookOpen size={28} className="text-primary mx-auto mb-2" />
                <p className="price text-2xl font-bold">{impact.books_donated}</p>
                <p className="text-xs text-muted">Books listed</p>
              </div>
              <div className="card text-center py-6">
                <Award size={28} className="text-success mx-auto mb-2" />
                <p className="price text-2xl font-bold">{impact.books_delivered}</p>
                <p className="text-xs text-muted">Books delivered</p>
              </div>
            </div>

            {impact.schools_reached.length > 0 && (
              <>
                <h2 className="section-title">Schools reached</h2>
                <div className="space-y-2">
                  {impact.schools_reached.map((s) => (
                    <div key={s.id} className="card flex items-center gap-3">
                      <div className="bg-accent-light rounded-xl w-10 h-10 flex items-center justify-center shrink-0">
                        <School size={20} className="text-accent" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{s.name}</p>
                        <p className="text-xs text-muted font-mono">{s.district}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </Layout>
    </ProtectedRoute>
  );
}
