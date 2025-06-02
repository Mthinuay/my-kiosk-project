import React from "react";
import { FaShoppingCart } from "react-icons/fa";

const formatProductName = (name, max = 40) => {
  const titleCase = name.replace(/\b\w/g, (char) => char.toUpperCase());
  return titleCase.length > max ? titleCase.slice(0, max) + "..." : titleCase;
};

const ProductItem = ({
  product,
  userRole = "",
  handleEditProduct,
  handleDeleteProduct,
  handleAddToCart,
  refreshCartItemCount,
}) => {
  // If not SuperUser and product is unavailable, hide it
  if (userRole !== "SuperUser" && (!product.isAvailable || product.quantity <= 0)) {
    return null;
  }

  // Determine availability based on quantity
  const isOutOfStock = product.quantity <= 0;
  const canAddToCart = product.isAvailable && !isOutOfStock;

  return (
    <div style={styles.card}>
      <img
        src={`https://localhost:7030${product.imagePath}`}
        alt={product.productName}
        style={styles.image}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = "https://via.placeholder.com/280x160?text=Product";
        }}
      />
      <div style={styles.info}>
        <h3 style={styles.productName}>{formatProductName(product.productName)}</h3>
        <p style={styles.description}>{product.description}</p>
        <p style={styles.price}>
          R
          {parseFloat(product.price).toLocaleString("en-ZA", {
            minimumFractionDigits: 2,
          })}
        </p>
        <p style={styles.detail}>
          <strong>Quantity:</strong> {product.quantity ?? 0}
        </p>
        {userRole === "SuperUser" && (
          <p style={styles.detail}>
            <strong>Status:</strong>{" "}
            <span
              style={{
                color: isOutOfStock ? "#EF4444" : product.isAvailable ? "#10B981" : "#EF4444",
              }}
            >
              {isOutOfStock ? "Out of Stock" : product.isAvailable ? "Available" : "Unavailable"}
            </span>
          </p>
        )}
      </div>
      <div style={styles.actions}>
        {userRole === "SuperUser" ? (
          <>
            <button
              onClick={() => handleEditProduct(product.productID)}
              style={{ ...styles.button, ...styles.editButton }}
            >
              Edit
            </button>
            <button
              onClick={() => handleDeleteProduct(product.productID)}
              style={{ ...styles.button, ...styles.deleteButton }}
            >
              Delete
            </button>
          </>
        ) : (
          <button
            onClick={async () => {
              await handleAddToCart(product);
              if (refreshCartItemCount) refreshCartItemCount();
            }}
            style={{
              ...styles.button,
              ...styles.cartButton,
              backgroundColor: canAddToCart ? "#ffffff" : "#f3f4f6",
              color: canAddToCart ? "#1f2937" : "#9ca3af",
              cursor: canAddToCart ? "pointer" : "not-allowed",
            }}
            disabled={!canAddToCart}
          >
            <FaShoppingCart style={{ marginRight: "8px", color: canAddToCart ? "#10B981" : "#9ca3af" }} />
            {isOutOfStock ? "Out of Stock" : "Add to Cart"}
          </button>
        )}
      </div>
    </div>
  );
};

const styles = {
  card: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "16px",
    backgroundColor: "#ffffff",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    width: "100%",
    minHeight: "400px",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    fontFamily: "'Poppins', 'Helvetica', sans-serif",
  },
  image: {
    width: "100%",
    height: "160px",
    objectFit: "cover",
    borderRadius: "8px",
    marginBottom: "12px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
  },
  info: {
    flexGrow: 1,
    marginBottom: "12px",
  },
  productName: {
    fontSize: "1.25rem",
    fontWeight: 600,
    color: "#1f2937",
    marginBottom: "8px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  description: {
    fontSize: "0.875rem",
    color: "#6b7280",
    marginBottom: "8px",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  price: {
    fontSize: "1.125rem",
    fontWeight: 600,
    color: "#10b981",
    marginBottom: "8px",
  },
  detail: {
    fontSize: "0.875rem",
    color: "#4b5563",
    marginBottom: "4px",
  },
  actions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginTop: "auto",
  },
  button: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 16px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "0.875rem",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    backgroundColor: "#ffffff",
    color: "#1f2937",
  },
  cartButton: {
    width: "100%",
  },
  editButton: {
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    border: "none",
  },
  deleteButton: {
    backgroundColor: "#ef4444",
    color: "#ffffff",
    border: "none",
  },
};

export default ProductItem;