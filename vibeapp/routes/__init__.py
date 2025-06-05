from .public_routes import public_bp
from .admin_routes import admin_bp


def register_routes(app):
    app.register_blueprint(public_bp)
    app.register_blueprint(admin_bp, url_prefix="/admin")