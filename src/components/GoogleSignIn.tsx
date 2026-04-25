import React from 'react';
import { LogIn, RefreshCcw } from 'lucide-react';
import { getAccessToken } from '../services/googleSheetsService';

interface GoogleSignInProps {
  onSuccess: (token: string) => void;
  isLoading?: boolean;
  clientIdOverride?: string;
}

export const GoogleSignIn: React.FC<GoogleSignInProps> = ({ onSuccess, isLoading, clientIdOverride }) => {
  const handleSignIn = async () => {
    const envClientId = typeof import.meta.env !== 'undefined' ? import.meta.env.VITE_GOOGLE_CLIENT_ID : undefined;
    const clientId = clientIdOverride || envClientId;

    if (!clientId) {
      alert('Google Client ID is not configured. Please go to Settings to add it.');
      return;
    }

    try {
      const token = await getAccessToken(clientId);
      onSuccess(token);
    } catch (error) {
      console.error('Sign-in failed:', error);
      alert('Failed to sign in with Google. Please try again.');
    }
  };

  return (
    <button
      onClick={handleSignIn}
      disabled={isLoading}
      className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-white text-slate-700 hover:bg-slate-50 rounded-xl transition-all border border-slate-200 shadow-sm disabled:opacity-50"
    >
      {isLoading ? <RefreshCcw size={16} className="animate-spin" /> : <LogIn size={16} />}
      {isLoading ? 'Fetching Templates...' : 'Sync with Google Sheets'}
    </button>
  );
};
