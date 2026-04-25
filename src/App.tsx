import React from 'react';
import { motion } from 'motion/react';
import { Search, Sparkles, FileText, Layout, History, Settings, LogOut, ChevronRight, Lock, Key } from 'lucide-react';
import { PREMADE_TEMPLATES } from './constants';
import { Template } from './types';
import { TemplateCard } from './components/TemplateCard';
import { TemplateFiller } from './components/TemplateFiller';
import { GoogleSignIn } from './components/GoogleSignIn';
import { fetchSheetTemplates } from './services/googleSheetsService';
import { cn } from './lib/utils';

export default function App() {
  const [activeTemplate, setActiveTemplate] = React.useState<Template | null>(null);
  const [showSettings, setShowSettings] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeCategory, setActiveCategory] = React.useState('All');
  const [sheetTemplates, setSheetTemplates] = React.useState<Template[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = React.useState(false);
  const [spreadsheetId, setSpreadsheetId] = React.useState('1Z22RaAz1BUanswQGpjOfRFZRsvqA7ptzdLHQs--Si54');
  
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = React.useState(() => {
    try {
      return localStorage.getItem('app_authenticated') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [passcodeInput, setPasscodeInput] = React.useState('');
  const [passcodeError, setPasscodeError] = React.useState(false);
  
  const requiredPasscode = typeof import.meta.env !== 'undefined' ? (import.meta.env.VITE_APP_PASSCODE || '') : '';

  const [googleClientId, setGoogleClientId] = React.useState(() => {
    try {
      const stored = localStorage.getItem('google_client_id');
      const env = typeof import.meta.env !== 'undefined' ? (import.meta.env.VITE_GOOGLE_CLIENT_ID || '') : '';
      return stored || env;
    } catch (e) {
      return typeof import.meta.env !== 'undefined' ? (import.meta.env.VITE_GOOGLE_CLIENT_ID || '') : '';
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem('google_client_id', googleClientId);
    } catch (e) {
      // Ignore storage errors in restricted frames
    }
  }, [googleClientId]);

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcodeInput === requiredPasscode) {
      setIsAuthenticated(true);
      try {
        localStorage.setItem('app_authenticated', 'true');
      } catch (err) {
        // Fallback for restricted storage
      }
      setPasscodeError(false);
    } else {
      setPasscodeError(true);
      setPasscodeInput('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    try {
      localStorage.removeItem('app_authenticated');
    } catch (e) {
      // Ignore
    }
  };

  const handleSyncSuccess = async (token: string) => {
    setIsLoadingTemplates(true);
    try {
      const sheetsData = await fetchSheetTemplates(token, spreadsheetId);
      const formattedTemplates: Template[] = sheetsData.map((st, index) => ({
        id: `sheet-${index}`,
        name: st.name,
        description: 'Imported from Google Sheets',
        category: 'Macro',
        icon: 'Sparkles',
        content: st.content,
        fields: [
          { id: 'customer_name', label: 'Customer Name', type: 'text' },
          { id: 'customer_message', label: 'Customer Message', type: 'textarea' },
          { id: 'resolution_details', label: 'Resolution Details', type: 'textarea' },
          { id: 'internal_macro', label: 'Used Macro/Template', type: 'textarea', defaultValue: st.content },
          { id: 'ai_generated_response', label: 'AI Output', type: 'textarea' },
          { id: 'target_language', label: 'Target Language', type: 'text', defaultValue: 'Spanish' },
          { id: 'ai_translated_response', label: 'AI Translated Output', type: 'textarea' }
        ]
      }));
      setSheetTemplates(formattedTemplates);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      alert('Failed to sync templates from spreadsheet. Check if the spreadsheet is public or you have access.');
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const allTemplates = [...PREMADE_TEMPLATES, ...sheetTemplates];
  const libraryTemplates = allTemplates.filter(t => t.category !== 'Customer Support');
  const categories = ['All', 'Macro', ...new Set(libraryTemplates.map(t => t.category).filter(c => c !== 'Macro'))];

  const filteredTemplates = libraryTemplates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || t.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Lock Screen Render
  if (requiredPasscode && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-[32px] p-10 shadow-2xl space-y-8 text-center"
        >
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-indigo-100 rounded-[24px] flex items-center justify-center text-indigo-600 shadow-inner">
              <Lock size={40} />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">Protected Access</h1>
            <p className="text-slate-500 text-sm">Please enter the security passcode to continue to your library.</p>
          </div>

          <form onSubmit={handlePasscodeSubmit} className="space-y-4">
            <div className="relative group">
              <Key className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 transition-colors",
                passcodeError ? "text-red-400" : "text-slate-400 group-focus-within:text-indigo-500"
              )} size={20} />
              <input 
                type="password" 
                value={passcodeInput}
                onChange={(e) => {
                  setPasscodeInput(e.target.value);
                  if (passcodeError) setPasscodeError(false);
                }}
                placeholder="Enter Passcode"
                autoFocus
                className={cn(
                  "w-full pl-12 pr-6 py-4 bg-slate-50 border-2 rounded-2xl text-lg font-bold outline-none transition-all",
                  passcodeError 
                    ? "border-red-200 bg-red-50 text-red-900 placeholder:text-red-300" 
                    : "border-transparent focus:bg-white focus:border-indigo-100 placeholder:text-slate-300"
                )}
              />
            </div>
            
            {passcodeError && (
              <motion.p 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-red-500 text-xs font-bold text-left pl-1"
              >
                Incorrect passcode. Please try again.
              </motion.p>
            )}

            <button 
              type="submit"
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]"
            >
              Unlock Application
            </button>
          </form>

          <p className="text-slate-400 text-[10px] font-medium leading-relaxed">
            Unauthorized access is strictly prohibited.<br />
            Contact your administrator if you've forgotten the code.
          </p>
        </motion.div>
      </div>
    );
  }

  if (showSettings) {
    return (
      <div className="min-h-screen bg-slate-50 flex font-sans">
        {/* Reuse sidebar for consistency */}
        <aside className="w-72 bg-white border-r border-slate-200 hidden lg:flex flex-col p-8 shrink-0">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <FileText className="text-white" size={20} />
            </div>
            <span className="font-bold text-2xl tracking-tight text-slate-800">Templify</span>
          </div>
          <div className="flex-1 space-y-10">
            <div>
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Main Menu</h3>
              <nav className="space-y-1">
                <NavItem 
                  icon={<Layout size={18} />} 
                  label="Library" 
                  onClick={() => setShowSettings(false)}
                />
                <NavItem icon={<History size={18} />} label="Recent Files" />
                <NavItem 
                  icon={<Settings size={18} />} 
                  label="Settings" 
                  active={true}
                />
              </nav>
            </div>
          </div>
        </aside>
        
        <main className="flex-1 p-10 overflow-y-auto">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <Layout size={20} className="text-slate-400" />
              </button>
              <h1 className="text-2xl font-bold text-slate-900">Application Settings</h1>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Lock size={20} />
                  <h2 className="text-lg font-bold">Security & Access</h2>
                </div>
                <p className="text-sm text-slate-500">Manage who can access this application and your library.</p>
              </div>

              <div className="space-y-6">
                <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-4">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Key size={16} className="text-indigo-400" />
                    Application Passcode
                  </h3>
                  <p className="text-xs text-slate-400">To lock this application, set the following environment variable in the platform settings:</p>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-800 rounded-xl border border-slate-700">
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Variable Name</p>
                        <code className="text-xs font-mono text-indigo-300">VITE_APP_PASSCODE</code>
                      </div>
                    </div>
                    {requiredPasscode ? (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                        <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                          Passcode Protection Active
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                        <div className="text-[10px] text-amber-400 font-bold flex items-center gap-2">
                          <Sparkles size={12} />
                          Currently Unlocked (No Passcode Set)
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 flex justify-between items-center border-t border-slate-100 mt-6">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-slate-800">Lock Application</p>
                    <p className="text-xs text-slate-400">Log out of the current session and require the passcode again.</p>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition-all flex items-center gap-2"
                  >
                    <LogOut size={14} />
                    Logout
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Sparkles size={20} />
                  <h2 className="text-lg font-bold">Google Sheets Integration</h2>
                </div>
                <p className="text-sm text-slate-500">Sync your custom snippets and customer support macros directly from a spreadsheet.</p>
              </div>

              <div className="space-y-6">
                <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-4">
                  <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                    <History size={16} />
                    Google Cloud Setup Guide
                  </h3>
                  <ol className="text-xs text-indigo-800 space-y-3 list-decimal ml-4">
                    <li>Go to the <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="underline font-bold">Google Cloud Console</a>.</li>
                    <li>Create a Project and go to <strong>APIs & Services &gt; Credentials</strong>.</li>
                    <li>Click <strong>Create Credentials &gt; OAuth client ID</strong>.</li>
                    <li>Select <strong>Web application</strong> as the Application type.</li>
                    <li>
                      Add this URL to <strong>Authorized JavaScript origins</strong>:
                      <code className="block mt-1 p-2 bg-white/50 rounded border border-indigo-200 font-mono select-all">
                        {window.location.origin}
                      </code>
                    </li>
                    <li>Copy the <strong>Client ID</strong>.</li>
                  </ol>
                  <div className="mt-4 p-3 bg-amber-100/50 rounded-xl border border-amber-200 text-[10px] text-amber-900">
                    <p className="font-bold flex items-center gap-1 mb-1">
                      <Sparkles size={12} />
                      Fix "App Not Verified" Error:
                    </p>
                    <p>If you see "Google hasn't verified this app", click <strong>Advanced</strong> &gt; <strong>Go to (unsafe)</strong>. Also, ensure your email is added as a <strong>Test User</strong> in the Google Cloud Console OAuth consent screen.</p>
                  </div>
                </div>

                <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-4">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Settings size={16} className="text-indigo-400" />
                    Final Step: Platform Configuration
                  </h3>
                  <p className="text-xs text-slate-400">To make the sync work, you must add your Client ID to the platform's Environment Variables:</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-slate-800 rounded-xl border border-slate-700">
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Variable Name</p>
                        <code className="text-xs font-mono text-indigo-300">VITE_GOOGLE_CLIENT_ID</code>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 italic">Navigate to the Settings menu in this platform (gear icon at the top) &gt; Secrets &gt; Add Variable.</p>
                  </div>
                </div>

                <div className="flex flex-col gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-800">Local Client ID Override</p>
                    <p className="text-xs text-slate-400">If you can't set platform environment variables, paste your Client ID here.</p>
                  </div>
                  <input 
                    type="text" 
                    value={googleClientId}
                    onChange={(e) => setGoogleClientId(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-bold text-slate-700"
                    placeholder="Enter Client ID (e.g. 12345-abc.apps.googleusercontent.com)"
                  />
                </div>

                <div className="flex flex-col gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-800">Target Spreadsheet ID</p>
                    <p className="text-xs text-slate-400">The ID of the spreadsheet containing your templates.</p>
                  </div>
                  <input 
                    type="text" 
                    value={spreadsheetId}
                    onChange={(e) => setSpreadsheetId(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-bold text-slate-700"
                    placeholder="Enter Spreadsheet ID"
                  />
                  <p className="text-[10px] text-slate-400">Example: 1Z22RaAz1BUanswQGpjOfRFZRsvqA7ptzdLHQs--Si54</p>
                </div>

                <div className="pt-4 flex justify-between items-center border-t border-slate-100 mt-6">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-slate-800">Manual Sync</p>
                    <p className="text-xs text-slate-400">Trigger a sync with the spreadsheet now.</p>
                  </div>
                  <GoogleSignIn 
                    onSuccess={handleSyncSuccess} 
                    isLoading={isLoadingTemplates} 
                    clientIdOverride={googleClientId}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6 text-center py-12">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                  <History size={32} />
                </div>
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-800">Coming Soon</h2>
                <p className="text-sm text-slate-400">Additional sync providers and cloud storage integrations.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (activeTemplate) {
    return (
      <TemplateFiller 
        template={activeTemplate} 
        onBack={() => setActiveTemplate(null)} 
        macroOptions={sheetTemplates.map(t => ({ name: t.name, content: t.content }))}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar - Desktop */}
      <aside className="w-72 bg-white border-r border-slate-200 hidden lg:flex flex-col p-8 shrink-0">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <FileText className="text-white" size={20} />
          </div>
          <span className="font-bold text-2xl tracking-tight text-slate-800">Templify</span>
        </div>

        <div className="flex-1 space-y-10">
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Main Menu</h3>
            <nav className="space-y-1">
              <NavItem 
                icon={<Layout size={18} />} 
                label="Library" 
                active={!showSettings} 
                onClick={() => {setShowSettings(false);}}
              />
              <NavItem icon={<History size={18} />} label="Recent Files" />
              <NavItem 
                icon={<Settings size={18} />} 
                label="Settings" 
                active={showSettings}
                onClick={() => {setShowSettings(true);}}
              />
            </nav>
          </div>

          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Categories</h3>
            <div className="space-y-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-sm font-medium",
                    activeCategory === cat 
                      ? "bg-indigo-50 text-indigo-700 shadow-sm" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <div className="bg-slate-900 rounded-2xl p-5 text-white relative overflow-hidden group">
            <p className="text-[10px] text-slate-400 mb-1 font-semibold uppercase tracking-wider">System Status</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold">All Systems Live</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 px-10 flex items-center justify-between shrink-0">
          <div className="flex-1 max-w-xl">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Search for templates, drafts, or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-6 py-3 bg-slate-50 border-none rounded-2xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 pl-8 border-l border-slate-100 ml-8">
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
              title="Settings"
            >
              <Settings size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 border-2 border-white shadow-sm flex items-center justify-center text-indigo-700 font-bold overflow-hidden cursor-pointer hover:ring-2 hover:ring-indigo-100 transition-all">
                G
              </div>
            </div>
          </div>
        </header>

        {/* Bento Dashboard Container */}
        <div className="p-10 flex-1 overflow-y-auto">
          <div className="grid grid-cols-12 auto-rows-min gap-6 max-w-7xl mx-auto">
            
            {/* Bento Block: Hero */}
            <section className="col-span-12 bg-indigo-600 rounded-[32px] p-12 text-white relative overflow-hidden flex flex-col justify-between shadow-2xl shadow-indigo-200/50 min-h-[300px]">
              <div className="relative z-10 max-w-2xl space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] uppercase font-bold tracking-widest backdrop-blur-md">
                  <Sparkles size={12} className="text-amber-300" />
                  GTECom AI Engine
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                  Personalized Support, Simplified.
                </h1>
                <p className="text-indigo-100 text-lg font-medium opacity-80">
                  Generate professional, empathetic, and concise customer service responses following the "Triple A" rule and GTECom standards.
                </p>
              </div>

              {/* Bento Decor */}
              <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-indigo-500 rounded-full opacity-40 blur-3xl translate-y-12 translate-x-12" />
              <div className="absolute top-10 right-10 w-40 h-40 border-2 border-indigo-400/20 rounded-full" />
            </section>

            {/* Bento Block: Primary Library (Formerly Customer Support) */}
            <section className="col-span-12 space-y-6 mt-12">
              <div className="flex flex-col gap-1">
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Template Library</h2>
                <p className="text-slate-400 text-sm font-medium">
                  {PREMADE_TEMPLATES.filter(t => t.category === 'Customer Support').length} active blueprints ready for your workflow
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {PREMADE_TEMPLATES
                  .filter(t => t.category === 'Customer Support')
                  .filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.description.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(template => (
                    <TemplateCard key={template.id} template={template} onClick={setActiveTemplate} />
                  ))
                }
              </div>
            </section>

            {/* Bento Block: Extra Library Container */}
            <section className="col-span-12 space-y-10 mt-16 pb-20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Library</h2>
                  <p className="text-slate-400 text-sm font-medium">
                    Additional verified tools and synced macros
                  </p>
                </div>
                
                {/* Inline filter pills for convenience if sidebar is hidden */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none lg:hidden">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={cn(
                        "whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all",
                        activeCategory === cat 
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                          : "bg-white text-slate-500 border border-slate-200 hover:border-indigo-200"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grouped Library Rendering */}
              {activeCategory === 'All' ? (
                <div className="space-y-16">
                  {/* Macros Section (Always show if 'All' and matches search) */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-widest">Macros</div>
                      <div className="h-px bg-slate-100 flex-1" />
                    </div>
                    
                    {sheetTemplates.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {sheetTemplates
                          .filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.description.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map(template => (
                            <TemplateCard key={template.id} template={template} onClick={setActiveTemplate} />
                          ))
                        }
                      </div>
                    ) : (
                      <div className="p-12 bg-white border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
                        <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500">
                          <Sparkles size={24} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-slate-900 font-bold">No Macros Synced</p>
                          <p className="text-slate-400 text-xs max-w-[240px]">Connect your Google Spreadsheet in Settings to import your custom macros.</p>
                        </div>
                        <GoogleSignIn 
                          onSuccess={handleSyncSuccess} 
                          isLoading={isLoadingTemplates} 
                          clientIdOverride={googleClientId}
                        />
                      </div>
                    )}
                  </div>

                  {(PREMADE_TEMPLATES.some(t => t.name.toLowerCase().includes(searchQuery.toLowerCase())) || searchQuery === '') && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {PREMADE_TEMPLATES
                          .filter(t => t.category !== 'Customer Support')
                          .filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.description.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map(template => (
                            <TemplateCard key={template.id} template={template} onClick={setActiveTemplate} />
                          ))
                        }
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-10">
                  {activeCategory === 'Macro' && sheetTemplates.length === 0 && (
                    <div className="p-12 bg-white border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
                      <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500">
                        <Sparkles size={24} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-900 font-bold">No Macros Synced</p>
                        <p className="text-slate-400 text-xs max-w-[240px]">Connect your Google Spreadsheet in Settings to import your custom macros.</p>
                      </div>
                      <GoogleSignIn 
                        onSuccess={handleSyncSuccess} 
                        isLoading={isLoadingTemplates} 
                        clientIdOverride={googleClientId}
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredTemplates.map(template => (
                      <TemplateCard 
                        key={template.id} 
                        template={template} 
                        onClick={setActiveTemplate}
                      />
                    ))}
                  </div>
                </div>
              )}
                
              {/* Empty State Card */}
              {filteredTemplates.length === 0 && (
                <div className="col-span-full py-32 bg-white border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                    <Search size={32} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-900 font-bold text-lg">No results found</p>
                    <p className="text-slate-400 text-sm max-w-xs">We couldn't find any templates matching "{searchQuery}" in {activeCategory}.</p>
                  </div>
                  <button 
                    onClick={() => {setSearchQuery(''); setActiveCategory('All');}}
                    className="text-indigo-600 font-bold text-sm hover:underline"
                  >
                    Reset all filters
                  </button>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
      "flex items-center justify-between w-full px-3 py-2.5 rounded-xl transition-all group",
      active ? "bg-neutral-900 text-white shadow-lg shadow-neutral-200" : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
    )}>
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-semibold">{label}</span>
      </div>
      {active && <ChevronRight size={14} className="opacity-50" />}
    </button>
  );
}

