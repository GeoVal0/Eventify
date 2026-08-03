// src/api.js

const API_BASE_URL = "http://localhost:8000";

// A simple function to test the connection to the backend
export const checkServerHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/`);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error connecting to backend:", error);
    return null;
  }
};