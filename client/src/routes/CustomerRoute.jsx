import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router-dom'

function CustomerRoute() {
  const user = useSelector((state) => state.auth.user)
  return user?.role === 'admin' ? <Navigate to="/admin/dashboard" replace /> : <Outlet />
}

export default CustomerRoute
