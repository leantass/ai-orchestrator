# Semantic Runtime Adapter V1

Web y Electron exponen una operación allowlisted de semantic correction que recibe únicamente `projectId`, `sourceVersionId` e `idempotencyKey` opcional. Ambos adapters delegan al mismo servicio semantic promotion; ningún shell recibe execution packages, planes, quality reports, paths o provenance.

El resolver de ejecución es una dependencia interna del backend y puede inyectarse sólo en el harness sintético offline. La respuesta se limita a identidad, estado, versión promovida, preview y error seguro. La integración no agrega UI ni habilita provider; la conexión con el bootstrap productivo de Electron queda pendiente si no se configura el servicio en ese proceso.

Web smoke isolation: responsive and preview-open tests create a synthetic project through JEFE contracts, use a temporary data root, a dynamic loopback port, and an isolated headless Chrome profile. They do not depend on VetNova, Floe, port 17580, or a pre-existing JEFE server. The preview is checked over real HTTP and the harness cleans only its own processes and temporary data.
