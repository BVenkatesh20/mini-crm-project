import { Box, Card, CardContent, Typography } from '@mui/material';

export default function StatCard({ label, value, icon, color = 'primary.main' }) {
  return (
    <Card>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
            bgcolor: color,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary" noWrap>
            {label}
          </Typography>
          <Typography variant="h4" component="p" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            {value}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
