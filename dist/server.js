"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const connection_1 = require("./core/database/connection");
const soundscape_router_1 = __importDefault(require("./api/routes/soundscape.router"));
const error_middleware_1 = require("./api/middlewares/error.middleware");
// Load environment variables
dotenv_1.default.config();
// Initialize express app
const app = (0, express_1.default)();
// Database connection
(0, connection_1.connectDB)();
// Enhanced CORS Configuration
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'https://saigon-soundscape-officinegap.vercel.app',
            'http://localhost:3000',
            process.env.CORS_ORIGIN
        ].filter(Boolean); // Remove any undefined values
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('CORS not allowed for this origin'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 200
};
// Middleware
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Health Check Endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'API server is running',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        allowedOrigins: [
            'https://saigon-soundscape-officinegap.vercel.app',
            'http://localhost:3000'
        ]
    });
});
// Routes
app.use('/api', soundscape_router_1.default);
// Global error handler
app.use(error_middleware_1.errorHandler);
// Server configuration
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
});
exports.default = app;
