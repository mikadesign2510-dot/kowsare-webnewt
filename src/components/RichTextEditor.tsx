import React, { useRef, useEffect, useState } from 'react';
import { 
  Bold, Italic, Underline, Strikethrough, 
  AlignRight, AlignCenter, AlignLeft, AlignJustify,
  List, ListOrdered, Link as LinkIcon, Image as ImageIcon,
  Heading1, Heading2, Heading3, Quote, Eraser,
  Undo, Redo, Palette, Type, ChevronDown, Check,
  Maximize2, Minimize2, Sparkles, Highlighter
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const FONT_SIZE_OPTIONS = [
  { label: 'کوچک (۱۲px)', value: '1', cssSize: '12px' },
  { label: 'متوسط - پیش‌فرض (۱۴px)', value: '3', cssSize: '14px' },
  { label: 'خوانا و استاندارد (۱۶px)', value: '4', cssSize: '16px' },
  { label: 'بزرگ (۱۸px)', value: '5', cssSize: '18px' },
  { label: 'خیلی بزرگ (۲۴px)', value: '6', cssSize: '24px' },
];

const FONT_WEIGHT_OPTIONS = [
  { label: 'عادی (معمولی)', weight: '400' },
  { label: 'متوسط (نیمه‌پر)', weight: '500' },
  { label: 'ضخیم (بولد)', weight: '700' },
  { label: 'خیلی ضخیم (تیتر)', weight: '900' },
];

const LINE_HEIGHT_OPTIONS = [
  { label: 'فاصله خطوط فشرده', value: '1.6' },
  { label: 'فاصله خطوط استاندارد', value: '1.9' },
  { label: 'فاصله خطوط باز و خوانا', value: '2.2' },
];

const TEXT_COLORS = [
  { color: '#0f172a', name: 'مشکی تیره (متن اصلی)' },
  { color: '#334155', name: 'خاکستری تیره' },
  { color: '#2563eb', name: 'آبی دانشگاهی' },
  { color: '#0284c7', name: 'آبی آسمانی' },
  { color: '#059669', name: 'سبز زمردی' },
  { color: '#d97706', name: 'کهربایی / هشدار' },
  { color: '#dc2626', name: 'قرمز یاقوتی' },
  { color: '#7c3aed', name: 'بنفش مدرن' },
  { color: '#db2777', name: 'سرخابی' },
  { color: '#475569', name: 'طوسی متالیک' },
];

const HIGHLIGHT_COLORS = [
  { color: 'transparent', name: 'بدون هایلایت' },
  { color: '#fef08a', name: 'زرد فسفری' },
  { color: '#bbf7d0', name: 'سبز روشن' },
  { color: '#bfdbfe', name: 'آبی آسمانی روشن' },
  { color: '#fbcfe8', name: 'صورتی ملایم' },
  { color: '#fed7aa', name: 'نارنجی ملایم' },
];

export default function RichTextEditor({ value, onChange, placeholder = 'متن و محتوای جامع خبر را در اینجا بنویسید...' }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showFontSizePicker, setShowFontSizePicker] = useState(false);
  const [showLineHeightPicker, setShowLineHeightPicker] = useState(false);
  const [activeColor, setActiveColor] = useState('#0f172a');
  const [activeLineHeight, setActiveLineHeight] = useState('1.9');
  const [currentFontSizeLabel, setCurrentFontSizeLabel] = useState('استاندارد (۱۶px)');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  // Calculate word and character count
  const updateCounts = (htmlText: string) => {
    const textOnly = htmlText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    setCharCount(textOnly.length);
    setWordCount(textOnly ? textOnly.split(' ').length : 0);
  };

  // Synchronize external value with contentEditable
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
      updateCounts(value || '');
    }
  }, [value]);

  const executeCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      onChange(editorRef.current.innerHTML);
      updateCounts(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      updateCounts(editorRef.current.innerHTML);
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

  const applyLineHeight = (lh: string) => {
    setActiveLineHeight(lh);
    if (editorRef.current) {
      editorRef.current.style.lineHeight = lh;
    }
    setShowLineHeightPicker(false);
  };

  return (
    <div className={`border border-slate-200 rounded-3xl bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-400 transition-all relative flex flex-col font-['Vazirmatn'] ${
      isFullscreen ? 'fixed inset-4 z-50 shadow-2xl bg-white flex flex-col' : ''
    }`}>
      {/* Enhanced Multi-Tier Toolbar */}
      <div className="bg-slate-50/90 backdrop-blur-md border-b border-slate-200/80 p-2 sm:p-3 flex items-center justify-between gap-2 text-slate-700 select-none z-10 rounded-t-3xl flex-wrap">
        
        {/* Left/Start Actions Group */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
          
          {/* Typography & Headings Dropdown/Buttons */}
          <div className="flex items-center bg-white rounded-xl border border-slate-200/90 p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => executeCommand('formatBlock', '<h2>')}
              className="px-2.5 py-1.5 text-xs font-black text-slate-700 hover:text-blue-600 hover:bg-blue-50/80 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
              title="تیتر اصلی (H2)"
            >
              <Heading2 className="w-3.5 h-3.5 text-blue-600" />
              <span>تیتر بزرگ</span>
            </button>
            <div className="h-4 w-[1px] bg-slate-200" />
            <button
              type="button"
              onClick={() => executeCommand('formatBlock', '<h3>')}
              className="px-2 py-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 hover:bg-blue-50/80 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
              title="زیرتیتر (H3)"
            >
              <Heading3 className="w-3.5 h-3.5 text-slate-500" />
              <span>زیرتیتر</span>
            </button>
            <div className="h-4 w-[1px] bg-slate-200" />
            <button
              type="button"
              onClick={() => executeCommand('formatBlock', '<p>')}
              className="px-2.5 py-1.5 text-[11px] font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50/80 rounded-lg transition-all cursor-pointer"
              title="متن عادی"
            >
              پاراگراف
            </button>
          </div>

          <div className="h-5 w-[1px] bg-slate-200 mx-0.5 hidden sm:block"></div>

          {/* Font Size Selector (Customizable with Vazirmatn scale) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowFontSizePicker(!showFontSizePicker);
                setShowColorPicker(false);
                setShowHighlightPicker(false);
                setShowLineHeightPicker(false);
              }}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-100/80 text-slate-700 rounded-xl transition-all border border-slate-200/90 shadow-2xs flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="اندازه فونت وزیرمتن"
            >
              <Type className="w-3.5 h-3.5 text-blue-600" />
              <span>{currentFontSizeLabel}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showFontSizePicker && (
              <div className="absolute top-full mt-1.5 right-0 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-xl z-30 w-52 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 border-b border-slate-100 mb-1">
                  انتخاب سایز متن (فونت وزیرمتن)
                </div>
                {FONT_SIZE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      executeCommand('fontSize', opt.value);
                      setCurrentFontSizeLabel(opt.label.split(' ')[0]);
                      setShowFontSizePicker(false);
                    }}
                    className="w-full text-right px-2.5 py-1.5 text-xs rounded-xl hover:bg-blue-50 text-slate-700 hover:text-blue-600 transition-colors flex items-center justify-between"
                  >
                    <span>{opt.label}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{opt.cssSize}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Line Height Selector */}
          <div className="relative hidden md:block">
            <button
              type="button"
              onClick={() => {
                setShowLineHeightPicker(!showLineHeightPicker);
                setShowColorPicker(false);
                setShowHighlightPicker(false);
                setShowFontSizePicker(false);
              }}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-100/80 text-slate-700 rounded-xl transition-all border border-slate-200/90 shadow-2xs flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="فاصله خطوط متن"
            >
              <span className="text-slate-400 text-[11px]">فاصله خطوط</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showLineHeightPicker && (
              <div className="absolute top-full mt-1.5 right-0 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-xl z-30 w-44 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                {LINE_HEIGHT_OPTIONS.map((lh) => (
                  <button
                    key={lh.value}
                    type="button"
                    onClick={() => applyLineHeight(lh.value)}
                    className={`w-full text-right px-2.5 py-1.5 text-xs rounded-xl transition-colors flex items-center justify-between ${
                      activeLineHeight === lh.value ? 'bg-blue-50 text-blue-600 font-bold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>{lh.label}</span>
                    {activeLineHeight === lh.value && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-5 w-[1px] bg-slate-200 mx-0.5"></div>

          {/* Basic Formats Group */}
          <div className="flex items-center bg-white rounded-xl border border-slate-200/90 p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => executeCommand('bold')}
              className="p-1.5 text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all font-black cursor-pointer"
              title="ضخیم (Bold)"
            >
              <Bold className="w-4 h-4 stroke-[2.5]" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('italic')}
              className="p-1.5 text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
              title="مورب (Italic)"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('underline')}
              className="p-1.5 text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
              title="خط زیرین (Underline)"
            >
              <Underline className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('strikeThrough')}
              className="p-1.5 text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
              title="خط خورده (Strikethrough)"
            >
              <Strikethrough className="w-4 h-4" />
            </button>
          </div>

          {/* Color & Highlight Pickers */}
          <div className="flex items-center bg-white rounded-xl border border-slate-200/90 p-0.5 shadow-2xs">
            {/* Text Color */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowColorPicker(!showColorPicker);
                  setShowHighlightPicker(false);
                  setShowFontSizePicker(false);
                  setShowLineHeightPicker(false);
                }}
                className="p-1.5 text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                title="رنگ متن"
              >
                <Palette className="w-4 h-4 text-blue-600" />
                <div className="w-3 h-3 rounded-full border border-slate-300 shadow-2xs" style={{ backgroundColor: activeColor }} />
              </button>
              
              {showColorPicker && (
                <div className="absolute top-full mt-2 right-0 bg-white border border-slate-200 rounded-2xl p-3 shadow-xl z-30 w-56 animate-in fade-in zoom-in-95 duration-150">
                  <span className="block text-[11px] font-bold text-slate-500 mb-2 border-b border-slate-100 pb-1">
                    پالت رنگ‌های سازمانی و استاندارد
                  </span>
                  <div className="grid grid-cols-5 gap-2">
                    {TEXT_COLORS.map(c => (
                      <button
                        key={c.color}
                        type="button"
                        onClick={() => {
                          setActiveColor(c.color);
                          executeCommand('foreColor', c.color);
                          setShowColorPicker(false);
                        }}
                        className="w-7 h-7 rounded-xl border border-slate-200 hover:scale-115 hover:shadow-md transition-all flex items-center justify-center cursor-pointer"
                        style={{ backgroundColor: c.color }}
                        title={c.name}
                      >
                        {activeColor === c.color && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Background Highlight */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowHighlightPicker(!showHighlightPicker);
                  setShowColorPicker(false);
                  setShowFontSizePicker(false);
                  setShowLineHeightPicker(false);
                }}
                className="p-1.5 text-slate-700 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                title="رنگ پس‌زمینه متن (هایلایت)"
              >
                <div className="w-4 h-4 rounded bg-amber-200 border border-amber-400 flex items-center justify-center text-[10px] font-black text-amber-900">
                  A
                </div>
              </button>

              {showHighlightPicker && (
                <div className="absolute top-full mt-2 right-0 bg-white border border-slate-200 rounded-2xl p-3 shadow-xl z-30 w-48 animate-in fade-in zoom-in-95 duration-150">
                  <span className="block text-[11px] font-bold text-slate-500 mb-2 border-b border-slate-100 pb-1">
                    هایلایت و نشانه‌گذاری متن
                  </span>
                  <div className="space-y-1">
                    {HIGHLIGHT_COLORS.map(h => (
                      <button
                        key={h.name}
                        type="button"
                        onClick={() => {
                          executeCommand('hiliteColor', h.color);
                          setShowHighlightPicker(false);
                        }}
                        className="w-full text-right px-2.5 py-1.5 text-xs rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2"
                      >
                        <div className="w-4 h-4 rounded border border-slate-300" style={{ backgroundColor: h.color }} />
                        <span className="text-slate-700">{h.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="h-5 w-[1px] bg-slate-200 mx-0.5"></div>

          {/* Alignments */}
          <div className="flex items-center bg-white rounded-xl border border-slate-200/90 p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => executeCommand('justifyRight')}
              className="p-1.5 text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
              title="راست‌چین"
            >
              <AlignRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('justifyCenter')}
              className="p-1.5 text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
              title="وسط‌چین"
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('justifyLeft')}
              className="p-1.5 text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
              title="چپ‌چین"
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('justifyFull')}
              className="p-1.5 text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
              title="تراز از دو طرف (Justify)"
            >
              <AlignJustify className="w-4 h-4" />
            </button>
          </div>

          <div className="h-5 w-[1px] bg-slate-200 mx-0.5"></div>

          {/* Lists, Quote & Structure */}
          <div className="flex items-center bg-white rounded-xl border border-slate-200/90 p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => executeCommand('insertUnorderedList')}
              className="p-1.5 text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
              title="لیست نشانه‌دار (گلوله‌ای)"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('insertOrderedList')}
              className="p-1.5 text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
              title="لیست عددی (شماره‌دار)"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('formatBlock', '<blockquote>')}
              className="p-1.5 text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
              title="نقل قول برجسته"
            >
              <Quote className="w-4 h-4" />
            </button>
          </div>

          {/* Media & Links */}
          <div className="flex items-center bg-white rounded-xl border border-slate-200/90 p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={handleInsertLink}
              className="p-1.5 text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
              title="درج پیوند (لینک)"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleInsertImage}
              className="p-1.5 text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
              title="درج تصویر مستقیم با آدرس اینترنتی"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('removeFormat')}
              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
              title="پاکسازی قالب‌بندی متن‌های کپی‌شده"
            >
              <Eraser className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right/End Controls (Undo/Redo & Fullscreen) */}
        <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200/90 p-0.5 shadow-2xs">
          <button
            type="button"
            onClick={() => executeCommand('undo')}
            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
            title="بازگردانی مرحله قبل (Undo)"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('redo')}
            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
            title="انجام مجدد (Redo)"
          >
            <Redo className="w-4 h-4" />
          </button>
          <div className="h-4 w-[1px] bg-slate-200" />
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
            title={isFullscreen ? 'خروج از حالت تمام‌صفحه' : 'حالت تمام‌صفحه و فضای نگارش بزرگ'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main High-Performance Editable Canvas */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        dir="rtl"
        data-placeholder={placeholder}
        className={`p-5 sm:p-7 outline-none text-slate-800 text-base font-normal prose prose-slate max-w-none focus:outline-none rounded-b-3xl transition-all overflow-y-auto selection:bg-blue-100 selection:text-blue-900 ${
          isFullscreen 
            ? 'flex-1 min-h-[60vh] max-h-[calc(100vh-140px)] text-lg leading-loose' 
            : 'min-h-[220px] sm:min-h-[300px] max-h-[550px]'
        }`}
        style={{ 
          direction: 'rtl', 
          textAlign: 'right',
          fontFamily: 'Vazirmatn, system-ui, sans-serif',
          lineHeight: activeLineHeight,
        }}
      />

      {/* Enhanced Status & Typography Helper Footer */}
      <div className="bg-slate-50/80 border-t border-slate-200/80 px-4 py-2 text-[11px] text-slate-500 rounded-b-3xl flex items-center justify-between flex-wrap gap-2 select-none">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-bold text-slate-600">
            <Sparkles className="w-3 h-3 text-blue-500" />
            <span>فونت فعال: وزیرمتن استاندارد (Vazirmatn)</span>
          </span>
          <span className="text-slate-300">|</span>
          <span>جهت نوشتار: راست‌به‌چپ (RTL)</span>
        </div>

        <div className="flex items-center gap-3 font-medium text-slate-500">
          <span>{wordCount.toLocaleString('fa-IR')} کلمه</span>
          <span className="text-slate-300">|</span>
          <span>{charCount.toLocaleString('fa-IR')} کاراکتر</span>
        </div>
      </div>
    </div>
  );
}
