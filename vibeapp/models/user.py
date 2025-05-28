from vibeapp.extensions import db

class User(db.Model):
    id = db.Column(db.Integer, primary_key = True) #내부용 고유 ID
    spotify_id = db.Column(db.String(100), unique = True, nullable = False) #Spotify 계정 고유 ID
    display_name = db.Column(db.String(100)) # 사용자 이름
    access_token = db.Column(db.String(255)) #Spotify API 사용에 필요한 Access Token
    refresh_token = db.Column(db.String(255)) #Access Token 만료 시 사용할 Refresh Token
    is_admin = db.Column(db.Boolean, default=False)  # ← 관리자 여부