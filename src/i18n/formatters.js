import { getLocale } from './languages.js';

export const formatCurrency = (value, currency = 'MXN', language = 'es') => new Intl.NumberFormat(getLocale(language), {
  style: 'currency', currency, currencyDisplay: 'code',
}).format(value);

export const formatDate = (value, language = 'es') => value ? new Intl.DateTimeFormat(getLocale(language), {
  dateStyle: 'medium', timeStyle: 'short',
}).format(new Date(value)) : '—';
