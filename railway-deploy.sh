#!/bin/bash
echo "This script prepares the necessary files for Railway deployment."
echo "After running this, you should manually deploy to Railway."

# Copy the CORS proxy to a suitable deployment folder
mkdir -p railway-deploy
cp cors-proxy.js railway-deploy/index.js
cp package.json railway-deploy/
cp .env railway-deploy/

echo "Files prepared in 'railway-deploy' folder."
echo "Next steps:"
echo "1. Install Railway CLI: npm install -g @railway/cli"
echo "2. Login to Railway: railway login"
echo "3. Link to your project: cd railway-deploy && railway link"
echo "4. Deploy: railway up"
