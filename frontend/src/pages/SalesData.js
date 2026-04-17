import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, Alert, Tab, Tabs, Modal, InputGroup, Spinner } from 'react-bootstrap';
import { FaUpload, FaDownload, FaPlus, FaTrash, FaCloudSun, FaLocationArrow } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import Papa from 'papaparse';
import config from '../config';

const SalesData = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentSalesDataEntry, setCurrentSalesDataEntry] = useState(null);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockProduct, setRestockProduct] = useState(null);
  const [restockQuantity, setRestockQuantity] = useState(10);
  const [showImportResultsModal, setShowImportResultsModal] = useState(false);
  const [importResults, setImportResults] = useState({
    success: [],
    errors: [],
    stockErrors: []
  });
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [sampleDays, setSampleDays] = useState(60);
  const [generatingSample, setGeneratingSample] = useState(false);

  // Form data for manual entry
  const [formData, setFormData] = useState({
    productId: '',
    date: new Date().toISOString().split('T')[0],
    quantity: 1,
    temperature: 30,
    rainfall: 0,
    isWeekend: false,
    isFestival: false
  });

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch products whenever a product is selected to view its sales data
  useEffect(() => {
    if (selectedProduct) {
      fetchSalesData(selectedProduct);
    }
  }, [selectedProduct]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${config.apiBaseUrl}/api/categories`);
      setCategories(response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      toast.error('Failed to load categories');
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${config.apiBaseUrl}/api/products`);
      setProducts(response.data);
      
      // Set default product selection if available
      if (response.data.length > 0 && !selectedProduct) {
        setSelectedProduct(response.data[0]._id);
        setFormData(prev => ({
          ...prev,
          productId: response.data[0]._id
        }));
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      toast.error('Failed to load products');
    }
  };

  const fetchSalesData = async (productId) => {
    if (!productId) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`${config.apiBaseUrl}/api/sales-data/product/${productId}`);
      setSalesData(response.data);
    } catch (err) {
      console.error('Error fetching sales data:', err);
      toast.error('Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : 
              (type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value)
    });
  };
  
  // Function to get current weather data
  const fetchCurrentWeather = async () => {
    setWeatherLoading(true);
    try {
      // Try to get user's current location
      if (!userLocation) {
        await getUserLocation();
      }
      
      // If we have a location, fetch weather data
      if (userLocation) {
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${userLocation.lat}&lon=${userLocation.lng}&appid=8d2de98e089f1c28e1a22fc19a24ef04&units=metric`);
        
        if (response.data) {
          const weatherData = {
            temperature: response.data.main.temp,
            rainfall: response.data.rain ? (response.data.rain['1h'] || 0) : 0,
          };
          
          // Update form with weather data
          setFormData(prev => ({
            ...prev,
            temperature: weatherData.temperature,
            rainfall: weatherData.rainfall
          }));
          
          toast.success('Current weather data loaded!');
        }
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
      toast.error('Failed to fetch current weather. Please enter manually.');
    } finally {
      setWeatherLoading(false);
    }
  };
  
  // Get user's location
  const getUserLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        toast.error('Geolocation is not supported by your browser');
        reject('Geolocation not supported');
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          resolve(location);
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Could not get your location. Please enter weather data manually.');
          reject(error);
        }
      );
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Get day of week to check if it's a weekend
      const date = new Date(formData.date);
      const dayOfWeek = date.getDay(); // 0 is Sunday, 6 is Saturday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      const salesEntry = {
        ...formData,
        isWeekend, // Auto-detect weekend based on date
        weather: {
          temperature: formData.temperature,
          rainfall: formData.rainfall
        }
      };

      await axios.post(`${config.apiBaseUrl}/api/sales-data`, salesEntry);
      
      toast.success('Sales data added successfully');
      
      // Reset quantity but keep other form fields
      setFormData({
        ...formData,
        quantity: 1
      });
      
      // Refresh sales data
      fetchSalesData(selectedProduct);
    } catch (err) {
      console.error('Error adding sales data:', err);
      toast.error(err.response?.data?.message || 'Failed to add sales data');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setFileUploading(true);
    
    try {
      // Parse CSV file
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          if (results.data.length === 0) {
            toast.error('CSV file is empty');
            setFileUploading(false);
            return;
          }
          
          // Create form data for file upload
          const formData = new FormData();
          formData.append('file', file);
          
          try {
            const response = await axios.post(`${config.apiBaseUrl}/api/sales-data/import`, formData, {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            });
            
            // Check if there were any errors during import
            if (response.data.errors && response.data.errors.length > 0) {
              const stockErrors = response.data.errors.filter(err => 
                err.error && err.error.includes("stock"));
                
              if (stockErrors.length > 0) {
                // Show stock errors and option to restock
                toast.error(`${stockErrors.length} products need restocking. Check results for details.`);
                setImportResults({
                  success: response.data.success || [],
                  errors: response.data.errors || [],
                  stockErrors: stockErrors
                });
                setShowImportResultsModal(true);
              } else {
                toast.warning(`Import completed with ${response.data.errors.length} errors. Check results for details.`);
                setImportResults({
                  success: response.data.success || [],
                  errors: response.data.errors || []
                });
                setShowImportResultsModal(true);
              }
            } else {
              toast.success(`Successfully imported ${results.data.length} sales data entries`);
            }
            
            // Refresh sales data if a product is selected
            if (selectedProduct) {
              fetchSalesData(selectedProduct);
            }
          } catch (err) {
            console.error('Error importing CSV:', err);
            
            // Handle 409 Conflict error (stock issues)
            if (err.response?.status === 409) {
              const stockData = err.response.data;
              toast.error(`Not enough stock for ${stockData.productName || 'product'}. Current stock: ${stockData.currentStock}.`);
              
              // Set the product that needs restocking
              setRestockProduct({
                productId: stockData.productId,
                productName: stockData.productName,
                currentStock: stockData.currentStock
              });
              
              // Show restock modal
              setShowRestockModal(true);
            } else {
              toast.error(err.response?.data?.message || 'Failed to import CSV file');
            }
          } finally {
            setFileUploading(false);
          }
        },
        error: (err) => {
          console.error('Error parsing CSV:', err);
          toast.error('Failed to parse CSV file');
          setFileUploading(false);
        }
      });
    } catch (err) {
      console.error('Error handling file upload:', err);
      toast.error('Failed to process file');
      setFileUploading(false);
    }
    
    // Clear the file input
    e.target.value = null;
  };

  const handleDeleteSalesData = async () => {
    try {
      await axios.delete(`/api/sales-data/${currentSalesDataEntry._id}`);
      toast.success('Sales data deleted successfully');
      setShowDeleteModal(false);
      fetchSalesData(selectedProduct);
    } catch (err) {
      console.error('Error deleting sales data:', err);
      toast.error('Failed to delete sales data');
    }
  };

  const downloadProductSampleCSV = () => {
    window.open("/api/sales-data/templates/product-template.csv", "_blank");
  };

  const downloadCategorySampleCSV = () => {
    window.open("/api/sales-data/templates/category-template.csv", "_blank");
  };

  const downloadInvalidSampleCSV = () => {
    window.open("/api/sales-data/templates/invalid-dates-template.csv", "_blank");
  };

  const handleGenerateSampleCsv = async () => {
    const targetProductId = formData.productId || selectedProduct;

    if (!targetProductId) {
      toast.info('Select a product before generating sample data');
      return;
    }

    setGeneratingSample(true);
    try {
      const response = await axios.get(
        `${config.apiBaseUrl}/api/sales-data/sample/${targetProductId}?days=${sampleDays}`,
        { responseType: 'blob' }
      );

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sales-data-${targetProductId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(`Sample CSV generated with ${sampleDays} days of data`);
    } catch (error) {
      console.error('Error generating sample CSV:', error);
      toast.error(error.response?.data?.message || 'Unable to generate sample CSV');
    } finally {
      setGeneratingSample(false);
    }
  };

  // Find product name by ID
  const getProductName = (productId) => {
    const product = products.find(p => p._id === productId);
    return product ? product.name : 'Unknown Product';
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Container className="py-4">
      <h1 className="mb-4">Sales Data Management</h1>
      
      <Tabs defaultActiveKey="view" className="mb-4">
        <Tab eventKey="view" title="View & Filter Sales Data">
          <Card>
            <Card.Body>
              <Form.Group className="mb-4">
                <Form.Label>Select Product to View Sales Data</Form.Label>
                <Form.Select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                >
                  <option value="">-- Select a Product --</option>
                  {categories.map(category => (
                    <optgroup label={category.name} key={category._id}>
                      {products
                        .filter(product => product.category._id === category._id)
                        .map(product => (
                          <option key={product._id} value={product._id}>
                            {product.name}
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </Form.Select>
              </Form.Group>
              
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3">Loading sales data...</p>
                </div>
              ) : !selectedProduct ? (
                <Alert variant="info">
                  Please select a product to view its sales data.
                </Alert>
              ) : salesData.length === 0 ? (
                <Alert variant="info">
                  No sales data available for this product. Add sales data using the form or upload a CSV file.
                </Alert>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Quantity</th>
                      <th>Temperature (°C)</th>
                      <th>Rainfall (mm)</th>
                      <th>Weekend</th>
                      <th>Festival</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesData.map(entry => (
                      <tr key={entry._id}>
                        <td>{formatDate(entry.date)}</td>
                        <td>{entry.quantity}</td>
                        <td>{entry.weather.temperature}°C</td>
                        <td>{entry.weather.rainfall} mm</td>
                        <td>{entry.isWeekend ? 'Yes' : 'No'}</td>
                        <td>{entry.isFestival ? 'Yes' : 'No'}</td>
                        <td>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => {
                              setCurrentSalesDataEntry(entry);
                              setShowDeleteModal(true);
                            }}
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
        </Tab>
        
        <Tab eventKey="add" title="Add Sales Data">
          <Row>
            <Col md={6}>
              <Card className="mb-4">
                <Card.Header as="h5">
                  <FaPlus className="me-2" />
                  Add Sales Data Manually
                </Card.Header>
                <Card.Body>
                  <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label>Product*</Form.Label>
                      <Form.Select
                        name="productId"
                        value={formData.productId}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">-- Select a Product --</option>
                        {categories.map(category => (
                          <optgroup label={category.name} key={category._id}>
                            {products
                              .filter(product => product.category._id === category._id)
                              .map(product => (
                                <option key={product._id} value={product._id}>
                                  {product.name}
                                </option>
                              ))}
                          </optgroup>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Date*</Form.Label>
                          <Form.Control
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleInputChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Quantity*</Form.Label>
                          <Form.Control
                            type="number"
                            name="quantity"
                            value={formData.quantity}
                            onChange={handleInputChange}
                            min="0"
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Temperature (°C)*</Form.Label>
                          <InputGroup>
                            <Form.Control
                              type="number"
                              name="temperature"
                              value={formData.temperature}
                              onChange={handleInputChange}
                              step="0.1"
                              required
                            />
                            <InputGroup.Text>°C</InputGroup.Text>
                          </InputGroup>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Rainfall (mm)*</Form.Label>
                          <InputGroup>
                            <Form.Control
                              type="number"
                              name="rainfall"
                              value={formData.rainfall}
                              onChange={handleInputChange}
                              step="0.1"
                              min="0"
                              required
                            />
                            <InputGroup.Text>mm</InputGroup.Text>
                          </InputGroup>
                        </Form.Group>
                      </Col>
                      <Col md={12}>
                        <Button 
                          variant="info" 
                          className="mb-3 w-100"
                          onClick={fetchCurrentWeather}
                          disabled={weatherLoading}
                        >
                          {weatherLoading ? (
                            <>
                              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                              Detecting Weather...
                            </>
                          ) : (
                            <>
                              <FaCloudSun className="me-2" /> Detect Current Weather
                            </>
                          )}
                        </Button>
                        <p className="text-muted small"><FaLocationArrow className="me-1" /> Uses your current location to fetch today's weather data</p>
                      </Col>
                    </Row>
                    
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        id="isFestival"
                        label="Is this a festival or holiday?"
                        name="isFestival"
                        checked={formData.isFestival}
                        onChange={handleInputChange}
                      />
                      <Form.Text className="text-muted">
                        Weekend status will be automatically determined based on the date.
                      </Form.Text>
                    </Form.Group>
                    
                    <Button variant="primary" type="submit">
                      Add Sales Data
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6}>
              <Card>
                <Card.Header as="h5">
                  <FaUpload className="me-2" />
                  Upload CSV File
                </Card.Header>
                <Card.Body>
                  <p>
                    You can upload a CSV file with your sales data. The file should have the following columns:
                  </p>
                  <ul>
                    <li><strong>productId:</strong> MongoDB ID of the product</li>
                    <li><strong>date:</strong> Date in YYYY-MM-DD format</li>
                    <li><strong>quantity:</strong> Number of items sold</li>
                    <li><strong>temperature:</strong> Temperature in Celsius</li>
                    <li><strong>rainfall:</strong> Rainfall in mm</li>
                    <li><strong>isWeekend:</strong> true/false or 1/0</li>
                    <li><strong>isFestival:</strong> true/false or 1/0</li>
                  </ul>
                  
                  <div className="mb-3">
                    <div className="d-flex flex-wrap gap-2">
                      <Button
                        variant="outline-primary"
                        onClick={downloadProductSampleCSV}
                        className="d-flex align-items-center"
                      >
                        <FaDownload className="me-2" />
                        Product Sample CSV
                      </Button>
                      
                      <Button
                        variant="outline-primary"
                        onClick={downloadCategorySampleCSV}
                        className="d-flex align-items-center"
                      >
                        <FaDownload className="me-2" />
                        Category Sample CSV
                      </Button>
                      
                      <Button
                        variant="outline-secondary"
                        onClick={downloadInvalidSampleCSV}
                        className="d-flex align-items-center"
                        title="Sample with invalid dates for testing validation"
                      >
                        <FaDownload className="me-2" />
                        Invalid Dates Sample
                      </Button>
                    </div>
                  </div>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Upload CSV File</Form.Label>
                    <Form.Control
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      disabled={fileUploading}
                    />
                    <Form.Text className="text-muted">
                      Only CSV files are accepted.
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Generate synthetic CSV</Form.Label>
                    <Row className="g-2">
                      <Col sm={6}>
                        <Form.Select
                          value={sampleDays}
                          onChange={(e) => setSampleDays(parseInt(e.target.value, 10) || 30)}
                        >
                          <option value={30}>Last 30 days</option>
                          <option value={60}>Last 60 days</option>
                          <option value={90}>Last 90 days</option>
                          <option value={120}>Last 120 days</option>
                        </Form.Select>
                      </Col>
                      <Col sm={6}>
                        <Button
                          variant="success"
                          className="w-100 d-flex align-items-center justify-content-center"
                          onClick={handleGenerateSampleCsv}
                          disabled={generatingSample}
                        >
                          {generatingSample ? (
                            <>
                              <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                aria-hidden="true"
                                className="me-2"
                              />
                              Preparing...
                            </>
                          ) : (
                            <>
                              <FaDownload className="me-2" />
                              Generate CSV
                            </>
                          )}
                        </Button>
                      </Col>
                    </Row>
                    <Form.Text className="text-muted">
                      Generates synthetic, ML-friendly sales history for the selected product so you can upload it immediately.
                    </Form.Text>
                  </Form.Group>
                  
                  {fileUploading && (
                    <div className="text-center py-3">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Uploading...</span>
                      </div>
                      <p className="mt-2">Uploading and processing CSV file...</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>
      </Tabs>
      
      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this sales data entry from {formatDate(currentSalesDataEntry?.date || '')}?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteSalesData}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Restock Modal */}
      <Modal
        show={showRestockModal}
        onHide={() => setShowRestockModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Restock Product</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {restockProduct && (
            <>
              <p>The product <strong>{restockProduct.productName}</strong> is low on stock. Current stock: <strong>{restockProduct.currentStock}</strong></p>
              <Form.Group className="mb-3">
                <Form.Label>Add stock quantity</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  value={restockQuantity}
                  onChange={(e) => setRestockQuantity(parseInt(e.target.value) || 1)}
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRestockModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={async () => {
              try {
                await axios.post(`/api/sales-data/product/${restockProduct.productId}/restock`, {
                  quantity: restockQuantity
                });
                toast.success(`Successfully added ${restockQuantity} items to stock`);
                setShowRestockModal(false);
                // Refresh product data
                if (selectedProduct === restockProduct.productId) {
                  fetchSalesData(selectedProduct);
                }
              } catch (error) {
                console.error('Error restocking product:', error);
                toast.error(error.response?.data?.message || 'Failed to restock product');
              }
            }}
          >
            Restock
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Import Results Modal */}
      <Modal
        show={showImportResultsModal}
        onHide={() => setShowImportResultsModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>CSV Import Results</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {importResults.success && importResults.success.length > 0 && (
            <div className="mb-4">
              <h5 className="text-success">
                Successfully imported {importResults.success.length} entries
              </h5>
            </div>
          )}
          
          {importResults.errors && importResults.errors.length > 0 && (
            <div className="mb-4">
              <h5 className="text-danger">
                Failed to import {importResults.errors.length} entries
              </h5>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                <Table striped bordered hover size="sm">
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importResults.errors.map((error, index) => (
                      <tr key={index}>
                        <td>{JSON.stringify(error.row)}</td>
                        <td className="text-danger">{error.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
          )}
          
          {importResults.stockErrors && importResults.stockErrors.length > 0 && (
            <div>
              <h5 className="text-warning">Stock Issues</h5>
              <p>The following products need to be restocked:</p>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                <Table striped bordered hover size="sm">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Current Stock</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importResults.stockErrors.map((error, index) => (
                      <tr key={index}>
                        <td>{error.productName || 'Unknown Product'}</td>
                        <td>{error.currentStock || 0}</td>
                        <td>
                          <Button
                            variant="warning"
                            size="sm"
                            onClick={() => {
                              setRestockProduct({
                                productId: error.productId,
                                productName: error.productName,
                                currentStock: error.currentStock || 0
                              });
                              setShowImportResultsModal(false);
                              setShowRestockModal(true);
                            }}
                          >
                            Restock
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowImportResultsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default SalesData;
