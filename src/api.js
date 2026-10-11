export const API_BASE_URL = "https://localhost:8000";

// all calls go through here to get the JWT token and handle errors
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
    if (response.status === 401) {    // 401 unauthorized, expired or invalid token -> logout
      localStorage.removeItem("access_token");
      localStorage.removeItem("user_data");
      window.location.href = '/login'; 
    }
    const errorData = await response.json().catch(() => ({}));
    
    // modify fastAPI validation errors (422) to a readable format instead of an array of {loc, msg, type} objects
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
  }

  if (response.status === 204) return null;   // 204 -> no content

  return response.json();
};

// AUTHENTICATION ENDPOINTS

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
  return response.json();     // returns JWT token
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
  return response.json();   // returns JWT token
};


//ADMIN

export const getUsers = () => {
  return fetchWithAuth('/api/admin/users');
};

// helper function for downloads
const triggerBlobDownload = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

export const exportEventsXml = async () => {
  const token = localStorage.getItem("access_token");
  const response = await fetch(`${API_BASE_URL}/api/admin/events/export?format=xml`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Request failed with status ${response.status}`);
  }
  const blob = await response.blob();
  triggerBlobDownload(blob, 'events_export.xml');
};

export const exportEventsJson = async () => {
  const data = await fetchWithAuth('/api/admin/events/export?format=json');
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  triggerBlobDownload(blob, 'events_export.json');
};

export const approveUser = (userId) => {
  return fetchWithAuth(`/api/admin/users/${userId}/approve`, { method: 'PUT' });
};

export const rejectUser = (userId) => {
  return fetchWithAuth(`/api/admin/users/${userId}/reject`, { method: 'PUT' });
};

export const getUserDetail = (userId) => {
  return fetchWithAuth(`/api/admin/users/${userId}`); 
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

// sends message to all attendees of an event when it gets cancelled
export const notifyCancellation = (eventId) => {
  return fetchWithAuth(`/api/events/${eventId}/notify-cancellation`, { method: 'POST' });
};

export const deleteEventPhoto = (eventId, photoId) => {
  return fetchWithAuth(`/api/events/${eventId}/photos/${photoId}`, { method: 'DELETE' });
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

// attendee-only (organizers/admin get a 403), returns coldstart=true when the algorithm has not enough data for the user
export const getRecommendations = (limit = 10) => {
  return fetchWithAuth(`/api/recommendations?limit=${limit}`);
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