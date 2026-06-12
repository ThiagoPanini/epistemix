"""identity auth schema

Revision ID: 20260612160243
Revises: 20260612152918
Create Date: 2026-06-12 16:02:43

Creates better-auth tables (prefixed auth_) for the identity boundary:
  - auth_user: base user + username (unique/immutable) + role
  - auth_session: session tokens with expiry
  - auth_account: linked OAuth accounts (provider credentials)
  - auth_verification: email verification / magic-link tokens
"""

import sqlalchemy as sa

from alembic import op

revision = "20260612160243"
down_revision = "20260612152918"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "auth_user",
        sa.Column("id", sa.Text(), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("email", sa.Text(), nullable=False),
        sa.Column("email_verified", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("image", sa.Text(), nullable=True),
        sa.Column("username", sa.Text(), nullable=False),
        sa.Column("role", sa.Text(), nullable=False, server_default="user"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email", name="uq_auth_user_email"),
        sa.UniqueConstraint("username", name="uq_auth_user_username"),
    )
    op.create_index("ix_auth_user_email", "auth_user", ["email"])

    op.create_table(
        "auth_session",
        sa.Column("id", sa.Text(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("token", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column("ip_address", sa.Text(), nullable=True),
        sa.Column("user_agent", sa.Text(), nullable=True),
        sa.Column("user_id", sa.Text(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token", name="uq_auth_session_token"),
        sa.ForeignKeyConstraint(["user_id"], ["auth_user.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_auth_session_token", "auth_session", ["token"])
    op.create_index("ix_auth_session_user_id", "auth_session", ["user_id"])

    op.create_table(
        "auth_account",
        sa.Column("id", sa.Text(), nullable=False),
        sa.Column("account_id", sa.Text(), nullable=False),
        sa.Column("provider_id", sa.Text(), nullable=False),
        sa.Column("user_id", sa.Text(), nullable=False),
        sa.Column("access_token", sa.Text(), nullable=True),
        sa.Column("refresh_token", sa.Text(), nullable=True),
        sa.Column("id_token", sa.Text(), nullable=True),
        sa.Column("access_token_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("refresh_token_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("scope", sa.Text(), nullable=True),
        sa.Column("password", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["auth_user.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_auth_account_user_id", "auth_account", ["user_id"])

    op.create_table(
        "auth_verification",
        sa.Column("id", sa.Text(), nullable=False),
        sa.Column("identifier", sa.Text(), nullable=False),
        sa.Column("value", sa.Text(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_auth_verification_identifier", "auth_verification", ["identifier"])


def downgrade() -> None:
    op.drop_index("ix_auth_verification_identifier", table_name="auth_verification")
    op.drop_table("auth_verification")

    op.drop_index("ix_auth_account_user_id", table_name="auth_account")
    op.drop_table("auth_account")

    op.drop_index("ix_auth_session_user_id", table_name="auth_session")
    op.drop_index("ix_auth_session_token", table_name="auth_session")
    op.drop_table("auth_session")

    op.drop_index("ix_auth_user_email", table_name="auth_user")
    op.drop_table("auth_user")
