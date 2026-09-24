import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './styles/base.css'
import './styles.css'

import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

// Public pages
import Home from './pages/Home'
import { Solutions, HowItWorks } from './pages/Static'
import Login from './pages/Login'
import VerifyEmail from './pages/VerifyEmail'
import RegistrationForm from './components/RegistrationForm'

// Buyer pages
import BuyerDashboard from './pages/BuyerDashboard'
import BuyerCreate from './pages/BuyerCreate'
import BuyerEnquiry from './pages/BuyerEnquiry'

// Vendor pages
import VendorDashboard from './pages/VendorDashboard'
import VendorEnquiry from './pages/VendorEnquiry'

// Admin pages
import AdminDashboard from './pages/AdminDashboard'
import AdminRegistrations from './pages/AdminRegistrations'
import AdminEnquiries from './pages/AdminEnquiries'

// Shared
import CRM from './pages/CRM'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ============ PUBLIC ROUTES ============ */}
          <Route path="/" element={<Home />} />
          <Route path="/solutions" element={<Solutions />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/register/buyer" element={<RegistrationForm type="buyer" />} />
          <Route path="/register/vendor" element={<RegistrationForm type="vendor" />} />

          {/* ============ BUYER ROUTES ============ */}
          <Route
            path="/buyer"
            element={
              <ProtectedRoute role="buyer">
                <BuyerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/enquiries"
            element={
              <ProtectedRoute role="buyer">
                <BuyerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/enquiries/new"
            element={
              <ProtectedRoute role="buyer">
                <BuyerCreate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/enquiries/:id"
            element={
              <ProtectedRoute role="buyer">
                <BuyerEnquiry />
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/crm"
            element={
              <ProtectedRoute role="buyer">
                <CRM role="buyer" />
              </ProtectedRoute>
            }
          />

          {/* ============ VENDOR ROUTES ============ */}
{/* ============ VENDOR ROUTES ============ */}
<Route
  path="/vendor"
  element={
    <ProtectedRoute role="vendor">
      <VendorDashboard />
    </ProtectedRoute>
  }
/>

<Route
  path="/vendor/enquiries"
  element={
    <ProtectedRoute role="vendor">
      <VendorDashboard />
    </ProtectedRoute>
  }
/>

<Route
  path="/vendor/enquiries/:id"
  element={
    <ProtectedRoute role="vendor">
      <VendorEnquiry />
    </ProtectedRoute>
  }
/>

<Route
  path="/vendor/crm"
  element={
    <ProtectedRoute role="vendor">
      <CRM role="vendor" />
    </ProtectedRoute>
  }
/>
          {/* ============ ADMIN ROUTES ============ */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/registrations"
            element={
              <ProtectedRoute role="admin">
                <AdminRegistrations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/enquiries"
            element={
              <ProtectedRoute role="admin">
                <AdminEnquiries />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}