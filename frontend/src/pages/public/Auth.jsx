import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { BookOpen, ArrowLeft, AlertCircle } from "lucide-react";
import { requestOtp, verifyOtp } from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";
import t from "../../i18n/en";

const ROLES = [
  { value: "donor", label: t.auth_role_donor },
  { value: "kabadiwala", label: t.auth_role_kabadiwala },
  { value: "school", label: t.auth_role_school },
  { value: "student", label: t.auth_role_student },
  { value: "buyer", label: t.auth_role_buyer },
  { value: "sponsor", label: t.auth_role_sponsor },
];

export default function Auth() {
  const [params] = useSearchParams();
  const defaultRole = params.get("role") || "donor";
  const next = params.get("next") || "/";

  const [step, setStep] = useState("form"); // form | otp
  const [channel, setChannel] = useState("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState(defaultRole);
  const [isMinor, setIsMinor] = useState(false);
  const [parentPhone, setParentPhone] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mockOtp, setMockOtp] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleRequestOtp(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const resp = await requestOtp({
        phone: channel === "phone" ? phone : undefined,
        email: channel === "email" ? email : undefined,
        role,
        name: name || undefined,
      });
      if (resp.data.otp) setMockOtp(resp.data.otp);
      setStep("otp");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const resp = await verifyOtp({
        phone: channel === "phone" ? phone : undefined,
        email: channel === "email" ? email : undefined,
        otp,
      });
      login(resp.data.access_token, resp.data.user);
      navigate(next, { replace: true });
    } catch (err) {
      setError(t.err_otp_invalid);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 py-12">
      <Link to="/" className="flex items-center gap-2 font-bold text-ink mb-8">
        <div className="bg-primary rounded-lg p-1.5">
          <BookOpen size={18} className="text-white" />
        </div>
        {t.app_name}
      </Link>

      <div className="card-lg w-full max-w-sm">
        {step === "form" ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <h1 className="page-title text-xl">{t.auth_title_signup}</h1>

            {/* Role picker */}
            <div>
              <label className="label">{t.auth_role_label}</label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((r) => (
                  <label
                    key={r.value}
                    className={`flex items-center gap-2 border rounded-xl px-3 py-3 cursor-pointer transition-colors text-sm ${
                      role === r.value
                        ? "border-primary bg-primary-light text-primary font-medium"
                        : "border-border text-muted hover:border-primary/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r.value}
                      checked={role === r.value}
                      onChange={() => setRole(r.value)}
                      className="sr-only"
                    />
                    {r.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="label">{t.auth_name_label}</label>
              <input
                className="input"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Channel toggle */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setChannel("phone")}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  channel === "phone"
                    ? "border-primary bg-primary-light text-primary"
                    : "border-border text-muted"
                }`}
              >
                Phone
              </button>
              <button
                type="button"
                onClick={() => setChannel("email")}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  channel === "email"
                    ? "border-primary bg-primary-light text-primary"
                    : "border-border text-muted"
                }`}
              >
                Email
              </button>
            </div>

            {channel === "phone" ? (
              <div>
                <label className="label">{t.auth_phone_label}</label>
                <input
                  className="input"
                  type="tel"
                  placeholder="+91 XXXXX XXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            ) : (
              <div>
                <label className="label">{t.auth_email_label}</label>
                <input
                  className="input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            )}

            {/* Minor */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isMinor}
                onChange={(e) => setIsMinor(e.target.checked)}
                className="w-5 h-5 rounded border-border accent-primary"
              />
              <span className="text-sm text-muted">{t.auth_minor_label}</span>
            </label>

            {isMinor && (
              <div className="space-y-3 bg-accent-light rounded-xl p-3">
                <p className="text-xs text-accent font-medium">Parent / guardian contact required</p>
                <div>
                  <label className="label">{t.auth_parent_phone}</label>
                  <input className="input" type="tel" value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} required />
                </div>
                <div>
                  <label className="label">{t.auth_parent_email}</label>
                  <input className="input" type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} required />
                </div>
              </div>
            )}

            {error && <ErrorMsg msg={error} />}

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? t.loading : t.auth_send_otp}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <button type="button" onClick={() => setStep("form")} className="flex items-center gap-1 text-muted text-sm mb-2">
              <ArrowLeft size={16} /> {t.back}
            </button>
            <h1 className="page-title text-xl">Enter your OTP</h1>
            <p className="text-muted text-sm">
              We sent a 6-digit code to{" "}
              <span className="font-mono text-ink">{channel === "phone" ? phone : email}</span>
            </p>

            {mockOtp && (
              <div className="bg-warning/10 border border-warning/30 rounded-xl p-3 text-sm">
                <p className="font-mono font-bold text-warning text-center text-2xl tracking-widest">{mockOtp}</p>
                <p className="text-center text-xs text-muted mt-1">Dev mode — OTP shown here</p>
              </div>
            )}

            <div>
              <label className="label">{t.auth_otp_label}</label>
              <input
                className="input font-mono text-center text-2xl tracking-widest"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                required
              />
            </div>

            {error && <ErrorMsg msg={error} />}

            <button type="submit" className="btn-primary w-full" disabled={loading || otp.length !== 6}>
              {loading ? t.loading : t.auth_verify}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function ErrorMsg({ msg }) {
  return (
    <div className="flex items-start gap-2 bg-danger/10 text-danger rounded-xl p-3 text-sm">
      <AlertCircle size={16} className="mt-0.5 shrink-0" />
      {msg}
    </div>
  );
}
