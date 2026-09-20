import {createContext, useContext, useState, useEffect} from 'react';
import {loginUser} from '../api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

// provider wraps the app
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);   // if the user is logged in, holds its details 

  // check if there is an existing session when the app first loads
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user_data');
    if (token && storedUser) {          // if there is jwt token and user's details, user gets logged in automatically
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (username, password) => {
    try {
      // executes the actual backend  POST request to /api/auth/login
      const data = await loginUser(username, password); 
      
      // save the JWT token returned by fastAPI
      localStorage.setItem('access_token', data.access_token);
      
      // store user details that come from the backend in localstorage so they dont get deleted when refresh
      const userData = { username, role: data.role, userId: data.user_id };
      localStorage.setItem('user_data', JSON.stringify(userData));
      
      // user is logged in whole app
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    // clear session token and user data on logout
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{user, login, logout}}>
      {children}
    </AuthContext.Provider>
  );
}