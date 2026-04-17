import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Alert } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import config from '../config';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [currentCategory, setCurrentCategory] = useState(null);
  
  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);
  
  // Fetch all categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${config.apiBaseUrl}/api/categories`);
      setCategories(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories. Please try again later.');
      toast.error('Error loading categories');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle form input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  // Handle form submission for adding a category
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${config.apiBaseUrl}/api/categories`, formData);
      toast.success('Category added successfully');
      setShowAddModal(false);
      setFormData({ name: '', description: '' });
      fetchCategories();
    } catch (err) {
      console.error('Error adding category:', err);
      toast.error(err.response?.data?.message || 'Failed to add category');
    }
  };
  
  // Handle form submission for editing a category
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.patch(`${config.apiBaseUrl}/api/categories/${currentCategory._id}`, formData);
      toast.success('Category updated successfully');
      setShowEditModal(false);
      setFormData({ name: '', description: '' });
      setCurrentCategory(null);
      fetchCategories();
    } catch (err) {
      console.error('Error updating category:', err);
      toast.error(err.response?.data?.message || 'Failed to update category');
    }
  };
  
  // Handle category deletion
  const handleDelete = async () => {
    try {
      await axios.delete(`${config.apiBaseUrl}/api/categories/${currentCategory._id}`);
      toast.success('Category deleted successfully');
      setShowDeleteModal(false);
      setCurrentCategory(null);
      fetchCategories();
    } catch (err) {
      console.error('Error deleting category:', err);
      toast.error(err.response?.data?.message || 'Failed to delete category');
    }
  };
  
  // Open edit modal and populate form with category data
  const openEditModal = (category) => {
    setCurrentCategory(category);
    setFormData({
      name: category.name,
      description: category.description || ''
    });
    setShowEditModal(true);
  };
  
  // Open delete confirmation modal
  const openDeleteModal = (category) => {
    setCurrentCategory(category);
    setShowDeleteModal(true);
  };
  
  // Modal for adding a new category
  const AddCategoryModal = () => (
    <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Add New Category</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleAddSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Category Name*</Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Snacks, Appliances, Food Grains"
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief description of the category"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            Add Category
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
  
  // Modal for editing a category
  const EditCategoryModal = () => (
    <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Edit Category</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleEditSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Category Name*</Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
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
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            Update Category
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
  
  // Modal for confirming category deletion
  const DeleteCategoryModal = () => (
    <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Confirm Deletion</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Are you sure you want to delete the category <strong>{currentCategory?.name}</strong>?
        <Alert variant="warning" className="mt-3">
          Note: You cannot delete a category that has products. You must first delete or reassign those products.
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
          <h1>Categories</h1>
          <p>Manage product categories for your sales forecasting</p>
        </Col>
        <Col xs="auto">
          <Button 
            variant="primary" 
            onClick={() => {
              setFormData({ name: '', description: '' });
              setShowAddModal(true);
            }}
          >
            <FaPlus className="me-2" />
            Add Category
          </Button>
        </Col>
      </Row>
      
      <Card>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Loading categories...</p>
            </div>
          ) : categories.length === 0 ? (
            <Alert variant="info">
              No categories found. Start by adding your first category!
            </Alert>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category, index) => (
                  <tr key={category._id}>
                    <td>{index + 1}</td>
                    <td>{category.name}</td>
                    <td>{category.description || '-'}</td>
                    <td>{new Date(category.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => openEditModal(category)}
                      >
                        <FaEdit />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => openDeleteModal(category)}
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
      <AddCategoryModal />
      <EditCategoryModal />
      <DeleteCategoryModal />
    </Container>
  );
};

export default Categories;
