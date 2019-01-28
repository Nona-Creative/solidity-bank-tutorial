# include env file and export it's vars
include .env
export $(shell sed 's/=.*//' .env)

#------------------------------
# vars
#------------------------------

SHELL := /bin/bash

#------------------------------
# help
#------------------------------

help:
	@echo "AVAILABLE OPTIONS"
	@echo "Ganache"
	@echo " - ganachedown: stop and rm ganache container"

#------------------------------
# docker
#------------------------------

ganachedown:
	@docker-compose rm -fsv ganache
