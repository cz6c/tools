<script lang="ts" setup>
import type { WifiEncryption } from '@/utils/wifi'
import { useWifiHistoryStore } from '@/store/wifiHistory'
import { canvasToTempFile, drawQrCode } from '@/utils/drawQrCode'
import { buildWifiQr, ENCRYPTION_OPTIONS } from '@/utils/wifi'

defineOptions({ name: 'Generate' })

definePage({
  style: {
    navigationBarTitleText: '生成WiFi码',
  },
})

const wifiHistoryStore = useWifiHistoryStore()

const canvasId = 'wifiQrCanvas'
const qrSize = 240

const ssid = ref('')
const password = ref('')
const encryption = ref<WifiEncryption>('WPA2')
const qrGenerated = ref(false)
const qrText = ref('')
const saving = ref(false)
const showEncryptionPicker = ref(false)

const encryptionLabel = computed(
  () => ENCRYPTION_OPTIONS.find(o => o.value === encryption.value)?.label ?? 'WPA2',
)

onLoad((query) => {
  const id = query?.id as string | undefined
  if (id) {
    const item = wifiHistoryStore.findById(id)
    if (item) {
      ssid.value = item.ssid
      password.value = item.password
      encryption.value = item.encryption
      return
    }
  }
  if (query?.ssid)
    ssid.value = decodeURIComponent(String(query.ssid))
  if (query?.password)
    password.value = decodeURIComponent(String(query.password))
  if (query?.encryption)
    encryption.value = decodeURIComponent(String(query.encryption)) as WifiEncryption
})

function pickEncryption(value: WifiEncryption) {
  encryption.value = value
  showEncryptionPicker.value = false
}

async function handleGenerate() {
  const name = ssid.value.trim()
  if (!name) {
    uni.showToast({ title: '请输入WiFi名称', icon: 'none' })
    return
  }

  const info = {
    ssid: name,
    password: password.value,
    encryption: encryption.value,
  }
  qrText.value = buildWifiQr(info)
  qrGenerated.value = true

  await nextTick()
  await drawQrCode(canvasId, qrText.value, qrSize)
  wifiHistoryStore.add(info, 'generated')
  uni.showToast({ title: '二维码已生成', icon: 'success' })
}

async function saveToAlbum() {
  if (!qrGenerated.value)
    return
  saving.value = true
  try {
    const tempPath = await canvasToTempFile(canvasId, qrSize)
    await new Promise<void>((resolve, reject) => {
      uni.saveImageToPhotosAlbum({
        filePath: tempPath,
        success: () => resolve(),
        fail: (err) => {
          const msg = String(err?.errMsg ?? '')
          if (msg.includes('auth deny') || msg.includes('authorize')) {
            uni.showModal({
              title: '需要相册权限',
              content: '需要相册权限才能保存图片，请在设置中开启',
              confirmText: '去设置',
              success(res) {
                if (res.confirm)
                  uni.openSetting({})
              },
            })
          }
          reject(err)
        },
      })
    })
    uni.showToast({ title: '已保存到相册', icon: 'success' })
  }
  catch {
    // 权限弹窗已处理
  }
  finally {
    saving.value = false
  }
}

function handleShare() {
  uni.showModal({
    title: '分享提示',
    content: '请先保存二维码到相册，再通过微信发送给好友',
    showCancel: false,
  })
}
</script>

<template>
  <view class="page">
    <wd-cell-group border custom-class="form-group">
      <wd-cell title="WiFi名称">
        <wd-input
          v-model="ssid"
          align-right
          placeholder="请输入网络名称（SSID）"
          custom-class="cell-input"
        />
      </wd-cell>
      <wd-cell title="密码">
        <wd-input
          v-model="password"
          align-right
          show-password
          placeholder="无密码可留空"
          custom-class="cell-input"
        />
      </wd-cell>
      <wd-cell
        title="加密类型"
        :value="encryptionLabel"
        is-link
        @click="showEncryptionPicker = true"
      />
    </wd-cell-group>

    <wd-button

      round block
      size="large"
      type="primary"
      custom-class="generate-btn"
      @click="handleGenerate"
    >
      生成二维码
    </wd-button>

    <view v-if="qrGenerated" class="qr-section">
      <view class="qr-wrap">
        <canvas
          :id="canvasId"
          :canvas-id="canvasId"
          class="qr-canvas"
          :style="{ width: `${qrSize}px`, height: `${qrSize}px` }"
        />
      </view>
      <view class="qr-actions">
        <wd-button

          plain round block
          :loading="saving"
          custom-class="qr-action-btn"
          @click="saveToAlbum"
        >
          保存到相册
        </wd-button>
        <wd-button

          round block
          type="primary"
          custom-class="qr-action-btn"
          @click="handleShare"
        >
          分享
        </wd-button>
      </view>
    </view>

    <wd-popup
      v-model="showEncryptionPicker"
      position="bottom"
      root-portal
      :safe-area-inset-bottom="true"
      closable
      lock-scroll
    >
      <view class="picker-sheet-title">
        加密类型
      </view>
      <wd-cell-group border>
        <wd-cell
          v-for="opt in ENCRYPTION_OPTIONS"
          :key="opt.value"
          :title="opt.label"
          clickable
          @click="pickEncryption(opt.value)"
        />
      </wd-cell-group>
    </wd-popup>
  </view>
</template>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 16px 16px 40px;
}

:deep(.form-group) {
  border-radius: 12px;
  overflow: hidden;
}

:deep(.cell-input) {
  flex: 1;
}

:deep(.generate-btn) {
  margin-top: 20px;
}

.picker-sheet-title {
  padding: 16px;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  color: #333;
}

.qr-section {
  margin-top: 24px;
  background: #fff;
  border-radius: 12px;
  padding: 24px 16px;
  text-align: center;
}

.qr-wrap {
  display: flex;
  justify-content: center;
}

.qr-canvas {
  display: block;
}

.qr-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

:deep(.qr-action-btn) {
  flex: 1;
}
</style>
