.PHONY: dev init build test

dev:
	pnpm dev:watch

init:
	pnpm install

build:
	pnpm build

test:
	pnpm test
