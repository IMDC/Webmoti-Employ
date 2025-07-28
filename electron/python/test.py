import socket
import json
import time

HOST = 'localhost'
PORT = 65432

server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.bind((HOST, PORT))
server.listen()

print(f"✅ Python Socket server started at {HOST}:{PORT}")

conn, addr = server.accept()
print(f"✅ Electron connected: {addr}")

try:
    count = 0
    while True:
        # Send simple incrementing count as test data every 2 seconds
        test_data = {'message': f'Hello Electron! Count = {count}'}
        conn.sendall(json.dumps(test_data).encode())
        print(f"🚀 Sent: {test_data}")

        # Wait for potential response from Electron (optional)
        conn.settimeout(1.0)
        try:
            data = conn.recv(1024)
            if data:
                print(f"🔍 Received from Electron: {data.decode()}")
        except socket.timeout:
            pass

        count += 1
        time.sleep(2)

except KeyboardInterrupt:
    print("⚠️ Stopped by user.")
finally:
    conn.close()
    server.close()
