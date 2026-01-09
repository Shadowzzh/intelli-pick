-- 清空所有数据表（保留表结构）
-- 使用方法：psql $DATABASE_URL < scripts/db-reset.sql

-- 先关闭所有触发器（避免级联删除问题）
SET session_replication_role = 'replica';

-- 清空所有表（按依赖顺序）
TRUNCATE TABLE
  entity_mentions,
  tags,
  contents,
  entities,
  quarantine,
  sources
RESTART IDENTITY CASCADE;

-- 重新启用触发器
SET session_replication_role = 'DEFAULT';

-- 显示剩余行数（应该都是 0）
SELECT
  'contents' as table_name, COUNT(*) FROM contents
UNION ALL
SELECT 'entities', COUNT(*) FROM entities
UNION ALL
SELECT 'entity_mentions', COUNT(*) FROM entity_mentions
UNION ALL
SELECT 'tags', COUNT(*) FROM tags
UNION ALL
SELECT 'quarantine', COUNT(*) FROM quarantine
UNION ALL
SELECT 'sources', COUNT(*) FROM sources;
