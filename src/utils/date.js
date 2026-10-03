function isValidExpiryFormat(str) {
  if (!str) return true;
  const parts = String(str).trim().split("-");
  if (parts.length !== 3) return false;
  const [day, month, year] = parts.map(Number);
  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) return false;
  if (day < 1 || day > 31) return false;
  if (month < 1 || month > 12) return false;
  if (year < 1900 || year > 2200) return false;
  const d = new Date(year, month - 1, day);
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
}

function isExpired(expiry) {
  if (!expiry) return false;
  const parts = String(expiry).trim().split("-");
  if (parts.length !== 3) return false;
  const [day, month, year] = parts.map(Number);
  const expiryDate = new Date(year, month - 1, day, 23, 59, 59);
  if (isNaN(expiryDate.getTime())) return false;
  return expiryDate.getTime() < Date.now();
}

function formatDateDMY(d) {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}-${month}-${d.getFullYear()}`;
}

function extendExpiry(currentExpiry, days) {
  const extraDays = Number(days);
  const addDays = Number.isFinite(extraDays) && extraDays > 0 ? extraDays : 30;

  let base = new Date();
  if (currentExpiry && isValidExpiryFormat(currentExpiry) && !isExpired(currentExpiry)) {
    const parts = String(currentExpiry).trim().split("-");
    const [day, month, year] = parts.map(Number);
    base = new Date(year, month - 1, day);
  }
  base.setDate(base.getDate() + addDays);
  return formatDateDMY(base);
}

module.exports = {
  isValidExpiryFormat,
  isExpired,
  formatDateDMY,
  extendExpiry,
};
