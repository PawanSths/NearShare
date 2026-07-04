import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEvent } from '@/services/api';
import type { EventCreate } from '@/types/event';

export function CreateEventPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<EventCreate>({
    title: '',
    description: '',
    category: 'SOCIAL',
    startTime: '',
    location: '',
    latitude: 0,
    longitude: 0,
    maxAttendees: 10,
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await createEvent(form);
      navigate(`/events/${created.id}`);
    } catch {
      // ignore for now
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 800, mx: 'auto' }}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>Create Event</Typography>
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField label="Title" value={form.title} onChange={(e) => setForm(f => ({...f, title: e.target.value}))} required fullWidth />
              <TextField label="Description" value={form.description} onChange={(e) => setForm(f => ({...f, description: e.target.value}))} required multiline minRows={3} fullWidth />
              <TextField label="Location" value={form.location} onChange={(e) => setForm(f => ({...f, location: e.target.value}))} required fullWidth />
              <TextField label="Start Time (ISO)" value={form.startTime} onChange={(e) => setForm(f => ({...f, startTime: e.target.value}))} required fullWidth />
              <Stack direction="row" spacing={2}>
                <TextField label="Latitude" type="number" value={form.latitude} onChange={(e) => setForm(f => ({...f, latitude: Number(e.target.value)}))} />
                <TextField label="Longitude" type="number" value={form.longitude} onChange={(e) => setForm(f => ({...f, longitude: Number(e.target.value)}))} />
                <TextField label="Max Attendees" type="number" value={form.maxAttendees} onChange={(e) => setForm(f => ({...f, maxAttendees: Number(e.target.value)}))} />
              </Stack>
              <Stack direction="row" spacing={2}>
                <Button type="submit" variant="contained" disabled={saving}>{saving? 'Creating…':'Create Event'}</Button>
                <Button variant="outlined" onClick={() => navigate(-1)}>Cancel</Button>
              </Stack>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
