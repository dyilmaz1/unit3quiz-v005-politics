import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { db } from '../firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import './VoterRegistration.css'

export function VoterRegistration() {
  const { currentUser } = useAuth()
  const [decision, setDecision] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (currentUser) {
      loadUserDecision()
    }
  }, [currentUser])

  const loadUserDecision = async () => {
    try {
      setLoading(true)
      const userDocRef = doc(db, 'voterRegistrations', currentUser.uid)
      const userDoc = await getDoc(userDocRef)
      
      if (userDoc.exists()) {
        const data = userDoc.data()
        setDecision(data.decision)
        setMessage(data.decision === 'support' 
          ? 'You have previously indicated your support for this initiative.' 
          : 'You have previously indicated that you do not support this initiative.')
      } else {
        setDecision(null)
        setMessage('')
      }
    } catch (error) {
      console.error('Error loading decision:', error)
      setMessage('Error loading your previous decision. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDecision = async (selectedDecision) => {
    if (!currentUser) return

    try {
      setSaving(true)
      setMessage('')
      
      const userDocRef = doc(db, 'voterRegistrations', currentUser.uid)
      await setDoc(userDocRef, {
        decision: selectedDecision,
        email: currentUser.email,
        timestamp: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true })

      setDecision(selectedDecision)
      setMessage(selectedDecision === 'support' 
        ? 'Thank you for your support! Your decision has been saved.' 
        : 'Your decision has been recorded. Thank you for your feedback.')
    } catch (error) {
      console.error('Error saving decision:', error)
      setMessage('Error saving your decision. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!currentUser) {
    return (
      <div className="voter-registration-container">
        <div className="voter-registration-card">
          <h2>Access Restricted</h2>
          <p>You must be signed in to access the voter registration form.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="voter-registration-container">
      <div className="voter-registration-card">
        <h2>Voter Registration & Initiative Support</h2>
        
        <div className="statement-section">
          <h3>Statement of Interest</h3>
          <div className="statement-box">
            <p className="statement-text">
              I am trying to devote tax dollars to discovering unicorns.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="loading-message">
            <p>Loading your previous decision...</p>
          </div>
        ) : (
          <>
            {decision && (
              <div className={`decision-badge ${decision === 'support' ? 'support' : 'no-support'}`}>
                <span className="badge-icon">
                  {decision === 'support' ? '✓' : '✗'}
                </span>
                <span className="badge-text">
                  Your Decision: <strong>{decision === 'support' ? 'Support' : 'Do Not Support'}</strong>
                </span>
              </div>
            )}

            {message && (
              <div className={`status-message ${decision ? 'info' : ''}`}>
                {message}
              </div>
            )}

            <div className="decision-buttons">
              <button
                type="button"
                className={`decision-button support-button ${decision === 'support' ? 'selected' : ''}`}
                onClick={() => handleDecision('support')}
                disabled={saving}
              >
                <span className="button-icon">✓</span>
                <span>Support</span>
              </button>
              
              <button
                type="button"
                className={`decision-button no-support-button ${decision === 'no-support' ? 'selected' : ''}`}
                onClick={() => handleDecision('no-support')}
                disabled={saving}
              >
                <span className="button-icon">✗</span>
                <span>Do Not Support</span>
              </button>
            </div>

            {saving && (
              <div className="saving-indicator">
                <p>Saving your decision...</p>
              </div>
            )}
          </>
        )}

        <div className="info-section">
          <p className="info-text">
            Your decision will be saved and displayed when you return to this page. 
            You can change your decision at any time.
          </p>
        </div>
      </div>
    </div>
  )
}

