import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AppShell } from '@/components/AppShell';
import { AuthPage } from '@/pages/Auth';
import { ProfilePage } from '@/pages/Profile';
import { DashboardPage } from '@/pages/Dashboard';
import { WatchPage } from '@/pages/Watch';
import { HomePage, MatchesPage } from '@/pages/Home';
import { MatchPage } from '@/pages/Match';
import { ChannelPage } from '@/pages/Channel';
import { FollowingPage } from '@/pages/Following';
import './index.css';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } });

const router = createBrowserRouter([
  { path: '/login', element: <AuthPage mode="login" /> },
  { path: '/signup', element: <AuthPage mode="signup" /> },
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/matches', element: <MatchesPage /> },
      { path: '/matches/:id', element: <MatchPage /> },
      { path: '/c/:channelId', element: <ChannelPage /> },
      { path: '/watch/:streamId', element: <WatchPage /> },
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/following', element: <FollowingPage /> },
      { path: '/profile', element: <ProfilePage /> },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  </StrictMode>,
);
