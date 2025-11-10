import axios from 'axios';
import store from '../store';

// Base URL configuration
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Helper function to get token from Redux store
const getAuthToken = () => {
  const state = store.getState();
  return state.auth?.token || null;
};

// Helper function to build complete config with base URL, headers, and timeout
const buildConfig = (options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return {
    timeout: 10000,
    ...options,
    headers,
  };
};

// GET request helper
export const get = async (url) => {
  try {
    const fullUrl = `${BASE_URL}${url}`;
    const response = await axios.get(fullUrl, buildConfig());
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// POST request helper
export const post = async (url, data = null, sendEntireResponse = false, options = {}) => {
  try {
    const fullUrl = `${BASE_URL}${url}`;
    const response = await axios.post(fullUrl, data, buildConfig(options));
    return sendEntireResponse ? response : response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// PUT request helper
export const put = async (url, data = null) => {
  try {
    const fullUrl = `${BASE_URL}${url}`;
    const response = await axios.put(fullUrl, data, buildConfig());
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// DELETE request helper
export const del = async (url) => {
  try {
    const fullUrl = `${BASE_URL}${url}`;
    const response = await axios.delete(fullUrl, buildConfig());
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Error handling helper
const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    
    // Handle specific error cases
    switch (status) {
      case 401:
        // Unauthorized - token might be expired
        // You might want to dispatch a logout action here
        return new Error(data?.message || 'Unauthorized access. Please login again.');
      case 403:
        return new Error(data?.message || 'Access forbidden.');
      case 404:
        return new Error(data?.message || 'Resource not found.');
      case 422:
        return new Error(data?.message || 'Validation error.');
      case 500:
        return new Error(data?.message || 'Internal server error.');
      default:
        return new Error(data?.message || `Request failed with status ${status}`);
    }
  } else if (error.request) {
    // Network error
    return new Error('Network error. Please check your connection.');
  } else {
    // Other error
    return new Error(error.message || 'An unexpected error occurred.');
  }
};

// Default export with all helper functions
export default {
  get,
  post,
  put,
  del,
};
