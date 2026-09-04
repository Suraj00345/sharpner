import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import useUserStore from "./store/useUserStore";
import { checkUserAuth } from "./services/user.service";
import Loader from "./utils/Loader.jsx";


export const ProtectedRoute = () => {
  const location = useLocation();
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const setUser = useUserStore((state) => state.setUser);
  const clearUser = useUserStore((state) => state.clearUser);
  const [isChecking, setIsChecking] = useState(true);
  useEffect(() => {
    let isMounted = true;
    const verifyAuth = async () => {
      try {
        const result = await checkUserAuth();
        if (!isMounted) return;
        if (result?.isAuthenticated && result?.user) {
          setUser(result.user);
        } else {
          clearUser();
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        if (isMounted) {
          clearUser();
        }
      } finally {
        if (isMounted) {
          setIsChecking(false);
        }
      }
    };
    verifyAuth();
    return () => {
      isMounted = false;
    };
  }, [setUser, clearUser]);
  if (isChecking) {
    return <Loader />;
  }
  if (!isAuthenticated) {
    return <Navigate to="/user-login" state={{ from: location }} replace />;
  }
  return <Outlet />;
};
export const PublicRoute = () => {
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};
