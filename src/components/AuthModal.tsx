import React, { useState } from 'react';
import {
  signInWithPopup,
  auth,
  googleProvider,
  db,
  doc,
  setDoc,
} from '../lib/firebase';
import {
  X,
  User as UserIcon,
  Bot,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Sparkles,
  Cloud,
  ShieldCheck,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [displayName, setDisplayName] = useState(() => {
    return localStorage.getItem('sas_custom_user_name') || '';
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      try {
        await setDoc(
          doc(db, 'users', user.uid),
          {
            id: user.uid,
            email: user.email,
            displayName: user.displayName || displayName.trim() || 'SAS AI User',
            photoURL: user.photoURL || '',
            lastLogin: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (dbErr) {
        console.warn('Could not sync user profile to Firestore (using local session):', dbErr);
      }

      setSuccessMsg('Signed in successfully with Google!');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      const code = err.code || '';
      const rawMsg = err.message || '';
      if (code === 'auth/popup-closed-by-user') {
        setLoading(false);
        return;
      }
      let msg = 'Google sign in failed. Please try again.';
      if (code === 'auth/network-request-failed' || rawMsg.includes('network-request-failed')) {
        msg = 'Network connection failed. Please check your internet connection and try again.';
      } else if (code === 'auth/popup-blocked' || rawMsg.includes('popup-blocked')) {
        msg = 'Sign-in popup was blocked. Please allow popups or open the app directly.';
      } else if (code === 'auth/unauthorized-domain' || rawMsg.includes('unauthorized-domain')) {
        msg = 'Firebase Authentication domain not authorized.';
      } else if (rawMsg) {
        msg = rawMsg;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLocalProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Please enter a display name.');
      return;
    }
    localStorage.setItem('sas_custom_user_name', displayName.trim());
    setSuccessMsg(`Profile name updated to "${displayName.trim()}"!`);
    setTimeout(() => {
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-2xl transition-all sm:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
            <Bot className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-neutral-900 tracking-tight">
            Account & Cloud Sync
          </h3>
          <p className="mt-1 text-xs text-neutral-500">
            Sign in to sync your conversations, custom personas, and settings securely.
          </p>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50/90 p-3 text-xs text-rose-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="space-y-2 flex-1">
                <p>{error}</p>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-700 transition"
                >
                  <span>Sign in with Google</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Google Quick Login Primary Action */}
        <div className="mb-5">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-blue-300 bg-blue-50/60 py-3.5 px-4 text-xs font-bold text-blue-900 shadow-sm transition hover:bg-blue-100 hover:border-blue-400 active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            ) : (
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            )}
            <span>Continue with Google (1-Click Sign In)</span>
          </button>

          <div className="mt-2.5 flex items-center justify-center gap-2 text-[11px] text-neutral-500">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Secure Firebase Cloud Authentication</span>
          </div>
        </div>

        {/* Divider */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="w-full border-t border-neutral-200" />
          <span className="absolute bg-white px-3 text-[11px] font-medium text-neutral-400">
            or set local display name
          </span>
        </div>

        {/* Local Profile Form */}
        <form onSubmit={handleSaveLocalProfile} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-neutral-700">
              Your Name / Nickname
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Sasnula Dilum"
                className="w-full rounded-xl border border-neutral-300 py-2 pl-9 pr-3 text-xs text-neutral-900 placeholder-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15"
              />
            </div>
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 py-2.5 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-neutral-800 active:scale-[0.98]"
          >
            <Sparkles className="h-3.5 w-3.5 text-blue-300" />
            <span>Save Display Name</span>
          </button>
        </form>

        {/* Footer */}
        <div className="mt-5 text-center text-xs text-neutral-500 border-t border-neutral-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] text-neutral-400 hover:text-neutral-700 transition underline underline-offset-2"
          >
            Continue as Guest (Local Storage Mode)
          </button>
        </div>
      </div>
    </div>
  );
};
