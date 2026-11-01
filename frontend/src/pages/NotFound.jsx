import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';

export default function NotFound() {
  return (
    <Box sx={{ minHeight: '60vh', display: 'grid', placeItems: 'center', textAlign: 'center', p: 2 }}>
      <Box>
        <Typography variant="h3" sx={{ fontWeight: 800 }}>
          404
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          This page doesn’t exist.
        </Typography>
        <Button component={RouterLink} to="/dashboard" variant="contained">
          Go to dashboard
        </Button>
      </Box>
    </Box>
  );
}
