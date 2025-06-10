import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { PrejoinScreen } from './components/PrejoinScreen';
import { Room } from './components/Room';

const router = createBrowserRouter([
  {
    path: '/',
    element: <PrejoinScreen />,
  },

  { path: '/room', element: <Room /> },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
