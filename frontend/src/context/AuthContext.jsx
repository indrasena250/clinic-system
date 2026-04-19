import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

  let storedUser = null;

  try {
    const userData = localStorage.getItem("user");
    if (userData) {
      storedUser = JSON.parse(userData);
    }
  } catch (error) {
    console.error("Invalid user data in localStorage");
    localStorage.removeItem("user");
  }

  const [user, setUser] = useState(storedUser);

  const login = (data) => {
    const savedUser = {
      ...data.user,
      expires_at: data.expires_at || data.user?.expires_at || null,
    };

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(savedUser));

    setUser(savedUser);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);