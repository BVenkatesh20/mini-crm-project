import { useEffect, useState } from 'react';
import { Alert, Autocomplete, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField } from '@mui/material';
import { leadsApi, tasksApi } from '../api';
import useDebounce from '../hooks/useDebounce';
import { getErrorMessage } from '../utils/errors';
import { validateTask } from '../utils/validation';

const makeEmpty = (assignedTo) => ({ title: '', lead: null, assignedTo, dueDate: '' });
const toDueDateISO = (value) => {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0).toISOString();
};

export default function TaskFormDialog({ open, users, currentUserId, onClose, onSaved }) {
  const [form, setForm] = useState(makeEmpty(currentUserId));
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [leadInput, setLeadInput] = useState('');
  const [leadOptions, setLeadOptions] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const debouncedLeadInput = useDebounce(leadInput, 300);

  useEffect(() => {
    if (!open) return;
    setForm(makeEmpty(currentUserId));
    setErrors({});
    setApiError('');
    setLeadInput('');
  }, [open, currentUserId]);

  useEffect(() => {
    if (!open) return undefined;
    let active = true;
    setLeadsLoading(true);
    leadsApi
      .list({ search: debouncedLeadInput, limit: 20 })
      .then((res) => {
        if (active) setLeadOptions(res.data);
      })
      .catch(() => {
        if (active) setLeadOptions([]);
      })
      .finally(() => {
        if (active) setLeadsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, debouncedLeadInput]);

  const setField = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validateTask(form);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    setApiError('');
    try {
      await tasksApi.create({
        title: form.title.trim(),
        lead: form.lead._id,
        assignedTo: form.assignedTo,
        dueDate: toDueDateISO(form.dueDate),
      });
      onSaved('Task created');
    } catch (err) {
      setApiError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogTitle>New task</DialogTitle>
        <DialogContent>
          {apiError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {apiError}
            </Alert>
          )}
          <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
            <TextField label="Title" value={form.title} onChange={(e) => setField('title', e.target.value)} error={Boolean(errors.title)} helperText={errors.title} required autoFocus />
            <Autocomplete
              options={leadOptions}
              value={form.lead}
              loading={leadsLoading}
              onChange={(_, value) => setField('lead', value)}
              inputValue={leadInput}
              onInputChange={(_, value) => setLeadInput(value)}
              getOptionLabel={(option) => option.name || ''}
              isOptionEqualToValue={(option, value) => option._id === value._id}
              filterOptions={(options) => options}
              renderInput={(params) => <TextField {...params} label="Lead" required error={Boolean(errors.lead)} helperText={errors.lead} />}
            />
            <TextField select label="Assign to" value={form.assignedTo} onChange={(e) => setField('assignedTo', e.target.value)} error={Boolean(errors.assignedTo)} helperText={errors.assignedTo} required>
              {users.map((u) => (
                <MenuItem key={u._id} value={u._id}>
                  {u.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Due date"
              type="date"
              value={form.dueDate}
              onChange={(e) => setField('dueDate', e.target.value)}
              error={Boolean(errors.dueDate)}
              helperText={errors.dueDate}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={submitting} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? 'Saving…' : 'Create task'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
