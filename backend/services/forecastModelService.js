import * as tf from '@tensorflow/tfjs';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import Product from '../models/Product.js';
import SalesData from '../models/SalesData.js';
import { loadModelFromPath } from '../utils/modelStorage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MODEL_BASE_PATH = path.join(__dirname, '..', 'ml_models');
const DEFAULT_LOOKBACK = parseInt(
  process.env.FORECAST_LOOKBACK_DAYS || '14',
  10
);
const MAX_FORECAST_DAYS = parseInt(
  process.env.FORECAST_MAX_DAYS || '30',
  10
);
const FEATURE_COUNT = 5;

const modelCache = new Map();

const clampDays = (value) => {
  const parsed = Number(value) || 7;
  if (parsed <= 0) {
    return 7;
  }
  return Math.min(parsed, MAX_FORECAST_DAYS);
};

const normalizeValue = (value, stats) => {
  if (!stats) {
    return value;
  }

  const centered = value - stats.mean;
  return centered / (stats.std || 1);
};

const denormalizeValue = (value, stats) => {
  if (!stats) {
    return value;
  }
  return value * (stats.std || 1) + stats.mean;
};

const extractMeta = async (productDir) => {
  const metaRaw = await fs.readFile(path.join(productDir, 'meta.json'), 'utf-8');
  return JSON.parse(metaRaw);
};

const loadModelArtifacts = async (productId) => {
  const cacheKey = productId.toString();
  if (modelCache.has(cacheKey)) {
    return modelCache.get(cacheKey);
  }

  const productDir = path.join(MODEL_BASE_PATH, cacheKey);

  try {
    const [model, meta] = await Promise.all([
      loadModelFromPath(productDir),
      extractMeta(productDir),
    ]);

    const artifact = { model, meta };
    modelCache.set(cacheKey, artifact);
    return artifact;
  } catch (error) {
    console.error(
      `Failed to load model artifacts for product ${cacheKey}:`,
      error
    );
    return null;
  }
};

const buildFeatureVector = (entry, meta) => {
  if (!meta?.featureStats) {
    throw new Error('Missing feature statistics for model inference');
  }

  const temperature =
    Number.isFinite(entry.temperature) && entry.temperature !== null
      ? entry.temperature
      : meta.featureStats.temperature?.mean ?? 0;

  const rainfall =
    Number.isFinite(entry.rainfall) && entry.rainfall !== null
      ? entry.rainfall
      : meta.featureStats.rainfall?.mean ?? 0;

  return [
    normalizeValue(entry.quantity ?? meta.featureStats.quantity?.mean ?? 0, meta.featureStats.quantity),
    normalizeValue(temperature, meta.featureStats.temperature),
    normalizeValue(rainfall, meta.featureStats.rainfall),
    entry.isWeekend ? 1 : 0,
    entry.isFestival ? 1 : 0,
  ];
};

const createInitialWindow = (salesData, meta) => {
  const lookback = meta.lookback || DEFAULT_LOOKBACK;
  if (salesData.length < lookback) {
    return null;
  }

  const window = salesData
    .slice(-lookback)
    .map((sale) =>
      buildFeatureVector(
        {
          quantity: sale.quantity,
          temperature: sale.weather?.temperature,
          rainfall: sale.weather?.rainfall,
          isWeekend: sale.isWeekend,
          isFestival: sale.isFestival,
        },
        meta
      )
    );

  if (window.length !== lookback || window.some((item) => item.length !== FEATURE_COUNT)) {
    return null;
  }

  return window;
};

const calcConfidence = (samples = 0) => {
  if (samples > 200) return 'High';
  if (samples > 80) return 'Medium';
  if (samples > 20) return 'Low';
  return 'Very Low';
};

const buildProductFallbackForecast = (salesData, days, product) => {
  if (!salesData.length) {
    const heuristic = Array.from({ length: days }).map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() + index);
      const base = 30 + index * 2;
      return {
        date,
        predictedQuantity: base,
        upperBound: Math.round(base * 1.3),
        lowerBound: Math.round(base * 0.7),
        estimatedRevenue: Math.round(base * (product?.price || 0)),
        isWeekend: [0, 6].includes(date.getDay()),
        method: 'fallback-time-pattern',
      };
    });

    return {
      forecast: heuristic,
      metadata: {
        method: 'fallback',
        confidence: 'Very Low',
        fallbackReason: 'INSUFFICIENT_DATA',
      },
    };
  }

  const quantities = salesData.map((sale) => sale.quantity);
  const avgQuantity =
    quantities.reduce((sum, qty) => sum + qty, 0) / quantities.length;

  let trend = 0;
  if (quantities.length >= 4) {
    const midpoint = Math.floor(quantities.length / 2);
    const firstHalf =
      quantities.slice(0, midpoint).reduce((sum, value) => sum + value, 0) /
      Math.max(midpoint, 1);
    const secondHalf =
      quantities
        .slice(midpoint)
        .reduce((sum, value) => sum + value, 0) /
      Math.max(quantities.length - midpoint, 1);
    trend = (secondHalf - firstHalf) / Math.max(midpoint, 1);
  }

  const forecast = Array.from({ length: days }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    const basePrediction = Math.max(1, avgQuantity + trend * index);
    const randomFactor = 0.93 + Math.random() * 0.14;
    let predicted = basePrediction * randomFactor;
    if ([0, 6].includes(date.getDay())) {
      predicted *= 0.85;
    }
    const rounded = Math.max(0, Math.round(predicted));
    const estimatedRevenue = Math.round(rounded * (product?.price || 0));
    return {
      date,
      predictedQuantity: rounded,
      upperBound: Math.round(rounded * 1.25),
      lowerBound: Math.round(rounded * 0.75),
      estimatedRevenue,
      isWeekend: [0, 6].includes(date.getDay()),
      method: 'statistical-heuristic',
    };
  });

  return {
    forecast,
    metadata: {
      method: 'statistical-heuristic',
      confidence: calcConfidence(quantities.length),
      fallbackReason: 'MODEL_NOT_AVAILABLE',
    },
  };
};

const buildCategoryFallbackForecast = (salesData, products, days) => {
  if (!salesData.length) {
    return null;
  }

  const productMap = new Map(
    products.map((product) => [product._id.toString(), product])
  );

  const groupedByDate = {};
  salesData.forEach((sale) => {
    const key = sale.date.toISOString().split('T')[0];
    if (!groupedByDate[key]) {
      groupedByDate[key] = {
        quantity: 0,
        revenue: 0,
      };
    }

    const price = productMap.get(sale.productId.toString())?.price || 0;
    groupedByDate[key].quantity += sale.quantity;
    groupedByDate[key].revenue += sale.quantity * price;
  });

  const aggregates = Object.keys(groupedByDate)
    .map((date) => ({
      date: new Date(date),
      quantity: groupedByDate[date].quantity,
      revenue: groupedByDate[date].revenue,
    }))
    .sort((a, b) => a.date - b.date);

  if (!aggregates.length) {
    return null;
  }

  const quantities = aggregates.map((day) => day.quantity);
  const avgQuantity =
    quantities.reduce((sum, qty) => sum + qty, 0) / quantities.length;
  const avgRevenue =
    aggregates.reduce((sum, day) => sum + day.revenue, 0) /
    aggregates.length;

  let trend = 0;
  if (quantities.length >= 4) {
    const midpoint = Math.floor(quantities.length / 2);
    const firstHalf =
      quantities.slice(0, midpoint).reduce((sum, value) => sum + value, 0) /
      Math.max(midpoint, 1);
    const secondHalf =
      quantities
        .slice(midpoint)
        .reduce((sum, value) => sum + value, 0) /
      Math.max(quantities.length - midpoint, 1);
    trend = (secondHalf - firstHalf) / Math.max(midpoint, 1);
  }

  const forecast = Array.from({ length: days }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    const basePrediction = Math.max(1, avgQuantity + trend * index);
    const isWeekend = [0, 6].includes(date.getDay());
    const adjusted = isWeekend ? basePrediction * 0.85 : basePrediction;
    return {
      date,
      predictedQuantity: Math.round(adjusted),
      upperBound: Math.round(adjusted * 1.3),
      lowerBound: Math.round(adjusted * 0.7),
      estimatedRevenue: Math.round(adjusted * (avgRevenue / avgQuantity)),
      isWeekend,
      method: 'statistical-heuristic',
      productCount: products.length,
    };
  });

  return {
    forecast,
    metadata: {
      method: 'statistical-heuristic',
      confidence: calcConfidence(quantities.length),
      fallbackReason: 'NO_MODEL_DATA',
    },
  };
};

const buildOverallFallbackForecast = (days) => {
  const fallback = Array.from({ length: days }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    const dayOfWeek = date.getDay();
    const dayFactors = [0.7, 0.9, 1, 1.05, 1.15, 1.25, 0.8];
    const baseQuantity = 40 * dayFactors[dayOfWeek];

    return {
      date,
      predictedQuantity: Math.round(baseQuantity + index * 2),
      upperBound: Math.round((baseQuantity + index * 2) * 1.3),
      lowerBound: Math.round((baseQuantity + index * 2) * 0.7),
      estimatedRevenue: Math.round((baseQuantity + index * 2) * 50),
      isWeekend: [0, 6].includes(dayOfWeek),
      method: 'time-pattern',
    };
  });

  return {
    forecast: fallback,
    metadata: {
      method: 'time-pattern',
      confidence: 'Very Low',
      fallbackReason: 'NO_DATA_AVAILABLE',
    },
  };
};

const predictWithModel = async ({ artifact, salesData, days, product }) => {
  const lookback = artifact.meta.lookback || DEFAULT_LOOKBACK;
  if (salesData.length < lookback) {
    return null;
  }

  const initialWindow = createInitialWindow(salesData, artifact.meta);
  if (!initialWindow) {
    return null;
  }

  let workingWindow = initialWindow;
  const predictions = [];

  for (let day = 0; day < days; day += 1) {
    const input = tf.tensor3d([workingWindow], [
      1,
      workingWindow.length,
      FEATURE_COUNT,
    ]);
    const output = artifact.model.predict(input);
    const [normalizedQuantity] = await output.data();

    tf.dispose([input, output]);

    const quantity = Math.max(
      0,
      denormalizeValue(normalizedQuantity, artifact.meta.featureStats.quantity)
    );
    const date = new Date();
    date.setDate(date.getDate() + day);

    const estimatedRevenue = Math.round(quantity * (product?.price || 0));

    predictions.push({
      date,
      predictedQuantity: Math.round(quantity),
      upperBound: Math.round(quantity * 1.2),
      lowerBound: Math.round(quantity * 0.8),
      estimatedRevenue,
      isWeekend: [0, 6].includes(date.getDay()),
      method: 'ml-seq2seq',
    });

    const syntheticFeature = buildFeatureVector(
      {
        quantity,
        temperature: artifact.meta.featureStats.temperature?.mean ?? 0,
        rainfall: artifact.meta.featureStats.rainfall?.mean ?? 0,
        isWeekend: predictions[predictions.length - 1].isWeekend ? 1 : 0,
        isFestival: 0,
      },
      artifact.meta
    );

    workingWindow = [...workingWindow.slice(1), syntheticFeature];
  }

  return predictions;
};

export const predictProductSeries = async (
  productId,
  days = 7,
  options = {}
) => {
  const forecastDays = clampDays(days);
  const product =
    options.product || (await Product.findById(productId).lean());

  if (!product) {
    throw new Error('Product not found');
  }

  const salesData = await SalesData.find({ productId })
    .sort({ date: 1 })
    .lean();

  const artifact = await loadModelArtifacts(productId);

  if (artifact?.meta?.featureStats) {
    const mlForecast = await predictWithModel({
      artifact,
      salesData,
      days: forecastDays,
      product,
    });

    if (mlForecast?.length) {
      return {
        forecast: mlForecast,
        metadata: {
          method: 'ml',
          confidence: calcConfidence(artifact.meta.trainingSamples),
          trainedAt: artifact.meta.trainedAt,
          trainingSamples: artifact.meta.trainingSamples,
          validationLoss: artifact.meta.validationLoss,
        },
      };
    }
  }

  const fallback = buildProductFallbackForecast(salesData, forecastDays, product);
  return fallback;
};

const combineForecasts = (forecasts, days) => {
  const combined = [];
  for (let day = 0; day < days; day += 1) {
    const date = new Date();
    date.setDate(date.getDate() + day);
    let predictedQuantity = 0;
    let estimatedRevenue = 0;

    forecasts.forEach((result) => {
      const entry = result.forecast[day];
      if (entry) {
        predictedQuantity += entry.predictedQuantity || 0;
        estimatedRevenue += entry.estimatedRevenue || 0;
      }
    });

    combined.push({
      date,
      predictedQuantity: Math.round(predictedQuantity),
      upperBound: Math.round(predictedQuantity * 1.15),
      lowerBound: Math.round(predictedQuantity * 0.85),
      estimatedRevenue: Math.round(estimatedRevenue),
      isWeekend: [0, 6].includes(date.getDay()),
      productCount: forecasts.length,
    });
  }
  return combined;
};

export const predictCategorySeries = async (categoryId, days = 7) => {
  const forecastDays = clampDays(days);
  const products = await Product.find({ category: categoryId }).lean();

  if (!products.length) {
    return {
      forecast: [],
      metadata: {
        method: 'none',
        confidence: 'Very Low',
        fallbackReason: 'NO_PRODUCTS',
      },
    };
  }

  const perProduct = await Promise.all(
    products.map((product) =>
      predictProductSeries(product._id, forecastDays, { product })
    )
  );

  const usable = perProduct.filter((result) => result.forecast.length);

  if (usable.length) {
    return {
      forecast: combineForecasts(usable, forecastDays),
      metadata: {
        method: usable.some((item) => item.metadata.method === 'ml')
          ? 'ml-aggregate'
          : 'heuristic-aggregate',
        confidence: calcConfidence(
          usable.reduce(
            (sum, item) => sum + (item.metadata.trainingSamples || 0),
            0
          )
        ),
        productCount: usable.length,
      },
    };
  }

  const salesData = await SalesData.find({
    productId: { $in: products.map((p) => p._id) },
  })
    .sort({ date: 1 })
    .lean();

  const fallback = buildCategoryFallbackForecast(
    salesData,
    products,
    forecastDays
  );

  if (fallback) {
    return fallback;
  }

  return buildOverallFallbackForecast(forecastDays);
};

export const predictOverallSeries = async (days = 7) => {
  const forecastDays = clampDays(days);
  const products = await Product.find().lean();

  if (!products.length) {
    return buildOverallFallbackForecast(forecastDays);
  }

  const perProduct = await Promise.all(
    products.map((product) =>
      predictProductSeries(product._id, forecastDays, { product })
    )
  );
  const usable = perProduct.filter((result) => result.forecast.length);

  if (usable.length) {
    return {
      forecast: combineForecasts(usable, forecastDays),
      metadata: {
        method: usable.some((item) => item.metadata.method === 'ml')
          ? 'ml-aggregate'
          : 'heuristic-aggregate',
        confidence: calcConfidence(
          usable.reduce(
            (sum, item) => sum + (item.metadata.trainingSamples || 0),
            0
          )
        ),
        productCount: usable.length,
      },
    };
  }

  return buildOverallFallbackForecast(forecastDays);
};

export const clearModelCache = () => {
  modelCache.forEach((artifact) => {
    artifact.model?.dispose?.();
  });
  modelCache.clear();
};

