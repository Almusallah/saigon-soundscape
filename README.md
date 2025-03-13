# Saigon Sound Archive

A geospatial sound recording application for Ho Chi Minh City.

## Features

- Interactive map of Ho Chi Minh City
- Record and upload audio clips
- Tag recordings with geolocation data
- Browse and play recordings from other users
- Built-in storage status monitoring

## Setup

1. Clone the repository
2. Install dependencies with `npm install`
3. Create a `.env` file with your Backblaze B2 credentials (see `.env.example`)
4. Run `npm run dev` for development

## Environment Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `B2_APPLICATION_KEY_ID` - Backblaze B2 Key ID
- `B2_APPLICATION_KEY` - Backblaze B2 Application Key
- `B2_BUCKET_NAME` - Backblaze B2 Bucket Name
- `B2_BUCKET_ID` - Backblaze B2 Bucket ID
- `B2_ENDPOINT` - Backblaze B2 Endpoint URL

## Deployment

The application is deployed on Vercel (frontend) and Railway (backend).

## Technologies Used

- Frontend: HTML, CSS, JavaScript, Mapbox GL JS
- Backend: Node.js, Express
- Storage: Backblaze B2 Cloud Storage

## Created by

Officine Gặp - https://officinegap.com/
