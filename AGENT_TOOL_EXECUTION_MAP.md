# Agent Tool Execution Map & Ground Truth Protocol

## Executive Summary

To eliminate simulated evidence blocks and fake metrics, the HeyPrince AI Workforce operates under a strict **Ground Truth Protocol**. 

All performance figures, search queries, route latencies, and business counts cited in discussions, evidence cards, or executive proposals must originate from live executable tools in `src/lib/company/tools.ts` or `src/lib/chief-of-staff/agents/`. Speculative projections must be explicitly flagged with `[ESTIMATE]`.

---

## 1. Tool Execution Registry

| Tool Function | Responsible Agent | Department | Telemetry & Execution Source | Output Schema |
| :--- | :--- | :--- | :--- | :--- |
| `auditLiveWebsiteLatency` | David Chen (`david_chen`) | Infrastructure | Live HTTP probes to `https://heyprince.in`, `/about/`, `/services/`, `/insights/`, `/contact/` with `AbortController` (6s timeout) | `{ baseUrl, routesAudited, averageLatencyMs, allRoutes: [{ route, status, ok, responseTimeMs }], slowOrFailingCount, fastestRoute }` |
| `auditLiveDatabaseSeo` | Elena Rostova (`elena_rostova`) | Growth & Search | Supabase PostgreSQL query against `posts` table (analyzing title length, meta description presence, and character count) | `{ totalPublishedAudited, missingMetaDescriptionCount, shortTitlesCount, longTitlesCount, topSampleIssues: [{ slug, issue }] }` |
| `auditLiveLeadIntelligence` | Liam Thorne (`liam_thorne`) | Sales | Supabase PostgreSQL query against `businesses` table; aggregation by pipeline status and target industry | `{ totalBusinessesDiscovered, pipelineBreakdown: { DISCOVERED, ENRICHED, AUDITED }, topTargetIndustries: [{ industry, count }] }` |
| `getLiveCompanyOverviewMetrics` | Alex Vance (`alex_vance`) | Executive | Aggregated queries across `services`, `posts`, `company_tasks`, and `company_proposals` | `{ publishedInsightsCount, activeServicesCount, services: string[], tasksBreakdown, proposalsBreakdown }` |
| `discoveryService.executeJob` | Liam Thorne (`liam_thorne`) | Sales | OpenStreetMap Overpass API discovery queries for target geo-cities and categories | `{ totalInserted, duplicateCount, jobRecordId }` |
| `createPost` | Marcus Sterling (`marcus_sterling`) | Editorial | Admin database post insertion gated by CEO proposal approval | `{ success, post: { id, title, slug } }` |

---

## 2. Dynamic Tool Dispatcher

In `src/lib/company/tools.ts`, `executeRelevantAgentTool(speaker, topicOrObjective)` analyzes the discussion agenda and automatically runs the appropriate telemetry probe before the agent turn is formulated:

```typescript
export async function executeRelevantAgentTool(
  employee: CompanyEmployee,
  topicOrObjective: string
): Promise<ToolExecutionResult | null> {
  const queryLower = (topicOrObjective || '').toLowerCase();

  if (employee.department === 'Infrastructure' || queryLower.includes('latency') || queryLower.includes('speed') || queryLower.includes('cwv')) {
    return await auditLiveWebsiteLatency(employee.id);
  }
  if (employee.department === 'Growth' || queryLower.includes('seo') || queryLower.includes('keyword') || queryLower.includes('traffic')) {
    return await auditLiveDatabaseSeo(employee.id);
  }
  if (employee.department === 'Sales' || queryLower.includes('lead') || queryLower.includes('client') || queryLower.includes('revenue')) {
    return await auditLiveLeadIntelligence(employee.id);
  }
  if (employee.department === 'Executive' || employee.department === 'Editorial' || queryLower.includes('growth') || queryLower.includes('service')) {
    return await getLiveCompanyOverviewMetrics(employee.id);
  }
  return null;
}
```

---

## 3. Ground Truth Evidence Rendering

When tool telemetry is captured, the evidence payload inserted into `company_messages.evidence` carries:
```json
{
  "isLive": true,
  "tool": "website_latency_probe",
  "timestamp": "2026-11-09T03:31:50.123Z",
  "averageLatencyMs": 725,
  "routesAudited": 5,
  "slowOrFailingCount": 1
}
```
This guarantees that UI evidence badges display verifiable real-time engineering data rather than static JSON placeholders.
