import React, { useMemo, useState, useRef } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { FaStore, FaTruck } from 'react-icons/fa';
import { getAuthHeaders, checkTokenValidity, logoutUser } from '../utils/auth';

const CartModal = ({ cartItems: initialCartItems, onClose, onClearCart, onCartUpdated }) => {
  const BACKEND_URL = 'https://localhost:7030';
  const [cartItems, setCartItems] = useState(initialCartItems);
  const [deliveryOption, setDeliveryOption] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const lastCartItems = useRef([]);

  const DELIVERY_FEE = 60;

  const formatter = useMemo(
    () => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }),
    []
  );

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price, 0),
    [cartItems]
  );

  const total = useMemo(
    () => subtotal + (deliveryOption === 'Delivery' ? DELIVERY_FEE : 0),
    [subtotal, deliveryOption]
  );

  const fetchCartItems = async (userId) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/CartItem/user/${userId}`, {
        headers: getAuthHeaders(),
      });
      setCartItems(response.data);
      lastCartItems.current = response.data;
      if (typeof onCartUpdated === 'function') {
        onCartUpdated(response.data);
      }
      return response.data;
    } catch (err) {
      console.error('Error fetching items:', err.response || err);
      setError('Failed to refresh cart. Using local data.');
      return cartItems;
    }
  };

  const fetchWalletBalance = async (walletId) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/wallet/${walletId}`, {
        headers: getAuthHeaders(),
      });
      return response.data.balance;
    } catch (err) {
      console.error('Error fetching wallet balance:', err.response || err);
      setError('Failed to fetch updated wallet balance.');
      return null;
    }
  };

  const updateCartItemQuantity = async (cartItemID, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      setLoading(true);
      await axios.put(
        `${BACKEND_URL}/api/CartItem/${cartItemID}`,
        { Quantity: newQuantity },
        { headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' } }
      );
      const token = localStorage.getItem('token');
      const decoded = jwtDecode(token);
      const userId = parseInt(
        decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || '0'
      );
      await fetchCartItems(userId);
      setError(null);
    } catch (err) {
      const errorMessage =
        err.response?.status === 400
          ? err.response.data.message || 'Invalid quantity or insufficient stock.'
          : err.response?.status === 404
          ? 'Cart item not found.'
          : 'Failed to update quantity.';
      setError(errorMessage);
      console.error('Quantity update error:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const removeCartItem = async (cartItemID) => {
    try {
      setLoading(true);
      await axios.delete(`${BACKEND_URL}/api/CartItem/${cartItemID}`, {
        headers: getAuthHeaders(),
      });
      const token = localStorage.getItem('token');
      const decoded = jwtDecode(token);
      const userId = parseInt(
        decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || '0'
      );
      await fetchCartItems(userId);
      setError(null);
    } catch (err) {
      const errorMessage =
        err.response?.status === 404
          ? 'Cart item not found.'
          : err.response?.status === 401
          ? 'Unauthorized. Please log in again.'
          : 'Failed to remove item.';
      setError(errorMessage);
      console.error('Remove item error:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      if (err.response?.status === 401) {
        setTimeout(logoutUser, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!deliveryOption) {
      setError('Please select Pickup or Delivery.');
      return;
    }

    if (!checkTokenValidity()) {
      setError('Your session has expired. Please log in again.');
      setTimeout(logoutUser, 2000);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const decoded = jwtDecode(token);
      console.log('Decoded JWT:', JSON.stringify(decoded, null, 2));

      const userId = parseInt(
        decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || '0'
      );

      if (!userId || isNaN(userId)) {
        throw new Error(
          'User ID not found in token. Available claims: ' + JSON.stringify(decoded, null, 2)
        );
      }

      const refreshedCartItems = await fetchCartItems(userId);

      if (refreshedCartItems.some((item) => item.userID !== userId)) {
        throw new Error('Cart contains items for another user.');
      }

      const calculatedSubtotal = refreshedCartItems.reduce(
        (acc, item) => acc + item.price,
        0
      );
      const deliveryFee = deliveryOption === 'Delivery' ? DELIVERY_FEE : 0;
      console.log('Cart Items:', JSON.stringify(refreshedCartItems, null, 2));
      console.log('Subtotal:', calculatedSubtotal, 'Delivery Fee:', deliveryFee, 'Total:', calculatedSubtotal + deliveryFee);

      const response = await axios.post(
        `${BACKEND_URL}/api/CartItem/checkout`,
        {
          userId,
          deliveryOrCollection: deliveryOption,
          deliveryFee,
          cartItems: refreshedCartItems.map((item) => ({
            cartItemID: item.cartItemID,
            productId: item.products?.[0]?.productID,
            quantity: item.quantity,
            price: item.price,
          })),
        },
        {
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Order Details:', JSON.stringify(response.data, null, 2));

      const orderTotal = response.data.order?.totalAmount;
      let walletBalance = response.data.walletBalance;

      if (walletBalance === undefined && response.data.order?.walletID) {
        walletBalance = await fetchWalletBalance(response.data.order.walletID);
      }

      if (orderTotal && Math.abs((calculatedSubtotal + deliveryFee) - orderTotal) > 0.01) {
        console.warn(
          `Total mismatch: Frontend (${calculatedSubtotal + deliveryFee}) vs Backend (${orderTotal})`
        );
      }

      setOrderDetails({ ...response.data, walletBalance });
      onClearCart();
      if (typeof onCartUpdated === 'function') {
        onCartUpdated();
      }
      setDeliveryOption('');
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Unauthorized. Please log in again.');
        setTimeout(logoutUser, 2000);
      } else if (err.response?.status === 400 && err.response.data.message?.includes('balance')) {
        setError('Insufficient wallet balance.');
      } else if (err.response?.status === 404) {
        setError('Checkout endpoint not found. Please contact support.');
      } else {
        setError(
          err.response?.data?.message ||
            err.response?.data ||
            err.message ||
            'Checkout failed. Please try again.'
        );
      }
      console.error('Checkout error:', err.response || err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setOrderDetails(null);
    setDeliveryOption('');
    onClose();
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <style>
          {`
            .delivery-container {
              display: flex;
              flex-direction: row;
              gap: 16px;
              margin-bottom: 16px;
            }
            .delivery-option {
              flex: 1;
              padding: 16px;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              background: #ffffff;
              cursor: pointer;
              transition: all 0.3s ease;
            }
            .delivery-option:hover {
              transform: scale(1.05);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
              border-color: #93c5fd;
            }
            .pickup-selected {
              border-color: #14b8a6;
              background: linear-gradient(to right, #e0f2fe, #ccfbf1);
            }
            .delivery-selected {
              border-color: #6366f1;
              background: linear-gradient(to right, #e0e7ff, #c7d2fe);
            }
            .delivery-content {
              display: flex;
              align-items: center;
              justify-content: space-between;
            }
            .delivery-label {
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 16px;
              font-weight: 600;
              color: #1f2937;
            }
            .delivery-price {
              font-size: 14px;
              font-weight: bold;
            }
            .pickup-selected .delivery-price {
              color: #14b8a6;
            }
            .delivery-selected .delivery-price {
              color: #6366f1;
            }
            .delivery-radio {
              display: none;
            }
            .delivery-radio + .delivery-label::before {
              content: '';
              display: inline-block;
              width: 16px;
              height: 16px;
              border: 2px solid #d1d5db;
              border-radius: 50%;
              margin-right: 8px;
            }
            .delivery-radio:checked + .delivery-label::before {
              background-color: #3b82f6;
              border-color: #3b82f6;
            }
            .quantity-container {
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .quantity-btn {
              width: 28px;
              height: 28px;
              background-color: #ffffff;
              border: 1px solid #d1d5db;
              border-radius: 6px;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              font-size: 16px;
              color: #374151;
              transition: all 0.2s ease;
            }
            .quantity-btn:hover:not(:disabled) {
              background-color: #f3f4f6;
              transform: scale(1.1);
              border-color: #3b82f6;
            }
            .quantity-btn:disabled {
              background-color: #f3f4f6;
              color: #9ca3af;
              cursor: not-allowed;
            }
            .quantity-value {
              min-width: 24px;
              text-align: center;
              font-size: 14px;
              color: #1f2937;
            }
            .delete-btn {
              width: 28px;
              height: 28px;
              background-color: #ffffff;
              border: 1px solid #d1d5db;
              border-radius: 6px;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              font-size: 16px;
              color: #dc2626;
              transition: all 0.2s ease;
            }
            .delete-btn:hover:not(:disabled) {
              background-color: #fef2f2;
              transform: scale(1.1);
              border-color: #dc2626;
            }
            .delete-btn:disabled {
              background-color: #f3f4f6;
              color: #9ca3af;
              cursor: not-allowed;
            }
            @media (max-width: 640px) {
              .delivery-container {
                flex-direction: column;
              }
            }
          `}
        </style>
        <button
          onClick={handleClose}
          style={styles.closeButton}
          aria-label="Close cart modal"
          disabled={loading}
        >
          ×
        </button>

        <h2 style={styles.heading}>🛒 Your Cart</h2>

        {orderDetails ? (
          <div style={styles.confirmation}>
            <h3 style={styles.confirmationHeading}>Order Confirmed!</h3>
            <p style={styles.confirmationText}>Order ID: {orderDetails.orderId}</p>
            <ul style={styles.list}>
              {lastCartItems.current.map((item) => {
                const product = item.products?.[0];
                return (
                  <li key={item.cartItemID} style={{ ...styles.item, padding: '8px 0' }}>
                    <div style={{ flex: 1 }}>
                      <div style={styles.productName}>
                        {product?.productName || item.productName || 'No product name'}
                      </div>
                      <div style={styles.details}>
                        Qty: {item.quantity} × {formatter.format(item.price / item.quantity)} ={' '}
                        {formatter.format(item.price)}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <p style={styles.confirmationText}>
              Total: {formatter.format(orderDetails.order.totalAmount)}
            </p>
            <p style={styles.confirmationText}>
              Delivery: {orderDetails.order.deliveryOrCollection}
            </p>
            {orderDetails.walletBalance !== undefined && (
              <p style={styles.confirmationText}>
                New Wallet Balance: {formatter.format(orderDetails.walletBalance)}
              </p>
            )}
            <button
              style={styles.viewCartBtn}
              onClick={handleClose}
              disabled={loading}
            >
              🛍 Continue Shopping
            </button>
          </div>
        ) : cartItems.length === 0 ? (
          <div style={styles.emptyWrapper}>
            <p style={styles.emptyText}>Your cart is empty.</p>
            <button
              style={styles.viewCartBtn}
              onClick={handleClose}
              disabled={loading}
            >
              🛍 Back to Shopping
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div style={styles.error}>
                {error}
                <button
                  onClick={() => setError(null)}
                  style={styles.errorClose}
                  aria-label="Close error message"
                >
                  ×
                </button>
              </div>
            )}

            <ul style={styles.list}>
              {cartItems.map((item) => {
                const product = item.products?.[0];
                const imagePath = product?.imagePath || item.imagePath || '';
                const imageUrl = imagePath ? `${BACKEND_URL}${imagePath}` : '';

                return (
                  <li key={item.cartItemID} style={styles.item}>
                    <img
                      src={imageUrl}
                      alt={product?.productName || item.productName || 'Product'}
                      style={styles.productImage}
                    />
                    <div style={{ flex: 1, marginLeft: '12px' }}>
                      <div style={styles.productName}>
                        {product?.productName || item.productName || 'No product name'}
                      </div>
                      <div style={styles.details}>
                        <span>Qty: </span>
                        <div className="quantity-container">
                          <button
                            onClick={() => updateCartItemQuantity(item.cartItemID, item.quantity - 1)}
                            className="quantity-btn"
                            disabled={loading || item.quantity <= 1}
                            aria-label="Decrease quantity"
                          >
                            -
                          </button>
                          <span className="quantity-value">{item.quantity}</span>
                          <button
                            onClick={() => updateCartItemQuantity(item.cartItemID, item.quantity + 1)}
                            className="quantity-btn"
                            disabled={loading}
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                        <span style={{ marginLeft: '8px' }}>
                          × {formatter.format(item.price / item.quantity)} ={' '}
                          {formatter.format(item.price)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeCartItem(item.cartItemID)}
                      aria-label={`Remove ${product?.productName || item.productName || 'item'}`}
                      className="delete-btn"
                      disabled={loading}
                    >
                      🗑️
                    </button>
                  </li>
                );
              })}
            </ul>

            <div style={styles.totalRow}>
              <strong>Subtotal:</strong>
              <span>{formatter.format(subtotal)}</span>
            </div>
            {deliveryOption === 'Delivery' && (
              <div style={styles.totalRow}>
                <strong>Delivery Fee:</strong>
                <span>{formatter.format(DELIVERY_FEE)}</span>
              </div>
            )}
            <div style={styles.totalRow}>
              <strong>Total:</strong>
              <span style={styles.totalPrice}>{formatter.format(total)}</span>
            </div>

            <form onSubmit={handleCheckout} style={styles.checkoutForm}>
              <label style={styles.label}>Delivery Option:</label>
              <div className="delivery-container">
                <div
                  className={`delivery-option ${deliveryOption === 'Pickup' ? 'pickup-selected' : ''}`}
                  onClick={() => setDeliveryOption('Pickup')}
                >
                  <div className="delivery-content">
                    <label className="delivery-label">
                      <input
                        type="radio"
                        name="deliveryOption"
                        value="Pickup"
                        checked={deliveryOption === 'Pickup'}
                        onChange={() => setDeliveryOption('Pickup')}
                        className="delivery-radio"
                        disabled={loading}
                      />
                      <FaStore style={{ color: '#14b8a6', fontSize: '18px' }} aria-hidden="true" />
                      Pickup
                    </label>
                    <span className="delivery-price">R0</span>
                  </div>
                </div>
                <div
                  className={`delivery-option ${deliveryOption === 'Delivery' ? 'delivery-selected' : ''}`}
                  onClick={() => setDeliveryOption('Delivery')}
                >
                  <div className="delivery-content">
                    <label className="delivery-label">
                      <input
                        type="radio"
                        name="deliveryOption"
                        value="Delivery"
                        checked={deliveryOption === 'Delivery'}
                        onChange={() => setDeliveryOption('Delivery')}
                        className="delivery-radio"
                        disabled={loading}
                      />
                      <FaTruck style={{ color: '#6366f1', fontSize: '18px' }} aria-hidden="true" />
                      Delivery
                    </label>
                    <span className="delivery-price">R60</span>
                  </div>
                </div>
              </div>

              <div style={styles.buttonGroup}>
                <button
                  type="submit"
                  style={{
                    ...styles.checkoutBtn,
                    ...(loading ? styles.disabledBtn : {}),
                  }}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : '🔒 Checkout'}
                </button>
                <button
                  type="button"
                  style={styles.viewCartBtn}
                  onClick={handleClose}
                  disabled={loading}
                >
                  🛍 Continue Shopping
                </button>
                <button
                  type="button"
                  style={styles.clearBtn}
                  onClick={onClearCart}
                  disabled={loading}
                >
                  ❌ Clear Cart
                </button>
              </div>
            </form>

            <div style={styles.info}>
              <div>💳 Secure payment</div>
              <div>🚚 Fast, reliable delivery</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1500,
  },
  modal: {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '16px',
    width: '90%',
    maxWidth: '460px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
    position: 'relative',
    fontFamily: 'Segoe UI, sans-serif',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
    border: 'none',
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.3s ease',
    userSelect: 'none',
    outline: 'none',
  },
  heading: {
    fontSize: '22px',
    marginBottom: '16px',
    textAlign: 'center',
  },
  emptyWrapper: {
    textAlign: 'center',
  },
  emptyText: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '16px',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    marginBottom: 16,
  },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '12px 0',
    borderBottom: '1px solid #eee',
  },
  productName: {
    fontWeight: 600,
    fontSize: '16px',
  },
  details: {
    fontSize: '14px',
    color: 'black',
    marginTop: 4,
    display: 'flex',
    alignItems: 'center',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '16px',
    paddingTop: 8,
    marginTop: 8,
  },
  totalPrice: {
    fontWeight: 700,
    color: '#222',
  },
  buttonGroup: {
    marginTop: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  checkoutBtn: {
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    padding: '12px',
    fontSize: '16px',
    borderRadius: '8px',
    cursor: 'pointer',
    width: '100%',
  },
  disabledBtn: {
    backgroundColor: '#6c757d',
    cursor: 'not-allowed',
  },
  viewCartBtn: {
    backgroundColor: '#f2f2f2',
    color: '#333',
    border: 'none',
    padding: '12px',
    fontSize: '16px',
    borderRadius: '8px',
    cursor: 'pointer',
    width: '100%',
  },
  clearBtn: {
    backgroundColor: '#dc2626',
    color: '#fff',
    border: 'none',
    padding: '12px',
    fontSize: '16px',
    fontWeight: 'bold',
    borderRadius: '8px',
    cursor: 'pointer',
    width: '100%',
  },
  info: {
    marginTop: 24,
    fontSize: '13px',
    color: '#666',
    textAlign: 'center',
    lineHeight: 1.6,
  },
  productImage: {
    width: '60px',
    height: '60px',
    borderRadius: '8px',
    objectFit: 'cover',
    flexShrink: 0,
  },
  checkoutForm: {
    marginTop: 16,
  },
  label: {
    display: 'block',
    fontSize: '14px',
    marginBottom: 8,
    fontWeight: 600,
  },
  confirmation: {
    textAlign: 'center',
  },
  confirmationHeading: {
    fontSize: '20px',
    color: '#2f855a',
    marginBottom: 16,
  },
  confirmationText: {
    fontSize: '16px',
    color: '#333',
    marginBottom: 8,
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: '8px 12px',
    borderRadius: '4px',
    marginBottom: '12px',
    fontSize: '14px',
    position: 'relative',
  },
  errorClose: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    background: 'transparent',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    color: '#dc2626',
  },
};

export default CartModal;