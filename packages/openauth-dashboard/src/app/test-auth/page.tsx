'use client';

import { useEffect, useState } from 'react';

export default function TestAuthPage() {
  const [config, setConfig] = useState<any>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [orgName, setOrgName] = useState(''); // 📦 State for the dynamic organization field
  const [responseLog, setResponseLog] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 1. Fetch the live database engine settings on load
  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => setConfig(data))
      .catch((err) => console.error('Failed to load live configurations:', err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResponseLog(null);

    const endpoint = isSignUp ? '/api/auth/signup' : '/api/auth/signin';
    
    // 2. Dynamically build the payload based on configuration parameters
    const payload: any = { email, password };
    if (isSignUp) {
      payload.name = name;
      // Inject organization tracking value only if multi-tenancy is active
      if (config?.settings?.organizations?.enabled) {
        payload.orgName = orgName;
      }
    }

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
        cookiesPresent: document.cookie.includes('openauth.session') ? "✅ openauth.session set securely" : "❌ No cookie found"
      });
    } catch (err: any) {
      setResponseLog({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!config) {
    return <div className="p-8 text-zinc-500 font-mono text-center">Synchronizing component environment variables...</div>;
  }

  // Safely evaluate multi-tenancy configuration bounds
  const isOrgEnabled = !!config?.settings?.organizations?.enabled;

  return (
    <div className="p-8 max-w-4xl mx-auto font-sans grid grid-cols-1 md:grid-cols-2 gap-8 pt-16">
      
      {/* LEFT PANEL: THE DYNAMIC FORM */}
      <div className="bg-zinc-50 dark:bg-zinc-900 p-8 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
        <div>
          <div className="flex justify-between items-start">
            <h2 className="text-xl font-bold tracking-tight">{isSignUp ? 'Create Test Account' : 'Welcome Back'}</h2>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${isOrgEnabled ? 'bg-indigo-100 text-indigo-700' : 'bg-zinc-200 text-zinc-600'}`}>
              {isOrgEnabled ? 'Mode: Multi-Tenant' : 'Mode: Single-Tenant'}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">Form elements adapt dynamically to matching backend rules.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-zinc-400">Full Name</label>
              <input 
                type="text" required 
                className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded px-3 py-2 text-sm"
                value={name} onChange={(e) => setName(e.target.value)} 
              />
            </div>
          )}

          {/* 🌟 THE DYNAMIC MULTI-TENANCY FIELD: ONLY RENDERS IF ACTIVE IN MONGO */}
          {isSignUp && isOrgEnabled && (
            <div className="space-y-1 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg animate-fadeIn">
              <label className="text-xs font-semibold uppercase text-indigo-500 dark:text-indigo-400">Workspace / Organization Name</label>
              <input 
                type="text" required 
                placeholder="e.g. Acme Corp"
                className="w-full border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-zinc-800 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500"
                value={orgName} onChange={(e) => setOrgName(e.target.value)} 
              />
              <p className="text-[10px] text-zinc-400 mt-0.5">This field spawned automatically because Enterprise Multi-Tenancy is active.</p>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-zinc-400">Email Address</label>
            <input 
              type="email" required 
              className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded px-3 py-2 text-sm"
              value={email} onChange={(e) => setEmail(e.target.value)} 
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-zinc-400">Password</label>
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
        </div>
      </div>

      {/* RIGHT PANEL: LIVE ENGINE RESPONSE LOGGER */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">// Framework Response Engine Logger</h3>
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