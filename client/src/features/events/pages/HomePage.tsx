import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Fab from '@mui/material/Fab';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getEvents, getBlockedUsers } from '@/services/api';
import type { EventSummary } from '@/types/event';
import { useAuthStore } from '@/store/authStore';

import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

const eventCategoryColors: Record<string, string> = {
  SOCIAL: '#FF6B6B',
  SPORTS: '#4ECDC4',
  FOOD: '#FFE66D',
  MUSIC: '#A78BFA',
  OUTDOOR: '#34D399',
  OTHER: '#94A3B8',
};

function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function HomePage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<[number, number]>([37.7749, -122.4194]);
  const [maxDistance, setMaxDistance] = useState(50);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedEvent, setSelectedEvent] = useState<EventSummary | null>(null);
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {
          // keep default
        },
        { timeout: 5000 },
      );
    }
  }, []);

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

  useEffect(() => {
    if (!token) return;
    let mounted = true;
    async function loadBlocked() {
      try {
        const data = await getBlockedUsers();
        if (mounted) setBlockedIds(new Set(data.blockedUsers.map((u) => u.id)));
      } catch {
        // ignore
      }
    }
    void loadBlocked();
    return () => { mounted = false; };
  }, [token]);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([37.7749, -122.4194], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    if (userLocation) {
      L.circleMarker(userLocation, {
        radius: 8,
        fillColor: '#3B82F6',
        color: '#fff',
        weight: 2,
        fillOpacity: 0.8,
      })
        .addTo(map)
        .bindPopup('<strong>You are here</strong>');
    }
  }, [userLocation]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (blockedIds.has(event.organizer?.id ?? '')) return false;
      if (categoryFilter !== 'ALL' && event.category !== categoryFilter) return false;
      if (userLocation) {
        const dist = haversineDistanceKm(
          userLocation[0], userLocation[1],
          event.latitude, event.longitude,
        );
        if (dist > maxDistance) return false;
      }
      return true;
    });
  }, [events, categoryFilter, maxDistance, userLocation, blockedIds]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    const points: [number, number][] = [];

    filteredEvents.forEach((event) => {
      const color = eventCategoryColors[event.category] ?? '#94A3B8';
      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width: 28px; height: 28px; border-radius: 50%;
          background: ${color}; border: 3px solid white;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          font-size: 12px; color: white; font-weight: bold;
          cursor: pointer;
        ">${event.title.charAt(0).toUpperCase()}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([event.latitude, event.longitude], { icon })
        .addTo(map)
        .bindPopup(
          `<strong>${event.title}</strong><br/>${event.location}<br/>${new Date(event.startTime).toLocaleString()}`,
        );

      marker.on('click', () => setSelectedEvent(event));
      markersRef.current.push(marker);
      points.push([event.latitude, event.longitude]);
    });

    if (userLocation) {
      points.push([userLocation[0], userLocation[1]]);
    }

    if (points.length > 0) {
      try {
        map.fitBounds(L.latLngBounds(points), { padding: [50, 50], maxZoom: 14 });
      } catch {
        // ignore
      }
    }
  }, [filteredEvents, userLocation]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
      <Box ref={mapRef} sx={{ flex: '1 1 50%', minHeight: 300, zIndex: 0 }} />

      <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryFilter}
              label="Category"
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <MenuItem value="ALL">All Categories</MenuItem>
              <MenuItem value="SOCIAL">Social</MenuItem>
              <MenuItem value="SPORTS">Sports</MenuItem>
              <MenuItem value="FOOD">Food</MenuItem>
              <MenuItem value="MUSIC">Music</MenuItem>
              <MenuItem value="OUTDOOR">Outdoor</MenuItem>
              <MenuItem value="OTHER">Other</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ width: 200 }}>
            <Typography variant="caption" color="text.secondary">
              Max distance: {maxDistance} km
            </Typography>
            <Slider
              value={maxDistance}
              onChange={(_, val) => setMaxDistance(val as number)}
              min={1}
              max={100}
              valueLabelDisplay="auto"
              size="small"
            />
          </Box>
          <Button component={RouterLink} to="/events/new" variant="contained" size="small">
            Create Event
          </Button>
        </Box>
      </Box>

      <Box sx={{ flex: '1 1 50%', overflowY: 'auto', p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredEvents.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">No events found nearby.</Typography>
            <Button component={RouterLink} to="/events/new" variant="outlined" sx={{ mt: 2 }}>
              Create the first event
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {filteredEvents.map((event) => {
              const dist = userLocation
                ? haversineDistanceKm(
                    userLocation[0], userLocation[1],
                    event.latitude, event.longitude,
                  ).toFixed(1)
                : null;

              return (
                <Card
                  key={event.id}
                  sx={{
                    cursor: 'pointer',
                    border: selectedEvent?.id === event.id ? 2 : 0,
                    borderColor: 'primary.main',
                  }}
                  onClick={() => setSelectedEvent(event)}
                >
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {event.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {event.location}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(event.startTime).toLocaleDateString(undefined, {
                            weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                          })}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                        <Chip
                          label={event.category}
                          size="small"
                          sx={{
                            bgcolor: `${eventCategoryColors[event.category] ?? '#94A3B8'}22`,
                            color: eventCategoryColors[event.category] ?? '#94A3B8',
                            fontWeight: 600,
                          }}
                        />
                        {dist ? (
                          <Typography variant="caption" color="text.secondary">
                            {dist} km
                          </Typography>
                        ) : null}
                        <Typography variant="caption" color="text.secondary">
                          {event.participantCount}/{event.maxAttendees}
                        </Typography>
                      </Box>
                    </Box>
                    <Button
                      component={RouterLink}
                      to={`/events/${event.id}`}
                      size="small"
                      variant="outlined"
                      sx={{ mt: 1 }}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
      </Box>

      <Fab
        component={RouterLink}
        to="/events/new"
        color="primary"
        aria-label="create event"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
      >
        +
      </Fab>
    </Box>
  );
}
