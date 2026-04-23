import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabase';
import { Room, RoomCategory, UserProfile } from '../types';
import { DEFAULT_ROOM_CATEGORIES, fetchRoomCategories, getRoomCategoriesWithFallback, getRoomCategoryLabel, normalizeRoomCategory } from '../lib/hotelInventory';
import { Building2, BedDouble, Layers, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const ROOM_STATUS_OPTIONS: Room['status'][] = ['available', 'occupied', 'maintenance', 'reserved'];

export default function HotelStructureManager({ profile }: { profile: UserProfile }) {
  const [loading, setLoading] = useState(true);
  const [savingCategory, setSavingCategory] = useState(false);
  const [savingRoom, setSavingRoom] = useState(false);
  const [categories, setCategories] = useState<RoomCategory[]>(DEFAULT_ROOM_CATEGORIES);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [categoryForm, setCategoryForm] = useState({
    code: '',
    label: '',
    description: '',
    sort_order: 40,
  });
  const [roomForm, setRoomForm] = useState({
    room_number: '',
    floor: 1,
    category: 'executivo',
    status: 'available' as Room['status'],
    is_virtual: false,
  });

  const activeCategories = useMemo(() => getRoomCategoriesWithFallback(categories), [categories]);

  useEffect(() => {
    loadData();
    const channel = supabase
      .channel('hotel-structure-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_categories' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, loadData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [roomCategories, roomsResult] = await Promise.all([
        fetchRoomCategories(),
        supabase.from('rooms').select('*').order('room_number'),
      ]);

      setCategories(roomCategories);
      if (roomsResult.error) {
        console.warn('rooms fallback:', roomsResult.error.message);
        setRooms([]);
      } else {
        setRooms((roomsResult.data || []) as Room[]);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    const normalizedCode = normalizeRoomCategory(categoryForm.code);
    if (!normalizedCode) {
      toast.error('Informe um codigo para a categoria.');
      return;
    }
    if (!categoryForm.label.trim()) {
      toast.error('Informe um nome para a categoria.');
      return;
    }

    setSavingCategory(true);
    try {
      const payload = {
        code: normalizedCode,
        label: categoryForm.label.trim(),
        description: categoryForm.description.trim() || null,
        sort_order: Number(categoryForm.sort_order) || 40,
        active: true,
      };

      const { error } = await supabase.from('room_categories').upsert(payload, { onConflict: 'code' });
      if (error) throw error;

      toast.success('Categoria hoteleira salva.');
      setCategoryForm({ code: '', label: '', description: '', sort_order: (Number(categoryForm.sort_order) || 40) + 10 });
      loadData();
    } catch (error: any) {
      toast.error('Erro ao salvar categoria: ' + (error.message || 'falha'));
    } finally {
      setSavingCategory(false);
    }
  }

  async function handleDeleteCategory(code: string) {
    if (!window.confirm(`Excluir a categoria "${getRoomCategoryLabel(code, categories)}"?`)) return;
    try {
      const { error } = await supabase.from('room_categories').delete().eq('code', normalizeRoomCategory(code));
      if (error) throw error;
      toast.success('Categoria removida.');
      loadData();
    } catch (error: any) {
      toast.error('Erro ao remover categoria: ' + (error.message || 'falha'));
    }
  }

  async function handleAddRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!roomForm.room_number.trim()) {
      toast.error('Informe o numero da UH.');
      return;
    }

    setSavingRoom(true);
    try {
      const payload = {
        room_number: roomForm.room_number.trim().toUpperCase(),
        floor: Number(roomForm.floor) || 1,
        category: normalizeRoomCategory(roomForm.category),
        status: roomForm.status,
        is_virtual: roomForm.is_virtual,
      };

      const { error } = await supabase.from('rooms').upsert(payload, { onConflict: 'room_number' });
      if (error) throw error;

      toast.success('UH salva com sucesso.');
      setRoomForm({
        room_number: '',
        floor: roomForm.floor,
        category: roomForm.category,
        status: 'available',
        is_virtual: false,
      });
      loadData();
    } catch (error: any) {
      toast.error('Erro ao salvar UH: ' + (error.message || 'falha'));
    } finally {
      setSavingRoom(false);
    }
  }

  async function handleDeleteRoom(roomNumber: string) {
    if (!window.confirm(`Excluir a UH ${roomNumber}?`)) return;
    try {
      const { error } = await supabase.from('rooms').delete().eq('room_number', roomNumber);
      if (error) throw error;
      toast.success('UH removida.');
      loadData();
    } catch (error: any) {
      toast.error('Erro ao excluir UH: ' + (error.message || 'falha'));
    }
  }

  const availableRooms = rooms.filter((room) => room.status === 'available' && !room.is_virtual).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Categorias ativas" value={String(activeCategories.length)} icon={Layers} tone="text-blue-700 bg-blue-50 border-blue-200" />
        <StatCard label="UHs cadastradas" value={String(rooms.filter((room) => !room.is_virtual).length)} icon={Building2} tone="text-emerald-700 bg-emerald-50 border-emerald-200" />
        <StatCard label="UHs disponíveis" value={String(availableRooms)} icon={BedDouble} tone="text-amber-700 bg-amber-50 border-amber-200" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-neutral-900" />
            <h2 className="font-bold text-neutral-900">Categorias Hoteleiras</h2>
          </div>
          <p className="text-sm text-neutral-500 mb-5">
            O que for cadastrado aqui passa a alimentar recepcao, walk-in e reservas.
          </p>
          <form onSubmit={handleAddCategory} className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
            <input
              value={categoryForm.code}
              onChange={(e) => setCategoryForm((prev) => ({ ...prev, code: e.target.value }))}
              placeholder="codigo interno (ex: executivo)"
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm"
            />
            <input
              value={categoryForm.label}
              onChange={(e) => setCategoryForm((prev) => ({ ...prev, label: e.target.value }))}
              placeholder="nome exibido"
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm"
            />
            <input
              value={categoryForm.description}
              onChange={(e) => setCategoryForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="descricao opcional"
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm md:col-span-2"
            />
            <input
              type="number"
              min={1}
              value={categoryForm.sort_order}
              onChange={(e) => setCategoryForm((prev) => ({ ...prev, sort_order: Number(e.target.value) }))}
              placeholder="ordem"
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm"
            />
            <button
              type="submit"
              disabled={savingCategory}
              className="w-full bg-neutral-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {savingCategory ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Salvar Categoria
            </button>
          </form>

          <div className="space-y-3 max-h-[360px] overflow-auto">
            {activeCategories.map((category) => (
              <div key={category.code} className="flex items-start justify-between gap-3 p-3 rounded-xl border border-neutral-200 bg-neutral-50">
                <div>
                  <p className="text-sm font-bold text-neutral-900">{category.label}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{category.code}</p>
                  {category.description && <p className="text-xs text-neutral-500 mt-1">{category.description}</p>}
                </div>
                {!DEFAULT_ROOM_CATEGORIES.some((item) => normalizeRoomCategory(item.code) === normalizeRoomCategory(category.code)) && (
                  <button
                    onClick={() => handleDeleteCategory(category.code)}
                    className="p-2 text-neutral-400 hover:text-red-600"
                    title="Excluir categoria"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BedDouble className="w-5 h-5 text-neutral-900" />
            <h2 className="font-bold text-neutral-900">Cadastro de UHs</h2>
          </div>
          <form onSubmit={handleAddRoom} className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
            <input
              value={roomForm.room_number}
              onChange={(e) => setRoomForm((prev) => ({ ...prev, room_number: e.target.value }))}
              placeholder="numero da UH"
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm"
            />
            <input
              type="number"
              min={0}
              value={roomForm.floor}
              onChange={(e) => setRoomForm((prev) => ({ ...prev, floor: Number(e.target.value) }))}
              placeholder="andar"
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm"
            />
            <select
              value={roomForm.category}
              onChange={(e) => setRoomForm((prev) => ({ ...prev, category: e.target.value }))}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm"
            >
              {activeCategories.map((category) => (
                <option key={category.code} value={category.code}>{category.label}</option>
              ))}
            </select>
            <select
              value={roomForm.status}
              onChange={(e) => setRoomForm((prev) => ({ ...prev, status: e.target.value as Room['status'] }))}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm"
            >
              {ROOM_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-neutral-600 md:col-span-2">
              <input
                type="checkbox"
                checked={roomForm.is_virtual}
                onChange={(e) => setRoomForm((prev) => ({ ...prev, is_virtual: e.target.checked }))}
              />
              Marcar como UH virtual
            </label>
            <button
              type="submit"
              disabled={savingRoom}
              className="md:col-span-2 w-full bg-neutral-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {savingRoom ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Salvar UH
            </button>
          </form>

          <div className="space-y-3 max-h-[360px] overflow-auto">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
              </div>
            ) : rooms.length === 0 ? (
              <div className="p-5 rounded-xl border border-dashed border-neutral-300 text-sm text-neutral-500">
                Nenhuma UH cadastrada ainda. Cadastre a estrutura do hotel aqui e ela passa a refletir na recepcao e nas reservas.
              </div>
            ) : (
              rooms.map((room) => (
                <div key={room.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-neutral-200 bg-neutral-50">
                  <div>
                    <p className="text-sm font-bold text-neutral-900">
                      UH {room.room_number} {room.is_virtual ? <span className="text-[10px] font-bold uppercase text-neutral-400">virtual</span> : null}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {getRoomCategoryLabel(room.category, categories)} · {room.floor}o andar · {room.status}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteRoom(room.room_number)}
                    className="p-2 text-neutral-400 hover:text-red-600"
                    title="Excluir UH"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
}) {
  return (
    <div className={`rounded-2xl border p-5 ${tone}`}>
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-white/70">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest">{label}</p>
          <p className="text-2xl font-black">{value}</p>
        </div>
      </div>
    </div>
  );
}
