import { useEffect, useState } from "react";
import Login from "./pages/Login";
import UserWorkspace from "./pages/user/UserWorkspace";
import AdminWorkspace from "./pages/admin/AdminWorkspace";

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser =
      localStorage.getItem("rag-demo-user");

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem(
          "rag-demo-user"
        );
      }
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);

    localStorage.setItem(
      "rag-demo-user",
      JSON.stringify(userData)
    );
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem(
      "rag-demo-user"
    );
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (user.role === "Admin") {
    return (
      <AdminWorkspace
        user={user}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <UserWorkspace
      user={user}
      onLogout={handleLogout}
    />
  );
}
