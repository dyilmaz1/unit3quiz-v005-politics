import { useState, useEffect } from 'react'
import { useAuth } from './contexts/AuthContext'
import { Auth } from './components/Auth'
import { Dashboard } from './components/Dashboard'
import { VoterRegistration } from './components/VoterRegistration'
import './App.css'

function App() {
  const { currentUser } = useAuth()
  const [currentPage, setCurrentPage] = useState('dashboard')

  useEffect(() => {
    // Handle hash-based routing
    const handleHashChange = () => {
      const hash = window.location.hash
      if (hash === '#voter-registration') {
        setCurrentPage('voter-registration')
      } else {
        setCurrentPage('dashboard')
      }
    }

    // Check initial hash
    handleHashChange()

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  if (!currentUser) {
    return <Auth />
  }

  // Add navigation header for authenticated users
  return (
    <>
      {currentPage === 'voter-registration' ? (
        <>
          <div className="nav-header">
            <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage('dashboard'); window.location.hash = ''; }} className="back-button">
              ← Back to Dashboard
            </a>
            <span className="nav-button active">
              Voter Registration
            </span>
          </div>
          <VoterRegistration />
        </>
      ) : (
        <Dashboard />
      )}
    </>
  )
}

export default App
