import React, { useState } from 'react';
import { Database, CheckCircle2, Copy, Check, Server, Sparkles, ShieldCheck, Download, Code2, AlertTriangle, Globe } from 'lucide-react';
import { generateConfigPhp, generateInstallPhp, generateApiPhp, SQL_SCHEMA } from '../lib/phpExport';
import { deployToFtp } from '../lib/api';

interface AutoSetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSetup: (setupData: {
    dbHost: string;
    dbName: string;
    dbUser: string;
    dbPass: string;
    adminName: string;
    adminEmail: string;
    adminPassword?: string;
  }) => Promise<void>;
  currentConfig?: { dbHost: string; dbName: string; dbUser: string };
}

export const AutoSetupWizard: React.FC<AutoSetupWizardProps> = ({
  isOpen,
  onClose,
  onSaveSetup,
  currentConfig,
}) => {
  const [dbHost, setDbHost] = useState(currentConfig?.dbHost || 'sql305.infinityfree.com');
  const [dbName, setDbName] = useState(currentConfig?.dbName || 'if0_42480076_streakup');
  const [dbUser, setDbUser] = useState(currentConfig?.dbUser || '');
  const [dbPass, setDbPass] = useState('');

  const [adminName, setAdminName] = useState('Tanvhir Hasan');
  const [adminEmail, setAdminEmail] = useState('mailtanvir26@gmail.com');
  const [adminPassword, setAdminPassword] = useState('');

  const [ftpHost, setFtpHost] = useState('ftpupload.net');
  const [liveUrl, setLiveUrl] = useState('http://streakup.infinityfreeapp.com');
  const [autoDeployMode, setAutoDeployMode] = useState(true);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'setup' | 'php_export'>('setup');

  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setErrorMsg('');

    if (!dbUser.trim()) {
      setErrorMsg('Please enter your InfinityFree MySQL Username (e.g. if0_42480076)');
      setLoading(false);
      return;
    }

    try {
      if (autoDeployMode) {
        setSuccess('⚙️ Step 1/3: Compiling React app assets for production...');
        const deployRes = await deployToFtp({
          ftpHost,
          ftpUser: dbUser,
          ftpPass: dbPass,
          dbHost,
          dbName,
          dbUser,
          dbPass,
          adminName,
          adminEmail,
          adminPassword,
          liveUrl,
        });

        setSuccess(`🚀 SUCCESS! App built, uploaded, and live database initialized! visit: ${liveUrl}`);
        
        // Also save local state
        await onSaveSetup({
          dbHost,
          dbName,
          dbUser,
          dbPass,
          adminName,
          adminEmail,
          adminPassword,
        });

        setTimeout(() => {
          setSuccess('');
          onClose();
          // Optionally redirect them to their live url or open it
          if (liveUrl) {
            window.open(liveUrl, '_blank');
          }
        }, 3000);
      } else {
        await onSaveSetup({
          dbHost,
          dbName,
          dbUser,
          dbPass,
          adminName,
          adminEmail,
          adminPassword,
        });
        setSuccess('Database setup & Admin Mentor account initialized successfully!');
        setTimeout(() => {
          setSuccess('');
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Auto Setup & Deployment failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (filename: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedFile(filename);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  const currentConfigPhp = generateConfigPhp(dbHost, dbName, dbUser, dbPass);
  const currentInstallPhp = generateInstallPhp(dbHost, dbName, dbUser, dbPass, adminName, adminEmail, adminPassword);
  const currentApiPhp = generateApiPhp();

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl shrink-0">
              <Database className="w-6 h-6 text-emerald-100" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black leading-tight">InfinityFree Auto-Setup & Installer</h2>
              <p className="text-[11px] sm:text-xs text-emerald-100 font-medium">Configure Database & First-Time Mentor Account</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 sm:px-5 pt-3 space-x-4">
          <button
            type="button"
            onClick={() => setActiveTab('setup')}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'setup'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            1. Installer & Auto Setup Form
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('php_export')}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'php_export'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            2. Export InfinityFree PHP Scripts
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {activeTab === 'setup' ? (
            <form onSubmit={handleSetup} className="space-y-4">
              <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200/90 text-xs text-emerald-950 space-y-1">
                <p className="font-bold flex items-center space-x-1.5 text-emerald-800">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>InfinityFree First-Visit Auto Setup:</span>
                </p>
                <p className="text-slate-700 text-[11px] leading-relaxed">
                  Enter your InfinityFree MySQL database username & password below along with your Mentor/Admin details. Submitting this form initializes the database and locks the installer for secure future access.
                </p>
              </div>

              {/* Section 1: Database Credentials */}
              <div className="space-y-3">
                <div className="flex items-center space-x-1.5 text-xs font-black text-slate-900 border-b border-slate-100 pb-1.5">
                  <Server className="w-4 h-4 text-emerald-600" />
                  <span>1. MySQL Database Connection</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">MySQL Hostname</label>
                    <input
                      type="text"
                      required
                      value={dbHost}
                      onChange={e => setDbHost(e.target.value)}
                      placeholder="sql305.infinityfree.com"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Database Name</label>
                    <input
                      type="text"
                      required
                      value={dbName}
                      onChange={e => setDbName(e.target.value)}
                      placeholder="if0_42480076_streakup"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Database Username <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={dbUser}
                      onChange={e => setDbUser(e.target.value)}
                      placeholder="e.g. if0_42480076"
                      className="w-full p-2.5 bg-white border-2 border-emerald-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Database Password</label>
                    <input
                      type="password"
                      value={dbPass}
                      onChange={e => setDbPass(e.target.value)}
                      placeholder="Your vPanel MySQL Password"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: First Mentor / Admin Setup */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center space-x-1.5 text-xs font-black text-slate-900 border-b border-slate-100 pb-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>2. First Mentor / Admin Registration</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mentor Name</label>
                    <input
                      type="text"
                      required
                      value={adminName}
                      onChange={e => setAdminName(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mentor Email</label>
                    <input
                      type="email"
                      required
                      value={adminEmail}
                      onChange={e => setAdminEmail(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mentor Password</label>
                    <input
                      type="password"
                      required
                      value={adminPassword}
                      onChange={e => setAdminPassword(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: One-Click FTP Deployment */}
              <div className="space-y-3 pt-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center space-x-1.5 text-xs font-black text-slate-900">
                    <Globe className="w-4 h-4 text-teal-600" />
                    <span>3. Automatic Live FTP Deployment (Recommended)</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoDeployMode}
                      onChange={e => setAutoDeployMode(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {autoDeployMode && (
                  <div className="space-y-3 text-xs">
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      This will automatically build your React app, write all required PHP files, connect to InfinityFree via FTP, upload files to <code>htdocs/</code>, and run the remote database auto-installer. <strong>Zero manual effort required!</strong>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">FTP Hostname</label>
                        <input
                          type="text"
                          required={autoDeployMode}
                          value={ftpHost}
                          onChange={e => setFtpHost(e.target.value)}
                          placeholder="ftpupload.net"
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-950"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Your Live Site Domain (URL)</label>
                        <input
                          type="text"
                          required={autoDeployMode}
                          value={liveUrl}
                          onChange={e => setLiveUrl(e.target.value)}
                          placeholder="http://streakup.infinityfreeapp.com"
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-950"
                        />
                      </div>
                    </div>
                    <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100 text-[11px] text-slate-700 flex items-start space-x-2">
                      <span className="text-emerald-600 font-extrabold shrink-0">💡 Note:</span>
                      <span>On InfinityFree, your FTP username and password are exactly the same as your MySQL Database Username and Password. We will automatically use them to authorize deployment.</span>
                    </div>
                  </div>
                )}
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 text-rose-800 text-xs font-bold rounded-xl border border-rose-200 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {success && (
                <div className="p-3 bg-emerald-100 text-emerald-900 text-xs font-bold rounded-xl border border-emerald-300 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center justify-center space-x-2 cursor-pointer active:scale-98 transition-all disabled:opacity-50"
              >
                <Server className="w-4 h-4" />
                <span>
                  {loading
                    ? 'Running Auto Setup & Deployment...'
                    : autoDeployMode
                    ? '🔥 Run Auto Setup & Deploy Live App!'
                    : 'Run Local Auto Setup'}
                </span>
              </button>
            </form>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-100 p-3 rounded-2xl text-slate-700 space-y-1">
                <p className="font-extrabold text-slate-900 flex items-center space-x-1">
                  <Code2 className="w-4 h-4 text-emerald-600" />
                  <span>What are these PHP Scripts for?</span>
                </p>
                <p className="text-[11px] leading-relaxed">
                  InfinityFree is a PHP/MySQL free hosting provider (no Node.js). When uploading your project to InfinityFree <code>htdocs/</code>, these 3 PHP files act as your live backend database handler and installer.
                </p>
              </div>

              {/* Download All PHP Button */}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => downloadFile('install.php', currentInstallPhp)}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download install.php</span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadFile('config.php', currentConfigPhp)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download config.php</span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadFile('api.php', currentApiPhp)}
                  className="px-3 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download api.php</span>
                </button>
              </div>

              {/* Code Previews */}
              <div className="space-y-3 pt-2">
                {/* install.php */}
                <div className="bg-slate-900 text-slate-100 p-3 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400 border-b border-slate-800 pb-2">
                    <span>install.php (Installer with install.lock protection)</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('install.php', currentInstallPhp)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center space-x-1 text-[10px]"
                    >
                      {copiedFile === 'install.php' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedFile === 'install.php' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="text-[10px] font-mono overflow-x-auto max-h-36 text-slate-300">
                    {currentInstallPhp}
                  </pre>
                </div>

                {/* config.php */}
                <div className="bg-slate-900 text-slate-100 p-3 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400 border-b border-slate-800 pb-2">
                    <span>config.php (Database Credentials)</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('config.php', currentConfigPhp)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center space-x-1 text-[10px]"
                    >
                      {copiedFile === 'config.php' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedFile === 'config.php' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="text-[10px] font-mono overflow-x-auto max-h-24 text-slate-300">
                    {currentConfigPhp}
                  </pre>
                </div>

                {/* api.php */}
                <div className="bg-slate-900 text-slate-100 p-3 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400 border-b border-slate-800 pb-2">
                    <span>api.php (REST API for PHP Server)</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('api.php', currentApiPhp)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center space-x-1 text-[10px]"
                    >
                      {copiedFile === 'api.php' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedFile === 'api.php' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="text-[10px] font-mono overflow-x-auto max-h-28 text-slate-300">
                    {currentApiPhp}
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
