import React, { useState, useEffect } from 'react';
import { SidebarWidget } from '../../lib/storage';
import { 
  Edit2, Eye, EyeOff, LayoutTemplate, Layers, RotateCcw, LinkIcon, BookOpen, 
  Clock, Settings, Save, X, ExternalLink, Trash2, Plus, ArrowUp, ArrowDown,
  CheckCircle2, Info, Sparkles, HelpCircle, PhoneCall, AlertCircle, ListPlus,
  Type, Code, Check, Star, Pin, Calendar, ShieldCheck
} from 'lucide-react';

interface SidebarWidgetsEditorProps {
  widgets: SidebarWidget[];
  onChange: (widgets: SidebarWidget[]) => void;
}

interface StructuredItem {
  id: string;
  type: 'bullet' | 'key_value' | 'callout' | 'paragraph';
  title?: string;
  text: string;
  icon?: 'check' | 'clock' | 'star' | 'info' | 'phone' | 'pin';
}

const DEFAULT_WIDGETS: SidebarWidget[] = [
  {
    id: 'fw_guide',
    title: 'راهنمای تحویل و پیگیری فرم‌ها',
    iconName: 'BookOpen',
    type: 'text',
    isActive: true,
    order: 1,
    content: '<ul class="space-y-3 text-xs text-slate-600 leading-relaxed font-light"><li class="flex items-start gap-2"><svg class="text-emerald-500 shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg><span><strong>پرینت باکیفیت:</strong> فرم‌ها را روی کاغذ استاندارد A4 با خط خوانا یا تایپ شده تکمیل نمایید.</span></li><li class="flex items-start gap-2"><svg class="text-emerald-500 shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg><span><strong>امضای متقاضی:</strong> امضای دانشجو و درج تاریخ روز در انتهای کلیه فرم‌ها الزامی است.</span></li><li class="flex items-start gap-2"><svg class="text-emerald-500 shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg><span><strong>تحویل حضوری یا الکترونیکی:</strong> فرم‌های آموزشی به کارشناس آموزش و فرم‌های وام به امور مالی تحویل داده شود.</span></li></ul>'
  },
  {
    id: 'fw_links',
    title: 'سامانه‌های مرتبط و ضروری',
    iconName: 'ExternalLink',
    type: 'higher_ed_systems',
    isActive: true,
    order: 2,
    links: []
  },
  {
    id: 'fw_hours',
    title: 'ساعات پاسخگویی کارشناسان',
    iconName: 'Clock',
    type: 'text',
    isActive: true,
    order: 3,
    content: '<div class="space-y-3"><div class="flex items-center justify-between py-2 border-b border-slate-100"><span class="text-xs font-bold text-slate-600">شنبه تا چهارشنبه</span><span class="text-xs text-slate-500">۰۸:۰۰ صبح تا ۱۴:۳۰ ظهر</span></div><div class="flex items-center justify-between py-2 border-b border-slate-100"><span class="text-xs font-bold text-slate-600">پنج‌شنبه‌ها</span><span class="text-xs text-slate-500">۰۸:۰۰ صبح تا ۱۲:۰۰ ظهر</span></div><div class="pt-2"><p class="text-[10px] text-slate-400 leading-relaxed text-justify">جهت پیگیری امور خارج از ساعات اداری، لطفاً درخواست خود را از طریق تیکت یا تماس با تلفن‌های ضروری ارسال نمایید.</p></div></div>'
  }
];

// Helper: parse HTML into structured items
function parseHtmlToItems(html: string): { items: StructuredItem[], note: string } {
  if (!html || !html.trim()) {
    return { items: [], note: '' };
  }

  const items: StructuredItem[] = [];
  let note = '';

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // 1. Check for list items <li>
    const lis = doc.querySelectorAll('li');
    if (lis.length > 0) {
      lis.forEach((li, idx) => {
        const strong = li.querySelector('strong');
        let title = strong ? strong.textContent?.replace(/:$/, '').trim() : '';
        let fullText = li.textContent || '';
        if (title && fullText.startsWith(title)) {
          fullText = fullText.substring(title.length).replace(/^[:\s-]+/, '').trim();
        }
        items.push({
          id: `item_${idx}_${Date.now()}`,
          type: 'bullet',
          title: title || undefined,
          text: fullText || li.textContent || '',
          icon: 'check'
        });
      });
      return { items, note };
    }

    // 2. Check for key-value row divs
    const rows = doc.querySelectorAll('.border-b');
    if (rows.length > 0) {
      rows.forEach((row, idx) => {
        const spans = row.querySelectorAll('span');
        if (spans.length >= 2) {
          items.push({
            id: `item_${idx}_${Date.now()}`,
            type: 'key_value',
            title: spans[0].textContent?.trim() || '',
            text: spans[1].textContent?.trim() || '',
            icon: 'clock'
          });
        }
      });
      
      // Look for footnote paragraph
      const noteEl = doc.querySelector('.pt-2 p, p.text-\\[10px\\]');
      if (noteEl) {
        note = noteEl.textContent?.trim() || '';
      }
      return { items, note };
    }

    // 3. Fallback: split paragraphs
    const ps = doc.querySelectorAll('p');
    if (ps.length > 0) {
      ps.forEach((p, idx) => {
        items.push({
          id: `item_${idx}_${Date.now()}`,
          type: 'paragraph',
          text: p.textContent?.trim() || ''
        });
      });
      return { items, note };
    }
  } catch (e) {
    console.warn('Error parsing widget HTML:', e);
  }

  // Fallback plain text lines
  const lines = html.replace(/<[^>]*>/g, '\n').split('\n').map(l => l.trim()).filter(Boolean);
  lines.forEach((line, idx) => {
    items.push({
      id: `item_${idx}_${Date.now()}`,
      type: 'bullet',
      text: line,
      icon: 'check'
    });
  });

  return { items, note };
}

// Helper: build clean HTML from structured items
function buildHtmlFromItems(items: StructuredItem[], note: string = ''): string {
  if (!items || items.length === 0) {
    if (note) {
      return `<div class="bg-blue-50/60 p-3 rounded-xl border border-blue-100 text-xs text-blue-800 leading-relaxed">${note}</div>`;
    }
    return '';
  }

  // Check if all are key-value
  const isKeyValue = items.every(it => it.type === 'key_value');
  if (isKeyValue) {
    let html = '<div class="space-y-3">';
    items.forEach(item => {
      html += `<div class="flex items-center justify-between py-2 border-b border-slate-100"><span class="text-xs font-bold text-slate-600">${item.title || ''}</span><span class="text-xs text-slate-500 font-medium">${item.text}</span></div>`;
    });
    if (note && note.trim()) {
      html += `<div class="pt-2"><p class="text-[10px] text-slate-400 leading-relaxed text-justify">${note.trim()}</p></div>`;
    }
    html += '</div>';
    return html;
  }

  // Check if mixed or bullet list
  let html = '<ul class="space-y-3 text-xs text-slate-600 leading-relaxed font-light">';
  items.forEach(item => {
    if (item.type === 'callout') {
      html += `<li class="bg-amber-50/80 p-3 rounded-xl border border-amber-200/60 text-amber-900 font-medium">${item.title ? `<strong>${item.title}: </strong>` : ''}${item.text}</li>`;
    } else if (item.type === 'key_value') {
      html += `<li class="flex items-center justify-between py-1.5 border-b border-slate-100"><span class="font-bold text-slate-700">${item.title || ''}</span><span class="text-slate-500">${item.text}</span></li>`;
    } else {
      // standard bullet with emerald checkmark
      html += `<li class="flex items-start gap-2"><svg class="text-emerald-500 shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg><span>${item.title ? `<strong>${item.title}: </strong>` : ''}${item.text}</span></li>`;
    }
  });
  html += '</ul>';

  if (note && note.trim()) {
    html += `<div class="pt-3 mt-2 border-t border-slate-100"><p class="text-[11px] text-slate-400 leading-relaxed text-justify">${note.trim()}</p></div>`;
  }

  return html;
}

export default function SidebarWidgetsEditor({ widgets = [], onChange }: SidebarWidgetsEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<'visual_items' | 'freetext' | 'html'>('visual_items');
  const [previewTab, setPreviewTab] = useState<'edit' | 'preview'>('edit');
  
  // Custom confirmation dialog state
  const [widgetToDelete, setWidgetToDelete] = useState<{ id: string; title: string } | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);

  // Working local state for current editing widget
  const [localItems, setLocalItems] = useState<StructuredItem[]>([]);
  const [localNote, setLocalNote] = useState<string>('');
  const [localFreeText, setLocalFreeText] = useState<string>('');

  const currentWidgets = (widgets && widgets.length > 0) ? widgets : [];

  // When opening a widget for editing, parse its content into local items
  const startEditing = (widget: SidebarWidget) => {
    setEditingId(widget.id);
    setPreviewTab('edit');
    if (widget.type === 'text' || widget.type === 'html') {
      const { items, note } = parseHtmlToItems(widget.content || '');
      setLocalItems(items);
      setLocalNote(note);
      // plain text representation
      const plain = items.map(it => (it.title ? `${it.title}: ` : '') + it.text).join('\n');
      setLocalFreeText(plain + (note ? `\n\n[پانویس]: ${note}` : ''));
    }
  };

  const updateWidget = (id: string, updates: Partial<SidebarWidget>) => {
    const newWidgets = currentWidgets.map(w => w.id === id ? { ...w, ...updates } : w);
    onChange(newWidgets);
  };

  const confirmDeleteWidget = () => {
    if (!widgetToDelete) return;
    const id = widgetToDelete.id;
    const newWidgets = currentWidgets.filter(w => w.id !== id);
    onChange(newWidgets);
    if (editingId === id) setEditingId(null);
    setWidgetToDelete(null);
  };

  const confirmRestoreDefaults = () => {
    onChange(DEFAULT_WIDGETS);
    setEditingId(null);
    setShowRestoreConfirm(false);
  };

  const addNewWidget = (type: 'text' | 'higher_ed_systems' = 'text') => {
    const newId = `widget_${Date.now()}`;
    const newWidget: SidebarWidget = {
      id: newId,
      title: type === 'higher_ed_systems' ? 'سامانه‌های آموزشی دانشگاه' : 'باکس راهنما یا اطلاعیه جدید',
      iconName: type === 'higher_ed_systems' ? 'ExternalLink' : 'BookOpen',
      type: type,
      isActive: true,
      order: currentWidgets.length + 1,
      content: type === 'text' 
        ? '<ul class="space-y-3 text-xs text-slate-600 leading-relaxed font-light"><li class="flex items-start gap-2"><svg class="text-emerald-500 shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg><span><strong>مورد اول:</strong> متن توضیح مورد اول را اینجا بنویسید.</span></li><li class="flex items-start gap-2"><svg class="text-emerald-500 shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg><span><strong>مورد دوم:</strong> متن توضیح مورد دوم را اینجا بنویسید.</span></li></ul>' 
        : '',
      links: []
    };
    onChange([...currentWidgets, newWidget]);
    startEditing(newWidget);
  };

  const moveWidget = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentWidgets.length) return;

    const list = [...currentWidgets];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    const updated = list.map((w, idx) => ({ ...w, order: idx + 1 }));
    onChange(updated);
  };

  // Structured items helpers
  const handleAddItem = (type: StructuredItem['type'] = 'bullet') => {
    const newItem: StructuredItem = {
      id: `item_${Date.now()}`,
      type,
      title: type === 'key_value' ? 'شنبه تا چهارشنبه' : 'عنوان سطر جدید',
      text: type === 'key_value' ? '۰۸:۰۰ الی ۱۴:۰۰' : 'توضیحات این بند را اینجا بنویسید...',
      icon: 'check'
    };
    const updated = [...localItems, newItem];
    setLocalItems(updated);
    if (editingId) {
      const generatedHtml = buildHtmlFromItems(updated, localNote);
      updateWidget(editingId, { content: generatedHtml });
    }
  };

  const handleUpdateItem = (id: string, updates: Partial<StructuredItem>) => {
    const updated = localItems.map(it => it.id === id ? { ...it, ...updates } : it);
    setLocalItems(updated);
    if (editingId) {
      const generatedHtml = buildHtmlFromItems(updated, localNote);
      updateWidget(editingId, { content: generatedHtml });
    }
  };

  const handleRemoveItem = (id: string) => {
    const updated = localItems.filter(it => it.id !== id);
    setLocalItems(updated);
    if (editingId) {
      const generatedHtml = buildHtmlFromItems(updated, localNote);
      updateWidget(editingId, { content: generatedHtml });
    }
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= localItems.length) return;
    const list = [...localItems];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;
    setLocalItems(list);
    if (editingId) {
      const generatedHtml = buildHtmlFromItems(list, localNote);
      updateWidget(editingId, { content: generatedHtml });
    }
  };

  const handleNoteChange = (newNote: string) => {
    setLocalNote(newNote);
    if (editingId) {
      const generatedHtml = buildHtmlFromItems(localItems, newNote);
      updateWidget(editingId, { content: generatedHtml });
    }
  };

  // Convert free-text to items and HTML
  const handleFreeTextChange = (text: string) => {
    setLocalFreeText(text);
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const newItems: StructuredItem[] = lines.map((line, idx) => {
      let title = '';
      let content = line;
      if (line.includes(':')) {
        const parts = line.split(':');
        title = parts[0].trim();
        content = parts.slice(1).join(':').trim();
      } else if (line.includes('-')) {
        const parts = line.split('-');
        title = parts[0].trim();
        content = parts.slice(1).join('-').trim();
      }
      return {
        id: `ft_item_${idx}_${Date.now()}`,
        type: 'bullet',
        title: title || undefined,
        text: content || line,
        icon: 'check'
      };
    });
    setLocalItems(newItems);
    if (editingId) {
      const generatedHtml = buildHtmlFromItems(newItems, localNote);
      updateWidget(editingId, { content: generatedHtml });
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'BookOpen': return <BookOpen className="w-5 h-5" />;
      case 'Clock': return <Clock className="w-5 h-5" />;
      case 'ExternalLink': return <ExternalLink className="w-5 h-5" />;
      case 'Info': return <Info className="w-5 h-5" />;
      case 'HelpCircle': return <HelpCircle className="w-5 h-5" />;
      case 'PhoneCall': return <PhoneCall className="w-5 h-5" />;
      case 'Layers': return <Layers className="w-5 h-5" />;
      default: return <LayoutTemplate className="w-5 h-5" />;
    }
  };

  const activeEditingWidget = currentWidgets.find(w => w.id === editingId);

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-700">تعداد کل باکس‌ها: {currentWidgets.length}</span>
          <span className="text-slate-300">|</span>
          <span className="text-xs text-emerald-600 font-bold">فعال و در حال نمایش: {currentWidgets.filter(w => w.isActive).length}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRestoreConfirm(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 px-3.5 py-2 rounded-xl transition-all shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            بازنشانی باکس‌های پیش‌فرض
          </button>

          <button
            onClick={() => addNewWidget('text')}
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition-all shadow-sm shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            افزودن باکس جدید
          </button>
        </div>
      </div>
      
      {currentWidgets.length === 0 ? (
        <div className="text-center py-16 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <Layers className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-2">هیچ باکسی در سایدبار فرم‌ها تعریف نشده است</h3>
          <p className="text-slate-500 text-xs max-w-md mx-auto mb-6 leading-relaxed">
            شما می‌توانید با یک کلیک باکس‌های پیش‌فرض دانشگاه (ساعات پاسخگویی، سامانه های مرتبط، راهنما) را فعال کنید یا باکس‌های سفارشی دلخواه خود را بسازید.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button 
              onClick={() => setShowRestoreConfirm(true)} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              بازنشانی باکس‌های پیش‌فرض دانشگاه
            </button>
            <button 
              onClick={() => addNewWidget('text')} 
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              ایجاد باکس جدید
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {currentWidgets.map((widget, index) => (
            <div 
              key={widget.id} 
              className={`bg-white rounded-2xl border transition-all ${
                editingId === widget.id 
                  ? 'border-blue-500 shadow-lg ring-4 ring-blue-50' 
                  : widget.isActive 
                    ? 'border-slate-200 shadow-sm hover:border-slate-300' 
                    : 'border-slate-200 bg-slate-50/50 opacity-75'
              }`}
            >
              {/* Card Header (Display) */}
              <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  {/* Order controls */}
                  <div className="flex flex-col gap-1 items-center">
                    <button 
                      onClick={() => moveWidget(index, 'up')}
                      disabled={index === 0}
                      className={`p-1 rounded-lg transition-colors ${index === 0 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`}
                      title="انتقال به بالا"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => moveWidget(index, 'down')}
                      disabled={index === currentWidgets.length - 1}
                      className={`p-1 rounded-lg transition-colors ${index === currentWidgets.length - 1 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`}
                      title="انتقال به پایین"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${widget.isActive ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                    {getIcon(widget.iconName || '')}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-black text-sm sm:text-base truncate ${widget.isActive ? 'text-slate-800' : 'text-slate-500'}`}>
                        {widget.title}
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                        موقعیت #{index + 1}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[11px] font-medium ${
                        widget.type === 'higher_ed_systems' ? 'text-emerald-600 font-bold' : 'text-slate-500'
                      }`}>
                        {widget.type === 'higher_ed_systems' ? '🔗 متصل خودکار به سامانه‌های آموزش عالی' : '📝 متن و راهنمای سفارشی'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => updateWidget(widget.id, { isActive: !widget.isActive })}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                      widget.isActive 
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60' 
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {widget.isActive ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                    {widget.isActive ? 'فعال' : 'غیرفعال'}
                  </button>
                  
                  <button
                    onClick={() => {
                      if (editingId === widget.id) {
                        setEditingId(null);
                      } else {
                        startEditing(widget);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      editingId === widget.id 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {editingId === widget.id ? (
                      <>
                        <X className="w-3.5 h-3.5" />
                        بستن ویرایش
                      </>
                    ) : (
                      <>
                        <Edit2 className="w-3.5 h-3.5" />
                        ویرایش محتوا و متن‌ها
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setWidgetToDelete({ id: widget.id, title: widget.title })}
                    className="p-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-200 rounded-xl transition-colors cursor-pointer"
                    title="حذف کامل این باکس"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Rich Visual Editor Drawer */}
              {editingId === widget.id && (
                <div className="border-t border-slate-200 bg-slate-50/70 p-5 sm:p-7 rounded-b-2xl space-y-6">
                  {/* General details: Title, Icon, Type */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-2xl border border-slate-200">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">عنوان باکس در سایدبار</label>
                      <input 
                        type="text" 
                        value={widget.title}
                        onChange={(e) => updateWidget(widget.id, { title: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="عنوان باکس..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">آیکون باکس</label>
                      <select
                        value={widget.iconName || 'LayoutTemplate'}
                        onChange={(e) => updateWidget(widget.id, { iconName: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="BookOpen">📖 BookOpen (راهنما و آیین‌نامه)</option>
                        <option value="Clock">⏰ Clock (ساعت و زمان اداری)</option>
                        <option value="ExternalLink">🔗 ExternalLink (سامانه‌ها و پیوندها)</option>
                        <option value="Info">ℹ️ Info (اطلاعیه و هشدار)</option>
                        <option value="HelpCircle">❓ HelpCircle (پرسش و پاسخ)</option>
                        <option value="PhoneCall">📞 PhoneCall (تماس و پشتیبانی)</option>
                        <option value="Layers">📑 Layers (لایه‌ها و خدمات)</option>
                        <option value="LayoutTemplate">📋 LayoutTemplate (پیش‌فرض)</option>
                      </select>
                    </div>
                  </div>

                  {widget.type === 'higher_ed_systems' ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700">
                        <LinkIcon className="w-6 h-6" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-bold text-emerald-900 text-sm">همگام‌سازی خودکار و زنده با سامانه‌های آموزش عالی</h4>
                        <p className="text-xs text-emerald-800 leading-relaxed">
                          این باکس به‌صورت کاملاً هوشمند، تمامی سامانه‌هایی که در بخش <strong>«شخصی‌سازی پورتال &gt; سامانه‌های آموزش عالی»</strong> ثبت کرده‌اید (مانند آموزشیار، وادانا، ساجد و...) را به همراه لوگو و دکمه مستقیم به دانشجو نمایش می‌دهد.
                        </p>
                        <p className="text-[11px] text-emerald-600 font-medium">
                          برای افزودن یا تغییر سامانه‌ها، نیازی به ویرایش این باکس نیست؛ به بخش تنظیمات پورتال در منوی بالا مراجعه فرمایید.
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Text & Content Editor with Visual List Builder */
                    <div className="space-y-4">
                      {/* Editor Tool Switcher & Tabs */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                        <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() => { setEditorMode('visual_items'); setPreviewTab('edit'); }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              editorMode === 'visual_items' && previewTab === 'edit'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <ListPlus className="w-3.5 h-3.5" />
                            ویرایشگر سطری (آسان)
                          </button>

                          <button
                            type="button"
                            onClick={() => { setEditorMode('freetext'); setPreviewTab('edit'); }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              editorMode === 'freetext' && previewTab === 'edit'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <Type className="w-3.5 h-3.5" />
                            متن آزاد و خطی
                          </button>

                          <button
                            type="button"
                            onClick={() => { setEditorMode('html'); setPreviewTab('edit'); }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              editorMode === 'html' && previewTab === 'edit'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <Code className="w-3.5 h-3.5" />
                            کد HTML
                          </button>
                        </div>

                        {/* Preview toggle */}
                        <button
                          type="button"
                          onClick={() => setPreviewTab(previewTab === 'preview' ? 'edit' : 'preview')}
                          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            previewTab === 'preview'
                              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {previewTab === 'preview' ? 'بازگشت به ویرایش' : 'پیش‌نمایش زنده در سایت'}
                        </button>
                      </div>

                      {/* Main Viewport */}
                      {previewTab === 'preview' ? (
                        /* Live preview of how it looks for student */
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-inner space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <span className="text-xs font-black text-slate-400">پیش‌نمایش خروجی برای دانشجو در سایدبار:</span>
                            <span className="text-[11px] font-bold text-blue-600">{widget.title}</span>
                          </div>
                          <div 
                            className="text-xs text-slate-600 leading-relaxed font-light [&_ul]:space-y-3 [&_strong]:font-bold"
                            dangerouslySetInnerHTML={{ __html: widget.content || '<p class="text-slate-400">محتوایی ثبت نشده است.</p>' }}
                          />
                        </div>
                      ) : editorMode === 'visual_items' ? (
                        /* Visual Row/Item Editor */
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-slate-600 font-bold">
                              بندها و سطرهای این باکس را به‌صورت دلخواه اضافه، حذف یا ویرایش کنید:
                            </p>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleAddItem('bullet')}
                                className="flex items-center gap-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-xl transition-all shadow-sm"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                افزودن بند متنی با تیک
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAddItem('key_value')}
                                className="flex items-center gap-1 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-xl transition-all"
                              >
                                <Clock className="w-3.5 h-3.5 text-blue-600" />
                                افزودن سطر ساعت / زوجی
                              </button>
                            </div>
                          </div>

                          {localItems.length === 0 ? (
                            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-3">
                              <p className="text-xs text-slate-500">هیچ سطری در این باکس وجود ندارد.</p>
                              <button
                                type="button"
                                onClick={() => handleAddItem('bullet')}
                                className="text-xs font-bold text-blue-600 hover:underline"
                              >
                                + برای افزودن اولین سطر کلیک کنید
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {localItems.map((item, idx) => (
                                <div 
                                  key={item.id}
                                  className="bg-white border border-slate-200 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center gap-3 shadow-sm hover:border-slate-300 transition-colors"
                                >
                                  {/* Item reorder buttons */}
                                  <div className="flex items-center gap-1 shrink-0">
                                    <span className="text-[10px] font-bold text-slate-400 w-4 text-center">{idx + 1}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleMoveItem(idx, 'up')}
                                      disabled={idx === 0}
                                      className={`p-1 rounded ${idx === 0 ? 'text-slate-200' : 'text-slate-400 hover:text-slate-700'}`}
                                      title="بالا"
                                    >
                                      <ArrowUp className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleMoveItem(idx, 'down')}
                                      disabled={idx === localItems.length - 1}
                                      className={`p-1 rounded ${idx === localItems.length - 1 ? 'text-slate-200' : 'text-slate-400 hover:text-slate-700'}`}
                                      title="پایین"
                                    >
                                      <ArrowDown className="w-3 h-3" />
                                    </button>
                                  </div>

                                  {/* Title / Label (Bold prefix) */}
                                  <div className="w-full sm:w-1/3">
                                    <input 
                                      type="text"
                                      value={item.title || ''}
                                      onChange={(e) => handleUpdateItem(item.id, { title: e.target.value })}
                                      placeholder={item.type === 'key_value' ? 'عنوان (مثلاً شنبه تا چهارشنبه)' : 'تیتر پررنگ (اختیاری)'}
                                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>

                                  {/* Description / Main text */}
                                  <div className="w-full sm:flex-1">
                                    <input 
                                      type="text"
                                      value={item.text}
                                      onChange={(e) => handleUpdateItem(item.id, { text: e.target.value })}
                                      placeholder={item.type === 'key_value' ? 'ساعت یا مقدار (مثلاً ۰۸:۰۰ الی ۱۴:۳۰)' : 'توضیحات و متن بند...'}
                                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>

                                  {/* Delete item button */}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItem(item.id)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0 self-end sm:self-center"
                                    title="حذف این سطر"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Footnote / Note Box */}
                          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
                            <label className="block text-xs font-bold text-slate-700">
                              نکته، پانویس یا شماره تماس انتهای باکس (اختیاری):
                            </label>
                            <input 
                              type="text"
                              value={localNote}
                              onChange={(e) => handleNoteChange(e.target.value)}
                              placeholder="مثلاً: جهت پیگیری امور خارج از ساعات اداری از طریق تیکت پیام بفرستید..."
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      ) : editorMode === 'freetext' ? (
                        /* Free text mode */
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold text-slate-700">
                              هر خط را به عنوان یک بند بنویسید (با اینتر سطر بعدی ایجاد می‌شود):
                            </label>
                            <span className="text-[10px] text-slate-400">فرمت خودکار: «عنوان: توضیح»</span>
                          </div>
                          <textarea
                            value={localFreeText}
                            onChange={(e) => handleFreeTextChange(e.target.value)}
                            rows={8}
                            className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs font-medium text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="شنبه تا چهارشنبه: ۰۸:۰۰ الی ۱۴:۳۰&#10;پنج‌شنبه‌ها: ۰۸:۰۰ الی ۱۲:۰۰&#10;پرینت باکیفیت: فرم‌ها روی کاغذ A4 تحویل داده شود"
                          />
                        </div>
                      ) : (
                        /* Raw HTML Code Mode */
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold text-slate-700">
                              کد مستقیم HTML و استایل‌های Tailwind:
                            </label>
                            <span className="text-[10px] text-amber-600 font-bold">حالت پیشرفته</span>
                          </div>
                          <textarea
                            value={widget.content || ''}
                            onChange={(e) => {
                              updateWidget(widget.id, { content: e.target.value });
                              const { items, note } = parseHtmlToItems(e.target.value);
                              setLocalItems(items);
                              setLocalNote(note);
                            }}
                            rows={8}
                            dir="ltr"
                            className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs font-mono text-left text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="<div>...</div>"
                          />
                        </div>
                      )}

                      {/* Save & Done */}
                      <div className="flex justify-end pt-3">
                        <button 
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20"
                        >
                          <Save className="w-4 h-4" />
                          تکمیل و ذخیره تغییرات باکس
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete Widget Confirmation Modal */}
      {widgetToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-4 text-red-600">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">حذف باکس سایدبار</h3>
                <p className="text-xs text-slate-500 mt-0.5">این عملیات قابل بازگشت نخواهد بود.</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-700">
              آیا از حذف باکس <strong className="text-slate-900 font-bold">«{widgetToDelete.title}»</strong> از سایدبار صفحه فرم‌ها اطمینان کامل دارید؟
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setWidgetToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                انصراف
              </button>

              <button
                type="button"
                onClick={confirmDeleteWidget}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-500/20 transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                بله، این باکس حذف شود
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Defaults Confirmation Modal */}
      {showRestoreConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-4 text-blue-600">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">بازنشانی باکس‌های پیش‌فرض</h3>
                <p className="text-xs text-slate-500 mt-0.5">بازگردانی تنظیمات استاندارد دانشگاه</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
              آیا مایل هستید چیدمان و باکس‌های سایدبار به ۳ باکس استاندارد اولیه دانشگاه (راهنمای تحویل، سامانه‌های مرتبط و ساعات پاسخگویی) بازنشانی شوند؟
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRestoreConfirm(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                انصراف
              </button>

              <button
                type="button"
                onClick={confirmRestoreDefaults}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                بله، بازنشانی شود
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
