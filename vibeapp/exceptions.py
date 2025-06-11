class PlaylistFetchError(Exception):
    """플레이리스트를 가져오거나 저장하는 과정에서 발생하는 에러"""
    pass

class TokenRefreshError(Exception):
    """토큰을 갱신하는 과정에서 발생하는 에러"""
    pass

class UnsupportedPlatformError(Exception):
    """로그인시 지원하지 않는 플랫폼일 경우 발생하는 에러"""
    pass

class FriendRequestError(Exception):
    """친구 신청하는 과정에서 발생하는 에러"""
    pass