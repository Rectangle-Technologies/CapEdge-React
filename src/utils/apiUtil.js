import axios from 'axios';
import store from '../store';
import { logout } from '../store/slices/authSlice';

// Base URL configuration
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Helper function to get token from Redux store
const getAuthToken = () => {
  const state = store.getState();
  return state.auth?.token || null;
};

// Reads fail fast. Writes (create/edit/delete) run server-side recalculations of holdings,
// ledger and financial-year snapshots that can legitimately take longer, and the server keeps
// going after the client gives up, so a short timeout reports a failure for a saved change.
const READ_TIMEOUT_MS = 10000;
const WRITE_TIMEOUT_MS = 120000;

// Helper function to build complete config with base URL, headers, and timeout
const buildConfig = (options = {}, defaultTimeout = READ_TIMEOUT_MS) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return {
    timeout: defaultTimeout,
    ...options,
    headers
  };
};

// GET request helper
export const get = async (url, sendEntireResponse = false, options = {}) => {
  try {
    const fullUrl = `${BASE_URL}${url}`;
    const response = await axios.get(fullUrl, buildConfig(options));
    return sendEntireResponse ? response : response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// POST request helper
export const post = async (url, data = null, sendEntireResponse = false, options = {}) => {
  try {
    const fullUrl = `${BASE_URL}${url}`;
    const response = await axios.post(fullUrl, data, buildConfig(options, WRITE_TIMEOUT_MS));
    return sendEntireResponse ? response : response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// PUT request helper
export const put = async (url, data = null) => {
  try {
    const fullUrl = `${BASE_URL}${url}`;
    const response = await axios.put(fullUrl, data, buildConfig({}, WRITE_TIMEOUT_MS));
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// DELETE request helper
export const del = async (url) => {
  try {
    const fullUrl = `${BASE_URL}${url}`;
    const response = await axios.delete(fullUrl, buildConfig({}, WRITE_TIMEOUT_MS));
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Error handling helper
const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    let { status, data } = error.response;

    // When responseType is 'arraybuffer', error response data is also an ArrayBuffer.
    // Decode it back to a plain object so error messages can be read.
    if (data instanceof ArrayBuffer) {
      try {
        data = JSON.parse(new TextDecoder().decode(data));
      } catch {
        data = {};
      }
    }

    // Handle specific error cases
    switch (status) {
      case 401:
        // Unauthorized - token expired or invalid, auto-logout
        store.dispatch(logout());
        window.location.href = '/login';
        return new Error(data?.message || 'Session expired. Please login again.');
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
    // Timeout: the request was sent but no response arrived in time. For a write the server
    // may still have completed it, so do not tell the user it failed.
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      const isWrite = error.config?.method && error.config.method.toLowerCase() !== 'get';
      return new Error(
        isWrite
          ? 'The server is taking longer than expected to respond. Your changes may still have been saved. Please check before submitting again.'
          : 'The request timed out. Please try again.'
      );
    }
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
  del
};
