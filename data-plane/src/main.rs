use std::net::UdpSocket;

fn main() {
    println!("Unified DNS Data Plane (Stub) starting...");
    
    // Bind to 0.0.0.0:1053 internally (mapped to 53 in Docker)
    match UdpSocket::bind("0.0.0.0:1053") {
        Ok(socket) => {
            println!("Listening on 0.0.0.0:1053");
            let mut buf = [0; 512];
            loop {
                match socket.recv_from(&mut buf) {
                    Ok((amt, src)) => {
                        println!("Received {} bytes from {}", amt, src);
                        // Echo stub
                        let _ = socket.send_to(&buf[..amt], &src);
                    },
                    Err(e) => {
                        eprintln!("Error receiving data: {}", e);
                    }
                }
            }
        },
        Err(e) => {
             eprintln!("Failed to bind socket: {}", e);
        }
    }
}
