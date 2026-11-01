import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, CircularProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { companiesApi } from '../api';
import CompanyFormDialog from '../components/CompanyFormDialog';
import PageHeader from '../components/PageHeader';
import Toast from '../components/Toast';
import useToast from '../hooks/useToast';
import { getErrorMessage } from '../utils/errors';

export default function Companies() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const { toast, showToast, closeToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setCompanies(await companiesApi.list());
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load companies.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaved = (message) => {
    setFormOpen(false);
    showToast(message);
    load();
  };

  return (
    <>
      <PageHeader
        title="Companies"
        subtitle="Select a company to see its leads"
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}>
            New company
          </Button>
        }
      />

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={load}>
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
                <TableCell>Name</TableCell>
                <TableCell>Industry</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Website</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : companies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No companies yet</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                companies.map((company) => (
                  <TableRow
                    key={company._id}
                    hover
                    tabIndex={0}
                    onClick={() => navigate(`/companies/${company._id}`)}
                    onKeyDown={(e) => e.key === 'Enter' && navigate(`/companies/${company._id}`)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell sx={{ fontWeight: 600 }}>{company.name}</TableCell>
                    <TableCell>{company.industry || '—'}</TableCell>
                    <TableCell>{company.location || '—'}</TableCell>
                    <TableCell>{company.website || '—'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <CompanyFormDialog open={formOpen} onClose={() => setFormOpen(false)} onSaved={handleSaved} />
      <Toast toast={toast} onClose={closeToast} />
    </>
  );
}
