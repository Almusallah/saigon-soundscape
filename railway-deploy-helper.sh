#!/bin/bash

echo "SAIGON SOUND ARCHIVE - RAILWAY DEPLOYMENT HELPER"
echo "================================================"
echo ""
echo "This script will prepare and deploy the API for the Saigon Sound Archive app."
echo ""

# Create the deployment directory
mkdir -p railway-deploy
echo "Created railway-deploy directory."

# Copy the API file
cp railway-api.js railway-deploy/index.js
echo "Added API server code."

# Copy package files
cp package.json railway-deploy/
echo "Added package.json."

# Copy .env file (without sensitive data)
cat > railway-deploy/.env << 'END'
PORT=3000
NODE_ENV=production
END
echo "Created basic .env file."

# Create a README
cat > railway-deploy/README.md << 'END'
# Saigon Sound Archive API

Backend API for the Saigon Sound Archive project.

## Features
- Audio uploads and storage
- Recording information management
- CORS support for the frontend

## Deployment
This API is designed to be deployed on Railway.

## Created by Officine Gặp
END
echo "Added README.md."

# Create gitignore
cat > railway-deploy/.gitignore << 'END'
node_modules/
.env
uploads/*
!uploads/.gitkeep
END
echo "Added .gitignore."

# Create uploads directory
mkdir -p railway-deploy/uploads
touch railway-deploy/uploads/.gitkeep
echo "Created uploads directory."

echo ""
echo "Deployment package created successfully!"
echo ""
echo "Next steps:"
echo "1. cd railway-deploy"
echo "2. npm install"
echo "3. git init"
echo "4. git add ."
echo "5. git commit -m 'Initial commit'"
echo "6. Use Railway CLI or web interface to deploy"
echo ""
echo "Railway commands:"
echo "railway login"
echo "railway link"  # Link to existing project
echo "railway up"    # Deploy current directory
echo ""
echo "Or create a new project on Railway and push to it:"
echo "https://railway.app/new"
echo ""
