import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle, AlertCircle, Camera } from "lucide-react";
import Layout from "../../components/Layout";
import ProtectedRoute from "../../components/ProtectedRoute";
import { schoolConfirmDelivery } from "../../lib/api";
import t from "../../i18n/en";

export default function ConfirmDelivery() {
  const [params] = useSearchParams();
  const deliveryId = params.get("delivery_id");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    if (!deliveryId) { setError("No delivery ID provided."); return; }
    setLoading(true);
    setError("");
    try {
      await schoolConfirmDelivery(deliveryId);
      setConfirmed(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Confirmation failed.");
    } finally {
      setLoading(false);
    }
  }

  if (confirmed) {
    return (
      <ProtectedRoute roles={["school"]}>
        <Layout>
          <div className="card max-w-sm mx-auto text-center py-10">
            <CheckCircle size={40} className="text-success mx-auto mb-3" />
            <h2 className="font-bold text-lg mb-2">Delivery confirmed!</h2>
            <p className="text-muted text-sm mb-5">Thank you for signing off. The sponsor and donor have been notified.</p>
            <a href="/school/orders" className="btn-primary inline-flex">Back to orders</a>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute roles={["school"]}>
      <Layout>
        <div className="max-w-sm mx-auto">
          <h1 className="page-title mb-5">{t.school_confirm_delivery}</h1>
          <div className="card space-y-4">
            <p className="text-muted text-sm">Please confirm that you have received the books in good condition.</p>
            <div className="bg-primary-light rounded-xl p-4 text-sm text-primary">
              <p className="font-semibold mb-1">By confirming you agree that:</p>
              <ul className="space-y-1 text-xs list-disc list-inside text-primary/80">
                <li>Books have been received by the school</li>
                <li>The count matches the delivery note</li>
                <li>Books are in acceptable condition</li>
              </ul>
            </div>
            {error && (
              <div className="flex items-center gap-2 bg-danger/10 text-danger rounded-xl p-3 text-sm">
                <AlertCircle size={16} /> {error}
              </div>
            )}
            <button className="btn-primary w-full py-4 text-base" onClick={handleConfirm} disabled={loading || !deliveryId}>
              {loading ? t.loading : `${t.school_delivery_sign} & confirm`}
            </button>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
