import json
import redis
import time

from application import redis_pool

COMMENT_KEY = u'comment:{}'
AGGREMENT_KEY = u'aggrement:{}'
HISTORY_KEY = u'history:{}:{}'
USER_KEY = u'user:{}'


def set_user(packet):
    r = redis.Redis(connection_pool=redis_pool)
    pipe = r.pipeline()
    key = USER_KEY.format(packet.get('user_id'))
    pipe.set(key, packet.get('user_name'))
    pipe.execute()


def set_comment(packet):
    r = redis.Redis(connection_pool=redis_pool)
    pipe = r.pipeline()
    key = COMMENT_KEY.format(packet.get('comment_id'))
    pipe.hset(key, 'comment_id', packet.get('comment_id'))
    pipe.hset(key, 'comment_content', packet.get('comment_content'))
    pipe.hset(key, 'author_id', packet.get('author_id'))
    pipe.hset(key, 'author_name', packet.get('author_name'))
    pipe.hsetnx(key, 'timestamp', packet.get('timestamp'))
    pipe.execute()


def update_aggrement(packet):
    r = redis.Redis(connection_pool=redis_pool)
    pipe = r.pipeline()
    key = AGGREMENT_KEY.format(packet.get('comment_id'))
    user_id = packet.get('user_id')
    if user_id:
        if packet.get('type') == u'plus':
            pipe.sadd(key, user_id)
        elif packet.get('type') == u'minus':
            pipe.srem(key, user_id)
        key = HISTORY_KEY.format(user_id, packet.get('timestamp'))
        pipe.hset(key, 'comment_id', packet.get('comment_id'))
        pipe.hset(key, 'command', packet.get('type'))
        pipe.execute()


def get_aggrement(packet):
    r = redis.Redis(connection_pool=redis_pool)
    key = AGGREMENT_KEY.format(packet.get('comment_id'))
    members = r.smembers(key)
    return list(members)


def make_response(packet):
    type = packet.get('type')
    response = {}
    if type == u'query':
        members = get_aggrement(packet)
        response['comment_id'] = packet.get('comment_id')
        response['members'] = members
    elif type == u'comment':
        set_comment(packet)
    elif type == u'plus' or type == u'minus':
        set_user(packet)
        update_aggrement(packet)
    return json.dumps(response)
