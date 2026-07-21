import { useSelector } from 'react-redux'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
function ProtectedRoute() {
  const authenticated = useSelector((state) => state.auth.isAuthenticated)
  const location = useLocation()
  return authenticated ? <Outlet /> : <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
}
export default ProtectedRoute
