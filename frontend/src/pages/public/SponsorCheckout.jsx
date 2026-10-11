import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Heart, AlertCircle } from "lucide-react";
import Layout from "../../components/Layout";
import PriceBreakdown from "../../components/PriceBreakdown";
import { createSponsorship, confirmSponsorPayment, listSchools, getOrder } from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";
import t from "../../i18n/en";

const TIERS = [
  { value: "student", label: t.sponsor_tier_student, desc: "Fund one student's full set" },
  { value: "classroom", label: t.sponsor_tier_classroom, desc: "30 sets for a classroom" },
  { value: "school", label: t.sponsor_tier_school, desc: "Entire school's needs" },
];

export default function SponsorCheckout() {
  const [params] = useSearchParams();
  const orderId = params.get("order_id");
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tier, setTier] = useState("classroom");
  const [schools, setSchools] = useState([]);
  const [targetSchool, setTargetSchool] = useState("");
  const [district, setDistrict] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [message, setMessage] = useState("");
  const [order, setOrder] = useState(null);
  const [sponsorship, setSponsorship] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    listSchools({ verified_only: true }).then((r) => setSchools(r.data)).catch(() => {});
    if (orderId) {
      getOrder(orderId).then((r) => setOrder(r.data)).catch(() => {});
    }
  }, [orderId]);

  async function handleCreateSponsorship() {
    if (!user) { navigate("/auth?next=/sponsor"); return; }
    setLoading(true);
    setError("");
    try {
      const resp = await createSponsorship(
        { tier, target_school_id: targetSchool || undefined, district: district || undefined, anonymous, message },
        orderId
      );
      setSponsorship(resp.data);
      // Trigger Razorpay
      openRazorpay(resp.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create sponsorship.");
    } finally {
      setLoading(false);
    }
  }

  function openRazorpay(sp) {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: sp.amount * 100,
      currency: "INR",
      name: t.app_name,
      description: `Sponsorship — ${tier}`,
      order_id: sp.razorpay_order_id,
      handler: async (response) => {
        try {
          await confirmSponsorPayment(sp.sponsorship_id, {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          navigate("/sponsor/dashboard?success=1");
        } catch {
          setError("Payment verification failed. Please contact support.");
        }
      },
      prefill: { name: user?.name, email: user?.email },
      theme: { color: "#1F63D6" },
    };
    if (window.Razorpay) {
      new window.Razorpay(options).open();
    } else {
      setError("Payment gateway not loaded. Please refresh.");
    }
  }

  return (
    <Layout>
      <div className="max-w-lg mx-auto">
        <h1 className="page-title mb-1">{t.sponsor_title}</h1>
        <p className="text-muted text-sm mb-6">{t.tagline}</p>

        {/* Tier */}
        <div className="space-y-2 mb-5">
          {TIERS.map((t_) => (
            <label key={t_.value} className={`flex items-start gap-3 border rounded-xl p-4 cursor-pointer transition-colors ${tier === t_.value ? "border-primary bg-primary-light" : "border-border hover:border-primary/30"}`}>
              <input type="radio" name="tier" value={t_.value} checked={tier === t_.value} onChange={() => setTier(t_.value)} className="mt-0.5 accent-primary" />
              <div>
                <p className="font-semibold text-sm">{t_.label}</p>
                <p className="text-xs text-muted">{t_.desc}</p>
              </div>
            </label>
          ))}
        </div>

        {/* School picker */}
        <div className="mb-4">
          <label className="label">{t.sponsor_pick_school}</label>
          <select className="input" value={targetSchool} onChange={(e) => setTargetSchool(e.target.value)}>
            <option value="">Any school</option>
            {schools.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.district}</option>)}
          </select>
        </div>

        {/* Anonymous */}
        <label className="flex items-center gap-3 mb-5 cursor-pointer">
          <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="w-5 h-5 accent-primary rounded" />
          <span className="text-sm">{t.sponsor_anonymous}</span>
        </label>

        {/* Message */}
        <div className="mb-5">
          <label className="label">Message (optional)</label>
          <textarea className="input min-h-[80px] resize-none" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="A message of encouragement…" />
        </div>

        {order && (
          <PriceBreakdown breakdown={order.price_breakdown} />
        )}

        {error && (
          <div className="flex items-center gap-2 bg-danger/10 text-danger rounded-xl p-3 text-sm mt-4">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <button className="btn-accent w-full mt-5" onClick={handleCreateSponsorship} disabled={loading || !orderId}>
          <Heart size={18} />
          {loading ? t.loading : t.sponsor_pay}
        </button>

        {!orderId && (
          <p className="text-xs text-muted text-center mt-2">To sponsor, first open a school order and click "Sponsor this order".</p>
        )}
      </div>
    </Layout>
  );
}
