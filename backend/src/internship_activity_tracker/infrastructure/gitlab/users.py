import logging

from internship_activity_tracker.infrastructure.gitlab.graphql_client import _parse_gid
from internship_activity_tracker.infrastructure.gitlab.graphql_queries import GQL_USER_LOOKUP

logger = logging.getLogger(__name__)


def _gql_user_to_dict(node: dict) -> dict:
    """Normalize a GraphQL user node to the same shape as the REST /users/:id response."""
    public_email = node.get("publicEmail") or ""
    return {
        "id": _parse_gid(node.get("id")),
        "username": node.get("username"),
        "name": node.get("name"),
        "avatar_url": node.get("avatarUrl"),
        "web_url": node.get("webUrl"),
        "public_email": public_email,
        "email": public_email,
        "created_at": node.get("createdAt"),
        "state": node.get("state"),
    }


async def get_user_by_username_async(client, username):
    """
    Async fetch a user by username. Tries GraphQL first, falls back to REST.
    """
    if client._gql:
        try:
            data = await client._gql.query(GQL_USER_LOOKUP, {"username": username})
            node = data.get("user") or {}
            if node and node.get("username", "").lower() == username.lower():
                logger.info(f"[GraphQL/User] Resolved {username}")
                return _gql_user_to_dict(node)
        except Exception as exc:
            logger.warning(f"[GraphQL/User] Fast path failed, falling back to REST: {exc}")

    # REST fallback
    users = await client._async_get("/users", params={"username": username})
    if not users or not isinstance(users, list) or len(users) == 0:
        users = await client._async_get("/users", params={"search": username})

    if users and isinstance(users, list):
        target_user = next((u for u in users if str(u.get("username", "")).lower() == username.lower()), None)
        if not target_user:
            return None
        user_id = target_user.get("id")
        if user_id:
            full_user = await client._async_get(f"/users/{user_id}")
            if full_user and isinstance(full_user, dict) and full_user.get("id"):
                return full_user
        return target_user

    return None


def get_user_by_username(client, username):
    """
    Sync fetch a user by username. Tries GraphQL first, falls back to REST.
    """
    if client._gql:
        try:
            from internship_activity_tracker.infrastructure.gitlab.bridge import run_on_loop

            data = run_on_loop(client._gql.query(GQL_USER_LOOKUP, {"username": username}), timeout=15)
            node = data.get("user") or {}
            if node and node.get("username", "").lower() == username.lower():
                logger.info(f"[GraphQL/User] Resolved {username}")
                return _gql_user_to_dict(node)
        except Exception as exc:
            logger.warning(f"[GraphQL/User] Fast path failed, falling back to REST: {exc}")

    # REST fallback
    users_data = client._get("/users", params={"username": username})
    if not users_data or not isinstance(users_data, list) or len(users_data) == 0:
        users_data = client._get("/users", params={"search": username})

    if users_data and isinstance(users_data, list):
        target_user = next((u for u in users_data if str(u.get("username", "")).lower() == username.lower()), None)
        if not target_user:
            return None
        user_id = target_user.get("id")
        if user_id:
            full_user = client._get(f"/users/{user_id}")
            if full_user and isinstance(full_user, dict) and full_user.get("id"):
                return full_user
        return target_user

    return None
