import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // 집계 통계
    const totalGen = await query<{ count: string }>(
      `SELECT COUNT(*)::text as count FROM generations WHERE deleted_at IS NULL`,
    );
    const totalCompleted = await query<{ count: string }>(
      `SELECT COUNT(*)::text as count FROM generations WHERE status = 'completed' AND deleted_at IS NULL`,
    );
    const totalPublished = await query<{ count: string }>(
      `SELECT COUNT(*)::text as count FROM generations WHERE publish_status IN ('draft', 'published') AND deleted_at IS NULL`,
    );
    const avgSeo = await query<{ avg: string }>(
      `SELECT COALESCE(ROUND(AVG(seo_score)), 0)::text as avg FROM generations WHERE seo_score IS NOT NULL AND deleted_at IS NULL`,
    );
    const totalCost = await query<{ sum: string }>(
      `SELECT COALESCE(SUM(cost_usd), 0)::text as sum FROM generations WHERE deleted_at IS NULL`,
    );

    // 일별 생성 수 (최근 30일)
    const dailyStats = await query<{ date: string; count: string }>(
      `SELECT DATE(created_at)::text as date, COUNT(*)::text as count
       FROM generations WHERE deleted_at IS NULL AND created_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at) ORDER BY date`,
    );

    // 스타일별 분포
    const styleStats = await query<{ style: string; count: string }>(
      `SELECT style, COUNT(*)::text as count
       FROM generations WHERE deleted_at IS NULL
       GROUP BY style ORDER BY count DESC`,
    );

    return NextResponse.json({
      summary: {
        totalGenerated: parseInt(totalGen[0]?.count || '0'),
        totalCompleted: parseInt(totalCompleted[0]?.count || '0'),
        totalPublished: parseInt(totalPublished[0]?.count || '0'),
        avgSeoScore: parseInt(avgSeo[0]?.avg || '0'),
        totalCostUsd: parseFloat(totalCost[0]?.sum || '0'),
      },
      dailyStats: dailyStats.map(r => ({ date: r.date, count: parseInt(r.count) })),
      styleStats: styleStats.map(r => ({ style: r.style, count: parseInt(r.count) })),
    });
  } catch (err) {
    console.error('[Metrics] GET error:', err);
    return NextResponse.json({ error: '통계 조회 실패' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { generationId, views, uniqueVisitors, keywordRank, keyword, notes } = await request.json();

    if (!generationId) {
      return NextResponse.json({ error: 'generationId가 필요합니다.' }, { status: 400 });
    }

    await query(
      `INSERT INTO post_metrics (generation_id, views, unique_visitors, keyword_rank, keyword, notes)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [generationId, views || null, uniqueVisitors || null, keywordRank || null, keyword || null, notes || null],
    );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error('[Metrics] POST error:', err);
    return NextResponse.json({ error: '지표 저장 실패' }, { status: 500 });
  }
}
