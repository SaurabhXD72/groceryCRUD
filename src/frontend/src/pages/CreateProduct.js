// Create file: frontend/src/pages/CreateProduct.js
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';

const CreateProduct = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
  });
  const [error, setError] = useState('');
  const history = useHistory();

  const { name, description, price, image_url } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    // Validate price as a number
    if (isNaN(parseFloat(price))) {
      setError('Price must be a valid number');
      return;
    }

    // Create product data object
    const productData = {
      name,
      description,
      price: parseFloat(price),
      image_url,
    };

    try {
      await axios.post('http://localhost:5000/api/products', productData);
      history.push('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating product');
    }
  };

  return (
    <div className="card">
      <div className="card-body">
        <h2 className="card-title mb-4">Add New Product</h2>
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label>Product Name</label>
            <input
              type="text"
              className="form-control"
              name="name"
              value={name}
              onChange={onChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              className="form-control"
              name="description"
              value={description}
              onChange={onChange}
              rows="4"
            ></textarea>
          </div>

          <div className="form-group">
            <label>Price</label>
            <input
              type="text"
              className="form-control"
              name="price"
              value={price}
              onChange={onChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Image URL</label>
            <input
              type="text"
              className="form-control"
              name="image_url"
              value={image_url}
              onChange={onChange}
            />
          </div>

          <button type="submit" className="btn btn-primary">
            Create Product
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateProduct;
