import { BookOpen, Star } from "lucide-react";
import t from "../i18n/en";

const CONDITION_CLASS = {
  like_new: "tag-like-new",
  good: "tag-good",
  usable: "tag-usable",
};

const CONDITION_LABEL = {
  like_new: t.condition_like_new,
  good: t.condition_good,
  usable: t.condition_usable,
};

export default function BookCard({ book, price, onSelect, selected }) {
  return (
    <div
      className={`card cursor-pointer transition-all hover:shadow-md ${
        selected ? "ring-2 ring-primary" : ""
      }`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onSelect?.()}
    >
      {/* Book cover placeholder */}
      <div className="bg-primary-light rounded-xl h-32 flex items-center justify-center mb-3">
        <BookOpen size={36} className="text-primary/40" />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <span className="font-semibold text-sm text-ink leading-tight">
            Class {book.book_class} — {book.subject}
          </span>
          {book.govt_issued && (
            <span className="tag-govt shrink-0">Govt</span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs text-muted">{book.board}</span>
          <span className="text-muted text-xs">·</span>
          <span className="font-mono text-xs text-muted">{book.edition_year}</span>
        </div>

        <span className={CONDITION_CLASS[book.condition] || "badge bg-border text-muted"}>
          {CONDITION_LABEL[book.condition] || book.condition}
        </span>

        {price != null && (
          <p className="price text-primary text-base mt-1">₹{price}</p>
        )}
      </div>
    </div>
  );
}
