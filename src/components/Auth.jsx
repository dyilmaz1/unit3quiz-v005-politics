import { useState } from 'react'
import { SignIn } from './SignIn'
import { SignUp } from './SignUp'
import './Auth.css'

export function Auth() {
  const [isSignUp, setIsSignUp] = useState(false)

  return (
    <div className="auth-wrapper">
      <div className="auth-tabs">
        <button
          type="button"
          className={`auth-tab ${!isSignUp ? 'active' : ''}`}
          onClick={() => setIsSignUp(false)}
        >
          Sign In
        </button>
        <button
          type="button"
          className={`auth-tab ${isSignUp ? 'active' : ''}`}
          onClick={() => setIsSignUp(true)}
        >
          Sign Up
        </button>
      </div>
      {isSignUp ? <SignUp /> : <SignIn />}
      <div className="auth-switch">
        <p>
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <button 
            type="button"
            className="auth-link-button"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  )
}

