import { CorsOptions } from 'cors';

const corsOptions: CorsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://saigon-soundscape-officinegap.vercel.app',
      'http://localhost:3000'
    ];
    
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed for this origin'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Accept', 
    'Origin', 
    'X-Requested-With'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

export default corsOptions;
