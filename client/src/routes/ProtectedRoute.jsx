import { useSelector } from 'react-redux'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import RouteLoading from '../components/common/RouteLoading.jsx'
function ProtectedRoute() {
  const { authChecked, isAuthenticated } = useSelector((state) => state.auth)
  const location = useLocation()
  if (!authChecked) return <RouteLoading />
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
}
export default ProtectedRoute
