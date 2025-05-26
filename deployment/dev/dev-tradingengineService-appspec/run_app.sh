#!/bin/bash
SERVICE=tradingengine
ENV=dev

cd /home/ec2-user/

CONTAINER_NAME=dev-tradingengineService

# Stop and remove the old container if it exists
if [ "$(sudo docker ps -aq -f name=$CONTAINER_NAME)" ]; then
    sudo docker stop $CONTAINER_NAME
    sudo docker rm $CONTAINER_NAME
fi

# Authenticate with AWS ECR
aws ecr get-login-password --region eu-west-1 | sudo docker login --username AWS --password-stdin 575439814610.dkr.ecr.eu-west-1.amazonaws.com

# Pull the latest Docker image
sudo docker pull 575439814610.dkr.ecr.eu-west-1.amazonaws.com/dev-tradingengine-service:latest

# Run the new container with the same name
sudo docker run -d --name $CONTAINER_NAME -p 80:8080 \
  -e NODE_ENV=development -e SERVICE=dev-tradingengineService \
  --log-driver=awslogs --log-opt awslogs-region=eu-west-1 \
  --log-opt awslogs-group=/aws/ec2/dev-tradingengineService \
  --log-opt awslogs-create-group=true \
  575439814610.dkr.ecr.eu-west-1.amazonaws.com/dev-tradingengine-service:latest