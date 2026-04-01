import './style.css';
import { exportDoc } from './exportDoc';
import { exportExcel } from './exportExcel';
import { exportPdf } from './exportPdf';
import { buildDashboardView, buildRecordFormModal, buildCards, buildPagination, buildTable } from './viewDashboard';
import { buildLoginView } from './viewLogin';
import { AGENCIES, BLOCKS, LOGIN_CREDENTIALS, STORAGE_KEYS, type AppState, type AuthState, type CmsStatus, type FormDraft, type AgencyStatus, type SortField, type SortDirection, type MaintenanceRecord, type PanchayatDraft, type DeviceMap } from './types';
import { createEmptyDraft, createEmptyPanchayatDraft, escapeHtml, getFilteredRecords, getPaginatedRecords, getTodayLocal, loadRecords, loadPanchayats, loadDevices, readFileAsPhoto, reassignSerialNumbers, sanitizeFilePart, saveRecords, savePanchayats, saveSession, sortRecords, downloadBackupJson, parseRawRecord, uploadPhotoToSupabase } from './utils';
import { supabase } from './supabase';

const app = document.querySelector<HTMLDivElement>('#app')!;

const state: AppState = {
  isAuthenticated: localStorage.getItem(STORAGE_KEYS.session) === 'true',
  auth: { username: '', password: '' },
  loginError: '',
  records: [],
  filters: { search: '', agency: '', block: '', fromDate: '', toDate: '' },
  currentPage: 1,
  pageSize: 8,
  showFormModal: false,
  formDraft: createEmptyDraft(),
  deleteRecordId: null,
  exportHeader: { title: 'Solar Street Light Maintenance Report', subtitle: '', date: getTodayLocal(), orientation: 'portrait' },
  exportHeaderDirty: { subtitle: false },
  toasts: [],
  sortBy: 'serialNumber',
  sortDirection: 'desc',
  panchayats: [],
  showPanchayatModal: false,
  panchayatDraft: createEmptyPanchayatDraft(),
  devices: [],
  lastAutoFilledImei: null,
};

const syncSubtitleWithFilter = () => {
  if (!state.exportHeaderDirty.subtitle) state.exportHeader.subtitle = state.filters.agency;
};

const getSerialPreview = () =>
  state.formDraft.id
    ? state.records.find((record) => record.id === state.formDraft.id)?.serialNumber ?? state.records.length
    : state.records.length + 1;

const getExportFileBase = () => `${sanitizeFilePart(state.filters.agency || state.exportHeader.subtitle || 'AllAgencies')}_${state.exportHeader.date || getTodayLocal()}`;

function pushToast(message: string, type: 'success' | 'error') {
  const id = crypto.randomUUID();
  state.toasts = [...state.toasts, { id, type, message }];
  renderApp();
  window.setTimeout(() => {
    state.toasts = state.toasts.filter((toast) => toast.id !== id);
    renderApp();
  }, 3000);
}

function renderApp() {
  const activeEl = document.activeElement as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
  const activeName = activeEl?.name;
  let cursorPosition: number | null = null;
  if (activeEl && ('selectionStart' in activeEl)) {
    try { cursorPosition = activeEl.selectionStart; } catch {}
  }

  if (!state.isAuthenticated) {
    app.innerHTML = buildLoginView(state.auth, state.loginError);
    if (activeName) document.querySelector<HTMLInputElement>(`[name="${activeName}"]`)?.focus();
    return;
  }
  const filtered = getFilteredRecords(state.records, state.filters);
  const sorted = sortRecords(filtered, state.sortBy, state.sortDirection);
  const displayRecords = reassignSerialNumbers(sorted);
  const pager = getPaginatedRecords(displayRecords, state.currentPage, state.pageSize);
  state.currentPage = pager.current;
  app.innerHTML = buildDashboardView(
    state,
    filtered.length,
    filtered.filter((record) => record.status === 'Solved').length,
    filtered.filter((record) => record.status !== 'Solved').length,
    filtered.reduce((sum, record) => sum + record.photos.length, 0),
    buildTable(pager.items),
    buildCards(pager.items),
    buildPagination(state.currentPage, pager.totalPages),
  );
  app.insertAdjacentHTML('beforeend', buildRecordFormModal(state, getSerialPreview()));

  if (activeName) {
    const elToFocus = document.querySelector(`[name="${activeName}"]`) as HTMLInputElement | HTMLTextAreaElement | null;
    if (elToFocus) {
      elToFocus.focus();
      if (cursorPosition !== null && typeof elToFocus.setSelectionRange === 'function') {
        try { elToFocus.setSelectionRange(cursorPosition, cursorPosition); } catch {}
      }
    }
  }
}

function openCreateModal() {
  state.formDraft = createEmptyDraft();
  state.showFormModal = true;
  renderApp();
}

function openPanchayatModal() {
  state.panchayatDraft = createEmptyPanchayatDraft();
  state.showPanchayatModal = true;
  renderApp();
}

const closePanchayatModal = () => { state.showPanchayatModal = false; state.panchayatDraft = createEmptyPanchayatDraft(); renderApp(); };

function openEditModal(id: string) {
  const record = state.records.find((item) => item.id === id);
  if (!record) return pushToast('Record not found.', 'error');
  state.formDraft = { id: record.id, date: record.date, agency: record.agency, district: record.district, block: record.block, panchayat: record.panchayat, ward: record.ward, poleName: record.poleName, imeiNo: record.imeiNo, cmsStatus: record.cmsStatus, remarks: record.remarks, status: record.status, photos: [...record.photos] };
  state.showFormModal = true;
  renderApp();
}

const closeFormModal = () => { state.showFormModal = false; state.formDraft = createEmptyDraft(); renderApp(); };
const promptDelete = (id: string) => { state.deleteRecordId = id; renderApp(); };
const cancelDelete = () => { state.deleteRecordId = null; renderApp(); };
const removePhotoFromDraft = (id: string) => { state.formDraft.photos = state.formDraft.photos.filter((photo) => photo.id !== id); renderApp(); };

async function confirmDelete() {
  if (!state.deleteRecordId) return;
  const targetId = state.deleteRecordId;
  const { error } = await supabase.from('ssl_reports').delete().eq('id', targetId);
  
  if (error) {
    pushToast('Network Error. Delete failed.', 'error');
  } else {
    state.records = reassignSerialNumbers(state.records.filter((record) => record.id !== targetId));
    pushToast('Record deleted successfully from Cloud.', 'success');
  }
  state.deleteRecordId = null;
  renderApp();
}

function logout() {
  state.isAuthenticated = false;
  state.auth = { username: '', password: '' };
  state.loginError = '';
  saveSession(false);
  renderApp();
}

function updateDraftField(name: keyof FormDraft, value: string) {
  if (name === 'cmsStatus') state.formDraft.cmsStatus = value as CmsStatus;
  else if (name === 'status') state.formDraft.status = value as AgencyStatus;
  else {
    state.formDraft = { ...state.formDraft, [name]: value } as FormDraft;
    if (name === 'agency') state.formDraft.panchayat = ''; // reset panchayat only
    if (name === 'block') state.formDraft.panchayat = ''; // reset panchayat
  }
}

function updatePanchayatDraftField(name: string, value: string) {
  const stripped = name.replace('draft', '').toLowerCase() as keyof PanchayatDraft;
  state.panchayatDraft = { ...state.panchayatDraft, [stripped]: value };
}

async function handlePhotoUpload(input: HTMLInputElement) {
  if (!input.files?.length) return;
  try {
    state.formDraft.photos = [...state.formDraft.photos, ...(await Promise.all(Array.from(input.files).map(readFileAsPhoto)))];
    input.value = '';
    renderApp();
    pushToast('Photo preview updated.', 'success');
  } catch {
    pushToast('One or more images could not be processed.', 'error');
  }
}

function handleLoginSubmit() {
  if (state.auth.username.trim() === LOGIN_CREDENTIALS.username && state.auth.password === LOGIN_CREDENTIALS.password) {
    state.isAuthenticated = true;
    state.loginError = '';
    saveSession(true);
    syncSubtitleWithFilter();
    renderApp();
    pushToast('Login successful.', 'success');
  } else {
    state.loginError = 'Invalid username or password.';
    renderApp();
  }
}

async function handleRecordSubmit() {
  if (!state.formDraft.date || !state.formDraft.agency || !state.formDraft.block || !state.formDraft.panchayat.trim() || !state.formDraft.ward.trim()) return pushToast('Please complete all required fields.', 'error');
  
  if (state.formDraft.imeiNo) {
     const isDup = state.records.some(r => r.imeiNo === state.formDraft.imeiNo && r.id !== state.formDraft.id);
     if (isDup) return pushToast('Duplicate Warning: This IMEI No already exists in another record!', 'error');
  }

  const now = new Date().toISOString();
  const updating = Boolean(state.formDraft.id);
  const targetId = state.formDraft.id || crypto.randomUUID();

  pushToast(`Saving... Uploading ${state.formDraft.photos.length} photos to Cloud Bucket.`, 'success');
  
  const finalUrls: string[] = [];
  for (const photo of state.formDraft.photos) {
    if (photo.url) {
      finalUrls.push(photo.url);
    } else if (photo.file) {
      const publicUrl = await uploadPhotoToSupabase(photo.file, photo.id);
      if (!publicUrl) return pushToast(`Upload failed for ${photo.name}`, 'error');
      finalUrls.push(publicUrl);
    }
  }

  pushToast('Writing registry logic to Supabase Postgres...', 'success');

  const dbRecord = {
    id: targetId,
    date: state.formDraft.date,
    agency: state.formDraft.agency,
    district: 'SARAN',
    block: state.formDraft.block,
    panchayat: state.formDraft.panchayat.trim(),
    ward: state.formDraft.ward.trim(),
    poleName: state.formDraft.poleName.trim(),
    imeiNo: state.formDraft.imeiNo.trim(),
    cmsStatus: state.formDraft.cmsStatus,
    remarks: state.formDraft.remarks.trim(),
    status: state.formDraft.status,
    photos: finalUrls,
    updatedAt: now,
    ...(updating ? {} : { createdAt: now })
  };

  const { error } = await supabase.from('ssl_reports').upsert(dbRecord);

  if (error) {
    console.error(error);
    return pushToast('Supabase Server Error! Failed to lock row.', 'error');
  }

  if (updating) {
    state.records = state.records.map(r => r.id === targetId ? parseRawRecord(dbRecord as any, r.serialNumber - 1) : r);
  } else {
    state.records = reassignSerialNumbers([...state.records, parseRawRecord(dbRecord as any, state.records.length)]);
  }

  closeFormModal();
  pushToast(updating ? 'Cloud Record Synced Successfully.' : 'Cloud Record Originated Successfully.', 'success');
}

async function handlePanchayatSubmit() {
  const draft = state.panchayatDraft;
  if (!draft.agency || !draft.block || !draft.panchayat.trim()) return pushToast('Please fill all Panchayat details.', 'error');
  
  const formatted = draft.panchayat.trim();
  const exists = state.panchayats.some(p => p.agency === draft.agency && p.block === draft.block && p.panchayat.toLowerCase() === formatted.toLowerCase());
  
  if (exists) return pushToast('This Panchayat already exists under this Block for this Agency!', 'error');

  state.panchayats = [...state.panchayats, { id: crypto.randomUUID(), agency: draft.agency, block: draft.block, panchayat: formatted }];
  
  if (!(await savePanchayats(state.panchayats))) {
    state.panchayats = state.panchayats.slice(0, -1);
    return pushToast('Storage error saving Panchayat.', 'error');
  }

  closePanchayatModal();
  pushToast('Panchayat mapped successfully! It is now available in the dropdown.', 'success');
}

function handleClick(event: MouseEvent) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const actionEl = target.closest('[data-action]');
  if (!(actionEl instanceof HTMLElement)) return;
  const action = actionEl.dataset.action;
  if (!action) return;
  if (action === 'logout') return logout();
  if (action === 'open-form') return openCreateModal();
  if (action === 'close-form') return closeFormModal();
  if (action === 'open-panchayat-form') return openPanchayatModal();
  if (action === 'close-panchayat-form') return closePanchayatModal();
  if (action === 'cancel-delete') return cancelDelete();
  if (action === 'confirm-delete') return confirmDelete();
  if (action === 'filter-today') { state.filters = { ...state.filters, fromDate: getTodayLocal(), toDate: getTodayLocal() }; state.currentPage = 1; return renderApp(); }
  if (action === 'reset-filters') { state.filters = { search: '', agency: '', block: '', fromDate: '', toDate: '' }; state.sortBy = 'serialNumber'; state.sortDirection = 'desc'; state.currentPage = 1; syncSubtitleWithFilter(); return renderApp(); }
  if (action === 'remove-photo' && actionEl.dataset.photoId) return removePhotoFromDraft(actionEl.dataset.photoId);
  if (action === 'edit-record' && actionEl.dataset.recordId) return openEditModal(actionEl.dataset.recordId);
  if (action === 'delete-record' && actionEl.dataset.recordId) return promptDelete(actionEl.dataset.recordId);
  if (action === 'change-page' && actionEl.dataset.page) { state.currentPage = Number(actionEl.dataset.page) || 1; return renderApp(); }
  if (action === 'export-pdf') { const active = reassignSerialNumbers(sortRecords(getFilteredRecords(state.records, state.filters), state.sortBy, state.sortDirection)); return active.length ? (exportPdf(active, state.exportHeader, getExportFileBase()), pushToast('PDF export completed.', 'success')) : pushToast('No records available for export.', 'error'); }
  if (action === 'export-excel') { const active = reassignSerialNumbers(sortRecords(getFilteredRecords(state.records, state.filters), state.sortBy, state.sortDirection)); return active.length ? (exportExcel(active, state.exportHeader, getExportFileBase()), pushToast('Excel export completed.', 'success')) : pushToast('No records available for export.', 'error'); }
  if (action === 'export-doc') { const active = reassignSerialNumbers(sortRecords(getFilteredRecords(state.records, state.filters), state.sortBy, state.sortDirection)); return active.length ? void exportDoc(active, state.exportHeader, getExportFileBase()).then(() => pushToast('DOC export completed.', 'success')) : pushToast('No records available for export.', 'error'); }
  if (action === 'export-backup') { return downloadBackupJson(state.records); }
  if (action === 'import-backup') {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text) as Partial<MaintenanceRecord>[];
        if (!Array.isArray(parsed)) throw new Error('Invalid format');

        let added = 0;
        let skipped = 0;
        const newRecords: MaintenanceRecord[] = [];

        for (const item of parsed) {
          if (!item.id || !item.agency || !item.date) continue; // skip corrupted completely
          if (state.records.some(r => r.id === item.id)) {
            skipped++;
          } else {
            newRecords.push(parseRawRecord(item, state.records.length + added));
            added++;
          }
        }

        if (added > 0) {
          state.records = reassignSerialNumbers([...state.records, ...newRecords]);
          if (!(await saveRecords(state.records))) {
            return pushToast('Storage full! Could not restore all data.', 'error');
          }
          syncSubtitleWithFilter();
          state.currentPage = 1;
          renderApp();
        }
        pushToast(`Restored ${added} records. Skipped ${skipped} duplicates.`, 'success');
      } catch (err) {
        pushToast('Failed to parse backup JSON file.', 'error');
      }
    };
    input.click();
    return;
  }
}

let searchDebounce: number;

function handleInput(event: Event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) return;
  const { name, value } = target;

  if (name === 'filterSearch') {
    clearTimeout(searchDebounce);
    searchDebounce = window.setTimeout(() => {
      state.filters.search = value;
      state.currentPage = 1;
      renderApp();
    }, 300);
    return;
  }

  if (target.form?.id === 'login-form') { state.auth = { ...state.auth, [name]: value } as AuthState; if (state.loginError) state.loginError = ''; return; }
  if (target.form?.id === 'panchayat-form') return updatePanchayatDraftField(name, value);
  if (target.form?.id === 'record-form' && name !== 'photos' && name in state.formDraft) {
     if (['panchayat', 'poleName', 'imeiNo'].includes(name)) {
        const val = value.trim().toLowerCase();
        const listId = name === 'panchayat' ? 'panchayat-suggestions' : name === 'poleName' ? 'pole-suggestions' : 'imei-suggestions';
        const datalist = document.getElementById(listId);
        if (datalist && val.length >= 2) {
           const matches: string[] = [];
           for (const dev of state.devices) {
             const needle = dev[name as keyof DeviceMap];
             if (needle && needle.toLowerCase().includes(val)) {
                matches.push(needle);
                if (matches.length >= 50) break;
             }
           }
           const unique = Array.from(new Set(matches));
           datalist.innerHTML = unique.map(m => `<option value="${escapeHtml(m)}">`).join('');
        }
     }
     
     updateDraftField(name as keyof FormDraft, value); 
     
     if (name === 'imeiNo') {
        const val = value.trim().toLowerCase();
        const match = state.devices.find(d => d.imeiNo.toLowerCase() === val);
        
        if (match) {
           state.formDraft.agency = match.agency;
           state.formDraft.block = match.block;
           state.formDraft.panchayat = match.panchayat;
           state.formDraft.ward = match.ward;
           state.formDraft.poleName = match.poleName;
           state.formDraft.imeiNo = match.imeiNo;
           state.lastAutoFilledImei = match.imeiNo;
           pushToast('Instant Lookup: Auto-filled all details!', 'success');
           return renderApp();
        } else if (state.lastAutoFilledImei) {
           state.formDraft.agency = AGENCIES[0];
           state.formDraft.block = BLOCKS[0];
           state.formDraft.panchayat = '';
           state.formDraft.ward = '';
           state.formDraft.poleName = '';
           state.lastAutoFilledImei = null;
           pushToast('Invalid IMEI: Auto-filled data cleared.', 'error');
           return renderApp();
        } else if (val.length === 9 || val.length === 15) {
           pushToast('Invalid IMEI or no matching record found.', 'error');
        }
     }
     return;
  }
  if (name === 'exportTitle') return void (state.exportHeader.title = value);
  if (name === 'exportSubtitle') { state.exportHeader.subtitle = value; state.exportHeaderDirty.subtitle = value.trim().length > 0; return; }
  if (name === 'exportDate') state.exportHeader.date = value;
}

function handleChange(event: Event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;
  const { name, value } = target;
  if (target.form?.id === 'panchayat-form') { updatePanchayatDraftField(name, value); return renderApp(); }
  if (target.form?.id === 'record-form' && name === 'photos' && target instanceof HTMLInputElement) return void handlePhotoUpload(target);
  if (target.form?.id === 'record-form' && name in state.formDraft) { 
    if (name === 'panchayat' || name === 'poleName') {
      const val = value.trim().toLowerCase();
      if (val.length > 2) {
        let match = state.devices.find(p => p[name as keyof DeviceMap].toLowerCase() === val);
        if (!match) match = state.devices.find(p => p[name as keyof DeviceMap].toLowerCase().includes(val));
        if (match) {
          state.formDraft.agency = match.agency;
          state.formDraft.block = match.block;
          state.formDraft.panchayat = match.panchayat;
          if (name === 'poleName') state.formDraft.poleName = match.poleName;
          pushToast(`Auto-filled context from ${match.agency} - ${match.block}`, 'success');
          return renderApp();
        }
      }
    }
    updateDraftField(name as keyof FormDraft, value); 
    return renderApp(); 
  }
  if (name === 'filterAgency') { state.filters.agency = value; state.currentPage = 1; syncSubtitleWithFilter(); return renderApp(); }
  if (name === 'filterBlock') { state.filters.block = value; state.currentPage = 1; return renderApp(); }
  if (name === 'filterFromDate') { state.filters.fromDate = value; state.currentPage = 1; return renderApp(); }
  if (name === 'filterToDate') { state.filters.toDate = value; state.currentPage = 1; return renderApp(); }
  if (name === 'exportOrientation' && (value === 'portrait' || value === 'landscape')) { state.exportHeader.orientation = value; renderApp(); }
  if (name === 'sortBy') { state.sortBy = value as SortField; state.currentPage = 1; return renderApp(); }
  if (name === 'sortDirection') { state.sortDirection = value as SortDirection; state.currentPage = 1; return renderApp(); }
}

function handleSubmit(event: SubmitEvent) {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  event.preventDefault();
  if (form.id === 'login-form') return handleLoginSubmit();
  if (form.id === 'record-form') return handleRecordSubmit();
  if (form.id === 'panchayat-form') return handlePanchayatSubmit();
}

app.addEventListener('click', handleClick);
app.addEventListener('input', handleInput);
app.addEventListener('change', handleChange);
app.addEventListener('submit', handleSubmit);

Promise.all([loadRecords(), loadPanchayats(), loadDevices()]).then(([records, panchayats, devices]) => {
  state.records = records;
  state.panchayats = panchayats;
  state.devices = devices;
  syncSubtitleWithFilter();
  renderApp();
});
renderApp();
