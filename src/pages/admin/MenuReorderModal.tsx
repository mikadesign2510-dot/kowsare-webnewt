import React, { useState, useEffect } from 'react';
import { X, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableItemProps {
  id: string;
  name: string;
  icon: React.ElementType;
}

const SortableMenuItem: React.FC<SortableItemProps> = ({ id, name, icon: Icon }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 mb-2 rounded-xl border ${
        isDragging ? 'bg-white border-blue-500 shadow-xl opacity-90 scale-[1.02] ring-2 ring-blue-500/20' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
      } transition-[background-color,border-color,box-shadow]`}
    >
      <div 
        {...attributes} 
        {...listeners}
        className="p-1.5 text-slate-400 hover:text-blue-600 cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="w-5 h-5" />
      </div>
      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-sm font-bold text-slate-700">{name}</span>
    </div>
  );
}

interface MenuReorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: { path: string; name: string; icon: any }[];
  onSave: (newOrder: string[]) => void;
}

export default function MenuReorderModal({ isOpen, onClose, items, onSave }: MenuReorderModalProps) {
  const [activeItems, setActiveItems] = useState(items);

  // Sync when opened
  useEffect(() => {
    if (isOpen) {
      setActiveItems(items);
    }
  }, [isOpen, items]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!isOpen) return null;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setActiveItems((currentItems) => {
        const oldIndex = currentItems.findIndex((item) => item.path === active.id);
        const newIndex = currentItems.findIndex((item) => item.path === over.id);
        
        return arrayMove(currentItems, oldIndex, newIndex);
      });
    }
  };

  const handleSave = () => {
    onSave(activeItems.map(item => item.path));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-black text-slate-800">ویرایش ترتیب منوها</h2>
            <p className="text-[11px] text-slate-500 mt-1">برای جابه‌جایی، آیکون سمت راست را نگه داشته و بکشید.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={activeItems.map(i => i.path)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {activeItems.map((item) => (
                  <SortableMenuItem key={item.path} id={item.path} name={item.name} icon={item.icon} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
        
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-100 transition-colors"
          >
            انصراف
          </button>
          <button 
            onClick={handleSave}
            className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20"
          >
            ذخیره تغییرات
          </button>
        </div>
      </div>
    </div>
  );
}
