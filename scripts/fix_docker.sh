#!/bin/bash

# fix_docker.sh
# Removes broken docker-compose (v1) and installs docker-compose-v2

echo "Fixing Docker Compose..."

# Remove the broken python-based docker-compose
if dpkg -l | grep -q docker-compose; then
    echo "Removing legacy docker-compose..."
    sudo apt-get remove -y docker-compose
fi

# Install the docker compose v2 plugin
echo "Installing docker-compose-v2..."
sudo apt-get update
sudo apt-get install -y docker-compose-v2

echo "Verifying installation..."
docker compose version

echo "Done! You should now use 'docker compose' (with a space) instead of 'docker-compose'."
