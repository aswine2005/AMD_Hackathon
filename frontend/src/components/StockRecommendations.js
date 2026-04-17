import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Badge, Button, Spinner, 
  OverlayTrigger, Tooltip, Row, Col, Alert
} from 'react-bootstrap';
import { 
  FaBoxes, FaExclamationTriangle, FaArrowUp, 
  FaArrowDown, FaEquals, FaTruck, FaInfoCircle,
  FaChartLine
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import axios from 'axios';
import { format, addDays } from 'date-fns';

const StockRecommendations = ({ productForecast, selectedProduct }) => {
  const [loading, setLoading] = useState(false);
  const [stockInfo, setStockInfo] = useState(null);
  const [expanded, setExpanded] = useState(false);
  
  useEffect(() => {
    if (productForecast && selectedProduct) {
      generateStockRecommendations();
    }
  }, [productForecast, selectedProduct]);
  
  const generateStockRecommendations = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would make a backend call to get detailed stock recommendations
      // For now, we'll simulate this with the forecast data we have
      
      // First get the product details including current stock
      const response = await axios.get(`/api/products/${selectedProduct}`);
      const product = response.data;
      
      // Create recommendations based on forecasted sales and current stock
      const currentStock = product.currentStock || 0;
      const totalForecastedSales = productForecast.reduce((sum, day) => sum + day.predictedQuantity, 0);
      const avgDailySales = totalForecastedSales / productForecast.length;
      const daysUntilStockout = Math.floor(currentStock / avgDailySales);
      
      // Calculate reorder point based on lead time and safety stock
      const leadTime = product.leadTime || 3; // Default 3 days if not specified
      const safetyStock = Math.ceil(avgDailySales * 2); // 2 days of safety stock
      const reorderPoint = Math.ceil(avgDailySales * leadTime) + safetyStock;
      
      // Economic order quantity calculation
      // Using simplified EOQ formula: sqrt(2*D*S/H)
      // D = annual demand, S = ordering cost, H = holding cost percentage
      const annualDemand = avgDailySales * 365;
      const orderingCost = 200; // Assumed fixed cost per order
      const holdingCostPercentage = 0.2; // 20% of unit cost
      const holdingCost = (product.price || 100) * holdingCostPercentage;
      const eoq = Math.ceil(Math.sqrt((2 * annualDemand * orderingCost) / holdingCost));
      
      // Next restock date recommendation
      const restockDate = daysUntilStockout > 0 ? 
        format(addDays(new Date(), daysUntilStockout - leadTime), 'yyyy-MM-dd') : 
        format(new Date(), 'yyyy-MM-dd');
      
      // Priority level
      let priority = 'low';
      if (daysUntilStockout <= leadTime) {
        priority = 'high';
      } else if (daysUntilStockout <= leadTime * 2) {
        priority = 'medium';
      }
      
      // Daily stock projections
      const stockProjection = productForecast.map((day, index) => {
        const previousDaysTotal = productForecast
          .slice(0, index)
          .reduce((sum, d) => sum + d.predictedQuantity, 0);
        
        return {
          date: day.date,
          startingStock: Math.max(0, currentStock - previousDaysTotal),
          predictedSales: day.predictedQuantity,
          endingStock: Math.max(0, currentStock - previousDaysTotal - day.predictedQuantity),
          stockStatus: currentStock - previousDaysTotal - day.predictedQuantity <= 0 ? 'stockout' : 
                      currentStock - previousDaysTotal - day.predictedQuantity <= reorderPoint ? 'reorder' : 'ok'
        };
      });
      
      setStockInfo({
        productId: selectedProduct,
        productName: product.name,
        currentStock,
        avgDailySales,
        daysUntilStockout,
        reorderPoint,
        suggestedOrderQuantity: eoq,
        restockDate,
        priority,
        stockProjection,
        leadTime
      });
    } catch (error) {
      console.error('Error generating stock recommendations:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getPriorityBadge = (priority) => {
    const colors = {
      high: 'danger',
      medium: 'warning',
      low: 'success'
    };
    
    const icons = {
      high: <FaExclamationTriangle className="me-1" />,
      medium: <FaInfoCircle className="me-1" />,
      low: <FaInfoCircle className="me-1" />
    };
    
    return (
      <Badge bg={colors[priority]}>
        {icons[priority]} {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
      </Badge>
    );
  };
  
  const getStockStatusIcon = (status) => {
    switch (status) {
      case 'stockout':
        return <FaExclamationTriangle className="text-danger" title="Stock Out" />;
      case 'reorder':
        return <FaInfoCircle className="text-warning" title="Reorder Point Reached" />;
      default:
        return <FaEquals className="text-success" title="Adequate Stock" />;
    }
  };
  
  if (loading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" variant="primary" size="sm" />
        <p className="mt-2 small">Generating stock recommendations...</p>
      </div>
    );
  }
  
  if (!stockInfo) {
    return null;
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="stock-recommendations mb-4"
    >
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <FaBoxes className="me-2" /> Stock Management Recommendations
          </h5>
          <Button 
            variant="light" 
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Show Less' : 'Show Details'}
          </Button>
        </Card.Header>
        <Card.Body>
          <Row className="mb-3">
            <Col md={6}>
              <div className="d-flex align-items-center mb-2">
                <h6 className="mb-0 me-2">Current Stock Status:</h6>
                {getPriorityBadge(stockInfo.priority)}
              </div>
              <Table bordered size="sm">
                <tbody>
                  <tr>
                    <td width="50%">Current Inventory</td>
                    <td>
                      <strong>{stockInfo.currentStock}</strong> units
                    </td>
                  </tr>
                  <tr>
                    <td>Average Daily Sales</td>
                    <td>
                      <strong>{stockInfo.avgDailySales.toFixed(1)}</strong> units/day
                    </td>
                  </tr>
                  <tr>
                    <td>Days Until Stockout</td>
                    <td>
                      <strong>{stockInfo.daysUntilStockout}</strong> days
                      {stockInfo.daysUntilStockout <= stockInfo.leadTime && (
                        <Badge bg="danger" className="ms-2">Critical</Badge>
                      )}
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Col>
            <Col md={6}>
              <h6 className="mb-2">Reorder Recommendations</h6>
              <Table bordered size="sm">
                <tbody>
                  <tr>
                    <td width="50%">Reorder Point</td>
                    <td>
                      <strong>{stockInfo.reorderPoint}</strong> units
                    </td>
                  </tr>
                  <tr>
                    <td>Suggested Order Quantity</td>
                    <td>
                      <strong>{stockInfo.suggestedOrderQuantity}</strong> units
                    </td>
                  </tr>
                  <tr>
                    <td>Recommended Restock Date</td>
                    <td>
                      <strong>{stockInfo.restockDate}</strong>
                      {stockInfo.daysUntilStockout <= stockInfo.leadTime && (
                        <Badge bg="danger" className="ms-2">Order Today</Badge>
                      )}
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Col>
          </Row>
          
          {stockInfo.daysUntilStockout <= stockInfo.leadTime && (
            <Alert variant="danger" className="d-flex align-items-center">
              <FaTruck className="me-2 fs-5" />
              <div>
                <strong>Urgent Restock Required!</strong> Current stock will not cover the lead time of {stockInfo.leadTime} days. 
                Order immediately to avoid stockouts.
              </div>
            </Alert>
          )}
          
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              <h6 className="mt-4 mb-2">
                <FaChartLine className="me-2" />
                Daily Stock Projection
              </h6>
              <Table responsive hover size="sm">
                <thead className="bg-light">
                  <tr>
                    <th>Date</th>
                    <th className="text-center">Starting Stock</th>
                    <th className="text-center">Predicted Sales</th>
                    <th className="text-center">Ending Stock</th>
                    <th className="text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stockInfo.stockProjection.map((day, index) => (
                    <tr key={index}>
                      <td>{format(new Date(day.date), 'MMM dd, yyyy')}</td>
                      <td className="text-center">{day.startingStock}</td>
                      <td className="text-center">
                        {day.predictedSales.toFixed(1)}
                      </td>
                      <td className="text-center">
                        {day.endingStock}
                      </td>
                      <td className="text-center">
                        {getStockStatusIcon(day.stockStatus)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              
              <div className="mt-3 small text-muted">
                <ul className="mb-0">
                  <li>The stock projection is based on the sales forecast and current inventory levels.</li>
                  <li>Reorder Point calculation: (Average Daily Sales × Lead Time) + Safety Stock</li>
                  <li>Suggested Order Quantity uses the Economic Order Quantity (EOQ) formula to optimize inventory costs.</li>
                </ul>
              </div>
            </motion.div>
          )}
        </Card.Body>
      </Card>
    </motion.div>
  );
};

export default StockRecommendations;
