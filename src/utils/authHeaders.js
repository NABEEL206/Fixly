// src/utils/authHeaders.js
export const getAuthHeaders = (contentType = "application/json") => {
  const token = localStorage.getItem("access_token");
  const tokenType = localStorage.getItem("token_type") || "Bearer"; // Default to Bearer if not set
  
  const headers = {};
  
  if (contentType) {
    headers["Content-Type"] = contentType;
  }
  
  if (token) {
    headers["Authorization"] = `${tokenType} ${token}`;
  }
  
  return headers;
};

// For multipart/form-data (file uploads)
export const getAuthHeadersMultipart = () => {
  const headers = getAuthHeaders();
  // Remove Content-Type so browser can set it with boundary
  delete headers["Content-Type"];
  return headers;
};