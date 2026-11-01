import { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress } from '@mui/material';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import { dashboardApi } from '../api';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { getErrorMessage } from '../utils/errors';

const getLocalDayWindow = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { dayStart: start.toISOString(), dayEnd: end.toISOString() };
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setStats(await dashboardApi.stats(getLocalDayWindow()));
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load dashboard statistics.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <PageHeader title="Dashboard" subtitle="A live overview of your leads and tasks" />

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

      {!loading && stats && (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' } }}>
          <StatCard label="Total leads" value={stats.totalLeads} icon={<PeopleAltOutlinedIcon />} color="primary.main" />
          <StatCard label="Qualified leads" value={stats.qualifiedLeads} icon={<VerifiedOutlinedIcon />} color="success.main" />
          <StatCard label="Tasks due today" value={stats.tasksDueToday} icon={<EventOutlinedIcon />} color="warning.main" />
          <StatCard label="Completed tasks" value={stats.completedTasks} icon={<TaskAltOutlinedIcon />} color="info.main" />
        </Box>
      )}
    </>
  );
}
