import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ProductItem from "./ProductItem";
import ProductForm from "./ProductForm";
import { getAuthHeaders } from "../utils/auth";
import { Pagination } from "antd";

const ProductList = ({
  userRole,
  selectedCategory,
  searchQuery,
  refreshCartItemCount,
  onCartUpdated,
}) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  useEffect(() => {
    fetchProductsAndCategories();
  }, []);

  useEffect(() => {
    let filtered = [...products];

    if (selectedCategory) {
      filtered = filtered.filter((p) => p.categoryID === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter((p) =>
        p.productName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
    setCurrentPage(1); // Reset to first page on filter change
  }, [products, selectedCategory, searchQuery]);

  const fetchProductsAndCategories = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes] = await Promise.all([
        axios.get("https://localhost:7030/api/products", {
          headers: getAuthHeaders(),
        }),
        axios.get("https://localhost:7030/api/category", {
          headers: getAuthHeaders(),
        }),
      ]);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
      setFilteredProducts(productsRes.data);
    } catch (error) {
      toast.error("Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = (productId) => {
    const product = products.find((p) => p.productID === productId);
    if (!product) return;
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      await axios.delete(`https://localhost:7030/api/products/${productId}`, {
        headers: getAuthHeaders(),
      });
      setProducts((prev) => prev.filter((p) => p.productID !== productId));
      setFilteredProducts((prev) => prev.filter((p) => p.productID !== productId));
      toast.success("Product deleted successfully.");
    } catch (error) {
      toast.error("Failed to delete product.");
    }
  };

  const handleAddToCart = async (product) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please log in to add items to cart.");
        return;
      }

      const tokenPayload = JSON.parse(atob(token.split(".")[1]));
      const userId =
        tokenPayload[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
        ];

      await axios.post(
        "https://localhost:7030/api/CartItem",
        {
          userId: parseInt(userId),
          productId: product.productID,
          quantity: 1,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setProducts((prev) =>
        prev.map((p) =>
          p.productID === product.productID ? { ...p, quantity: p.quantity - 1 } : p
        )
      );

      setFilteredProducts((prevFiltered) =>
        prevFiltered.map((p) =>
          p.productID === product.productID ? { ...p, quantity: p.quantity - 1 } : p
        )
      );

      onCartUpdated?.();
      toast.success(`${product.productName} added to cart.`);
    } catch (error) {
      const errorMsg = error.response?.data || "Failed to add item to cart.";
      toast.error(errorMsg);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  if (loading) {
    return <div style={{ textAlign: "center", padding: "2rem", color: "#1F2937" }}>Loading...</div>;
  }

  return (
    <div className="productlist-container">
      <style>
        {`
          .productlist-container {
            width: 95%;
            max-width: 1400px;
            margin: 0 auto;
            padding: 1rem 0;
            font-family: 'Poppins', 'Helvetica', sans-serif;
          }
          .productlist-header {
            display: flex;
            justify-content: flex-start;
            align-items: center;
            gap: 16px;
            margin-bottom: 24px;
          }
          .btn-add-product {
            display: flex;
            align-items: center;
            padding: 10px 16px;
            background: #ffffff;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 500;
            color: #1f2937;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          .btn-add-product:hover {
            background: #f3f4f6;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
          }
          .section-title {
            font-size: 1.75rem;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 24px;
            text-align: left;
            position: relative;
          }
          .section-title::after {
            content: '';
            display: block;
            width: 60px;
            height: 3px;
            background: #2563eb;
            margin-top: 8px;
            border-radius: 2px;
          }
          .product-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 280px));
            gap: 24px;
            width: 100%;
            justify-content: center;
          }
          .pagination {
            display: flex;
            justify-content: center;
            margin-top: 2rem;
          }
          .pagination .ant-pagination-item,
          .pagination .ant-pagination-prev,
          .pagination .ant-pagination-next {
            border-radius: 8px;
            border: 1px solid #d1d5db;
            background: #ffffff;
            transition: all 0.3s ease;
          }
          .pagination .ant-pagination-item:hover,
          .pagination .ant-pagination-prev:hover,
          .pagination .ant-pagination-next:hover {
            background: #f3f4f6;
            border-color: #3b82f6;
          }
          .pagination .ant-pagination-item-active {
            background: #3b82f6;
            border-color: #3b82f6;
          }
          .pagination .ant-pagination-item-active a {
            color: #ffffff;
          }
          .empty-state {
            color: #6b7280;
            font-size: 1rem;
            text-align: center;
            padding: 2rem;
          }
          @media (max-width: 768px) {
            .productlist-container {
              padding: 0.5rem;
            }
            .product-grid {
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 16px;
            }
            .section-title {
              font-size: 1.5rem;
            }
          }
          @media (max-width: 480px) {
            .product-grid {
              grid-template-columns: 1fr;
              gap: 12px;
            }
            .section-title {
              font-size: 1.25rem;
            }
          }
        `}
      </style>
      <ToastContainer />
      <header className="productlist-header">
        {userRole === "SuperUser" && (
          <button
            onClick={() => {
              setShowForm((prev) => !prev);
              setEditingProduct(null);
            }}
            className="btn-add-product"
          >
            {showForm ? "Cancel" : "Add Product"}
          </button>
        )}
      </header>
      <main className="productlist-content">
        {showForm ? (
          <ProductForm
            fetchProductsAndCategories={fetchProductsAndCategories}
            editingProduct={editingProduct}
            categories={categories}
            existingProducts={products}
            onClose={handleFormClose}
          />
        ) : (
          <section className="product-section">
            <h2 className="section-title">Products</h2>
            {filteredProducts.length === 0 ? (
              <p className="empty-state">No products to display.</p>
            ) : (
              <>
                <div className="product-grid">
                  {paginatedProducts.map((product) => (
                    <ProductItem
                      key={product.productID}
                      product={product}
                      userRole={userRole}
                      handleEditProduct={handleEditProduct}
                      handleDeleteProduct={handleDeleteProduct}
                      handleAddToCart={handleAddToCart}
                      refreshCartItemCount={refreshCartItemCount}
                    />
                  ))}
                </div>
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={filteredProducts.length}
                  onChange={handlePageChange}
                  className="pagination"
                />
              </>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default ProductList;