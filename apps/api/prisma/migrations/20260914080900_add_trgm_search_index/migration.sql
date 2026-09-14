-- 中文关键词搜索依赖 pg_trgm 提供的三元组操作符类。
-- PostgreSQL 13 起 pg_trgm 属于可信扩展，普通用户即可创建。
-- 注意：把扩展放在这里而不是 schema.prisma，是为了避免引入
-- Prisma 的 postgresqlExtensions 预览特性。
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateIndex
CREATE INDEX "items_title_trgm_idx" ON "items" USING GIN ("title" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "items_description_trgm_idx" ON "items" USING GIN ("description" gin_trgm_ops);
