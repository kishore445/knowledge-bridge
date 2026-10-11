import { useEffect, useState } from "react";
import { Save, AlertCircle, CheckCircle } from "lucide-react";
import Layout from "../../components/Layout";
import ProtectedRoute from "../../components/ProtectedRoute";
import { getPricing, updatePricing } from "../../lib/api";
import t from "../../i18n/en";

export default function PricingSettings() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getPricing()
      .then((r) => setForm(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function set(key, val) { setForm((f) => ({ ...f, [key]: val })); }
  function setNested(parent, key, val) {
    setForm((f) => ({ ...f, [parent]: { ...f[parent], [key]: val } }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await updatePricing(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError("Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !form) return <Layout><p className="text-muted text-center py-12">{t.loading}</p></Layout>;

  return (
    <ProtectedRoute roles={["admin"]}>
      <Layout>
        <h1 className="page-title mb-5">{t.admin_pricing}</h1>

        <form onSubmit={handleSave} className="max-w-lg space-y-5">
          <div className="card space-y-4">
            <h2 className="font-semibold">School order fees</h2>
            <div>
              <label className="label">Handling fee per book (₹)</label>
              <input className="input font-mono" type="number" value={form.handling_fee} onChange={(e) => set("handling_fee", parseFloat(e.target.value))} />
            </div>
            <div>
              <label className="label">Sponsorship ops fee (%)</label>
              <input className="input font-mono" type="number" value={form.ops_fee_pct} onChange={(e) => set("ops_fee_pct", parseFloat(e.target.value))} />
              <p className="text-xs text-muted mt-1">Shown openly to sponsors.</p>
            </div>
          </div>

          <div className="card space-y-4">
            <h2 className="font-semibold">Book prices by condition</h2>
            {Object.entries(form.book_price_per_condition || {}).map(([cond, price]) => (
              <div key={cond}>
                <label className="label capitalize">{cond.replace("_", " ")} (₹)</label>
                <input className="input font-mono" type="number" value={price} onChange={(e) => setNested("book_price_per_condition", cond, parseFloat(e.target.value))} />
              </div>
            ))}
          </div>

          <div className="card">
            <label className="label">Kabadiwala rate per book (₹)</label>
            <input className="input font-mono" type="number" value={form.kabadiwala_rate_per_book} onChange={(e) => set("kabadiwala_rate_per_book", parseFloat(e.target.value))} />
          </div>

          {error && <div className="flex items-center gap-2 bg-danger/10 text-danger rounded-xl p-3 text-sm"><AlertCircle size={16}/>{error}</div>}
          {saved && <div className="flex items-center gap-2 bg-success/10 text-success rounded-xl p-3 text-sm"><CheckCircle size={16}/>Saved!</div>}

          <button type="submit" className="btn-primary w-full" disabled={saving}>
            <Save size={18} /> {saving ? "Saving…" : t.save}
          </button>
        </form>
      </Layout>
    </ProtectedRoute>
  );
}
