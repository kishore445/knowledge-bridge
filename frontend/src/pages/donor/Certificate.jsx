import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Award, Download } from "lucide-react";
import Layout from "../../components/Layout";
import ProtectedRoute from "../../components/ProtectedRoute";
import { getCertificate } from "../../lib/api";

export default function Certificate() {
  const { type, refId } = useParams();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getCertificate(type, refId)
      .then((r) => setCert(r.data))
      .catch((err) => setError(err.response?.data?.detail || "Certificate not found."))
      .finally(() => setLoading(false));
  }, [type, refId]);

  function handlePrint() {
    window.print();
  }

  return (
    <ProtectedRoute roles={["donor", "sponsor"]}>
      <Layout>
        {loading ? (
          <p className="text-muted text-center py-12">Loading…</p>
        ) : error ? (
          <p className="text-danger text-center py-12">{error}</p>
        ) : (
          <div className="max-w-lg mx-auto">
            {/* Certificate card */}
            <div id="certificate" className="card-lg border-2 border-primary/20 text-center py-12 px-8 print:border-0">
              <div className="flex justify-center mb-4">
                <div className="bg-primary rounded-2xl p-4">
                  <Award size={36} className="text-white" />
                </div>
              </div>
              <p className="text-xs font-mono text-muted uppercase tracking-widest mb-1">Certificate of {cert.type === "sponsorship" ? "Sponsorship" : "Donation"}</p>
              <h1 className="text-2xl font-bold text-ink my-3">{cert.recipient_name}</h1>
              <p className="text-muted text-sm leading-relaxed mb-4">
                {cert.type === "sponsorship"
                  ? `Thank you for sponsoring books for ${cert.school_name}. Your generosity brings education closer to children who need it.`
                  : `Thank you for donating Class ${cert.book_class} ${cert.subject} (${cert.board}) to students who need it.`}
              </p>
              <p className="font-mono text-xs text-muted">{new Date(cert.date).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>
              <div className="mt-6 border-t border-border pt-4">
                <p className="text-xs font-mono text-primary">Knowledge Bridge — Hyderabad</p>
                <p className="text-xs text-muted italic mt-1">Teach one child, and you change a whole family.</p>
              </div>
            </div>

            <button onClick={handlePrint} className="btn-primary w-full mt-4">
              <Download size={18} />
              Download / Print certificate
            </button>
          </div>
        )}
      </Layout>
    </ProtectedRoute>
  );
}
