/* eslint-disable react/prop-types */
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import Login from './pages/auth/Login';
import AuthLayout from './layouts/AuthLayout';
import Signup from './pages/auth/Signup';
import RecoverPassword from './pages/auth/RecoverPassword';
import ResetPassword from './pages/auth/ResetPassword';
import RequireAuth from './components/auth/RequireAuth';
import CreateForm from './pages/CreateForm';
import BaseLayout from './layouts/BaseLayout';
import PersistLogin from './components/auth/PersistLogin';
import Error from './pages/Error';
import Settings from './pages/Settings';
import MyForms from './pages/MyForms';
import UpdateForm from './pages/UpdateForm';
import GeneratedForm from './pages/GeneratedForm';
import NotAuthorized from './pages/NotAuthorized'; // Ensure you have this component
import { useCookies } from 'react-cookie';
import { getDecryptedData } from './utils';
import Home from './pages/Home';

const isUserApproved = () => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [cookies] = useCookies(['userDetails']);
  const userDetailsString = cookies.userDetails;

  if (!userDetailsString) {
    console.error('User details cookie not found');
    return false;
  }

  try {
    // Decrypt the user details string
    const decryptedData = getDecryptedData(userDetailsString);
    // Check if decryptedData is an object
    if (typeof decryptedData === 'object') {
      if (decryptedData?.id) {
        localStorage.setItem('userId', decryptedData.id);
      }
      return decryptedData?.isApproved || false;
    } else {
      return false;
    }
  } catch (error) {
    console.error('Error parsing or decrypting user details:', error);
    return false;
  }
};

interface ConditionalContentProps {
  children: React.ReactNode;
}

// Use the defined props type in your component
const ConditionalContent: React.FC<ConditionalContentProps> = ({
  children,
}) => {
  return isUserApproved() ? children : <NotAuthorized />;
};

const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    errorElement: <Error />,
    children: [
      {
        path: '/login',
        element: <Login />,
      },
      {
        path: '/signup',
        element: <Signup />,
      },
      {
        path: '/recover-password',
        element: <RecoverPassword />,
      },
      {
        path: '/reset-password/:token',
        element: <ResetPassword />,
      },
      {
        path: '/demo',
        element: <CreateForm />,
      },
    ],
  },
  {
    element: <PersistLogin />,
    errorElement: <Error />,
    children: [
      {
        element: <RequireAuth />,
        children: [
          {
            element: <BaseLayout />,
            children: [
              {
                path: '/',
                element: <Home />,
              },
              {
                path: '/createForm',
                element: (
                  <ConditionalContent>
                    <CreateForm />
                  </ConditionalContent>
                ),
              },
              {
                path: '/my-forms',
                element: (
                  <ConditionalContent>
                    <MyForms />
                  </ConditionalContent>
                ),
              },
              {
                path: '/my-forms/:id/edit',
                element: (
                  <ConditionalContent>
                    <UpdateForm />
                  </ConditionalContent>
                ),
              },
              {
                path: '/settings',
                element: <Settings />,
              },
              {
                path: '/home',
                element: <Home />,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: 'forms/:id',
    element: <GeneratedForm />,
    errorElement: <Error />,
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
