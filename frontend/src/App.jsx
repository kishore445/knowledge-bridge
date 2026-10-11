import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";

// Public pages
import Landing from "./pages/public/Landing";
import Auth from "./pages/public/Auth";
import BrowseBooks from "./pages/public/BrowseBooks";
import ImpactDashboard from "./pages/public/ImpactDashboard";
import SponsorCheckout from "./pages/public/SponsorCheckout";

// Donor pages
import MyListings from "./pages/donor/MyListings";
import AddListing from "./pages/donor/AddListing";
import MyImpact from "./pages/donor/MyImpact";
import Certificate from "./pages/donor/Certificate";

// Kabadiwala pages
import LogPickup from "./pages/kabadiwala/LogPickup";
import MyPickups from "./pages/kabadiwala/MyPickups";
import BooksWeBy from "./pages/kabadiwala/BooksWeBy";

// School pages
import VerificationForm from "./pages/school/VerificationForm";
import OrderBooks from "./pages/school/OrderBooks";
import MyOrders from "./pages/school/MyOrders";
import ConfirmDelivery from "./pages/school/ConfirmDelivery";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import VerificationQueue from "./pages/admin/VerificationQueue";
import PickupReview from "./pages/admin/PickupReview";
import InventoryGrading from "./pages/admin/InventoryGrading";
import OrdersBoard from "./pages/admin/OrdersBoard";
import PricingSettings from "./pages/admin/PricingSettings";
import Disputes from "./pages/admin/Disputes";

// Sponsor
import SponsorDashboard from "./pages/sponsor/SponsorDashboard";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/browse" element={<BrowseBooks />} />
        <Route path="/impact" element={<ImpactDashboard />} />
        <Route path="/sponsor" element={<SponsorCheckout />} />
        <Route path="/sponsor/dashboard" element={<SponsorDashboard />} />

        {/* Donor */}
        <Route path="/donor" element={<MyListings />} />
        <Route path="/donor/add" element={<AddListing />} />
        <Route path="/donor/impact" element={<MyImpact />} />
        <Route path="/certificate/:type/:refId" element={<Certificate />} />

        {/* Kabadiwala */}
        <Route path="/kabadiwala" element={<MyPickups />} />
        <Route path="/kabadiwala/pickup" element={<LogPickup />} />
        <Route path="/kabadiwala/guide" element={<BooksWeBy />} />

        {/* School */}
        <Route path="/school" element={<MyOrders />} />
        <Route path="/school/verify" element={<VerificationForm />} />
        <Route path="/school/order" element={<OrderBooks />} />
        <Route path="/school/orders" element={<MyOrders />} />
        <Route path="/school/delivery" element={<ConfirmDelivery />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/verification" element={<VerificationQueue />} />
        <Route path="/admin/pickups" element={<PickupReview />} />
        <Route path="/admin/grading" element={<InventoryGrading />} />
        <Route path="/admin/orders" element={<OrdersBoard />} />
        <Route path="/admin/pricing" element={<PricingSettings />} />
        <Route path="/admin/disputes" element={<Disputes />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
