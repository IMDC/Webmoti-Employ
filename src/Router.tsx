import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Admin } from './pages/Admin';
import { NotFoundPage } from './pages/NotFoundPage';
import { VideoApp } from './pages/VideoApp';

const router = createBrowserRouter([
  { path: '/admin', element: <Admin /> },

  {
    path: '/',
    element: <VideoApp />,
  },
  {
    path: '/:meetingId',
    element: <VideoApp />,
  },

  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
