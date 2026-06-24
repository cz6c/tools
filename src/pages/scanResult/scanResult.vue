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
  <view class="page">
    <view v-if="invalid" class="invalid-box">
      <wd-empty tip="无效的WiFi二维码" />
      <view class="invalid-desc">
        扫描内容不是标准 WiFi 二维码格式，请确认二维码是否正确
      </view>
      <wd-button round block type="primary" custom-class="invalid-btn" @click="goHome">
        返回首页
      </wd-button>
    </view>

    <template v-else>
      <wd-cell-group border custom-class="info-group">
        <wd-cell title="网络名称" :value="ssid" />
        <wd-cell title="密码">
          <view class="password-cell">
            <text class="password-text">{{ displayPassword }}</text>
            <wd-button
              v-if="password"
              plain
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

      <view class="actions">
        <wd-button plain round block custom-class="action-btn" @click="copyPassword">
          复制密码
        </wd-button>
        <wd-button

          round block
          type="primary"
          :loading="connecting"
          custom-class="action-btn"
          @click="connectWifi"
        >
          连接WiFi
        </wd-button>
      </view>
    </template>
  </view>
</template>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
}

:deep(.info-group) {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.password-cell {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex: 1;
}

.password-text {
  font-size: 15px;
  color: #333;
  word-break: break-all;
  text-align: right;
}

.actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

:deep(.action-btn) {
  flex: 1;
}

.invalid-box {
  margin-top: 40px;
  padding: 24px 20px;
  background: #fff;
  border-radius: 16px;
  text-align: center;
}

:deep(.toggle-btn) {
  color: #007aff !important;
  border: none !important;
  padding: 0 !important;
  min-height: auto !important;
}

.invalid-desc {
  margin-top: 8px;
  font-size: 14px;
  color: #999;
  line-height: 1.6;
}

:deep(.invalid-btn) {
  margin-top: 24px;
}
</style>
