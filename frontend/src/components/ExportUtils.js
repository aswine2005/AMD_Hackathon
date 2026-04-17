import { utils, write } from 'xlsx';
import { format } from 'date-fns';
import { saveAs } from 'file-saver';

/**
 * Export stock recommendations to Excel
 * Formats the data in a well-structured Excel format with appropriate styling
 */
export const exportRecommendationsToExcel = (stockData, productName) => {
  try {
    // Create workbook and worksheet
    const wb = utils.book_new();
    
    // Format the data for the main recommendations
    const mainRecommendations = [
      ['Stock Recommendations Report', '', ''],
      ['Generated on', format(new Date(), 'yyyy-MM-dd HH:mm'), ''],
      ['Product', productName || 'Selected Product', ''],
      ['', '', ''],
      ['Current Stock Status', '', ''],
      ['Current Inventory', stockData.currentStock, 'units'],
      ['Average Daily Sales', stockData.avgDailySales.toFixed(1), 'units/day'],
      ['Days Until Stockout', stockData.daysUntilStockout, 'days'],
      ['Reorder Point', stockData.reorderPoint, 'units'],
      ['Safety Stock', stockData.safetyStock, 'units'],
      ['', '', ''],
      ['Order Recommendations', '', ''],
      ['Suggested Order Quantity', stockData.suggestedOrderQuantity, 'units'],
      ['Reorder Frequency', `Every ${stockData.orderFrequency} days`, ''],
      ['Next Reorder Date', stockData.daysUntilStockout <= stockData.leadTime ? 
                            'Immediate' : 
                            format(new Date(Date.now() + (Math.max(0, stockData.daysUntilStockout - stockData.leadTime) * 24 * 60 * 60 * 1000)), 'yyyy-MM-dd'), ''],
      ['Priority', stockData.priority.toUpperCase(), ''],
      ['Message', stockData.message, ''],
      ['', '', ''],
    ];
    
    // Add profit impact data if available
    if (stockData.profitImpact) {
      mainRecommendations.push(
        ['Financial Impact', '', ''],
        ['Impact Status', stockData.profitImpact.status, ''],
        ['Estimated Impact', `₹${Math.round(stockData.profitImpact.estimatedImpact || 0)}`, ''],
        ['Message', stockData.profitImpact.message, ''],
        ['', '', '']
      );
    }
    
    // Add inventory efficiency data if available
    if (stockData.stockEfficiency) {
      mainRecommendations.push(
        ['Inventory Efficiency', '', ''],
        ['Inventory Turnover', stockData.stockEfficiency.inventoryTurnover, 'turns/year'],
        ['Days of Inventory', stockData.stockEfficiency.daysOfInventory, 'days'],
        ['Annual Holding Cost', `₹${stockData.stockEfficiency.annualHoldingCost}`, ''],
        ['Efficiency Rating', stockData.stockEfficiency.efficiency.toUpperCase(), ''],
        ['Recommendation', stockData.stockEfficiency.recommendations, ''],
        ['', '', '']
      );
    }
    
    // Create the main recommendations sheet
    const mainWs = utils.aoa_to_sheet(mainRecommendations);
    utils.book_append_sheet(wb, mainWs, 'Recommendations');
    
    // Create a daily projection sheet if available
    if (stockData.dailyStockProjections && stockData.dailyStockProjections.length > 0) {
      // Header row
      const projectionData = [
        ['Date', 'Predicted Sales', 'Projected Stock', 'Status']
      ];
      
      // Add data rows
      stockData.dailyStockProjections.forEach(day => {
        projectionData.push([
          format(new Date(day.date), 'yyyy-MM-dd'),
          day.predictedSales.toFixed(1),
          day.projectedStock.toFixed(0),
          day.status === 'out_of_stock' ? 'STOCK OUT' :
          day.status === 'low_stock' ? 'LOW STOCK' : 'ADEQUATE'
        ]);
      });
      
      const projectionWs = utils.aoa_to_sheet(projectionData);
      utils.book_append_sheet(wb, projectionWs, 'Daily Projection');
    }
    
    // Generate Excel file
    const wbout = write(wb, { bookType: 'xlsx', type: 'array' });
    
    // Create a Blob and trigger download
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, `Stock_Recommendations_${productName ? productName.replace(/\s+/g, '_') : 'Product'}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
    
    return true;
  } catch (error) {
    console.error('Error exporting recommendations:', error);
    return false;
  }
};

/**
 * Export forecast data to Excel
 * Provides detailed forecast with confidence intervals and factors
 */
export const exportForecastToExcel = (forecastData, productName) => {
  try {
    // Create workbook
    const wb = utils.book_new();
    
    // Format the data
    const headerRow = ['Date', 'Predicted Sales', 'Lower Bound', 'Upper Bound'];
    
    // Check if we have factor data
    const hasFactors = forecastData.some(day => day.factors);
    if (hasFactors) {
      headerRow.push('Weather Factor', 'Category Factor', 'Seasonal Factor', 'Festival Factor');
    }
    
    // Create data rows
    const data = [headerRow];
    
    forecastData.forEach(day => {
      const row = [
        format(new Date(day.date), 'yyyy-MM-dd'),
        day.predictedQuantity?.toFixed(1) || day.quantity?.toFixed(1) || '0',
        day.confidenceInterval?.lower?.toFixed(1) || '',
        day.confidenceInterval?.upper?.toFixed(1) || ''
      ];
      
      if (hasFactors && day.factors) {
        row.push(
          day.factors.weather?.toFixed(2) || '1.00',
          day.factors.category?.toFixed(2) || '1.00',
          day.factors.seasonal?.toFixed(2) || '1.00',
          day.factors.festival?.toFixed(2) || '1.00'
        );
      }
      
      data.push(row);
    });
    
    // Create the worksheet and add to workbook
    const ws = utils.aoa_to_sheet(data);
    utils.book_append_sheet(wb, ws, 'Forecast Data');
    
    // Generate Excel file
    const wbout = write(wb, { bookType: 'xlsx', type: 'array' });
    
    // Create a Blob and trigger download
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, `Forecast_Data_${productName ? productName.replace(/\s+/g, '_') : 'Product'}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
    
    return true;
  } catch (error) {
    console.error('Error exporting forecast data:', error);
    return false;
  }
};

/**
 * Export category rankings to Excel
 */
export const exportCategoryRankingsToExcel = (rankingsData, timeRange) => {
  try {
    // Create workbook
    const wb = utils.book_new();
    
    // Format the data
    const data = [
      ['Category Rankings Report', '', '', ''],
      [`Time Range: Past ${timeRange} days`, '', '', ''],
      ['Generated on', format(new Date(), 'yyyy-MM-dd HH:mm'), '', ''],
      ['', '', '', ''],
      ['Rank', 'Category', 'Performance Score', 'Change']
    ];
    
    // Add data rows
    rankingsData.forEach((category, index) => {
      data.push([
        index + 1,
        category.name,
        category.score.toFixed(2),
        `${category.change >= 0 ? '+' : ''}${category.change.toFixed(2)}%`
      ]);
    });
    
    // Create the worksheet and add to workbook
    const ws = utils.aoa_to_sheet(data);
    utils.book_append_sheet(wb, ws, 'Category Rankings');
    
    // Generate Excel file
    const wbout = write(wb, { bookType: 'xlsx', type: 'array' });
    
    // Create a Blob and trigger download
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, `Category_Rankings_${format(new Date(), 'yyyyMMdd')}.xlsx`);
    
    return true;
  } catch (error) {
    console.error('Error exporting category rankings:', error);
    return false;
  }
};

const ExportUtils = {
  exportRecommendationsToExcel,
  exportForecastToExcel,
  exportCategoryRankingsToExcel
};

export default ExportUtils;
