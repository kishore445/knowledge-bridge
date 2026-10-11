import { useState } from "react";
import { CheckCircle, AlertCircle, Camera, Package } from "lucide-react";
import Layout from "../../components/Layout";
import ProtectedRoute from "../../components/ProtectedRoute";
import { logPickup } from "../../lib/api";
import t from "../../i18n/en";

export default function LogPickup() {
  const [form, setForm] = useState({ declared_count: "", govt_issued: false, notes: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await logPickup({
        declared_count: parseInt(form.declared_count),
        govt_issued: form.govt_issued,
        notes: form.notes || undefined,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to log pickup.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <ProtectedRoute roles={["kabadiwala"]}>
        <Layout>
          <div className="card max-w-sm mx-auto text-center py-10">
            <CheckCircle size={40} className="text-success mx-auto mb-3" />
            <h2 className="font-bold text-lg mb-2">Pickup logged!</h2>
            <p className="text-muted text-sm mb-5">Admin will review your pickup within 1-2 days.</p>
            <button onClick={() => setSuccess(false)} className="btn-primary w-full">Log another pickup</button>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute roles={["kabadiwala"]}>
      <Layout>
        <div className="max-w-sm mx-auto">
          <h1 className="page-title mb-5">{t.kb_log_pickup}</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Book count — BIG for kabadiwala */}
            <div className="card py-6 text-center">
              <Package size={32} className="text-primary mx-auto mb-3" />
              <label className="label text-base mb-3 block">{t.kb_book_count}</label>
              <input
                className="input text-center text-3xl font-mono font-bold w-32 mx-auto"
                type="number"
                min={1}
                max={1000}
                value={form.declared_count}
                onChange={(e) => setForm((f) => ({ ...f, declared_count: e.target.value }))}
                placeholder="0"
                required
              />
            </div>

            {/* Govt issued — large checkbox */}
            <label className={`flex items-center gap-4 border-2 rounded-xl p-5 cursor-pointer transition-colors ${form.govt_issued ? "border-accent bg-accent-light" : "border-border hover:border-accent/30"}`}>
              <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-colors ${form.govt_issued ? "bg-accent border-accent" : "border-border"}`}>
                {form.govt_issued && <CheckCircle size={18} className="text-white" />}
              </div>
              <div>
                <p className="font-bold text-base">{t.kb_govt_issued}</p>
                <p className="text-xs text-muted">Textbooks with government stamp / logo</p>
              </div>
              <input type="checkbox" className="sr-only" checked={form.govt_issued} onChange={(e) => setForm((f) => ({ ...f, govt_issued: e.target.checked }))} />
            </label>

            <div>
              <label className="label">Notes (optional)</label>
              <textarea className="input resize-none min-h-[72px]" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Condition, subject area, etc." />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-danger/10 text-danger rounded-xl p-3 text-sm">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full text-base py-4" disabled={loading}>
              {loading ? t.loading : t.kb_submit_pickup}
            </button>
          </form>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
