#!/bin/bash

if [ "$(docker ps -aq)" ]; then
	# cleanup
	docker stop $(docker ps -a -q)
	docker rm $(docker ps -a -q)
fi

if [ "$(docker images | grep 'tuna-app')" ]; then
	# cleanup
	docker rmi dev-peer0.org1.example.com-tuna-app-1.0-b58eb592ed6ced10f52cc063bda0c303a4272089a3f9a99000d921f94b9bae9b
fi
