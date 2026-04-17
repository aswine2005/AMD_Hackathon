import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Form, Button, Table, 
  Modal, Alert, Spinner, Badge, Tabs, Tab
} from 'react-bootstrap';
import { 
  FaPlus, FaUpload, FaTrash, FaEdit, FaDownload, 
  FaChartLine, FaStore, FaExchangeAlt, FaSave
} from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import Papa from 'papaparse';
import config from '../config';

const CategoryManagement = () => {
  // State variables
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    engagementScore: 0,
    averageDwellTime: 0,
    interestRate: 100,
    crowdDensity: 0,
    averageVisitors: 0,
    rackNumber: '',
    locationInStore: 'middle'
  });
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch all categories
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${config.apiBaseUrl}/api/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for numeric fields
    if (name === 'name' || name === 'description' || name === 'locationInStore' || name === 'rackNumber') {
      // Text fields - keep as is
      setFormData({
        ...formData,
        [name]: value
      });
    } else {
      // Numeric fields - allow empty strings during editing, only convert to number on submission
      setFormData({
        ...formData,
        [name]: value === '' ? '' : isNaN(parseFloat(value)) ? 0 : parseFloat(value)
      });
    }
  };

  // Create new category
  const createCategory = async () => {
    try {
      const response = await axios.post(`${config.apiBaseUrl}/api/categories`, formData);
      toast.success('Category created successfully');
      setCategories([...categories, response.data]);
      resetForm();
      setShowAddModal(false);
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Failed to create category');
    }
  };

  // Update existing category
  const updateCategory = async () => {
    try {
      // Ensure all numeric fields are properly formatted before sending
      const formattedData = {
        ...formData,
        engagementScore: formData.engagementScore === '' ? 0 : parseFloat(formData.engagementScore),
        averageDwellTime: formData.averageDwellTime === '' ? 0 : parseFloat(formData.averageDwellTime),
        interestRate: formData.interestRate === '' ? 100 : parseFloat(formData.interestRate),
        crowdDensity: formData.crowdDensity === '' ? 0 : parseFloat(formData.crowdDensity),
        averageVisitors: formData.averageVisitors === '' ? 0 : parseFloat(formData.averageVisitors)
      };
      
      // Using PATCH instead of PUT to match the backend route
      const response = await axios.patch(`${config.apiBaseUrl}/api/categories/${selectedCategory._id}`, formattedData);
      
      // Update the category in the local state to reflect changes immediately
      const updatedCategories = categories.map(cat => 
        cat._id === selectedCategory._id ? response.data : cat
      );
      setCategories(updatedCategories);
      
      // Force a refresh to ensure the latest data is shown
      fetchCategories();
      
      toast.success('Category updated successfully');
      resetForm();
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error(`Failed to update category: ${error.response?.data?.message || error.message}`);
    }
  };

  // Delete category
  const deleteCategory = async () => {
    try {
      await axios.delete(`${config.apiBaseUrl}/api/categories/${selectedCategory._id}`);
      setCategories(categories.filter(cat => cat._id !== selectedCategory._id));
      toast.success('Category deleted successfully');
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      engagementScore: 0,
      averageDwellTime: 0,
      interestRate: 100,
      crowdDensity: 0,
      averageVisitors: 0,
      rackNumber: '',
      locationInStore: 'middle'
    });
    setSelectedCategory(null);
  };

  // Handle edit category
  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      engagementScore: category.engagementScore || 0,
      averageDwellTime: category.averageDwellTime || 0,
      interestRate: category.interestRate || 100,
      crowdDensity: category.crowdDensity || 0,
      averageVisitors: category.averageVisitors || 0,
      rackNumber: category.rackNumber || '',
      locationInStore: category.locationInStore || 'middle'
    });
    setShowEditModal(true);
  };

  // Handle delete category
  const handleDeleteCategory = (category) => {
    setSelectedCategory(category);
    setShowDeleteModal(true);
  };

  // Handle CSV file input
  const handleFileChange = (e) => {
    setCsvFile(e.target.files[0]);
  };

  // Upload and process CSV file
  const uploadCsvFile = () => {
    if (!csvFile) {
      toast.warn('Please select a CSV file first');
      return;
    }

    setUploadStatus('Uploading...');
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const csvData = event.target.result;
        
        // Parse CSV data
        Papa.parse(csvData, {
          header: true,
          complete: async (results) => {
            const { data } = results;
            
            if (!data || data.length === 0) {
              setUploadStatus('Error: No data found in CSV');
              return;
            }

            setUploadStatus(`Processing ${data.length} categories...`);
            
            // Process and upload each category
            let successCount = 0;
            let errorCount = 0;
            
            for (const category of data) {
              try {
                // Format data properly
                const categoryData = {
                  name: category.name?.trim(),
                  description: category.description?.trim() || '',
                  engagementScore: parseFloat(category.engagementScore) || 0,
                  averageDwellTime: parseFloat(category.averageDwellTime) || 0,
                  interestRate: parseFloat(category.interestRate) || 100,
                  crowdDensity: parseFloat(category.crowdDensity) || 0,
                  averageVisitors: parseFloat(category.averageVisitors) || 0,
                  rackNumber: category.rackNumber?.trim() || '',
                  locationInStore: category.locationInStore?.trim() || 'middle'
                };
                
                if (!categoryData.name) {
                  errorCount++;
                  continue;
                }
                
                // Check if category already exists
                const existingCategory = categories.find(cat => 
                  cat.name.toLowerCase() === categoryData.name.toLowerCase()
                );
                
                if (existingCategory) {
                  // Update existing category
                  await axios.put(`${config.apiBaseUrl}/api/categories/${existingCategory._id}`, categoryData);
                } else {
                  // Create new category
                  await axios.post(`${config.apiBaseUrl}/api/categories`, categoryData);
                }
                
                successCount++;
              } catch (error) {
                console.error('Error processing category:', error);
                errorCount++;
              }
            }
            
            // Refresh categories list
            fetchCategories();
            
            setUploadStatus(`Import complete: ${successCount} successful, ${errorCount} failed`);
            toast.success(`Categories imported: ${successCount} successful, ${errorCount} failed`);
            setCsvFile(null);
          },
          error: (error) => {
            console.error('CSV parsing error:', error);
            setUploadStatus('Error parsing CSV');
            toast.error('Failed to parse CSV file');
          }
        });
      } catch (error) {
        console.error('Error reading CSV file:', error);
        setUploadStatus('Error reading file');
        toast.error('Failed to read CSV file');
      }
    };
    
    reader.readAsText(csvFile);
  };

  // Download sample CSV template
  const downloadCsvTemplate = () => {
    const headers = [
      'name', 'description', 'engagementScore', 'averageDwellTime', 
      'interestRate', 'crowdDensity', 'averageVisitors', 
      'rackNumber', 'locationInStore'
    ];
    
    const sampleData = [
      {
        name: 'Electronics',
        description: 'Electronic items and gadgets',
        engagementScore: 85,
        averageDwellTime: 7,
        interestRate: 95,
        crowdDensity: 8,
        averageVisitors: 120,
        rackNumber: 'R12',
        locationInStore: 'front'
      },
      {
        name: 'Clothing',
        description: 'Fashion and apparel',
        engagementScore: 78,
        averageDwellTime: 5,
        interestRate: 90,
        crowdDensity: 6,
        averageVisitors: 150,
        rackNumber: 'R05',
        locationInStore: 'middle'
      }
    ];
    
    // Convert to CSV
    const csv = Papa.unparse({
      fields: headers,
      data: sampleData
    });
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'category_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Container fluid className="py-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Row className="align-items-center mb-4">
          <Col>
            <h2><FaStore className="me-2" /> Category Management</h2>
          </Col>
          <Col xs="auto">
            <Button 
              variant="primary" 
              className="me-2"
              onClick={() => setShowAddModal(true)}
            >
              <FaPlus className="me-1" /> Add Category
            </Button>
            <Button 
              variant="success" 
              onClick={downloadCsvTemplate}
            >
              <FaDownload className="me-1" /> CSV Template
            </Button>
          </Col>
        </Row>

        <Card className="shadow-sm mb-4">
          <Card.Header className="bg-light">
            <h5 className="mb-0">Import Categories</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Upload CSV File</Form.Label>
                  <div className="d-flex">
                    <Form.Control 
                      type="file" 
                      accept=".csv" 
                      onChange={handleFileChange}
                      className="me-2"
                    />
                    <Button 
                      variant="primary" 
                      onClick={uploadCsvFile}
                      disabled={!csvFile}
                    >
                      <FaUpload className="me-1" /> Upload
                    </Button>
                  </div>
                  <Form.Text className="text-muted">
                    Upload a CSV file with category data. Download the template for the correct format.
                  </Form.Text>
                </Form.Group>
                {uploadStatus && (
                  <Alert variant="info" className="mt-2">
                    {uploadStatus}
                  </Alert>
                )}
              </Col>
              <Col md={6}>
                <h6>CSV Format Instructions</h6>
                <ul className="small">
                  <li>First row must contain column headers</li>
                  <li>Required fields: <code>name</code></li>
                  <li>Optional fields: <code>description, engagementScore, averageDwellTime, interestRate, crowdDensity, averageVisitors, rackNumber, locationInStore</code></li>
                  <li>locationInStore values: 'front', 'middle', 'back', 'entrance', 'checkout'</li>
                </ul>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card className="shadow-sm">
          <Card.Header className="bg-light d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Categories ({categories.length})</h5>
            <div>
              {loading && <Spinner size="sm" animation="border" className="me-2" />}
              <Button 
                variant="outline-secondary" 
                size="sm" 
                onClick={fetchCategories}
                disabled={loading}
              >
                Refresh
              </Button>
            </div>
          </Card.Header>
          <Card.Body className="p-0">
            <Table hover responsive className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Engagement</th>
                  <th>Location</th>
                  <th>Metrics</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      {loading ? (
                        <Spinner animation="border" size="sm" />
                      ) : (
                        "No categories found. Add your first category."
                      )}
                    </td>
                  </tr>
                ) : (
                  categories.map(category => (
                    <tr key={category._id}>
                      <td>
                        <strong>{category.name}</strong>
                        {category.rackNumber && (
                          <Badge bg="info" className="ms-2">
                            Rack: {category.rackNumber}
                          </Badge>
                        )}
                      </td>
                      <td className="text-muted small">
                        {category.description || '-'}
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div style={{ width: 40 }} className="me-2">
                            {category.engagementScore || 0}%
                          </div>
                          <div className="flex-grow-1" style={{ height: 5 }}>
                            <div 
                              className={`bg-${
                                (category.engagementScore || 0) > 70 ? 'success' : 
                                (category.engagementScore || 0) > 40 ? 'warning' : 'danger'
                              }`}
                              style={{ 
                                width: `${category.engagementScore || 0}%`,
                                height: '100%',
                                borderRadius: 5
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge 
                          bg={
                            category.locationInStore === 'front' || category.locationInStore === 'entrance' 
                              ? 'success' 
                              : category.locationInStore === 'middle' ? 'primary' : 'secondary'
                          }
                        >
                          {category.locationInStore || 'middle'}
                        </Badge>
                      </td>
                      <td className="small">
                        <div>Dwell time: {category.averageDwellTime || 0} min</div>
                        <div>Visitors: {category.averageVisitors || 0}/day</div>
                      </td>
                      <td>
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          className="me-1"
                          onClick={() => handleEditCategory(category)}
                        >
                          <FaEdit />
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => handleDeleteCategory(category)}
                        >
                          <FaTrash />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </motion.div>

      {/* Add Category Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Category</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Name *</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={2}
                    name="description" 
                    value={formData.description} 
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Rack Number</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="rackNumber" 
                    value={formData.rackNumber} 
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Location in Store</Form.Label>
                  <Form.Select 
                    name="locationInStore" 
                    value={formData.locationInStore} 
                    onChange={handleInputChange}
                  >
                    <option value="front">Front</option>
                    <option value="middle">Middle</option>
                    <option value="back">Back</option>
                    <option value="entrance">Entrance</option>
                    <option value="checkout">Checkout</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Engagement Score (0-100)</Form.Label>
                  <Form.Control 
                    type="number" 
                    min="0" 
                    max="100" 
                    name="engagementScore" 
                    value={formData.engagementScore} 
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Average Dwell Time (minutes)</Form.Label>
                  <Form.Control 
                    type="number" 
                    min="0" 
                    name="averageDwellTime" 
                    value={formData.averageDwellTime} 
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Interest Rate (0-100)</Form.Label>
                  <Form.Control 
                    type="number" 
                    min="0" 
                    max="100" 
                    name="interestRate" 
                    value={formData.interestRate} 
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Crowd Density (0-10)</Form.Label>
                  <Form.Control 
                    type="number" 
                    min="0" 
                    max="10" 
                    name="crowdDensity" 
                    value={formData.crowdDensity} 
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Average Visitors (per day)</Form.Label>
                  <Form.Control 
                    type="number" 
                    min="0" 
                    name="averageVisitors" 
                    value={formData.averageVisitors} 
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={createCategory}>
            <FaSave className="me-1" /> Save Category
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Category Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Category</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Name *</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={2}
                    name="description" 
                    value={formData.description} 
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Rack Number</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="rackNumber" 
                    value={formData.rackNumber} 
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Location in Store</Form.Label>
                  <Form.Select 
                    name="locationInStore" 
                    value={formData.locationInStore} 
                    onChange={handleInputChange}
                  >
                    <option value="front">Front</option>
                    <option value="middle">Middle</option>
                    <option value="back">Back</option>
                    <option value="entrance">Entrance</option>
                    <option value="checkout">Checkout</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Engagement Score (0-100)</Form.Label>
                  <Form.Control 
                    type="number" 
                    min="0" 
                    max="100" 
                    name="engagementScore" 
                    value={formData.engagementScore} 
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Average Dwell Time (minutes)</Form.Label>
                  <Form.Control 
                    type="number" 
                    min="0" 
                    name="averageDwellTime" 
                    value={formData.averageDwellTime} 
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Interest Rate (0-100)</Form.Label>
                  <Form.Control 
                    type="number" 
                    min="0" 
                    max="100" 
                    name="interestRate" 
                    value={formData.interestRate} 
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Crowd Density (0-10)</Form.Label>
                  <Form.Control 
                    type="number" 
                    min="0" 
                    max="10" 
                    name="crowdDensity" 
                    value={formData.crowdDensity} 
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Average Visitors (per day)</Form.Label>
                  <Form.Control 
                    type="number" 
                    min="0" 
                    name="averageVisitors" 
                    value={formData.averageVisitors} 
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={updateCategory}>
            <FaSave className="me-1" /> Update Category
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Category Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Category</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete the category <strong>{selectedCategory?.name}</strong>?</p>
          <Alert variant="warning">
            This action cannot be undone. All products in this category will need to be reassigned.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={deleteCategory}>
            <FaTrash className="me-1" /> Delete Category
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default CategoryManagement;
