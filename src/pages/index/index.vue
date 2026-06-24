<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { PRIVACY_AGREED_KEY, PRIVACY_CONTENT } from '@/constants/privacy'
import { useWifiHistoryStore } from '@/store/wifiHistory'
import { parseWifiQr } from '@/utils/wifi'

defineOptions({ name: 'Home' })

definePage({
  type: 'home',
  style: {
    navigationBarTitleText: 'WiFi小助手',
  },
})

const wifiHistoryStore = useWifiHistoryStore()
const { count: historyCount } = storeToRefs(wifiHistoryStore)

const showPrivacy = ref(false)

onShow(() => {
  if (!uni.getStorageSync(PRIVACY_AGREED_KEY))
    showPrivacy.value = true
})

function agreePrivacy() {
  uni.setStorageSync(PRIVACY_AGREED_KEY, true)
  showPrivacy.value = false
}

function rejectPrivacy() {
  uni.showModal({
    title: '提示',
    content: '需同意用户协议和隐私政策后才能使用本小程序',
    showCancel: false,
  })
}

function handleScan() {
  uni.scanCode({
    onlyFromCamera: true,
    scanType: ['qrCode'],
    success(res) {
      const raw = res.result?.trim() ?? ''
      if (!raw) {
        uni.showToast({ title: '未识别到有效内容', icon: 'none' })
        return
      }
      const info = parseWifiQr(raw)
      if (!info) {
        uni.navigateTo({
          url: `/pages/scanResult/scanResult?invalid=1&raw=${encodeURIComponent(raw)}`,
        })
        return
      }
      wifiHistoryStore.add(info, 'scanned')
      uni.navigateTo({
        url: `/pages/scanResult/scanResult?ssid=${encodeURIComponent(info.ssid)}&password=${encodeURIComponent(info.password)}&encryption=${encodeURIComponent(info.encryption)}`,
      })
    },
    fail(err) {
      const msg = String(err?.errMsg ?? '')
      if (msg.includes('auth deny') || msg.includes('authorize') || msg.includes('permission')) {
        uni.showModal({
          title: '需要相机权限',
          content: '需要相机权限才能扫码，请在设置中开启相机权限',
          confirmText: '去设置',
          success(res) {
            if (res.confirm)
              uni.openSetting({})
          },
        })
        return
      }
      if (!msg.includes('cancel'))
        uni.showToast({ title: '扫码失败，请重试', icon: 'none' })
    },
  })
}

function goGenerate() {
  uni.navigateTo({ url: '/pages/generate/generate' })
}

function goHistory() {
  uni.navigateTo({ url: '/pages/history/history' })
}
</script>

<template>
  <view class="page">
    <view class="header">
      <view class="logo-wrap">
        <wd-icon name="link" size="56px" color="#fff" />
      </view>
      <view class="title">
        WiFi小助手
      </view>
      <view class="subtitle">
        扫码连网 · 分享 WiFi
      </view>
    </view>

    <view class="actions">
      <wd-button

        round block
        size="large"
        custom-class="hero-btn hero-btn-primary"
        @click="handleScan"
      >
        <view class="hero-btn-inner">
          <wd-icon name="camera" size="20px" />
          <text>扫一扫</text>
        </view>
      </wd-button>
      <wd-button

        size="large"
        round plain block
        custom-class="hero-btn hero-btn-secondary"
        @click="goGenerate"
      >
        <view class="hero-btn-inner">
          <wd-icon name="picture" size="20px" />
          <text>生成我的WiFi码</text>
        </view>
      </wd-button>
    </view>

    <wd-cell
      v-if="historyCount > 0"
      title="历史记录"
      is-link
      center
      custom-class="history-cell"
      @click="goHistory"
    >
      <wd-badge :value="historyCount" />
    </wd-cell>

    <wd-popup v-model="showPrivacy" :close-on-click-modal="false" custom-class="privacy-popup">
      <view class="privacy-box">
        <view class="privacy-title">
          用户协议与隐私政策
        </view>
        <scroll-view scroll-y class="privacy-scroll">
          <text class="privacy-content">{{ PRIVACY_CONTENT }}</text>
        </scroll-view>
        <view class="privacy-actions">
          <wd-button plain custom-class="privacy-btn" @click="rejectPrivacy">
            不同意
          </wd-button>
          <wd-button type="primary" custom-class="privacy-btn" @click="agreePrivacy">
            同意并继续
          </wd-button>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: linear-gradient(180deg, #007aff 0%, #007aff 180px, #f5f7fa 180px);
  padding: 0 24px 40px;
}

.header {
  padding-top: 48px;
  text-align: center;
  color: #fff;
}

.logo-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.title {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 1px;
}

.subtitle {
  margin-top: 8px;
  font-size: 14px;
  opacity: 0.85;
}

.actions {
  margin-top: 48px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hero-btn-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

:deep(.hero-btn-primary) {
  background: #fff !important;
  color: #007aff !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

:deep(.hero-btn-secondary) {
  background: rgba(255, 255, 255, 0.15) !important;
  color: #fff !important;
  border: 2px solid rgba(255, 255, 255, 0.6) !important;
}

:deep(.history-cell) {
  margin-top: 40px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.privacy-box {
  width: 300px;
  padding: 20px;
  background: #fff;
  border-radius: 12px;
}

.privacy-title {
  font-size: 17px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 12px;
  color: #333;
}

.privacy-scroll {
  max-height: 280px;
}

.privacy-content {
  font-size: 13px;
  line-height: 1.7;
  color: #666;
  white-space: pre-wrap;
}

.privacy-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

:deep(.privacy-btn) {
  flex: 1;
}
</style>
