
// Function to parse delivery time string (e.g., "24h 15m 30s" or "-24h 15m") to hours
export const parseDeliveryTime = (timeStr: string): number => {
  if (!timeStr) return 0;
  
  // Check if the time is negative
  const isNegative = timeStr.startsWith('-');
  const cleanTimeStr = timeStr.replace(/^-/, ''); // Remove negative sign for parsing
  
  let totalHours = 0;
  
  // Extract hours
  const hoursMatch = cleanTimeStr.match(/(\d+)h/);
  if (hoursMatch && hoursMatch[1]) {
    totalHours += parseInt(hoursMatch[1]);
  }

  // Extract minutes and convert to hours
  const minutesMatch = cleanTimeStr.match(/(\d+)m/);
  if (minutesMatch && minutesMatch[1]) {
    totalHours += parseInt(minutesMatch[1]) / 60;
  }
  
  // Return negative value if the original string was negative
  return isNegative ? -totalHours : totalHours;
};

// Function to format delivery time in hours and minutes (no seconds)
export const formatDeliveryTime = (timeStr: string): string => {
  if (!timeStr) return '';
  
  // Check if the time is negative and preserve the sign
  const isNegative = timeStr.startsWith('-');
  const cleanTimeStr = timeStr.replace(/^-/, ''); // Remove negative sign for parsing
  
  // Extract hours, minutes from the time string
  const hoursMatch = cleanTimeStr.match(/(\d+)h/);
  const minutesMatch = cleanTimeStr.match(/(\d+)m/);
  
  const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
  
  // Return formatted string with hours and minutes, preserving negative sign
  return `${isNegative ? '-' : ''}${hours}h ${minutes}m`;
};
