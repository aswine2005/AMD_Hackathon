import nodemailer from 'nodemailer';

/**
 * Configuration for email transport using Gmail
 */
const emailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'salesbot77@gmail.com',
        pass: 'augmvevxacqdeacg' // App Password for Gmail
    }
});

/**
 * Format forecast data for email sharing
 */
const formatForecastData = (forecastData) => {
    if (!forecastData) return '<p>No forecast data available</p>';
    
    const { type, name, data, productName, categoryName } = forecastData;
    const displayName = productName || categoryName || name || 'Unknown';
    
    let formattedHtml = `
        <h2>${type || 'Forecast'}: ${displayName}</h2>
        <div class="forecast-data">
    `;
    
    // Handle array data
    if (Array.isArray(data)) {
        data.slice(0, 7).forEach(item => { // Limit to first 7 days for readability
            const date = item.date ? new Date(item.date).toLocaleDateString() : 'N/A';
            formattedHtml += `
                <div class="forecast-item">
                    <strong>Date:</strong> ${date}<br>
                    <strong>Predicted Sales:</strong> ${item.predictedQuantity || item.quantity || 0} units<br>
                    ${item.revenue ? `<strong>Estimated Revenue:</strong> ₹${item.revenue.toFixed(2)}<br>` : ''}
                    ${item.upperBound ? `<strong>Upper Bound:</strong> ${item.upperBound} units<br>` : ''}
                    ${item.lowerBound ? `<strong>Lower Bound:</strong> ${item.lowerBound} units<br>` : ''}
                </div>
            `;
        });
        
        if (data.length > 7) {
            formattedHtml += `<p><em>... and ${data.length - 7} more days of forecast data</em></p>`;
        }
    } else {
        formattedHtml += '<p>Forecast data format not recognized</p>';
    }
    
    formattedHtml += '</div>';
    return formattedHtml;
};

/**
 * Format weather data for email sharing
 */
const formatWeatherData = (weatherData) => {
    if (!weatherData) return '';
    
    const { location, temperature, conditions, humidity } = weatherData;
    
    return `
        <div class="weather-data">
            <p><strong>Location:</strong> ${location || 'Unknown'}</p>
            ${temperature ? `<p><strong>Temperature:</strong> ${temperature}°C</p>` : ''}
            ${conditions ? `<p><strong>Conditions:</strong> ${conditions}</p>` : ''}
            ${humidity ? `<p><strong>Humidity:</strong> ${humidity}%</p>` : ''}
        </div>
    `;
};

/**
 * Format analytics data for email sharing
 */
const formatAnalyticsData = (analyticsData) => {
    if (!analyticsData) return '';
    
    const { trends, insights } = analyticsData;
    let formattedHtml = '<div class="analytics-data">';
    
    if (trends && trends.length > 0) {
        formattedHtml += '<h3>Trends</h3><ul>';
        trends.forEach(trend => {
            formattedHtml += `<li>${trend}</li>`;
        });
        formattedHtml += '</ul>';
    }
    
    if (insights && insights.length > 0) {
        formattedHtml += '<h3>Key Insights</h3><ul>';
        insights.forEach(insight => {
            formattedHtml += `<li>${insight}</li>`;
        });
        formattedHtml += '</ul>';
    }
    
    formattedHtml += '</div>';
    return formattedHtml;
};

/**
 * Format stock recommendations data for email sharing
 */
const formatStockRecommendationsData = (stockData) => {
    if (!stockData || !stockData.recommendations) return '';
    
    const { recommendations } = stockData;
    let formattedHtml = '<div class="stock-recommendations">';
    formattedHtml += '<h3>Stock Recommendations</h3><ul>';
    
    recommendations.slice(0, 5).forEach(item => {
        formattedHtml += `
            <li>
                <strong>${item.productName}</strong>: 
                Reorder ${item.reorderQuantity} units 
                ${item.urgency ? `<span style="color: red;">(Urgent)</span>` : ''}
            </li>
        `;
    });
    
    if (recommendations.length > 5) {
        formattedHtml += `<li><em>... and ${recommendations.length - 5} more recommendations</em></li>`;
    }
    
    formattedHtml += '</ul></div>';
    return formattedHtml;
};

/**
 * Send forecast and related data via email
 */
export const sendEmailShare = async (req, res) => {
    try {
        const { 
            recipientEmail, 
            forecastData, 
            weatherData,
            analyticsData,
            stockData,
            subject, 
            additionalMessage 
        } = req.body;
        
        if (!recipientEmail) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email address is required' 
            });
        }

        // Format the data
        const formattedForecastData = forecastData ? formatForecastData(forecastData) : '';
        const formattedWeatherData = weatherData ? formatWeatherData(weatherData) : '';
        const formattedAnalyticsData = analyticsData ? formatAnalyticsData(analyticsData) : '';
        const formattedStockData = stockData ? formatStockRecommendationsData(stockData) : '';
        
        // Prepare email content
        const emailSubject = subject || 'Your Sales Forecast Data from Byte Buddies';
        const currentDate = new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        const emailHtml = `
            <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background-color: #4285F4; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
                        .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
                        h1 { color: white; margin: 0; font-size: 24px; }
                        h2 { color: #4285F4; margin-top: 20px; font-size: 20px; }
                        h3 { color: #4285F4; font-size: 18px; }
                        .forecast-item { margin-bottom: 15px; padding: 15px; background-color: white; border-radius: 5px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                        .weather-data { background-color: #e1f5fe; padding: 15px; border-radius: 5px; margin-top: 20px; }
                        .analytics-data, .stock-recommendations { background-color: white; padding: 15px; border-radius: 5px; margin-top: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                        .message { font-style: italic; background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0; }
                        .footer { margin-top: 30px; font-size: 14px; color: #757575; text-align: center; padding-top: 15px; border-top: 1px solid #eee; }
                        .logo { font-weight: bold; font-size: 18px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Sales Forecast Report</h1>
                        </div>
                        <div class="content">
                            <p>Hello,</p>
                            
                            ${additionalMessage ? `<div class="message">${additionalMessage}</div>` : ''}
                            
                            ${formattedForecastData}
                            
                            ${formattedWeatherData}
                            
                            ${formattedAnalyticsData}
                            
                            ${formattedStockData}
                            
                            <div class="footer">
                                <p>Thank you for using our sales forecasting platform!</p>
                                <p>This report was generated on ${currentDate}</p>
                                <p class="logo">Byte Buddies | Empowering Your Business with AI</p>
                            </div>
                        </div>
                    </div>
                </body>
            </html>
        `;

        // Send email
        const mailOptions = {
            from: '"Byte Buddies AI" <salesbot77@gmail.com>',
            to: recipientEmail,
            subject: emailSubject,
            html: emailHtml
        };

        const info = await emailTransporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.response);
        
        return res.status(200).json({ 
            success: true, 
            message: 'Email sent successfully', 
            messageId: info.messageId
        });
    } catch (error) {
        console.error('Error in sendEmailShare:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error while sending email', 
            error: error.message 
        });
    }
};

/**
 * Format admin data for email sharing
 */
const formatAdminData = (adminData) => {
    if (!adminData) return '<p>No sales data available</p>';
    
    const { totalSales, totalRevenue, totalProfit, orders, topProducts, topCategories, notSellingProducts, notSellingCategories } = adminData;
    
    let formattedHtml = `
        <h2>Today's Sales Performance</h2>
        <div class="summary-data">
            <div class="metrics-grid">
                <div class="metric-item">
                    <div class="metric-value">${totalSales || 0}</div>
                    <div class="metric-label">Units Sold</div>
                </div>
                <div class="metric-item">
                    <div class="metric-value">₹${(totalRevenue || 0).toLocaleString('en-IN')}</div>
                    <div class="metric-label">Total Revenue</div>
                </div>
                <div class="metric-item">
                    <div class="metric-value">₹${(totalProfit || 0).toLocaleString('en-IN')}</div>
                    <div class="metric-label">Total Profit</div>
                </div>
                <div class="metric-item">
                    <div class="metric-value">${orders || 0}</div>
                    <div class="metric-label">Orders</div>
                </div>
            </div>
        </div>
    `;
    
    // Top products section
    if (topProducts && topProducts.length > 0) {
        formattedHtml += `
            <h3>Top Selling Products Today</h3>
            <div class="data-table">
                <table>
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>Revenue</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        topProducts.forEach((product, index) => {
            formattedHtml += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${product.name}</td>
                    <td>${product.quantity} units</td>
                    <td>₹${product.revenue.toLocaleString('en-IN')}</td>
                </tr>
            `;
        });
        
        formattedHtml += `
                    </tbody>
                </table>
            </div>
        `;
    } else {
        formattedHtml += `<div class="notice"><p>No products sold today</p></div>`;
    }
    
    // Top categories section
    if (topCategories && topCategories.length > 0) {
        formattedHtml += `
            <h3>Top Selling Categories Today</h3>
            <div class="data-table">
                <table>
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Category</th>
                            <th>Quantity</th>
                            <th>Revenue</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        topCategories.forEach((category, index) => {
            formattedHtml += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${category.name}</td>
                    <td>${category.quantity} units</td>
                    <td>₹${category.revenue.toLocaleString('en-IN')}</td>
                </tr>
            `;
        });
        
        formattedHtml += `
                    </tbody>
                </table>
            </div>
        `;
    }
    
    // Non-selling products and categories section
    if ((notSellingProducts && notSellingProducts.length > 0) || 
        (notSellingCategories && notSellingCategories.length > 0)) {
        
        formattedHtml += `<h3>Products & Categories Needing Attention</h3>`;
        
        if (notSellingCategories && notSellingCategories.length > 0) {
            formattedHtml += `
                <h4>Categories Not Selling Today</h4>
                <div class="not-selling-list">
                    <ul>
            `;
            
            notSellingCategories.slice(0, 5).forEach(category => {
                formattedHtml += `<li>${category.name}</li>`;
            });
            
            if (notSellingCategories.length > 5) {
                formattedHtml += `<li>...and ${notSellingCategories.length - 5} more</li>`;
            }
            
            formattedHtml += `
                    </ul>
                </div>
            `;
        }
        
        if (notSellingProducts && notSellingProducts.length > 0) {
            formattedHtml += `
                <h4>Products Not Selling Today</h4>
                <div class="not-selling-list">
                    <ul>
            `;
            
            notSellingProducts.slice(0, 5).forEach(product => {
                formattedHtml += `<li>${product.name}</li>`;
            });
            
            if (notSellingProducts.length > 5) {
                formattedHtml += `<li>...and ${notSellingProducts.length - 5} more</li>`;
            }
            
            formattedHtml += `
                    </ul>
                </div>
            `;
        }
    }
    
    return formattedHtml;
};

/**
 * Send admin data via email
 */
const sendAdminEmail = async (req, res) => {
    const { recipientEmail, adminData, subject, additionalMessage } = req.body;
    
    if (!recipientEmail) {
        return res.status(400).json({ success: false, message: 'Recipient email is required' });
    }
    
    if (!adminData) {
        return res.status(400).json({ success: false, message: 'Admin data is required' });
    }
    
    try {
        // Format admin data for email
        const formattedAdminData = formatAdminData(adminData);
        
        // Prepare email content
        const emailSubject = subject || 'Your Daily Sales Report from Byte Buddies';
        const currentDate = new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        const emailHtml = `
            <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background-color: #4285F4; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
                        .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
                        h1 { color: white; margin: 0; font-size: 24px; }
                        h2 { color: #4285F4; margin-top: 20px; font-size: 20px; }
                        h3 { color: #4285F4; font-size: 18px; margin-top: 25px; }
                        h4 { color: #555; font-size: 16px; margin-top: 20px; }
                        .summary-data { background-color: white; padding: 15px; border-radius: 5px; margin-top: 15px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                        .metrics-grid { display: flex; flex-wrap: wrap; gap: 10px; justify-content: space-between; }
                        .metric-item { background-color: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; flex: 1; min-width: 120px; }
                        .metric-value { font-size: 24px; font-weight: bold; color: #4285F4; }
                        .metric-label { font-size: 14px; color: #555; margin-top: 5px; }
                        .data-table { margin-top: 15px; overflow-x: auto; }
                        table { width: 100%; border-collapse: collapse; }
                        th { background-color: #f3f3f3; padding: 10px; text-align: left; }
                        td { padding: 10px; border-bottom: 1px solid #eee; }
                        .not-selling-list { background-color: #fff8e1; padding: 15px; border-radius: 5px; margin-top: 10px; }
                        .not-selling-list ul { margin: 0; padding-left: 20px; }
                        .notice { background-color: #f3f3f3; padding: 15px; border-radius: 5px; text-align: center; margin: 15px 0; }
                        .message { font-style: italic; background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0; }
                        .footer { margin-top: 30px; font-size: 14px; color: #757575; text-align: center; padding-top: 15px; border-top: 1px solid #eee; }
                        .logo { font-weight: bold; font-size: 18px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Daily Sales Report</h1>
                        </div>
                        <div class="content">
                            <p>Hello,</p>
                            
                            ${additionalMessage ? `<div class="message">${additionalMessage}</div>` : ''}
                            
                            ${formattedAdminData}
                            
                            <div class="footer">
                                <p>Thank you for using our sales reporting platform!</p>
                                <p>This report was generated on ${currentDate}</p>
                                <p class="logo">Byte Buddies | Empowering Your Business with AI</p>
                            </div>
                        </div>
                    </div>
                </body>
            </html>
        `;

        // Send email
        const mailOptions = {
            from: '"Byte Buddies AI" <salesbot77@gmail.com>',
            to: recipientEmail,
            subject: emailSubject,
            html: emailHtml
        };

        const info = await emailTransporter.sendMail(mailOptions);
        console.log('Admin email sent successfully:', info.response);
        
        return res.status(200).json({ 
            success: true, 
            message: 'Email sent successfully', 
            messageId: info.messageId
        });
    } catch (error) {
        console.error('Error in sendAdminEmail:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error while sending email', 
            error: error.message 
        });
    }
};

export default {
    sendEmailShare,
    sendAdminEmail
};
