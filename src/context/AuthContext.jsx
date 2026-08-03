import { createContext, useContext, useState } from 'react';

// 1. Create the context
const AuthContext = createContext();

// 2. Export a custom hook so other files can use it easily
export function useAuth() {
  return useContext(AuthContext);
}

// 3. Create the Provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); 
  // 'user' will eventually hold an object like: { username: "Maria", role: "organizer" }

  const login = (username, password, role) => {
    // In the future, this will connect to your real backend
    console.log("Logging in with:", username, role);
    setUser({ username, role }); 
  };

  const logout = () => {
    setUser(null);
  };

  const value = {
    user,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}