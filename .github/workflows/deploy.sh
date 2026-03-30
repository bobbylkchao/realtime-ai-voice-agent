#!/bin/bash

set -e

BRANCH=$1

if [ -z "$BRANCH" ]; then
  echo "❌ Error: Branch name is required"
  echo "Usage: bash deploy.sh <branch-name>"
  exit 1
fi

echo "🚀 Starting deployment..."
echo "🌿 Branch: $BRANCH"

echo "🧹 Cleaning local changes to ensure pure git tree..."
git fetch origin

echo "🔄 Resetting all local changes..."
git reset --hard HEAD

echo "🗑️  Removing untracked files..."
git clean -fd

echo "📥 Checking out branch: $BRANCH"
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"
git pull

echo "🔧 Installing dependencies..."
npm i

echo "🔨 Building..."
npm run build

echo "🔄 Managing service via pm2..."

if pm2 list 2>/dev/null | grep -q "realtime-agent-backend"; then
    echo "✅ Service exists, restarting..."
    pm2 restart realtime-agent-backend || {
        echo "⚠️  Warning: Failed to restart, trying delete and start fresh..."
        pm2 delete realtime-agent-backend 2>/dev/null || true
        pm2 start dist/index.js --name realtime-agent-backend || {
          echo "⚠️  Warning: Failed to start with dist/index.js, trying npm start..."
          pm2 start npm --name realtime-agent-backend -- start
        }
    }
else
    echo "🚀 Service not found, starting..."
    pm2 start dist/index.js --name realtime-agent-backend || {
      echo "⚠️  Warning: Failed to start with dist/index.js, trying npm start..."
      pm2 start npm --name realtime-agent-backend -- start
    }
fi

echo "📊 Verifying pm2 status..."
SERVICE_STATUS=$(pm2 list 2>/dev/null | grep "realtime-agent-backend" || echo "")

if [ -z "$SERVICE_STATUS" ]; then
    echo "❌ Error: 'realtime-agent-backend' not found in pm2"
    exit 1
fi

pm2 save

echo "📋 Service status:"
pm2 list 2>/dev/null | grep "realtime-agent-backend"

if echo "$SERVICE_STATUS" | grep -q "online"; then
    echo "✅ Service is running"
else
    echo "❌ Error: Service is not online"
    echo "$SERVICE_STATUS"
    exit 1
fi
