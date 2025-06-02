import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProductList from './components/ProductList';
import AuthCard from './Components/AuthCard';
import HomePage from './pages/HomePage';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'antd/dist/reset.css'; // for Ant Design v5+
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        {/* Toast notifications */}
        <ToastContainer position="top-right" autoClose={1000} hideProgressBar />

        <Routes>
          <Route path="/login" element={<AuthCard />} />

          <Route
            path="/product-list"
            element={
              <>
                <h1 className="page-title">Welcome to the Kiosk Management System</h1>
                <ProductList />
              </>
            }
          />

          <Route path="/" element={<HomePage />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
