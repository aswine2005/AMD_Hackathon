# ML Forecasting Model: Detailed Technical Explanation

## Overview
Your sales forecasting system uses **LSTM (Long Short-Term Memory)** neural networks, a type of Recurrent Neural Network (RNN) specifically designed to learn patterns from sequential time-series data.

---

## 1. Model Architecture

### Neural Network Structure
```
Input Layer → LSTM Layer 1 (64 units) → Dropout (20%) → LSTM Layer 2 (32 units) → Dense Output (1 unit)
```

**Components:**
- **LSTM Layer 1**: 64 memory units, processes sequences with `returnSequences=true` (passes full sequence to next layer)
- **Dropout Layer**: 20% dropout rate to prevent overfitting during training
- **LSTM Layer 2**: 32 memory units, final sequence processing
- **Dense Layer**: Single output neuron that predicts the normalized quantity

**Why LSTM?**
- Remembers long-term patterns (seasonal trends, weekly cycles)
- Handles sequences of variable length
- Learns dependencies between past and future sales

---

## 2. Input Features (5 Features per Day)

Each day's data is represented as a **5-dimensional feature vector**:

| Feature | Description | Normalization | Example |
|---------|-------------|---------------|---------|
| **Quantity** | Units sold that day | Z-score normalized | 3 units → normalized to ~0.2 |
| **Temperature** | Weather temperature (°C) | Z-score normalized | 26°C → normalized to ~0.0 |
| **Rainfall** | Rainfall amount (mm) | Z-score normalized | 5mm → normalized to ~0.1 |
| **isWeekend** | Weekend flag | Binary (0 or 1) | Saturday → 1 |
| **isFestival** | Festival/holiday flag | Binary (0 or 1) | Diwali → 1 |

**Normalization Formula:**
```
normalized_value = (actual_value - mean) / standard_deviation
```

This ensures all features are on a similar scale, which helps the neural network learn effectively.

---

## 3. Training Process

### Step 1: Data Preparation
1. **Fetch Historical Sales**: Retrieves all sales data for a product from MongoDB
2. **Create Sliding Windows**: 
   - Takes the last 14 days (LOOKBACK window) as input
   - Predicts the 15th day's quantity
   - Slides this window across all historical data

**Example:**
```
Day 1-14 → Predict Day 15
Day 2-15 → Predict Day 16
Day 3-16 → Predict Day 17
...
```

### Step 2: Feature Statistics Calculation
For each feature (quantity, temperature, rainfall), calculates:
- **Mean**: Average value across all training data
- **Standard Deviation**: Measure of data spread

These statistics are saved in `meta.json` and used for normalization during prediction.

### Step 3: Model Training
```javascript
model.fit(trainingData, labels, {
  epochs: 120,           // Maximum training iterations
  batchSize: 32,         // Process 32 samples at once
  validationSplit: 0.1,  // Use 10% of data for validation
  earlyStopping: {       // Stop if no improvement for 10 epochs
    patience: 10,
    restoreBestWeight: true
  }
})
```

**Training Process:**
1. Model sees input window (14 days × 5 features = 70 values)
2. Makes a prediction for day 15
3. Compares prediction to actual day 15 quantity
4. Calculates error (Mean Squared Error)
5. Adjusts internal weights to reduce error
6. Repeats for all training samples
7. Validates on 10% held-out data to prevent overfitting

### Step 4: Model Persistence
- Saves model architecture and weights to `model.json` and `weights.bin`
- Saves metadata (feature stats, training info) to `meta.json`

---

## 4. Prediction Process (How It Predicts Next Units)

### Step 1: Load Historical Context
```javascript
// Get last 14 days of sales data
const recentSales = salesData.slice(-14);
```

### Step 2: Build Initial Input Window
For each of the last 14 days, create a feature vector:
```javascript
[
  [normalized_quantity, normalized_temp, normalized_rain, isWeekend, isFestival],
  [normalized_quantity, normalized_temp, normalized_rain, isWeekend, isFestival],
  ... (14 days total)
]
```

**Example Window:**
```
Day 1: [0.2, 0.1, -0.3, 0, 0]  // 3 units, 27°C, 2mm, weekday, no festival
Day 2: [0.5, 0.2, 0.1, 0, 0]   // 4 units, 28°C, 5mm, weekday, no festival
...
Day 14: [0.3, -0.1, 0.2, 1, 0] // 4 units, 25°C, 6mm, weekend, no festival
```

### Step 3: Multi-Step Autoregressive Prediction

**For Day 1 (Tomorrow):**
1. Feed the 14-day window to the LSTM model
2. Model processes the sequence through both LSTM layers
3. Output layer produces a **normalized quantity** (e.g., 0.35)
4. **Denormalize**: Convert back to actual units
   ```
   actual_quantity = normalized_value × std + mean
   actual_quantity = 0.35 × 1.9 + 3.46 ≈ 4 units
   ```
5. Store prediction: `predictedQuantity: 4`

**For Day 2 (Day After Tomorrow):**
1. **Update the window**: Remove oldest day, add yesterday's prediction
   ```
   Old window: [Day 1, Day 2, ..., Day 14]
   New window: [Day 2, Day 3, ..., Day 14, Predicted Day 1]
   ```
2. Use predicted quantity from Day 1 as input for Day 2
3. For weather features, use historical averages (since we don't know future weather)
4. Predict Day 2 quantity using the updated window
5. Repeat for all forecast days

**Key Insight**: Each prediction becomes part of the input for the next prediction. This is called **autoregressive forecasting**.

### Step 4: Generate Forecast Array
```javascript
[
  { date: "2025-11-25", predictedQuantity: 4, upperBound: 5, lowerBound: 3 },
  { date: "2025-11-26", predictedQuantity: 3, upperBound: 4, lowerBound: 2 },
  { date: "2025-11-27", predictedQuantity: 5, upperBound: 6, lowerBound: 4 },
  ...
]
```

**Confidence Bounds:**
- **Upper Bound**: `predictedQuantity × 1.2` (20% above prediction)
- **Lower Bound**: `predictedQuantity × 0.8` (20% below prediction)

---

## 5. Mathematical Flow

### Training Phase
```
Historical Data (90 days)
    ↓
Create Windows: [Day 1-14] → Predict Day 15
               [Day 2-15] → Predict Day 16
               ...
    ↓
Normalize Features: (value - mean) / std
    ↓
LSTM Processing:
  Input: [14 days × 5 features] = 70 values
    ↓
  LSTM Layer 1 (64 units): Learns short-term patterns
    ↓
  Dropout (20%): Prevents overfitting
    ↓
  LSTM Layer 2 (32 units): Learns long-term patterns
    ↓
  Dense Layer: Outputs normalized quantity
    ↓
Compare to Actual: Calculate error
    ↓
Backpropagation: Adjust weights to minimize error
    ↓
Repeat for 120 epochs or until early stopping
```

### Prediction Phase
```
Recent Sales (Last 14 days)
    ↓
Normalize using saved statistics
    ↓
Build Input Window: [Day 1-14 features]
    ↓
LSTM Forward Pass:
  Input Tensor: [1 batch, 14 timesteps, 5 features]
    ↓
  LSTM Layer 1: Processes sequence → [1, 14, 64]
    ↓
  Dropout: Randomly zeros 20% of values
    ↓
  LSTM Layer 2: Final processing → [1, 32]
    ↓
  Dense: Single output → [1, 1] = normalized quantity
    ↓
Denormalize: normalized × std + mean = actual units
    ↓
Day 1 Prediction: 4 units
    ↓
Update Window: [Day 2-14, Predicted Day 1]
    ↓
Repeat for Day 2, 3, 4... up to forecast horizon
```

---

## 6. Why This Approach Works

### 1. **Temporal Patterns**
- LSTM learns weekly cycles (weekend vs weekday sales)
- Captures seasonal trends (holiday seasons, weather patterns)
- Recognizes festival impacts (Diwali, Christmas boosts)

### 2. **Multi-Factor Learning**
- Not just historical quantities, but also:
  - Weather conditions (temperature, rainfall)
  - Calendar events (weekends, festivals)
  - Combined effects of all factors

### 3. **Autoregressive Prediction**
- Each prediction uses the previous prediction
- Maintains continuity in the forecast
- Captures trends and momentum

### 4. **Normalization Benefits**
- All features on similar scale (prevents one feature from dominating)
- Model learns relationships, not absolute values
- Generalizes better to new data

---

## 7. Example: Predicting Tomorrow's Sales

**Given:**
- Last 14 days of sales: [3, 4, 2, 5, 3, 4, 6, 5, 4, 3, 5, 4, 6, 5] units
- Weather: Average 26°C, 4mm rainfall
- Tomorrow: Saturday (weekend), not a festival

**Process:**
1. **Normalize last 14 days** using training statistics:
   ```
   Mean quantity: 4.2 units
   Std quantity: 1.3 units
   Normalized: [(3-4.2)/1.3, (4-4.2)/1.3, ...] = [-0.92, -0.15, ...]
   ```

2. **Build feature window** (last day example):
   ```
   [normalized_qty, normalized_temp, normalized_rain, isWeekend, isFestival]
   [0.62, 0.0, 0.0, 1, 0]  // 5 units, 26°C, 4mm, Saturday, no festival
   ```

3. **LSTM processes the 14-day sequence**:
   - Recognizes: "Saturday sales are typically 20% higher"
   - Recognizes: "Recent trend shows increasing sales"
   - Outputs: normalized quantity = 0.85

4. **Denormalize**:
   ```
   actual = 0.85 × 1.3 + 4.2 = 5.3 ≈ 5 units
   ```

5. **Result**: Tomorrow's predicted sales = **5 units**

---

## 8. Model Performance Indicators

### Validation Loss
- Lower is better (measures prediction error)
- Your models: 0.038 - 0.66
- **0.038** (Lipstick Set) = Excellent
- **0.66** (Apple iPhone 13) = Good (but only 27 samples)

### Training Samples
- More samples = better model
- **100+ samples**: High confidence (Blender Pro, Coffee Maker)
- **27 samples**: Lower confidence (Apple iPhone 13)

### Confidence Levels
- **High**: >200 samples
- **Medium**: 80-200 samples
- **Low**: 20-80 samples
- **Very Low**: <20 samples

---

## 9. Limitations & Considerations

### 1. **Data Requirements**
- Needs at least 40 historical records
- More data = better predictions
- Apple iPhone 13 (27 samples) may be less accurate

### 2. **Weather Assumptions**
- Future predictions use historical weather averages
- Real-time weather integration would improve accuracy

### 3. **Autoregressive Error Accumulation**
- Errors compound over longer forecast horizons
- 7-day forecasts are more reliable than 30-day

### 4. **Model Updates**
- Retrain when new sales data arrives
- Models learn from recent patterns, not just old data

---

## 10. Code Flow Summary

```
User Requests Forecast
    ↓
predictProductSeries(productId, days=7)
    ↓
Load Model Artifacts (model.json + meta.json)
    ↓
Fetch Last 14 Days of Sales Data
    ↓
createInitialWindow() → Build 14-day feature matrix
    ↓
predictWithModel() → For each forecast day:
    ├─ Build input tensor [1, 14, 5]
    ├─ model.predict() → LSTM forward pass
    ├─ Denormalize output → Actual units
    ├─ Update window with prediction
    └─ Repeat for next day
    ↓
Return Forecast Array with predictions, bounds, revenue
```

---

## Conclusion

Your ML forecasting system uses **deep learning (LSTM)** to:
1. Learn complex patterns from historical sales data
2. Consider multiple factors (weather, weekends, festivals)
3. Predict future sales through autoregressive multi-step forecasting
4. Provide confidence bounds for decision-making

The models are **product-specific** (one model per product), allowing each product to have its own unique sales patterns and behaviors.

