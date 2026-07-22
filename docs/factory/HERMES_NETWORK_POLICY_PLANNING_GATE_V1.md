# Hermes Network Policy Planning Gate v1

## Purpose

Factory Hermes Network Policy Planning Gate v1 plans network policy for a future bounded Hermes command shape:

`hermes.exe --oneshot "<PROMPT>" --provider <PROVIDER> --model <MODEL>`

It does not enable network access. It does not resolve DNS, test endpoints, call models, read credentials, read `.env`, send prompts, or execute Hermes.

## Relationship To Credentials Policy Planning

This gate consumes the Credentials Policy Planning result after credential references have been identified as names only. Credential values remain unknown, unread, and not approved. Network planning depends on that boundary and does not select or validate any key.

## Network Surfaces

- `model_provider_api_network`: requires future network approval.
- `web_toolset_network`: forbidden until Toolsets Policy.
- `browser_toolset_network`: forbidden until Toolsets Policy.
- `mcp_network_or_local_channels`: forbidden until Toolsets Policy.
- `terminal_toolset_network`: forbidden until Toolsets Policy.
- `arbitrary_internet`: forbidden.
- `offline_execution`: not available unless a later source review proves a contractual offline/mock provider.

## Provider Network Candidates

Provider candidates are `openai`, `anthropic`, and `gemini_google`. Any hosts found in source text are recorded only as candidates, never as approved hosts. `allowedHostsNow` remains empty.

## Rules

- No network now.
- No DNS now.
- No endpoint tests now.
- Future hosts must be exact and approved.
- Wildcards are forbidden.
- Arbitrary internet is forbidden.
- Provider/model selection must happen before network approval.
- Credentials approval remains separate.
- Web/browser/search/MCP/terminal network remains disabled until Toolsets Policy.
- Runtime must report network status and avoid headers or secrets in logs.
- Network and provider-network kill switches are required.

## Not Authorized

This gate does not authorize Hermes execution, `--oneshot`, prompt passing, model calls, credentials, network use, DNS, endpoint testing, toolsets, uv, pip, Python, setup.py, project mutation, or deploy.

## Next Steps

Proceed to `Factory Hermes Toolsets Policy Planning Gate v1`, followed by Output Contract Planning and Research Execution Boundary planning before any approval/runtime can exist.
## Exit To Toolsets Policy Planning

Network Policy Planning exits to `Factory Hermes Toolsets Policy Planning Gate v1`. Web/browser/search/MCP/terminal network remains disabled until that planning gate and later approvals. No hosts, network, DNS, endpoints, toolsets, credentials, prompts, models or Hermes execution are authorized by this transition.
## Output Contract Dependency

Network Policy Planning does not define output semantics. Future network/model outputs cannot be promoted to findings without Output Contract Policy Planning, Result Ingestion and JEFE Review.
