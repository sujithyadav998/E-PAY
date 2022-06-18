import axios from "axios";
import storage from "redux-persist/lib/storage";

const API_URL = "http://localhost:5000/api/users/";

//Login User
const login = async (userData) => {
  const res = await axios.post(API_URL + "login", userData, {
    headers: {
      "content-type": "application/json",
    },
  });
  const data = res.data;

  return data;
};

//Register User
const register = async (userData) => {
  const res = await axios.post(API_URL, userData, {
    headers: {
      "content-type": "application/json",
    },
  });

  const data = res.data;

  return data;
};

//Logout
const logout = () => {
  storage.removeItem("persist:root");
};

const authService = {
  register,
  logout,
  login,
};

export default authService;
