// import { Routes, Route } from "react-router-dom";
// import SignUpOrganizer from './pages/sign-up/SignUpOrganizer.jsx';
// import SignUpUser from './pages/sign-up/SignUpUser.jsx';
// import Login from './pages/Login.jsx';
// import UserList from './pages/admin/UserList.jsx';


// function App() {
//   return (
//     <div className="app">
      // <Routes>

      //   <Route path="/sign-up/SignUpOrganizer" element={<SignUpOrganizer />} />
      //   <Route path="/sign-up/SignUpUser" element={<SignUpUser />} />

      //   <Route path="/login" element={<Login />} />

      //   <Route path="/admin/UserList" element={<UserList />} />

      // </Routes>
//     </div>
//   );
// }

// export default App;



// src/App.jsx


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
    // <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
    //   <h1>TED 2026: Frontend meets Backend</h1>
      
    //   <div style={{ 
    //     padding: "1rem", 
    //     backgroundColor: serverMessage.includes("Welcome") ? "#d4edda" : "#f8d7da",
    //     borderRadius: "8px",
    //     marginTop: "1rem"
    //   }}>
    //     <p><strong>Backend Status:</strong> {serverMessage}</p>
    //   </div>



      <Routes>

        <Route path="/sign-up/SignUpOrganizer" element={<SignUpOrganizer />} />
        <Route path="/sign-up/SignUpUser" element={<SignUpUser />} />

        <Route path="/login" element={<Login />} />

        <Route path="/admin/UserList" element={<UserList />} />
        <Route path="/admin/UserDetails" element={<UserDetails />} />

        <Route path="search/SearchEvents" element={<SearchEvents />} />
        <Route path="search/BookTickets" element={<BookTickets />} /> 
      </Routes>
    // </div>

    


  );
}

export default App;