from application import app
from application import socketio

# sys.path.insert(1, os.path.join(os.path.abspath('.'), 'lib'))


def run_server():
    app.debug = True
    socketio.run(app, host=app.config.get('SERVER_HOST'),
                 port=app.config.get('SERVER_PORT'),
                 use_reloader=True)

if __name__ == "__main__":
    run_server()
    # socketio.run(app, host="0.0.0.0", port=8080)
