import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getEvent, joinEvent, leaveEvent } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import type { EventSummary } from '@/types/event';

const categoryColors: Record<string, string> = {
  SOCIAL: '#FF6B6B',
  SPORTS: '#4ECDC4',
  FOOD: '#FFE66D',
  MUSIC: '#A78BFA',
  OUTDOOR: '#34D399',
  OTHER: '#94A3B8',
};

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.user?.id);

  const [event, setEvent] = useState<EventSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const eventId = id;
    if (!eventId) return;
    let mounted = true;
    (async () => {
      try {
        const data = await getEvent(eventId);
        if (mounted) setEvent(data);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load event');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  async function handleJoin() {
    if (!id) return;
    setActionLoading(true);
    setError('');
    try {
      await joinEvent(id!);
      const updated = await getEvent(id!);
      setEvent(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join event');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleLeave() {
    if (!id) return;
    setActionLoading(true);
    setError('');
    try {
      await leaveEvent(id!);
      const updated = await getEvent(id!);
      setEvent(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave event');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 900, mx: 'auto' }}>
        <Skeleton variant="text" width={100} height={36} sx={{ mb: 2 }} />
        <Card>
          <CardContent>
            <Skeleton variant="text" width="50%" height={40} />
            <Skeleton variant="text" width="30%" />
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="rectangular" height={40} sx={{ mt: 2, borderRadius: 1 }} />
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (!event) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">Event not found.</Typography>
        <Button onClick={() => navigate('/')} sx={{ mt: 2 }}>Back to Home</Button>
      </Box>
    );
  }

  const isOrganizer = userId === event.organizerId;
  const isFull = event.participantCount >= event.maxAttendees;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 900, mx: 'auto' }}>
      <Button onClick={() => navigate(-1)} sx={{ mb: 2 }}>← Back</Button>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="h4">{event.title}</Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                  Organized by {event.organizer.displayName}
                </Typography>
              </Box>
              <Chip
                label={event.category}
                sx={{
                  bgcolor: `${categoryColors[event.category] ?? '#94A3B8'}22`,
                  color: categoryColors[event.category] ?? '#94A3B8',
                  fontWeight: 600,
                }}
              />
            </Box>

            <Typography variant="body1">{event.description}</Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Location:</strong> {event.location}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Date:</strong>{' '}
                {new Date(event.startTime).toLocaleDateString(undefined, {
                  weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Participants:</strong> {event.participantCount}/{event.maxAttendees}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Status:</strong> {event.status}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              {token ? (
                isOrganizer ? (
                  <Button variant="contained" disabled>
                    You are the organizer
                  </Button>
                ) : event.isParticipant ? (
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleLeave}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Leaving…' : 'Leave Event'}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleJoin}
                    disabled={actionLoading || isFull}
                  >
                    {actionLoading ? 'Joining…' : isFull ? 'Event Full' : 'Join Event'}
                  </Button>
                )
              ) : (
                <Button variant="contained" onClick={() => navigate('/login')}>
                  Sign in to Join
                </Button>
              )}
              {token && event.isParticipant && (
                <Button variant="outlined" onClick={() => navigate(`/chat/${event.id}`)}>
                  Event Chat
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
