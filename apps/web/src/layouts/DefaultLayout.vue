<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppFooter from '@/components/layout/AppFooter.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import BottomTabBar from '@/components/layout/BottomTabBar.vue'
</script>

<template>
  <div class="layout">
    <a class="layout__skip" href="#main">跳到主要内容</a>
    <AppHeader />

    <main id="main" class="layout__main">
      <RouterView />
    </main>

    <AppFooter />
    <BottomTabBar />
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.layout__main {
  flex: 1;
  /* 给移动端底部标签栏留出空间，最后一个元素不会被遮住 */
  padding-bottom: calc(var(--tabbar-height) + var(--safe-bottom));
}

.layout__skip {
  position: absolute;
  left: -9999px;
  top: 0;
  z-index: 999;
  padding: var(--space-3) var(--space-4);
  background: var(--color-primary-600);
  color: #fff;
  border-radius: 0 0 var(--radius-md) 0;
}

.layout__skip:focus {
  left: 0;
}

@media (min-width: 1024px) {
  .layout__main {
    padding-bottom: 0;
  }
}
</style>
