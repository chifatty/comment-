import json

from flask_socketio import emit

from application import app
from application import comment
from application import socketio


@app.route('/')
def index():
    return 'Working'


@socketio.on('heartbeat', namespace='/comment++')
def heartbeat(packet):
    response = comment.make_response(packet)
    return emit('response', response)
