import t from "../i18n/en";

const STATUS_STYLES = {
  pending_payment: "bg-warning/10 text-warning",
  paid: "bg-success/10 text-success",
  packed: "bg-primary-light text-primary",
  shipped: "bg-primary-light text-primary",
  delivered: "bg-success/10 text-success",
  cancelled: "bg-danger/10 text-danger",
  submitted: "bg-warning/10 text-warning",
  accepted: "bg-success/10 text-success",
  rejected: "bg-danger/10 text-danger",
  pending: "bg-warning/10 text-warning",
  verified: "bg-success/10 text-success",
  in_stock: "bg-success/10 text-success",
  reserved: "bg-warning/10 text-warning",
};

const STATUS_LABELS = {
  pending_payment: t.status_pending_payment,
  paid: t.status_paid,
  packed: t.status_packed,
  shipped: t.status_shipped,
  delivered: t.status_delivered,
  cancelled: t.status_cancelled,
  submitted: t.status_submitted,
  accepted: t.status_accepted,
  rejected: t.status_rejected,
  pending: t.status_pending,
  verified: t.status_verified,
  in_stock: "In stock",
  reserved: "Reserved",
};

export default function StatusBadge({ status }) {
  const cls = STATUS_STYLES[status] || "bg-border text-muted";
  const label = STATUS_LABELS[status] || status;
  return (
    <span className={`badge ${cls}`}>{label}</span>
  );
}
