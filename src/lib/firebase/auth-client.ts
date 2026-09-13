import {
  confirmPasswordReset as firebaseConfirmReset,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail as firebaseSendReset,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type UserCredential,
} from "firebase/auth";

import { getFirebaseAuth } from "@/lib/firebase/client";
import { clearSession, establishSession } from "@/lib/firebase/session";

export interface EmailAuthResult {
  idToken: string;
  uid: string;
  email: string | null;
  displayName: string | null;
  isAdmin: boolean;
}

function friendlyAuthError(error: unknown): Error {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return new Error("Invalid email or password.");
    case "auth/email-already-in-use":
      return new Error("An account with this email already exists. Try signing in.");
    case "auth/weak-password":
      return new Error("Password should be at least 8 characters.");
    case "auth/invalid-email":
      return new Error("Enter a valid email address.");
    case "auth/popup-closed-by-user":
      return new Error("Google sign-in was cancelled.");
    case "auth/account-exists-with-different-credential":
      return new Error(
        "This email is already registered with a different sign-in method.",
      );
    case "auth/network-request-failed":
      return new Error("Network error. Check your connection and try again.");
    default:
      return new Error("Authentication failed. Please try again.");
  }
}

async function toResult(cred: UserCredential): Promise<EmailAuthResult> {
  const idToken = await cred.user.getIdToken();
  const { isAdmin } = await establishSession(idToken);
  return {
    idToken,
    uid: cred.user.uid,
    email: cred.user.email,
    displayName: cred.user.displayName,
    isAdmin,
  };
}

/** Email + password sign-in, then mint the server session cookie. */
export async function signInWithEmail(
  email: string,
  password: string,
): Promise<EmailAuthResult> {
  try {
    const cred = await signInWithEmailAndPassword(
      getFirebaseAuth(),
      email,
      password,
    );
    return await toResult(cred);
  } catch (error) {
    throw friendlyAuthError(error);
  }
}

/** Email + password registration (sets display name), then session cookie. */
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
): Promise<EmailAuthResult> {
  try {
    const cred = await createUserWithEmailAndPassword(
      getFirebaseAuth(),
      email,
      password,
    );
    await updateProfile(cred.user, { displayName });
    return await toResult(cred);
  } catch (error) {
    throw friendlyAuthError(error);
  }
}

/** Google OAuth popup, then mint the server session cookie. */
export async function signInWithGoogle(): Promise<EmailAuthResult> {
  try {
    const cred = await signInWithPopup(
      getFirebaseAuth(),
      new GoogleAuthProvider(),
    );
    return await toResult(cred);
  } catch (error) {
    throw friendlyAuthError(error);
  }
}

/** Send a Firebase password-reset email (link lands on `/reset-password`). */
export async function sendResetEmail(email: string): Promise<void> {
  try {
    await firebaseSendReset(getFirebaseAuth(), email, {
      url: `${window.location.origin}/reset-password`,
    });
  } catch (error) {
    throw friendlyAuthError(error);
  }
}

/** Complete a password reset from the `oobCode` in the email link. */
export async function confirmReset(
  oobCode: string,
  newPassword: string,
): Promise<void> {
  try {
    await firebaseConfirmReset(getFirebaseAuth(), oobCode, newPassword);
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code: unknown }).code)
        : "";
    if (code === "auth/expired-action-code" || code === "auth/invalid-action-code") {
      throw new Error("This reset link is invalid or has expired.");
    }
    throw friendlyAuthError(error);
  }
}

/**
 * Full sign-out: clear the Firebase client session AND the server cookie,
 * then force a refresh so server components re-render as signed out.
 */
export async function signOutEverywhere(): Promise<void> {
  try {
    await firebaseSignOut(getFirebaseAuth());
  } catch {
    // Client may already be signed out (e.g. session-cookie-only login).
  }
  await clearSession();
}