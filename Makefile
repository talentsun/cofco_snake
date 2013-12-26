all: run

run:
	nohup node server.js &

.PHONY: run

