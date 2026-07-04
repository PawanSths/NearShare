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
import { registerUser } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

export function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [form, setForm] = useState({
    email: '',
    password: '',
    displayName: '',
    username: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await registerUser(form);
      setAuth(response.token, response.user);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create account');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 480, mx: 'auto' }}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Create your account
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Join NearBeat to find real-world events close to you.
          </Typography>

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              {error ? <Alert severity="error">{error}</Alert> : null}
              <TextField
                label="Display Name"
                value={form.displayName}
                onChange={(event) => updateField('displayName', event.target.value)}
                required
                fullWidth
              />
              <TextField
                label="Username"
                value={form.username}
                onChange={(event) => updateField('username', event.target.value)}
                required
                fullWidth
              />
              <TextField
                label="Email"
                type="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                required
                fullWidth
              />
              <TextField
                label="Password"
                type="password"
                value={form.password}
                onChange={(event) => updateField('password', event.target.value)}
                required
                fullWidth
              />
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                {isSubmitting ? 'Creating account…' : 'Create Account'}
              </Button>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                Already have an account?{' '}
                <Typography component={RouterLink} to="/login" color="primary" sx={{ cursor: 'pointer' }}>
                  Sign in
                </Typography>
              </Typography>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
