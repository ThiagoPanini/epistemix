"""fix engagement user_id columns to Text to match auth_user.id (nanoid)

Revision ID: 20260612202000
Revises: 20260612160243
Create Date: 2026-06-12 20:20:00

better-auth generates nanoid strings as user IDs, not UUIDs.
Aligns artifact_view/artifact_vote/artifact_comment user_id columns.
Uses batch_alter_table for SQLite compatibility in migration tests.
"""

import sqlalchemy as sa

from alembic import op

revision = "20260612202000"
down_revision = "20260612160243"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("artifact_view") as batch_op:
        batch_op.alter_column(
            "user_id", existing_type=sa.Uuid(), type_=sa.Text(), existing_nullable=True
        )
    with op.batch_alter_table("artifact_vote") as batch_op:
        batch_op.alter_column(
            "user_id", existing_type=sa.Uuid(), type_=sa.Text(), existing_nullable=False
        )
    with op.batch_alter_table("artifact_comment") as batch_op:
        batch_op.alter_column(
            "user_id", existing_type=sa.Uuid(), type_=sa.Text(), existing_nullable=False
        )


def downgrade() -> None:
    with op.batch_alter_table("artifact_comment") as batch_op:
        batch_op.alter_column(
            "user_id", existing_type=sa.Text(), type_=sa.Uuid(), existing_nullable=False
        )
    with op.batch_alter_table("artifact_vote") as batch_op:
        batch_op.alter_column(
            "user_id", existing_type=sa.Text(), type_=sa.Uuid(), existing_nullable=False
        )
    with op.batch_alter_table("artifact_view") as batch_op:
        batch_op.alter_column(
            "user_id", existing_type=sa.Text(), type_=sa.Uuid(), existing_nullable=True
        )
