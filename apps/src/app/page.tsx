'use client';
import { useState, useEffect } from 'react';

export default function TestPage() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [responseLog, setResponseLog] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // File diagnostic states
  const [fileSystemMap, setFileSystemMap] = useState<{
    singleFileExists: boolean;
    folderExists: boolean;
    userModelExists: boolean;
    orgModelExists: boolean;
    membershipModelExists: boolean;
    barrelIndexExists: boolean;
  } | null>(null);

  // Helper function to scan server-side directories
  const checkFileSystemStructure = async () => {
    try {
      const res = await fetch('/api/auth/diagnose-files');
      const data = await res.json();
      setFileSystemMap(data.mapping);
    } catch (err) {
      console.error('Failed to scan workspace files:', err);
    }
  };

  // Run file check on mount
  useEffect(() => {
    checkFileSystemStructure();
  }, []);

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
      // Re-scan files after running engine transactions
      checkFileSystemStructure();
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto font-sans text-zinc-800 dark:text-zinc-200">
      <header className="mb-8 border-b pb-4 border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">openAuth Local SDK Validation Sandbox</h1>
          <p className="text-xs text-zinc-500">Test how changes inside openauth.json change runtime results.</p>
        </div>
        <button 
          onClick={checkFileSystemStructure}
          className="text-xs bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg border dark:border-zinc-700 hover:bg-zinc-200"
        >
          🔄 Refresh System Map
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* COLUMN 1: LIVE FILE SYSTEM SCANNER */}
        <div className="space-y-4 bg-zinc-50 dark:bg-zinc-900/40 p-5 rounded-xl border border-zinc-100 dark:border-zinc-800">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">// Local File System Structure Scan</h2>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between p-2 rounded bg-white dark:bg-zinc-900 shadow-sm">
              <span>📁 models/openauth/ (Folder)</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${fileSystemMap?.folderExists ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                {fileSystemMap?.folderExists ? 'ACTIVE' : 'DELETED'}
              </span>
            </div>

            <div className="pl-4 space-y-2 border-l-2 border-zinc-200 dark:border-zinc-800">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">📄 User.ts</span>
                <span className={fileSystemMap?.userModelExists ? 'text-emerald-500' : 'text-zinc-400'}>
                  {fileSystemMap?.userModelExists ? '✓ Found' : 'Missing'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">📄 Organization.ts</span>
                <span className={fileSystemMap?.orgModelExists ? 'text-emerald-500' : 'text-zinc-400'}>
                  {fileSystemMap?.orgModelExists ? '✓ Found' : 'Missing'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">📄 Membership.ts</span>
                <span className={fileSystemMap?.membershipModelExists ? 'text-emerald-500' : 'text-zinc-400'}>
                  {fileSystemMap?.membershipModelExists ? '✓ Found' : 'Missing'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">📄 index.ts (Barrel)</span>
                <span className={fileSystemMap?.barrelIndexExists ? 'text-emerald-500' : 'text-zinc-400'}>
                  {fileSystemMap?.barrelIndexExists ? '✓ Found' : 'Missing'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-white dark:bg-zinc-900 shadow-sm border border-zinc-100 dark:border-zinc-800/80">
              <span>📄 models/openauth.ts (Single File)</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${fileSystemMap?.singleFileExists ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-500/10 text-zinc-400'}`}>
                {fileSystemMap?.singleFileExists ? 'FOUND' : 'CLEANED'}
              </span>
            </div>
          </div>
        </div>

        {/* COLUMN 2: INPUT TESTING FORM */}
        <form onSubmit={handleSignupTest} className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">// Trigger Account Creation</h2>
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
            className="w-full bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 font-medium py-2 rounded text-sm hover:opacity-90 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Executing Engine Action...' : 'Run signup() Engine'}
          </button>
        </form>

        {/* COLUMN 3: RESPONSE ENGINE OUTPUT LOGGER */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">// Live Engine Response Logs</h2>
          <div className="p-4 bg-zinc-950 text-emerald-400 font-mono text-xs rounded-xl overflow-auto min-h-[250px] shadow-inner border border-zinc-900">
            {responseLog ? (
              <pre className="whitespace-pre-wrap break-all">{JSON.stringify(responseLog, null, 2)}</pre>
            ) : (
              <span className="text-zinc-600 italic">Awaiting local endpoint transaction execution triggers...</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}