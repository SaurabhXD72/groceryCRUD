// Create file: frontend/src/pages/ProductDetails.js
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';

const ProductDetails = () => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { id } = useParams();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/products/${id}`);
        setProduct(res.data);
        setLoading(false);
      } catch (err) {
        setError('Error fetching product details');
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  if (!product) {
    return <div className="alert alert-info">Product not found</div>;
  }

  return (
    <div className="card">
      <div className="card-body">
        <h2 className="card-title">{product.name}</h2>
        <h5 className="card-subtitle mb-3 text-muted">
          Price: ${product.price}
        </h5>
        <p className="card-text">{product.description}</p>
        <p>
          <strong>Added by:</strong> {product.creator_name}
        </p>
        <Link to="/" className="btn btn-primary">
          Back to Products
        </Link>
      </div>
    </div>
  );
};

export default ProductDetails;
