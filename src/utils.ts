import {
  AGENCIES,
  BLOCKS,
  CMS_STATUSES,
  DISTRICT,
  STORAGE_KEYS,
  AGENCY_STATUSES,
  type CmsStatus,
  type Filters,
  type FormDraft,
  type MaintenanceRecord,
  type PhotoData,
  type AgencyStatus,
  type PanchayatMap,
  type PanchayatDraft,
  type DeviceMap,
} from './types';
import { get, set } from 'idb-keyval';
import { masterData } from './masterData';
import { deviceData } from './deviceData';
import { supabase } from './supabase';

export const getTodayLocal = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
};

export const createEmptyDraft = (): FormDraft => ({
  id: null,
  date: getTodayLocal(),
  agency: AGENCIES[0],
  district: DISTRICT,
  block: BLOCKS[0],
  panchayat: '',
  ward: '',
  poleName: '',
  imeiNo: '',
  cmsStatus: 'Healthy',
  remarks: '',
  status: 'Pending',
  photos: [],
});

export const createEmptyPanchayatDraft = (): PanchayatDraft => ({
  agency: AGENCIES[0],
  block: BLOCKS[0],
  panchayat: '',
});

export const reassignSerialNumbers = (records: MaintenanceRecord[]) =>
  records.map((record, index) => ({ ...record, serialNumber: index + 1 }));

export const parseRawRecord = (item: Partial<MaintenanceRecord>, index: number = 0): MaintenanceRecord => ({
  id: typeof item.id === 'string' ? item.id : crypto.randomUUID(),
  serialNumber: typeof item.serialNumber === 'number' ? item.serialNumber : index + 1,
  date: typeof item.date === 'string' ? item.date : getTodayLocal(),
  agency: typeof item.agency === 'string' ? item.agency : AGENCIES[0],
  district: DISTRICT,
  block: typeof item.block === 'string' ? item.block : BLOCKS[0],
  panchayat: typeof item.panchayat === 'string' ? item.panchayat : '',
  ward: typeof item.ward === 'string' ? item.ward : '',
  poleName: typeof item.poleName === 'string' ? item.poleName : '',
  imeiNo: typeof item.imeiNo === 'string' ? item.imeiNo : '',
  cmsStatus: CMS_STATUSES.includes(item.cmsStatus as CmsStatus)
    ? (item.cmsStatus as CmsStatus)
    : 'Healthy',
  remarks: typeof item.remarks === 'string' ? item.remarks : '',
  status: AGENCY_STATUSES.includes(item.status as AgencyStatus)
    ? (item.status as AgencyStatus)
    : 'Pending',
  photos: Array.isArray(item.photos)
    ? item.photos.map((photo: any, i: number) => {
        if (typeof photo === 'string') {
          // It's a raw Supabase URL string
          return { id: crypto.randomUUID(), name: `Photo ${i+1}`, dataUrl: photo, url: photo, type: 'image/jpeg' };
        }
        return {
          id: typeof photo.id === 'string' ? photo.id : crypto.randomUUID(),
          name: typeof photo.name === 'string' ? photo.name : 'photo',
          dataUrl: typeof photo.dataUrl === 'string' ? photo.dataUrl : (photo.url || ''),
          url: typeof photo.url === 'string' ? photo.url : '',
          type: typeof photo.type === 'string' ? photo.type : 'image/jpeg',
          width: typeof photo.width === 'number' ? photo.width : 1,
          height: typeof photo.height === 'number' ? photo.height : 1,
          file: photo.file || undefined,
        };
      })
    : [],
  createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
  updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : new Date().toISOString(),
});

export async function loadRecords(): Promise<MaintenanceRecord[]> {
  try {
    const { data, error } = await supabase.from('ssl_reports').select('*');
    if (error || !data) throw new Error('Cloud fetch failed');
    
    return reassignSerialNumbers(data.map((item, index) => parseRawRecord(item, index)));
  } catch {
    // Hybrid Fallback: Load old offline records from IndexedDB if Supabase isn't connected yet!
    try {
      let parsed = await get(STORAGE_KEYS.records);
      if (!parsed) {
        const raw = localStorage.getItem(STORAGE_KEYS.records);
        if (!raw) return [];
        parsed = JSON.parse(raw);
      }
      if (!Array.isArray(parsed)) return [];
      return reassignSerialNumbers(parsed.map((item, index) => parseRawRecord(item, index)));
    } catch {
      return [];
    }
  }
}

export const saveRecords = async (_records: MaintenanceRecord[]): Promise<boolean> => {
  // Legacy indexedDB fallback deprecated; Supabase sync handles writes individually via main.ts
  return true;
};

export async function uploadPhotoToSupabase(file: File, id: string): Promise<string | null> {
  const fileExt = file.name.split('.').pop() || 'jpeg';
  const filePath = `${Date.now()}_${id}.${fileExt}`;

  const { data, error } = await supabase.storage.from('photos').upload(filePath, file, { upsert: true });
  
  if (error || !data) {
    console.error('Supabase upload error:', error);
    return null;
  }
  
  const { data: publicUrlData } = supabase.storage.from('photos').getPublicUrl(filePath);
  return publicUrlData.publicUrl;
}

export async function loadPanchayats(): Promise<PanchayatMap[]> {
  try {
    const data = await get(STORAGE_KEYS.panchayats);
    let loaded = Array.isArray(data) ? data : [];
    
    // Auto-seed the database if it is entirely empty with the massive Excel dataset
    if (loaded.length === 0) {
      loaded = [...masterData];
      try { await set(STORAGE_KEYS.panchayats, loaded); } catch { /* Ignore fast failure */ }
    }
    
    return loaded;
  } catch {
    return [];
  }
}

export const savePanchayats = async (panchayats: PanchayatMap[]): Promise<boolean> => {
  try {
    await set(STORAGE_KEYS.panchayats, panchayats);
    return true;
  } catch {
    return false;
  }
};

export async function loadDevices(): Promise<DeviceMap[]> {
  try {
    const data = await get(STORAGE_KEYS.devices);
    let loaded = Array.isArray(data) ? data : [];
    if (loaded.length === 0) {
      loaded = [...deviceData];
      try { await set(STORAGE_KEYS.devices, loaded); } catch {}
    }
    return loaded;
  } catch {
    return [];
  }
}

export const downloadBackupJson = (records: MaintenanceRecord[]) => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(records, null, 2));
  const link = document.createElement('a');
  link.setAttribute("href", dataStr);
  link.setAttribute("download", `solar_backup_${getTodayLocal()}.json`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export const saveSession = (active: boolean) =>
  active
    ? localStorage.setItem(STORAGE_KEYS.session, 'true')
    : localStorage.removeItem(STORAGE_KEYS.session);

export const getFilteredRecords = (records: MaintenanceRecord[], filters: Filters) => {
  const query = (filters.search || '').toLowerCase();
  return records.filter((record) => {
    const searchMatch = !query || 
      record.agency.toLowerCase().includes(query) || 
      record.block.toLowerCase().includes(query) || 
      record.ward.toLowerCase().includes(query) || 
      record.panchayat.toLowerCase().includes(query) || 
      record.poleName.toLowerCase().includes(query) || 
      record.imeiNo.toLowerCase().includes(query) ||
      record.remarks.toLowerCase().includes(query);
      
    const agency = !filters.agency || record.agency === filters.agency;
    const block = !filters.block || record.block === filters.block;
    const from = !filters.fromDate || record.date >= filters.fromDate;
    const to = !filters.toDate || record.date <= filters.toDate;
    return searchMatch && agency && block && from && to;
  });
};

export const sortRecords = (records: MaintenanceRecord[], sortBy: string, sortDirection: 'asc' | 'desc') => {
  return [...records].sort((a, b) => {
    let valA: any = a[sortBy as keyof MaintenanceRecord];
    let valB: any = b[sortBy as keyof MaintenanceRecord];
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    
    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
};

export const getPaginatedRecords = (records: MaintenanceRecord[], page: number, pageSize: number) => {
  const totalPages = Math.max(1, Math.ceil(records.length / pageSize));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * pageSize;
  return { current, totalPages, items: records.slice(start, start + pageSize) };
};

export const getImageEntries = (records: MaintenanceRecord[]) =>
  records.flatMap((record) => record.photos.map((photo) => ({ record, photo })));

export const getExportRows = (records: MaintenanceRecord[]) =>
  records.map((record) => [
    record.serialNumber,
    record.date,
    record.agency,
    record.district,
    record.block,
    record.panchayat,
    record.ward,
    record.poleName || 'N/A',
    record.imeiNo || 'N/A',
    record.cmsStatus,
    record.remarks || 'N/A',
    record.status,
    record.photos.length,
  ]);

export const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

export const highlightText = (text: string, query: string) => {
  if (!query || !text) return escapeHtml(text);
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')})`, 'gi');
  return escapeHtml(text).replace(regex, '<mark class="bg-amber-200 text-amber-900 rounded-sm px-px">$1</mark>');
};

export const formatDateDisplay = (value: string) => {
  if (!value) return 'N/A';
  const [year, month, day] = value.split('-');
  return year && month && day ? `${day}-${month}-${year}` : value;
};

export const sanitizeFilePart = (value: string) =>
  value.trim().replaceAll(/[^a-zA-Z0-9]+/g, '_').replaceAll(/^_+|_+$/g, '') || 'Report';

export const fitWithinBox = (width: number, height: number, maxWidth: number, maxHeight: number) => {
  const safeWidth = width > 0 ? width : maxWidth;
  const safeHeight = height > 0 ? height : maxHeight;
  const ratio = Math.min(maxWidth / safeWidth, maxHeight / safeHeight);
  return { width: safeWidth * ratio, height: safeHeight * ratio };
};

export function chunkArray<T>(items: T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size));
  return result;
}

export const base64ToUint8Array = (dataUrl: string) => {
  const base64 = dataUrl.split(',')[1] ?? '';
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
};

export async function readFileAsPhoto(file: File): Promise<PhotoData> {
  const fileUrl = URL.createObjectURL(file);

  const { width, height, img } = await new Promise<{ width: number; height: number, img: HTMLImageElement }>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight, img: image });
    image.onerror = () => reject(new Error('Failed to load image'));
    image.src = fileUrl;
  });

  const MAX_DIMENSION = 1200;
  let finalWidth = width;
  let finalHeight = height;
  
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
    finalWidth = Math.round(width * ratio);
    finalHeight = Math.round(height * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = finalWidth;
  canvas.height = finalHeight;
  const ctx = canvas.getContext('2d');
  
  let finalDataUrl = '';
  if (ctx) {
    if (file.type === 'image/png') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, finalWidth, finalHeight);
    }
    ctx.drawImage(img, 0, 0, finalWidth, finalHeight);
    finalDataUrl = canvas.toDataURL('image/jpeg', 0.65);
  }
  
  URL.revokeObjectURL(fileUrl);
  if (!finalDataUrl) throw new Error('Canvas conversion failed');

  return {
    id: crypto.randomUUID(),
    name: file.name,
    dataUrl: finalDataUrl,
    type: 'image/jpeg',
    width: finalWidth,
    height: finalHeight,
    file, // Persist raw File object for Supabase bucket logic
  };
}
