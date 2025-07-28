import socketio
from aiohttp import web
import asyncio

sio = socketio.AsyncServer(cors_allowed_origins="*")
app = web.Application()
sio.attach(app)

@sio.event
async def connect(sid, environ):
    print("✅ Electron connected:", sid)

    # Send initial message to Electron upon connection
    await sio.emit('python_data', {'message': 'Hello Electron!'})

@sio.event
async def disconnect(sid):
    print("⚠️ Electron disconnected:", sid)

@sio.event
async def electron_message(sid, data):
    print("🔍 Received from Electron:", data)

    # Echo back the received message with additional info
    await sio.emit('python_data', {'response': 'Message received!', 'original': data})

if __name__ == "__main__":
    web.run_app(app, host="localhost", port=65432)
