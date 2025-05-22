// Create file: frontend/src/pages/AdminDashboard.js
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const AdminDashboard = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchAdminProducts = async () => {
      try {
        if (user && user.id) {
          const res = await axios.get(
            `http://localhost:5000/api/products/admin/${user.id}`,
          );
          setProducts(res.data);
        }
        setLoading(false);
      } catch (err) {
        setError('Error fetching your products');
        setLoading(false);
      }
    };

    fetchAdminProducts();
  }, [user]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`http://localhost:5000/api/products/${id}`);
        setProducts(products.filter((product) => product.id !== id));
      } catch (err) {
        setError('Error deleting product');
      }
    }
  };

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  return (
    <div>
      <h1 className="mb-4">Admin Dashboard</h1>
      {error && <div className="alert alert-danger">{error}</div>}

      <Link to="/admin/products/create" className="btn btn-success mb-4">
        Add New Product
      </Link>

      <div className="card">
        <div className="card-header">Your Products</div>
        <div className="card-body">
          {products.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>${product.price}</td>
                      <td>
                        <Link
                          to={`/admin/products/edit/${product.id}`}
                          className="btn btn-sm btn-info mr-2"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="btn btn-sm btn-danger"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>You haven't created any products yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
