import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, SlidersHorizontal } from "lucide-react";
import Layout from "../../components/Layout";
import BookCard from "../../components/BookCard";
import { browseListings } from "../../lib/api";
import t from "../../i18n/en";

const BOARDS = ["", "SCERT", "CBSE", "ICSE", "State Board"];
const CLASSES = ["", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

export default function BrowseBooks() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ book_class: "", board: "", subject: "" });
  const [showFilters, setShowFilters] = useState(false);

  function load() {
    setLoading(true);
    const params = {};
    if (filters.book_class) params.book_class = filters.book_class;
    if (filters.board) params.board = filters.board;
    if (filters.subject) params.subject = filters.subject;
    browseListings(params)
      .then((r) => setListings(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  return (
    <Layout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="page-title">Browse books</h1>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="btn-ghost gap-2 text-sm py-2 px-3"
        >
          <SlidersHorizontal size={16} />
          Filters
        </button>
      </div>

      {showFilters && (
        <div className="card mb-5 grid sm:grid-cols-3 gap-3">
          <div>
            <label className="label">Class</label>
            <select
              className="input"
              value={filters.book_class}
              onChange={(e) => setFilters((f) => ({ ...f, book_class: e.target.value }))}
            >
              {CLASSES.map((c) => <option key={c} value={c}>{c || "All classes"}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Board</label>
            <select
              className="input"
              value={filters.board}
              onChange={(e) => setFilters((f) => ({ ...f, board: e.target.value }))}
            >
              {BOARDS.map((b) => <option key={b} value={b}>{b || "All boards"}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Subject</label>
            <input
              className="input"
              placeholder="e.g. Mathematics"
              value={filters.subject}
              onChange={(e) => setFilters((f) => ({ ...f, subject: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-3">
            <button className="btn-primary w-full" onClick={load}>Search</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-muted text-center py-12">{t.loading}</p>
      ) : listings.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted mb-2">No books match your filters.</p>
          <button onClick={() => { setFilters({ book_class: "", board: "", subject: "" }); load(); }} className="btn-ghost text-sm">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {listings.map((listing) =>
            (listing.books || []).map((book) => (
              <Link key={book.id} to={`/browse/${listing.id}`}>
                <BookCard book={book} price={listing.price} />
              </Link>
            ))
          )}
        </div>
      )}
    </Layout>
  );
}
