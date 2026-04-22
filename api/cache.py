from functools import wraps

from cachetools import TTLCache

_cache = TTLCache(maxsize=256, ttl=600)        # 10 min
_heavy_cache = TTLCache(maxsize=64, ttl=1800)  # 30 min


def cached(heavy: bool = False):
    target = _heavy_cache if heavy else _cache

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            key = (func.__name__,) + args + tuple(sorted(kwargs.items()))
            result = target.get(key)
            if result is not None:
                return result
            result = func(*args, **kwargs)
            target[key] = result
            return result
        return wrapper
    return decorator
