import { BLOCKS } from './types';
import { escapeHtml } from './utils';
import type { AuthState } from './types';

export function buildLoginView(auth: AuthState, loginError: string) {
  return `
    <main class="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.18),_transparent_38%),linear-gradient(180deg,_#f7fbff_0%,_#eef6f1_55%,_#f8fafc_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div class="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section class="solar-panel p-8 sm:p-10">
          <p class="eyebrow">Smart Solar Street Light</p>
          <h1 class="mt-4 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">Maintenance Register</h1>
          <p class="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Offline-ready district dashboard for recording inspections, storing site photos in LocalStorage, and exporting maintenance reports as PDF, Excel, and DOC.
          </p>
          <div class="mt-8 grid gap-4 sm:grid-cols-3">
            <article class="metric-card"><span class="metric-label">Local Storage</span><strong class="metric-value">100%</strong><p class="metric-caption">Data persists in the browser without a backend.</p></article>
            <article class="metric-card"><span class="metric-label">Exports</span><strong class="metric-value">3 Formats</strong><p class="metric-caption">PDF, Excel, and DOC reports with images.</p></article>
            <article class="metric-card"><span class="metric-label">Coverage</span><strong class="metric-value">${BLOCKS.length} Blocks</strong><p class="metric-caption">Ready for SARAN district maintenance entries.</p></article>
          </div>
        </section>
        <section class="solar-panel p-6 sm:p-8">
          <div class="mb-6">
            <p class="eyebrow">Authorized Access</p>
            <h2 class="mt-3 text-2xl font-semibold text-slate-900">Login</h2>
            <p class="mt-2 text-sm leading-6 text-slate-600">Use the registered credentials to access the maintenance dashboard.</p>
          </div>
          <form id="login-form" class="space-y-4">
            <label class="field">
              <span class="field-label">Username</span>
              <input class="field-input" type="email" name="username" value="${escapeHtml(auth.username)}" placeholder="Enter username" autocomplete="username" required />
            </label>
            <label class="field">
              <span class="field-label">Password</span>
              <input class="field-input" type="password" name="password" value="${escapeHtml(auth.password)}" placeholder="Enter password" autocomplete="current-password" required />
            </label>
            ${loginError ? `<div class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">${escapeHtml(loginError)}</div>` : ''}
            <button type="submit" class="primary-button w-full justify-center">Login to Dashboard</button>
          </form>
        </section>
      </div>
      <footer class="mx-auto mt-8 max-w-6xl text-center text-sm font-medium text-slate-500">Managed By Mantu Kumar</footer>
    </main>
  `;
}
