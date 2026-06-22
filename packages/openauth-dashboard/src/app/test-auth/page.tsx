'use client';

import { useState } from 'react';

export default function TestAuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [responseLog, setResponseLog] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResponseLog(null);

    const endpoint = isSignUp ? '/api/auth/signup' : '/api/auth/signin';
    const payload = isSignUp ? { email, password, name } : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setResponseLog({
        status: res.status,
        statusText: res.statusText,
        body: data,
        cookiesPresent: document.cookie.includes('openauth.session') ? "✅ openauth.session exists in browser storage" : "❌ No cookie found"
      });
    } catch (err: any) {
      setResponseLog({ error: err.message || "Failed to parse form request payload dispatch execution." });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      const data = await res.json();
      setResponseLog({
        status: res.status,
        body: data,
        cookiesPresent: document.cookie.includes('openauth.session') ? "⚠️ Cookie still present" : "🧹 Cookie successfully destroyed"
      });
    } catch (err: any) {
      setResponseLog({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto font-sans grid grid-cols-1 md:grid-cols-2 gap-8 pt-16">
      
      {/* LEFT PANEL: THE INTERACTIVE AUTH FORM */}
      <div className="bg-zinc-50 dark:bg-zinc-900 p-8 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">{isSignUp ? 'Create Test Account' : 'Welcome Back'}</h2>
          <p className="text-xs text-zinc-500 mt-1">Testing local framework runtime core mechanics directly.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Full Name</label>
              <input 
                type="text" required 
                className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded px-3 py-2 text-sm"
                value={name} onChange={(e) => setName(e.target.value)} 
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Email Address</label>
            <input 
              type="email" required 
              className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded px-3 py-2 text-sm"
              value={email} onChange={(e) => setEmail(e.target.value)} 
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Password</label>
            <input 
              type="password" required 
              className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded px-3 py-2 text-sm"
              value={password} onChange={(e) => setPassword(e.target.value)} 
            />
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 rounded py-2 text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Processing HTTP Loop...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="flex justify-between items-center pt-2 border-t text-xs">
          <button 
            type="button" className="text-zinc-500 hover:underline"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
          
          <button 
            type="button" onClick={handleLogout} className="text-rose-500 hover:underline font-medium"
          >
            Trigger Logout Clear Action
          </button>
        </div>
      </div>

      {/* RIGHT PANEL: LIVE NETWORK RESPONSES & BROWSER COOKIE LOGS */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">// Framework Core Response Logger</h3>
        <div className="p-4 bg-zinc-950 text-emerald-400 rounded-xl font-mono text-xs shadow-inner h-[380px] overflow-auto border border-zinc-800">
          {responseLog ? (
            <pre>{JSON.stringify(responseLog, null, 2)}</pre>
          ) : (
            <div className="text-zinc-600 italic h-full flex items-center justify-center">
              Awaiting payload submission dispatch loops...
            </div>
          )}
        </div>
      </div>

    </div>
  );
}