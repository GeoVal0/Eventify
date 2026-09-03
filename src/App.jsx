import { Routes, Route } from "react-router-dom";
import { useState, useEffect } from 'react';
import { checkServerHealth } from './api';
import SignUpOrganizer from './pages/sign-up/SignUpOrganizer.jsx';
import SignUpUser from './pages/sign-up/SignUpUser.jsx';
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

      <Routes>
        <Route path="/Home" element={<Home />} />
        <Route path="/messages" element={<Messages />} />

        <Route path="/sign-up/SignUpOrganizer" element={<SignUpOrganizer />} />
        <Route path="/sign-up/SignUpUser" element={<SignUpUser />} />

        <Route path="/login" element={<Login />} />

        <Route path="/admin/UserList" element={<UserList />} />
        <Route path="/admin/UserDetails" element={<UserDetails />} />

        <Route path="search/SearchEvents" element={<SearchEvents />} />
        <Route path="search/BookTickets" element={<BookTickets />} /> 

        <Route path="organizer/NewEvent" element={<NewEvent />} /> 
        <Route path="organizer/EventHistory" element={<EventHistory />} /> 
        <Route path="organizer/EditEvent" element={<EditEvent />} /> 
        <Route path="organizer/ViewEvent" element={<ViewEvent />} />

      </Routes>
      </>

  );
}

export default App;