#!/bin/bash
SERVICE=assets
ENV=dev

cd /home/ec2-user/

# Stop the running Docker container
sudo docker rm $(sudo docker stop $(sudo docker ps -a -q --filter ancestor=575439814610.dkr.ecr.eu-west-1.amazonaws.com/$ENV-$SERVICE-service:latest --format="{{.ID}}"))

# Authenticate with AWS ECR
aws ecr get-login-password --region eu-west-1 | sudo docker login --username AWS --password-stdin 575439814610.dkr.ecr.eu-west-1.amazonaws.com

# Pull the latest Docker image
sudo docker pull 575439814610.dkr.ecr.eu-west-1.amazonaws.com/$ENV-$SERVICE-service:latest

# Run the newly pulled image
sudo docker run -d -p 80:8080 -e NODE_ENV=development -e SERVICE=$ENV-$SERVICEService --log-driver=awslogs --log-opt awslogs-region=eu-west-1 --log-opt awslogs-group=/aws/ec2/$ENV-$SERVICEService --log-opt awslogs-create-group=true 575439814610.dkr.ecr.eu-west-1.amazonaws.com/$ENV-$SERVICE-service:latest