import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function LogoutButton() {
  const [loggingOut, setLoggingOut] = useState(false);
  const [loggedOut, setLoggedOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    setTimeout(() => {
      setLoggedOut(true);
      setLoggingOut(false);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }, 900);
  };

  return (
    <div className="relative inline-block">
      {!loggedOut ? (
        <button
          onClick={handleLogout}
          className={`bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg transition-all duration-500 flex items-center justify-center gap-2
            ${loggingOut ? 'opacity-0 scale-90 animate-spin-slow pointer-events-none' : 'hover:scale-105 hover:shadow-xl'}`}
          style={{ minWidth: 120 }}
          disabled={loggingOut}
        >
          <svg className={`w-5 h-5 ${loggingOut ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="text-base">Logout</span>
        </button>
      ) : (
        <div className="flex items-center justify-center px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold shadow animate-fade-in">
          <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Account logged out
        </div>
      )}
      <style jsx>{`
        @keyframes spin-slow {
          100% { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 1s linear;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.7s ease;
        }
      `}</style>
    </div>
  );
} 