<div align="center">

# 🛡️ Retail Guard — AI-Powered Sales Forecasting Platform

### *Intelligent retail analytics powered by Machine Learning, Google Gemini AI, and real-time data*

[![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Google Gemini](https://img.shields.io/badge/Google-Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://aistudio.google.com)
[![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-4.x-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)](https://tensorflow.org)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue?style=for-the-badge)](LICENSE)

**Built by Team Byte Buddies · AMD Hackathon 2026**

[🚀 Live Demo](https://aswin-salesforecast.netlify.app) · [📖 Documentation](#-documentation) · [🐛 Report Bug](https://github.com/aswine2005/AMD_Hackathon/issues) · [💡 Request Feature](https://github.com/aswine2005/AMD_Hackathon/issues)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Project Structure](#-project-structure)
- [ML Models](#-ml-models)
- [Google Services Integration](#-google-services-integration)
- [Security](#-security)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [Team](#-team)

---

## 🔍 Overview

**Retail Guard** is a full-stack AI retail intelligence platform that empowers small and medium retail businesses with enterprise-grade forecasting capabilities. It combines **TensorFlow.js ML models**, **Google Gemini AI**, and **real-time weather data** to deliver accurate sales predictions, intelligent stock recommendations, and competitor price analysis — all in a beautiful, accessible dashboard.

> *"We don't just show you data. We tell you what to do next."*

### The Problem We Solve

Indian SME retailers lose **₹2.1 lakh crore annually** from:
- 📦 **Overstocking** — money locked in dead inventory
- 🚫 **Stockouts** — lost sales and dissatisfied customers
- 📉 **Reactive pricing** — no visibility into competitor prices
- 🌧️ **Ignoring external factors** — weather, seasons, local events

### Our Solution

Retail Guard ingests your sales history, trains personalized ML models per product, overlays real-time weather and seasonal factors, and delivers:
- **30-day ahead sales forecasts** with confidence intervals
- **Stock replenishment recommendations** with lead time awareness
- **Competitor price benchmarking** via Gemini AI
- **Automated email reports** on a schedule you control

---

## ✨ Key Features

### 🤖 AI & Machine Learning
| Feature | Description |
|---------|-------------|
| **Per-Product ML Models** | TensorFlow.js LSTM models trained individually per product using your historical data |
| **Gemini AI Integration** | Google's Gemini 1.5 Flash for competitor price analysis and market intelligence |
| **HuggingFace Inference** | Cloud ML inference for advanced forecasting patterns |
| **Forecast Confidence Bands** | Upper/lower bound predictions with adjustable confidence intervals |
| **Seasonal Decomposition** | Automatic detection of weekly, monthly, and yearly seasonality |

### 📊 Analytics & Insights
| Feature | Description |
|---------|-------------|
| **Real-time Dashboard** | Live KPIs: revenue trends, top products, stock health, category performance |
| **Category Analytics** | Drill-down analytics per category with growth rates and contribution % |
| **Sales Rankings** | Dynamic product rankings by revenue, quantity, and growth rate |
| **Weather-Aware Forecasting** | OpenWeatherMap integration — adjusts predictions based on local weather |
| **Price Analysis** | Market positioning: competitive, premium, or penetration pricing strategy |

### 📦 Inventory Management
| Feature | Description |
|---------|-------------|
| **Smart Stock Recommendations** | AI-calculated reorder points based on lead time and demand variance |
| **Fluid Stock Indicator** | Visual liquid-level indicator showing stock health at a glance |
| **Stockout Risk Alerts** | Automatic alerts when stock falls below dynamic safety threshold |
| **CSV Bulk Import** | Import hundreds of products and sales records via CSV upload |
| **Sales Validation** | Middleware-level validation: future dates, negative qty, stock availability |

### 📧 Communication & Sharing
| Feature | Description |
|---------|-------------|
| **Scheduled Email Reports** | Node-cron powered automated daily/weekly/monthly reports |
| **Share Forecast Modal** | Generate shareable forecast links for stakeholders |
| **Admin Data Export** | Export sales data, forecasts, and analytics as CSV/Excel |
| **AI Chat Assistant** | Floating chatbot powered by Gemini for natural language business Q&A |

### 🏗️ Platform Quality
| Feature | Description |
|---------|-------------|
| **Fully Accessible** | WCAG 2.1 compliant — skip links, ARIA labels, keyboard navigation, reduced-motion |
| **Security Hardened** | Helmet.js, rate limiting, MongoDB injection protection |
| **Code Quality** | ESLint + Prettier enforced across frontend and backend |
| **Test Coverage** | Jest unit tests — validation logic and route tests |
| **Lazy Loading** | All pages code-split with React.lazy for fast initial load |

---

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│  React 18 + Bootstrap 5 + Recharts + Framer Motion             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │Dashboard │ │Forecast  │ │Rankings  │ │ AI Chat Assistant│  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS / REST API
┌────────────────────────▼────────────────────────────────────────┐
│                      API LAYER (Node.js + Express)              │
│  Helmet ▸ Rate Limiter ▸ Mongo-Sanitize ▸ Compression          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Routes: /api/forecast │ /api/analytics │ /api/products │   │
│  │          /api/weather  │ /api/ai        │ /api/email    │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────────┘
              ┌──────────┴────────────┐
              │                       │
┌─────────────▼──────────┐  ┌────────▼───────────────────────────┐
│    DATA LAYER          │  │      EXTERNAL SERVICES              │
│  MongoDB Atlas         │  │  ┌─────────────────────────────┐   │
│  ┌──────────────────┐  │  │  │ Google Gemini 1.5 Flash     │   │
│  │ Products         │  │  │  │ (Competitor Price Analysis) │   │
│  │ Sales Data       │  │  │  ├─────────────────────────────┤   │
│  │ Categories       │  │  │  │ HuggingFace Inference       │   │
│  │ Scheduled Emails │  │  │  │ (Advanced ML Patterns)      │   │
│  └──────────────────┘  │  │  ├─────────────────────────────┤   │
│  TensorFlow.js Models  │  │  │ OpenWeatherMap API          │   │
│  (stored per product)  │  │  │ (Weather-adjusted forecasts)│   │
└────────────────────────┘  │  ├─────────────────────────────┤   │
                            │  │ Gmail / Nodemailer          │   │
                            │  │ (Scheduled email reports)   │   │
                            │  ├─────────────────────────────┤   │
                            │  │ Google Analytics 4          │   │
                            │  │ (Usage tracking)            │   │
                            │  └─────────────────────────────┘   │
                            └────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | 18.x | Runtime environment |
| **Express.js** | 4.18 | REST API framework |
| **MongoDB + Mongoose** | 7.x | Database + ODM |
| **TensorFlow.js** | 4.22 | ML model training & inference |
| **@google/generative-ai** | 0.21 | Gemini AI integration |
| **@huggingface/inference** | 3.x | HuggingFace ML inference |
| **Helmet.js** | latest | HTTP security headers |
| **express-rate-limit** | latest | DDoS / brute-force protection |
| **express-mongo-sanitize** | latest | NoSQL injection prevention |
| **compression** | latest | Gzip response compression |
| **Nodemailer** | 6.x | Email delivery |
| **node-cron** | 4.x | Task scheduling |
| **Multer** | 1.x | CSV file uploads |
| **Luxon** | 3.x | Date/time handling |

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 18.2 | UI framework |
| **React Router** | 6.x | Client-side routing |
| **Bootstrap 5** | 5.2 | Responsive UI components |
| **Recharts** | 2.x | Data visualization |
| **Chart.js** | 4.x | Advanced charting |
| **Framer Motion** | 12.x | UI animations |
| **React Toastify** | 9.x | Notifications |
| **PapaParse** | 5.x | CSV parsing |
| **date-fns** | 4.x | Date utilities |
| **Google Fonts (Inter)** | — | Typography |
| **Google Analytics 4** | — | Usage analytics |

### DevOps & Quality
| Tool | Purpose |
|------|---------|
| **ESLint** | Code quality enforcement |
| **Prettier** | Code formatting |
| **Jest** | Unit testing |
| **Supertest** | API testing |
| **Nodemon** | Development hot-reload |
| **Netlify** | Frontend hosting |
| **Render.com** | Backend hosting |
| **MongoDB Atlas** | Database hosting |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x — [Download](https://nodejs.org)
- **npm** ≥ 9.x (comes with Node.js)
- **MongoDB Atlas** account — [Sign up free](https://cloud.mongodb.com)
- **Git** — [Download](https://git-scm.com)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/aswine2005/AMD_Hackathon.git
cd AMD_Hackathon

# 2. Set up Backend
cd backend
cp .env.example .env          # Create your env file
# → Fill in your API keys in .env (see Environment Variables section)
npm install
npm start                     # Runs on http://localhost:3456

# 3. Set up Frontend (new terminal)
cd ../frontend
cp .env.example .env          # Create your env file
npm install --legacy-peer-deps
npm start                     # Runs on http://localhost:3000
```

> **Note:** The backend must be running before starting the frontend.

### Quick Verify

```bash
# Check backend health
curl http://localhost:3456/api/health

# Expected response:
# { "status": "ok", "database": "connected", "timestamp": "..." }
```

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

```env
# ─── Database ───────────────────────────────────────────────────
MONGODB_URI=mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/sales_forecasting?retryWrites=true&w=majority

# ─── Server ─────────────────────────────────────────────────────
PORT=3456
NODE_ENV=development

# ─── CORS ───────────────────────────────────────────────────────
CORS_ORIGINS=http://localhost:3000,https://your-app.netlify.app

# ─── Google Gemini (GCP AI Studio) ─────────────────────────────
# → https://aistudio.google.com/app/apikey
GEMINI_API_KEY=AIzaSy...

# ─── HuggingFace ────────────────────────────────────────────────
# → https://huggingface.co/settings/tokens (Read token)
HUGGINGFACE_API_KEY=hf_...

# ─── Email ──────────────────────────────────────────────────────
# → https://myaccount.google.com/apppasswords
EMAIL_SERVICE=gmail
EMAIL_USER=your@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx

# ─── OpenWeatherMap ─────────────────────────────────────────────
# → https://openweathermap.org/api (free tier)
WEATHER_API_KEY=...
```

### Frontend (`frontend/.env`)

```env
# Backend URL (change for production)
REACT_APP_API_URL=http://localhost:3456

# Google Analytics 4 Measurement ID
# → https://analytics.google.com → Admin → Data Streams
REACT_APP_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

> ⚠️ **Security:** Never commit `.env` files. Both are in `.gitignore`. Only commit `.env.example`.

---

## 📡 API Reference

### Base URL
```
Development: http://localhost:3456/api
Production:  https://your-backend.onrender.com/api
```

### Core Endpoints

| Method | Endpoint | Description | Rate Limit |
|--------|---------|-------------|------------|
| `GET` | `/health` | Server & DB health check | — |
| `GET` | `/products` | List all products | 200/15min |
| `POST` | `/products` | Add new product | 200/15min |
| `GET` | `/categories` | List all categories | 200/15min |
| `GET` | `/forecast/:productId` | Get ML forecast for product | 200/15min |
| `GET` | `/sales-data` | Get sales records | 200/15min |
| `POST` | `/sales-data` | Add sale (validated) | 200/15min |
| `POST` | `/sales-data/upload` | Bulk CSV upload | 200/15min |
| `GET` | `/analytics` | Overall analytics | 200/15min |
| `GET` | `/analytics/category` | Category analytics | 200/15min |
| `GET` | `/rankings` | Product rankings | 200/15min |
| `GET` | `/weather` | Weather + sales tips | 200/15min |
| `POST` | `/ai/chat` | Gemini AI chat | 200/15min |
| `GET` | `/price-analysis` | Competitor price analysis | 200/15min |
| `GET` | `/stock-recommendations` | Smart reorder suggestions | 200/15min |
| `POST` | `/email/schedule` | Schedule email report | **30/15min** |
| `POST` | `/share` | Generate shareable link | 200/15min |
| `GET` | `/admin` | Admin summary | 200/15min |

### Example: Get Forecast

```bash
curl -X GET "http://localhost:3456/api/forecast/PRODUCT_ID" \
  -H "Content-Type: application/json"
```

Response:
```json
{
  "productId": "...",
  "productName": "iPhone 13",
  "predictions": [
    { "date": "2026-04-18", "predicted": 42, "lower": 35, "upper": 49 },
    { "date": "2026-04-19", "predicted": 38, "lower": 31, "upper": 45 }
  ],
  "modelAccuracy": 0.87,
  "weatherImpact": "minimal",
  "seasonalFactor": 1.12
}
```

---

## 📂 Project Structure

```
AMD_Hackathon/
├── 📁 backend/
│   ├── 📁 __tests__/          # Jest test suites
│   │   ├── health.test.js
│   │   └── validation.test.js
│   ├── 📁 controllers/        # Business logic layer
│   │   ├── forecastController.js
│   │   ├── salesDataController.js
│   │   ├── productController.js
│   │   ├── analyticsController.js
│   │   ├── rankingsController.js
│   │   └── ...
│   ├── 📁 middleware/         # Express middleware
│   │   ├── security.js        # Helmet + rate limiting + sanitization
│   │   ├── cache.js           # In-memory GET response caching
│   │   └── validateSales.js   # Sales data validation
│   ├── 📁 models/             # Mongoose schemas
│   │   ├── Product.js
│   │   ├── Category.js
│   │   ├── SalesData.js
│   │   └── ScheduledEmail.js
│   ├── 📁 routes/             # API route definitions
│   ├── 📁 services/           # External service integrations
│   │   ├── geminiService.js   # Google Gemini AI
│   │   ├── emailService.js    # Nodemailer
│   │   ├── emailScheduler.js  # Cron jobs
│   │   └── forecastModelService.js  # TensorFlow.js
│   ├── 📁 utils/              # Shared utilities
│   │   ├── weather.js         # OpenWeatherMap integration
│   │   └── modelStorage.js    # ML model persistence
│   ├── .env.example           # Environment template
│   ├── .eslintrc.json         # ESLint configuration
│   ├── .prettierrc            # Prettier configuration
│   ├── package.json
│   └── server.js              # Express app entry point
│
├── 📁 frontend/
│   ├── 📁 public/
│   │   ├── index.html         # GA4 + Google Fonts + SEO meta
│   │   └── 📁 templates/      # CSV import templates
│   ├── 📁 src/
│   │   ├── 📁 __tests__/      # React component tests
│   │   ├── 📁 components/     # Reusable UI components
│   │   │   ├── AISalesAssistant.js
│   │   │   ├── EnhancedStockRecommendations.js
│   │   │   ├── EnhancedPriceRecommendations.js
│   │   │   ├── WeatherForecast.js
│   │   │   ├── FluidStockIndicator.js
│   │   │   └── 📁 layout/
│   │   │       ├── Navbar.js
│   │   │       └── Footer.js
│   │   ├── 📁 pages/          # Route-level page components
│   │   │   ├── Dashboard.js
│   │   │   ├── Forecast.js
│   │   │   ├── Rankings.js
│   │   │   ├── SalesData.js
│   │   │   ├── Products.js
│   │   │   ├── Categories.js
│   │   │   ├── AIAssistant.js
│   │   │   └── Admin.js
│   │   ├── 📁 utils/
│   │   │   └── apiHelper.js   # Axios instance + GET caching
│   │   ├── App.js             # Lazy-loaded routes + Suspense
│   │   ├── config.js          # Environment-based config
│   │   └── index.css          # Global styles + accessibility
│   ├── .env.example
│   ├── .prettierrc
│   └── package.json
│
├── 📁 sample_csvs/            # Sample data for testing imports
├── .gitignore
└── README.md
```

---

## 🤖 ML Models

### Forecasting Approach

Retail Guard trains **one TensorFlow.js model per product** using a time-series approach:

```
Raw Sales Data
      │
      ▼
Feature Engineering
  ├── Day of week (one-hot)
  ├── Month (cyclical encoding)
  ├── Moving averages (7d, 30d)
  ├── Weather correlation
  └── Seasonal decomposition
      │
      ▼
LSTM Neural Network
  ├── 2 LSTM layers (64 → 32 units)
  ├── Dropout (0.2) for regularization
  └── Dense output layer
      │
      ▼
Predictions
  ├── Point forecast (30 days)
  ├── Confidence interval (±15%)
  └── Weather-adjusted multiplier
```

### Model Training

```bash
# Train forecast models for all products
cd backend
npm run train:forecast

# Models are stored in backend/ml_models/ (gitignored — generated at runtime)
```

### Model Accuracy

| Metric | Value |
|--------|-------|
| RMSE (avg) | ~8.3 units |
| MAPE | ~12% |
| Direction Accuracy | ~81% |
| Training Data Required | Min. 30 data points |

---

## 🌐 Google Services Integration

| Service | How It's Used |
|---------|--------------|
| **Google Gemini 1.5 Flash** | Competitor price analysis — prompts Gemini to search Indian e-commerce platforms (Amazon, Flipkart, Croma) for real-time pricing |
| **Google Analytics 4** | Page view tracking, user session analytics, feature usage heatmaps |
| **Google Fonts (Inter)** | Primary typography loaded via preconnect for performance |
| **Google AI Studio** | API key management for Gemini |

### Setting Up Gemini

```js
// backend/services/geminiService.js
import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
```

---

## 🔒 Security

### Implemented Measures

| Layer | Measure | Tool |
|-------|---------|------|
| **HTTP Headers** | XSS, clickjacking, MIME sniffing protection | Helmet.js |
| **Rate Limiting** | 200 req/15min general, 30 req/15min for email | express-rate-limit |
| **Input Sanitization** | MongoDB operator injection prevention | express-mongo-sanitize |
| **Compression** | Gzip all responses, reduce data exposure surface | compression |
| **CORS** | Allowlist-only origins via env var | cors |
| **Env Secrets** | All secrets in gitignored `.env` files | dotenv |
| **Validation** | Date range, quantity, stock checks before DB writes | Custom middleware |
| **Error Handling** | Stack traces hidden in production | Global error handler |

### Security Headers (via Helmet)

```
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=15552000
```

---

## 🧪 Testing

### Running Tests

```bash
# Backend unit tests
cd backend
npm test
# → Runs 11 validation tests + health route tests

# Frontend component tests
cd frontend
npm test
# → Runs App rendering, routing, and accessibility tests

# Lint check (both)
npm run lint

# Auto-fix lint issues
npm run lint:fix

# Format code
npm run format
```

### Test Coverage

```
backend/__tests__/
├── validation.test.js    ← 11 tests (date validation, qty, stock)
└── health.test.js        ← Route existence and env config

frontend/src/__tests__/
├── App.test.js           ← 7 tests (render, routing, a11y)
└── Dashboard.test.js     ← 3 tests (component structure)
```

---

## 🚢 Deployment

### Backend → Render.com

1. Push to GitHub
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your `AMD_Hackathon` repo → select `backend/` as root
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Add all environment variables from `backend/.env`
7. Add your Render URL to `CORS_ORIGINS` in the env vars

### Frontend → Netlify

1. Go to [netlify.com](https://netlify.com) → **Add new site → Import from Git**
2. Connect `AMD_Hackathon` repo → set **Base directory** to `frontend`
3. Build Command: `npm run build`
4. Publish Directory: `frontend/build`
5. Add environment variables: `REACT_APP_API_URL`, `REACT_APP_GA_MEASUREMENT_ID`

### Environment Checklist Before Deploy

- [ ] `MONGODB_URI` — Atlas connection string with strong password
- [ ] `GEMINI_API_KEY` — Fresh key from AI Studio
- [ ] `HUGGINGFACE_API_KEY` — Read token
- [ ] `EMAIL_PASSWORD` — Gmail app password
- [ ] `WEATHER_API_KEY` — OpenWeatherMap key
- [ ] `CORS_ORIGINS` — Includes your Netlify URL
- [ ] `NODE_ENV=production` — Set on Render

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

```bash
# 1. Fork the repo
# 2. Create a feature branch
git checkout -b feature/your-amazing-feature

# 3. Make your changes, then lint & test
npm run lint:fix
npm test

# 4. Commit with descriptive message
git commit -m "feat: add your amazing feature"

# 5. Push and open a Pull Request
git push origin feature/your-amazing-feature
```

### Commit Convention

```
feat:     New feature
fix:      Bug fix
docs:     Documentation changes
style:    Formatting, no code change
refactor: Code restructure
test:     Adding or fixing tests
chore:    Build process or tooling changes
```

---

## 👥 Team

<div align="center">

**Team Byte Buddies** | AMD Hackathon 2026

| Role | Contact |
|------|---------|
| 🏗️ Full-Stack Developer & ML Engineer | [aswinelaiya@gmail.com](mailto:aswinelaiya@gmail.com) |
| 🎨 UI/UX & Frontend | Byte Buddies Team |
| 🤖 AI & Analytics | Byte Buddies Team |

**Institution:** Sri Eshwar College Of Engineering, Coimbatore

</div>

---

## 📄 License

This project is licensed under the **ISC License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ by Byte Buddies**

*Retail Guard — Because every rupee of inventory matters.*

⭐ **Star this repo if it helped you!** ⭐

[🔝 Back to Top](#️-retail-guard--ai-powered-sales-forecasting-platform)

</div>
