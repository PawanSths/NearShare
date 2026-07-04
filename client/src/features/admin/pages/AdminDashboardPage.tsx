import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import {
  getAdminUsers, getAdminEvents, getAdminReports,
  suspendUser, unsuspendUser, adminDeleteUser,
  adminDeleteEvent, markReportReviewed, dismissReport,
} from '@/services/api';

interface AdminUser { id: string; email: string; username: string; displayName: string; role: string; isSuspended: boolean; createdAt: string }
interface AdminEvent { id: string; title: string; category: string; status: string; startTime: string; organizer: { id: string; displayName: string }; participantCount: number }
interface AdminReport { id: string; targetType: string; reason: string; status: string; createdAt: string; reporter: { id: string; displayName: string }; reportedUser: { id: string; displayName: string; username: string } | null; event: { id: string; title: string } | null }

export function AdminDashboardPage() {
  const [tab, setTab] = useState(0);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [u, e, r] = await Promise.all([getAdminUsers(), getAdminEvents(), getAdminReports()]);
        if (mounted) {
          setUsers(u.users);
          setEvents(e.events);
          setReports(r.reports);
        }
      } catch {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => { mounted = false; };
  }, []);

  async function handleSuspend(id: string) {
    await suspendUser(id);
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, isSuspended: true } : u)));
  }

  async function handleUnsuspend(id: string) {
    await unsuspendUser(id);
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, isSuspended: false } : u)));
  }

  async function handleDeleteUser(id: string) {
    if (!window.confirm('Delete this user? This cannot be undone.')) return;
    await adminDeleteUser(id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  async function handleDeleteEvent(id: string) {
    if (!window.confirm('Delete this event?')) return;
    await adminDeleteEvent(id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  async function handleReview(id: string) {
    await markReportReviewed(id);
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'REVIEWED' } : r)));
  }

  async function handleDismiss(id: string) {
    await dismissReport(id);
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'DISMISSED' } : r)));
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Admin Dashboard</Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label={`Users (${users.length})`} />
        <Tab label={`Events (${events.length})`} />
        <Tab label={`Reports (${reports.length})`} />
      </Tabs>

      {tab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {users.map((u) => (
            <Card key={u.id}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle2">{u.displayName} (@{u.username})</Typography>
                    <Typography variant="caption" color="text.secondary">{u.email} — Role: {u.role}</Typography>
                    {u.isSuspended ? <Chip label="Suspended" size="small" color="error" sx={{ ml: 1 }} /> : null}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {u.isSuspended
                      ? <Button size="small" onClick={() => handleUnsuspend(u.id)}>Unsuspend</Button>
                      : <Button size="small" onClick={() => handleSuspend(u.id)}>Suspend</Button>
                    }
                    <Button size="small" color="error" onClick={() => handleDeleteUser(u.id)}>Delete</Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {tab === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {events.map((e) => (
            <Card key={e.id}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle2">{e.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {e.category} — {e.status} — {e.participantCount} participants — by {e.organizer.displayName}
                    </Typography>
                  </Box>
                  <Button size="small" color="error" onClick={() => handleDeleteEvent(e.id)}>Delete</Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {tab === 2 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {reports.map((r) => (
            <Card key={r.id}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="subtitle2">
                      Report against {r.targetType === 'USER' ? r.reportedUser?.displayName ?? 'User' : r.event?.title ?? 'Event'}
                    </Typography>
                    <Typography variant="body2">{r.reason}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Reported by {r.reporter.displayName} — {new Date(r.createdAt).toLocaleString()}
                    </Typography>
                    <Chip
                      label={r.status}
                      size="small"
                      color={r.status === 'PENDING' ? 'warning' : r.status === 'REVIEWED' ? 'success' : 'default'}
                      sx={{ ml: 1 }}
                    />
                  </Box>
                  {r.status === 'PENDING' ? (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button size="small" onClick={() => handleReview(r.id)}>Mark Reviewed</Button>
                      <Button size="small" onClick={() => handleDismiss(r.id)}>Dismiss</Button>
                    </Box>
                  ) : null}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}
