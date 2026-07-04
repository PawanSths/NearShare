import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteProfile, getProfile, updateProfile } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import type { ProfileResponse } from '@/types/auth';

export function ProfilePage() {
  const navigate = useNavigate();
  const { token, clearAuth, setAuth } = useAuthStore((state) => ({
    token: state.token,
    clearAuth: state.clearAuth,
    setAuth: state.setAuth,
  }));
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    displayName: '',
    username: '',
    bio: '',
    profilePhoto: '',
    interests: '',
    discoveryRadius: 10,
  });

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    async function loadProfile() {
      try {
        const data = await getProfile();
        setProfile(data);
        setForm({
          displayName: data.user.displayName,
          username: data.user.username,
          bio: data.user.bio ?? '',
          profilePhoto: data.user.profilePhoto ?? '',
          interests: data.user.interests.join(', '),
          discoveryRadius: data.user.discoveryRadius,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load profile');
      } finally {
        setLoading(false);
      }
    }

    void loadProfile();
  }, [navigate, token]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const response = await updateProfile({
        displayName: form.displayName,
        username: form.username,
        bio: form.bio || null,
        profilePhoto: form.profilePhoto || null,
        interests: form.interests
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        discoveryRadius: Number(form.discoveryRadius),
      });
      setProfile(response);
      setAuth(token, response.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save profile');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete your account? This cannot be undone.')) {
      return;
    }

    try {
      await deleteProfile();
      clearAuth();
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete account');
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 900, mx: 'auto' }}>
      <Stack spacing={3}>
        <Card>
          <CardContent>
            <Typography variant="h4" gutterBottom>
              Your Profile
            </Typography>
            <Typography color="text.secondary">
              Keep your profile current so nearby events can feel more relevant.
            </Typography>
            {error ? <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert> : null}
          </CardContent>
        </Card>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Overview
                </Typography>
                <Stack spacing={1.5}>
                  <Typography variant="body1">
                    <strong>{profile?.user.displayName}</strong>
                  </Typography>
                  <Typography color="text.secondary">@{profile?.user.username}</Typography>
                  <Typography color="text.secondary">
                    {profile?.user.bio || 'Add a short bio to introduce yourself.'}
                  </Typography>
                  <Divider />
                  <Typography variant="subtitle2">Interests</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {(profile?.user.interests ?? []).map((interest) => (
                      <Chip key={interest} label={interest} />
                    ))}
                  </Box>
                  <Divider />
                  <Typography variant="subtitle2">
                    Discovery radius: {profile?.user.discoveryRadius} km
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Edit Profile
                </Typography>
                <Box component="form" onSubmit={handleSubmit}>
                  <Stack spacing={2}>
                    <TextField
                      label="Display Name"
                      value={form.displayName}
                      onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
                      required
                      fullWidth
                    />
                    <TextField
                      label="Username"
                      value={form.username}
                      onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                      required
                      fullWidth
                    />
                    <TextField
                      label="Bio"
                      value={form.bio}
                      onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
                      multiline
                      minRows={3}
                      fullWidth
                    />
                    <TextField
                      label="Profile Photo URL"
                      value={form.profilePhoto}
                      onChange={(event) => setForm((current) => ({ ...current, profilePhoto: event.target.value }))}
                      fullWidth
                    />
                    <TextField
                      label="Interests"
                      value={form.interests}
                      onChange={(event) => setForm((current) => ({ ...current, interests: event.target.value }))}
                      helperText="Comma separated"
                      fullWidth
                    />
                    <TextField
                      label="Discovery Radius (km)"
                      type="number"
                      value={form.discoveryRadius}
                      onChange={(event) => setForm((current) => ({ ...current, discoveryRadius: Number(event.target.value) }))}
                      slotProps={{ htmlInput: { min: 1, max: 100 } }}
                      fullWidth
                    />
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                      <Button type="submit" variant="contained" disabled={saving}>
                        {saving ? 'Saving…' : 'Save Changes'}
                      </Button>
                      <Button color="error" variant="outlined" onClick={handleDelete}>
                        Delete Account
                      </Button>
                    </Stack>
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Stack>
    </Box>
  );
}
