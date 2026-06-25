<script lang="ts" setup>
import type { WifiEncryption } from '@/utils/wifi'
import { encryptionLabel } from '@/utils/wifi'

defineOptions({ name: 'ScanResult' })

definePage({
  style: {
    navigationBarTitleText: '扫码结果',
  },
})

const invalid = ref(false)
const ssid = ref('')
const password = ref('')
const encryption = ref<WifiEncryption>('WPA2')
const showPassword = ref(false)
const connecting = ref(false)

onLoad((query) => {
  if (query?.invalid === '1') {
    invalid.value = true
    return
  }
  ssid.value = decodeURIComponent(String(query?.ssid ?? ''))
  password.value = decodeURIComponent(String(query?.password ?? ''))
  encryption.value = (decodeURIComponent(String(query?.encryption ?? 'WPA2')) || 'WPA2') as WifiEncryption
})

const displayPassword = computed(() => {
  if (!password.value)
    return '（无密码）'
  return showPassword.value ? password.value : '••••••••'
})

function togglePassword() {
  showPassword.value = !showPassword.value
}

function copyPassword() {
  if (!password.value) {
    uni.showToast({ title: '该网络无密码', icon: 'none' })
    return
  }
  uni.setClipboardData({
    data: password.value,
    success: () => uni.showToast({ title: '密码已复制', icon: 'success' }),
  })
}

function showConnectFailModal() {
  uni.showModal({
    title: '连接失败',
    content: `连接失败，请前往系统设置手动连接\n\n网络名称：${ssid.value}\n密码：${password.value || '（无密码）'}`,
    confirmText: '复制密码',
    cancelText: '知道了',
    success(res) {
      if (res.confirm)
        copyPassword()
    },
  })
}

function connectWifi() {
  if (connecting.value)
    return
  connecting.value = true

  // #ifdef MP-WEIXIN
  uni.startWifi({
    success: () => {
      uni.connectWifi({
        SSID: ssid.value,
        password: password.value,
        success: () => {
          uni.showToast({ title: '连接成功', icon: 'success' })
        },
        fail: () => {
          showConnectFailModal()
        },
        complete: () => {
          connecting.value = false
        },
      })
    },
    fail: () => {
      connecting.value = false
      showConnectFailModal()
    },
  })
  // #endif

  // #ifndef MP-WEIXIN
  connecting.value = false
  uni.showModal({
    title: '提示',
    content: 'WiFi 自动连接仅支持微信小程序环境，请手动连接网络',
    showCancel: false,
  })
  // #endif
}

function goHome() {
  uni.navigateBack({
    fail: () => uni.reLaunch({ url: '/pages/index/index' }),
  })
}
</script>

<template>
  <view class="page-shell p-40rpx">
    <view v-if="invalid" class="mt-80rpx rounded-32rpx bg-white p-48rpx text-center">
      <wd-empty tip="无效的WiFi二维码" />
      <view class="mt-16rpx text-28rpx text-#999 leading-relaxed">
        扫描内容不是标准 WiFi 二维码格式，请确认二维码是否正确
      </view>
      <wd-button round block type="primary" custom-class="mt-48rpx" @click="goHome">
        返回首页
      </wd-button>
    </view>

    <template v-else>
      <wd-cell-group center border custom-class="card-rounded" :title-width="100">
        <wd-cell title="网络名称" :value="ssid" />
        <wd-cell title="密码">
          <view class="flex flex-1 items-center justify-end gap-16rpx">
            <text class="break-all text-right text-30rpx text-#333">{{ displayPassword }}</text>
            <wd-button
              v-if="password"
              variant="plain"
              size="small"
              custom-class="toggle-btn"
              @click="togglePassword"
            >
              {{ showPassword ? '隐藏' : '显示' }}
            </wd-button>
          </view>
        </wd-cell>
        <wd-cell title="加密类型" :value="encryptionLabel(encryption)" />
      </wd-cell-group>

      <view class="flex-actions mt-48rpx">
        <wd-button variant="plain" round block custom-class="flex-1" @click="copyPassword">
          复制密码
        </wd-button>
        <wd-button
          round block
          type="primary"
          :loading="connecting"
          custom-class="flex-1"
          @click="connectWifi"
        >
          连接WiFi
        </wd-button>
      </view>
    </template>
  </view>
</template>

<style scoped lang="scss">
:deep(.toggle-btn) {
  color: var(--wot-primary-6) !important;
  border: none !important;
  padding: 0 !important;
  min-height: auto !important;
}
</style>
