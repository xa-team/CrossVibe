from abc import ABC, abstractmethod
from vibeapp.models.platform_token import PlatformToken

class BaseAuthService(ABC):
    @staticmethod
    @abstractmethod
    def refresh_token(token: PlatformToken) -> str:
        pass