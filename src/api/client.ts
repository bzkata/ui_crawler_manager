import axios from 'axios';
import { message } from 'antd';

const client = axios.create({
  baseURL: '/api',
  timeout: 20000,
});

client.interceptors.request.use((config) => {
  // Add auth token if needed, or other headers
  return config;
});

client.interceptors.response.use(
  (response) => {
    // Assuming backend returns { code: 0, data: ..., msg: ... } standard response
    const res = response.data;
    // You might want to check res.code === 0 here, or just return res
    return res;
  },
  (error) => {
    if (error.response) {
      const { status } = error.response;
      if (status === 401) {
        message.error('Unauthorized, please login');
        // window.location.href = '/login'; // simplified redirect
      } else {
        message.error(error.response.data?.msg || 'Server Error');
      }
    } else {
      message.error(error.message || 'Network Error');
    }
    return Promise.reject(error);
  }
);

export default client;
