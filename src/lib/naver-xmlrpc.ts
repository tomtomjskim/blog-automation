import xmlrpc from 'xmlrpc';
import { query, queryOne } from './db';
import type { NaverBlogConfig } from './types';

/** 네이버 블로그 설정 여부 확인 */
export async function isNaverConfigured(): Promise<boolean> {
  const blogId = await queryOne<{ value: string }>(
    "SELECT value FROM blog_settings WHERE key = 'naver_blog_id'",
  );
  const password = await queryOne<{ value: string }>(
    "SELECT value FROM blog_settings WHERE key = 'naver_api_password'",
  );
  return !!(blogId?.value && password?.value);
}

/** 네이버 블로그 설정 조회 */
export async function getNaverConfig(): Promise<NaverBlogConfig | null> {
  const blogId = await queryOne<{ value: string }>(
    "SELECT value FROM blog_settings WHERE key = 'naver_blog_id'",
  );
  const password = await queryOne<{ value: string }>(
    "SELECT value FROM blog_settings WHERE key = 'naver_api_password'",
  );
  if (!blogId?.value || !password?.value) return null;
  return { blogId: blogId.value, password: password.value };
}

/** 네이버 블로그 설정 저장 */
export async function saveNaverConfig(config: NaverBlogConfig): Promise<void> {
  await query(
    `INSERT INTO blog_settings (key, value, updated_at) VALUES ('naver_blog_id', $1, NOW())
     ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
    [config.blogId],
  );
  await query(
    `INSERT INTO blog_settings (key, value, updated_at) VALUES ('naver_api_password', $1, NOW())
     ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
    [config.password],
  );
}

/** XML-RPC 클라이언트 생성 */
function createClient() {
  return xmlrpc.createSecureClient({
    host: 'api.blog.naver.com',
    port: 443,
    path: '/xmlrpc',
  });
}

/** 카테고리 목록 조회 */
export async function getNaverCategories(config: NaverBlogConfig): Promise<Array<{ id: string; name: string }>> {
  return new Promise((resolve, reject) => {
    const client = createClient();
    client.methodCall(
      'metaWeblog.getCategories',
      [config.blogId, config.blogId, config.password],
      (error: any, value: any) => {
        if (error) {
          reject(new Error(`카테고리 조회 실패: ${error.message}`));
          return;
        }
        const categories = (value as Array<{ categoryId: string; title: string }>).map(c => ({
          id: c.categoryId || '',
          name: c.title || '',
        }));
        resolve(categories);
      },
    );
  });
}

interface NaverPost {
  title: string;
  content: string;
  categoryId?: string;
}

interface PublishResult {
  postId: string;
  postUrl: string;
}

/** 네이버 블로그에 글 발행 */
export async function publishToNaver(
  config: NaverBlogConfig,
  post: NaverPost,
  publishAs: 'draft' | 'published' = 'draft',
): Promise<PublishResult> {
  // 1일 2건 제한 확인
  const todayCount = await queryOne<{ count: string }>(
    `SELECT COUNT(*)::text as count FROM generations
     WHERE publish_status IN ('draft', 'published')
       AND published_at >= CURRENT_DATE
       AND published_at < CURRENT_DATE + INTERVAL '1 day'`,
  );
  if (parseInt(todayCount?.count || '0') >= 2) {
    throw new Error('오늘 이미 2건을 발행했습니다. 내일 다시 시도해주세요.');
  }

  return new Promise((resolve, reject) => {
    const client = createClient();

    const struct: Record<string, unknown> = {
      title: post.title,
      description: post.content,
    };

    if (post.categoryId) {
      struct.categories = [{ categoryId: post.categoryId }];
    }

    const publish = publishAs === 'published';

    client.methodCall(
      'metaWeblog.newPost',
      [config.blogId, config.blogId, config.password, struct, publish],
      (error: any, value: any) => {
        if (error) {
          reject(new Error(`발행 실패: ${error.message}`));
          return;
        }
        const postId = String(value);
        const postUrl = `https://blog.naver.com/${config.blogId}/${postId}`;
        resolve({ postId, postUrl });
      },
    );
  });
}

/** 연결 테스트 */
export async function testNaverConnection(config: NaverBlogConfig): Promise<boolean> {
  try {
    await getNaverCategories(config);
    return true;
  } catch {
    return false;
  }
}
