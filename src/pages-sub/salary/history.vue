<script lang="ts" setup>
import type { SalaryHistoryItem } from '@/store/salaryHistory'
import { useQueue } from '@wot-ui/ui'
import { storeToRefs } from 'pinia'
import { useSalaryHistoryStore } from '@/store/salaryHistory'

defineOptions({ name: 'SalaryHistory' })

const { closeOutside } = useQueue()

definePage({
  style: {
    navigationBarTitleText: '历史记录',
  },
})

const salaryHistoryStore = useSalaryHistoryStore()
const { items: list } = storeToRefs(salaryHistoryStore)

function openDetail(item: SalaryHistoryItem) {
  uni.navigateTo({ url: `/pages-sub/salary/detail?id=${encodeURIComponent(item.id)}` })
}

function fmt(n: number) {
  return (Math.round(n * 100) / 100).toFixed(2)
}

function formatTime(ts: number) {
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

function confirmDelete(item: SalaryHistoryItem) {
  uni.showModal({
    title: '删除记录',
    content: '确定删除这条历史记录吗？',
    success(res) {
      if (!res.confirm)
        return
      salaryHistoryStore.removeById(item.id)
      uni.showToast({ title: '已删除', icon: 'success' })
    },
  })
}
</script>

<template>
  <view class="page-shell pb-safe" @click="closeOutside">
    <wd-notice-bar text="历史记录存在本地，左滑可进行删除，删除后不可恢复" prefix="notification" closable />
    <view class="p-24rpx">
      <wd-empty
        v-if="list.length === 0"
        tip="暂无历史记录，在薪资计算页点击「查看明细」会自动保存一条。"
      />
      <view v-for="item in list" :key="item.id" class="mb-20rpx">
        <wd-swipe-action>
          <view class="card-rounded p-28rpx" @click="openDetail(item)">
            <view class="flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1">
                <view class="text-30rpx text-#333 font-medium">
                  {{ item.title }}
                </view>
                <view class="mt-12rpx text-24rpx text-#999">
                  {{ formatTime(item.savedAt) }}
                </view>
              </view>
              <view class="shrink-0 text-right">
                <view class="text-32rpx text-primary font-semibold tabular-nums">
                  ¥{{ fmt(item.snapshot.result.annualTakeHome) }}
                </view>
                <view class="mt-8rpx text-22rpx text-#999">
                  到手年薪
                </view>
              </view>
            </view>
          </view>
          <template #right>
            <view class="flex h-full">
              <view
                class="history-swipe-del center box-border h-full min-h-144rpx px-40rpx"
                @click.stop="confirmDelete(item)"
              >
                <text class="text-28rpx text-white">
                  删除
                </text>
              </view>
            </view>
          </template>
        </wd-swipe-action>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.history-swipe-del {
  background: #e2231a;
}
</style>
