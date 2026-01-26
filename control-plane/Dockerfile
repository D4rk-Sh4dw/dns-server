# Build Stage
FROM golang:1.21-alpine AS builder
WORKDIR /app

# Pre-copy/cache go.mod for pre-downloading dependencies and only redownloading them in subsequent builds if they change
COPY go.mod ./
RUN go mod download && go mod verify

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o control-plane ./cmd/server

# Run Stage
FROM alpine:latest
WORKDIR /root/
COPY --from=builder /app/control-plane .
EXPOSE 8080
CMD ["./control-plane"]
