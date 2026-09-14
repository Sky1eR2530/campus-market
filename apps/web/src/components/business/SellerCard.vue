<script setup lang="ts">
import type { SellerProfile } from '@campus/shared'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import { AppIcon } from '@campus/ui'
import { formatDate } from '@campus/shared'

defineProps<{ seller: SellerProfile }>()
</script>

<template>
  <section class="seller" aria-label="卖家信息">
    <AppAvatar :name="seller.nickname" :src="seller.avatarUrl" :seed="seller.id" :size="48" />

    <div class="seller__body">
      <p class="seller__name">{{ seller.nickname }}</p>
      <p v-if="seller.school || seller.campus" class="seller__place">
        <AppIcon name="location" :size="13" />
        <span v-if="seller.school">{{ seller.school }}</span>
        <span v-if="seller.campus">{{ seller.campus }}</span>
      </p>
      <!--
        这三项用间距分组，不用「A · B · C」往一个字符串里堆。
        中点拼接是程序生成的元信息最典型的痕迹。
      -->
      <p class="seller__stats">
        <span>发布 {{ seller.itemCount }} 件</span>
        <span>在售 {{ seller.onSaleCount }} 件</span>
        <span>加入于 {{ formatDate(seller.createdAt) }}</span>
      </p>
    </div>
  </section>

  <p v-if="seller.bio" class="seller__bio">{{ seller.bio }}</p>
</template>

<style scoped>
.seller {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.seller__body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.seller__name {
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
}

.seller__place {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.seller__stats {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.seller__bio {
  margin-top: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-neutral-100);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
}
</style>
