import React from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Download, Eye, Edit3, Save, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { Template } from '../types';
import { generateGTEResponse, translateText } from '../services/aiService';

interface TemplateFillerProps {
  template: Template;
  onBack: () => void;
  macroOptions?: { name: string, content: string }[];
}

const LANGUAGES = ['Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Japanese', 'Chinese', 'Korean', 'Arabic'];

export function TemplateFiller({ template, onBack, macroOptions = [] }: TemplateFillerProps) {
  const [formData, setFormData] = React.useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    template.fields.forEach(f => {
      initial[f.id] = f.defaultValue || '';
    });
    return initial;
  });

  const [isPreview, setIsPreview] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isTranslating, setIsTranslating] = React.useState(false);

  const handleAIGenerate = async () => {
    if (template.id !== 'gte-response' && template.category !== 'Sheets') return;
    
    const { customer_name, customer_message, resolution_details, internal_macro } = formData;
    if (!customer_name || !customer_message || !resolution_details) {
      alert('Please fill in Customer Name, Message, and Resolution details first.');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await generateGTEResponse(customer_name, customer_message, resolution_details, internal_macro);
      if (response) {
        setFormData(prev => ({ ...prev, ai_generated_response: response }));
      }
    } catch (error) {
      alert('Failed to generate response. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTranslate = async () => {
    if (template.id !== 'gte-response' && template.category !== 'Sheets') return;

    const { ai_generated_response, target_language } = formData;
    if (!ai_generated_response) {
      alert('Please generate the AI response first.');
      return;
    }

    setIsTranslating(true);
    try {
      const translated = await translateText(ai_generated_response, target_language || 'Spanish');
      if (translated) {
        setFormData(prev => ({ ...prev, ai_translated_response: translated }));
      }
    } catch (error) {
      alert('Failed to translate response. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleChange = (id: string, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [id]: value };
      
      // Special logic: if macro_name is changed, auto-fill internal_macro
      if (id === 'macro_name' && value) {
        const selectedMacro = macroOptions.find(m => m.name === value);
        if (selectedMacro) {
          newData.internal_macro = selectedMacro.content;
        }
      }
      
      return newData;
    });
  };

  const renderContent = () => {
    let content = template.content;
    Object.entries(formData).forEach(([key, value]) => {
      const displayValue = value || `[${key}]`;
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), displayValue);
    });
    return content;
  };

  const handlePrint = () => {
    window.print();
  };

  const [isCopied, setIsCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(renderContent());
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const isMacro = template.category === 'Macro';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pt-20" id="filler-container">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between z-10">
        <div className="flex items-center gap-5">
          <button 
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 transition-all border border-slate-200 shadow-sm"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="font-bold text-slate-900 leading-tight">{template.name}</h2>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{template.category}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {(template.id === 'gte-response' || template.category === 'Sheets' || isMacro) && (
            <>
              <button
                onClick={handleAIGenerate}
                disabled={isGenerating || isTranslating}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl transition-all border border-indigo-100 disabled:opacity-50"
              >
                {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {isGenerating ? 'AI Thinking...' : 'AI Generate'}
              </button>
              <button
                onClick={handleTranslate}
                disabled={isGenerating || isTranslating || !formData.ai_generated_response}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-xl transition-all border border-amber-100 disabled:opacity-50"
              >
                {isTranslating ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {isTranslating ? 'Translating...' : 'Translate Output'}
              </button>
            </>
          )}
          <button
            onClick={handleCopy}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-all border",
              isCopied 
                ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                : "text-slate-600 hover:bg-slate-100 border-slate-200"
            )}
          >
            {isCopied ? <Sparkles size={16} /> : <Save size={16} />}
            {isCopied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
          {!isMacro && (
            <button
              onClick={() => setIsPreview(!isPreview)}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all border border-slate-200"
            >
              {isPreview ? <Edit3 size={16} /> : <Eye size={16} />}
              {isPreview ? 'Back to Editor' : 'Toggle Preview'}
            </button>
          )}
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-all shadow-lg shadow-indigo-200"
          >
            <Download size={16} />
            Export Document
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex">
        {/* Editor Form */}
        <AnimatePresence mode="wait">
          {!isPreview && !isMacro ? (
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="w-full md:w-1/2 overflow-y-auto p-12 border-r border-slate-200 bg-white"
            >
              <div className="max-w-xl mx-auto space-y-10">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Configuration</h3>
                  <p className="text-sm text-slate-400 font-medium leading-relaxed">Personalize the details below to generate your final document.</p>
                </div>

                <div className="grid gap-8">
                  {template.fields.map((field) => (
                    <div key={field.id} className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                        {field.label}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          placeholder={field.placeholder}
                          value={formData[field.id]}
                          onChange={(e) => handleChange(field.id, e.target.value)}
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all min-h-[140px] resize-none text-sm font-medium"
                        />
                      ) : field.type === 'select' || field.id === 'target_language' ? (
                        <select
                          value={formData[field.id]}
                          onChange={(e) => handleChange(field.id, e.target.value)}
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                        >
                          <option value="">{field.placeholder || "Select an option..."}</option>
                          {field.id === 'target_language' ? (
                            LANGUAGES.map(lang => (
                              <option key={lang} value={lang}>{lang}</option>
                            ))
                          ) : field.id === 'macro_name' ? (
                            macroOptions.map(m => (
                              <option key={m.name} value={m.name}>{m.name}</option>
                            ))
                          ) : (
                            field.options?.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))
                          )}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          placeholder={field.placeholder}
                          value={formData[field.id]}
                          onChange={(e) => handleChange(field.id, e.target.value)}
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Live Preview */}
        <div className={cn(
          "flex-1 overflow-y-auto p-4 md:p-16 transition-all duration-300 print:p-0",
          (!isPreview && !isMacro) ? "bg-slate-100 md:block hidden" : "bg-white w-full"
        )}>
          <div className="max-w-[800px] mx-auto bg-white min-h-[1056px] shadow-2xl shadow-slate-300/40 rounded-sm p-12 md:p-24 print:shadow-none print:m-0 print:p-0">
            <div className="markdown-content">
              <ReactMarkdown>
                {renderContent()}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .markdown-content h1 { font-size: 2.25rem; font-weight: 800; border-bottom: 2px solid #e5e5e5; padding-bottom: 0.5rem; margin-bottom: 1.5rem; }
        .markdown-content h2 { font-size: 1.5rem; font-weight: 700; margin-top: 2rem; margin-bottom: 1rem; }
        .markdown-content h3 { font-size: 1.25rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.75rem; }
        .markdown-content p { margin-bottom: 1rem; line-height: 1.6; color: #404040; }
        .markdown-content table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; }
        .markdown-content th { background: #f9fafb; border: 1px solid #e5e7eb; padding: 0.75rem; text-align: left; font-size: 0.875rem; font-weight: 600; }
        .markdown-content td { border: 1px solid #e5e7eb; padding: 0.75rem; font-size: 0.875rem; }
        .markdown-content hr { margin: 2rem 0; border: 0; border-top: 1px solid #e5e7eb; }
        
        @media print {
          header, 
          #filler-container > main > div:first-child { 
            display: none !important; 
          }
          #filler-container > main {
            overflow: visible !important;
          }
          .min-h-screen { min-height: auto !important; padding: 0 !important; }
          body { background: white !important; }
          #filler-container > main > div:last-child {
             padding: 0 !important;
             background: transparent !important;
             display: block !important;
          }
          .shadow-2xl { box-shadow: none !important; }
          @page { margin: 2cm; }
        }
      `}</style>
    </div>
  );
}

// ... No extra helper needed here anymore as we use centralized cn
