"""Small capability-dependent entity construction contracts."""

from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from custom_components.clash_controller.const import AUTO_SELECT_OPTION
from custom_components.clash_controller.coordinator import ClashControllerCoordinator


@pytest.mark.parametrize("fixed", [True, False])
def test_urltest_entity_type(fixed):
    group = {"name": "Auto", "type": "URLTest", "now": "a", "all": ["a", "b"]}
    if fixed:
        group["fixed"] = "a"
    entities = ClashControllerCoordinator._build_proxy_entities(
        {"proxies": {"auto": group}}
    )
    assert len(entities) == 1
    assert entities[0].entity_type == (
        "proxy_group_selector" if fixed else "proxy_group_sensor"
    )
    assert entities[0].options == (
        [AUTO_SELECT_OPTION, "a", "b"] if fixed else None
    )


@pytest.mark.parametrize(
    ("fixed", "expected_options", "expected_fixed"),
    [
        ("", [AUTO_SELECT_OPTION, "a", "b"], False),
        ("b", [AUTO_SELECT_OPTION, "a", "b"], True),
        (None, ["a", "b"], None),
    ],
)
def test_fallback_offers_unpin_and_reports_pin(fixed, expected_options, expected_fixed):
    group = {"name": "Fallback", "type": "Fallback", "now": "a", "all": ["a", "b"]}
    if fixed is not None:
        group["fixed"] = fixed
    (entity,) = ClashControllerCoordinator._build_proxy_entities(
        {"proxies": {"fallback": group}}
    )
    assert entity.entity_type == "proxy_group_selector"
    assert entity.state == "a"
    assert entity.options == expected_options
    assert entity.attributes.get("fixed") is expected_fixed
    if fixed is not None:
        assert entity.attributes["pinned_node"] == (fixed or None)


def test_hidden_groups_are_disabled_by_default():
    proxies = {
        "shown": {"name": "Shown", "type": "Selector", "now": "a", "all": ["a"]},
        "hidden": {
            "name": "Hidden",
            "type": "Fallback",
            "now": "a",
            "all": ["a"],
            "fixed": "",
            "hidden": True,
        },
    }
    entities = {
        item.name: item
        for item in ClashControllerCoordinator._build_proxy_entities({"proxies": proxies})
    }
    assert entities["Shown"].enabled_default is None
    assert entities["Hidden"].enabled_default is False


@pytest.mark.parametrize("healthcheck", [True, False])
def test_provider_entities(healthcheck):
    coordinator = object.__new__(ClashControllerCoordinator)
    coordinator.api = SimpleNamespace(async_request=AsyncMock())
    entities = coordinator._build_provider_entities(
        {"providers": {"default": {}, "HK Group": {"timeout": "3000"}}},
        {"providers": {"rules": {}}},
        provider_healthcheck_enabled=healthcheck,
    )
    counts = {
        item.unique_key: item.state
        for item in entities
        if item.entity_type == "provider_count_sensor"
    }
    assert counts == {"proxy_provider_count": 2, "rule_provider_count": 1}
    buttons = [
        item for item in entities if item.entity_type == "provider_healthcheck_button"
    ]
    assert len(buttons) == (2 if healthcheck else 0)
    if healthcheck:
        assert all(item.enabled_default is False for item in buttons)
        assert {
            (item.action["args"][1], item.action["kwargs"]["params"]["timeout"])
            for item in buttons
        } == {
            ("providers/proxies/default/healthcheck", 5000),
            ("providers/proxies/HK%20Group/healthcheck", 3000),
        }

    for absent in (None, {}, {"providers": []}):
        entities = coordinator._build_provider_entities(
            {"providers": {}}, absent, provider_healthcheck_enabled=healthcheck
        )
        assert [(item.unique_key, item.state) for item in entities] == [
            ("proxy_provider_count", 0)
        ]
        entities = coordinator._build_provider_entities(
            absent, {"providers": {}}, provider_healthcheck_enabled=healthcheck
        )
        assert [(item.unique_key, item.state) for item in entities] == [
            ("rule_provider_count", 0)
        ]
