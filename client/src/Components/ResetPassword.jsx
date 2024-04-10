import Axios from "axios";
import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../App.css";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const { token } = useParams(); // take the token parameter from URL

  console.log(token);

  const navigate = useNavigate();

  Axios.defaults.withCredentials = true;

  const handleSubmit = (e) => {
    e.preventDefault();
    Axios.post(`http://localhost:3000/auth/reset-password/${token}`, {
      password,
    })
      .then((res) => {
        if (res.data.status) {
          navigate("/login");
        }
        console.log(res.data);
      })
      .catch((err) => console.log(err));
  };

  return (
    <div className="sign-up-container">
      <form className="sign-up-form" onSubmit={handleSubmit}>
        <h2>Reset Password</h2>

        <label htmlFor="password">Password:</label>
        <input
          type="password"
          placeholder="********"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit">Reset</button>
      </form>
    </div>
  );
};

export default ResetPassword;
