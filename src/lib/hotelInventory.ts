import { supabase } from '../supabase';
import { RoomCategory } from '../types';

export const DEFAULT_ROOM_CATEGORIES: RoomCategory[] = [
  { code: 'executivo', label: 'Executivo', sort_order: 10, active: true },
  { code: 'master', label: 'Master', sort_order: 20, active: true },
  { code: 'suite presidencial', label: 'Suite Presidencial', sort_order: 30, active: true },
];

export function normalizeRoomCategory(value: string) {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function getRoomCategoriesWithFallback(categories: RoomCategory[] | null | undefined) {
  const list = (categories || [])
    .filter((category) => category.active !== false)
    .map((category) => ({
      ...category,
      code: normalizeRoomCategory(category.code),
    }))
    .filter((category) => category.code);

  const merged = [...DEFAULT_ROOM_CATEGORIES];
  for (const category of list) {
    const index = merged.findIndex((item) => normalizeRoomCategory(item.code) === category.code);
    if (index >= 0) merged[index] = { ...merged[index], ...category };
    else merged.push(category);
  }

  return merged.sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999) || a.label.localeCompare(b.label));
}

export function getRoomCategoryLabel(code: string, categories?: RoomCategory[] | null) {
  const normalized = normalizeRoomCategory(code);
  const match = getRoomCategoriesWithFallback(categories).find(
    (category) => normalizeRoomCategory(category.code) === normalized
  );
  return match?.label || code || '—';
}

export async function fetchRoomCategories() {
  const { data, error } = await supabase
    .from('room_categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.warn('room_categories fallback:', error.message);
    return DEFAULT_ROOM_CATEGORIES;
  }

  return getRoomCategoriesWithFallback(data as RoomCategory[]);
}
