import axios from 'axios';

export default axiosInstance = axios.create({
  baseURL: 'https://api.example.com', // Replace with your API base URL
  withCredentials: true,
});