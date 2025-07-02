"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

export default function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    let result;
    if (isLogin) {
      result = await supabase.auth.signInWithPassword({ email, password });
    } else {
      result = await supabase.auth.signUp({ email, password });
    }
    if (result.error) {
      setError(result.error.message);
    } else {
      setSuccess(isLogin ? 'Login successful! Redirecting...' : 'Signup successful! Redirecting...');
      setTimeout(() => {
        router.push('/admin');
      }, 1200);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleAuth} className="space-y-4 max-w-sm mx-auto mt-10">
      <h2 className="text-xl font-bold">{isLogin ? 'Login' : 'Sign Up'}</h2>
      <input
        className="w-full border p-2 rounded"
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
      />
      <input
        className="w-full border p-2 rounded"
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
      />
      {error && <div className="text-red-500">{error}</div>}
      {success && <div className="text-green-600">{success}</div>}
      <button
        className="w-full bg-blue-600 text-white p-2 rounded"
        type="submit"
        disabled={loading}
      >
        {loading ? 'Loading...' : isLogin ? 'Login' : 'Sign Up'}
      </button>
      <button
        type="button"
        className="w-full text-blue-600 underline"
        onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}
      >
        {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Login'}
      </button>
    </form>
  );
} 