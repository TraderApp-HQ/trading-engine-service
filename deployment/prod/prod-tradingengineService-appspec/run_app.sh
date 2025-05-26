#!/bin/bash
SERVICE=tradingengine
ENV=prod

cd /home/ec2-user/

CONTAINER_NAME=prod-tradingengineService

# Stop and remove the old container if it exists
if [ "$(sudo docker ps -aq -f name=$CONTAINER_NAME)" ]; then
  prod docker stop $CONTAINER_NAME
    sudo docker rm $CONTAINER_NAME
fi

# Authenticate with AWS ECR
aws ecr get-login-password --region eu-west-1 | sudo docker login --username AWS --password-stdin 575439814610.dkr.ecr.eu-west-1.amazonaws.com

# Pull the latest Docker image
sudo docker pull 575439814610.dkr.ecr.eu-west-prodonaws.com/prod-tradingengine-service:latest

# Run the new container with the same name
sudo docker run -d --name $CONTAINER_NAME -p 80:8080 \
  -e NODE_ENV=production -e SERVICE=prod-tradingengineService \
  --log-driver=awslogs --log-oprodlogs-region=eu-west-1 \
  --log-opt awslogs-group=/aws/ec2/prod-tradingengineService \
  --log-opt awprodcreate-group=true \
  575439814610.dkr.ecr.eu-west-1.amazonaws.com/prod-tradingengine-service:latest