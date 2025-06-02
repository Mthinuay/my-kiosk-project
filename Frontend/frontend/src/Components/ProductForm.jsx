import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { getAuthHeaders } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import './ProductForm.css';

const ProductForm = ({ fetchProductsAndCategories, editingProduct, categories, existingProducts, onClose }) => {
  const [formData, setFormData] = useState({
    productName: '',
    price: '',
    description: '',
    categoryID: '',
    quantity: '',
    imageFile: null,
    isAvailable: true, // Include isAvailable in state for editing
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        productName: editingProduct.productName || '',
        price: editingProduct.price?.toString().replace('.', ',') || '',
        description: editingProduct.description || '',
        categoryID: editingProduct.categoryID || '',
        quantity: editingProduct.quantity !== undefined ? editingProduct.quantity : 0,
        imageFile: null,
        isAvailable: editingProduct.isAvailable !== undefined ? editingProduct.isAvailable : true,
      });
    } else {
      handleReset();
    }
  }, [editingProduct]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = () => {
    setFormData((prev) => ({ ...prev, isAvailable: !prev.isAvailable }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        toast.error('Invalid file type. Please upload a JPEG or PNG image.');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size exceeds 2MB.');
        return;
      }
      setFormData((prev) => ({ ...prev, imageFile: file }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { productName, price, description, categoryID, quantity, imageFile, isAvailable } = formData;

    if (!productName || !price || !description || !categoryID || quantity === '') {
      toast.error('Please fill in all required fields.');
      return;
    }

    // Validate quantity (allow 0)
    if (isNaN(quantity) || quantity < 0) {
      toast.error('Please enter a valid quantity.');
      return;
    }

    const trimmedName = formData.productName.trim().toLowerCase();
    const isDuplicate = existingProducts.some((p) =>
      p.productName.trim().toLowerCase() === trimmedName &&
      (!editingProduct || p.productID !== editingProduct.productID)
    );

    if (isDuplicate) {
      toast.error('Product name already exists. Please choose a different name.');
      return;
    }

    if (!editingProduct && !imageFile) {
      toast.error('Please upload a product image.');
      return;
    }

    try {
      const data = new FormData();
      data.append('ProductName', productName);
      data.append('Price', price);
      data.append('Description', description);
      data.append('CategoryID', categoryID);
      data.append('Quantity', quantity);
      // Include isAvailable (use formData.isAvailable for edit, true for add)
      data.append('IsAvailable', editingProduct ? isAvailable : true);
      if (imageFile) {
        data.append('Image', imageFile);
      }

      if (editingProduct) {
        await axios.put(
          `https://localhost:7030/api/products/${editingProduct.productID}`,
          data,
          { headers: getAuthHeaders() }
        );
        toast.success('Product updated successfully.');
      } else {
        await axios.post('https://localhost:7030/api/products', data, {
          headers: getAuthHeaders(),
        });
        toast.success('Product added successfully.');
      }

      setTimeout(() => {
        navigate('/');
        onClose();
      }, 1000);
      window.location.reload();
    } catch (error) {
      const errors = error.response?.data?.errors;
      if (errors) {
        const messages = Object.values(errors).flat();
        messages.forEach((msg) => toast.error(msg));
      } else {
        toast.error(error.response?.data?.title || 'An error occurred');
      }
    }
  };

  const handleReset = () => {
    setFormData({
      productName: '',
      price: '',
      description: '',
      categoryID: '',
      quantity: '',
      imageFile: null,
      isAvailable: true,
    });
  };

  return (
    <div className="form-container">
      <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
      <form onSubmit={handleSubmit} className="product-form" encType="multipart/form-data">
        <div className="form-group">
          <label htmlFor="productName">Product Name</label>
          <input
            type="text"
            id="productName"
            name="productName"
            value={formData.productName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="price">Price</label>
          <input
            type="text"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="categoryID">Category</label>
          <select
            id="categoryID"
            name="categoryID"
            value={formData.categoryID}
            onChange={handleChange}
            required
          >
            <option value="">-- Select Category --</option>
            {categories?.map((cat) => (
              <option key={cat.categoryID} value={cat.categoryID}>
                {cat.categoryName}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="quantity">Quantity</label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="imageFile">Product Image</label>
          <input
            type="file"
            id="imageFile"
            name="imageFile"
            accept="image/*"
            onChange={handleFileChange}
            required={!editingProduct}
            style={{ opacity: 0, position: 'absolute', pointerEvents: 'none' }}
            ref={(ref) => (window.imageInputRef = ref)}
          />
          {formData.imageFile ? (
            <div className="image-preview" onClick={() => window.imageInputRef.click()} style={{ cursor: 'pointer' }}>
              <p>Click image to change:</p>
              <img
                src={URL.createObjectURL(formData.imageFile)}
                alt="New Preview"
                className="image-thumbnail"
              />
            </div>
          ) : editingProduct?.imagePath ? (
            <div className="image-preview" onClick={() => window.imageInputRef.click()} style={{ cursor: 'pointer' }}>
              <p>Click image to change:</p>
              <img
                src={`https://localhost:7030/${editingProduct.imagePath}`}
                alt="Current Product"
                className="image-thumbnail"
              />
            </div>
          ) : (
            <button type="button" onClick={() => window.imageInputRef.click()}>
              Upload Image
            </button>
          )}
        </div>
        {editingProduct && (
          <div className="form-group availability-toggle">
            <label htmlFor="isAvailable">Available</label>
            <div className="checkbox-container"></div>
            <input
              type="checkbox"
              id="isAvailable"
              name="isAvailable"
              checked={formData.isAvailable}
              onChange={handleCheckboxChange}
            />
            <span>{formData.isAvailable ? "Yes" : "No"}</span>
          </div>
        )}
        <div className="button-group">
          <button type="submit">{editingProduct ? 'Update' : 'Submit'}</button>
          <button type="button" onClick={handleReset}>
            Reset
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;