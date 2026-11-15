import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AppShell } from '@/components/AppShell';
import { AuthPage } from '@/pages/Auth';
import { Placeholder } from '@/pages/Placeholder';
import { ProfilePage } from '@/pages/Profile';
import './index.css';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } });

const router = createBrowserRouter([
  { path: '/login', element: <AuthPage mode="login" /> },
  { path: '/signup', element: <AuthPage mode="signup" /> },
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <Placeholder title="Live now" note="Live matches and streams arrive in M2." /> },
      { path: '/matches', element: <Placeholder title="Matches" /> },
      { path: '/matches/:id', element: <Placeholder title="Match" /> },
      { path: '/c/:channelId', element: <Placeholder title="Channel" /> },
      { path: '/watch/:streamId', element: <Placeholder title="Watch" /> },
      { path: '/dashboard', element: <Placeholder title="Creator dashboard" note="Go-live setup arrives in P4." /> },
      { path: '/following', element: <Placeholder title="Following" /> },
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
