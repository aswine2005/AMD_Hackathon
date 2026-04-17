# Computer Vision Implementation Guide
## Customer Behavior Analytics from Security Cameras

---

## Overview

This document outlines the technical implementation of the computer vision module that analyzes customer behavior from existing security cameras and correlates it with billing data.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Security Camera Network                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Camera 1 │  │ Camera 2 │  │ Camera 3 │  │ Camera N │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │            │            │            │            │
│       └────────────┴────────────┴────────────┘            │
│                      │                                      │
│                      ▼                                      │
│         ┌──────────────────────────┐                        │
│         │  Video Stream Processor  │                        │
│         │  (RTSP/WebRTC Handler)   │                        │
│         └────────────┬─────────────┘                        │
└──────────────────────┼──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│         Computer Vision Processing Service                   │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Frame Extraction (FFmpeg)                            │ │
│  │  - Extract frames at 1-2 FPS for efficiency          │ │
│  │  - Timestamp each frame                               │ │
│  └──────────────────┬─────────────────────────────────────┘ │
│                     │                                        │
│                     ▼                                        │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Object Detection (YOLO/TensorFlow.js)                │ │
│  │  - Detect humans in frame                             │ │
│  │  - Assign unique tracking IDs                         │ │
│  │  - Track across frames                                │ │
│  └──────────────────┬─────────────────────────────────────┘ │
│                     │                                        │
│                     ▼                                        │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Interaction Detection                               │ │
│  │  - Detect hand movements near products                │ │
│  │  - Identify product shelf locations                   │ │
│  │  - Measure dwell time at locations                    │ │
│  └──────────────────┬─────────────────────────────────────┘ │
│                     │                                        │
│                     ▼                                        │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Behavior Analytics Engine                            │ │
│  │  - Calculate interaction metrics                      │ │
│  │  - Generate behavior events                           │ │
│  │  - Store in MongoDB                                   │ │
│  └──────────────────┬─────────────────────────────────────┘ │
└──────────────────────┼──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│         Correlation Engine                                    │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Temporal Alignment                                   │ │
│  │  - Match behavior timestamps with transaction times  │ │
│  │  - Create time-windowed correlations                  │ │
│  └──────────────────┬─────────────────────────────────────┘ │
│                     │                                        │
│                     ▼                                        │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Conversion Analysis                                  │ │
│  │  - Calculate interaction-to-purchase rates            │ │
│  │  - Identify high-interest, low-conversion products   │ │
│  └──────────────────┬─────────────────────────────────────┘ │
│                     │                                        │
│                     ▼                                        │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Insights Generation                                 │ │
│  │  - Product placement recommendations                  │ │
│  │  - Pricing optimization suggestions                  │ │
│  │  - Marketing opportunity identification              │ │
│  └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Details

### 1. Video Stream Processing

#### Technology Stack
- **FFmpeg**: Video decoding and frame extraction
- **Node.js Streams**: Handle video data efficiently
- **RTSP Client**: Connect to IP cameras
- **WebRTC**: Alternative for browser-based streaming

#### Code Structure
```javascript
// backend/services/videoProcessor.js
import ffmpeg from 'fluent-ffmpeg';
import { spawn } from 'child_process';

class VideoStreamProcessor {
  constructor(cameraUrl, cameraId) {
    this.cameraUrl = cameraUrl; // RTSP URL
    this.cameraId = cameraId;
    this.frameRate = 1; // Extract 1 frame per second
  }

  async startProcessing() {
    // Extract frames from video stream
    const command = ffmpeg(this.cameraUrl)
      .outputOptions([
        '-vf', 'fps=1', // 1 frame per second
        '-q:v', '2'    // High quality
      ])
      .format('image2')
      .on('end', () => console.log('Frame extraction complete'))
      .on('error', (err) => console.error('Error:', err));

    // Process each frame
    command.on('frame', (frame) => {
      this.processFrame(frame, Date.now());
    });
  }

  async processFrame(frameBuffer, timestamp) {
    // Send frame to object detection service
    const detectionResult = await this.detectObjects(frameBuffer);
    await this.trackCustomers(detectionResult, timestamp);
  }
}
```

### 2. Object Detection & Tracking

#### Technology Options

**Option A: TensorFlow.js (Recommended for JavaScript)**
```javascript
// backend/services/objectDetection.js
import * as tf from '@tensorflow/tfjs-node';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

class ObjectDetector {
  constructor() {
    this.model = null;
  }

  async loadModel() {
    this.model = await cocoSsd.load({
      base: 'mobilenet_v2',
      modelUrl: 'https://tfhub.dev/tensorflow/tfjs-model/ssd_mobilenet_v2/1/default/1'
    });
  }

  async detectHumans(frameBuffer) {
    const predictions = await this.model.detect(frameBuffer);
    
    // Filter for person class (class ID: 0 in COCO dataset)
    const humans = predictions.filter(p => p.class === 'person');
    
    return humans.map(human => ({
      bbox: human.bbox, // [x, y, width, height]
      confidence: human.score,
      timestamp: Date.now()
    }));
  }
}
```

**Option B: YOLO (More Accurate, Requires Python Service)**
```python
# python_service/yolo_detector.py
from ultralytics import YOLO
import cv2
import numpy as np

class YOLODetector:
    def __init__(self):
        self.model = YOLO('yolov8n.pt')  # Nano model for speed
    
    def detect(self, frame):
        results = self.model(frame)
        humans = []
        
        for result in results:
            boxes = result.boxes
            for box in boxes:
                if box.cls == 0:  # Class 0 = person
                    humans.append({
                        'bbox': box.xyxy[0].tolist(),
                        'confidence': float(box.conf),
                        'timestamp': time.time()
                    })
        
        return humans
```

#### Customer Tracking
```javascript
// backend/services/customerTracker.js
class CustomerTracker {
  constructor() {
    this.activeTracks = new Map(); // trackId -> customer data
    this.nextTrackId = 1;
  }

  track(frameDetections, timestamp) {
    const tracked = [];
    
    for (const detection of frameDetections) {
      // Find closest existing track
      const matchedTrack = this.findClosestTrack(detection);
      
      if (matchedTrack) {
        // Update existing track
        matchedTrack.update(detection, timestamp);
        tracked.push(matchedTrack);
      } else {
        // Create new track
        const newTrack = new CustomerTrack(this.nextTrackId++, detection, timestamp);
        this.activeTracks.set(newTrack.id, newTrack);
        tracked.push(newTrack);
      }
    }
    
    // Remove lost tracks (not seen for 5 seconds)
    this.cleanupLostTracks(timestamp);
    
    return tracked;
  }

  findClosestTrack(detection) {
    let closest = null;
    let minDistance = Infinity;
    
    for (const track of this.activeTracks.values()) {
      const distance = this.calculateIoU(detection.bbox, track.lastBbox);
      if (distance < minDistance && distance < 0.5) { // IoU threshold
        minDistance = distance;
        closest = track;
      }
    }
    
    return closest;
  }
}
```

### 3. Interaction Detection

#### Product Shelf Mapping
```javascript
// backend/services/interactionDetector.js
class InteractionDetector {
  constructor(storeLayout) {
    // Store layout: Map of shelf regions to product IDs
    // Format: { shelfId: { x, y, width, height, productIds: [...] } }
    this.storeLayout = storeLayout;
  }

  detectInteractions(customerTracks, frame) {
    const interactions = [];
    
    for (const track of customerTracks) {
      // Get hand position (using pose estimation or hand detection)
      const handPosition = this.estimateHandPosition(track);
      
      // Check if hand is near any product shelf
      const nearbyShelf = this.findNearbyShelf(handPosition);
      
      if (nearbyShelf) {
        // Check if hand is reaching/picking (gesture detection)
        const gesture = this.detectGesture(track);
        
        if (gesture === 'reaching' || gesture === 'picking') {
          interactions.push({
            customerId: track.id,
            shelfId: nearbyShelf.id,
            productIds: nearbyShelf.productIds,
            timestamp: Date.now(),
            interactionType: gesture,
            duration: track.dwellTime
          });
        }
      }
    }
    
    return interactions;
  }

  estimateHandPosition(track) {
    // Use MediaPipe or pose estimation to find hand keypoints
    // Simplified: use center of bounding box as approximation
    return {
      x: track.lastBbox[0] + track.lastBbox[2] / 2,
      y: track.lastBbox[1] + track.lastBbox[3] / 2
    };
  }
}
```

### 4. Behavior-Sales Correlation

#### Temporal Alignment
```javascript
// backend/services/correlationEngine.js
import SalesData from '../models/SalesData.js';
import CustomerBehavior from '../models/CustomerBehavior.js';

class CorrelationEngine {
  async correlateBehaviorWithSales(behaviorData, timeWindow = 300000) {
    // timeWindow: 5 minutes (300000 ms)
    // Match interactions with purchases within this window
    
    const correlations = [];
    
    for (const interaction of behaviorData) {
      const interactionTime = new Date(interaction.timestamp);
      const windowStart = new Date(interactionTime.getTime() - timeWindow);
      const windowEnd = new Date(interactionTime.getTime() + timeWindow);
      
      // Find sales in the time window
      const sales = await SalesData.find({
        date: { $gte: windowStart, $lte: windowEnd },
        productId: { $in: interaction.productIds }
      });
      
      if (sales.length > 0) {
        correlations.push({
          interactionId: interaction._id,
          salesIds: sales.map(s => s._id),
          productIds: interaction.productIds,
          conversionRate: sales.length / interaction.productIds.length,
          timeToPurchase: this.calculateTimeToPurchase(interaction, sales)
        });
      }
    }
    
    return correlations;
  }

  async generateInsights(productId) {
    // Get all interactions for this product
    const interactions = await CustomerBehavior.find({
      productIds: productId
    });
    
    // Get all sales for this product
    const sales = await SalesData.find({ productId });
    
    // Calculate metrics
    const totalInteractions = interactions.length;
    const totalSales = sales.length;
    const conversionRate = totalSales / totalInteractions;
    
    // Identify patterns
    const peakInteractionTimes = this.findPeakTimes(interactions);
    const peakSalesTimes = this.findPeakTimes(sales);
    
    // Generate recommendations
    const insights = {
      productId,
      conversionRate,
      totalInteractions,
      totalSales,
      peakInteractionTimes,
      peakSalesTimes,
      recommendations: this.generateRecommendations(
        conversionRate,
        peakInteractionTimes,
        peakSalesTimes
      )
    };
    
    return insights;
  }

  generateRecommendations(conversionRate, interactionTimes, salesTimes) {
    const recommendations = [];
    
    // Low conversion rate = high interest but low purchase
    if (conversionRate < 0.3) {
      recommendations.push({
        type: 'pricing',
        message: 'High customer interest but low conversion. Consider promotional pricing or bundle deals.',
        priority: 'high'
      });
      
      recommendations.push({
        type: 'placement',
        message: 'Product attracts attention. Consider moving to high-traffic area or checkout counter.',
        priority: 'medium'
      });
    }
    
    // Time mismatch: interactions peak at different times than sales
    if (this.hasTimeMismatch(interactionTimes, salesTimes)) {
      recommendations.push({
        type: 'staffing',
        message: 'Peak interaction times differ from sales times. Adjust staff scheduling.',
        priority: 'medium'
      });
    }
    
    return recommendations;
  }
}
```

### 5. Data Models

#### MongoDB Schemas
```javascript
// backend/models/CustomerBehavior.js
const CustomerBehaviorSchema = new mongoose.Schema({
  cameraId: {
    type: String,
    required: true
  },
  customerTrackId: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  location: {
    x: Number,
    y: Number,
    shelfId: String
  },
  interactionType: {
    type: String,
    enum: ['viewing', 'reaching', 'picking', 'examining', 'returning']
  },
  productIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  dwellTime: {
    type: Number, // milliseconds
    default: 0
  },
  converted: {
    type: Boolean,
    default: false
  },
  relatedSaleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale'
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
CustomerBehaviorSchema.index({ timestamp: 1, productIds: 1 });
CustomerBehaviorSchema.index({ customerTrackId: 1, timestamp: 1 });
```

### 6. API Endpoints

```javascript
// backend/routes/visionRoutes.js
import express from 'express';
const router = express.Router();

// Analyze video frame
router.post('/analyze', async (req, res) => {
  const { frame, cameraId, timestamp } = req.body;
  
  // Process frame
  const detections = await objectDetector.detect(frame);
  const tracks = await customerTracker.track(detections, timestamp);
  const interactions = await interactionDetector.detectInteractions(tracks);
  
  // Store in database
  await CustomerBehavior.insertMany(interactions);
  
  res.json({ success: true, interactions });
});

// Get behavior analytics for a date
router.get('/behavior/:date', async (req, res) => {
  const { date } = req.params;
  const startDate = new Date(date);
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + 1);
  
  const behaviors = await CustomerBehavior.find({
    timestamp: { $gte: startDate, $lt: endDate }
  });
  
  // Aggregate analytics
  const analytics = {
    totalInteractions: behaviors.length,
    uniqueCustomers: new Set(behaviors.map(b => b.customerTrackId)).size,
    peakHours: calculatePeakHours(behaviors),
    topProducts: calculateTopProducts(behaviors),
    averageDwellTime: calculateAverageDwellTime(behaviors)
  };
  
  res.json(analytics);
});

// Correlate behavior with sales
router.post('/correlate', async (req, res) => {
  const { productId, startDate, endDate } = req.body;
  
  const behaviors = await CustomerBehavior.find({
    productIds: productId,
    timestamp: { $gte: startDate, $lte: endDate }
  });
  
  const correlations = await correlationEngine.correlateBehaviorWithSales(behaviors);
  const insights = await correlationEngine.generateInsights(productId);
  
  res.json({ correlations, insights });
});
```

---

## Privacy & Compliance

### Anonymization Strategy
1. **No Facial Recognition**: Only detect human presence, not identity
2. **Track IDs**: Use temporary session IDs, not persistent identifiers
3. **Aggregated Data**: Store only aggregated metrics, not individual paths
4. **Data Retention**: Auto-delete raw video frames after processing
5. **Consent**: Display notice about analytics (if required by law)

### Implementation
```javascript
// Anonymize customer tracks
function anonymizeTrack(track) {
  return {
    trackId: generateTemporaryId(), // Not linked to person
    bbox: track.bbox,
    timestamp: track.timestamp,
    // No personal identifiers
  };
}
```

---

## Performance Optimization

### 1. Frame Rate Reduction
- Process 1-2 FPS instead of full video frame rate
- Sufficient for behavior analysis while reducing computation

### 2. Edge Processing
- Run detection on edge devices (Raspberry Pi, Jetson Nano)
- Send only metadata to cloud, not raw video

### 3. Batch Processing
- Process frames in batches
- Use worker threads for parallel processing

### 4. Caching
- Cache model weights
- Cache store layout data
- Cache recent detections

---

## Testing & Validation

### 1. Accuracy Testing
- Manual annotation of test videos
- Compare detected interactions with ground truth
- Measure precision and recall

### 2. Correlation Validation
- Compare correlation results with known sales data
- Validate time window selection
- Test with different store layouts

### 3. Performance Testing
- Measure processing time per frame
- Test with multiple concurrent cameras
- Monitor memory usage

---

## Deployment Considerations

### 1. Camera Compatibility
- Support RTSP, HTTP, and WebRTC protocols
- Handle different resolutions and frame rates
- Manage network bandwidth

### 2. Scalability
- Horizontal scaling for multiple stores
- Load balancing for video processing
- Database sharding for large datasets

### 3. Reliability
- Handle camera disconnections gracefully
- Queue frames for processing during downtime
- Implement retry logic for failed detections

---

## Future Enhancements

1. **Real-Time Alerts**: Notify staff of high-traffic areas
2. **Heat Maps**: Visualize customer movement patterns
3. **Queue Detection**: Identify checkout queue lengths
4. **Staff Analytics**: Track staff efficiency and customer service
5. **Multi-Camera Fusion**: Combine views from multiple cameras for better tracking

---

**Version**: 1.0  
**Last Updated**: 2024

