import {createBrowserRouter, RouterProvider, Navigate} from 'react-router-dom';
import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
import '@/styles/firebase.css';

import Layout from '@/components/layout/Layout';
import Home from '@/screens/home';
import Canvas from '@/components/canvas/Canvas';
import ScientificCalculator from '@/components/calculator/ScientificCalculator';
import Feedback from '@/components/ui/feedback';

import '@/index.css';

const paths = [
    {
        path: '/',
        element: <Layout><Home /></Layout>,
    },
    {
        path: '/calculator',
        element: <Layout><ScientificCalculator /></Layout>,
    },
    {
        path: '/canvas',
        element: <Canvas />,
    },
    {
        path: '/feedback',
        element: <Layout><Feedback /></Layout>,
    },
    {
        path: '*',
        element: <Navigate to="/" replace />,
    }
];

const BrowserRouter = createBrowserRouter(paths);

const App = () => {
    return (
        <MantineProvider>
            <RouterProvider router={BrowserRouter}/>
        </MantineProvider>
    )
};

export default App;
