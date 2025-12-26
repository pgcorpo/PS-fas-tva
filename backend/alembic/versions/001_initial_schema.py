"""Initial schema

Revision ID: 001_initial
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('google_user_id', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_google_user_id'), 'users', ['google_user_id'], unique=True)

    # Create goals table
    op.create_table(
        'goals',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('year', sa.Integer(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_goals_user_id'), 'goals', ['user_id'], unique=False)
    op.create_index(op.f('ix_goals_is_deleted'), 'goals', ['is_deleted'], unique=False)

    # Create habits table
    op.create_table(
        'habits',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('order_index', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_habits_user_id'), 'habits', ['user_id'], unique=False)
    op.create_index(op.f('ix_habits_is_deleted'), 'habits', ['is_deleted'], unique=False)
    # Composite index for habits listing
    op.create_index('idx_habits_user_active_order', 'habits', ['user_id', 'is_deleted', 'order_index'], unique=False)

    # Create habit_versions table
    op.create_table(
        'habit_versions',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('habit_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('weekly_target', sa.Integer(), nullable=False),
        sa.Column('requires_text_on_completion', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('linked_goal_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('effective_week_start', sa.Date(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['habit_id'], ['habits.id'], ),
        sa.ForeignKeyConstraint(['linked_goal_id'], ['goals.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint('weekly_target >= 1', name='check_weekly_target_positive')
    )
    op.create_index(op.f('ix_habit_versions_habit_id'), 'habit_versions', ['habit_id'], unique=False)
    op.create_index(op.f('ix_habit_versions_effective_week_start'), 'habit_versions', ['effective_week_start'], unique=False)
    # Composite index for version resolution
    op.create_index('idx_habit_versions_habit_effective', 'habit_versions', ['habit_id', sa.text('effective_week_start DESC')], unique=False)

    # Create habit_completions table
    op.create_table(
        'habit_completions',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('habit_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('text', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['habit_id'], ['habits.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_habit_completions_user_id'), 'habit_completions', ['user_id'], unique=False)
    op.create_index(op.f('ix_habit_completions_habit_id'), 'habit_completions', ['habit_id'], unique=False)
    op.create_index(op.f('ix_habit_completions_date'), 'habit_completions', ['date'], unique=False)
    # Composite indexes for queries
    op.create_index('idx_completions_user_date', 'habit_completions', ['user_id', 'date'], unique=False)
    op.create_index('idx_completions_habit_date', 'habit_completions', ['habit_id', 'date'], unique=False)


def downgrade() -> None:
    op.drop_index('idx_completions_habit_date', table_name='habit_completions')
    op.drop_index('idx_completions_user_date', table_name='habit_completions')
    op.drop_index(op.f('ix_habit_completions_date'), table_name='habit_completions')
    op.drop_index(op.f('ix_habit_completions_habit_id'), table_name='habit_completions')
    op.drop_index(op.f('ix_habit_completions_user_id'), table_name='habit_completions')
    op.drop_table('habit_completions')
    
    op.drop_index('idx_habit_versions_habit_effective', table_name='habit_versions')
    op.drop_index(op.f('ix_habit_versions_effective_week_start'), table_name='habit_versions')
    op.drop_index(op.f('ix_habit_versions_habit_id'), table_name='habit_versions')
    op.drop_table('habit_versions')
    
    op.drop_index('idx_habits_user_active_order', table_name='habits')
    op.drop_index(op.f('ix_habits_is_deleted'), table_name='habits')
    op.drop_index(op.f('ix_habits_user_id'), table_name='habits')
    op.drop_table('habits')
    
    op.drop_index(op.f('ix_goals_is_deleted'), table_name='goals')
    op.drop_index(op.f('ix_goals_user_id'), table_name='goals')
    op.drop_table('goals')
    
    op.drop_index(op.f('ix_users_google_user_id'), table_name='users')
    op.drop_table('users')
