import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...values) {
  return twMerge(clsx(values));
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

export function formatDate(value, options = { month: 'short', day: 'numeric', year: 'numeric' }) {
  return new Intl.DateTimeFormat('en-US', options).format(new Date(value));
}

export function errorMessage(error, fallback = 'Something went wrong. Please try again.') {
  return error?.response?.data?.error ?? fallback;
}

export function monthLabel(year, month, options = { month: 'short', year: '2-digit' }) {
  return new Intl.DateTimeFormat('en-US', options)
    .format(new Date(Date.UTC(year, month - 1, 1)));
}
