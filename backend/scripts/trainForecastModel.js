import dotenv from 'dotenv';
import mongoose from 'mongoose';
import * as tf from '@tensorflow/tfjs';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import Product from '../models/Product.js';
import SalesData from '../models/SalesData.js';
import { saveModelToPath } from '../utils/modelStorage.js';

dotenv.config();

const LOOKBACK = parseInt(process.env.FORECAST_LOOKBACK_DAYS || '14', 10);
const MIN_RECORDS = parseInt(process.env.FORECAST_MIN_RECORDS || '40', 10);
const MAX_EPOCHS = parseInt(process.env.FORECAST_MAX_EPOCHS || '120', 10);
const MODEL_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'ml_models'
);
const FEATURE_KEYS = ['quantity', 'temperature', 'rainfall'];
const BINARY_KEYS = ['isWeekend', 'isFestival'];
const FEATURE_COUNT = FEATURE_KEYS.length + BINARY_KEYS.length;

const defaultMongoUri =
  'mongodb+srv://aswin:aswin@cluster0.4bgll.mongodb.net/sales_forecasting?retryWrites=true&w=majority';

const connectMongo = async () => {
  const uri = process.env.MONGODB_URI || defaultMongoUri;
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log('Connected to MongoDB');
};

const fetchSalesSeries = async (productId) => {
  const sales = await SalesData.find({ productId }).sort({ date: 1 }).lean();
  return sales.map((entry) => ({
    quantity: entry.quantity,
    temperature: entry.weather?.temperature ?? null,
    rainfall: entry.weather?.rainfall ?? 0,
    isWeekend: entry.isWeekend ? 1 : 0,
    isFestival: entry.isFestival ? 1 : 0,
    date: entry.date,
  }));
};

const computeStats = (series) => {
  const stats = {};
  FEATURE_KEYS.forEach((key) => {
    const values = series.map((item) =>
      Number.isFinite(item[key]) ? item[key] : 0
    );
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const variance =
      values.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
      Math.max(values.length, 1);
    stats[key] = {
      mean,
      std: Math.sqrt(variance) || 1,
    };
  });

  const categorical = {
    isWeekend:
      series.reduce((sum, item) => sum + (item.isWeekend || 0), 0) /
      Math.max(series.length, 1),
    isFestival:
      series.reduce((sum, item) => sum + (item.isFestival || 0), 0) /
      Math.max(series.length, 1),
  };

  return { stats, categorical };
};

const normalizeValue = (value, { mean, std }) =>
  (value - mean) / (std || 1);

const buildDatasets = (series) => {
  if (series.length < LOOKBACK + 1) {
    return null;
  }

  const { stats, categorical } = computeStats(series);
  const windows = [];
  const labels = [];

  for (let i = LOOKBACK; i < series.length; i += 1) {
    const slice = series.slice(i - LOOKBACK, i);
    const window = slice.map((point) => {
      const temp =
        Number.isFinite(point.temperature) && point.temperature !== null
          ? point.temperature
          : stats.temperature.mean;

      const rainfall =
        Number.isFinite(point.rainfall) && point.rainfall !== null
          ? point.rainfall
          : stats.rainfall.mean;

      return [
        normalizeValue(point.quantity, stats.quantity),
        normalizeValue(temp, stats.temperature),
        normalizeValue(rainfall, stats.rainfall),
        point.isWeekend || 0,
        point.isFestival || 0,
      ];
    });

    windows.push(window);
    labels.push([
      normalizeValue(series[i].quantity, stats.quantity),
    ]);
  }

  const xs = tf.tensor3d(windows, [
    windows.length,
    LOOKBACK,
    FEATURE_COUNT,
  ]);
  const ys = tf.tensor2d(labels, [labels.length, 1]);

  return {
    xs,
    ys,
    stats,
    categorical,
    sampleCount: windows.length,
  };
};

const createModel = () => {
  const model = tf.sequential();
  model.add(
    tf.layers.lstm({
      units: 64,
      returnSequences: true,
      inputShape: [LOOKBACK, FEATURE_COUNT],
    })
  );
  model.add(tf.layers.dropout({ rate: 0.2 }));
  model.add(
    tf.layers.lstm({
      units: 32,
    })
  );
  model.add(tf.layers.dense({ units: 1 }));
  model.compile({
    loss: 'meanSquaredError',
    optimizer: tf.train.adam(0.001),
  });
  return model;
};

const trainProductModel = async (product) => {
  const salesSeries = await fetchSalesSeries(product._id);

  if (salesSeries.length < MIN_RECORDS) {
    console.warn(
      `[SKIP] ${product.name} – requires at least ${MIN_RECORDS} records, found ${salesSeries.length}`
    );
    return null;
  }

  const dataset = buildDatasets(salesSeries);
  if (!dataset) {
    console.warn(`[SKIP] ${product.name} – not enough sequential data`);
    return null;
  }

  const model = createModel();
  console.log(
    `[TRAIN] ${product.name} – samples: ${dataset.sampleCount}, lookback: ${LOOKBACK}`
  );

  const history = await model.fit(dataset.xs, dataset.ys, {
    epochs: MAX_EPOCHS,
    batchSize: 32,
    validationSplit: 0.1,
    verbose: 0,
    callbacks: tf.callbacks.earlyStopping({
      patience: 10,
      restoreBestWeight: true,
    }),
  });

  const productDir = path.join(MODEL_DIR, product._id.toString());
  await saveModelToPath(model, productDir);

  const metadata = {
    productId: product._id.toString(),
    productName: product.name,
    trainedAt: new Date().toISOString(),
    lookback: LOOKBACK,
    trainingSamples: dataset.sampleCount,
    validationLoss:
      history.history.val_loss?.[history.history.val_loss.length - 1] ?? null,
    featureStats: dataset.stats,
    categoricalAverages: dataset.categorical,
    price: product.price || 0,
  };

  await fs.writeFile(
    path.join(productDir, 'meta.json'),
    JSON.stringify(metadata, null, 2),
    'utf-8'
  );

  tf.dispose([dataset.xs, dataset.ys]);
  model.dispose();

  console.log(
    `[SAVED] ${product.name} – validation loss: ${metadata.validationLoss}`
  );
  return metadata;
};

const run = async () => {
  await connectMongo();
  const products = await Product.find().sort({ name: 1 });
  const summaries = [];

  for (const product of products) {
    // eslint-disable-next-line no-await-in-loop
    const meta = await trainProductModel(product);
    if (meta) {
      summaries.push(meta);
    }
  }

  await mongoose.disconnect();

  console.log('\nTraining summary');
  console.table(
    summaries.map((meta) => ({
      product: meta.productName,
      samples: meta.trainingSamples,
      valLoss: meta.validationLoss,
      trainedAt: meta.trainedAt,
    }))
  );
};

run()
  .then(() => {
    console.log('Training finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Training failed:', error);
    process.exit(1);
  });

