import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Settings, Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface EditableSelectProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  isIPCN: boolean;
  table?: string;
  storageKey?: string;
  placeholder?: string;
}

export function EditableSelect({ label, value, onChange, options: defaultOptions, isIPCN, table, storageKey, placeholder }: EditableSelectProps) {
  const [items, setItems] = useState<{id: string, nama: string}[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchItems();
  }, []);

  const fetchItems = async () => {
    if (table) {
      try {
        const { data, error } = await supabase.from(table).select('*').order('nama');
        if (!error && data) {
          setItems(data);
          return;
        }
      } catch (err) {
        console.error('Error fetching from table', table, err);
      }
    }
    
    // Fallback to local storage + defaults
    let localItems: {id: string, nama: string}[] = [];
    if (storageKey) {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        localItems = JSON.parse(stored);
      }
    }
    
    // Merge defaults
    const defaults = defaultOptions.map(opt => ({ id: opt, nama: opt }));
    const merged = [...defaults];
    for (const li of localItems) {
      if (!merged.find(m => m.nama === li.nama)) {
        merged.push(li);
      }
    }
    setItems(merged);
  };

  const saveItem = async () => {
    if (!newItemName.trim()) return;
    try {
      if (table) {
        if (editItemId) {
          if (!editItemId.startsWith('local-') && !editItemId.includes('static')) {
             await supabase.from(table).update({ nama: newItemName }).eq('id', editItemId);
          }
        } else {
           await supabase.from(table).insert([{ nama: newItemName }]);
        }
      } else if (storageKey) {
        const current = JSON.parse(localStorage.getItem(storageKey) || '[]');
        if (editItemId) {
          const updated = current.map((c: any) => c.id === editItemId ? { ...c, nama: newItemName } : c);
          localStorage.setItem(storageKey, JSON.stringify(updated));
        } else {
          const newId = 'local-' + Date.now();
          current.push({ id: newId, nama: newItemName });
          localStorage.setItem(storageKey, JSON.stringify(current));
        }
      }
      
      setNewItemName('');
      setEditItemId(null);
      await fetchItems();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteItem = async (id: string, nama: string) => {
    if (!confirm(`Hapus ${nama}?`)) return;
    try {
      if (table && !id.startsWith('local-') && !id.includes('static')) {
         await supabase.from(table).delete().eq('id', id);
      } else if (storageKey) {
         const current = JSON.parse(localStorage.getItem(storageKey) || '[]');
         const updated = current.filter((c: any) => c.id !== id && c.nama !== nama);
         localStorage.setItem(storageKey, JSON.stringify(updated));
      }
      if (value === nama) {
        onChange('');
      }
      await fetchItems();
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</label>
        {isIPCN && (
          <button type="button" onClick={() => setIsModalOpen(true)} className="text-[10px] font-bold uppercase tracking-widest text-blue-400 hover:text-blue-300 flex items-center gap-1">
            <Settings className="w-3 h-3" /> Edit
          </button>
        )}
      </div>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-colors"
      >
        <option value="" className="bg-slate-900">{placeholder || `Pilih ${label}...`}</option>
        {items.map(o => <option key={o.id} value={o.nama} className="bg-slate-900">{o.nama}</option>)}
      </select>

      {mounted && isModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[85vh] relative z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
              <h3 className="font-bold text-white">Kelola {label}</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 flex gap-2">
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder={`Tambah/Edit ${label}...`}
                className="flex-1 bg-black/20 border border-white/10 focus:border-blue-500/50 rounded-xl px-3 py-2 text-sm text-white outline-none transition-colors"
                onKeyDown={(e) => {
                   if (e.key === 'Enter' && newItemName.trim()) {
                      saveItem();
                   }
                }}
              />
              <button type="button" onClick={saveItem} disabled={!newItemName.trim()} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                {editItemId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                <span className="hidden sm:inline">{editItemId ? 'Simpan' : 'Tambah'}</span>
              </button>
              {editItemId && (
                <button type="button" onClick={() => { setEditItemId(null); setNewItemName(''); }} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-bold transition-colors">
                  Batal
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {items.map(item => (
                <div key={item.id} className="flex justify-between items-center bg-black/20 border border-white/5 p-3 rounded-xl hover:bg-white/5 transition-colors">
                  <span className="text-sm text-white truncate pr-2 font-medium">{item.nama}</span>
                  <div className="flex gap-2 shrink-0">
                    <button type="button" onClick={() => { setEditItemId(item.id); setNewItemName(item.nama); }} className="p-1.5 text-blue-400 hover:bg-blue-400/20 rounded-lg transition-colors" title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => deleteItem(item.id, item.nama)} className="p-1.5 text-red-400 hover:bg-red-400/20 rounded-lg transition-colors" title="Hapus">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm">Belum ada data.</div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
