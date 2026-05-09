import admin from 'firebase-admin';

// Initialize Firebase Admin with Application Default Credentials
// For production, you should provide a service account JSON.
// For local development, if you don't have a service account yet,
// we can initialize it without credentials to allow parsing tokens,
// but actually verifying tokens requires a valid project.
// We'll require the user to set FIREBASE_PROJECT_ID or GOOGLE_APPLICATION_CREDENTIALS.

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'advisor-570b7'
    });
  } catch (err) {
    console.error('Firebase Admin initialization error:', err);
  }
}

export default admin;
