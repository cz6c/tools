<script lang="ts" setup>
import type { WifiHistoryItem } from '@/store/wifiHistory'
import { storeToRefs } from 'pinia'
import { useWifiHistoryStore } from '@/store/wifiHistory'
import { formatHistoryTime } from '@/utils/formatTime'
import { encryptionLabel } from '@/utils/wifi'

defineOptions({ name: 'WifiHistory' })

definePage({
  style: {
    navigationBarTitleText: '历史记录',
  },
})

const wifiHistoryStore = useWifiHistoryStore()
const { items: list } = storeToRefs(wifiHistoryStore)

const keyword = ref('')

const WORKBENCH_KEY = '1111'

watch(keyword, (val) => {
  if (val === WORKBENCH_KEY) {
    keyword.value = ''
    uni.navigateTo({ url: '/pages/workbench/workbench' })
  }
})

const keywordTrimmed = computed(() => keyword.value.trim())

const filteredList = computed(() => {
  const q = keywordTrimmed.value.toLowerCase()
  if (!q || q === WORKBENCH_KEY)
    return list.value
  return list.value.filter(item => item.ssid.toLowerCase().includes(q))
})

function typeLabel(type: WifiHistoryItem['type']) {
  return type === 'scanned' ? '扫码' : '生成'
}

function openItem(item: WifiHistoryItem) {
  if (item.type === 'scanned') {
    uni.navigateTo({
      url: `/pages/scanResult/scanResult?ssid=${encodeURIComponent(item.ssid)}&password=${encodeURIComponent(item.password)}&encryption=${encodeURIComponent(item.encryption)}`,
    })
  }
  else {
    uni.navigateTo({
      url: `/pages/generate/generate?id=${encodeURIComponent(item.id)}`,
    })
  }
}

function confirmClear() {
  if (list.value.length === 0)
    return
  uni.showModal({
    title: '清空历史',
    content: '确定清空全部历史记录吗？此操作不可恢复',
    confirmColor: '#ff4d4f',
    success(res) {
      if (!res.confirm)
        return
      wifiHistoryStore.clearAll()
      uni.showToast({ title: '已清空', icon: 'success' })
    },
  })
}
</script>

<template>
  <view class="page-shell px-32rpx pb-80rpx pt-24rpx">
    <wd-search
      v-model="keyword"
      placeholder="搜索 WiFi 名称"
      hide-cancel
      custom-class="mb-16rpx"
    />

    <view v-if="list.length > 0" class="flex items-center justify-between px-8rpx py-16rpx pb-24rpx">
      <text class="text-26rpx text-#999">
        {{ keywordTrimmed ? `找到 ${filteredList.length} 条` : `共 ${list.length} 条` }}
      </text>
      <wd-button variant="plain" size="small" custom-class="clear-btn" @click="confirmClear">
        清空
      </wd-button>
    </view>

    <wd-empty
      v-if="list.length === 0"
      tip="暂无历史记录，扫码或生成 WiFi 码后会自动保存"
    />

    <wd-empty
      v-else-if="keywordTrimmed && keywordTrimmed !== WORKBENCH_KEY && filteredList.length === 0"
      tip="未找到匹配的 WiFi 记录"
    />

    <wd-cell-group center v-else border custom-class="card-rounded" :title-width="100">
      <wd-cell
        v-for="item in filteredList"
        :key="item.id"
        :title="item.ssid"
        :value="formatHistoryTime(item.createdAt)"
        is-link
        @click="openItem(item)"
      >
        <template #label>
          <view class="mt-8rpx flex gap-12rpx">
            <wd-tag type="default" mark>
              {{ encryptionLabel(item.encryption) }}
            </wd-tag>
            <wd-tag
              :type="item.type === 'scanned' ? 'primary' : 'success'"
              mark
            >
              {{ typeLabel(item.type) }}
            </wd-tag>
          </view>
        </template>
      </wd-cell>
    </wd-cell-group>
  </view>
</template>

<style scoped lang="scss">
:deep(.clear-btn) {
  color: #ff4d4f !important;
  border-color: #ff4d4f !important;
}
</style>
