'use client';
import { useState } from 'react';

export default function TestPage() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [responseLog, setResponseLog] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSignupTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResponseLog(null);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      setResponseLog(data);
    } catch (err: any) {
      setResponseLog({ error: 'Network request failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto font-sans text-zinc-800 dark:text-zinc-200">
      <header className="mb-8 border-b pb-4 border-zinc-200 dark:border-zinc-800">
        <h1 className="text-xl font-bold">openAuth Local SDK Validation Sandbox</h1>
        <p className="text-xs text-zinc-500">Test how changes inside openauth.json change runtime results.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* INPUT TESTING FORM */}
        <form onSubmit={handleSignupTest} className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">// Trigger Account Creation</h2>
          <div>
            <label className="block text-xs font-medium mb-1">Full Name</label>
            <input
              type="text"
              required
              className="w-full border dark:border-zinc-800 rounded px-3 py-2 bg-white dark:bg-zinc-900 text-sm"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Email Address</label>
            <input
              type="email"
              required
              className="w-full border dark:border-zinc-800 rounded px-3 py-2 bg-white dark:bg-zinc-900 text-sm"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full border dark:border-zinc-800 rounded px-3 py-2 bg-white dark:bg-zinc-900 text-sm"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 font-medium py-2 rounded text-sm hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Executing Engine Action...' : 'Run signup() Engine'}
          </button>
        </form>

        {/* RESPONSE ENGINE OUTPUT LOGGER */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">// Live Engine Response Logs</h2>
          <div className="p-4 bg-zinc-950 text-emerald-400 font-mono text-xs rounded-xl overflow-auto min-h-[250px] shadow-inner border border-zinc-900">
            {responseLog ? (
              <pre>{JSON.stringify(responseLog, null, 2)}</pre>
            ) : (
              <span className="text-zinc-600 italic">Awaiting local endpoint transaction execution triggers...</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}