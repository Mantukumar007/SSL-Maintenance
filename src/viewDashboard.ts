import { AGENCIES, BLOCKS, CMS_STATUSES, AGENCY_STATUSES, type AppState } from './types';
import { buildDeleteModal, buildOptions, buildPagination, buildPhotoPreview, buildToastStack } from './viewHelpers';
import { buildCards, buildTable } from './viewTable';
import { escapeHtml, getFilteredRecords } from './utils';

export function buildPanchayatFormModal(state: AppState) {
  if (!state.showPanchayatModal) return '';
  
  const uniqueBlocks = Array.from(new Set([...BLOCKS, state.panchayatDraft.block])).filter(Boolean).sort();

  return `
    <div class="modal-shell z-50">
      <div class="modal-backdrop" data-action="close-panchayat-form"></div>
      <section class="modal-card">
        <div class="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div><p class="eyebrow">Database Mapping</p><h3 class="mt-2 text-2xl font-semibold text-slate-900">Add Panchayat</h3></div>
          <button type="button" class="ghost-button" data-action="close-panchayat-form">Close</button>
        </div>
        <form id="panchayat-form" class="px-5 py-5 sm:px-6">
          <div class="grid gap-4 md:grid-cols-2">
            <label class="field md:col-span-2"><span class="field-label">Agency</span><select class="field-input" name="draftAgency" required>${buildOptions(AGENCIES, state.panchayatDraft.agency)}</select></label>
            <label class="field md:col-span-2"><span class="field-label">Block</span><select class="field-input" name="draftBlock" required>${buildOptions(uniqueBlocks, state.panchayatDraft.block)}</select></label>
            <label class="field md:col-span-2"><span class="field-label">Panchayat Name</span><input class="field-input" type="text" name="draftPanchayat" value="${escapeHtml(state.panchayatDraft.panchayat)}" placeholder="Enter new Panchayat name" required /></label>
          </div>
          <div class="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <button type="button" class="ghost-button justify-center" data-action="close-panchayat-form">Cancel</button>
            <button type="submit" class="primary-button justify-center">Save Mapping</button>
          </div>
        </form>
      </section>
    </div>
  `;
}

export function buildRecordFormModal(state: AppState, serialPreview: number) {
  if (!state.showFormModal) return '';

  const uniqueBlocks = Array.from(new Set([...BLOCKS, state.formDraft.block])).filter(Boolean).sort();

  const panchayatHtml = `<input class="field-input" type="text" name="panchayat" list="panchayat-suggestions" value="${escapeHtml(state.formDraft.panchayat)}" placeholder="Type to auto-fill..." required autocomplete="off" /><datalist id="panchayat-suggestions"></datalist>`;

  return `
    <div class="modal-shell z-40">
      <div class="modal-backdrop" data-action="close-form"></div>
      <section class="modal-card">
        <div class="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div><p class="eyebrow">Maintenance Entry</p><h3 class="mt-2 text-2xl font-semibold text-slate-900">${state.formDraft.id ? 'Edit Record' : 'Add Record'}</h3></div>
          <button type="button" class="ghost-button" data-action="close-form">Close</button>
        </div>
        <form id="record-form" class="max-h-[calc(100vh-8rem)] overflow-y-auto px-5 py-5 sm:px-6">
          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label class="field"><span class="field-label">S.No</span><input class="field-input bg-slate-100" type="text" value="${serialPreview}" readonly /></label>
            <label class="field"><span class="field-label">Maintenance Date</span><input class="field-input" type="date" name="date" value="${escapeHtml(state.formDraft.date)}" required /></label>
            <label class="field"><span class="field-label">Agency</span><select class="field-input" name="agency" required>${buildOptions(AGENCIES, state.formDraft.agency)}</select></label>
            <label class="field"><span class="field-label">District</span><input class="field-input bg-slate-100" type="text" value="${escapeHtml(state.formDraft.district)}" readonly /></label>
            <label class="field"><span class="field-label">Block</span><select class="field-input" name="block" required>${buildOptions(uniqueBlocks, state.formDraft.block)}</select></label>
            <label class="field"><span class="field-label">Panchayat</span>${panchayatHtml}</label>
            <label class="field"><span class="field-label">Ward</span><input class="field-input" type="text" name="ward" value="${escapeHtml(state.formDraft.ward)}" required /></label>
            <label class="field"><span class="field-label">Pole Name</span><input class="field-input" type="text" name="poleName" list="pole-suggestions" value="${escapeHtml(state.formDraft.poleName)}" autocomplete="off" /><datalist id="pole-suggestions"></datalist></label>
            <label class="field"><span class="field-label">IMEI No</span><input class="field-input" type="text" name="imeiNo" list="imei-suggestions" value="${escapeHtml(state.formDraft.imeiNo)}" autocomplete="off" /><datalist id="imei-suggestions"></datalist></label>
            <label class="field"><span class="field-label">CMS Status</span><select class="field-input" name="cmsStatus" required>${buildOptions(CMS_STATUSES, state.formDraft.cmsStatus)}</select></label>
            <label class="field"><span class="field-label">Agency Status</span><select class="field-input" name="status" required>${buildOptions(AGENCY_STATUSES, state.formDraft.status)}</select></label>
            <label class="field md:col-span-2 xl:col-span-1"><span class="field-label">Upload Photos</span><input class="field-input file:mr-3 file:rounded-full file:border-0 file:bg-amber-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-amber-900" type="file" name="photos" accept="image/*" multiple /></label>
            <label class="field md:col-span-2 xl:col-span-3"><span class="field-label">Agency Remarks</span><textarea class="field-input min-h-28 resize-y" name="remarks" rows="4">${escapeHtml(state.formDraft.remarks)}</textarea></label>
          </div>
          <div class="mt-6">
            <div class="mb-3 flex items-center justify-between gap-3"><div><h4 class="text-sm font-semibold text-slate-900">Photo Preview</h4><p class="text-xs text-slate-500">Images are stored as Base64 in LocalStorage.</p></div><span class="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">${state.formDraft.photos.length} photo(s)</span></div>
            ${buildPhotoPreview(state.formDraft.photos)}
          </div>
          <div class="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <button type="button" class="ghost-button justify-center" data-action="close-form">Cancel</button>
            <button type="submit" class="primary-button justify-center">${state.formDraft.id ? 'Update Record' : 'Save Record'}</button>
          </div>
        </form>
      </section>
    </div>
  `;
}

export function buildDashboardView(state: AppState, filteredCount: number, solvedCount: number, pendingCount: number, photoCount: number, tableHtml: string, cardHtml: string, paginationHtml: string) {
  const availableAgencies = Array.from(new Set(getFilteredRecords(state.records, { ...state.filters, agency: '' }).map((r) => r.agency))).sort();
  const availableBlocks = Array.from(new Set(getFilteredRecords(state.records, { ...state.filters, block: '' }).map((r) => r.block))).sort();
  
  return `
    <main class="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.12),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.11),_transparent_32%),linear-gradient(180deg,_#f7fbff_0%,_#edf6f4_48%,_#f8fafc_100%)] pb-28">
      <div class="mx-auto max-w-9xl px-5 py-5 sm:px-7 lg:px-9">
        <header class="solar-panel p-6 sm:p-8">
          <div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div class="max-w-3xl">
              <p class="eyebrow">Smart Solar Street Light Maintenance</p>
              <h1 class="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Dashboard</h1>
              <p class="mt-3 text-sm leading-7 text-slate-600 sm:text-base">Maintain offline inspection records, manage photo evidence, filter by agency or block, and generate export-ready reports directly in the browser.</p>
            </div>
            <div class="flex flex-wrap items-center gap-3"><button type="button" class="ghost-button border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100" data-action="open-panchayat-form">Add Panchayat</button><button type="button" class="ghost-button border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100" data-action="open-form">Add Record</button><button type="button" class="ghost-button" data-action="logout">Logout</button></div>
          </div>
          <div class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article class="metric-card"><span class="metric-label">Total Records</span><strong class="metric-value">${filteredCount}</strong><p class="metric-caption">Filtered results from LocalStorage.</p></article>
            <article class="metric-card"><span class="metric-label">Solved</span><strong class="metric-value text-emerald-700">${solvedCount}</strong><p class="metric-caption">Resolved maintenance records.</p></article>
            <article class="metric-card"><span class="metric-label">Pending / Underprocess</span><strong class="metric-value text-rose-700">${pendingCount}</strong><p class="metric-caption">Open or ongoing maintenance records.</p></article>
            <article class="metric-card"><span class="metric-label">Photo Archive</span><strong class="metric-value">${photoCount}</strong><p class="metric-caption">Stored images linked to current filters.</p></article>
          </div>
        </header>
        <section class="max-lg:relative lg:sticky top-0 z-30 mt-6 lg:top-4">
          <div class="rounded-3xl border border-white/70 bg-white/90 p-4 shadow-lg shadow-slate-900/5 backdrop-blur">
            <div class="grid grid-cols-2 gap-4 lg:grid-cols-5 xl:flex xl:flex-row xl:items-end">
              <label class="field flex-1"><span class="field-label">Global Search</span><input class="field-input" type="text" name="filterSearch" value="${escapeHtml(state.filters.search)}" placeholder="Search IDs, Wards..." /></label>
              <label class="field flex-1"><span class="field-label">Agency Filter</span><select class="field-input" name="filterAgency">${buildOptions(availableAgencies, state.filters.agency, 'All Agencies')}</select></label>
              <label class="field flex-1"><span class="field-label">Block Filter</span><select class="field-input" name="filterBlock">${buildOptions(availableBlocks, state.filters.block, 'All Blocks')}</select></label>
              <label class="field"><span class="field-label">Date From</span><input class="field-input" type="date" name="filterFromDate" value="${escapeHtml(state.filters.fromDate)}" /></label>
              <label class="field"><span class="field-label">Date To</span><input class="field-input" type="date" name="filterToDate" value="${escapeHtml(state.filters.toDate)}" /></label>
              <label class="field col-span-2 lg:col-span-1 xl:col-auto"><span class="field-label">Sort</span><div class="flex gap-2"><select class="field-input" name="sortBy"><option value="serialNumber" ${state.sortBy==='serialNumber'?'selected':''}>S.No</option><option value="date" ${state.sortBy==='date'?'selected':''}>Date</option><option value="agency" ${state.sortBy==='agency'?'selected':''}>Agency</option><option value="block" ${state.sortBy==='block'?'selected':''}>Block</option><option value="status" ${state.sortBy==='status'?'selected':''}>Agency Status</option></select><select class="field-input" name="sortDirection"><option value="asc" ${state.sortDirection==='asc'?'selected':''}>Asc</option><option value="desc" ${state.sortDirection==='desc'?'selected':''}>Desc</option></select></div></label>
              <div class="col-span-2 grid grid-cols-2 gap-2 lg:col-span-5 xl:col-auto xl:flex xl:flex-row xl:gap-0">
                <button type="button" class="ghost-button justify-center xl:mb-0.5" data-action="export-backup">Backup (.JSON)</button>
                <button type="button" class="ghost-button justify-center xl:mb-0.5" data-action="import-backup">Restore (.JSON)</button>
                <button type="button" class="ghost-button justify-center xl:mb-0.5" data-action="filter-today">Today</button>
                <button type="button" class="ghost-button justify-center xl:mb-0.5" data-action="reset-filters">Reset</button>
              </div>
            </div>
          </div>
        </section>
        <section class="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
          <div class="space-y-6">
            <div class="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div><p class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Records</p><h2 class="mt-1 text-xl font-semibold text-slate-900">Maintenance Registry</h2></div>
              <div class="flex flex-wrap items-center gap-3"><button type="button" class="ghost-button" data-action="export-excel">Export Excel</button><button type="button" class="ghost-button" data-action="export-doc">Export DOC</button><button type="button" class="primary-button" data-action="export-pdf">Export PDF</button></div>
            </div>
            ${tableHtml}
            ${cardHtml}
            ${paginationHtml ? `<div class="rounded-3xl border border-slate-200 bg-white shadow-sm">${paginationHtml}</div>` : ''}
          </div>
          <aside class="space-y-6 xl:sticky xl:top-24">
            <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div class="mb-5"><p class="eyebrow">Export Header</p><h2 class="mt-2 text-2xl font-semibold text-slate-900">Report Settings</h2></div>
              <div class="space-y-4">
                <label class="field"><span class="field-label">Report Title</span><input class="field-input" type="text" name="exportTitle" value="${escapeHtml(state.exportHeader.title)}" /></label>
                <label class="field"><span class="field-label">Agency Subtitle</span><input class="field-input" type="text" name="exportSubtitle" value="${escapeHtml(state.exportHeader.subtitle)}" placeholder="Visible when agency is filtered" /></label>
                <label class="field"><span class="field-label">Header Date</span><input class="field-input" type="date" name="exportDate" value="${escapeHtml(state.exportHeader.date)}" /></label>
                <label class="field"><span class="field-label">Export Orientation</span><select class="field-input" name="exportOrientation"><option value="portrait" ${state.exportHeader.orientation === 'portrait' ? 'selected' : ''}>Portrait</option><option value="landscape" ${state.exportHeader.orientation === 'landscape' ? 'selected' : ''}>Landscape</option></select></label>
              </div>
              <div class="mt-6 rounded-2xl bg-slate-900 px-4 py-4 text-sm text-slate-200">
                <p class="font-semibold text-white">${escapeHtml(state.exportHeader.title || 'Solar Street Light Maintenance Report')}</p>
                ${state.exportHeader.subtitle.trim() ? `<p class="mt-1 text-slate-300">${escapeHtml(state.exportHeader.subtitle)}</p>` : ''}
                <p class="mt-2 text-xs uppercase tracking-[0.14em] text-slate-400">Date • ${escapeHtml(state.exportHeader.date)}</p>
                <p class="mt-2 text-xs uppercase tracking-[0.14em] text-slate-400">Layout • ${escapeHtml(state.exportHeader.orientation)}</p>
              </div>
            </section>
            <section class="rounded-3xl border border-amber-200 bg-amber-50/70 p-5 shadow-sm">
              <p class="eyebrow">Offline Notes</p>
              <ul class="mt-3 space-y-2 text-sm leading-6 text-slate-700"><li>All records and the login session are stored in LocalStorage.</li><li>Deleting a record removes its saved photo data locally.</li><li>PDF and DOC exports include the image section after the table.</li></ul>
            </section>
          </aside>
        </section>
      </div>
      <footer class="mx-auto mt-10 max-w-9xl px-5 text-center text-sm font-medium text-slate-500 sm:px-7 lg:px-9">Managed By Mantu Kumar</footer>
      <button type="button" class="primary-button fixed bottom-5 right-4 z-40 rounded-full px-5 py-3 shadow-xl lg:hidden" data-action="open-form">+ Add Record</button>
    </main>
    ${buildPanchayatFormModal(state)}
    ${buildDeleteModal(Boolean(state.deleteRecordId))}
    ${buildToastStack(state.toasts)}
  `;
}

export { buildTable, buildCards, buildPagination, buildToastStack };
