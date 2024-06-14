import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://hmi.dynu.net/scraparchive', // Replace with your API base URL
  withCredentials: true,
});

export default axiosInstance;