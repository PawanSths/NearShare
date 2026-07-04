import AppBar from '@mui/material/AppBar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { Link as RouterLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { getNotifications } from '@/services/api';

export function MainLayout() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!token) return;
    let mounted = true;
    async function load() {
      try {
        const data = await getNotifications();
        if (mounted) {
          setUnreadCount(data.notifications.filter((n) => !n.isRead).length);
        }
      } catch {
        // ignore
      }
    }
    void load();
    return () => { mounted = false; };
  }, [token]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" color="default" elevation={0}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ gap: 1 }}>
            <Typography
              variant="h6"
              component={RouterLink}
              to="/"
              sx={{
                flexGrow: 1,
                textDecoration: 'none',
                color: 'primary.main',
                fontWeight: 700,
              }}
            >
              NearBeat
            </Typography>
            {token ? (
              <>
                <Button component={RouterLink} to="/" color="inherit" size="small">
                  Map
                </Button>
                <IconButton component={RouterLink} to="/notifications" color="inherit" size="small">
                  <Badge badgeContent={unreadCount} color="error">
                    <Typography variant="body2">🔔</Typography>
                  </Badge>
                </IconButton>
                {user?.role === 'ADMIN' ? (
                  <Button component={RouterLink} to="/admin" color="inherit" size="small">
                    Admin
                  </Button>
                ) : null}
                <Button component={RouterLink} to="/profile" color="inherit" size="small">
                  {user?.displayName ?? 'Profile'}
                </Button>
                <Button color="inherit" size="small" onClick={clearAuth}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button component={RouterLink} to="/login" color="inherit">
                  Login
                </Button>
                <Button component={RouterLink} to="/register" variant="contained">
                  Sign Up
                </Button>
              </>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      <Box component="main" sx={{ flexGrow: 1 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
