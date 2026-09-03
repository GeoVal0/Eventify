// import { createContext, useContext, useState } from 'react';

// // 1. Create the context
// const AuthContext = createContext();

// // 2. Export a custom hook so other files can use it easily
// export function useAuth() {
//   return useContext(AuthContext);
// }

// // 3. Create the Provider component
// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null); 
//   // 'user' will eventually hold an object like: { username: "Maria", role: "organizer" }

//   const login = (username, password, role) => {
//     // In the future, this will connect to your real backend
//     console.log("Logging in with:", username, role);
//     setUser({ username, role }); 
//   };

//   const logout = () => {
//     setUser(null);
//   };

//   const value = {
//     user,
//     login,
//     logout
//   };

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   );
// }




import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser } from '../api'; // Adjust the import path as needed

const AuthContext = createContext(); //

export function useAuth() {
  return useContext(AuthContext); //[cite: 16]
}

export function AuthProvider({ children }) { //[cite: 16]
  const [user, setUser] = useState(null); //[cite: 16]

  // Check for an existing session when the app first loads
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user_data');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (username, password) => {
    try {
      // Execute the actual backend request to /api/auth/login
      const data = await loginUser(username, password); 
      
      // Save the JWT token returned by FastAPI[cite: 5]
      localStorage.setItem('access_token', data.access_token);
      
      // Store user details (role and user_id come from the backend)[cite: 5]
      const userData = { username, role: data.role, userId: data.user_id };
      localStorage.setItem('user_data', JSON.stringify(userData));
      
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    // Clear session data on logout
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    setUser(null); //[cite: 16]
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider> //[cite: 16]
  );
}