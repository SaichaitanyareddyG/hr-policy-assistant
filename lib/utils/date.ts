/**
 * Date Utilities
 * 
 * Native date formatting utilities without external dependencies
 */

/**
 * Format a date to a readable string
 * @example format(new Date(), 'MMM d, yyyy HH:mm') => "Jan 15, 2024 14:30"
 */
export function format(date: Date, formatStr: string): string {
  const d = new Date(date);
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const tokens: Record<string, string> = {
    'yyyy': d.getFullYear().toString(),
    'yy': d.getFullYear().toString().slice(-2),
    'MMMM': fullMonths[d.getMonth()],
    'MMM': months[d.getMonth()],
    'MM': String(d.getMonth() + 1).padStart(2, '0'),
    'M': String(d.getMonth() + 1),
    'dd': String(d.getDate()).padStart(2, '0'),
    'd': String(d.getDate()),
    'HH': String(d.getHours()).padStart(2, '0'),
    'H': String(d.getHours()),
    'hh': String(d.getHours() % 12 || 12).padStart(2, '0'),
    'h': String(d.getHours() % 12 || 12),
    'mm': String(d.getMinutes()).padStart(2, '0'),
    'm': String(d.getMinutes()),
    'ss': String(d.getSeconds()).padStart(2, '0'),
    's': String(d.getSeconds()),
    'a': d.getHours() >= 12 ? 'pm' : 'am',
    'A': d.getHours() >= 12 ? 'PM' : 'AM',
  };

  let result = formatStr;
  // Sort by length descending to replace longer patterns first
  Object.keys(tokens).sort((a, b) => b.length - a.length).forEach(token => {
    result = result.replace(new RegExp(token, 'g'), tokens[token]);
  });
  
  return result;
}

/**
 * Format distance to now in human-readable format
 * @example formatDistanceToNow(new Date(Date.now() - 60000)) => "1 minute ago"
 */
export function formatDistanceToNow(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

/**
 * Format a date to a short date string
 * @example formatShortDate(new Date()) => "Jan 15, 2024"
 */
export function formatShortDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'MMM d, yyyy');
}

/**
 * Format a date to a full datetime string
 * @example formatDateTime(new Date()) => "Jan 15, 2024 at 2:30 PM"
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'MMM d, yyyy') + ' at ' + format(d, 'h:mm A');
}
