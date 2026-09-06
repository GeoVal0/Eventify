import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from 'react';
import { checkServerHealth } from './api';
import { useAuth } from './context/AuthContext';
import SignUpOrganizer from './pages/sign-up/SignUpOrganizer.jsx';
import SignUpAttendee from './pages/sign-up/SignUpAttendee.jsx';
import EditOrganizer from './pages/edit/EditOrganizer.jsx';
import EditAttendee from './pages/edit/EditAttendee.jsx';
import Login from './pages/Login.jsx';
import UserList from './pages/admin/UserList.jsx';
import UserDetails from './pages/admin/UserDetails.jsx';
import SearchEvents from './pages/search/SearchEvents.jsx';
import BookTickets from './pages/search/BookTickets.jsx';
import NewEvent from './pages/organizer/NewEvent.jsx';
import EventHistory from './pages/organizer/EventHistory.jsx';
import EditEvent from './pages/organizer/EditEvent.jsx';
import ViewEvent from './pages/organizer/ViewEvent.jsx';
import Messages from './components/Messages.jsx'

import MessagesNavIndicator from './components/MessagesNavIndicator.jsx'
import NavBar from "./components/NavBar.jsx";
import Home from "./pages/Home.jsx";
import RecommendedEvents from "./components/RecommendedEvents.jsx";

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  const [serverMessage, setServerMessage] = useState("Trying to connect...");

  useEffect(() => {
    // Call the function we made in api.js
    const testConnection = async () => {
      const data = await checkServerHealth();
      if (data) {
        setServerMessage(data.message); // "Welcome to the Event Management API"
      } else {
        setServerMessage("Failed to connect. Is Uvicorn running?");
      }
    };

    testConnection();
  }, []);

  return (
    <>
    <NavBar />
    <MessagesNavIndicator />
    <RecommendedEvents />

      <Routes>
        <Route path="/Home" element={<Home />} />
        <Route path="/messages" element={<Messages />} />

        <Route path="/sign-up/SignUpOrganizer" element={<SignUpOrganizer />} />
        <Route path="/sign-up/SignUpAttendee" element={<SignUpAttendee />} />

        <Route path="/edit/EditOrganizer" element={<EditOrganizer />} />
        <Route path="/edit/EditAttendee" element={<EditAttendee />} />
        <Route path="/login" element={<Login />} />

        {/* <Route path="/admin/UserList" element={<UserList />} />
        <Route path="/admin/UserDetails" element={<UserDetails />} /> */}

        <Route path="search/SearchEvents" element={<SearchEvents />} />
        <Route path="search/BookTickets" element={<BookTickets />} /> 

        {/* <Route path="organizer/NewEvent" element={<NewEvent />} /> 
        <Route path="organizer/EventHistory" element={<EventHistory />} /> 
        <Route path="organizer/EditEvent" element={<EditEvent />} /> 
        <Route path="organizer/ViewEvent" element={<ViewEvent />} /> */}

        <Route path="/admin/UserList" element={<ProtectedRoute><UserList /></ProtectedRoute>} />
        <Route path="/admin/UserDetails" element={<ProtectedRoute><UserDetails /></ProtectedRoute>} />

        <Route path="/organizer/NewEvent" element={<ProtectedRoute><NewEvent /></ProtectedRoute>} />
        <Route path="/organizer/EventHistory" element={<ProtectedRoute><EventHistory /></ProtectedRoute>} />
        <Route path="/organizer/EditEvent" element={<ProtectedRoute><EditEvent /></ProtectedRoute>} />
        <Route path="/organizer/ViewEvent" element={<ProtectedRoute><ViewEvent /></ProtectedRoute>} />

      </Routes>
      </>

  );
}

export default App;