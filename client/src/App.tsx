import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AppRouter } from '@/components/AppRouter';
import { theme } from '@/utils/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <ErrorBoundary>
            <AppRouter />
          </ErrorBoundary>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
