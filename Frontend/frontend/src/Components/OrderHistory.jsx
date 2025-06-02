import React, { useState } from 'react';
import { FaShoppingBag, FaArrowLeft, FaAngleDown, FaAngleUp, FaSortUp, FaSortDown } from 'react-icons/fa';
import { toast } from 'react-toastify';

const OrderHistory = ({ userRole, userId, orders, isOrdersLoading, ordersError, fetchOrders, formatter, handleBack }) => {
  const [expandedOrders, setExpandedOrders] = useState({});
  const [visibleOrders, setVisibleOrders] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'orderDate', direction: 'desc' });
  const [filters, setFilters] = useState({ status: '', userSearch: '', dateStart: '', dateEnd: '' });

  // Debugging logs
  console.log('OrderHistory.jsx - userId:', userId, 'userRole:', userRole);
  console.log('OrderHistory.jsx - received orders:', orders);

  // Update Pending orders to Completed
  const updatedOrders = orders.map(order => ({
    ...order,
    orderStatus: order.orderStatus === 'Pending' ? 'Completed' : order.orderStatus
  }));

  const toggleOrderDetails = (orderId) => {
    setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const handleLoadMore = () => {
    setVisibleOrders(prev => prev + 10);
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Apply sorting and filtering
  const getFilteredAndSortedOrders = () => {
    let filteredOrders = [...updatedOrders];

    // Apply filters
    if (filters.status) {
      filteredOrders = filteredOrders.filter(order => order.orderStatus.toLowerCase() === filters.status.toLowerCase());
    }
    if (filters.userSearch && userRole === 'SuperUser') {
      filteredOrders = filteredOrders.filter(order =>
        order.userName?.toLowerCase().includes(filters.userSearch.toLowerCase()) ||
        order.userID.toString().includes(filters.userSearch)
      );
    }
    if (filters.dateStart) {
      filteredOrders = filteredOrders.filter(order => new Date(order.orderDate) >= new Date(filters.dateStart));
    }
    if (filters.dateEnd) {
      filteredOrders = filteredOrders.filter(order => new Date(order.orderDate) <= new Date(filters.dateEnd));
    }

    // Apply sorting
    filteredOrders.sort((a, b) => {
      const aValue = sortConfig.key === 'totalAmount' ? a[sortConfig.key] : a[sortConfig.key]?.toString().toLowerCase();
      const bValue = sortConfig.key === 'totalAmount' ? b[sortConfig.key] : b[sortConfig.key]?.toString().toLowerCase();
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    console.log('OrderHistory.jsx - filteredAndSortedOrders:', filteredOrders);
    return filteredOrders;
  };

  const filteredAndSortedOrders = getFilteredAndSortedOrders();

  const styles = {
    container: {
      width: '100%',
      minHeight: '100vh',
      padding: '32px',
      background: '#fff',
      margin: 0,
      boxSizing: 'border-box',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
    },
    heading: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1a202c',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    toolbar: {
      display: 'flex',
      gap: '16px',
    },
    toolbarButton: {
      padding: '12px 24px',
      background: '#00796b',
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    },
    filterSection: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginBottom: '24px',
      padding: '16px',
      background: '#f8fafc',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
    },
    filterInput: {
      padding: '12px',
      borderRadius: '8px',
      border: '1px solid #ccc',
      fontSize: '16px',
      width: '100%',
      boxSizing: 'border-box',
      transition: 'border-color 0.2s ease',
    },
    tableContainer: {
      width: '100%',
      overflowX: 'auto',
    },
    table: {
      width: '100%',
      borderCollapse: 'separate',
      borderSpacing: '0 8px',
      minWidth: userRole === 'SuperUser' ? '1000px' : '800px',
    },
    th: {
      padding: '16px',
      background: '#e0f2f1',
      fontSize: '18px',
      fontWeight: '600',
      color: '#1a202c',
      textAlign: 'left',
      cursor: 'pointer',
      userSelect: 'none',
    },
    td: {
      padding: '16px',
      background: '#fff',
      fontSize: '16px',
      color: '#333',
      borderTop: '1px solid #edf2f7',
      borderBottom: '1px solid #edf2f7',
    },
    tr: {
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      marginBottom: '8px',
    },
    status: {
      padding: '4px 12px',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '500',
    },
    actions: {
      display: 'flex',
      gap: '12px',
    },
    toggleButton: {
      padding: '10px 16px',
      background: '#e0f2f1',
      color: '#00796b',
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'background-color 0.2s ease',
    },
    orderItems: {
      padding: '16px',
      background: '#f8fafc',
      borderRadius: '8px',
      marginTop: '8px',
    },
    itemsHeading: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#1a202c',
      marginBottom: '12px',
    },
    itemsList: {
      listStyle: 'none',
      padding: '0',
      margin: '0',
    },
    item: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr 1fr',
      fontSize: '16px',
      color: '#333',
      padding: '12px 0',
      gap: '16px',
      borderBottom: '1px solid #e2e8f0',
    },
    loading: {
      fontSize: '18px',
      color: '#718096',
      textAlign: 'center',
      padding: '24px',
    },
    error: {
      fontSize: '18px',
      color: '#dc2626',
      textAlign: 'center',
      padding: '24px',
    },
    retryButton: {
      padding: '12px 24px',
      background: '#00796b',
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      cursor: 'pointer',
      margin: '16px auto',
      display: 'block',
    },
    loadMore: {
      padding: '12px 24px',
      background: '#4a90e2',
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      cursor: 'pointer',
      margin: '24px auto',
      display: 'block',
      transition: 'background-color 0.2s ease',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.heading}>
          <FaShoppingBag size={24} color="#00796b" aria-label="Order History" />
          {userRole === 'SuperUser' ? 'All Orders' : 'My Orders'}
        </h1>
        <div style={styles.toolbar}>
          <button onClick={handleBack} style={styles.toolbarButton}>
            <FaArrowLeft size={16} />
            Back to Home
          </button>
          
        </div>
      </div>
      <div style={styles.filterSection}>
        <select
          name="status"
          onChange={handleFilterChange}
          value={filters.status}
          style={styles.filterInput}
          aria-label="Filter by status"
        >
          <option value="">Order Status</option>
          <option value="Completed">Completed</option>
          <option value="Pending">Pending</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        {userRole === 'SuperUser' && (
          <input
            type="text"
            name="userSearch"
            value={filters.userSearch}
            onChange={handleFilterChange}
            placeholder="Search by user..."
            style={styles.filterInput}
            aria-label="Search by user"
          />
        )}
        <input
          type="date"
          name="dateStart"
          value={filters.dateStart}
          onChange={handleFilterChange}
          style={styles.filterInput}
          aria-label="Start date"
        />
        <input
          type="date"
          name="dateEnd"
          value={filters.dateEnd}
          onChange={handleFilterChange}
          style={styles.filterInput}
          aria-label="End date"
        />
      </div>
      {isOrdersLoading ? (
        <p style={styles.loading}>Loading orders...</p>
      ) : ordersError ? (
        <div>
          <p style={styles.error}>{ordersError}</p>
          <button onClick={() => fetchOrders(userId)} style={styles.retryButton}>
            Retry
          </button>
        </div>
      ) : updatedOrders.length === 0 ? (
        <p style={styles.loading}>No orders found.</p>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th} onClick={() => handleSort('orderID')}>
                  Order ID {sortConfig.key === 'orderID' && (sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />)}
                </th>
                {userRole === 'SuperUser' && (
                  <>
                    <th style={styles.th} onClick={() => handleSort('userID')}>
                      User ID {sortConfig.key === 'userID' && (sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />)}
                    </th>
                    <th style={styles.th} onClick={() => handleSort('userName')}>
                      Username {sortConfig.key === 'userName' && (sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />)}
                    </th>
                  </>
                )}
                <th style={styles.th} onClick={() => handleSort('orderDate')}>
                  Date {sortConfig.key === 'orderDate' && (sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />)}
                </th>
                <th style={styles.th} onClick={() => handleSort('orderStatus')}>
                  Status {sortConfig.key === 'orderStatus' && (sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />)}
                </th>
                <th style={styles.th} onClick={() => handleSort('deliveryOrCollection')}>
                  Delivery {sortConfig.key === 'deliveryOrCollection' && (sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />)}
                </th>
                <th style={styles.th} onClick={() => handleSort('totalAmount')}>
                  Total {sortConfig.key === 'totalAmount' && (sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />)}
                </th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedOrders.slice(0, visibleOrders).map((order) => (
                <React.Fragment key={order.orderID}>
                  <tr style={styles.tr}>
                    <td style={styles.td}>#{order.orderID}</td>
                    {userRole === 'SuperUser' && (
                      <>
                        <td style={styles.td}>{order.userID}</td>
                        <td style={styles.td}>{order.userName || `User ${order.userID}`}</td>
                      </>
                    )}
                    <td style={styles.td}>{new Date(order.orderDate).toLocaleDateString('en-ZA')}</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.status,
                          backgroundColor:
                            order.orderStatus === 'Completed' ? '#10B981' :
                            order.orderStatus === 'Pending' ? '#F59E0B' : '#EF4444',
                          color: '#fff',
                        }}
                      >
                        {order.orderStatus}
                      </span>
                    </td>
                    <td style={styles.td}>{order.deliveryOrCollection}</td>
                    <td style={styles.td}>{formatter.format(order.totalAmount)}</td>
                    <td style={styles.td}>
                      <div style={styles.actions}>
                        <button
                          onClick={() => toggleOrderDetails(order.orderID)}
                          style={styles.toggleButton}
                          aria-label={expandedOrders[order.orderID] ? 'Hide details' : 'Show details'}
                        >
                          {expandedOrders[order.orderID] ? <FaAngleUp /> : <FaAngleDown />}
                          {expandedOrders[order.orderID] ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedOrders[order.orderID] && (
                    <tr>
                      <td colSpan={userRole === 'SuperUser' ? 7 : 5} style={{ padding: 0 }}>
                        <div style={styles.orderItems}>
                          <h4 style={styles.itemsHeading}>Items Ordered</h4>
                          <ul style={styles.itemsList}>
                            {order.cartItems && order.cartItems.length > 0 ? (
                              order.cartItems.map((item, index) => (
                                <li key={`${item.cartItemID}-${index}`} style={styles.item}>
                                  <span>{item.products?.[0]?.productName || 'Unknown Product'}</span>
                                  <span>Qty: {item.quantity || 0}</span>
                                  <span>{formatter.format(item.price || 0)}</span>
                                </li>
                              ))
                            ) : (
                              <li style={styles.item}>No items found for this order.</li>
                            )}
                          </ul>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {filteredAndSortedOrders.length > visibleOrders && (
        <button onClick={handleLoadMore} style={styles.loadMore}>
          Load More
        </button>
      )}
    </div>
  );
};

export default OrderHistory;