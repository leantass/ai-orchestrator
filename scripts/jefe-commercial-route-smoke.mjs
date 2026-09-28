import assert from 'node:assert/strict'
import { parseRoute, routePath } from '../src/commercial/routes.ts'

assert.deepEqual(parseRoute('/'), { kind: 'home' })
assert.deepEqual(parseRoute('/build'), { kind: 'build' })
assert.deepEqual(parseRoute('/projects'), { kind: 'projects' })
assert.deepEqual(parseRoute('/operation/'), { kind: 'operation' })
assert.deepEqual(parseRoute('/projects/demo/versions/v1'), { kind: 'projectVersion', projectId: 'demo', versionId: 'v1' })
assert.equal(routePath({ kind: 'projectVersion', projectId: 'demo-id', versionId: 'v1' }), '/projects/demo-id/versions/v1')
assert.equal(parseRoute('/banana').kind, 'notFound')
assert.equal(parseRoute('/projects/../secret').kind, 'notFound')
assert.equal(parseRoute('/projects/a%2Fb').kind, 'notFound')
assert.equal(parseRoute('/projects/a/versions/%2E%2E').kind, 'notFound')
console.log('PASS jefe-commercial-route-smoke: canonical routes, safe IDs, not-found and path round trips')
