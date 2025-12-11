export const allowedProductRenderTypes = [
  'hot',
  'related',
  'new',
  'plp',
  'perfect-match',
  'similar-products',
];

// ---- Validation helpers ----
export const sanitizeText = (value) => {
  // Remove any characters that could be dangerous in HTML context
  return value.replace(/[<>"]/g, '');
};

export const validateRange = (value, fallback, min, max) => {
  const num = parseInt(value, 10);
  if (isNaN(num)) return fallback;
  return Math.min(Math.max(num, min), max); // clamp between min & max
};

export const debounce = (func, delay) => {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
};
