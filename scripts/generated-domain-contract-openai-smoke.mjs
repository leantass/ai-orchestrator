import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')
const mainFilePath = path.join(repoRoot, 'electron', 'main.cjs')
const mainSource = fs.readFileSync(mainFilePath, 'utf8')

const {
  normalizeGeneratedDomainContract,
  validateGeneratedDomainContract,
  isContractSafeForLocalMaterialization,
  buildGeneratedDomainContractDiagnostics,
} = require('../electron/generated-domain-contract.cjs')

function normalizeOptionalString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function extractSegment({ startMarker, endMarker }) {
  const start = mainSource.indexOf(startMarker)
  if (start === -1) {
    throw new Error(
      `[generated-domain-contract-openai-smoke] No se encontro el anchor inicial ${JSON.stringify(startMarker)}.`,
    )
  }

  const end = mainSource.indexOf(endMarker, start)
  if (end === -1) {
    throw new Error(
      `[generated-domain-contract-openai-smoke] No se encontro el anchor final ${JSON.stringify(endMarker)}.`,
    )
  }

  return mainSource.slice(start, end)
}

function loadOpenAIContractHarness() {
  const openAIConfigSurface = extractSegment({
    startMarker: 'function getOpenAIBrainConfig() {',
    endMarker: 'function buildOpenAIBrainInputPayload(input) {',
  })
  const responseTextSurface = extractSegment({
    startMarker: 'function extractOpenAIResponseText(responsePayload) {',
    endMarker: 'async function normalizeOpenAIBrainDecision(rawDecision, input) {',
  })

  const harness = `
${openAIConfigSurface}
${responseTextSurface}
module.exports = {
  getOpenAIBrainConfig,
  resolveOpenAIBrainTimeoutMs,
  buildOpenAIBrainSystemPrompt,
  buildOpenAIGeneratedDomainContractSchema,
  extractOpenAIResponseText,
};
`

  const sandbox = {
    module: { exports: {} },
    exports: {},
    require,
    console,
    process,
    Buffer,
    fs,
    path,
    fetch,
    normalizeOptionalString,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
  }

  vm.createContext(sandbox)
  vm.runInContext(harness, sandbox, {
    filename: 'generated-domain-contract-openai-smoke-harness.cjs',
  })

  return sandbox.module.exports || {}
}

function buildContractOnlyResponseSchema(contractSchemaBuilder) {
  const generatedDomainContractSchema = contractSchemaBuilder()
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      generatedDomainContract: generatedDomainContractSchema,
    },
    required: ['generatedDomainContract'],
  }
}

function buildContractOnlyPrompt(basePrompt) {
  return `${basePrompt}

Modo especial de esta corrida:
- Esta es una prueba contract-only.
- No devuelvas strategy, executionMode, tasks ni materializationPlan legacy.
- Devolvé un unico objeto JSON con la propiedad generatedDomainContract.
- El dominio debe tratarse como datos y no como lista de rubros conocidos.
- Preferí root.slug, sourceRoot y targetRoot relativos y coherentes.
- No materialices nada. No propongas comandos. No escribas archivos reales.
- Integraciones reales bloqueadas. Mock-only permitido.
- No incluyas tokens, secretos, .env, Docker, deploy ni APIs reales.
`.trim()
}

function buildContractOnlyUserPrompt() {
  return JSON.stringify(
    {
      goal:
        'Quiero un generatedDomainContract para un sistema para administrar criaderos de plantas carnivoras con reservas de visitas, cuidados, stock, ventas mock, pagos simulados y reportes.',
      constraints: [
        'Dominio inventado, no usar plantillas de rubros conocidos.',
        'Entrega fullstack-local observacional solamente.',
        'Sin materializationPlan legacy.',
        'Sin scaffold completo.',
        'Sin Docker, .env, node_modules, deploy ni servicios externos reales.',
        'Pagos mock-only.',
      ],
      expectedOutput: {
        generatedDomainContract: {
          contractVersion: '1.0',
          deliveryLevel: 'fullstack-local',
          domain: {
            label: '...',
            slug: '...',
            summary: '...',
          },
          root: {
            slug: '...',
            sourceRoot: '...',
            targetRoot: '...',
          },
          roles: [],
          entities: [],
          states: {},
          workflows: [],
          frontendSurfaces: [],
          backend: {},
          database: {},
          shared: {},
          docs: [],
          scripts: [],
          integrations: [],
          safety: {},
          materialization: {},
          validation: {},
          approvals: [],
        },
      },
    },
    null,
    2,
  )
}

function summarizeDiagnostics({
  diagnostics,
  normalizedContract,
  validation,
  safety,
}) {
  return {
    status: diagnostics.present ? 'ok' : 'missing-contract',
    present: diagnostics.present === true,
    valid: diagnostics.valid === true,
    safeForLocalMaterialization: diagnostics.safeForLocalMaterialization === true,
    domainSlug: diagnostics.domainSlug || normalizedContract?.domain?.slug || '',
    rootSlug: diagnostics.rootSlug || normalizedContract?.root?.slug || '',
    sourceRoot: diagnostics.sourceRoot || normalizedContract?.root?.sourceRoot || '',
    targetRoot: diagnostics.targetRoot || normalizedContract?.root?.targetRoot || '',
    frontendSurfacesCount: diagnostics.frontendSurfacesCount || 0,
    backendRoutesCount: diagnostics.backendRoutesCount || 0,
    databaseTablesCount: diagnostics.databaseTablesCount || 0,
    requiredPathGroupsCount: diagnostics.requiredPathGroupsCount || 0,
    forbiddenSearchPatternsCount: diagnostics.forbiddenSearchPatternsCount || 0,
    errors: Array.from(
      new Set([
        ...(Array.isArray(diagnostics.errors) ? diagnostics.errors : []),
        ...(Array.isArray(validation?.errors) ? validation.errors : []),
        ...(Array.isArray(safety?.errors) ? safety.errors : []),
      ]),
    ),
    warnings: Array.from(
      new Set([
        ...(Array.isArray(diagnostics.warnings) ? diagnostics.warnings : []),
        ...(Array.isArray(validation?.warnings) ? validation.warnings : []),
      ]),
    ),
  }
}

async function main() {
  const harness = loadOpenAIContractHarness()
  const config = harness.getOpenAIBrainConfig?.()

  if (!config?.apiKey) {
    console.log(
      JSON.stringify(
        {
          status: 'openai-unavailable',
          reason: 'OPENAI_API_KEY no esta configurada para esta prueba contract-only.',
        },
        null,
        2,
      ),
    )
    return
  }

  const requestBody = {
    model: config.model,
    input: [
      {
        role: 'system',
        content: [
          {
            type: 'input_text',
            text: buildContractOnlyPrompt(harness.buildOpenAIBrainSystemPrompt()),
          },
        ],
      },
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: buildContractOnlyUserPrompt(),
          },
        ],
      },
    ],
    reasoning: {
      effort: config.reasoningEffort,
    },
    text: {
      format: {
        type: 'json_schema',
        name: 'generated_domain_contract_only',
        strict: false,
        schema: buildContractOnlyResponseSchema(
          harness.buildOpenAIGeneratedDomainContractSchema,
        ),
      },
    },
  }

  const timeoutMs = Math.min(
    harness.resolveOpenAIBrainTimeoutMs({
      config,
      costMode: 'smart',
    }),
    90000,
  )
  const abortController = new AbortController()
  const timeoutId = setTimeout(() => abortController.abort(), timeoutMs)
  const requestStartedAt = Date.now()

  try {
    const response = await fetch(config.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
        ...(config.organization ? { 'OpenAI-Organization': config.organization } : {}),
        ...(config.project ? { 'OpenAI-Project': config.project } : {}),
      },
      body: JSON.stringify(requestBody),
      signal: abortController.signal,
    })

    const responseText = await response.text()
    if (!response.ok) {
      console.log(
        JSON.stringify(
          {
            status: 'openai-error',
            httpStatus: response.status,
            reason: 'OpenAI Responses API devolvio un error.',
          },
          null,
          2,
        ),
      )
      process.exitCode = 1
      return
    }

    let parsedPayload
    try {
      parsedPayload = JSON.parse(responseText)
    } catch {
      console.log(
        JSON.stringify(
          {
            status: 'invalid-json',
            reason: 'La Responses API devolvio un payload no parseable.',
          },
          null,
          2,
        ),
      )
      process.exitCode = 1
      return
    }

    const responseJsonText = harness.extractOpenAIResponseText(parsedPayload)
    if (!responseJsonText.trim()) {
      console.log(
        JSON.stringify(
          {
            status: 'missing-contract',
            reason: 'OpenAI no devolvio texto estructurado utilizable.',
          },
          null,
          2,
        ),
      )
      process.exitCode = 1
      return
    }

    let parsedResponse
    try {
      parsedResponse = JSON.parse(responseJsonText)
    } catch {
      console.log(
        JSON.stringify(
          {
            status: 'invalid-json',
            reason: 'El texto estructurado devuelto por OpenAI no es JSON valido.',
          },
          null,
          2,
        ),
      )
      process.exitCode = 1
      return
    }

    const contract = parsedResponse?.generatedDomainContract
    if (!contract || typeof contract !== 'object') {
      console.log(
        JSON.stringify(
          {
            status: 'missing-contract',
            reason: 'OpenAI no devolvio generatedDomainContract en la respuesta contract-only.',
          },
          null,
          2,
        ),
      )
      process.exitCode = 1
      return
    }

    const normalizedContract = normalizeGeneratedDomainContract(contract)
    const validation = validateGeneratedDomainContract(normalizedContract)
    const safety = isContractSafeForLocalMaterialization(normalizedContract)
    const diagnostics = buildGeneratedDomainContractDiagnostics(
      {
        generatedDomainContract: contract,
      },
      repoRoot,
    )

    console.log(
      JSON.stringify(
        summarizeDiagnostics({
          diagnostics,
          normalizedContract,
          validation,
          safety,
        }),
        null,
        2,
      ),
    )

    if (!(diagnostics.present && diagnostics.valid && diagnostics.safeForLocalMaterialization)) {
      process.exitCode = 1
    }
  } catch (error) {
    if (error?.name === 'AbortError') {
      const elapsedMs = Math.max(0, Date.now() - requestStartedAt)
      console.log(
        JSON.stringify(
          {
            status: 'timeout',
            timeoutMs,
            elapsedMs,
            reason: 'OpenAI supero el timeout de la prueba contract-only.',
          },
          null,
          2,
        ),
      )
      process.exitCode = 1
      return
    }

    console.log(
      JSON.stringify(
        {
          status: 'openai-error',
          reason: error instanceof Error ? error.message : String(error),
        },
        null,
        2,
      ),
    )
    process.exitCode = 1
  } finally {
    clearTimeout(timeoutId)
  }
}

main()
