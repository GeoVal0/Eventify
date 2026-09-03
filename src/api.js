const API_BASE_URL = "http://localhost:8000";

export const fetchWithAuth = async (endpoint, options = {}) => {
  const token = localStorage.getItem("access_token");
  
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user_data");
      window.location.href = '/login'; 
    }
    const errorData = await response.json().catch(() => ({}));
    

    // FastAPI validation errors (422) return `detail` as an array of
    // {loc, msg, type} objects, not a string. Left as-is, `new Error(array)`
    // stringifies to an unreadable "[object Object],[object Object]" --
    // format it into something an alert() can actually show.
    let message;
    if (Array.isArray(errorData.detail)) {
      message = errorData.detail
        .map(d => `${(d.loc || []).join('.')}: ${d.msg}`)
        .join('; ');
    } else if (typeof errorData.detail === 'string') {
      message = errorData.detail;
    } else {
      message = `Request failed with status ${response.status}`;
    }
    throw new Error(message);
    // throw new Error(errorData.detail || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
};

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

export const loginUser = async (username, password) => {
  const formData = new URLSearchParams();
  formData.append("username", username);
  formData.append("password", password);

  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData,
  });

  if (!response.ok) throw new Error("Login failed");
  return response.json(); 
};

export const getUsers = () => {
  return fetchWithAuth('/api/admin/users');
};

//ADMIN
export const approveUser = (userId) => {
  return fetchWithAuth(`/api/admin/users/${userId}/approve`, { method: 'PUT' });
};

export const rejectUser = (userId) => {
  return fetchWithAuth(`/api/admin/users/${userId}/reject`, { method: 'PUT' });
};

export const getUserDetail = (userId) => {
  return fetchWithAuth(`/api/admin/users/${userId}`); 
};

export const registerUser = async (userData) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData), 
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Registration failed');
  }
  return response.json();
};

//ORGANIZER
export const createEvent = (eventData) => {
  return fetchWithAuth('/api/events', {
    method: 'POST',
    body: JSON.stringify(eventData)
  });
};

export const getMyEvents = () => {
  return fetchWithAuth('/api/events/mine'); 
};

export const getEventDetail = (eventId) => {
  return fetchWithAuth(`/api/events/${eventId}`);
};

export const getEventBookings = (eventId) => {
  return fetchWithAuth(`/api/events/${eventId}/bookings`); 
};

export const cancelEvent = (eventId) => {
  return fetchWithAuth(`/api/events/${eventId}/cancel`, { method: 'POST' }); 
};

// Sends a system message from the organizer to every distinct attendee who
// booked this (now-cancelled) event. Confirmed against main.py -- this is a
// real dedicated backend endpoint, not something built by looping sendMessage.
export const notifyCancellation = (eventId) => {
  return fetchWithAuth(`/api/events/${eventId}/notify-cancellation`, { method: 'POST' });
};

export const deleteEvent = (eventId) => {
  return fetchWithAuth(`/api/events/${eventId}`, { method: 'DELETE' }); 
};

export const updateEvent = (eventId, eventData) => {
  return fetchWithAuth(`/api/events/${eventId}`, {
    method: 'PUT',
    body: JSON.stringify(eventData)
  });
};

export const publishEvent = (eventId) => {
  return fetchWithAuth(`/api/events/${eventId}/publish`, { 
    method: 'POST' 
  });
};


//SEARCH
export const getEvents = () => {
  return fetchWithAuth('/api/events'); 
};

export const createBooking = (eventId, payload) => {
  return fetchWithAuth(`/api/events/${eventId}/bookings`, { 
    method: 'POST',
    body: JSON.stringify(payload)
  });
};


//MESSAGES
export const getMessages = async () => {
  return await fetchWithAuth('/api/messages/inbox', { method: 'GET' }); 
};

// ASSUMPTION: mirrors the /api/messages/inbox naming pattern. There was no
// "sent messages" endpoint anywhere in this file, so the Sent folder had no
// way to ever populate. Confirm this route exists on the backend (or swap
// in the real one) before relying on it.
export const getSentMessages = async () => {
  return await fetchWithAuth('/api/messages/sent', { method: 'GET' });
};

export const sendMessage = async (payload) => {
  return await fetchWithAuth('/api/messages', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const markMessageAsRead = async (messageId) => {
  return await fetchWithAuth(`/api/messages/${messageId}/read`, { method: 'PUT' });
};

export const deleteMessage = async (messageId) => {
  return await fetchWithAuth(`/api/messages/${messageId}`, { method: 'DELETE' });
};