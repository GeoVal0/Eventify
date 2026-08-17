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

      <Routes>

        <Route path="/sign-up/SignUpOrganizer" element={<SignUpOrganizer />} />
        <Route path="/sign-up/SignUpUser" element={<SignUpUser />} />

        <Route path="/login" element={<Login />} />

        <Route path="/admin/UserList" element={<UserList />} />
        <Route path="/admin/UserDetails" element={<UserDetails />} />

        <Route path="search/SearchEvents" element={<SearchEvents />} />
        <Route path="search/BookTickets" element={<BookTickets />} /> 

        <Route path="organizer/NewEvent" element={<NewEvent />} /> 
        <Route path="organizer/EventHistory" element={<EventHistory />} /> 

      </Routes>
    // </div>

    


  );
}

export default App;