import React, { useState, useEffect } from 'react';
import { Card, Badge } from 'react-bootstrap';
import { FaExclamationTriangle, FaCheckCircle, FaArrowDown, FaArrowUp } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * FluidStockIndicator - An animated water-like visualization for stock levels
 * 
 * @param {Object} props Component props
 * @param {number} props.currentStock Current stock level
 * @param {number} props.optimalStock Optimal stock level for this product
 * @param {number} props.maxCapacity Maximum capacity (for visualization)
 * @param {number} props.predictedDemand Predicted demand for next period
 * @param {string} props.productName Product name for display
 * @param {number} props.historicalStock Previous period stock level (optional)
 * @param {number} props.salesVelocity Sales velocity indicator 1-10 (optional)
 * @param {string} props.season Current season: 'winter', 'spring', 'summer', 'fall' (optional)
 */
const FluidStockIndicator = ({ 
  currentStock, 
  optimalStock, 
  maxCapacity = 150, // Default max for visualization
  predictedDemand,
  productName,
  historicalStock,
  salesVelocity = 5, // Default middle velocity
  season
}) => {
  const [showRipple, setShowRipple] = useState(false);
  
  // State for interactive mode
  const [showDetails, setShowDetails] = useState(false);
  
  // Validate numeric inputs with fallbacks
  const safeCurrentStock = typeof currentStock === 'number' && !isNaN(currentStock) ? currentStock : 0;
  const safeOptimalStock = typeof optimalStock === 'number' && !isNaN(optimalStock) ? optimalStock : 10;
  const safeMaxCapacity = typeof maxCapacity === 'number' && !isNaN(maxCapacity) ? maxCapacity : 100;
  const safePredictedDemand = typeof predictedDemand === 'number' && !isNaN(predictedDemand) ? predictedDemand : 0;
  
  // Calculate percentage values for visualization
  const stockPercentage = Math.min(100, (safeCurrentStock / safeMaxCapacity) * 100);
  const optimalPercentage = Math.min(100, (safeOptimalStock / safeMaxCapacity) * 100);
  
  // Calculate historical percentage if provided
  const safeHistoricalStock = typeof historicalStock === 'number' && !isNaN(historicalStock) ? historicalStock : null;
  const historicalPercentage = safeHistoricalStock ? Math.min(100, (safeHistoricalStock / safeMaxCapacity) * 100) : null;
  
  // Calculate stock change percentage
  const stockChangePercentage = safeHistoricalStock ? ((safeCurrentStock - safeHistoricalStock) / safeHistoricalStock * 100).toFixed(1) : null;
  
  // Determine stock status
  const isLow = safeCurrentStock < safeOptimalStock * 0.7;
  const isExcess = safeCurrentStock > safeOptimalStock * 1.3;
  const isOptimal = !isLow && !isExcess;
  
  // Determine trends for next period
  const willDeplete = safeCurrentStock < safePredictedDemand;
  const dailyDemand = safePredictedDemand / 30;
  const daysRemaining = dailyDemand > 0 ? Math.floor(safeCurrentStock / dailyDemand) : 30; // Assuming monthly forecast
  
  // Water color based on status
  const getWaterColor = () => {
    if (isLow) return 'rgba(220, 53, 69, 0.7)'; // Red for low
    if (isExcess) return 'rgba(255, 193, 7, 0.7)'; // Yellow for excess
    return 'rgba(13, 110, 253, 0.7)'; // Blue for optimal
  };
  
  // Determine velocity of water animation based on sales velocity
  const safeSalesVelocity = typeof salesVelocity === 'number' && !isNaN(salesVelocity) ? salesVelocity : 5;
  const animationSpeed = (1.5 - (safeSalesVelocity / 10));

  // Water animation config - speed changes based on sales velocity
  const waterAnimationProps = {
    y: [0, -8, 0],
    transition: {
      duration: animationSpeed, // Faster animation for higher velocity
      repeat: Infinity,
      ease: "easeInOut"
    }
  };
  
  // Seasonal elements to render
  const getSeasonalElements = () => {
    if (!season) return null;
    
    switch(season.toLowerCase()) {
      case 'winter':
        return (
          <>
            {[...Array(5)].map((_, i) => (
              <motion.div 
                key={`snowflake-${i}`}
                className="position-absolute rounded-circle bg-white"
                style={{
                  width: `${Math.random() * 5 + 2}px`,
                  height: `${Math.random() * 5 + 2}px`,
                  left: `${Math.random() * 90 + 5}%`,
                  top: '-10px',
                }}
                animate={{
                  y: [0, 200],
                  x: [0, Math.random() * 20 - 10],
                  opacity: [1, 0]
                }}
                transition={{
                  duration: Math.random() * 5 + 3,
                  repeat: Infinity,
                  delay: Math.random() * 5
                }}
              />
            ))}
          </>
        );
        
      case 'summer':
        return (
          <>
            {[...Array(3)].map((_, i) => (
              <motion.div 
                key={`sun-${i}`}
                className="position-absolute bg-warning opacity-25"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  filter: 'blur(5px)',
                  left: `${Math.random() * 60 + 20}%`,
                  top: `${Math.random() * 40 + 10}%`,
                }}
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.2, 0.3, 0.2]
                }}
                transition={{
                  duration: Math.random() * 3 + 2,
                  repeat: Infinity
                }}
              />
            ))}
          </>
        );
        
      case 'fall':
        return (
          <>
            {[...Array(3)].map((_, i) => (
              <motion.div 
                key={`leaf-${i}`}
                className="position-absolute bg-warning"
                style={{
                  width: '8px',
                  height: '8px',
                  left: `${Math.random() * 90 + 5}%`,
                  top: '-5px',
                  borderRadius: '0 50% 50% 50%',
                  transform: `rotate(${Math.random() * 180}deg)`
                }}
                animate={{
                  y: [0, 200],
                  x: [0, Math.random() * 40 - 20],
                  rotate: [Math.random() * 180, Math.random() * 180 + 360],
                  opacity: [1, 0]
                }}
                transition={{
                  duration: Math.random() * 8 + 5, 
                  repeat: Infinity,
                  delay: Math.random() * 5
                }}
              />
            ))}
          </>
        );
        
      case 'spring':
        return (
          <>
            {[...Array(3)].map((_, i) => (
              <motion.div 
                key={`flower-${i}`}
                className="position-absolute bg-success"
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  left: `${Math.random() * 90 + 5}%`,
                  top: `${Math.random() * 40 + 30}%`,
                }}
                animate={{
                  scale: [1, 0, 1],
                  opacity: [0.7, 0, 0.7]
                }}
                transition={{
                  duration: Math.random() * 4 + 4,
                  repeat: Infinity,
                  delay: Math.random() * 3
                }}
              />
            ))}
          </>
        );
      
      default:
        return null;
    }
  };
  
  // Add ripple effect periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setShowRipple(true);
      setTimeout(() => setShowRipple(false), 2000);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Calculate overflow animation (for excess stock)
  const getOverflowAnimation = () => {
    if (!isExcess) return {};
    
    return {
      opacity: [0, 1, 0],
      y: [0, 20, 40],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeOut"
      }
    };
  };
  
  return (
    <Card className="shadow-sm h-100">
      <Card.Header className={`${isLow ? 'bg-danger text-white' : isExcess ? 'bg-warning' : 'bg-primary text-white'}`}>
        <div className="d-flex justify-content-between align-items-center">
          <span><strong>Stock Level:</strong> {productName}</span>
          {isLow && <FaExclamationTriangle />}
          {isOptimal && <FaCheckCircle />}
          {isExcess && <FaExclamationTriangle />}
        </div>
      </Card.Header>
      <Card.Body>
        <div 
          className="fluid-container position-relative mb-4" 
          style={{ height: '200px', overflow: 'hidden', border: '2px solid #dee2e6', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }}
          onClick={() => setShowDetails(!showDetails)}
        >
          {/* Container markings */}
          <div className="position-absolute top-0 start-0 end-0 bottom-0">
            {[20, 40, 60, 80].map(level => (
              <div 
                key={level}
                className="position-absolute w-100 border-top border-dark border-opacity-25 d-flex justify-content-end"
                style={{ top: `${100 - level}%`, height: '1px' }}
              >
                <span className="bg-white px-1 small" style={{ marginRight: '-1px' }}>
                  {Math.round(maxCapacity * level / 100)}
                </span>
              </div>
            ))}
            
            {/* Optimal level marker */}
            <div 
              className="position-absolute w-100 border-top border-success border-2 d-flex justify-content-start"
              style={{ top: `${100 - optimalPercentage}%`, height: '1px', zIndex: 2 }}
            >
              <Badge bg="success" className="ms-n2" style={{ marginTop: '-12px' }}>
                Optimal
              </Badge>
            </div>
            
            {/* Historical stock marker */}
            {historicalPercentage !== null && (
              <div 
                className="position-absolute w-100 border-top border-info border-dashed d-flex justify-content-end"
                style={{ top: `${100 - historicalPercentage}%`, height: '1px', borderStyle: 'dashed', zIndex: 2 }}
              >
                <Badge bg="info" className="me-n2" style={{ marginTop: '-12px' }}>
                  Last Period
                </Badge>
              </div>
            )}
          </div>
          
          {/* Water animation container */}
          <div 
            className="position-absolute start-0 end-0 bottom-0" 
            style={{ height: `${stockPercentage}%`, overflow: 'hidden', background: getWaterColor(), transition: 'height 1s ease-in-out' }}
          >
            {/* Water surface with wave effect */}
            <motion.div 
              className="position-absolute start-0 end-0 top-0"
              style={{ height: '20px', background: getWaterColor(), filter: 'brightness(110%)' }}
              animate={waterAnimationProps}
            />
            
            {/* Ripple effect */}
            <AnimatePresence>
              {showRipple && (
                <motion.div 
                  className="position-absolute start-50 top-50 translate-middle rounded-circle bg-white bg-opacity-50"
                  style={{ width: '10px', height: '10px' }}
                  initial={{ width: '10px', height: '10px', opacity: 1 }}
                  animate={{ width: '100px', height: '100px', opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2, ease: "easeOut" }}
                />
              )}
            </AnimatePresence>
            
            {/* Bubbles effect */}
            <motion.div 
              className="position-absolute start-25 bottom-0 rounded-circle bg-white bg-opacity-75"
              style={{ width: '8px', height: '8px' }}
              animate={{ y: [-50, -200], opacity: [0, 1, 0] }}
              transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
            />
            <motion.div 
              className="position-absolute start-75 bottom-0 rounded-circle bg-white bg-opacity-75"
              style={{ width: '6px', height: '6px' }}
              animate={{ y: [-30, -150], opacity: [0, 1, 0] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 1, delay: 1 }}
            />
            <motion.div 
              className="position-absolute start-50 bottom-0 rounded-circle bg-white bg-opacity-75"
              style={{ width: '4px', height: '4px' }}
              animate={{ y: [-20, -100], opacity: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 0.5, delay: 0.5 }}
            />
          </div>
          
          {/* Overflow effect for excess stock */}
          {isExcess && (
            <div className="position-absolute start-0 w-100" style={{ top: '0', height: '20px', overflow: 'hidden' }}>
              <motion.div 
                className="position-absolute start-0 end-0"
                style={{ height: '100%', background: getWaterColor() }}
                animate={getOverflowAnimation()}
              />
              <motion.div 
                className="position-absolute end-0"
                style={{ width: '30%', height: '100%', background: getWaterColor() }}
                animate={{ 
                  x: [0, -100, -200], 
                  opacity: [0.7, 0.9, 0] 
                }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              />
              <motion.div 
                className="position-absolute start-20"
                style={{ width: '30%', height: '100%', background: getWaterColor() }}
                animate={{ 
                  x: [0, 100, 200], 
                  opacity: [0.7, 0.9, 0] 
                }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5, delay: 0.5 }}
              />
            </div>
          )}
          
          {/* Seasonal elements */}
          {getSeasonalElements()}
          
          {/* Digital readout */}
          <div className="position-absolute top-0 start-0 bg-dark bg-opacity-75 text-white p-2 rounded-bottom rounded-end">
            <strong>{safeCurrentStock}</strong> units
          </div>
          
          {/* Stock velocity indicator */}
          <div className="position-absolute bottom-0 end-0 bg-dark bg-opacity-75 text-white p-1 rounded-top rounded-start">
            <small>
              Velocity: {safeSalesVelocity}/10
              {safeSalesVelocity > 7 ? ' 🔥' : safeSalesVelocity < 3 ? ' 🐢' : ''}
            </small>
          </div>
          
          {/* Historical comparison if available */}
          {historicalStock && (
            <div className="position-absolute top-0 end-0 bg-info bg-opacity-75 text-white p-1 rounded-bottom rounded-start">
              <small>
                {stockChangePercentage > 0 ? '▲' : '▼'} {Math.abs(stockChangePercentage)}%
              </small>
            </div>
          )}
        </div>
        
        {/* Interactive details section */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 p-2 border rounded bg-light"
            >
              <h6 className="mb-2">Stock Projection Details</h6>
              <table className="table table-sm table-striped mb-0">
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Projected Stock</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(5)].map((_, i) => {
                    const day = i + 1;
                    const projectedSales = dailyDemand * day;
                    const projectedStock = Math.max(0, safeCurrentStock - projectedSales);
                    let status = 'OK';
                    let statusClass = 'success';
                    
                    if (projectedStock <= 0) {
                      status = 'Stockout';
                      statusClass = 'danger';
                    } else if (projectedStock < safeOptimalStock * 0.3) {
                      status = 'Critical';
                      statusClass = 'danger';
                    } else if (projectedStock < safeOptimalStock * 0.7) {
                      status = 'Low';
                      statusClass = 'warning';
                    }
                    
                    return (
                      <tr key={`day-${day}`}>
                        <td>Day {day}</td>
                        <td>{Math.round(projectedStock)}</td>
                        <td><Badge bg={statusClass}>{status}</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="text-center mt-2">
                <small className="text-muted">Click the container to hide details</small>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Stock metrics styled like the screenshot */}
        <div className="stock-metrics">
          <div className="mb-2">
            <strong>Status:</strong>{' '}
            {isLow && <Badge bg="danger" className="ms-2">Low Stock</Badge>}
            {isOptimal && <Badge bg="success" className="ms-2">Optimal</Badge>}
            {isExcess && <Badge bg="warning" className="ms-2">Excess Stock</Badge>}
          </div>
          
          <div className="mb-2">
            <strong>Forecast:</strong>{' '}
            {willDeplete ? (
              <span className="text-danger ms-2">
                <FaArrowUp className="me-1 text-success" />
                Sufficient for next period
              </span>
            ) : (
              <span className="text-success ms-2">
                <FaArrowUp className="me-1" />
                Sufficient for next period
              </span>
            )}
          </div>
          
          <div className="mb-3">
            <strong>Recommended action:</strong>{' '}
            {isLow && <span className="text-danger ms-2">Restock immediately</span>}
            {isOptimal && <span className="text-success ms-2">No action needed</span>}
            {isExcess && <span className="text-warning ms-2">Consider promotions</span>}
          </div>
          
          <h6 className="mt-3 mb-2">Key Metrics</h6>
          <table className="table table-sm">
            <tbody>
              <tr>
                <td>Reorder Point</td>
                <td className="text-end">{safeOptimalStock * 0.7 | 0}</td>
              </tr>
              <tr>
                <td>Safety Stock</td>
                <td className="text-end">{safeOptimalStock * 0.3 | 0}</td>
              </tr>
              <tr>
                <td>Order Quantity</td>
                <td className="text-end">{safeOptimalStock | 0}</td> 
              </tr>
              <tr>
                <td>Lead Time</td>
                <td className="text-end">3 days</td>
              </tr>
              <tr>
                <td>Order Frequency</td>
                <td className="text-end">Every 14 days</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card.Body>
    </Card>
  );
};

export default FluidStockIndicator;
