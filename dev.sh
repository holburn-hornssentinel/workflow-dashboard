#!/bin/bash

# Auto-restart development server wrapper
# This script will automatically restart the dev server when it exits

while true; do
  echo "Starting development server..."
  npm run dev

  EXIT_CODE=$?

  # If exit code is 0, it was a clean shutdown (restart requested)
  # Otherwise, it was an error and we should stop
  if [ $EXIT_CODE -ne 0 ]; then
    echo "Server exited with error code $EXIT_CODE. Stopping."
    break
  fi

  echo "Restarting in 2 seconds..."
  sleep 2
done
