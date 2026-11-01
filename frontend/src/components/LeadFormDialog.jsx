import { useEffect, useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField } from '@mui/material';
import { leadsApi } from '../api';
import { LEAD_STATUSES } from '../constants';
import { getErrorMessage } from '../utils/errors';
import { validateLead } from '../utils/validation';

const EMPTY = { name: '', email: '', phone: '', status: 'New', assignedTo: '', company: '' };

export default function LeadFormDialog({ open, lead, users, companies, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(
      lead
        ? {
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            status: lead.status,
            assignedTo: lead.assignedTo?._id || '',
            company: lead.company?._id || '',
          }
        : EMPTY
    );
    setErrors({});
    setApiError('');
  }, [open, lead]);

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validateLead(form);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    setApiError('');
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      status: form.status,
      assignedTo: form.assignedTo,
      company: form.company,
    };

    try {
      if (lead) await leadsApi.update(lead._id, payload);
      else await leadsApi.create(payload);
      onSaved(lead ? 'Lead updated' : 'Lead created');
    } catch (err) {
      setApiError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogTitle>{lead ? 'Edit lead' : 'New lead'}</DialogTitle>
        <DialogContent>
          {apiError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {apiError}
            </Alert>
          )}
          <Box sx={{ display: 'grid', gap: 2, pt: 1, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
            <TextField label="Name" value={form.name} onChange={handleChange('name')} error={Boolean(errors.name)} helperText={errors.name} required autoFocus />
            <TextField label="Email" type="email" value={form.email} onChange={handleChange('email')} error={Boolean(errors.email)} helperText={errors.email} required />
            <TextField label="Phone" value={form.phone} onChange={handleChange('phone')} error={Boolean(errors.phone)} helperText={errors.phone} required />
            <TextField select label="Status" value={form.status} onChange={handleChange('status')}>
              {LEAD_STATUSES.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </TextField>
            <TextField select label="Assigned user" value={form.assignedTo} onChange={handleChange('assignedTo')} InputLabelProps={{ shrink: true }} SelectProps={{ displayEmpty: true }}>
              <MenuItem value="">Unassigned</MenuItem>
              {users.map((u) => (
                <MenuItem key={u._id} value={u._id}>
                  {u.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField select label="Company" value={form.company} onChange={handleChange('company')} InputLabelProps={{ shrink: true }} SelectProps={{ displayEmpty: true }}>
              <MenuItem value="">No company</MenuItem>
              {companies.map((c) => (
                <MenuItem key={c._id} value={c._id}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={submitting} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? 'Saving…' : lead ? 'Save changes' : 'Create lead'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
