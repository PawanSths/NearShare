import { Routes, Route } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { HomePage } from '@/features/events/pages/HomePage';
import { EventListPage } from '@/features/events/pages/EventListPage';
import { EventDetailPage } from '@/features/events/pages/EventDetailPage';
import { CreateEventPage } from '@/features/events/pages/CreateEventPage';
import { ChatPage } from '@/features/chat/pages/ChatPage';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { ProfilePage } from '@/features/profile/pages/ProfilePage';
import { NotificationsPage } from '@/features/notifications/pages/NotificationsPage';
import { AdminDashboardPage } from '@/features/admin/pages/AdminDashboardPage';
import { NotFoundPage } from '@/components/NotFoundPage';

export function AppRouter() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/events" element={<EventListPage />} />
        <Route path="/events/new" element={<CreateEventPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="/chat/:id" element={<ChatPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
