import * as Icons from 'lucide-react';
import { Template } from '../types';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface TemplateCardProps {
  template: Template;
  onClick: (template: Template) => void;
}

export function TemplateCard({ template, onClick }: TemplateCardProps) {
  const Icon = (Icons as any)[template.icon] || Icons.FileText;

  return (
    <motion.div
      role="button"
      tabIndex={0}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(template)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(template);
        }
      }}
      className={cn(
        "flex flex-col items-start p-6 bg-white border border-slate-200 rounded-[28px] text-left transition-all hover:shadow-xl hover:shadow-slate-200/60 group relative overflow-hidden cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
      )}
      id={`template-card-${template.id}`}
    >
      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center">
          <Icons.ArrowUpRight size={16} />
        </div>
      </div>

      <div className="p-3.5 bg-slate-50 text-slate-400 rounded-2xl mb-5 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
        <Icon size={22} strokeWidth={2.5} />
      </div>
      
      <div className="flex flex-col gap-1.5 w-full">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
            {template.category}
          </span>
        </div>
        <h3 className="text-lg font-bold text-slate-900 leading-tight">
          {template.name}
        </h3>
        <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed font-medium opacity-70">
          {template.description}
        </p>
      </div>
    </motion.div>
  );
}
