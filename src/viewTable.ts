import { escapeHtml, formatDateDisplay, highlightText } from './utils';
import type { MaintenanceRecord } from './types';

export function buildTable(records: MaintenanceRecord[], query: string = '') {
  if (!records.length) return `<div class="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">No maintenance records match the current filters.</div>`;
  return `
    <div class="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:block">
      <div class="overflow-x-auto w-full">
        <table class="w-full table-auto border-collapse text-left text-xs">
          <thead class="bg-slate-900 text-[10px] uppercase tracking-wider text-slate-100 shadow-sm">
            <tr>${['S.No', 'Date', 'Agency', 'District', 'Block', 'Panchayat', 'Ward', 'Pole Name', 'IMEIno', 'CMS', 'Remarks', 'Status', 'Photos', 'Actions'].map((heading) => `<th class="border-b border-slate-700 px-2 py-2 whitespace-nowrap">${heading}</th>`).join('')}</tr>
          </thead>
          <tbody>${records.map((record) => `
            <tr class="align-top odd:bg-white even:bg-slate-50 text-slate-800 break-words">
              <td class="border-b border-slate-200 px-2 py-2 font-semibold">${record.serialNumber}</td>
              <td class="border-b border-slate-200 px-2 py-2 whitespace-nowrap">${escapeHtml(formatDateDisplay(record.date))}</td>
              <td class="border-b border-slate-200 px-2 py-2">${highlightText(record.agency, query)}</td>
              <td class="border-b border-slate-200 px-2 py-2">${escapeHtml(record.district)}</td>
              <td class="border-b border-slate-200 px-2 py-2">${highlightText(record.block, query)}</td>
              <td class="border-b border-slate-200 px-2 py-2">${highlightText(record.panchayat, query)}</td>
              <td class="border-b border-slate-200 px-2 py-2">${highlightText(record.ward, query)}</td>
              <td class="border-b border-slate-200 px-2 py-2">${highlightText(record.poleName || '-', query)}</td>
              <td class="border-b border-slate-200 px-2 py-2 break-all max-w-[80px]">${highlightText(record.imeiNo || '-', query)}</td>
              <td class="border-b border-slate-200 px-2 py-2">${escapeHtml(record.cmsStatus)}</td>
              <td class="border-b border-slate-200 px-2 py-2 max-w-[150px] leading-tight">${highlightText(record.remarks || '-', query)}</td>
              <td class="border-b border-slate-200 px-2 py-2"><span class="status-chip ${record.status === 'Solved' ? 'status-working' : record.status === 'Pending' ? 'status-fault' : 'status-progress'}">${escapeHtml(record.status)}</span></td>
              <td class="border-b border-slate-200 px-1 py-1"><div class="flex flex-wrap gap-1">${record.photos.length ? record.photos.slice(0, 2).map((photo) => `<img src="${photo.dataUrl}" alt="${escapeHtml(photo.name)}" class="h-8 w-8 rounded-lg border border-slate-200 object-cover" />`).join('') : '<span class="text-slate-400 text-[10px]">None</span>'}</div></td>
              <td class="border-b border-slate-200 px-2 py-2"><div class="flex flex-col gap-1"><button type="button" class="ghost-button text-[10px] px-2 py-1 min-h-0 h-auto" data-action="edit-record" data-record-id="${record.id}">Edit</button><button type="button" class="danger-button text-[10px] px-2 py-1 min-h-0 h-auto" data-action="delete-record" data-record-id="${record.id}">Del</button></div></td>
            </tr>`).join('')}</tbody>
        </table>
      </div>
    </div>
  `;
}

export function buildCards(records: MaintenanceRecord[], query: string = '') {
  if (!records.length) return '';
  return `
    <div class="grid gap-4 lg:hidden">
      ${records.map((record) => `
        <article class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div class="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-4">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">S.No ${record.serialNumber}</p>
              <h3 class="mt-1 text-lg font-semibold text-slate-900">${highlightText(record.block, query)} • ${highlightText(record.panchayat, query)}</h3>
              <p class="text-sm text-slate-500">${escapeHtml(formatDateDisplay(record.date))}</p>
            </div>
            <span class="status-chip ${record.status === 'Solved' ? 'status-working' : record.status === 'Pending' ? 'status-fault' : 'status-progress'}">${escapeHtml(record.status)}</span>
          </div>
          <div class="grid gap-3 px-4 py-4 text-sm text-black sm:grid-cols-2">
            <div><span class="card-label">Agency</span><p class="card-value">${highlightText(record.agency, query)}</p></div>
            <div><span class="card-label">District</span><p class="card-value">${escapeHtml(record.district)}</p></div>
            <div><span class="card-label">Ward</span><p class="card-value">${highlightText(record.ward, query)}</p></div>
            <div><span class="card-label">CMS Status</span><p class="card-value">${escapeHtml(record.cmsStatus)}</p></div>
            <div><span class="card-label">Pole Name</span><p class="card-value">${highlightText(record.poleName || 'N/A', query)}</p></div>
            <div><span class="card-label">IMEI No</span><p class="card-value">${highlightText(record.imeiNo || 'N/A', query)}</p></div>
            <div class="sm:col-span-2"><span class="card-label">Agency Remarks</span><p class="card-value">${highlightText(record.remarks || 'N/A', query)}</p></div>
          </div>
          <div class="border-t border-slate-200 px-4 py-4">
            <div class="mb-3 flex items-center justify-between"><p class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Photos</p><span class="text-xs text-slate-500">${record.photos.length} image(s)</span></div>
            <div class="flex flex-wrap gap-2">${record.photos.length ? record.photos.map((photo) => `<img src="${photo.dataUrl}" alt="${escapeHtml(photo.name)}" class="h-16 w-16 rounded-2xl border border-slate-200 object-cover" />`).join('') : '<span class="text-sm text-slate-400">No photos uploaded.</span>'}</div>
            <div class="mt-4 flex flex-wrap gap-2"><button type="button" class="ghost-button text-sm" data-action="edit-record" data-record-id="${record.id}">Edit</button><button type="button" class="danger-button text-sm" data-action="delete-record" data-record-id="${record.id}">Delete</button></div>
          </div>
        </article>`).join('')}
    </div>
  `;
}
