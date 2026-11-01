import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: { main: '#2f5bea' },
    background: { default: '#f5f7fb', paper: '#ffffff' },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } } },
    MuiCard: { defaultProps: { variant: 'outlined' } },
    MuiPaper: { defaultProps: { elevation: 0 } },
    MuiTableCell: { styleOverrides: { head: { fontWeight: 600, whiteSpace: 'nowrap' } } },
  },
});

export default theme;
