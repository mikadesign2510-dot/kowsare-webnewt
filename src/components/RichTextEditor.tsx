import React, { useRef, useEffect, useState } from 'react';
import { 
  Bold, Italic, Underline, Strikethrough, 
  AlignRight, AlignCenter, AlignLeft, AlignJustify,
  List, ListOrdered, Link as LinkIcon, Image as ImageIcon,
  Heading1, Heading2, Heading3, Quote, Eraser,
  Undo, Redo, Palette, Sparkles
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder = 'متن خبر را اینجا بنویسید...' }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [activeColor, setActiveColor] = useState('#1e293b');

  // Synchronize external value with contentEditable without resetting cursor if already in sync
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const executeCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInsertLink = () => {
    const url = prompt('آدرس لینک (URL) را وارد کنید:', 'https://');
    if (url && url.trim() !== '' && url !== 'https://') {
      executeCommand('createLink', url);
    }
  };

  const handleInsertImage = () => {
    const url = prompt('آدرس تصویر (URL) را وارد کنید:', 'https://');
    if (url && url.trim() !== '' && url !== 'https://') {
      executeCommand('insertImage', url);
    }
  };

  const colors = [
    '#1e293b', '#2563eb', '#059669', '#d97706', '#dc2626', 
    '#7c3aed', '#db2777', '#475569', '#0891b2', '#4f46e5'
  ];

  return (
    <div className="border border-slate-200 rounded-2xl bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all relative">
      {/* Toolbar */}
      <div className="bg-slate-100 border-b border-slate-200 p-2 sm:p-2.5 flex items-center gap-1 sm:gap-1.5 text-slate-700 select-none z-10 rounded-t-2xl overflow-x-auto no-scrollbar flex-nowrap sm:flex-wrap sticky top-0">
        
        {/* Headings */}
        <button
          type="button"
          onClick={() => executeCommand('formatBlock', '<h1>')}
          className="p-1.5 sm:p-2 shrink-0 bg-white text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-slate-200 shadow-xs hover:border-blue-200"
          title="سرتیتر بزرگ (H1)"
        >
          <Heading1 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('formatBlock', '<h2>')}
          className="p-1.5 sm:p-2 shrink-0 bg-white text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-slate-200 shadow-xs hover:border-blue-200"
          title="سرتیتر متوسط (H2)"
        >
          <Heading2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('formatBlock', '<h3>')}
          className="p-1.5 sm:p-2 shrink-0 bg-white text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-slate-200 shadow-xs hover:border-blue-200"
          title="سرتیتر کوچک (H3)"
        >
          <Heading3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('formatBlock', '<p>')}
          className="px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-bold shrink-0 bg-white text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-slate-200 shadow-xs hover:border-blue-200"
          title="متن عادی"
        >
          پاراگراف
        </button>

        <div className="h-5 w-[1px] bg-slate-300 mx-0.5 sm:mx-1 shrink-0"></div>

        {/* Basic Formats */}
        <button
          type="button"
          onClick={() => executeCommand('bold')}
          className="p-1.5 sm:p-2 shrink-0 bg-white text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-slate-200 shadow-xs hover:border-blue-200 font-bold"
          title="ضخیم (Bold)"
        >
          <Bold className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('italic')}
          className="p-1.5 sm:p-2 shrink-0 bg-white text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-slate-200 shadow-xs hover:border-blue-200"
          title="مورب (Italic)"
        >
          <Italic className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('underline')}
          className="p-1.5 sm:p-2 shrink-0 bg-white text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-slate-200 shadow-xs hover:border-blue-200"
          title="خط زیرین (Underline)"
        >
          <Underline className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('strikeThrough')}
          className="p-1.5 sm:p-2 shrink-0 bg-white text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-slate-200 shadow-xs hover:border-blue-200"
          title="خط خورده (Strikethrough)"
        >
          <Strikethrough className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        <div className="h-5 w-[1px] bg-slate-300 mx-0.5 sm:mx-1 shrink-0"></div>

        {/* Colors */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-1.5 sm:p-2 bg-white text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-slate-200 shadow-xs hover:border-blue-200 flex items-center gap-1"
            title="رنگ متن"
          >
            <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <div className="w-2.5 h-2.5 rounded-full border border-slate-300" style={{ backgroundColor: activeColor }}></div>
          </button>
          
          {showColorPicker && (
            <div className="absolute top-full mt-1 right-0 bg-white border border-slate-200 rounded-xl p-2 shadow-lg z-20 flex gap-1.5 flex-wrap w-44">
              {colors.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setActiveColor(c);
                    executeCommand('foreColor', c);
                    setShowColorPicker(false);
                  }}
                  className="w-6 h-6 rounded-lg border border-slate-200 hover:scale-110 transition-transform"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="h-5 w-[1px] bg-slate-300 mx-0.5 sm:mx-1 shrink-0"></div>

        {/* Alignments */}
        <button
          type="button"
          onClick={() => executeCommand('justifyRight')}
          className="p-1.5 sm:p-2 shrink-0 bg-white text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-slate-200 shadow-xs hover:border-blue-200"
          title="راست‌چین"
        >
          <AlignRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('justifyCenter')}
          className="p-1.5 sm:p-2 shrink-0 bg-white text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-slate-200 shadow-xs hover:border-blue-200"
          title="وسط‌چین"
        >
          <AlignCenter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('justifyLeft')}
          className="p-1.5 sm:p-2 shrink-0 bg-white text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-slate-200 shadow-xs hover:border-blue-200"
          title="چپ‌چین"
        >
          <AlignLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('justifyFull')}
          className="p-1.5 sm:p-2 shrink-0 bg-white text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-slate-200 shadow-xs hover:border-blue-200"
          title="تراز از دو طرف"
        >
          <AlignJustify className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        <div className="h-5 w-[1px] bg-slate-300 mx-0.5 sm:mx-1 shrink-0"></div>

        {/* Lists & Quotes */}
        <button
          type="button"
          onClick={() => executeCommand('insertUnorderedList')}
          className="p-1.5 sm:p-2 shrink-0 bg-white text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-slate-200 shadow-xs hover:border-blue-200"
          title="لیست نشانه‌دار"
        >
          <List className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('insertOrderedList')}
          className="p-1.5 sm:p-2 shrink-0 bg-white text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-slate-200 shadow-xs hover:border-blue-200"
          title="لیست شماره‌دار"
        >
          <ListOrdered className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('formatBlock', '<blockquote>')}
          className="p-1.5 sm:p-2 shrink-0 bg-white text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-slate-200 shadow-xs hover:border-blue-200"
          title="نقل قول"
        >
          <Quote className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        <div className="h-5 w-[1px] bg-slate-300 mx-0.5 sm:mx-1 shrink-0"></div>

        {/* Links & Images */}
        <button
          type="button"
          onClick={handleInsertLink}
          className="p-1.5 sm:p-2 shrink-0 bg-white text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-slate-200 shadow-xs hover:border-blue-200"
          title="درج لینک"
        >
          <LinkIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
        <button
          type="button"
          onClick={handleInsertImage}
          className="p-1.5 sm:p-2 shrink-0 bg-white text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-slate-200 shadow-xs hover:border-blue-200"
          title="درج تصویر از لینک"
        >
          <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('removeFormat')}
          className="p-1.5 sm:p-2 shrink-0 bg-white text-slate-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border border-slate-200 shadow-xs hover:border-red-200"
          title="حذف فرمت‌ها"
        >
          <Eraser className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        <div className="h-5 w-[1px] bg-slate-300 mx-0.5 sm:mx-1 shrink-0"></div>

        {/* History */}
        <button
          type="button"
          onClick={() => executeCommand('undo')}
          className="p-1.5 sm:p-2 shrink-0 bg-white text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-slate-200 shadow-xs hover:border-blue-200"
          title="بازگردانی (Undo)"
        >
          <Undo className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('redo')}
          className="p-1.5 sm:p-2 shrink-0 bg-white text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-slate-200 shadow-xs hover:border-blue-200"
          title="تکرار مجدد (Redo)"
        >
          <Redo className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>

      {/* Editable Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        dir="rtl"
        data-placeholder={placeholder}
        className="p-3 sm:p-4 min-h-[150px] sm:min-h-[220px] max-h-[350px] sm:max-h-[500px] overflow-y-auto outline-none text-slate-700 leading-relaxed text-sm sm:text-base font-normal prose prose-slate max-w-none focus:outline-none rounded-b-2xl"
        style={{ direction: 'rtl', textAlign: 'right' }}
      />
    </div>
  );
}
