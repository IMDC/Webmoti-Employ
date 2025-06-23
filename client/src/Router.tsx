import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Home } from './features/home/Home';
import { NotFoundPage } from './components/NotFoundPage';
import { VideoApp } from './features/video/VideoApp';

const router = createBrowserRouter([
  { path: '/admin', element: <Home /> },

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
