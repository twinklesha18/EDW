import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import LoadingSkeleton from '../components/common/LoadingSkeleton.jsx'
import MainLayout from '../layouts/MainLayout.jsx'
import AuthLayout from '../layouts/AuthLayout.jsx'
import ProfileLayout from '../layouts/ProfileLayout.jsx'
import GuestRoute from './GuestRoute.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'
import AdminRoute from './AdminRoute.jsx'
import AdminLayout from '../layouts/AdminLayout.jsx'
import CustomerRoute from './CustomerRoute.jsx'

const HomePage = lazy(() => import('../pages/HomePage.jsx'))
const ShopPage = lazy(() => import('../pages/ShopPage.jsx'))
const CategoriesPage = lazy(() => import('../pages/CategoriesPage.jsx'))
const ProductDetailsPage = lazy(() => import('../pages/ProductDetailsPage.jsx'))
const CustomOrdersPage = lazy(() => import('../pages/CustomOrdersPage.jsx'))
const AboutPage = lazy(() => import('../pages/AboutPage.jsx'))
const ContactPage = lazy(() => import('../pages/ContactPage.jsx'))
const PolicyPage = lazy(() => import('../pages/PolicyPage.jsx'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage.jsx'))
const LoginPage = lazy(() => import('../pages/LoginPage.jsx'))
const RegisterPage = lazy(() => import('../pages/RegisterPage.jsx'))
const ForgotPasswordPage = lazy(() => import('../pages/ForgotPasswordPage.jsx'))
const ResetPasswordPage = lazy(() => import('../pages/ResetPasswordPage.jsx'))
const ProfileDashboardPage = lazy(() => import('../pages/ProfileDashboardPage.jsx'))
const ProfileOrdersPage = lazy(() => import('../pages/ProfileOrdersPage.jsx'))
const ProfileCustomOrdersPage = lazy(() => import('../pages/ProfileCustomOrdersPage.jsx'))
const ProfileAddressesPage = lazy(() => import('../pages/ProfileAddressesPage.jsx'))
const ProfileSettingsPage = lazy(() => import('../pages/ProfileSettingsPage.jsx'))
const WishlistPage = lazy(() => import('../pages/WishlistPage.jsx'))
const CartPage = lazy(() => import('../pages/CartPage.jsx'))
const CheckoutPage = lazy(() => import('../pages/CheckoutPage.jsx'))
const OrderSuccessPage = lazy(() => import('../pages/OrderSuccessPage.jsx'))
const OrderFailedPage = lazy(() => import('../pages/OrderFailedPage.jsx'))
const OrderDetailsPage = lazy(() => import('../pages/OrderDetailsPage.jsx'))
const TrackOrderPage = lazy(() => import('../pages/TrackOrderPage.jsx'))
const AdminDashboardPage = lazy(() => import('../pages/admin/AdminDashboardPage.jsx'))
const AdminProductsPage = lazy(() => import('../pages/admin/AdminProductsPage.jsx'))
const AdminProductFormPage = lazy(() => import('../pages/admin/AdminProductFormPage.jsx'))
const AdminCategoriesPage = lazy(() => import('../pages/admin/AdminCategoriesPage.jsx'))
const AdminOrdersPage = lazy(() => import('../pages/admin/AdminOrdersPage.jsx'))
const AdminOrderDetailsPage = lazy(() => import('../pages/admin/AdminOrderDetailsPage.jsx'))
const AdminUsersPage = lazy(() => import('../pages/admin/AdminUsersPage.jsx'))
const AdminReviewsPage = lazy(() => import('../pages/admin/AdminReviewsPage.jsx'))
const AdminCouponsPage = lazy(() => import('../pages/admin/AdminCouponsPage.jsx'))
const AdminBannersPage = lazy(() => import('../pages/admin/AdminBannersPage.jsx'))
const AdminSettingsPage = lazy(() => import('../pages/admin/AdminSettingsPage.jsx'))
const AdminCustomOrdersPage = lazy(() => import('../pages/admin/AdminCustomOrdersPage.jsx'))
const AdminCustomOrderDetailsPage = lazy(() => import('../pages/admin/AdminCustomOrderDetailsPage.jsx'))

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="shop" element={<ShopPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="product/:slug" element={<ProductDetailsPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="faq" element={<PolicyPage policyKey="faq" />} />
          <Route path="shipping" element={<PolicyPage policyKey="shipping" />} />
          <Route path="returns" element={<PolicyPage policyKey="returns" />} />
          <Route path="privacy" element={<PolicyPage policyKey="privacy" />} />
          <Route path="terms" element={<PolicyPage policyKey="terms" />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="track-order" element={<TrackOrderPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="wishlist" element={<WishlistPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="order-success" element={<OrderSuccessPage />} />
            <Route path="order-failed" element={<OrderFailedPage />} />
            <Route path="orders/:orderNumber" element={<OrderDetailsPage />} />
            <Route path="order/:orderNumber" element={<OrderDetailsPage />} />
            <Route element={<CustomerRoute />}>
              <Route path="custom-orders" element={<CustomOrdersPage />} />
              <Route path="profile" element={<ProfileLayout />}>
                <Route index element={<ProfileDashboardPage />} />
                <Route path="orders" element={<ProfileOrdersPage />} />
                <Route path="custom-orders" element={<ProfileCustomOrdersPage />} />
                <Route path="addresses" element={<ProfileAddressesPage />} />
                <Route path="settings" element={<ProfileSettingsPage />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route element={<GuestRoute />}><Route element={<AuthLayout />}><Route path="login" element={<LoginPage />} /><Route path="register" element={<RegisterPage />} /><Route path="forgot-password" element={<ForgotPasswordPage />} /></Route></Route>
        <Route element={<AuthLayout />}><Route path="reset-password/:token" element={<ResetPasswordPage />} /></Route>
        <Route element={<AdminRoute />}><Route path="admin" element={<AdminLayout />}><Route index element={<Navigate to="dashboard" replace />} /><Route path="dashboard" element={<AdminDashboardPage />} /><Route path="products" element={<AdminProductsPage />} /><Route path="products/new" element={<AdminProductFormPage />} /><Route path="products/:id/edit" element={<AdminProductFormPage />} /><Route path="categories" element={<AdminCategoriesPage />} /><Route path="orders" element={<AdminOrdersPage />} /><Route path="orders/:id" element={<AdminOrderDetailsPage />} /><Route path="custom-orders" element={<AdminCustomOrdersPage />} /><Route path="custom-orders/:id" element={<AdminCustomOrderDetailsPage />} /><Route path="users" element={<AdminUsersPage />} /><Route path="reviews" element={<AdminReviewsPage />} /><Route path="coupons" element={<AdminCouponsPage />} /><Route path="banners" element={<AdminBannersPage />} /><Route path="settings" element={<AdminSettingsPage />} /></Route></Route>
      </Routes>
    </Suspense>
  )
}

export default AppRoutes
