import React, { useState } from 'react';
import WalletModal from '../components/WalletModal';
import useHomePageData from '../hooks/useHomePageData';
import './Wallet.css';

const WalletTab = () => {
  const { accountBalance, walletId, fetchWallet } = useHomePageData();
  const [showModal, setShowModal] = useState(false);

  const handleFundSuccess = (newAmount, walletIdFunded, userRole) => {
    if (userRole !== 'SuperUser' || walletId === walletIdFunded) {
      fetchWallet(); // Refresh balance for own wallet
    }
    setShowModal(false);
  };

  return (
    <div className="wallet-tab-container">
      <button onClick={() => setShowModal(true)} className="wallet-button">
        Wallet: R{(accountBalance || 0).toFixed(2)}
      </button>
      {showModal && (
        <WalletModal
          onClose={() => setShowModal(false)}
          onSuccess={handleFundSuccess}
          walletID={walletId}
        />
      )}
    </div>
  );
};

export default WalletTab;