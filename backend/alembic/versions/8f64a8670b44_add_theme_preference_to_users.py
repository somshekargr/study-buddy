"""add_theme_preference_to_users

Revision ID: 8f64a8670b44
Revises: 6a1f19d55db5
Create Date: 2026-02-13 04:19:21.292708

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8f64a8670b44'
down_revision: Union[str, Sequence[str], None] = '6a1f19d55db5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add theme_preference column with default 'system'
    op.add_column('users', sa.Column('theme_preference', sa.String(length=20), nullable=False, server_default='system'))


def downgrade() -> None:
    # Remove theme_preference column
    op.drop_column('users', 'theme_preference')
