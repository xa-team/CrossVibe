from abc import ABC, abstractmethod
from vibeapp.models.platform_connection import PlatformConnection

class BaseAuthService(ABC):
    @staticmethod
    @abstractmethod
    def refresh_token(connection: PlatformConnection) -> str:
        pass