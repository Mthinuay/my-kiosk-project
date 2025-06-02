import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import ProductList from '../components/ProductList';
import logo from '../assets/Images/logo.jfif';
import bannerImage1 from '../assets/Images/1.jpg';
import bannerImage2 from '../assets/Images/2.jpg';
import bannerImage3 from '../assets/Images/3.jpg';
import bannerImage4 from '../assets/Images/7.jpg';
import categoryImage from '../assets/Images/B.jpg';
import fruitImage from '../assets/Images/A.jpg';
import snackImage from '../assets/Images/C.jpg';
import sideImage from '../assets/Images/D.jpg';
import dessertImage from '../assets/Images/E.jpg';
import breakfastImage from '../assets/Images/F.jpg';
import { FaShoppingCart, FaWallet, FaUser, FaShoppingBag, FaChevronLeft, FaChevronRight, FaSearch } from 'react-icons/fa';
import WalletModal from '../components/WalletModal';
import CartModal from '../components/CartModal';
import OrderHistory from '../components/OrderHistory';
import useHomePageData from '../hooks/useHomePageData';
import { toast } from 'react-toastify';

const HomePage = () => {
  const {
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
    refreshCartItemCount,
    fetchCartItems,
    fetchWallet,
    fetchOrders,
  } = useHomePageData();

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [displayedWallet, setDisplayedWallet] = useState(null);

  const dropdownRef = useRef(null);
  const formatter = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' });

  // Initialize and update displayed wallet
  useEffect(() => {
    if (accountBalance !== null && walletId && userName && userName !== 'Loading...') {
      console.log(`Updating displayedWallet: walletId=${walletId}, balance=${accountBalance}, userName=${userName}`);
      setDisplayedWallet({ walletId, balance: accountBalance, userName });
    }
  }, [accountBalance, walletId, userName]);

  const bannerImages = [bannerImage1, bannerImage2, bannerImage3, bannerImage4];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => 
        (prevIndex + 1) % bannerImages.length
      );
    }, 5000);
    return () => clearInterval(interval);
  }, [bannerImages.length]);

  const prevBanner = () => {
    setCurrentBannerIndex((prevIndex) => 
      prevIndex === 0 ? bannerImages.length - 1 : prevIndex - 1
    );
  };

  const nextBanner = () => {
    setCurrentBannerIndex((prevIndex) => 
      (prevIndex + 1) % bannerImages.length
    );
  };

  const updatedOrders = orders.map(order => ({
    ...order,
    orderStatus: order.orderStatus === 'Pending' ? 'Completed' : order.orderStatus
  }));

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleFundSuccess = async (amount, fundedWalletID, role) => {
    console.log(`handleFundSuccess: Amount=${amount}, WalletID=${fundedWalletID}, Role=${role}, UserWalletID=${walletId}`);
    try {
      // Show success toast
      toast.success(`Successfully funded ${formatter.format(amount)}!`);
      
      // Refresh superuser's wallet to ensure balance container is updated
      await fetchWallet();
      if (accountBalance !== null && walletId && userName && userName !== 'Loading...') {
        console.log(`Updating displayedWallet: walletId=${walletId}, balance=${accountBalance}, userName=${userName}`);
        setDisplayedWallet({ walletId, balance: accountBalance, userName });
      } else {
        console.warn(`Cannot update displayedWallet: accountBalance=${accountBalance}, walletId=${walletId}, userName=${userName}`);
      }
    } catch (error) {
      console.error('Error in handleFundSuccess:', error.response?.data || error.message);
      toast.error('Failed to refresh wallet after funding.');
    } finally {
      setShowWalletModal(false);
    }
  };

  const handleClearCart = async () => {
    const confirmed = window.confirm('Are you sure you want to clear your cart?');
    if (!confirmed) return;

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('You must be logged in.');
      return;
    }
    if (!userId) {
      toast.error('Invalid user session.');
      return;
    }

    try {
      const response = await axios.delete(`https://localhost:7030/api/CartItem/clear/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowCartModal(false);
      refreshCartItemCount();
      toast.success(response.data);
    } catch (error) {
      toast.error('Failed to clear cart.');
      console.error('Error clearing cart:', error);
    }
  };

  const handleRemoveFromCart = async (cartItemID) => {
    const confirmed = window.confirm('Are you sure you want to remove this item?');
    if (!confirmed) return;
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('You must be logged in.');
      return;
    }
    try {
      await axios.delete(`https://localhost:7030/api/CartItem/${cartItemID}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      refreshCartItemCount();
      toast.success('Item removed from cart.');
    } catch (error) {
      console.error('Error removing cart item:', error);
      toast.error('Failed to remove item.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    window.location.href = '/login';
    setShowOrderHistory(false);
  };

  const handleShowOrderHistory = () => {
    setShowOrderHistory(true);
  };

  const handleBack = () => {
    setShowOrderHistory(false);
  };

  const handleCategoryClick = (categoryID) => {
    setSelectedCategory(categoryID);
  };

  const filteredOrders = userRole === 'SuperUser' ? updatedOrders : updatedOrders.filter(order => String(order.userID) === String(userId));

  const categoryImages = [
    {
      categoryID: null,
      categoryName: 'All Categories',
      imageUrl: categoryImage
    },
    ...categories.map(category => ({
      ...category,
      imageUrl: (() => {
        switch (category.categoryName.toLowerCase()) {
          case 'fruits':
            return fruitImage;
          case 'snacks':
            return snackImage;
          case 'sides':
            return sideImage;
          case 'desserts':
            return dessertImage;
          case 'breakfast':
            return breakfastImage;
          default:
            return categoryImage;
        }
      })()
    }))
  ];

  if (showOrderHistory) {
    return (
      <OrderHistory
        userRole={userRole}
        userId={userId}
        orders={filteredOrders}
        isOrdersLoading={isOrdersLoading}
        ordersError={ordersError}
        fetchOrders={fetchOrders}
        formatter={formatter}
        handleLogout={handleLogout}
        handleBack={handleBack}
      />
    );
  }

  return (
    <div className="home-page">
      <style>
        {`
          .home-page {
            background: #f7f7f7;
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            font-family: 'Poppins', 'Helvetica', sans-serif;
          }
          .header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #ffffff;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            z-index: 1000;
          }
          .nav-container {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 16px;
            max-width: 1400px;
            margin: 0 auto;
            flex-wrap: wrap;
            gap: 16px;
          }
          .logo-image {
            width: 120px;
            height: 36px;
            object-fit: contain;
            border-radius: 6px;
            transition: transform 0.3s ease;
          }
          .logo-image:hover {
            transform: scale(1.05);
          }
          .search-controls {
            display: flex;
            flex: 1;
            gap: 12px;
            flex-wrap: wrap;
            align-items: center;
          }
          .search-container {
            position: relative;
            flex: 1;
            min-width: 120px;
            display: flex;
            align-items: center;
          }
          .search-icon {
            position: absolute;
            left: 12px;
            font-size: 16px;
            color: #6b7280;
            z-index: 1;
          }
          .search-input {
            width: 100%;
            padding: 10px 14px 10px 40px;
            border: none;
            border-radius: 10px;
            background: #f9fafb;
            font-size: 1rem;
            transition: all 0.3s ease;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          .search-input:focus {
            outline: none;
            box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
          }
          .search-input:hover {
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
          }
          .nav-right {
            display: flex;
            align-items: center;
            gap: 20px;
          }
          .balance-container {
            display: flex;
            align-items: center;
            background: linear-gradient(135deg, #d1fae5, #6ee7b7);
            padding: 8px 14px;
            border-radius: 10px;
            cursor: pointer;
            transition: background 0.3s ease;
          }
          .balance-container:hover {
            background: #6ee7b7;
          }
          .balance-amount {
            font-weight: 600;
            color: #047857;
            font-size: 0.95rem;
          }
          .balance-info {
            font-size: 0.85rem;
            color: #047857;
            margin-left: 8px;
          }
          .text-green-900 {
            color: #047857;
          }
          .cart-container {
            position: relative;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          .cart-container:hover {
            transform: scale(1.1);
            color: #10b981;
          }
          .cart-badge {
            position: absolute;
            top: -8px;
            right: -8px;
            background: #10b981;
            color: #ffffff;
            border-radius: 50%;
            padding: 3px 6px;
            font-size: 12px;
            font-weight: bold;
          }
          .user-menu {
            display: flex;
            align-items: center;
            gap: 20px;
          }
          .user-button {
            display: flex;
            align-items: center;
            padding: 12px 18px;
            background: #ffffff;
            border: none;
            border-radius: 10px;
            font-size: 0.95rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          .user-button:hover {
            background: rgba(243, 244, 246, 0.8);
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
          }
          .login-link {
            padding: 12px 18px;
            text-decoration: none;
            font-size: 0.95rem;
            font-weight: 600;
            background: linear-gradient(90deg, #10b981, #059669);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            transition: all 0.3s ease;
            position: relative;
          }
          .login-link:hover {
            color: #047857;
          }
          .login-link::after {
            content: '';
            position: absolute;
            bottom: 8px;
            left: 18px;
            width: 0;
            height: 2px;
            background: #10b981;
            transition: width 0.3s ease;
          }
          .login-link:hover::after {
            width: calc(100% - 36px);
          }
          .banner-section {
            width: 95%;
            max-width: 1400px;
            margin: 72px auto 24px;
            display: flex;
            justify-content: center;
            position: relative;
          }
          .banner-carousel {
            width: 100%;
            height: 400px;
            overflow: hidden;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            position: relative;
          }
          .banner-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: none;
            transition: opacity 0.5s ease;
          }
          .banner-image.active {
            display: block;
            opacity: 1;
          }
          .banner-image:not(.active) {
            opacity: 0;
            position: absolute;
            top: 0;
            left: 0;
          }
          .banner-arrow {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(0, 0, 0, 0.7);
            color: #ffffff;
            border: none;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            opacity: 1;
            transition: background 0.3s ease;
            z-index: 2;
          }
          .banner-arrow.left {
            left: 15px;
          }
          .banner-arrow.right {
            right: 15px;
          }
          .banner-arrow:hover {
            background: rgba(0, 0, 0, 0.9);
          }
          .slogan-overlay {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(16, 185, 129, 0.75);
            color: #ffffff;
            padding: 16px 32px;
            border-radius: 10px;
            font-size: 1.5rem;
            font-weight: 600;
            text-align: center;
            z-index: 1;
            opacity: 0;
            max-width: 80%;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
            transition: opacity 0.3s ease;
          }
          .banner-carousel:hover .slogan-overlay {
            opacity: 1;
          }
          @media (max-width: 768px) {
            .slogan-overlay {
              font-size: 1.2rem;
              padding: 12px 24px;
              max-width: 90%;
            }
          }
          @media (max-width: 480px) {
            .slogan-overlay {
              font-size: 1rem;
              padding: 10px 20px;
            }
          }
          .welcome-section {
            width: 95%;
            max-width: 1400px;
            margin: 24px auto;
            text-align: center;
          }
          .welcome-message {
            padding: 24px;
            background: #d1e7dd;
            border-radius: 10px;
            position: relative;
            overflow: hidden;
            animation: slide-in 0.5s ease-out;
            transition: all 0.3s ease;
          }
          .welcome-message:hover {
            background: #fed7aa;
            transform: translateY(-4px);
          }
          .welcome-text {
            font-size: 1.5rem;
            font-weight: 600;
            color: #1f2937;
            margin: 0;
            position: relative;
          }
          .welcome-text::after {
            content: '';
            display: block;
            width: 50%;
            height: 3px;
            background: #047857;
            margin: 12px auto 0;
            border-radius: 2px;
          }
          .categories-section {
            width: 95%;
            max-width: 1400px;
            margin: 24px auto;
            text-align: center;
          }
          .categories-title {
            font-size: 1.75rem;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 16px;
          }
          .categories-row {
            display: flex;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 20px;
            padding: 0 16px;
          }
          .category-card {
            flex: 0 0 auto;
            width: 100px;
            text-align: center;
            cursor: pointer;
          }
          .category-image {
            width: 100px;
            height: 100px;
            object-fit: cover;
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          .category-card:hover .category-image {
            transform: scale(1.1);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }
          .category-name {
            font-size: 1rem;
            color: #1f2937;
            margin-top: 10px;
            font-weight: 500;
          }
          .product-section {
            width: 95%;
            max-width: 1400px;
            margin: 25px auto;
          }
          @keyframes slide-in {
            from { opacity: 0; transform: translateX(-20px); }
            to { opacity: 1; transform: translateX(0); }
          }
        `}
      </style>
      <header className="header">
        <nav className="nav-container">
          <img src={logo} alt="Kiosk Logo" className="logo-image" />
          <div className="search-controls">
            <div className="search-container">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search products..."
                autoFocus
                className="search-input"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
          </div>
          <div className="nav-right">
            <div
              className="balance-container"
              onClick={() => setShowWalletModal(true)}
              title="Fund Wallet"
            >
              <FaWallet size={18} className="mr-2 text-green-900" />
              <span className="balance-amount">
                {displayedWallet
                  ? `${formatter.format(displayedWallet.balance)}${userRole === 'SuperUser' && displayedWallet.walletId !== walletId ? ` (${displayedWallet.userName})` : ''}`
                  : 'Loading...'}
              </span>
            </div>
            <div
              className="cart-container"
              onClick={() => setShowCartModal(true)}
              title="View Cart"
            >
              <FaShoppingCart size={22} />
              {cartItemCount > 0 && (
                <span className="cart-badge">{cartItemCount}</span>
              )}
            </div>
            <div className="user-menu">
              {userRole ? (
                <>
                  <button
                    onClick={handleShowOrderHistory}
                    className="user-button"
                    title="View Orders"
                  >
                    <FaShoppingBag size={18} className="mr-2" />
                    Orders
                  </button>
                  <button
                    onClick={handleLogout}
                    className="user-button"
                    title="Logout"
                  >
                    <FaUser size={18} className="mr-2" />
                    Logout
                  </button>
                </>
              ) : (
                <a href="/login" className="login-link">Login</a>
              )}
            </div>
          </div>
        </nav>
      </header>
      <section className="banner-section">
        <div className="banner-carousel">
          {bannerImages.map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`Banner ${index + 1}`}
              className={`banner-image ${index === currentBannerIndex ? 'active' : ''}`}
            />
          ))}
          <div className="slogan-overlay">
            Grab Your Favorites, Fresh & Fast!
          </div>
          <button className="banner-arrow left" onClick={prevBanner} title="Previous Banner">
            <FaChevronLeft size={24} />
          </button>
          <button className="banner-arrow right" onClick={nextBanner} title="Next Banner">
            <FaChevronRight size={24} />
          </button>
        </div>
      </section>
      <section className="welcome-section">
        <div className="welcome-message">
          <h2 className="welcome-text">
            Hello, {userName}! Shop your favorites today.
          </h2>
        </div>
      </section>
      <section className="categories-section">
        <h2 className="categories-title">Explore Categories</h2>
        <div className="categories-row">
          {categoryImages.map((category) => (
            <div
              key={category.categoryID ?? 'all'}
              className="category-card"
              onClick={() => handleCategoryClick(category.categoryID)}
              title={`Shop ${category.categoryName}`}
            >
              <img
                src={category.imageUrl}
                alt={category.categoryName}
                className="category-image"
              />
              <div className="category-name">{category.categoryName}</div>
            </div>
          ))}
        </div>
      </section>
      <section className="product-section">
        <div style={{
          padding: '20px',
          backgroundColor: 'transparent',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}>
          <ProductList
            userRole={userRole}
            selectedCategory={selectedCategory}
            searchQuery={searchQuery}
            refreshCartItemCount={refreshCartItemCount}
            onCartUpdated={() => {
              if (userId) {
                fetchCartItems(userId);
                fetchWallet();
                fetchOrders(userId);
              }
            }}
          />
        </div>
      </section>
      {showWalletModal && (
        <WalletModal
          walletID={walletId}
          onClose={() => setShowWalletModal(false)}
          onSuccess={handleFundSuccess}
        />
      )}
      {showCartModal && (
        <CartModal
          cartItems={cartItems}
          onClose={() => setShowCartModal(false)}
          onClearCart={handleClearCart}
          handleRemoveFromCart={handleRemoveFromCart}
          onCartUpdated={() => {
            if (userId) {
              fetchCartItems(userId);
              fetchWallet();
              fetchOrders(userId);
            }
          }}
        />
      )}
    </div>
  );
};

export default HomePage;