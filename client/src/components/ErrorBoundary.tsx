import { Component, type ErrorInfo, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message?: string | null;
  stack?: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true, message: null, stack: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ message: error.message, stack: error.stack ?? null });
  }

  handleReset = (): void => {
    this.setState({ hasError: false });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            gap: 2,
            p: 3,
            textAlign: 'center',
          }}
        >
          <Typography variant="h4" color="primary">
            Something went wrong
          </Typography>
          <Typography color="text.secondary">
            An unexpected error occurred. Please try again.
          </Typography>
          {this.state.message ? (
            <Box sx={{ mt: 2, maxWidth: '80%', textAlign: 'left' }}>
              <Typography variant="subtitle2">Error:</Typography>
              <Typography sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                {this.state.message}
              </Typography>
              {this.state.stack ? (
                <Typography sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', mt: 1 }}>
                  {this.state.stack}
                </Typography>
              ) : null}
            </Box>
          ) : null}
          <Button variant="contained" onClick={this.handleReset}>
            Go Home
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}
