all: run

run:
	nohup node app.js 11111 &

.PHONY: run

