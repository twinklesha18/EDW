import { useSelector } from 'react-redux'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import UnauthorizedPage from '../pages/admin/UnauthorizedPage.jsx'
function AdminRoute() { const { isAuthenticated, user } = useSelector((state) => state.auth); const location = useLocation(); if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />; if (user?.role !== 'admin') return <UnauthorizedPage />; return <Outlet /> }
export default AdminRoute
