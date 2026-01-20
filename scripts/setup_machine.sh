#!/bin/bash

# setup_machine.sh
# Script to setup the local environment for sgtl-ia

set -e

echo "Starting setup..."

# 1. Update apt
echo "Updating apt..."
sudo apt-get update

# 2. Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    sudo apt-get install -y docker.io docker-compose
    
    # Add user to docker group
    echo "Adding current user to docker group..."
    sudo usermod -aG docker $USER
    echo "NOTE: You will need to log out and log back in for docker group changes to take effect."
else
    echo "Docker already installed."
fi

# 3. Install Node.js and NPM if not present
if ! command -v node &> /dev/null; then
    echo "Installing Node.js and npm..."
    sudo apt-get install -y nodejs npm
else
    echo "Node.js already installed."
fi

# 4. Setup .env
if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo ".env created. Please update it with your API keys."
else
    echo ".env already exists."
fi

echo "Setup complete!"
echo "Please restart your session (logout/login) if you installed Docker for the first time."
echo "Then, run: docker-compose up -d --build"
