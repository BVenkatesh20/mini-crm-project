import { Alert, Snackbar } from '@mui/material';

export default function Toast({ toast, onClose }) {
  return (
    <Snackbar open={toast.open} autoHideDuration={5000} onClose={onClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
      <Alert onClose={onClose} severity={toast.severity} variant="filled" sx={{ width: '100%' }}>
        {toast.message}
      </Alert>
    </Snackbar>
  );
}
