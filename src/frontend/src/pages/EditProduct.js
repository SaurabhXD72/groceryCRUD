// Create file: frontend/src/pages/EditProduct.js
import React, { useState, useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import axios from 'axios';

const EditProduct = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const history = useHistory();
  const { id } = useParams();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/products/${id}`);
        const { name, description, price, image_url } = res.data;

        setFormData({
          name: name || '',
          description: description || '',
          price: price || '',
          image_url: image_url || '',
        });

        setLoading(false);
      } catch (err) {
        setError('Error fetching product details');
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

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
      await axios.put(`http://localhost:5000/api/products/${id}`, productData);
      history.push('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating product');
    }
  };

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  return (
    <div className="card">
      <div className="card-body">
        <h2 className="card-title mb-4">Edit Product</h2>
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
            Update Product
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditProduct;
