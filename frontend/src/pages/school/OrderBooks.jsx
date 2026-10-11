import { useEffect, useState } from "react";
import { ShoppingCart, AlertCircle, CheckCircle } from "lucide-react";
import Layout from "../../components/Layout";
import ProtectedRoute from "../../components/ProtectedRoute";
import BookCard from "../../components/BookCard";
import PriceBreakdown from "../../components/PriceBreakdown";
import { listInventory, getDeliveryQuote, createOrder, confirmPayment, getMySchool } from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";
import t from "../../i18n/en";

const BOARDS = ["SCERT", "CBSE", "ICSE", "State Board"];

export default function OrderBooks() {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [selected, setSelected] = useState([]);
  const [school, setSchool] = useState(null);
  const [pincode, setPincode] = useState("");
  const [quote, setQuote] = useState(null);
  const [filters, setFilters] = useState({ book_class: "", board: "" });
  const [loading, setLoading] = useState(false);
  const [quoting, setQuoting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getMySchool().then((r) => setSchool(r.data)).catch(() => {});
    loadBooks();
  }, []);

  function loadBooks() {
    setLoading(true);
    const params = { lane: "donate", in_stock_only: true };
    if (filters.book_class) params.book_class = filters.book_class;
    if (filters.board) params.board = filters.board;
    listInventory(params)
      .then((r) => setBooks(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  function toggle(book) {
    setSelected((s) =>
      s.find((b) => b.id === book.id) ? s.filter((b) => b.id !== book.id) : [...s, book]
    );
  }

  async function fetchQuote() {
    if (!pincode || selected.length === 0) return;
    setQuoting(true);
    try {
      const resp = await getDeliveryQuote({
        from_pin: "500072", // platform warehouse
        to_pin: pincode,
        book_count: selected.length,
      });
      setQuote(resp.data);
    } catch {
    } finally {
      setQuoting(false);
    }
  }

  const breakdown = quote
    ? {
        book_cost: selected.reduce((s, b) => s + (b.condition === "like_new" ? 50 : b.condition === "good" ? 35 : 20), 0),
        handling: 20 * selected.length,
        delivery: quote.amount,
      }
    : null;

  async function placeOrder() {
    if (!breakdown || !school) return;
    setLoading(true);
    setError("");
    try {
      const items = selected.map((b) => ({
        inventory_id: b.id,
        book_class: b.book_class,
        board: b.board,
        subject: b.subject,
        condition: b.condition,
        unit_price: b.condition === "like_new" ? 50 : b.condition === "good" ? 35 : 20,
      }));
      const resp = await createOrder({
        items,
        price_breakdown: breakdown,
        school_id: school.id,
        delivery_pincode: pincode,
      });
      // Open Razorpay
      openRazorpay(resp.data);
    } catch (err) {
      setError(err.response?.data?.detail || t.err_not_available);
    } finally {
      setLoading(false);
    }
  }

  function openRazorpay(order) {
    const total = breakdown.book_cost + breakdown.handling + breakdown.delivery;
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: total * 100,
      currency: "INR",
      name: t.app_name,
      description: "Book order for school",
      order_id: order.razorpay_order_id,
      handler: async (resp) => {
        try {
          await confirmPayment(order.order_id, {
            razorpay_payment_id: resp.razorpay_payment_id,
            razorpay_signature: resp.razorpay_signature,
          });
          setSuccess(true);
        } catch {
          setError("Payment verification failed.");
        }
      },
      prefill: { name: user?.name },
      theme: { color: "#1F63D6" },
    };
    if (window.Razorpay) new window.Razorpay(options).open();
    else setError("Payment gateway not loaded. Please refresh.");
  }

  if (!school) {
    return (
      <ProtectedRoute roles={["school"]}>
        <Layout>
          <div className="card text-center py-10">
            <p className="font-semibold mb-2">Register your school first</p>
            <a href="/school/verify" className="btn-primary inline-flex">Go to registration</a>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  if (school.verified_status !== "verified") {
    return (
      <ProtectedRoute roles={["school"]}>
        <Layout>
          <div className="card text-center py-10 bg-warning/10 border-warning/30">
            <AlertCircle size={32} className="text-warning mx-auto mb-3" />
            <p className="font-semibold">{t.school_pending}</p>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  if (success) {
    return (
      <ProtectedRoute roles={["school"]}>
        <Layout>
          <div className="card max-w-sm mx-auto text-center py-10">
            <CheckCircle size={40} className="text-success mx-auto mb-3" />
            <h2 className="font-bold text-lg mb-2">Order placed!</h2>
            <p className="text-muted text-sm">We'll pack and ship your books soon.</p>
            <a href="/school/orders" className="btn-primary mt-5 inline-flex">View my orders</a>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute roles={["school"]}>
      <Layout>
        <h1 className="page-title mb-4">{t.school_order_books}</h1>

        {/* Filters */}
        <div className="card mb-4 grid sm:grid-cols-3 gap-3">
          <div>
            <label className="label">{t.school_order_class}</label>
            <input className="input" placeholder="e.g. 8" value={filters.book_class} onChange={(e) => setFilters((f) => ({ ...f, book_class: e.target.value }))} />
          </div>
          <div>
            <label className="label">{t.school_order_board}</label>
            <select className="input" value={filters.board} onChange={(e) => setFilters((f) => ({ ...f, board: e.target.value }))}>
              <option value="">All boards</option>
              {BOARDS.map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button className="btn-primary w-full" onClick={loadBooks}>Search</button>
          </div>
        </div>

        {/* Book grid */}
        {loading ? <p className="text-muted py-8 text-center">{t.loading}</p> : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
            {books.map((b) => (
              <BookCard key={b.id} book={b} onSelect={() => toggle(b)} selected={!!selected.find((s) => s.id === b.id)} />
            ))}
          </div>
        )}

        {/* Cart + quote */}
        {selected.length > 0 && (
          <div className="card-lg sticky bottom-0 mt-4 shadow-xl">
            <p className="font-semibold mb-3">{selected.length} book{selected.length !== 1 ? "s" : ""} selected</p>

            <div className="flex gap-2 mb-4">
              <input className="input flex-1" placeholder="Your pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} maxLength={6} />
              <button className="btn-outline" onClick={fetchQuote} disabled={quoting}>
                {quoting ? "…" : "Get quote"}
              </button>
            </div>

            {breakdown && <PriceBreakdown breakdown={breakdown} />}

            {error && (
              <div className="flex items-center gap-2 bg-danger/10 text-danger rounded-xl p-3 text-sm mt-3">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <button
              className="btn-primary w-full mt-4"
              onClick={placeOrder}
              disabled={!breakdown || loading}
            >
              <ShoppingCart size={18} />
              {loading ? t.loading : "Place order"}
            </button>
          </div>
        )}
      </Layout>
    </ProtectedRoute>
  );
}
