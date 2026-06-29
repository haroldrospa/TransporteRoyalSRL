/**
 * Utility for managing user-specific interface settings
 */

export const getManualConduceEnabled = (userId: string): boolean => {
  const val = localStorage.getItem(`manual_conduce_enabled_${userId}`);
  if (val === null) {
    // Default to true for all laboratory users
    return true;
  }
  return val === 'true';
};

export const getExcelUploadEnabled = (userId: string, laboratorio?: string): boolean => {
  const val = localStorage.getItem(`excel_upload_enabled_${userId}`);
  if (val === null) {
    // Default to true for LAM, false for others
    return laboratorio === 'LAM';
  }
  return val === 'true';
};

export const setManualConduceEnabled = (userId: string, enabled: boolean): void => {
  localStorage.setItem(`manual_conduce_enabled_${userId}`, enabled ? 'true' : 'false');
  window.dispatchEvent(new Event('user-settings-changed'));
};

export const setExcelUploadEnabled = (userId: string, enabled: boolean): void => {
  localStorage.setItem(`excel_upload_enabled_${userId}`, enabled ? 'true' : 'false');
  window.dispatchEvent(new Event('user-settings-changed'));
};
