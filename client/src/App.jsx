import AppBootstrap from './components/common/AppBootstrap.jsx'
import AppRoutes from './routes/AppRoutes.jsx'
import SeoManager from './components/common/SeoManager.jsx'
import VisitorTracker from './components/common/VisitorTracker.jsx'

function App() {
  return <AppBootstrap><SeoManager /><VisitorTracker /><AppRoutes /></AppBootstrap>
}

export default App
