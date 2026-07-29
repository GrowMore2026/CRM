/**
 * Postgres column exposed by PostgREST for notes / encoded `[Company]` lines.
 * Default matches this project’s Supabase table (`client_feedback`).
 * Override with VITE_SUPABASE_CLIENT_FEEDBACK_COLUMN=feedback if your column is `feedback`.
 */
export const CLIENT_FEEDBACK_COLUMN =
  import.meta.env.VITE_SUPABASE_CLIENT_FEEDBACK_COLUMN?.trim() || 'client_feedback';

/** Raw feedback field from API row (reads configured column, then known alternates). */
export function getClientFeedbackText(client) {
  const preferred = client[CLIENT_FEEDBACK_COLUMN];
  const raw =
    (typeof preferred === 'string' ? preferred : null) ??
    client.client_feedback ??
    client.feedback;
  return typeof raw === 'string' ? raw : '';
}

/** Parses optional prefix lines embedded in client_feedback when columns are absent. */

export function parseClientFeedback(feedback) {
  if (typeof feedback !== 'string' || !feedback.trim()) {
    return { company: '', budget: null, services: [], note: '', panNumber: '', gstNumber: '', payments: [], totalDealGst: 0, totalDealWithGst: 0 };
  }
  const lines = feedback.split('\n');
  let i = 0;
  let company = '';
  let budget = null;
  const services = [];
  let panNumber = '';
  let gstNumber = '';
  const payments = [];
  let createdOn = null;
  let totalDealGst = 0;
  let totalDealWithGst = 0;
  while (i < lines.length) {
    const t = lines[i].trim();
    if (!t) {
      i++;
      continue;
    }
    const crMatch = t.match(/^\[Created on\s*(.+?)\]\s*$/);
    if (crMatch) {
      createdOn = crMatch[1].trim();
      i++;
      continue;
    }
    const cm = t.match(/^\[Company\]\s*(.+)$/);
    if (cm) {
      company = cm[1].trim();
      i++;
      continue;
    }
    const bm = t.match(/^\[Budget ₹([\d.]+)\]\s*$/);
    if (bm) {
      budget = Number(bm[1]);
      i++;
      continue;
    }
    const tdg = t.match(/^\[Total Deal GST ₹([\d.]+)\]\s*$/);
    if (tdg) {
      totalDealGst = Number(tdg[1]);
      i++;
      continue;
    }
    const tdwg = t.match(/^\[Total Deal With GST ₹([\d.]+)\]\s*$/);
    if (tdwg) {
      totalDealWithGst = Number(tdwg[1]);
      i++;
      continue;
    }
    const pm = t.match(/^\[PAN\]\s*(.+)$/);
    if (pm) {
      panNumber = pm[1].trim();
      i++;
      continue;
    }
    const gm = t.match(/^\[GST\]\s*(.+)$/);
    if (gm) {
      gstNumber = gm[1].trim();
      i++;
      continue;
    }
    const pmtMatch = t.match(/^\[Payment\s*₹([\d.]+)\s*on\s*(.+?)\](?:\s*\[(Verified)\])?\s*$/);
    if (pmtMatch) {
      payments.push({ amount: Number(pmtMatch[1]), date: pmtMatch[2].trim(), verified: !!pmtMatch[3] });
      i++;
      continue;
    }
    const sm = t.match(/^\[Services\]\s*(.+)$/);
    if (sm) {
      sm[1].split(';').forEach((s) => {
        const v = s.trim();
        if (v && !services.includes(v)) services.push(v);
      });
      i++;
      continue;
    }
    break;
  }
  const note = lines.slice(i).join('\n').trim();
  return { company, budget, services, note, panNumber, gstNumber, payments, createdOn, totalDealGst, totalDealWithGst };
}

/**
 * @param {Record<string, unknown>} client
 * @returns {string | null}
 */
export function getClientCreationDate(client) {
  const directDate = client.createdAt || client.created_at || client.createdOn;
  if (directDate) return directDate;
  const { createdOn } = parseClientFeedback(getClientFeedbackText(client));
  return createdOn || null;
}

/**
 * @param {Record<string, unknown>} client
 * @returns {number | null}
 */
export function getClientBudgetAmount(client) {
  const col = client.budget;
  if (col != null && col !== '' && Number.isFinite(Number(col))) return Number(col);
  const { budget } = parseClientFeedback(getClientFeedbackText(client));
  return budget != null && Number.isFinite(budget) ? budget : null;
}

/**
 * @param {Record<string, unknown>} client
 * @returns {string}
 */
export function getClientCompanyName(client) {
  const col = client.company;
  if (col != null && String(col).trim()) return String(col).trim();
  const dynCol = client.dynamic_data?.company;
  if (dynCol != null && String(dynCol).trim()) return String(dynCol).trim();
  const { company } = parseClientFeedback(getClientFeedbackText(client));
  return company || '';
}

/** Services from DB column (array/text) or [Services] line in client_feedback. */
export function getClientServicesList(client) {
  const svc = client.service;
  if (Array.isArray(svc) && svc.length) return svc;
  const { services } = parseClientFeedback(getClientFeedbackText(client));
  return services.length ? services : [];
}

/**
 * @param {Record<string, unknown>} client
 * @returns {string}
 */
export function getClientPanNumber(client) {
  const col = client.panNumber;
  if (col != null && String(col).trim()) return String(col).trim();
  const { panNumber } = parseClientFeedback(getClientFeedbackText(client));
  return panNumber || '';
}

/**
 * @param {Record<string, unknown>} client
 * @returns {string}
 */
export function getClientGstNumber(client) {
  const col = client.gstNumber;
  if (col != null && String(col).trim()) return String(col).trim();
  const { gstNumber } = parseClientFeedback(getClientFeedbackText(client));
  return gstNumber || '';
}

/**
 * @param {Record<string, unknown>} client
 * @returns {Array<{amount: number, date: string}>}
 */
export function getClientPaymentsList(client) {
  const { payments } = parseClientFeedback(getClientFeedbackText(client));
  return payments || [];
}

/**
 * @param {Record<string, unknown>} client
 * @returns {number}
 */
export function getClientTotalDealGst(client) {
  const { totalDealGst } = parseClientFeedback(getClientFeedbackText(client));
  return totalDealGst || 0;
}

/**
 * @param {Record<string, unknown>} client
 * @returns {number}
 */
export function getClientTotalDealWithGst(client) {
  const { totalDealWithGst } = parseClientFeedback(getClientFeedbackText(client));
  return totalDealWithGst || 0;
}

export const getStatusStyle = (status) => {
  switch(status) {
    case 'INTERESTED': return { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: 'rgba(16, 185, 129, 0.3)' };
    case 'NOT_INTERESTED': return { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' };
    case 'CALLBACK': return { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' };
    case 'CONTACTED': return { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' };
    case 'DND':
    case 'CUT_CALL': return { bg: 'rgba(107, 114, 128, 0.15)', color: '#6b7280', border: 'rgba(107, 114, 128, 0.3)' };
    default: return { bg: 'var(--bg-primary)', color: 'var(--text-muted)', border: 'var(--border-color)' };
  }
};
