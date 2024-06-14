import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://api.example.com', // Replace with your API base URL
  withCredentials: true,
});

export default axiosInstance;