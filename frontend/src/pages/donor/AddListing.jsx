import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, AlertCircle, CheckCircle } from "lucide-react";
import Layout from "../../components/Layout";
import ProtectedRoute from "../../components/ProtectedRoute";
import { createDonorListing } from "../../lib/api";
import t from "../../i18n/en";

const BOARDS = ["SCERT", "CBSE", "ICSE", "State Board", "Other"];
const CONDITIONS = [
  { value: "like_new", label: t.condition_like_new },
  { value: "good", label: t.condition_good },
  { value: "usable", label: t.condition_usable },
];

export default function AddListing() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    book_class: "",
    board: "SCERT",
    subject: "",
    edition_year: new Date().getFullYear() - 1,
    condition: "good",
    is_free: true,
    asking_price: "",
    area: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await createDonorListing({
        ...form,
        asking_price: form.is_free ? null : parseFloat(form.asking_price),
        edition_year: parseInt(form.edition_year),
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create listing.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <ProtectedRoute roles={["donor"]}>
        <Layout>
          <div className="card max-w-sm mx-auto text-center py-10">
            <CheckCircle size={40} className="text-success mx-auto mb-3" />
            <h2 className="font-bold text-lg mb-2">Listing created!</h2>
            <p className="text-muted text-sm mb-5">We'll contact you to arrange pickup. Thank you for donating!</p>
            <button onClick={() => navigate("/donor")} className="btn-primary w-full">Back to my books</button>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute roles={["donor"]}>
      <Layout>
        <div className="max-w-lg mx-auto">
          <h1 className="page-title mb-5">{t.donor_add_listing}</h1>

          <form onSubmit={handleSubmit} className="card space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{t.donor_listing_class}</label>
                <input className="input" value={form.book_class} onChange={(e) => set("book_class", e.target.value)} placeholder="e.g. 8" required />
              </div>
              <div>
                <label className="label">{t.donor_listing_board}</label>
                <select className="input" value={form.board} onChange={(e) => set("board", e.target.value)}>
                  {BOARDS.map((b) => <option key={b}>{b}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="label">{t.donor_listing_subject}</label>
              <input className="input" value={form.subject} onChange={(e) => set("subject", e.target.value)} placeholder="e.g. Mathematics" required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{t.donor_listing_edition}</label>
                <input className="input" type="number" value={form.edition_year} onChange={(e) => set("edition_year", e.target.value)} min={2000} max={2030} required />
              </div>
              <div>
                <label className="label">{t.donor_listing_condition}</label>
                <select className="input" value={form.condition} onChange={(e) => set("condition", e.target.value)}>
                  {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="label">{t.donor_listing_area}</label>
              <input className="input" value={form.area} onChange={(e) => set("area", e.target.value)} placeholder="e.g. Kukatpally" required />
              <p className="text-xs text-muted mt-1">{t.privacy_note}</p>
            </div>

            <div>
              <p className="label mb-2">Would you like to donate or sell?</p>
              <div className="flex gap-3">
                <label className={`flex-1 border rounded-xl p-3 cursor-pointer text-center text-sm ${form.is_free ? "border-success bg-success/10 text-success font-medium" : "border-border text-muted"}`}>
                  <input type="radio" className="sr-only" checked={form.is_free} onChange={() => set("is_free", true)} />
                  {t.donor_listing_free}
                </label>
                <label className={`flex-1 border rounded-xl p-3 cursor-pointer text-center text-sm ${!form.is_free ? "border-primary bg-primary-light text-primary font-medium" : "border-border text-muted"}`}>
                  <input type="radio" className="sr-only" checked={!form.is_free} onChange={() => set("is_free", false)} />
                  {t.donor_listing_sell}
                </label>
              </div>
            </div>

            {!form.is_free && (
              <div>
                <label className="label">{t.donor_listing_price}</label>
                <input className="input font-mono" type="number" value={form.asking_price} onChange={(e) => set("asking_price", e.target.value)} placeholder="50" min={1} required />
              </div>
            )}

            <div>
              <label className="label">Notes (optional)</label>
              <textarea className="input resize-none min-h-[72px]" value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Any damage, missing pages, etc." />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-danger/10 text-danger rounded-xl p-3 text-sm">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              <BookOpen size={18} />
              {loading ? t.loading : t.submit}
            </button>
          </form>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
