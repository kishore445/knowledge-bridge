import { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, School } from "lucide-react";
import Layout from "../../components/Layout";
import ProtectedRoute from "../../components/ProtectedRoute";
import StatusBadge from "../../components/StatusBadge";
import { registerSchool, getMySchool } from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";
import t from "../../i18n/en";

const DISTRICTS = ["Hyderabad", "Rangareddy", "Medchal", "Sangareddy", "Vikarabad", "Yadadri", "Suryapet", "Nalgonda"];

export default function VerificationForm() {
  const { user } = useAuth();
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ udise: "", name: "", address: "", district: "Hyderabad", headmaster_name: "", phone: "", email: "" });

  useEffect(() => {
    getMySchool()
      .then((r) => setSchool(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function set(key, val) { setForm((f) => ({ ...f, [key]: val })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await registerSchool({ ...form, user_id: user._id });
      const r = await getMySchool();
      setSchool(r.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Layout><p className="text-muted text-center py-12">Loading…</p></Layout>;

  if (school) {
    return (
      <ProtectedRoute roles={["school"]}>
        <Layout>
          <div className="max-w-lg mx-auto">
            <h1 className="page-title mb-5">School registration</h1>
            <div className="card-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary-light rounded-xl w-12 h-12 flex items-center justify-center">
                  <School size={24} className="text-primary" />
                </div>
                <div>
                  <p className="font-bold text-lg">{school.name}</p>
                  <StatusBadge status={school.verified_status} />
                </div>
              </div>
              <div className="space-y-2 text-sm text-muted">
                <p><span className="font-mono font-medium text-ink">UDISE:</span> {school.udise}</p>
                <p><span className="font-mono font-medium text-ink">District:</span> {school.district}</p>
                <p><span className="font-mono font-medium text-ink">Headmaster:</span> {school.headmaster_name}</p>
              </div>
              {school.verified_status === "pending" && (
                <div className="mt-4 bg-warning/10 rounded-xl p-3 text-sm text-warning">{t.school_pending}</div>
              )}
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute roles={["school"]}>
      <Layout>
        <div className="max-w-lg mx-auto">
          <h1 className="page-title mb-5">Register your school</h1>
          <form onSubmit={handleSubmit} className="card space-y-4">
            <div>
              <label className="label">{t.school_udise}</label>
              <input className="input font-mono" value={form.udise} onChange={(e) => set("udise", e.target.value)} placeholder="e.g. 36150100201" required />
            </div>
            <div>
              <label className="label">{t.school_name}</label>
              <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} required />
            </div>
            <div>
              <label className="label">{t.school_address}</label>
              <textarea className="input resize-none min-h-[72px]" value={form.address} onChange={(e) => set("address", e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{t.school_district}</label>
                <select className="input" value={form.district} onChange={(e) => set("district", e.target.value)}>
                  {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="label">{t.school_headmaster}</label>
                <input className="input" value={form.headmaster_name} onChange={(e) => set("headmaster_name", e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">School phone</label>
                <input className="input" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              </div>
              <div>
                <label className="label">School email</label>
                <input className="input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
              </div>
            </div>
            {error && <div className="flex items-center gap-2 bg-danger/10 text-danger rounded-xl p-3 text-sm"><AlertCircle size={16} />{error}</div>}
            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? t.loading : "Submit for verification"}
            </button>
          </form>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
