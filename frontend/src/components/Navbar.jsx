import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Menu, X, ChevronDown, LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import t from "../i18n/en";

const ROLE_DASHBOARD = {
  admin: "/admin",
  donor: "/donor",
  kabadiwala: "/kabadiwala",
  school: "/school",
  student: "/student",
  buyer: "/browse",
  sponsor: "/sponsor/dashboard",
};

export default function Navbar() {
  const { user, logout, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const dashboardPath = user ? ROLE_DASHBOARD[user.role] || "/" : "/";

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <nav className="bg-white border-b border-border sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-ink">
          <div className="bg-primary rounded-lg p-1.5">
            <BookOpen size={18} className="text-white" />
          </div>
          <span className="hidden sm:block">{t.app_name}</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          <NavLink to="/browse">{t.nav_browse}</NavLink>
          <NavLink to="/impact">{t.nav_impact}</NavLink>
          <NavLink to="/sponsor">{t.nav_sponsor}</NavLink>
        </div>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-2">
          {isLoggedIn ? (
            <>
              <Link to={dashboardPath} className="btn-ghost text-sm py-2 px-3">
                <LayoutDashboard size={16} />
                {t.nav_dashboard}
              </Link>
              <button onClick={handleLogout} className="btn-ghost text-sm py-2 px-3 text-danger">
                <LogOut size={16} />
                {t.nav_logout}
              </button>
            </>
          ) : (
            <Link to="/auth" className="btn-primary text-sm py-2.5 px-4">
              {t.nav_login}
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="md:hidden btn-ghost p-2"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-border px-4 py-3 flex flex-col gap-1">
          <MobileLink to="/browse" onClick={() => setMobileOpen(false)}>{t.nav_browse}</MobileLink>
          <MobileLink to="/impact" onClick={() => setMobileOpen(false)}>{t.nav_impact}</MobileLink>
          <MobileLink to="/sponsor" onClick={() => setMobileOpen(false)}>{t.nav_sponsor}</MobileLink>
          {isLoggedIn ? (
            <>
              <MobileLink to={dashboardPath} onClick={() => setMobileOpen(false)}>Dashboard</MobileLink>
              <button
                onClick={() => { handleLogout(); setMobileOpen(false); }}
                className="text-left py-3 text-danger font-medium"
              >
                {t.nav_logout}
              </button>
            </>
          ) : (
            <Link to="/auth" onClick={() => setMobileOpen(false)} className="btn-primary mt-2">
              {t.nav_login}
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}

function NavLink({ to, children }) {
  return (
    <Link to={to} className="px-3 py-2 rounded-lg text-sm font-medium text-muted hover:text-ink hover:bg-bg transition-colors">
      {children}
    </Link>
  );
}

function MobileLink({ to, children, onClick }) {
  return (
    <Link to={to} onClick={onClick} className="py-3 font-medium text-ink border-b border-border last:border-0">
      {children}
    </Link>
  );
}
