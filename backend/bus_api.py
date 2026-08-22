import os
from urllib.parse import unquote


def get_service_key() -> str:
    """Return the decoded key so the HTTP client encodes it exactly once."""
    service_key = os.environ.get("OPENAPI_KEY")
    if not service_key:
        raise RuntimeError("OPENAPI_KEY environment variable is not set")

    return unquote(service_key)


def get_response_items(data: dict) -> list[dict]:
    body = data.get("response", {}).get("body", {})
    items_container = body.get("items") if isinstance(body, dict) else None
    items = (
        items_container.get("item", [])
        if isinstance(items_container, dict)
        else []
    )

    if isinstance(items, dict):
        return [items]
    if isinstance(items, list):
        return items
    return []
