// Copy this entire file to your Railway backend

const express = require('express');
const cors = require('cors');
const app = express();

// Configure CORS properly
app.use(cors({
  origin: [
    'https://saigon-soundscape-officinegap.vercel.app',
    'https://saigon-soundscape.vercel.app',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Add this before your routes
app.options('*', cors()); // Enable pre-flight for all routes

console.log('CORS configured to allow Vercel frontend');

// Rest of your server code...
