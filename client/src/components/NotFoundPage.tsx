import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: 2,
        p: 3,
        textAlign: 'center',
      }}
    >
      <Typography variant="h3" color="primary">
        404
      </Typography>
      <Typography variant="h6" color="text.secondary">
        Page not found
      </Typography>
      <Typography color="text.secondary">
        The page you are looking for does not exist.
      </Typography>
      <Button component={RouterLink} to="/" variant="contained">
        Back to Home
      </Button>
    </Box>
  );
}
