export const getErrorMessage = (err, fallback = 'Something went wrong. Please try again.') => {
  if (err?.response) {
    const body = err.response.data;
    if (Array.isArray(body?.errors) && body.errors.length > 0) {
      return body.errors.map((e) => e.message).join(' • ');
    }
    if (body?.message) return body.message;
    return `${fallback} (HTTP ${err.response.status})`;
  }
  if (err?.request) return 'Cannot reach the server. Check your connection and try again.';
  return err?.message || fallback;
};
