import { jwtDecode } from "jwt-decode"; 

/**
 * Extracts the user role from the JWT token stored in localStorage.
 * @returns {string|null} The user role (e.g., "SuperUser", "User") or null if the token is invalid.
 */
export const getUserRoleFromToken = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    const roleClaim = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
    return decoded[roleClaim] || "User"; // Default to "User" if no role is found
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

/**
 * Checks if the JWT token stored in localStorage is valid and not expired.
 * @returns {boolean} True if the token is valid, false otherwise.
 */
export const checkTokenValidity = () => {
  const token = localStorage.getItem("token");
  if (!token) return false;

  try {
    const decoded = jwtDecode(token);
    const exp = decoded.exp * 1000; // Convert expiration time to milliseconds
    return Date.now() < exp; // Check if the token is still valid
  } catch (error) {
    console.error("Invalid token:", error);
    return false;
  }
};

/**
 * Logs the user out by removing the token from localStorage and redirecting to the login page.
 */
export const logoutUser = () => {
  localStorage.removeItem("token");
  window.location.href = "/login"; // Redirect to login page
};

/**
 * Returns the headers object with the Authorization token for API requests.
 * @returns {object} Headers object with Authorization token or an empty object if the token is invalid.
 */
export const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  if (!token || !checkTokenValidity()) {
    logoutUser(); // Log the user out if the token is invalid
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};