import { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { companiesApi } from '../api';
import PageHeader from '../components/PageHeader';
import StatusChip from '../components/StatusChip';
import { getErrorMessage } from '../utils/errors';

const toHref = (website) => (/^https?:\/\//i.test(website) ? website : `https://${website}`);

function Detail({ label, children }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1">{children || '—'}</Typography>
    </Box>
  );
}

export default function CompanyDetails() {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setCompany(await companiesApi.get(id));
    } catch (err) {
      setCompany(null);
      setError(getErrorMessage(err, 'Could not load this company.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <Button component={RouterLink} to="/companies" startIcon={<ArrowBackIcon />} color="inherit" sx={{ mb: 2 }}>
        Back to companies
      </Button>

      {loading && (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && error && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={load}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {!loading && company && (
        <>
          <PageHeader title={company.name} subtitle="Company details and associated leads" />

          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' } }}>
              <Detail label="Industry">{company.industry}</Detail>
              <Detail label="Location">{company.location}</Detail>
              <Detail label="Website">
                {company.website && (
                  <Link href={toHref(company.website)} target="_blank" rel="noopener noreferrer">
                    {company.website}
                  </Link>
                )}
              </Detail>
            </CardContent>
          </Card>

          <Typography variant="h6" sx={{ mb: 1.5 }}>
            Leads ({company.leads.length})
          </Typography>
          <Paper variant="outlined">
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Assigned to</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {company.leads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                        <Typography color="text.secondary">No leads are linked to this company yet</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    company.leads.map((lead) => (
                      <TableRow key={lead._id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{lead.name}</TableCell>
                        <TableCell>{lead.email}</TableCell>
                        <TableCell>{lead.phone}</TableCell>
                        <TableCell>{lead.assignedTo?.name || 'Unassigned'}</TableCell>
                        <TableCell>
                          <StatusChip status={lead.status} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </>
  );
}
