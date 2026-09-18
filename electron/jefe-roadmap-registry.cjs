const phases = [
  ['A', 'Demo local controlada', 'partial / implemented'],
  ['B', 'Input assets y materiales de marca', 'planned'],
  ['C', 'Modos de proyecto', 'planned'],
  ['D', 'Contexto y decision de inteligencia', 'planned'],
  ['E', 'Codex Builder Loop', 'planned'],
  ['F', 'Assets y datos', 'planned'],
  ['G', 'QA y testing', 'planned'],
  ['H', 'Seguridad, calidad y rendimiento', 'planned'],
  ['I', 'Evaluacion IA', 'planned'],
  ['J', 'Release', 'planned'],
  ['K', 'Analitica y monetizacion', 'planned'],
  ['L', 'Memoria validada', 'planned'],
]

const projectModes = [
  'crear proyecto nuevo',
  'continuar proyecto existente',
  'terminar proyecto incompleto',
  'mejorar proyecto existente',
  'crear assets / datos / base',
  'auditar idea/proyecto antes de construir',
]

const intelligenceDecisionLevels = [
  'CONTEXT_SUFFICIENT',
  'CONTEXT_PARTIAL',
  'CONTEXT_INSUFFICIENT',
  'EXTERNAL_INTELLIGENCE_REQUIRED',
  'HIGH_RISK_EXTERNAL_REQUIRED',
]

const currentCapabilities = [
  'brief intake',
  '10 reportes',
  'Project Contract',
  'MVP Scope',
  'Architecture Plan',
  'Data Model inicial',
  'Backlog',
  'Risk Register',
  'QA Checklist',
  'primera version local mock',
  'abrir app demo',
  'abrir carpeta',
  'copiar rutas',
  'project type registry',
  'target platform detector',
  'capability matrix',
  'arquitectura prevista visible',
]

const plannedCapabilities = [
  'input assets',
  'brand materials',
  'continuar proyectos existentes',
  'auditar proyecto existente',
  'terminar proyecto incompleto',
  'OpenAI API escalation',
  'Hermes / Scout research',
  'Codex build orchestration',
  'asset generation',
  'database / schema generation',
  'Vitest',
  'MSW',
  'Playwright',
  'Gitleaks',
  'Semgrep',
  'Trivy',
  'axe',
  'Lighthouse',
  'Promptfoo',
  'staging',
  'produccion',
  'analitica',
  'monetizacion',
  'memoria validada',
  'governance',
  'approvals',
  'cost control',
]

const nextRecommendedMilestones = [
  'Input assets y materiales de marca',
  'Continuar proyectos existentes',
  'Codex build loop aprobado',
  'QA completo',
  'Staging / produccion',
  'Analitica / monetizacion / memoria validada',
]

module.exports = {
  phases,
  projectModes,
  intelligenceDecisionLevels,
  currentCapabilities,
  plannedCapabilities,
  nextRecommendedMilestones,
}
