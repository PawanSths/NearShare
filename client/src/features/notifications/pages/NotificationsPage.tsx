import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '@/services/api';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  eventId: string | null;
  isRead: boolean;
  createdAt: string;
}

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await getNotifications();
        if (mounted) setNotifications(data.notifications);
      } catch {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => { mounted = false; };
  }, []);

  async function handleMarkRead(id: string) {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    } catch {
      // ignore
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // ignore
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">
          Notifications
          {unreadCount > 0 ? (
            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              ({unreadCount} unread)
            </Typography>
          ) : null}
        </Typography>
        {unreadCount > 0 ? (
          <Button variant="outlined" size="small" onClick={handleMarkAllRead}>
            Mark all as read
          </Button>
        ) : null}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : notifications.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">No notifications yet.</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {notifications.map((n) => (
            <Card
              key={n.id}
              sx={{
                opacity: n.isRead ? 0.7 : 1,
                cursor: n.isRead ? 'default' : 'pointer',
              }}
              onClick={() => !n.isRead && handleMarkRead(n.id)}
            >
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="subtitle2">{n.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {n.message}
                    </Typography>
                  </Box>
                  {!n.isRead ? (
                    <Chip label="New" size="small" color="primary" />
                  ) : null}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {new Date(n.createdAt).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}
