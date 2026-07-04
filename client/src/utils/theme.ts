import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#FF6B6B',
      light: '#FF8E8E',
      dark: '#E85555',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#4ECDC4',
      light: '#7EDDD6',
      dark: '#3BA99F',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#FAFAFA',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
        },
      },
    },
  },
});
