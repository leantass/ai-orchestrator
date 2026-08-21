const { canonical, checksum, safeText } = require('./jefe-context-package-contract.cjs')
const { AGENT_PURPOSES } = require('./jefe-context-package-contract.cjs')
const FINDINGS = Object.freeze(['observation','evidence_reference','assumption','risk','question','requirement_proposal','constraint_proposal','plan_proposal','technical_result','validation_result','failure','correction_proposal'])
const FORBIDDEN = /human_decision|human_approval|visual_approval|deploy_approval|release_approval|published|production_ready|system.?prompt|chain.?of.?thought|reasoning|command|script|token|secret|cookie|header|environment|file:\/\//iu
class AgentResultError extends Error { constructor(code, message) { super(message); this.code=code } }
function fail(code,message){throw new AgentResultError(code,message)}
function text(value){return typeof value==='string'&&value.length<=2000&&safeText(value)&&!FORBIDDEN.test(value)}
function reference(value){return value&&typeof value==='object'&&value.kind==='url'&&typeof value.value==='string'&&/^https:\/\/[^\s]+$/iu.test(value.value)&&!FORBIDDEN.test(value.value)?{kind:'url',value:value.value}:null}
function validateResult(raw, attempt, now){
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).some(k=>!['status','summary','findings','artifactReferences','requestedHumanAction','diagnostics'].includes(k)))fail('INVALID_RESULT','El resultado del consumidor no es valido.')
 if(!['success','partial','failed'].includes(raw.status)||!text(raw.summary)||!Array.isArray(raw.findings)||raw.findings.length>30)fail('INVALID_RESULT','El resultado del consumidor no es valido.')
 const findings=raw.findings.map(item=>{if(!item||typeof item!=='object'||!FINDINGS.includes(item.kind)||!text(item.summary)||!AGENT_PURPOSES[attempt.targetAgent])fail('INVALID_FINDING','El finding no es valido.');return {kind:item.kind,summary:item.summary,references:Array.isArray(item.references)?item.references.map(reference).filter(Boolean):[]}})
 const refs=Array.isArray(raw.artifactReferences)?raw.artifactReferences.map(reference).filter(Boolean):[]
 if(raw.requestedHumanAction!==undefined&&!text(raw.requestedHumanAction))fail('INVALID_RESULT','La accion humana solicitada no es valida.')
 const data={schemaVersion:'jefe-agent-result/v1',attemptId:attempt.attemptId,packageId:attempt.packageId,targetAgent:attempt.targetAgent,purpose:attempt.purpose,identity:attempt.identity,actor:'internal_consumer',authority:'untrusted',provenance:'agent_context_handoff',status:raw.status,summary:raw.summary,findings,artifactReferences:refs,requestedHumanAction:raw.requestedHumanAction||null,diagnostics:raw.diagnostics&&text(raw.diagnostics)?raw.diagnostics:null,createdAt:now}
 const resultId=`agent-result-${checksum(data).slice(0,32)}`; return {...data,resultId,integrity:{algorithm:'sha256',checksum:checksum({...data,resultId}),deterministic:true,trust:'untrusted',ingestion:'not_ingested'}}
}
module.exports={AgentResultError,FINDINGS,validateResult}
