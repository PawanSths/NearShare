import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { getEvents } from '@/services/api';
import type { EventSummary } from '@/types/event';

const categoryColors: Record<string, string> = {
  SOCIAL: '#FF6B6B',
  SPORTS: '#4ECDC4',
  FOOD: '#FFE66D',
  MUSIC: '#A78BFA',
  OUTDOOR: '#34D399',
  OTHER: '#94A3B8',
};

export function EventListPage() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await getEvents();
        if (mounted) setEvents(data);
      } catch {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => { mounted = false; };
  }, []);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Events</Typography>
        <Button component={RouterLink} to="/events/new" variant="contained">Create Event</Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
          {[1, 2, 3, 4].map((n) => (
            <Card key={n}>
              <CardContent>
                <Skeleton variant="text" width="60%" height={32} />
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="text" width="40%" />
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : events.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">No events yet.</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
          {events.map((ev) => (
            <Card key={ev.id}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="h6">{ev.title}</Typography>
                    <Typography color="text.secondary" variant="body2">
                      {ev.location} — {new Date(ev.startTime).toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      by {ev.organizer.displayName}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                    <Chip
                      label={ev.category}
                      size="small"
                      sx={{ bgcolor: `${categoryColors[ev.category] ?? '#94A3B8'}22`, color: categoryColors[ev.category] ?? '#94A3B8', fontWeight: 600 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {ev.participantCount}/{ev.maxAttendees}
                    </Typography>
                  </Box>
                </Box>
                <Typography sx={{ mt: 1 }}>{ev.description}</Typography>
                <Button component={RouterLink} to={`/events/${ev.id}`} sx={{ mt: 2 }}>View Details</Button>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}
