import { useSelector } from 'react-redux'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import UnauthorizedPage from '../pages/admin/UnauthorizedPage.jsx'
import RouteLoading from '../components/common/RouteLoading.jsx'
function AdminRoute() { const { authChecked, isAuthenticated, user } = useSelector((state) => state.auth); const location = useLocation(); if (!authChecked) return <RouteLoading />; if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />; if (user?.role !== 'admin') return <UnauthorizedPage />; return <Outlet /> }
export default AdminRoute
