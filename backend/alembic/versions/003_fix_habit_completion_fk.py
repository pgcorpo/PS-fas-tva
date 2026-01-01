"""fix habit completion foreign key to prevent cascade deletion

Revision ID: 003_fix_habit_completion_fk
Revises: 002_add_habit_version_description
Create Date: 2025-01-02 00:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '003_fix_habit_completion_fk'
down_revision = '002_add_habit_version_description'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop existing foreign key constraint
    # PostgreSQL default naming: {table}_{column}_fkey
    op.drop_constraint(
        'habit_completions_habit_id_fkey',
        'habit_completions',
        type_='foreignkey'
    )

    # Recreate with RESTRICT to prevent cascade deletion
    # This ensures completions are preserved when habits are soft-deleted
    op.create_foreign_key(
        'habit_completions_habit_id_fkey',
        'habit_completions',
        'habits',
        ['habit_id'],
        ['id'],
        ondelete='RESTRICT'
    )


def downgrade() -> None:
    # Revert to original constraint (no ondelete specified)
    op.drop_constraint(
        'habit_completions_habit_id_fkey',
        'habit_completions',
        type_='foreignkey'
    )

    op.create_foreign_key(
        'habit_completions_habit_id_fkey',
        'habit_completions',
        'habits',
        ['habit_id'],
        ['id']
    )
