export type TemplateField = {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'textarea' | 'select';
  placeholder?: string;
  defaultValue?: string;
  options?: string[];
};

export type Template = {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string; // Markdown or rich text with {{variable}} placeholders
  fields: TemplateField[];
  icon: string; // Lucide icon name
};
