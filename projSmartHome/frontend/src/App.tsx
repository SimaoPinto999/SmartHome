/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import Login from './pages/Login';
import ProfileSelection from './pages/ProfileSelection';
import Dashboard from './pages/Dashboard';
import Schedules from './pages/Schedules';
import Energy from './pages/Energy';
import Security from './pages/Security';
import Devices from './pages/Devices';
import Rooms from './pages/Rooms';
import EditProfile from './pages/EditProfile';
import OidcCallback from './pages/OidcCallback';
import ProtectedRoute from './components/layout/ProtectedRoute';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const pageTransition = { duration: 0.12, ease: 'easeInOut' } as const;

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
        style={{ minHeight: '100vh' }}
      >
        <Routes location={location}>
          <Route path="/" element={<Login />} />
          <Route path="/callback" element={<OidcCallback />} />
          <Route path="/profile-selection" element={<ProtectedRoute><ProfileSelection /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/devices" element={<ProtectedRoute><Devices /></ProtectedRoute>} />
          <Route path="/rooms" element={<ProtectedRoute><Rooms /></ProtectedRoute>} />
          <Route path="/schedules" element={<ProtectedRoute><Schedules /></ProtectedRoute>} />
          <Route path="/energy" element={<ProtectedRoute><Energy /></ProtectedRoute>} />
          <Route path="/security" element={<ProtectedRoute><Security /></ProtectedRoute>} />
          <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
}
