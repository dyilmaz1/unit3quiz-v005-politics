import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Your web app's Firebase configuration
// 
// SETUP INSTRUCTIONS:
// 1. Go to Firebase Console: https://console.firebase.google.com/
// 2. Select your project (or create a new one)
// 3. Go to Project Settings (gear icon) > General tab
// 4. Scroll down to "Your apps" section
// 5. Click on the web app icon (</>) or "Add app" if you haven't created one
// 6. Copy the config values below
// 
// OPTION 1: Use environment variables (recommended for production)
// Create a .env file in the root directory with:
//   VITE_FIREBASE_API_KEY=your-api-key
//   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
//   VITE_FIREBASE_PROJECT_ID=your-project-id
//   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
//   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
//   VITE_FIREBASE_APP_ID=your-app-id
//
// OPTION 2: Replace the values directly below (not recommended for production)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBlAWkcRqz4CTKheFMDOdCqPDuMrYn00AM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "unit3quiz-v005-politics.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "unit3quiz-v005-politics",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "unit3quiz-v005-politics.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "611039570596",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:611039570596:web:160642d84b49da6ba61431"
}

// IMPORTANT: Also enable Email/Password authentication in Firebase Console:
// 1. Go to Authentication > Sign-in method
// 2. Click on "Email/Password"
// 3. Enable it and click "Save"

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app)

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app)

export default app

