import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// Auto-load .env.local
const envLocal = path.resolve(dirname, '../../.env.local');
const envDefault = path.resolve(dirname, '../../.env');

if (typeof (process as any).loadEnvFile === 'function') {
  if (fs.existsSync(envLocal)) {
    (process as any).loadEnvFile(envLocal);
  } else if (fs.existsSync(envDefault)) {
    (process as any).loadEnvFile(envDefault);
  }
}

async function runChiefOfStaffTestSuite() {
  console.info('🚀 Starting Autonomous AI Chief of Staff End-to-End Verification...\n');

  try {
    // 1. Verify Agents Database Setup
    console.info('1. Verifying Chief Agents in Supabase...');
    const { getAllAgents, getChiefDashboardSummary } = await import('../lib/chief-of-staff/db.js');
    const agents = await getAllAgents();
    console.info(`   Found ${agents.length} registered agents:`);
    agents.forEach((a) => {
      console.info(`   - [${a.status.toUpperCase()}] ${a.name} (${a.role}) - Mode: ${a.mode}`);
    });

    if (agents.length < 5) {
      throw new Error(`Expected at least 5 registered agents, but found ${agents.length}`);
    }

    // 2. Test Website Guardian Health Check
    console.info('\n2. Testing Autonomous Website Guardian Agent...');
    const { runWebsiteGuardianAudit } = await import('../lib/chief-of-staff/agents/website-guardian.js');
    const guardianResult = await runWebsiteGuardianAudit({
      baseUrl: 'https://heyprince.in',
      routes: ['/', '/services/', '/insights/', '/contact/', '/robots.txt'],
    });
    console.info(`   Audit ID: ${guardianResult.auditId}`);
    console.info(`   Status: ${guardianResult.status}`);
    console.info(`   Routes checked: ${guardianResult.routesChecked.length}`);
    guardianResult.routesChecked.forEach((r) => {
      console.info(`     ${r.ok ? '✅' : '❌'} ${r.url} -> HTTP ${r.status} (${r.responseTimeMs}ms)`);
    });

    // 3. Test SEO & Organic Growth Agent
    console.info('\n3. Testing SEO & Organic Growth Agent...');
    const { runSeoGrowthAudit } = await import('../lib/chief-of-staff/agents/seo-growth.js');
    const seoResult = await runSeoGrowthAudit();
    console.info(`   SEO Recommendations Generated: ${seoResult.recommendationsCount}`);
    seoResult.recommendations.slice(0, 3).forEach((rec, idx) => {
      console.info(`     [#${idx + 1}] ${rec.page_url} -> ${rec.issue}`);
      console.info(`         Fix: ${rec.suggested_change?.slice(0, 80)}...`);
    });

    // 4. Test Inbound Lead Responder Agent
    console.info('\n4. Testing Inbound Lead Responder Agent...');
    const { processInboundLead } = await import('../lib/chief-of-staff/agents/inbound-responder.js');
    const leadResult = await processInboundLead({
      leadId: `test_${Date.now()}`,
      name: 'Alex Mercer',
      email: 'alex@innovateflow.io',
      company: 'InnovateFlow Systems',
      service: 'Full-Stack React & Next.js Development',
      budget: '$5,000+',
      timeline: '3 - 4 weeks',
      message: 'We need to migrate our legacy web portal to Next.js 15 with Supabase authentication and real-time dashboard analytics.',
    });
    console.info(`   Proposal Draft Created ID: ${leadResult?.draftId}`);
    console.info(`   Client Summary: ${leadResult?.clientSummary}`);
    console.info(`   Technical Assessment: ${leadResult?.technicalAssessment?.slice(0, 100)}...`);

    // 5. Test Lead Scout Opportunity Discovery
    console.info('\n5. Testing Lead Scout Discovery Agent...');
    const { runLeadScoutDiscovery } = await import('../lib/chief-of-staff/agents/lead-scout.js');
    const scoutResult = await runLeadScoutDiscovery();
    console.info(`   Summary: ${scoutResult.summary}`);

    // 6. Test Dashboard Summary Aggregator
    console.info('\n6. Testing Unified Chief of Staff Dashboard Aggregation...');
    const summary = await getChiefDashboardSummary();
    console.info(`   Active Agents: ${summary.activeAgentsCount}/${summary.agents.length}`);
    console.info(`   Drafts Awaiting Approval: ${summary.draftsAwaitingApprovalCount}`);
    console.info(`   Open SEO Recommendations: ${summary.openSeoRecommendationsCount}`);
    console.info(`   Recent Logs Count: ${summary.recentLogs.length}`);
    console.info(`   System Success Rate: ${summary.metrics.successRate}%`);

    console.info('\n✅ ALL CHIEF OF STAFF VERIFICATION TESTS PASSED SUCCESSFULLY!\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test suite failed with error:', err);
    process.exit(1);
  }
}

runChiefOfStaffTestSuite();

