import { useCallback, useState } from 'react';

export default function useToast() {
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const showToast = useCallback((message, severity = 'success') => {
    setToast({ open: true, message, severity });
  }, []);

  const closeToast = useCallback(() => setToast((t) => ({ ...t, open: false })), []);

  return { toast, showToast, closeToast };
}
