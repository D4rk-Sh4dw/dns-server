# Build Stage
FROM rust:1.75-alpine AS builder
WORKDIR /usr/src/data-plane
RUN apk add --no-cache musl-dev

# Create a dummy project to cache dependencies
RUN mkdir src
RUN echo "fn main() {}" > src/main.rs
COPY Cargo.toml .
# Build only dependencies to cache them
RUN cargo build --release
RUN rm -rf src

# Copy actual source code
COPY . .
# Touch main.rs to force rebuild
RUN touch src/main.rs
RUN cargo build --release

# Run Stage
FROM alpine:latest
WORKDIR /root/
COPY --from=builder /usr/src/data-plane/target/release/data-plane .
EXPOSE 1053/udp 1053/tcp
CMD ["./data-plane"]
