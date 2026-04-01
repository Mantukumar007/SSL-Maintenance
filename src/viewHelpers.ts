import { escapeHtml } from './utils';
import type { PhotoData, ToastMessage } from './types';

export const buildOptions = (options: readonly string[], selectedValue: string, allLabel?: string) =>
  `${allLabel ? `<option value="">${allLabel}</option>` : ''}${options
    .map((option) => `<option value="${escapeHtml(option)}" ${option === selectedValue ? 'selected' : ''}>${escapeHtml(option)}</option>`)
    .join('')}`;

export function buildPhotoPreview(photos: PhotoData[]) {
  if (!photos.length) {
    return `<div class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">No photos selected yet.</div>`;
  }
  return `
    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      ${photos.map((photo) => `
        <article class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <img src="${photo.dataUrl}" alt="${escapeHtml(photo.name)}" class="h-40 w-full object-cover" />
          <div class="flex items-center justify-between gap-3 px-3 py-3">
            <div class="min-w-0">
              <p class="truncate text-sm font-medium text-slate-800">${escapeHtml(photo.name)}</p>
              <p class="text-xs text-slate-500">${Math.round(photo.width || 0)} x ${Math.round(photo.height || 0)}</p>
            </div>
            <button type="button" class="ghost-button text-rose-600" data-action="remove-photo" data-photo-id="${photo.id}">Remove</button>
          </div>
        </article>`).join('')}
    </div>
  `;
}

export function buildToastStack(toasts: ToastMessage[]) {
  if (!toasts.length) return '';
  return `
    <div class="pointer-events-none fixed right-4 top-4 z-[60] flex max-w-sm flex-col gap-3">
      ${toasts.map((toast) => `
        <div class="pointer-events-auto rounded-2xl border px-4 py-3 text-sm shadow-lg ${toast.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}">
          ${escapeHtml(toast.message)}
        </div>`).join('')}
    </div>
  `;
}

export function buildDeleteModal(active: boolean) {
  if (!active) return '';
  return `
    <div class="modal-shell">
      <div class="modal-backdrop" data-action="cancel-delete"></div>
      <section class="relative z-[1] mx-4 w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div class="px-6 py-6">
          <p class="eyebrow">Delete Record</p>
          <h3 class="mt-2 text-xl font-semibold text-slate-900">Confirm deletion</h3>
          <p class="mt-3 text-sm leading-6 text-slate-600">This removes the record and its saved photos from LocalStorage and reassigns serial numbers automatically.</p>
        </div>
        <div class="flex flex-col-reverse gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:justify-end">
          <button type="button" class="ghost-button justify-center" data-action="cancel-delete">Cancel</button>
          <button type="button" class="danger-button justify-center" data-action="confirm-delete">Delete</button>
        </div>
      </section>
    </div>
  `;
}

export function buildPagination(currentPage: number, totalPages: number) {
  if (totalPages <= 1) return '';
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2));
  return `
    <div class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-4 sm:px-6">
      <p class="text-sm text-slate-500">Page ${currentPage} of ${totalPages}</p>
      <div class="flex flex-wrap items-center gap-2">
        <button type="button" class="pagination-button" data-action="change-page" data-page="${Math.max(1, currentPage - 1)}" ${currentPage === 1 ? 'disabled' : ''}>Previous</button>
        ${pages.map((page) => `<button type="button" class="pagination-button ${page === currentPage ? 'is-active' : ''}" data-action="change-page" data-page="${page}">${page}</button>`).join('')}
        <button type="button" class="pagination-button" data-action="change-page" data-page="${Math.min(totalPages, currentPage + 1)}" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>
      </div>
    </div>
  `;
}
