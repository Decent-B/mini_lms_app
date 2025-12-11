"""
Alembic environment configuration.

This file sets up the database connection and migration context.
Database URL is loaded from environment variables for security.
"""

from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool

from alembic import context

# Import all models to ensure they're registered with Base
from app.core.config import settings
from app.core.database import Base
from app.models.user import User # pyright: ignore[reportUnusedImport]
from app.models.parent import Parent # pyright: ignore[reportUnusedImport]
from app.models.student import Student # pyright: ignore[reportUnusedImport]
from app.models.class_model import ClassModel # pyright: ignore[reportUnusedImport]
from app.models.class_registration import ClassRegistration # pyright: ignore[reportUnusedImport]
from app.models.subscription import Subscription # pyright: ignore[reportUnusedImport]

# this is the Alembic Config object
config = context.config

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set sqlalchemy.url from environment variable
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# Add your model's MetaData object here for 'autogenerate' support
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """
    Run migrations in 'offline' mode.
    
    This configures the context with just a URL and not an Engine.
    Calls to context.execute() will emit the given string to the script output.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """
    Run migrations in 'online' mode.
    
    Creates an Engine and associates a connection with the context.
    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
