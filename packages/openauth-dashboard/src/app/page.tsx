'use client';
import { useEffect, useState } from 'react';

export default function DashboardHome() {
  const [config, setConfig] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => setConfig(data))
      .catch((err) => console.error('Failed to read config matrix:', err));
  }, []);

  // Universal updater function to handle deeply nested object paths
  const updateConfigMatrix = async (nextConfig: any) => {
    setConfig(nextConfig);
    setSaving(true);
    await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nextConfig),
    });
    setSaving(false);
  };

  const handleToggleSetting = (key: string) => {
    const nextConfig = {
      ...config,
      settings: { ...config.settings, [key]: !config.settings[key] },
    };
    updateConfigMatrix(nextConfig);
  };

  const handleTextSettingChange = (key: string, value: string) => {
    const nextConfig = {
      ...config,
      settings: { ...config.settings, [key]: value },
    };
    updateConfigMatrix(nextConfig);
  };

  const handleProviderChange = (provider: 'github' | 'google', field: string, value: any) => {
    const nextConfig = {
      ...config,
      providers: {
        ...config.providers,
        [provider]: {
          ...config.providers[provider],
          [field]: value
        }
      }
    };
    updateConfigMatrix(nextConfig);
  };

  if (!config) return <div className="p-8 text-zinc-500 font-mono text-center">Scanning local workspace matrices...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto font-sans text-zinc-900 dark:text-zinc-100 pb-24">
      <header className="border-b border-zinc-200 dark:border-zinc-800 pb-4 mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">openAuth Engine Dashboard</h1>
          <p className="text-sm text-zinc-500">Configuring parameters inside your project root file.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">Local Node Connected</span>
          {saving && <span className="text-xs bg-amber-500/10 text-amber-500 px-2 py-1 rounded animate-pulse">Saving...</span>}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: LIVE FILE MONITOR */}
        <div className="md:col-span-1">
          <div className="sticky top-8">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">// openauth.json on Disk</h2>
            <div className="p-4 bg-zinc-900 text-zinc-400 rounded-xl font-mono text-xs shadow-inner overflow-x-auto max-h-[550px]">
              <pre className="text-emerald-400">{JSON.stringify(config, null, 2)}</pre>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CONTROL PANEL */}
        <div className="md:col-span-2 space-y-6">
          
          {/* SECTION 1: SYSTEM CONTROLS */}
          <section className="bg-zinc-50 dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-lg font-semibold mb-4 border-b pb-2 border-zinc-200 dark:border-zinc-800">Core Engine Settings</h2>
            
            <div className="flex items-center justify-between py-3 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <p className="font-medium">Allow New Signups</p>
                <p className="text-xs text-zinc-500">Enables public user self-registration vectors.</p>
              </div>
              <input 
                type="checkbox" 
                className="w-4 h-4 accent-black cursor-pointer"
                checked={config.settings.allowUserSignups} 
                onChange={() => handleToggleSetting('allowUserSignups')}
              />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <p className="font-medium">Enterprise Multi-Tenancy</p>
                <p className="text-xs text-zinc-500">Isolates identity pools inside organization entities.</p>
              </div>
              <input 
                type="checkbox" 
                className="w-4 h-4 accent-black cursor-pointer"
                checked={config.settings.organizations} 
                onChange={() => handleToggleSetting('organizations')}
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">Global Token Expiry Window</p>
                <p className="text-xs text-zinc-500">Sets crypto session duration (e.g., 1d, 7d, 2h).</p>
              </div>
              <input 
                type="text" 
                className="border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded px-2 py-1 text-sm font-mono w-24 text-center"
                value={config.settings.sessionDuration} 
                onChange={(e) => handleTextSettingChange('sessionDuration', e.target.value)}
              />
            </div>
          </section>

          {/* SECTION 2: IDENTITY PROVIDERS */}
          <section className="bg-zinc-50 dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-6">
            <h2 className="text-lg font-semibold border-b pb-2 border-zinc-200 dark:border-zinc-800">OAuth Switchboard Engine</h2>

            {/* GITHUB BOX */}
            <div className="p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm tracking-wide">GitHub Provider Integration</span>
                <input 
                  type="checkbox" 
                  className="w-4 h-4 accent-black cursor-pointer"
                  checked={config.providers.github.enabled}
                  onChange={(e) => handleProviderChange('github', 'enabled', e.target.checked)}
                />
              </div>
              {config.providers.github.enabled && (
                <div className="grid grid-cols-1 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-900 font-mono text-xs">
                  <label className="text-zinc-400">Client ID</label>
                  <input 
                    type="text" 
                    placeholder="lv_cl_..."
                    className="border dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded p-1.5 w-full"
                    value={config.providers.github.clientId || ''}
                    onChange={(e) => handleProviderChange('github', 'clientId', e.target.value)}
                  />
                  <label className="text-zinc-400 mt-1">Client Secret</label>
                  <input 
                    type="password" 
                    placeholder="••••••••••••••••••••••••"
                    className="border dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded p-1.5 w-full"
                    value={config.providers.github.clientSecret || ''}
                    onChange={(e) => handleProviderChange('github', 'clientSecret', e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* GOOGLE BOX */}
            <div className="p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm tracking-wide">Google Provider Integration</span>
                <input 
                  type="checkbox" 
                  className="w-4 h-4 accent-black cursor-pointer"
                  checked={config.providers.google.enabled}
                  onChange={(e) => handleProviderChange('google', 'enabled', e.target.checked)}
                />
              </div>
              {config.providers.google.enabled && (
                <div className="grid grid-cols-1 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-900 font-mono text-xs">
                  <label className="text-zinc-400">Client ID</label>
                  <input 
                    type="text" 
                    placeholder="gl_cl_..."
                    className="border dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded p-1.5 w-full"
                    value={config.providers.google.clientId || ''}
                    onChange={(e) => handleProviderChange('google', 'clientId', e.target.value)}
                  />
                  <label className="text-zinc-400 mt-1">Client Secret</label>
                  <input 
                    type="password" 
                    placeholder="••••••••••••••••••••••••"
                    className="border dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded p-1.5 w-full"
                    value={config.providers.google.clientSecret || ''}
                    onChange={(e) => handleProviderChange('google', 'clientSecret', e.target.value)}
                  />
                </div>
              )}
            </div>

          </section>
        </div>

      </div>
    </div>
  );
}