import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';

import './index.css';
import { Home } from './pages/home';
import { NotFound } from './pages/not-found';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- must have faith here
ReactDOM.createRoot(document.querySelector('#root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
