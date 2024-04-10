import Axios from "axios";
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  Axios.defaults.withCredentials = true;

  useEffect(() => {
    Axios.get("http://localhost:3000/auth/verify")
      .then((res) => {
        if (res.data.status === true) {
          navigate("/dashboard");
        } else {
          navigate("/home");
          console.log(res.data);
        }
      })
      .catch((error) => {
        console.error("Error fetching verification status:", error);
        // In case of error, navigate to home as a fallback
        navigate("/home");
      });
  }, [navigate]);

  return <div>Dashboard</div>;
};

export default Dashboard;
