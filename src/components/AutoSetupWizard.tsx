import React, { useState } from 'react';
import { Database, CheckCircle2, Download, Copy, Check, Server, Sparkles, ExternalLink } from 'lucide-react';
import { CONFIG_PHP, DB_SETUP_PHP, API_PHP, SQL_SCHEMA } from '../lib/phpExport';

interface AutoSetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSetup: (dbHost: string, dbName: string, dbUser: string) => Promise<void>;
  currentConfig?: { dbHost: string; dbName: string; dbUser: string };
}

export const AutoSetupWizard: React.FC<AutoSetupWizardProps> = ({
  isOpen,
  onClose,
  onSaveSetup,
  currentConfig,
}) => {
  const [dbHost, setDbHost] = useState(currentConfig?.dbHost || 'sqlxxx.epizy.com');
  const [dbName, setDbName] = useState(currentConfig?.dbName || 'epiz_xxx_studystreak');
  const [dbUser, setDbUser] = useState(currentConfig?.dbUser || 'epiz_xxx');
  const [dbPass, setDbPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'setup' | 'php_export'>('setup');

  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    try {
      await onSaveSetup(dbHost, dbName, dbUser);
      setSuccess('Database setup configured successfully! All tables ready.');
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (filename: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedFile(filename);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl">
              <Database className="w-6 h-6 text-emerald-100" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight">InfinityFree Auto Setup & PHP Exporter</h2>
              <p className="text-xs text-emerald-100 font-medium">1-Click Auto Setup for Free Hosting Domain</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3 space-x-4">
          <button
            onClick={() => setActiveTab('setup')}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'setup'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            1-Click Database Auto Setup
          </button>
          <button
            onClick={() => setActiveTab('php_export')}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'php_export'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Export InfinityFree PHP Scripts
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {activeTab === 'setup' ? (
            <form onSubmit={handleSetup} className="space-y-4">
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
                <p className="font-bold flex items-center space-x-1">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>InfinityFree First Visit Auto Setup:</span>
                </p>
                <p className="text-slate-700">
                  When you upload files to your InfinityFree domain, enter your MySQL database credentials below. Clicking <strong>Auto Setup Database</strong> will automatically initialize all required tables (`users`, `study_logs`, `mentor_feedback`, `notices`, `thread_posts`).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">MySQL Hostname</label>
                  <input
                    type="text"
                    required
                    value={dbHost}
                    onChange={e => setDbHost(e.target.value)}
                    placeholder="e.g. sql302.epizy.com"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Database Name</label>
                  <input
                    type="text"
                    required
                    value={dbName}
                    onChange={e => setDbName(e.target.value)}
                    placeholder="e.g. epiz_12345678_studystreak"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Database Username</label>
                  <input
                    type="text"
                    required
                    value={dbUser}
                    onChange={e => setDbUser(e.target.value)}
                    placeholder="e.g. epiz_12345678"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Database Password</label>
                  <input
                    type="password"
                    value={dbPass}
                    onChange={e => setDbPass(e.target.value)}
                    placeholder="Your InfinityFree MySQL password"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {success && (
                <div className="p-3 bg-emerald-100 text-emerald-900 text-xs font-bold rounded-xl border border-emerald-300 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2"
              >
                <Server className="w-4 h-4" />
                <span>{loading ? 'Executing Auto Setup...' : 'Run Auto Setup Database Now'}</span>
              </button>
            </form>
          ) : (
            <div className="space-y-4 text-xs">
              <p className="text-slate-600 font-medium">
                Copy or download these PHP scripts to place in your InfinityFree <code>htdocs/</code> directory:
              </p>

              {/* PHP Script Files Code Viewers */}
              <div className="space-y-3">
                {/* db_setup.php */}
                <div className="bg-slate-900 text-slate-100 p-3 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400 border-b border-slate-800 pb-2">
                    <span>db_setup.php (1-Click Auto Setup Script)</span>
                    <button
                      onClick={() => copyToClipboard('db_setup.php', DB_SETUP_PHP)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center space-x-1"
                    >
                      {copiedFile === 'db_setup.php' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedFile === 'db_setup.php' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="text-[10px] font-mono overflow-x-auto max-h-32 text-slate-300">
                    {DB_SETUP_PHP}
                  </pre>
                </div>

                {/* config.php */}
                <div className="bg-slate-900 text-slate-100 p-3 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400 border-b border-slate-800 pb-2">
                    <span>config.php (Database Credentials)</span>
                    <button
                      onClick={() => copyToClipboard('config.php', CONFIG_PHP)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center space-x-1"
                    >
                      {copiedFile === 'config.php' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedFile === 'config.php' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="text-[10px] font-mono overflow-x-auto max-h-24 text-slate-300">
                    {CONFIG_PHP}
                  </pre>
                </div>

                {/* api.php */}
                <div className="bg-slate-900 text-slate-100 p-3 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400 border-b border-slate-800 pb-2">
                    <span>api.php (REST API for InfinityFree PHP)</span>
                    <button
                      onClick={() => copyToClipboard('api.php', API_PHP)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center space-x-1"
                    >
                      {copiedFile === 'api.php' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedFile === 'api.php' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="text-[10px] font-mono overflow-x-auto max-h-32 text-slate-300">
                    {API_PHP}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
