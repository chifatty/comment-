import os

import redis
from flask import Flask
from flask_socketio import SocketIO

app = Flask(__name__)
socketio = SocketIO(app)

if os.getenv('FLASK_CONF') == 'DEV':
    app.config.from_object('application.settings.Development')
elif os.getenv('FLASK_CONF') == 'TEST':
    app.config.from_object('application.settings.Testing')
else:
    app.config.from_object('application.settings.Production')

redis_pool = redis.ConnectionPool(host=app.config.get('REDIS_HOST'),
                                  port=app.config.get('REDIS_PORT'),
                                  db=app.config.get('REDIS_DB'))
# Pull in URL dispatch routes
import urls
