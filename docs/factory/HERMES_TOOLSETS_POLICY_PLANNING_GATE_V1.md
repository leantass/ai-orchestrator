# Hermes Toolsets Policy Planning Gate v1

## Purpose

Factory Hermes Toolsets Policy Planning Gate v1 plans toolset policy for a future bounded Hermes command shape:

`hermes.exe --oneshot "<PROMPT>" --provider <PROVIDER> --model <MODEL> --toolsets <TOOLSETS>`

It does not enable toolsets, execute Hermes, send prompts, use network, call models, read credentials, read `.env`, or run uv, pip, Python or setup.py.

## Relationship To Network Policy Planning

This gate consumes Network Policy Planning after network remains blocked with `allowedHostsNow: []`, wildcard hosts forbidden, arbitrary internet forbidden, and web/browser/search network blocked until Toolsets Policy.

## Toolset Candidates

- `no_toolsets_text_only`: preferred if source proves all tools can be disabled.
- `default_cli_toolsets`: forbidden without explicit approval.
- `web_toolset`: forbidden until network and toolsets approval.
- `browser_toolset`: forbidden until network and toolsets approval.
- `terminal_toolset`: forbidden.
- `filesystem_toolset`: forbidden until Filesystem Mutation Policy.
- `mcp_toolset`: forbidden until MCP Policy.
- `arbitrary_toolsets`: forbidden.
- `no_mcp_sentinel`: candidate only if source support is proven.

## Rules

- No toolsets now.
- Future runtime must use explicit toolsets.
- Hidden default CLI toolsets are forbidden.
- Config-driven toolsets are forbidden without approval.
- Web/browser/search require both Network Policy and Toolsets Policy.
- Terminal/shell tools are forbidden for initial research.
- Filesystem tools require Filesystem Mutation Policy.
- MCP requires separate MCP Policy.
- Tool outputs cannot become findings until Result Ingestion and JEFE Review.
- Future runtime must report toolsets requested, approved, used, execution status, and unexpected tool use.

## Not Authorized

This gate does not authorize Hermes execution, `--oneshot`, prompt passing, tool enablement, web/browser/terminal/MCP/filesystem tools, network, credentials, model calls, uv, pip, Python, setup.py, project mutation or deploy.

## Next Steps

Proceed to `Factory Hermes Output Contract Policy Planning Gate v1`, then Result Ingestion Contract, Filesystem Mutation Policy and Research Execution Boundary planning.
## Exit To Output Contract Policy Planning

Toolsets Policy Planning exits to `Factory Hermes Output Contract Policy Planning Gate v1`. Tool outputs, stdout, stderr, usage files and logs remain non-findings until Output Contract, Result Ingestion and JEFE Review gates complete.

Downstream Result Ingestion Contract Planning must keep tool output non-ingestable until toolsets are explicitly approved by later boundary/runtime evidence.
## Static Verification Follow-Up

The policy preference `no_toolsets_text_only` requires separate verification because Hermes validates real `--toolsets` names and may fall back to configured CLI defaults when omitted.
