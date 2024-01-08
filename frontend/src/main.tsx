import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster, toast } from 'sonner';

import './index.css';
import { Home } from './pages/home';
import { NotFound } from './pages/not-found';
import { Login } from './pages/login';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);

declare global {
  interface Window {
    __router?: typeof router;
  }
}

// eslint-disable-next-line no-underscore-dangle
window.__router = router;

const queryClient = new QueryClient();

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- must have faith here
ReactDOM.createRoot(document.querySelector('#root')!).render(
  <React.StrictMode>
    <Toaster />
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>,
);
