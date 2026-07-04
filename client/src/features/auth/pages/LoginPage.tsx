import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { loginUser } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await loginUser({ email, password });
      setAuth(response.token, response.user);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 480, mx: 'auto' }}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Welcome back
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Sign in to access your event activity and stay connected to nearby plans.
          </Typography>

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              {error ? <Alert severity="error">{error}</Alert> : null}
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                fullWidth
              />
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                fullWidth
              />
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in…' : 'Sign In'}
              </Button>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                Don&apos;t have an account?{' '}
                <Typography component={RouterLink} to="/register" color="primary" sx={{ cursor: 'pointer' }}>
                  Sign up
                </Typography>
              </Typography>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
