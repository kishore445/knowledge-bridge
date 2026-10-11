import t from "../i18n/en";

export default function PriceBreakdown({ breakdown, sponsorAmount, opsFee }) {
  const total = breakdown
    ? breakdown.book_cost + breakdown.handling + breakdown.delivery
    : 0;

  return (
    <div className="bg-primary-light rounded-xl p-4 space-y-2">
      <p className="font-semibold text-sm text-primary mb-2">{t.school_price_breakdown}</p>

      <Row label={t.school_book_cost} value={breakdown?.book_cost} />
      <Row label={t.school_handling} value={breakdown?.handling} />
      <Row label={t.school_delivery} value={breakdown?.delivery} />

      <div className="border-t border-primary/20 pt-2 flex justify-between font-bold">
        <span className="text-ink">{t.school_total}</span>
        <span className="price text-primary">₹{total.toFixed(2)}</span>
      </div>

      {sponsorAmount != null && (
        <>
          <div className="border-t border-primary/20 pt-2">
            <Row label={t.sponsor_ops_fee} value={opsFee} note={`${t.sponsor_ops_note}`} />
            <div className="flex justify-between font-bold mt-1">
              <span className="text-ink">Sponsor pays</span>
              <span className="price text-accent">₹{(sponsorAmount).toFixed(2)}</span>
            </div>
          </div>
          <p className="text-xs text-muted italic">{t.sponsor_ops_note}</p>
        </>
      )}
    </div>
  );
}

function Row({ label, value, note }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted">{label}</span>
      <span className="price text-ink">₹{(value || 0).toFixed(2)}</span>
    </div>
  );
}
