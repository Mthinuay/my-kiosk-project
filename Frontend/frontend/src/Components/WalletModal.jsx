import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Wallet.css';
import { FaArrowLeft, FaSearch } from 'react-icons/fa';
import { getUserRoleFromToken, getAuthHeaders } from '../utils/auth';

const WalletModal = ({ onClose, onSuccess, walletID }) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [selectedWalletID, setSelectedWalletID] = useState('');
  const [userRole, setUserRole] = useState(null);
  const [walletOptions, setWalletOptions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const role = getUserRoleFromToken();
    setUserRole(role);

    if (role === 'SuperUser') {
      fetchAllWallets();
      setSelectedWalletID(''); // Reset selection for SuperUser
    } else {
      setSelectedWalletID(walletID); // Use provided walletID for non-superusers
    }
  }, [walletID]);

  const fetchAllWallets = async () => {
    try {
      const response = await axios.get('https://localhost:7030/api/wallet', {
        headers: getAuthHeaders(),
      });
      // Exclude Wallet #1
      const filteredWallets = response.data.filter(wallet => wallet.walletID !== 1);
      setWalletOptions(filteredWallets);
    } catch (err) {
      console.error('Error fetching wallets:', err);
      setError('Failed to load wallets. Try again later.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) {
      setError('Please enter a valid amount greater than zero.');
      return;
    }

    const walletToFund = userRole === 'SuperUser' ? selectedWalletID : walletID;
    if (!walletToFund || isNaN(walletToFund)) {
      setError('Please select a valid wallet.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const fundedWallet = userRole === 'SuperUser' 
        ? walletOptions.find(wallet => wallet.walletID === parseInt(walletToFund))
        : { walletID: walletToFund, userID: parseInt(localStorage.getItem('userId')) };

      if (!fundedWallet || !fundedWallet.userID) {
        setError('Invalid wallet or user ID.');
        return;
      }

      console.log(`Funding wallet: ${walletToFund}, UserID: ${fundedWallet.userID}, amount: ${value}`);
      await axios.post(
        `https://localhost:7030/api/wallet/${walletToFund}/deposit`,
        { Amount: value, UserID: fundedWallet.userID },
        { headers: getAuthHeaders() }
      );

      const confirmationMessage = userRole === 'SuperUser' && fundedWallet
        ? `Successfully funded R${value.toFixed(2)} to ${fundedWallet.userName}'s wallet!`
        : `Successfully funded R${value.toFixed(2)} to your wallet!`;

      setConfirmation(confirmationMessage);
      onSuccess(value, walletToFund, userRole);
      setAmount('');
      setSearchQuery('');
      setSelectedWalletID(userRole === 'SuperUser' ? '' : walletID);
    } catch (err) {
      console.error('Funding error:', err);
      setError(err.response?.data?.message || 'Failed to fund wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredWallets = walletOptions.filter(wallet =>
    (wallet.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     wallet.email?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="wallet-modal-backdrop">
      <div className="wallet-modal">
        <div className="wallet-header">
          <h2>Fund Wallet</h2>
          <button className="back-button" onClick={onClose} aria-label="Close">
            <FaArrowLeft size={20} color="#00796b" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {userRole === 'SuperUser' && (
            <div className="wallet-select-container">
              <label htmlFor="walletSearch" className="wallet-label">
                Search User
              </label>
              <div className="search-container">
                <FaSearch className="search-icon" />
                <input
                  id="walletSearch"
                  type="text"
                  placeholder="Search by username or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="wallet-search-input"
                />
              </div>
              <label htmlFor="walletSelect" className="wallet-label">
                Select Wallet
              </label>
              <select
                id="walletSelect"
                className="wallet-select"
                value={selectedWalletID || ''}
                onChange={(e) => setSelectedWalletID(e.target.value)}
                required
              >
                <option value="" disabled>Select a wallet</option>
                {filteredWallets.length > 0 ? (
                  filteredWallets.map(wallet => (
                    <option key={wallet.walletID} value={wallet.walletID}>
                      {wallet.userName} ({wallet.email})
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No wallets match your search</option>
                )}
              </select>
            </div>
          )}

          <div className="input-group">
            <label htmlFor="amount" className="wallet-label">Amount (ZAR)</label>
            <input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="wallet-input"
              min="0.01"
              step="0.01"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="wallet-submit">
            {loading ? 'Processing...' : 'Fund Wallet'}
          </button>
        </form>

        {error && <p className="wallet-error">{error}</p>}
        {confirmation && <p className="wallet-confirmation">{confirmation}</p>}
      </div>
    </div>
  );
};

export default WalletModal;