from redis_config import REDIS_HOST
from redis_config import REDIS_PORT
from redis_config import REDIS_DB
from server_config import SERVER_HOST
from server_config import SERVER_PORT


class Config(object):
    # Set up redis configuration
    REDIS_HOST = REDIS_HOST
    REDIS_PORT = REDIS_PORT
    REDIS_DB = REDIS_DB
    # Set up server configuration
    SERVER_HOST = SERVER_HOST
    SERVER_PORT = SERVER_PORT
    # listen port
    PORT = 8080


class Development(Config):
    DEBUG = True
    # Flask-DebugToolbar settings
    DEBUG_TB_PROFILER_ENABLED = True
    DEBUG_TB_INTERCEPT_REDIRECTS = False
    # CSRF_ENABLED = True


class Testing(Config):
    TESTING = True
    DEBUG = True
    # CSRF_ENABLED = True


class Production(Config):
    DEBUG = False
    # CSRF_ENABLED = True
