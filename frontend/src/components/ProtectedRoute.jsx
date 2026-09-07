import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import api from "../services/api";

function ProtectedRoute({ children }) {
  const location = useLocation();
  const [status, setStatus] = useState(
    localStorage.getItem("token") ? "checking" : "unauthenticated"
  );

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      setStatus("unauthenticated");
      return undefined;
    }

    let cancelled = false;
    api.get("/me")
      .then(() => {
        if (!cancelled) setStatus("authenticated");
      })
      .catch(() => {
        localStorage.removeItem("token");
        if (!cancelled) setStatus("unauthenticated");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "checking") {
    return <div style={{ padding: "30px" }}>로그인 상태를 확인하는 중...</div>;
  }

  if (status !== "authenticated") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

export default ProtectedRoute;
