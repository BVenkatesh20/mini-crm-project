import { useEffect, useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import { companiesApi } from '../api';
import { getErrorMessage } from '../utils/errors';
import { validateCompany } from '../utils/validation';

const EMPTY = { name: '', industry: '', website: '', location: '' };

export default function CompanyFormDialog({ open, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(EMPTY);
    setErrors({});
    setApiError('');
  }, [open]);

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validateCompany(form);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    setApiError('');
    try {
      await companiesApi.create({
        name: form.name.trim(),
        industry: form.industry.trim(),
        website: form.website.trim(),
        location: form.location.trim(),
      });
      onSaved('Company created');
    } catch (err) {
      setApiError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogTitle>New company</DialogTitle>
        <DialogContent>
          {apiError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {apiError}
            </Alert>
          )}
          <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
            <TextField label="Company name" value={form.name} onChange={handleChange('name')} error={Boolean(errors.name)} helperText={errors.name} required autoFocus />
            <TextField label="Industry" value={form.industry} onChange={handleChange('industry')} error={Boolean(errors.industry)} helperText={errors.industry} />
            <TextField label="Website" placeholder="example.com" value={form.website} onChange={handleChange('website')} error={Boolean(errors.website)} helperText={errors.website} />
            <TextField label="Location" value={form.location} onChange={handleChange('location')} error={Boolean(errors.location)} helperText={errors.location} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={submitting} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? 'Saving…' : 'Create company'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
