import { Link } from "react-router-dom";
import { School, Package, BookOpen, LayoutDashboard, Settings, AlertTriangle } from "lucide-react";
import Layout from "../../components/Layout";
import ProtectedRoute from "../../components/ProtectedRoute";
import t from "../../i18n/en";

const LINKS = [
  { to: "/admin/verification", icon: <School size={22} className="text-primary" />, label: t.admin_verification_queue },
  { to: "/admin/pickups", icon: <Package size={22} className="text-accent" />, label: t.admin_pickup_queue },
  { to: "/admin/grading", icon: <BookOpen size={22} className="text-success" />, label: t.admin_inventory },
  { to: "/admin/orders", icon: <LayoutDashboard size={22} className="text-primary" />, label: t.admin_orders_board },
  { to: "/admin/pricing", icon: <Settings size={22} className="text-ink" />, label: t.admin_pricing },
  { to: "/admin/disputes", icon: <AlertTriangle size={22} className="text-warning" />, label: t.admin_disputes },
];

export default function AdminDashboard() {
  return (
    <ProtectedRoute roles={["admin"]}>
      <Layout>
        <h1 className="page-title mb-6">Admin dashboard</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {LINKS.map((l) => (
            <Link key={l.to} to={l.to} className="card flex flex-col items-center gap-3 py-6 hover:shadow-md transition-shadow text-center">
              <div className="bg-bg rounded-xl w-12 h-12 flex items-center justify-center">{l.icon}</div>
              <span className="text-sm font-medium">{l.label}</span>
            </Link>
          ))}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
