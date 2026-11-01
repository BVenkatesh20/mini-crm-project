import { Chip } from '@mui/material';

const COLORS = {
  // Lead statuses
  New: 'info',
  Contacted: 'warning',
  Qualified: 'success',
  Lost: 'error',
  // Task statuses
  Pending: 'default',
  'In Progress': 'info',
  Completed: 'success',
};

export default function StatusChip({ status }) {
  return <Chip size="small" label={status} color={COLORS[status] || 'default'} variant="outlined" />;
}
