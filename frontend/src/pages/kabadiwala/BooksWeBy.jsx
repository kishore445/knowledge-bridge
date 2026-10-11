import { BookOpen, CheckCircle, XCircle } from "lucide-react";
import Layout from "../../components/Layout";
import ProtectedRoute from "../../components/ProtectedRoute";

const ACCEPTED = [
  { label: "Textbooks (Class 1–12)", icon: "📚", desc: "All boards — SCERT, CBSE, ICSE, State Board" },
  { label: "Guides & practice books", icon: "📖", desc: "Subject-specific revision guides" },
  { label: "Exam preparation", icon: "📝", desc: "SSC, EAMCET, competitive exam books" },
  { label: "Reference books", icon: "🔬", desc: "Science, Maths, English reference books" },
];

const NOT_ACCEPTED = [
  "Torn or water-damaged pages",
  "Books with large sections missing",
  "Novels and non-academic books",
  "Newspapers and magazines",
];

const CONDITIONS = [
  { label: "Like new", color: "text-success bg-success/10", desc: "No marks, original condition" },
  { label: "Good", color: "text-primary bg-primary-light", desc: "Minor marks, all pages intact" },
  { label: "Usable", color: "text-accent bg-accent-light", desc: "Some writing, usable for study" },
];

export default function BooksWeBy() {
  return (
    <ProtectedRoute roles={["kabadiwala"]}>
      <Layout>
        <h1 className="page-title mb-2">Books we buy</h1>
        <p className="text-muted text-sm mb-6">We pay above scrap rate — per book, not per kg.</p>

        {/* Accepted types — big cards with icons */}
        <h2 className="section-title">We accept</h2>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {ACCEPTED.map((item) => (
            <div key={item.label} className="card flex flex-col items-center text-center gap-2 py-5">
              <span className="text-3xl">{item.icon}</span>
              <p className="font-bold text-sm">{item.label}</p>
              <p className="text-xs text-muted">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Conditions */}
        <h2 className="section-title">Condition grades we accept</h2>
        <div className="space-y-2 mb-6">
          {CONDITIONS.map((c) => (
            <div key={c.label} className="card flex items-center gap-4">
              <span className={`badge text-sm px-3 py-1.5 ${c.color}`}>{c.label}</span>
              <span className="text-sm text-muted">{c.desc}</span>
            </div>
          ))}
        </div>

        {/* Not accepted */}
        <h2 className="section-title">We do NOT accept</h2>
        <div className="card space-y-2">
          {NOT_ACCEPTED.map((item) => (
            <div key={item} className="flex items-center gap-3">
              <XCircle size={16} className="text-danger shrink-0" />
              <span className="text-sm text-muted">{item}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-accent-light rounded-xl p-4 text-center">
          <p className="font-bold text-accent mb-1">Payment per book — not per kg</p>
          <p className="text-xs text-muted">After admin review, payment is sent directly to your UPI account within 24 hours.</p>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
