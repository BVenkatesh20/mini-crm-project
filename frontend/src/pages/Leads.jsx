import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
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
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SearchIcon from '@mui/icons-material/Search';
import { companiesApi, leadsApi, usersApi } from '../api';
import ConfirmDialog from '../components/ConfirmDialog';
import LeadFormDialog from '../components/LeadFormDialog';
import PageHeader from '../components/PageHeader';
import StatusChip from '../components/StatusChip';
import Toast from '../components/Toast';
import { LEAD_STATUSES } from '../constants';
import useDebounce from '../hooks/useDebounce';
import useToast from '../hooks/useToast';
import { getErrorMessage } from '../utils/errors';

const FILTER_SELECT_PROPS = { InputLabelProps: { shrink: true }, SelectProps: { displayEmpty: true } };

export default function Leads() {
  const [filters, setFilters] = useState({ search: '', status: '', assignedTo: '', company: '' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [result, setResult] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const { toast, showToast, closeToast } = useToast();
  const debouncedSearch = useDebounce(filters.search, 400);

  useEffect(() => {
    Promise.all([usersApi.list(), companiesApi.list()])
      .then(([u, c]) => {
        setUsers(u);
        setCompanies(c);
      })
      .catch((err) => showToast(getErrorMessage(err, 'Could not load users and companies.'), 'error'));
  }, [showToast]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    leadsApi
      .list({
        page: page + 1,
        limit: rowsPerPage,
        search: debouncedSearch || undefined,
        status: filters.status || undefined,
        assignedTo: filters.assignedTo || undefined,
        company: filters.company || undefined,
      })
      .then((res) => {
        if (active) setResult({ items: res.data, total: res.pagination.total });
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, 'Could not load leads.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, rowsPerPage, debouncedSearch, filters.status, filters.assignedTo, filters.company, refreshKey]);

  const reload = useCallback(() => setRefreshKey((k) => k + 1), []);

  const handleFilterChange = (field) => (e) => {
    setFilters((f) => ({ ...f, [field]: e.target.value }));
    setPage(0);
  };

  const openCreate = () => {
    setEditingLead(null);
    setFormOpen(true);
  };

  const openEdit = (lead) => {
    setEditingLead(lead);
    setFormOpen(true);
  };

  const handleSaved = (message) => {
    setFormOpen(false);
    showToast(message);
    reload();
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await leadsApi.remove(deleteTarget._id);
      setDeleteTarget(null);
      showToast('Lead deleted');
      if (result.items.length === 1 && page > 0) setPage((p) => p - 1);
      else reload();
    } catch (err) {
      setDeleteError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Leads"
        subtitle="Create, search and manage your leads"
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            New lead
          </Button>
        }
      />

      <Paper variant="outlined" sx={{ p: 2, mb: 2, display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: '2fr 1fr 1fr 1fr' } }}>
        <TextField
          size="small"
          label="Search"
          placeholder="Name, email or phone"
          value={filters.search}
          onChange={handleFilterChange('search')}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          InputLabelProps={{ shrink: true }}
        />
        <TextField select size="small" label="Status" value={filters.status} onChange={handleFilterChange('status')} {...FILTER_SELECT_PROPS}>
          <MenuItem value="">All statuses</MenuItem>
          {LEAD_STATUSES.map((s) => (
            <MenuItem key={s} value={s}>
              {s}
            </MenuItem>
          ))}
        </TextField>
        <TextField select size="small" label="Assigned user" value={filters.assignedTo} onChange={handleFilterChange('assignedTo')} {...FILTER_SELECT_PROPS}>
          <MenuItem value="">All users</MenuItem>
          {users.map((u) => (
            <MenuItem key={u._id} value={u._id}>
              {u.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField select size="small" label="Company" value={filters.company} onChange={handleFilterChange('company')} {...FILTER_SELECT_PROPS}>
          <MenuItem value="">All companies</MenuItem>
          {companies.map((c) => (
            <MenuItem key={c._id} value={c._id}>
              {c.name}
            </MenuItem>
          ))}
        </TextField>
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
          <Table size="medium">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Assigned to</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : result.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No leads found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                result.items.map((lead) => (
                  <TableRow key={lead._id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{lead.name}</TableCell>
                    <TableCell>{lead.email}</TableCell>
                    <TableCell>{lead.phone}</TableCell>
                    <TableCell>{lead.company?.name || '—'}</TableCell>
                    <TableCell>{lead.assignedTo?.name || 'Unassigned'}</TableCell>
                    <TableCell>
                      <StatusChip status={lead.status} />
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      <Tooltip title="Edit">
                        <IconButton aria-label={`Edit ${lead.name}`} size="small" onClick={() => openEdit(lead)}>
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          aria-label={`Delete ${lead.name}`}
                          size="small"
                          color="error"
                          onClick={() => {
                            setDeleteError('');
                            setDeleteTarget(lead);
                          }}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
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

      <LeadFormDialog open={formOpen} lead={editingLead} users={users} companies={companies} onClose={() => setFormOpen(false)} onSaved={handleSaved} />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete lead?"
        message={deleteTarget ? `“${deleteTarget.name}” will be removed from your leads and dashboard counts.` : ''}
        loading={deleting}
        error={deleteError}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />

      <Toast toast={toast} onClose={closeToast} />
    </>
  );
}
