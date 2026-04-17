import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Alert, Badge } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaFilter } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import config from '../config';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    currentStock: 0,
    price: 0,
    unit: 'piece'
  });
  const [currentProduct, setCurrentProduct] = useState(null);
  
  // Fetch data on component mount
  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);
  
  // Fetch all products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${config.apiBaseUrl}/api/products`);
      setProducts(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again later.');
      toast.error('Error loading products');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch all categories
  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${config.apiBaseUrl}/api/categories`);
      setCategories(response.data);
      
      // Set default category for form if categories exist
      if (response.data.length > 0 && !formData.category) {
        setFormData(prev => ({
          ...prev,
          category: response.data[0]._id
        }));
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      toast.error('Error loading categories');
    }
  };
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'currentStock' || name === 'price' 
        ? parseFloat(value) 
        : value
    });
  };
  
  // Handle form submission for adding a product
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${config.apiBaseUrl}/api/products`, formData);
      toast.success('Product added successfully');
      setShowAddModal(false);
      resetForm();
      fetchProducts();
    } catch (err) {
      console.error('Error adding product:', err);
      toast.error(err.response?.data?.message || 'Failed to add product');
    }
  };
  
  // Handle form submission for editing a product
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.patch(`${config.apiBaseUrl}/api/products/${currentProduct._id}`, formData);
      toast.success('Product updated successfully');
      setShowEditModal(false);
      resetForm();
      setCurrentProduct(null);
      fetchProducts();
    } catch (err) {
      console.error('Error updating product:', err);
      toast.error(err.response?.data?.message || 'Failed to update product');
    }
  };
  
  // Handle product deletion
  const handleDelete = async () => {
    try {
      await axios.delete(`${config.apiBaseUrl}/api/products/${currentProduct._id}`);
      toast.success('Product deleted successfully');
      setShowDeleteModal(false);
      setCurrentProduct(null);
      fetchProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      toast.error(err.response?.data?.message || 'Failed to delete product');
    }
  };
  
  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      name: '',
      category: categories.length > 0 ? categories[0]._id : '',
      description: '',
      currentStock: 0,
      price: 0,
      unit: 'piece'
    });
  };
  
  // Open edit modal and populate form with product data
  const openEditModal = (product) => {
    setCurrentProduct(product);
    setFormData({
      name: product.name,
      category: product.category._id,
      description: product.description || '',
      currentStock: product.currentStock,
      price: product.price,
      unit: product.unit || 'piece'
    });
    setShowEditModal(true);
  };
  
  // Open delete confirmation modal
  const openDeleteModal = (product) => {
    setCurrentProduct(product);
    setShowDeleteModal(true);
  };
  
  // Filter products by category
  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(product => product.category._id === selectedCategory);
  
  // Modal for adding a new product
  const AddProductModal = () => (
    <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Add New Product</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleAddSubmit}>
        <Modal.Body>
          {categories.length === 0 ? (
            <Alert variant="warning">
              You need to create at least one category before adding products.
            </Alert>
          ) : (
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Product Name*</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Rice, Refrigerator"
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Category*</Form.Label>
                  <Form.Select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    {categories.map(category => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Brief description of the product"
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Current Stock*</Form.Label>
                  <Form.Control
                    type="number"
                    name="currentStock"
                    value={formData.currentStock || ''}
                    onChange={handleChange}
                    min="0"
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Price (₹)*</Form.Label>
                  <Form.Control
                    type="number"
                    name="price"
                    value={formData.price || ''}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Unit</Form.Label>
                  <Form.Select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                  >
                    <option value="piece">Piece</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="g">Gram (g)</option>
                    <option value="l">Liter (l)</option>
                    <option value="ml">Milliliter (ml)</option>
                    <option value="pack">Pack</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            type="submit"
            disabled={categories.length === 0}
          >
            Add Product
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
  
  // Modal for editing a product
  const EditProductModal = () => (
    <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Edit Product</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleEditSubmit}>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Product Name*</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Category*</Form.Label>
                <Form.Select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  {categories.map(category => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Current Stock*</Form.Label>
                <Form.Control
                  type="number"
                  name="currentStock"
                  value={formData.currentStock}
                  onChange={handleChange}
                  min="0"
                  required
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Price (₹)*</Form.Label>
                <Form.Control
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Unit</Form.Label>
                <Form.Select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                >
                  <option value="piece">Piece</option>
                  <option value="kg">Kilogram (kg)</option>
                  <option value="g">Gram (g)</option>
                  <option value="l">Liter (l)</option>
                  <option value="ml">Milliliter (ml)</option>
                  <option value="pack">Pack</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            Update Product
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
  
  // Modal for confirming product deletion
  const DeleteProductModal = () => (
    <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Confirm Deletion</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Are you sure you want to delete the product <strong>{currentProduct?.name}</strong>?
        <Alert variant="warning" className="mt-3">
          This will also delete all associated sales data for this product.
        </Alert>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleDelete}>
          Delete
        </Button>
      </Modal.Footer>
    </Modal>
  );
  
  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h1>Products</h1>
          <p>Manage products for your sales forecasting</p>
        </Col>
        <Col xs="auto">
          <Button 
            variant="primary" 
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
          >
            <FaPlus className="me-2" />
            Add Product
          </Button>
        </Col>
      </Row>
      
      {/* Category Filter */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="align-items-center">
            <Col xs={12} md="auto" className="mb-3 mb-md-0">
              <div className="d-flex align-items-center">
                <FaFilter className="me-2 text-primary" />
                <span className="fw-bold">Filter by Category:</span>
              </div>
            </Col>
            <Col>
              <Form.Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      <Card>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <Alert variant="info">
              No products found. Start by adding your first product!
            </Alert>
          ) : filteredProducts.length === 0 ? (
            <Alert variant="info">
              No products found in this category.
            </Alert>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Price (₹)</th>
                  <th>Unit</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product, index) => (
                  <tr key={product._id}>
                    <td>{index + 1}</td>
                    <td>{product.name}</td>
                    <td>
                      <Badge bg="info">{product.category.name}</Badge>
                    </td>
                    <td>{product.currentStock}</td>
                    <td>₹{product.price.toFixed(2)}</td>
                    <td>{product.unit || 'piece'}</td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => openEditModal(product)}
                      >
                        <FaEdit />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => openDeleteModal(product)}
                      >
                        <FaTrash />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
      
      {/* Modals */}
      <AddProductModal />
      <EditProductModal />
      <DeleteProductModal />
    </Container>
  );
};

export default Products;
