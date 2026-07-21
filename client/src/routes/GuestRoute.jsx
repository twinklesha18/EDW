import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router-dom'
function GuestRoute() { return useSelector((state) => state.auth.isAuthenticated) ? <Navigate to="/profile" replace /> : <Outlet /> }
export default GuestRoute
