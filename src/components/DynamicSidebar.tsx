import React from 'react';
import { SidebarWidget } from '../lib/storage';
import { Link } from 'react-router-dom';
import {
  LayoutTemplate,
  BookOpen,
  ExternalLink,
  Clock,
  FileText,
  Award,
  HelpCircle,
  Sparkles,
  Layers,
  Tag,
  Link2,
  UserPlus,
  Building2,
  Globe,
  Download,
  GraduationCap,
  Phone,
  Mail,
  Compass,
  Share2,
  CheckCircle2,
  ArrowLeft,
  Users,
  MonitorPlay,
  Briefcase,
  BookOpenCheck,
  TrendingUp,
  Star,
  ShieldCheck,
  Calendar,
  MapPin,
  Info,
  Bell,
  FileCheck,
  Newspaper,
  Image as ImageIcon,
  Video
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutTemplate,
  BookOpen,
  ExternalLink,
  Clock,
  FileText,
  Award,
  HelpCircle,
  Sparkles,
  Layers,
  Tag,
  Link2,
  UserPlus,
  Building2,
  Globe,
  Download,
  GraduationCap,
  Phone,
  Mail,
  Compass,
  Share2,
  CheckCircle2,
  Users,
  MonitorPlay,
  Briefcase,
  BookOpenCheck,
  TrendingUp,
  Star,
  ShieldCheck,
  Calendar,
  MapPin,
  Info,
  Bell,
  FileCheck,
  Newspaper,
  Image: ImageIcon,
  Video
};

interface DynamicSidebarProps {
  widgets: SidebarWidget[];
  dynamicData?: {
    categories?: { name: string; count: number }[];
    onCategoryClick?: (name: string) => void;
    activeCategory?: string;
    tags?: string[];
    onTagClick?: (tag: string) => void;
    activeTag?: string;
    higherEdSystems?: any[];
  }
}

export default function DynamicSidebar({ widgets, dynamicData }: DynamicSidebarProps) {
  const activeWidgets = widgets
    .filter(w => w.isActive)
    .sort((a, b) => a.order - b.order);

  const getIcon = (iconName: string, className: string = "w-5 h-5 text-blue-600") => {
    const IconComponent = iconMap[iconName] || LayoutTemplate;
    return <IconComponent className={className} />;
  };

  const getBgColor = (colorStr?: string) => {
    switch (colorStr) {
      case 'blue': return 'bg-blue-50/70 hover:bg-blue-100/70 text-blue-800';
      case 'emerald': return 'bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-800';
      case 'amber': return 'bg-amber-50/70 hover:bg-amber-100/70 text-amber-800';
      case 'rose': return 'bg-rose-50/70 hover:bg-rose-100/70 text-rose-800';
      case 'slate': return 'bg-slate-50 hover:bg-slate-100 text-slate-700';
      default: return 'bg-slate-50 hover:bg-slate-100 text-slate-700';
    }
  };

  return (
    <>
      {activeWidgets.map((widget) => (
        <div key={widget.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
            {getIcon(widget.iconName)}
            {widget.title}
          </h3>

          {/* Text / HTML content */}
          {(widget.type === 'text' || widget.type === 'html') && widget.content && (
            <div 
              className="text-xs text-slate-600 leading-relaxed font-light [&_ul]:space-y-3 [&_strong]:font-bold"
              dangerouslySetInnerHTML={{ 
                __html: widget.content.includes('<')
                  ? widget.content.replace(/<CheckCircle2[^>]*>/g, '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-500 shrink-0 mt-0.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>')
                  : widget.content.split('\n').filter(Boolean).map(line => `<p class="py-1">${line}</p>`).join('')
              }}
            />
          )}

          {/* Links content */}
          {widget.type === 'links' && widget.links && widget.links.length > 0 && (
            <div className="space-y-2 text-xs font-bold">
              {widget.links.map(link => {
                const isExternal = link.url.startsWith('http');
                const className = `flex items-center justify-between p-3 rounded-2xl transition-all ${getBgColor(link.bgColor)}`;
                
                if (isExternal) {
                  return (
                    <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className={className}>
                      <div className="flex items-center gap-2">
                        {link.iconName && getIcon(link.iconName, "w-4 h-4")}
                        <span>{link.title}</span>
                      </div>
                      <ArrowLeft className="w-4 h-4 opacity-50" />
                    </a>
                  );
                }
                
                return (
                  <Link key={link.id} to={link.url} className={className}>
                    <div className="flex items-center gap-2">
                      {link.iconName && getIcon(link.iconName, "w-4 h-4")}
                      <span>{link.title}</span>
                    </div>
                    <ArrowLeft className="w-4 h-4 opacity-50" />
                  </Link>
                );
              })}
            </div>
          )}

          {/* Dynamic Categories */}
          {widget.type === 'dynamic_categories' && dynamicData?.categories && (
            <div className="space-y-1.5">
              {dynamicData.categories.map(({ name, count }) => (
                <button
                  key={name}
                  onClick={() => dynamicData.onCategoryClick?.(name)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    dynamicData.activeCategory === name
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                  }`}
                >
                  <span>{name}</span>
                  <span className={`px-2 py-0.5 rounded-md ${
                    dynamicData.activeCategory === name ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {count}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Dynamic Tags */}
          {widget.type === 'dynamic_tags' && dynamicData?.tags && (
            <div className="flex flex-wrap gap-2">
              {dynamicData.tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => dynamicData.onTagClick?.(tag)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                    dynamicData.activeTag === tag
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span className="opacity-50">#</span>
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Higher Ed Systems */}
          {widget.type === 'higher_ed_systems' && dynamicData?.higherEdSystems && (
            <div className="space-y-3">
              {dynamicData.higherEdSystems.filter(sys => sys.isActive).map(sys => (
                <a
                  key={sys.id}
                  href={sys.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-blue-50 hover:border-blue-200 hover:shadow-sm transition-all group"
                >
                  {sys.logoUrl ? (
                    <img src={sys.logoUrl} alt={sys.title} className="w-10 h-10 object-contain bg-white rounded-xl p-1 shadow-sm" />
                  ) : (
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                      <ExternalLink className="w-5 h-5" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 group-hover:text-blue-700 truncate">{sys.title}</p>
                    <p className="text-[10px] text-slate-500 truncate" dir="ltr">{sys.url.replace(/^https?:\/\//i, '')}</p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      ))}
    </>
  );
}
