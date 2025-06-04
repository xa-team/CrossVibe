from abc import ABC, abstractmethod

from vibeapp.models.platform_connection import PlatformConnection


class BasePlaylistService(ABC):
    @abstractmethod
    def get_playlists(self, connection: PlatformConnection) -> list:
        pass
    
    def save_or_update_playlists(self, connection: PlatformConnection, playlists_data: list) -> None:
        pass