"""Unit tests for selector entities."""

from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock

import pytest

from custom_components.clash_controller.select import GroupSelect


@pytest.mark.asyncio
async def test_group_select_preserves_exact_group_and_node_names() -> None:
    """Mihomo identifiers may contain whitespace that must reach the API."""
    group_name = " TikTok "
    node_name = " 🇩🇪 DE, Франкфурт"
    coordinator = SimpleNamespace(api=SimpleNamespace(async_request=AsyncMock()))
    entity = GroupSelect.__new__(GroupSelect)
    entity._attr_name = group_name
    entity.coordinator = coordinator
    entity.entity_data = SimpleNamespace(state=None)
    entity.async_write_ha_state = Mock()

    await entity.async_select_option(node_name)

    coordinator.api.async_request.assert_awaited_once_with(
        "PUT",
        "proxies/%20TikTok%20",
        json_data={"name": node_name},
        suppress_errors=False,
    )
    assert entity.entity_data.state == node_name
    entity.async_write_ha_state.assert_called_once_with()
