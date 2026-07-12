/**
 * Format currency (INR)
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

/**
 * Format date to locale string
 */
export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format date + time
 */
export const formatDateTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format distance
 */
export const formatDistance = (km) => {
  if (!km && km !== 0) return '—';
  return `${Number(km).toLocaleString()} km`;
};

/**
 * Format weight
 */
export const formatWeight = (kg) => {
  if (!kg && kg !== 0) return '—';
  return `${Number(kg).toLocaleString()} kg`;
};

/**
 * Format percentage
 */
export const formatPercent = (value) => {
  if (!value && value !== 0) return '—';
  return `${Number(value).toFixed(1)}%`;
};

/**
 * Relative time (e.g., "2 hours ago")
 */
export const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
    }
  }
  return 'Just now';
};
