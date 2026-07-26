import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router-dom'
import RouteLoading from '../components/common/RouteLoading.jsx'
function GuestRoute() { const { authChecked, isAuthenticated } = useSelector((state) => state.auth); if (!authChecked) return <RouteLoading />; return isAuthenticated ? <Navigate to="/profile" replace /> : <Outlet /> }
export default GuestRoute
