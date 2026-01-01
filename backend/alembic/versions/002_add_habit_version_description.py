"""Add description to habit_versions

Revision ID: 002_add_description
Revises: 001_initial
Create Date: 2026-01-01 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '002_add_description'
down_revision: Union[str, None] = '001_initial'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add description column to habit_versions table
    op.add_column('habit_versions', sa.Column('description', sa.String(), nullable=True))


def downgrade() -> None:
    # Remove description column
    op.drop_column('habit_versions', 'description')
