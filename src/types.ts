export type CmsStatus = 'ON' | 'OFF' | 'Faulty' | 'Signal Loss' | 'Healthy' | 'NA' | 'Data Not Found';
export type AgencyStatus = 'Solved' | 'Pending' | 'Under Process';
export type ExportOrientation = 'portrait' | 'landscape';
export type ToastType = 'success' | 'error';
export type SortField = 'serialNumber' | 'date' | 'agency' | 'block' | 'cmsStatus' | 'status';
export type SortDirection = 'asc' | 'desc';export interface PhotoData {
  id: string;
  name: string;
  dataUrl?: string; // Base64 preview OR absolute remote URL
  url?: string;     // The remote Supabase public URL
  file?: File;      // The raw source file ready for upload
  type: string;
  width?: number;
  height?: number;
}

export interface MaintenanceRecord {
  id: string;
  serialNumber: number;
  date: string;
  agency: string;
  district: string;
  block: string;
  panchayat: string;
  ward: string;
  poleName: string;
  imeiNo: string;
  cmsStatus: CmsStatus;
  remarks: string;
  status: AgencyStatus;
  photos: PhotoData[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  username: string;
  password: string;
}

export interface Filters {
  search: string;
  agency: string;
  block: string;
  fromDate: string;
  toDate: string;
}

export interface ExportHeader {
  title: string;
  subtitle: string;
  date: string;
  orientation: ExportOrientation;
}

export interface ExportHeaderDirty {
  subtitle: boolean;
}

export interface FormDraft {
  id: string | null;
  date: string;
  agency: string;
  district: string;
  block: string;
  panchayat: string;
  ward: string;
  poleName: string;
  imeiNo: string;
  cmsStatus: CmsStatus;
  remarks: string;
  status: AgencyStatus;
  photos: PhotoData[];
}

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

export interface PanchayatMap {
  id: string;
  agency: string;
  block: string;
  panchayat: string;
}

export interface DeviceMap {
  imeiNo: string;
  agency: string;
  block: string;
  panchayat: string;
  ward: string;
  poleName: string;
}

export interface PanchayatDraft {
  agency: string;
  block: string;
  panchayat: string;
}

export interface AppState {
  isAuthenticated: boolean;
  auth: AuthState;
  loginError: string;
  records: MaintenanceRecord[];
  filters: Filters;
  currentPage: number;
  pageSize: number;
  showFormModal: boolean;
  formDraft: FormDraft;
  deleteRecordId: string | null;
  exportHeader: ExportHeader;
  exportHeaderDirty: ExportHeaderDirty;
  toasts: ToastMessage[];
  sortBy: SortField;
  sortDirection: SortDirection;
  panchayats: PanchayatMap[];
  showPanchayatModal: boolean;
  panchayatDraft: PanchayatDraft;
  devices: DeviceMap[];
  lastAutoFilledImei: string | null;
}

export const STORAGE_KEYS = {
  session: 'solar-maintenance-session',
  records: 'solar-maintenance-records',
  panchayats: 'solar-maintenance-panchayats',
  devices: 'solar-maintenance-devices',
} as const;

export const LOGIN_CREDENTIALS = {
  username: 'cms.mantukumar@gmail.com',
  password: 'Saran123@',
} as const;

export const DISTRICT = 'SARAN';

export const AGENCIES = [
  'M/S Bondada Engineering Limited',
  'M/s Bridge And Roof Co Limited',
  'M/S ITI Limited',
  'M/S Lords Mark Industries Pvt. Ltd',
  'M/S Naw Dharam Energy Pvt. Ltd',
  'M/S Syska LED Lights Pvt. Ltd',
] as const;

export const BLOCKS = [
  'Amnour',
  'Baniapur',
  'Chapra',
  'Dariyapur',
  'Dighwara',
  'Ekma',
  'Garkha',
  'Ishupur',
  'Jalalpur',
  'Lahladpur',
  'Maker',
  'Manjhi',
  'Mashrakh',
  'Marhaura',
  'Nagra',
  'Panapur',
  'Parsa',
  'Rivilganj',
  'Sonepur',
  'Taraiya',
] as const;

export const CMS_STATUSES: CmsStatus[] = ['ON', 'OFF', 'Faulty', 'Signal Loss', 'Healthy', 'NA', 'Data Not Found'];
export const AGENCY_STATUSES: AgencyStatus[] = ['Solved', 'Pending', 'Under Process'];
