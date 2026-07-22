import AppBootstrap from './components/common/AppBootstrap.jsx'
import AppRoutes from './routes/AppRoutes.jsx'
import SeoManager from './components/common/SeoManager.jsx'

function App() {
  return <AppBootstrap><SeoManager /><AppRoutes /></AppBootstrap>
}

export default App
