'use client';

import { useEffect, useState } from 'react';

export default function DashboardHome() {
  const [config, setConfig] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [systemMessage, setSystemMessage] = useState<string | null>(null);

  // 1. Fetch live layout configurations on component mount
  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => setConfig(data))
      .catch((err) => {
        console.error('Failed to read config matrix:', err);
        setConfig({ error: 'Failed to establish continuous handshake connection with API router configuration layer.' });
      });
  }, []);

  // 2. Centralized updater to save configuration state parameters to MongoDB
  const updateConfigMatrix = async (nextConfig: any, optionalAlert?: string) => {
    setConfig(nextConfig);
    setSaving(true);
    setSystemMessage(null);
    
    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextConfig),
      });

      if (response.ok && optionalAlert) {
        setSystemMessage(optionalAlert);
        setTimeout(() => setSystemMessage(null), 4000);
      }
    } catch (err) {
      console.error('Failed to synchronize config update matrix:', err);
    } finally {
      setSaving(false);
    }
  };

  // 3. Simple toggle handler for core scalar settings parameters
  const handleToggleSetting = (key: string) => {
    const nextConfig = {
      ...config,
      settings: { 
        ...(config?.settings || {}), 
        [key]: !(config?.settings?.[key]) 
      },
    };
    updateConfigMatrix(nextConfig);
  };

  // 4. Multi-Tenancy Toggle Handler — Flags schema modifications on backend database collections
  const handleToggleOrgEnabled = () => {
    const currentOrgState = typeof config?.settings?.organizations === 'object' 
      ? config.settings.organizations 
      : { enabled: false, allowUserCreate: false, autoCreateOnSignup: false, defaultMaxMembers: 5 };

    const targetStateWillBeEnabled = !currentOrgState.enabled;

    const nextConfig = {
      ...config,
      settings: {
        ...(config?.settings || {}),
        organizations: {
          ...currentOrgState,
          enabled: targetStateWillBeEnabled
        }
      }
    };

    const alertNotice = targetStateWillBeEnabled
      ? "📦 Multi-Tenancy Active: Database isolated schemas applied."
      : "🧹 Single-Tenant Active: Cleared multi-tenancy collections.";

    updateConfigMatrix(nextConfig, alertNotice);
  };

  // 5. Handles global configuration parameter updates (session strings)
  const handleTextSettingChange = (key: string, value: string) => {
    const nextConfig = {
      ...config,
      settings: { ...(config?.settings || {}), [key]: value },
    };
    updateConfigMatrix(nextConfig);
  };

  // 6. Handles activation toggles for external provider parameters securely without writing text keys
  const handleProviderToggleChange = (provider: 'github' | 'google', isChecked: boolean) => {
    const currentProviders = config?.providers || {};
    const nextConfig = {
      ...config,
      providers: {
        ...currentProviders,
        [provider]: {
          enabled: isChecked
        }
      }
    };
    updateConfigMatrix(nextConfig);
  };

  // Awaiting state initialization framework
  if (!config) {
    return <div className="p-8 text-zinc-500 font-mono text-center">Scanning live remote database instances...</div>;
  }

  // Graceful failure layout trap protecting downstream component lookups from throwing property exceptions
  if (config.error) {
    return (
      <div className="p-8 max-w-2xl mx-auto font-mono text-center space-y-4 pt-24">
        <div className="p-6 border border-rose-200/40 bg-rose-500/10 text-rose-500 rounded-xl shadow-sm">
          <h2 className="font-bold text-base mb-1">⚠️ Connection Failure</h2>
          <p className="text-xs text-rose-400/90 leading-relaxed">{config.error}</p>
        </div>
        <p className="text-zinc-500 text-xs">Verify your terminal environmental setup parameters or backend connection configurations.</p>
      </div>
    );
  }

  // Safely evaluate organization state, guarding against missing objects
  const isOrgEnabled = typeof config?.settings?.organizations === 'object'
    ? !!config.settings.organizations.enabled
    : !!config?.settings?.organizations;

  return (
    <div className="p-8 max-w-4xl mx-auto font-sans text-zinc-900 dark:text-zinc-100 pb-24">
      <header className="border-b border-zinc-200 dark:border-zinc-800 pb-4 mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">openAuth Engine Dashboard</h1>
          <p className="text-sm text-zinc-500">Configuring parameter engines dynamically stored within MongoDB variables.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">Remote DB Synchronized</span>
          {saving && <span className="text-xs bg-amber-500/10 text-amber-500 px-2 py-1 rounded animate-pulse">Saving Changes...</span>}
        </div>
      </header>

      {/* SYSTEM OPERATIONS BANNER */}
      {systemMessage && (
        <div className="mb-6 p-3 bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-mono rounded-lg border shadow-sm flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
          {systemMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: LIVE DATABASE DOCUMENT STATE INSPECTOR */}
        <div className="md:col-span-1">
          <div className="sticky top-8">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">// AuthSettings JSON in MongoDB</h2>
            <div className="p-4 bg-zinc-900 text-zinc-400 rounded-xl font-mono text-xs shadow-inner overflow-x-auto max-h-[550px]">
              <pre className="text-emerald-400">
                {JSON.stringify({ settings: config?.settings, providers: config?.providers }, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CONTROL ACTION PANEL */}
        <div className="md:col-span-2 space-y-6">
          
          {/* CORE SYSTEM CONFIGURATION PARAMETERS */}
          <section className="bg-zinc-50 dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-lg font-semibold mb-4 border-b pb-2 border-zinc-200 dark:border-zinc-800">Core Engine Settings</h2>
            
            <div className="flex items-center justify-between py-3 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <p className="font-medium">Allow New Signups</p>
                <p className="text-xs text-zinc-500">Enables public user registration interfaces.</p>
              </div>
              <input 
                type="checkbox" 
                className="w-4 h-4 accent-black cursor-pointer"
                checked={!!config?.settings?.allowUserSignups} 
                onChange={() => handleToggleSetting('allowUserSignups')}
              />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <p className="font-medium">Enterprise Multi-Tenancy</p>
                <p className="text-xs text-zinc-500">Isolates single identity tracks inside workspace bounds.</p>
              </div>
              <input 
                type="checkbox" 
                className="w-4 h-4 accent-black cursor-pointer"
                checked={isOrgEnabled} 
                onChange={handleToggleOrgEnabled} 
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">Global Token Expiry Window</p>
                <p className="text-xs text-zinc-500">Sets crypto session duration lengths (e.g., 1d, 7d, 2h).</p>
              </div>
              <input 
                type="text" 
                className="border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded px-2 py-1 text-sm font-mono w-24 text-center"
                value={config?.settings?.sessionDuration || ''} 
                onChange={(e) => handleTextSettingChange('sessionDuration', e.target.value)}
              />
            </div>
          </section>

          {/* OAUTH INTEGRATION CONTROL SWITCHES */}
          <section className="bg-zinc-50 dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-6">
            <h2 className="text-lg font-semibold border-b pb-2 border-zinc-200 dark:border-zinc-800">OAuth Switchboard Engine</h2>

            {/* GITHUB VECTOR BLOCK */}
            <div className="p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg flex justify-between items-center">
              <div className="space-y-1">
                <span className="font-bold text-sm tracking-wide block">GitHub Provider Integration</span>
                <div>
                  {config?.envStatus?.githubKeysPresent ? (
                    <span className="inline-flex items-center text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                      🟢 Env Variable Detected
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-[11px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 px-2 py-0.5 rounded-full">
                      ⚠️ Missing Environment Keys
                    </span>
                  )}
                </div>
              </div>
              <input 
                type="checkbox" 
                className="w-4 h-4 accent-black cursor-pointer"
                checked={!!config?.providers?.github?.enabled}
                onChange={(e) => handleProviderToggleChange('github', e.target.checked)}
              />
            </div>

            {/* GOOGLE VECTOR BLOCK */}
            <div className="p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg flex justify-between items-center">
              <div className="space-y-1">
                <span className="font-bold text-sm tracking-wide block">Google Provider Integration</span>
                <div>
                  {config?.envStatus?.googleKeysPresent ? (
                    <span className="inline-flex items-center text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                      🟢 Env Variable Detected
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-[11px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 px-2 py-0.5 rounded-full">
                      ⚠️ Missing Environment Keys
                    </span>
                  )}
                </div>
              </div>
              <input 
                type="checkbox" 
                className="w-4 h-4 accent-black cursor-pointer"
                checked={!!config?.providers?.google?.enabled}
                onChange={(e) => handleProviderToggleChange('google', e.target.checked)}
              />
            </div>

          </section>
        </div>
      </div>
    </div>
  );
}