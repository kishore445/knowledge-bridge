import axios from "axios";

const BASE = import.meta.env.VITE_API_BASE_URL || "/api";

const api = axios.create({
  baseURL: BASE,
  timeout: 15000,
});

// Attach JWT from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("kb_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("kb_token");
      localStorage.removeItem("kb_user");
      window.location.href = "/auth";
    }
    return Promise.reject(err);
  }
);

export default api;

// --- Auth ---
export const requestOtp = (data) => api.post("/api/auth/otp/request", data);
export const verifyOtp = (data) => api.post("/api/auth/otp/verify", data);
export const getMe = () => api.get("/api/auth/me");

// --- Schools ---
export const registerSchool = (data) => api.post("/api/schools/register", data);
export const getMySchool = () => api.get("/api/schools/me");
export const listSchools = (params) => api.get("/api/schools", { params });

// --- Kabadiwalas ---
export const createKbProfile = (params) => api.post("/api/kabadiwalas/profile", null, { params });
export const getMyKbProfile = () => api.get("/api/kabadiwalas/me");
export const logPickup = (data) => api.post("/api/kabadiwalas/pickups", data);
export const getMyPickups = () => api.get("/api/kabadiwalas/pickups");
export const getPickupUploadUrl = (pickupId) => api.get("/api/kabadiwalas/pickups/upload-url", { params: { pickup_id: pickupId } });

// --- Inventory ---
export const listInventory = (params) => api.get("/api/inventory", { params });
export const gradeBook = (pickupId, grade) => api.post("/api/inventory/grade", grade, { params: { pickup_id: pickupId } });

// --- Donors ---
export const createDonorListing = (data) => api.post("/api/donors/listings", data);
export const getMyDonorListings = () => api.get("/api/donors/listings");
export const getDonorImpact = () => api.get("/api/donors/impact");
export const getDonorUploadUrl = (listingId) => api.get("/api/donors/listings/upload-url", { params: { listing_id: listingId } });

// --- Resale ---
export const browseListings = (params) => api.get("/api/resale/listings", { params });
export const getListing = (id) => api.get(`/api/resale/listings/${id}`);

// --- Orders ---
export const getDeliveryQuote = (params) => api.post("/api/orders/quote", null, { params });
export const createOrder = (data) => api.post("/api/orders", data);
export const confirmPayment = (orderId, data) => api.post(`/api/orders/${orderId}/confirm-payment`, null, { params: data });
export const getMyOrders = () => api.get("/api/orders/my");
export const getOrder = (id) => api.get(`/api/orders/${id}`);

// --- Sponsorships ---
export const createSponsorship = (data, orderId) => api.post("/api/sponsorships", data, { params: { order_id: orderId } });
export const confirmSponsorPayment = (spId, data) => api.post(`/api/sponsorships/${spId}/confirm-payment`, null, { params: data });
export const getMySponsorships = () => api.get("/api/sponsorships/my");
export const getPublicSponsorships = (params) => api.get("/api/sponsorships/public", { params });

// --- Deliveries ---
export const confirmDelivery = (data) => api.post("/api/deliveries", data);
export const schoolConfirmDelivery = (id) => api.post(`/api/deliveries/${id}/school-confirm`);
export const getDeliveryUploadUrl = (orderId) => api.get("/api/deliveries/upload-url", { params: { order_id: orderId } });

// --- Impact ---
export const getImpactStats = () => api.get("/api/impact/stats");
export const getImpactFeed = (params) => api.get("/api/impact/feed", { params });
export const getDistricts = () => api.get("/api/impact/districts");

// --- Admin ---
export const getVerificationQueue = () => api.get("/api/admin/verification-queue");
export const getPickupQueue = () => api.get("/api/admin/pickup-queue");
export const getOrdersBoard = () => api.get("/api/admin/orders-board");
export const getInventoryToGrade = () => api.get("/api/admin/inventory-to-grade");
export const getPricing = () => api.get("/api/admin/pricing");
export const updatePricing = (data) => api.put("/api/admin/pricing", data);
export const verifySchool = (id) => api.post(`/api/schools/${id}/verify`);
export const rejectSchool = (id, reason) => api.post(`/api/schools/${id}/reject`, null, { params: { reason } });
export const acceptPickup = (id, params) => api.post(`/api/kabadiwalas/pickups/${id}/accept`, null, { params });
export const rejectPickup = (id, reason) => api.post(`/api/kabadiwalas/pickups/${id}/reject`, null, { params: { reason } });

// --- Certificates ---
export const getCertificate = (type, refId) => api.get(`/api/certificates/${type}/${refId}`);
