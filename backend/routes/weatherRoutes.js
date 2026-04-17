import express from 'express';
import {
    getCurrentWeather,
    getWeatherForecast
} from '../controllers/weatherController.js';

const router = express.Router();

// GET current weather for a location
router.get('/current', getCurrentWeather);

// GET weather forecast for a location
router.get('/forecast', getWeatherForecast);

export default router;
