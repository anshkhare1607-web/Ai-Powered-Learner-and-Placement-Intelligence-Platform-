import React, { createContext, useContext, useState, useEffect } from "react";
import { io } from "socket.io-client";
import { useLocation } from "react-router-dom";

const NotificationContext = createContext();

// Create socket outside component to prevent multiple instances
// const socket = io("http://localhost:3001", { autoConnect: false });
const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:3001", { autoConnect: false });

export const NotificationProvider = ({ children }) => {
  const [liveNotifications, setLiveNotifications] = useState([]);
  const location = useLocation(); // Force re-render on route change

  const role = localStorage.getItem("role") || "";
  const userId = role === "MENTOR" ? localStorage.getItem("mentorId") : localStorage.getItem("id");

  useEffect(() => {
    // Admin stays static, no socket connection needed
    if (role === "ADMIN" || !role) return;

    // Retrieve previous notifications from localStorage if they exist
    const savedNotifications = localStorage.getItem(`notifications_${role}_${userId}`);
    if (savedNotifications) {
      setLiveNotifications(JSON.parse(savedNotifications));
    } else {
      // Load initial state if empty
      const initialMentorNotifications = [
        {
          title: "Assessment metrics loaded",
          description: "Logged test scores have successfully refreshed in the placement analytics registry.",
          time: "1 hour ago",
          badge: "badge-green",
          status: "Updated"
        },
        {
          title: "Soft skills criteria modified",
          description: "Pydantic schema constraints relaxed on soft skills inputs to safely support null values.",
          time: "1 day ago",
          badge: "badge-yellow",
          status: "Updated"
        }
      ];

      const initialLearnerNotifications = [
        {
          title: "Scores Updated",
          description: "Your mentor has updated your attendance and assessment scores.",
          time: "2 hours ago",
          badge: "badge-green",
          status: "Synced"
        },
        {
          title: "Feedback Shared",
          description: "A new soft skills and behavioral assessment feedback is available.",
          time: "1 day ago",
          badge: "badge-yellow",
          status: "New"
        }
      ];

      const initial = role === "MENTOR" ? initialMentorNotifications : initialLearnerNotifications;
      setLiveNotifications(initial);
      localStorage.setItem(`notifications_${role}_${userId}`, JSON.stringify(initial));
    }

    // Connect socket for Mentors and Learners
    socket.connect();

    socket.on("connect", () => {
      console.log("Connected to notification service globally");
      socket.emit("register", { role, id: userId });
    });

    socket.on("notification", (newNotif) => {
      setLiveNotifications((prev) => {
        const updated = [newNotif, ...prev];
        localStorage.setItem(`notifications_${role}_${userId}`, JSON.stringify(updated));
        return updated;
      });
    });

    return () => {
      socket.off("connect");
      socket.off("notification");
      socket.disconnect();
    };
  }, [role, userId]);

  return (
    <NotificationContext.Provider value={{ liveNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
