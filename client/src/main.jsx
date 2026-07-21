import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'
import BrandProvider from './context/BrandProvider.jsx'
import { store } from './redux/store.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <BrandProvider>
        <BrowserRouter>
          <App />
          <Toaster
            position="bottom-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#3B2F36',
                color: '#FFFDFB',
                borderRadius: '999px',
                padding: '12px 18px',
                fontSize: '0.875rem',
              },
            }}
          />
        </BrowserRouter>
      </BrandProvider>
    </Provider>
  </StrictMode>,
)
