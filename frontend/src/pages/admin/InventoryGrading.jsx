import { useEffect, useState } from "react";
import { BookOpen, CheckCircle, AlertCircle } from "lucide-react";
import Layout from "../../components/Layout";
import ProtectedRoute from "../../components/ProtectedRoute";
import { getInventoryToGrade, gradeBook } from "../../lib/api";
import t from "../../i18n/en";

const BOARDS = ["SCERT", "CBSE", "ICSE", "State Board"];
const CONDITIONS = [
  { value: "like_new", label: t.condition_like_new },
  { value: "good", label: t.condition_good },
  { value: "usable", label: t.condition_usable },
];
const LANES = [
  { value: "donate", label: t.admin_lane_donate },
  { value: "resale", label: t.admin_lane_resale },
  { value: "scrap", label: t.admin_lane_scrap },
];

export default function InventoryGrading() {
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const [form, setForm] = useState({ book_class: "", board: "SCERT", subject: "", edition_year: 2022, condition: "good", govt_issued: false, lane: "donate" });
  const [grading, setGrading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getInventoryToGrade()
      .then((r) => setPickups(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function set(key, val) {
    let lane = form.lane;
    // Auto-force donate if govt_issued
    if (key === "govt_issued" && val) lane = "donate";
    setForm((f) => ({ ...f, [key]: val, ...(key === "govt_issued" && val ? { lane: "donate" } : {}) }));
  }

  async function handleGrade(pickupId) {
    setGrading(true);
    setError("");
    try {
      await gradeBook(pickupId, { ...form, edition_year: parseInt(form.edition_year) });
      alert("Book graded and added to inventory.");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to grade book.");
    } finally {
      setGrading(false);
    }
  }

  return (
    <ProtectedRoute roles={["admin"]}>
      <Layout>
        <h1 className="page-title mb-5">{t.admin_inventory}</h1>

        {loading ? (
          <p className="text-muted text-center py-12">{t.loading}</p>
        ) : pickups.length === 0 ? (
          <div className="card text-center py-12">
            <BookOpen size={36} className="text-primary/30 mx-auto mb-3" />
            <p className="text-muted">No accepted pickups waiting to be graded.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pickups.map((p) => (
              <div key={p.id} className="card">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-sm">{p.declared_count} books · {p.accepted_count ?? p.declared_count} accepted</p>
                  <span className="font-mono text-xs text-muted">{p.graded_count} graded</span>
                </div>

                {active === p.id ? (
                  <div className="space-y-3 border-t border-border pt-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="label">Class</label>
                        <input className="input" value={form.book_class} onChange={(e) => set("book_class", e.target.value)} placeholder="e.g. 8" required />
                      </div>
                      <div>
                        <label className="label">Board</label>
                        <select className="input" value={form.board} onChange={(e) => set("board", e.target.value)}>
                          {BOARDS.map((b) => <option key={b}>{b}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="label">Subject</label>
                        <input className="input" value={form.subject} onChange={(e) => set("subject", e.target.value)} required />
                      </div>
                      <div>
                        <label className="label">Edition year</label>
                        <input className="input" type="number" value={form.edition_year} onChange={(e) => set("edition_year", e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="label">Condition</label>
                        <select className="input" value={form.condition} onChange={(e) => set("condition", e.target.value)}>
                          {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="label">Lane</label>
                        <select className="input" value={form.lane} onChange={(e) => set("lane", e.target.value)} disabled={form.govt_issued}>
                          {LANES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                        </select>
                      </div>
                    </div>
                    <label className="flex items-center gap-3">
                      <input type="checkbox" checked={form.govt_issued} onChange={(e) => set("govt_issued", e.target.checked)} className="w-5 h-5 accent-accent rounded" />
                      <span className="text-sm">Government-issued book (forces donate lane)</span>
                    </label>

                    {form.govt_issued && <p className="text-xs text-accent">This book will go to the donate lane only.</p>}
                    {error && <div className="flex items-center gap-2 bg-danger/10 text-danger rounded-xl p-3 text-sm"><AlertCircle size={16}/>{error}</div>}

                    <div className="flex gap-2">
                      <button className="btn-primary flex-1" onClick={() => handleGrade(p.id)} disabled={grading}>
                        <CheckCircle size={16} /> {grading ? "Grading…" : t.admin_grade_book}
                      </button>
                      <button className="btn-ghost" onClick={() => setActive(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button className="btn-outline w-full text-sm" onClick={() => setActive(p.id)}>
                    <BookOpen size={16} /> Grade a book from this pickup
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
