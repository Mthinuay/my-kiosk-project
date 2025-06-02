import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const useHomePageData = () => {
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('Guest');
  const [userId, setUserId] = useState(null);
  const [accountBalance, setAccountBalance] = useState(null);
  const [walletId, setWalletId] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(null);

  const fetchCartItems = async (userId) => {
    try {
      const response = await axios.get(`https://localhost:7030/api/CartItem/user/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const items = response.data || [];
      setCartItems(items);
      const totalCount = items.reduce((acc, item) => acc + (item.quantity || 0), 0);
      setCartItemCount(totalCount);
    } catch (error) {
      console.error('Failed to fetch cart items:', error);
      setCartItems([]);
      setCartItemCount(0);
    }
  };

  const fetchOrders = async (userId) => {
    setIsOrdersLoading(true);
    setOrdersError(null);
    try {
      const token = localStorage.getItem('token');
      const isSuperUser = userRole === 'SuperUser';
      const endpoint = isSuperUser
        ? `https://localhost:7030/api/CartItem/all-orders`
        : `https://localhost:7030/api/CartItem/orders/${userId}`;
      console.log(`Fetching orders from ${endpoint} for UserID=${userId}, Role=${userRole}`);
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      let ordersData = response.data || [];

      if (isSuperUser) {
        ordersData = await Promise.all(ordersData.map(async (order) => {
          try {
            const userResponse = await axios.get(`https://localhost:7030/api/user/${order.userID}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const userName = userResponse.data.name || `User ${order.userID}`;
            return { ...order, userName };
          } catch (error) {
            console.error(`Failed to fetch userName for UserID=${order.userID}:`, error);
            return { ...order, userName: `User ${order.userID}` };
          }
        }));
      }

      console.log(`Orders fetched: ${JSON.stringify(ordersData, null, 2)}`);
      setOrders(ordersData);
      ordersData.forEach(order => {
        console.log(`Order #${order.orderID} (User ${order.userName || order.userID}): ${order.cartItems?.length || 0} cart items`, order.cartItems || []);
      });
    } catch (error) {
      const status = error.response?.status;
      const errorMessage =
        status === 401 ? 'Unauthorized. Please log in again.' :
        status === 403 ? 'Access denied. Superuser privileges required.' :
        status === 404 ? 'Orders endpoint not found. Please contact support.' :
        'Failed to fetch orders. Please try again.';
      setOrdersError(errorMessage);
      toast.error(errorMessage);
      console.error('Error fetching orders:', {
        status,
        message: error.message,
        response: error.response?.data,
        headers: error.response?.headers,
      });
    } finally {
      setIsOrdersLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('https://localhost:7030/api/category', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchWallet = async () => {
    try {
      const response = await axios.get(`https://localhost:7030/api/wallet/me`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      console.log(`fetchWallet response:`, response.data);
      setAccountBalance(response.data.balance);
      setWalletId(response.data.walletID);
    } catch (error) {
      console.error('Failed to fetch wallet:', error.response?.data || error.message);
      setAccountBalance(0);
      setWalletId(null);
    }
  };

  const fetchSpecificWallet = async (walletID) => {
    try {
      const response = await axios.get(`https://localhost:7030/api/wallet/${walletID}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      console.log(`fetchSpecificWallet(${walletID}) response:`, JSON.stringify(response.data, null, 2));
      if (!response.data?.walletID || response.data.balance === undefined || !response.data.userName) {
        console.warn(`Invalid response data for wallet ${walletID}:`, JSON.stringify(response.data, null, 2));
      }
      return response;
    } catch (error) {
      console.error(`fetchSpecificWallet(${walletID}) error:`, {
        status: error.response?.status,
        data: JSON.stringify(error.response?.data, null, 2),
        message: error.message,
      });
      throw error;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          throw new Error('Invalid JWT token format');
        }
        const payload = tokenParts[1];
        const decodedPayload = JSON.parse(atob(payload));
        const roleClaim = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
        const userIdClaim = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';
        const role = decodedPayload[roleClaim] || 'User';
        const userId = parseInt(decodedPayload[userIdClaim]);
        setUserRole(role);
        setUserId(userId);
        localStorage.setItem('userId', userId); // Store userId
        setUserName('Loading...');

        const fetchUserDetails = async () => {
          try {
            const response = await axios.get(`https://localhost:7030/api/user/${userId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            setUserName(response.data.name || 'User');
          } catch (error) {
            console.error('Failed to fetch user details:', error);
            setUserName('User');
            toast.error('Failed to fetch user details.');
          }
        };
        fetchUserDetails();
      } catch (error) {
        console.error('Error decoding token:', error);
        setUserRole(null);
        setUserId(null);
        localStorage.removeItem('userId');
        setUserName('Guest');
        toast.error('Invalid session. Please log in again.');
      }
    } else {
      setUserRole(null);
      setUserId(null);
      localStorage.removeItem('userId');
      setUserName('Guest');
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    if (userId) {
      fetchWallet();
      fetchCartItems(userId);
      fetchOrders(userId);
    }
  }, [userId, userRole]);

  return {
    userRole,
    userName,
    userId,
    accountBalance,
    walletId,
    cartItems,
    cartItemCount,
    categories,
    orders,
    isOrdersLoading,
    ordersError,
    refreshCartItemCount: () => fetchCartItems(userId),
    fetchCartItems,
    fetchWallet,
    fetchOrders,
    fetchSpecificWallet,
  };
};

export default useHomePageData;