import Sale from '../models/Sale.js';
import SalesData from '../models/SalesData.js';
import Product from '../models/Product.js';

/**
 * Compute today's sales summary (total revenue in INR, total orders, AOV)
 * Combines data from both `Sale` (legacy) and `SalesData` collections.
 */
export const getTodayAdminSummary = async () => {
  // midnight today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // midnight tomorrow
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  /* ---------------- Legacy `Sale` documents ---------------- */
  const saleDocs = await Sale.find({
    date: { $gte: today, $lt: tomorrow }
  }).populate('product', 'price');

  let totalRevenue = 0;
  let totalOrders = 0;

  for (const doc of saleDocs) {
    const price = doc?.product?.price || 0;
    const qty = doc.quantity || 0;
    totalRevenue += (doc.totalAmount ?? price * qty);
    totalOrders += 1;
  }

  let products = [];
  /* ---------------- New `SalesData` documents -------------- */
  const salesDataDocs = await SalesData.find({
    date: { $gte: today, $lt: tomorrow }
  });

  if (salesDataDocs.length) {
    const productIds = salesDataDocs.map(d => d.productId);
    products = await Product.find({ _id: { $in: productIds } }, 'price');
    const priceMap = new Map(products.map(p => [p._id.toString(), p.price || 0]));

    for (const doc of salesDataDocs) {
      const price = priceMap.get(doc.productId.toString()) || 0;
      totalRevenue += price * (doc.quantity || 0);
      totalOrders += 1;
    }
  }

  const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  /* -------- Build detailed lists similar to adminRoutes logic -------- */
  // Group product sales
  const productMap = new Map();
  for (const doc of saleDocs) {
    if (!doc.product) continue;
    const key = doc.product._id.toString();
    if (!productMap.has(key)) {
      productMap.set(key, { name: doc.product.name, categoryId: doc.product.category?.toString() || '', quantity: 0, revenue: 0 });
    }
    const entry = productMap.get(key);
    entry.quantity += doc.quantity;
    const price = doc.product.price || 0;
    entry.revenue += price * doc.quantity;
  }
  // Include SalesData docs
  if (salesDataDocs.length) {
    const products = await Product.find();
    const priceMapAll = new Map(products.map(p => [p._id.toString(), p.price || 0]));
    for (const doc of salesDataDocs) {
      const key = doc.productId.toString();
      const product = products.find(p => p._id.toString() === key);
      if (!product) continue;
      if (!productMap.has(key)) {
        productMap.set(key, { name: product.name, categoryId: product.category?.toString() || '', quantity: 0, revenue: 0 });
      }
      const entry = productMap.get(key);
      entry.quantity += doc.quantity;
      entry.revenue += (priceMapAll.get(key) || 0) * doc.quantity;
    }
  }
  const productList = Array.from(productMap.values()).sort((a,b)=>b.revenue-a.revenue);

  // Category aggregation
  const categoryMap = new Map();
  for (const prod of productList) {
    const cid = prod.categoryId;
    if (!cid) continue;
    if (!categoryMap.has(cid)) categoryMap.set(cid, { name:'', quantity:0, revenue:0 });
    const c = categoryMap.get(cid);
    c.quantity += prod.quantity;
    c.revenue += prod.revenue;
  }
  const categories = await import('../models/Category.js').then(m=>m.default.find());
  categories.forEach(cat=>{if(categoryMap.has(cat._id.toString())){categoryMap.get(cat._id.toString()).name=cat.name;}});
  const categoryList = Array.from(categoryMap.values()).sort((a,b)=>b.revenue-a.revenue);

  // Determine unsold categories/products
  const soldCategoryIds = new Set(categoryList.map(c=>c.name&&c.name!==''?c.name:null));
  const unsoldCategories = categories.filter(cat=>!Array.from(categoryMap.keys()).includes(cat._id.toString())).map(cat=>cat.name);
  const unsoldProducts = products.filter(p=>!productMap.has(p._id.toString())).slice(0,10).map(p=>p.name);

  return {
    totalSales: totalRevenue,
    totalOrders,
    aov,
    products: productList,
    categories: categoryList,
    notSellingCategories: unsoldCategories,
    notSellingProducts: unsoldProducts
  };
};
