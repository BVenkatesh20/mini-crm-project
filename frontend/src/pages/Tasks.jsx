import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Button,
  CircularProgress,
  FormControlLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { tasksApi, usersApi } from '../api';
import PageHeader from '../components/PageHeader';
import StatusChip from '../components/StatusChip';
import TaskFormDialog from '../components/TaskFormDialog';
import Toast from '../components/Toast';
import { TASK_STATUSES } from '../constants';
import { useAuth } from '../context/AuthContext';
import useToast from '../hooks/useToast';
import { getErrorMessage } from '../utils/errors';

export default function Tasks() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState('');
  const [onlyMine, setOnlyMine] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [result, setResult] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [users, setUsers] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const { toast, showToast, closeToast } = useToast();

  useEffect(() => {
    usersApi
      .list()
      .then(setUsers)
      .catch((err) => showToast(getErrorMessage(err, 'Could not load users.'), 'error'));
  }, [showToast]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    tasksApi
      .list({
        page: page + 1,
        limit: rowsPerPage,
        status: statusFilter || undefined,
        assignedTo: onlyMine ? user._id : undefined,
      })
      .then((res) => {
        if (active) setResult({ items: res.data, total: res.pagination.total });
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, 'Could not load tasks.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, rowsPerPage, statusFilter, onlyMine, user._id, refreshKey]);

  const reload = useCallback(() => setRefreshKey((k) => k + 1), []);

  const handleSaved = (message) => {
    setFormOpen(false);
    showToast(message);
    reload();
  };

  // Only the assignee sees an editable status. The API enforces the same rule (403 otherwise).
  const handleStatusChange = async (task, status) => {
    setUpdatingId(task._id);
    try {
      const updated = await tasksApi.updateStatus(task._id, status);
      setResult((r) => ({ ...r, items: r.items.map((t) => (t._id === task._id ? { ...t, status: updated.status } : t)) }));
      showToast('Task status updated');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
      reload();
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Tasks"
        subtitle="Follow-ups for your leads. Only the assigned user can change a task's status."
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}>
            New task
          </Button>
        }
      />

      <Paper variant="outlined" sx={{ p: 2, mb: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
        <TextField
          select
          size="small"
          label="Status"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
          InputLabelProps={{ shrink: true }}
          SelectProps={{ displayEmpty: true }}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All statuses</MenuItem>
          {TASK_STATUSES.map((s) => (
            <MenuItem key={s} value={s}>
              {s}
            </MenuItem>
          ))}
        </TextField>
        <FormControlLabel
          control={
            <Switch
              checked={onlyMine}
              onChange={(e) => {
                setOnlyMine(e.target.checked);
                setPage(0);
              }}
            />
          }
          label="Assigned to me"
        />
      </Paper>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={reload}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      <Paper variant="outlined">
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Lead</TableCell>
                <TableCell>Assigned to</TableCell>
                <TableCell>Due date</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : result.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No tasks found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                result.items.map((task) => {
                  const isAssignee = task.assignedTo?._id === user._id;
                  return (
                    <TableRow key={task._id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{task.title}</TableCell>
                      <TableCell>{task.lead?.name}</TableCell>
                      <TableCell>{task.assignedTo?.name || '—'}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{new Date(task.dueDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {isAssignee ? (
                          <Select
                            size="small"
                            value={task.status}
                            onChange={(e) => handleStatusChange(task, e.target.value)}
                            disabled={updatingId === task._id}
                            inputProps={{ 'aria-label': `Status of ${task.title}` }}
                            sx={{ minWidth: 140 }}
                          >
                            {TASK_STATUSES.map((s) => (
                              <MenuItem key={s} value={s}>
                                {s}
                              </MenuItem>
                            ))}
                          </Select>
                        ) : (
                          <Tooltip title="Only the assigned user can change this status">
                            <span>
                              <StatusChip status={task.status} />
                            </span>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={result.total}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>

      <TaskFormDialog open={formOpen} users={users} currentUserId={user._id} onClose={() => setFormOpen(false)} onSaved={handleSaved} />
      <Toast toast={toast} onClose={closeToast} />
    </>
  );
}
