<script lang="ts" setup>
import type { FormSchema } from '@wot-ui/ui'
import type { FormExpose } from '@wot-ui/ui/components/wd-form/types'
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
/** 二维码展示尺寸（rpx），绘制时转为 px */
const qrSizeRpx = 480

const formRef = ref<FormExpose>()
const formModel = reactive({
  ssid: '',
  password: '',
  encryption: 'WPA2' as WifiEncryption,
})

const formSchema: FormSchema = {
  validate(model) {
    if (!String(model.ssid ?? '').trim())
      return [{ path: ['ssid'], message: '请输入WiFi名称' }]
    return []
  },
  isRequired(path) {
    return path === 'ssid'
  },
}

const qrGenerated = ref(false)
const qrText = ref('')
const saving = ref(false)
const showEncryptionPicker = ref(false)

const encryptionPickerValue = computed({
  get: () => [formModel.encryption],
  set: (value) => {
    formModel.encryption = value[0] as WifiEncryption
  },
})

const qrCanvasStyle = computed(() => ({
  width: `${qrSizeRpx}rpx`,
  height: `${qrSizeRpx}rpx`,
}))

function getQrSizePx() {
  return uni.upx2px(qrSizeRpx)
}

const encryptionLabel = computed(
  () => ENCRYPTION_OPTIONS.find(o => o.value === formModel.encryption)?.label ?? 'WPA2',
)

onLoad((query) => {
  const id = query?.id as string | undefined
  if (id) {
    const item = wifiHistoryStore.findById(id)
    if (item) {
      formModel.ssid = item.ssid
      formModel.password = item.password
      formModel.encryption = item.encryption
      return
    }
  }
  if (query?.ssid)
    formModel.ssid = decodeURIComponent(String(query.ssid))
  if (query?.password)
    formModel.password = decodeURIComponent(String(query.password))
  if (query?.encryption)
    formModel.encryption = decodeURIComponent(String(query.encryption)) as WifiEncryption
})

async function handleGenerate() {
  const { valid } = await formRef.value!.validate()
  if (!valid)
    return

  const info = {
    ssid: formModel.ssid.trim(),
    password: formModel.password,
    encryption: formModel.encryption,
  }
  qrText.value = buildWifiQr(info)
  qrGenerated.value = true

  await nextTick()
  const sizePx = getQrSizePx()
  await drawQrCode(canvasId, qrText.value, sizePx)
  wifiHistoryStore.add(info, 'generated')
  uni.showToast({ title: '二维码已生成', icon: 'success' })
}

async function saveToAlbum() {
  if (!qrGenerated.value)
    return
  saving.value = true
  try {
    const sizePx = getQrSizePx()
    const tempPath = await canvasToTempFile(canvasId, sizePx)
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
  <view class="page-shell px-32rpx pb-80rpx pt-32rpx">
    <wd-form
      ref="formRef"
      :model="formModel"
      :schema="formSchema"
      center
      border
      error-type="toast"
      :title-width="100"
      value-align="right"
      custom-class="card-rounded generate-form"
    >
      <wd-form-item title="WiFi名称" prop="ssid">
        <wd-input
          v-model="formModel.ssid"
          align-right
          placeholder="请输入网络名称（SSID）"
          custom-class="flex-1"
        />
      </wd-form-item>
      <wd-form-item title="密码" prop="password">
        <wd-input
          v-model="formModel.password"
          align-right
          show-password
          placeholder="无密码可留空"
          custom-class="flex-1"
        />
      </wd-form-item>
      <wd-form-item
        title="加密类型"
        prop="encryption"
        is-link
        :value="encryptionLabel"
        placeholder="请选择加密类型"
        @click="showEncryptionPicker = true"
      />
    </wd-form>

    <wd-picker
      v-model="encryptionPickerValue"
      v-model:visible="showEncryptionPicker"
      :columns="ENCRYPTION_OPTIONS"
      title="加密类型"
      root-portal
    />

    <wd-button
      round block
      size="large"
      type="primary"
      custom-class="mt-40rpx"
      @click="handleGenerate"
    >
      生成二维码
    </wd-button>

    <view v-if="qrGenerated" class="mt-48rpx rounded-24rpx bg-white p-48rpx text-center">
      <view class="center">
        <canvas
          :id="canvasId"
          :canvas-id="canvasId"
          class="block"
          :style="qrCanvasStyle"
        />
      </view>
      <view class="flex-actions mt-40rpx">
        <wd-button
          variant="plain" round block
          :loading="saving"
          custom-class="flex-1"
          @click="saveToAlbum"
        >
          保存到相册
        </wd-button>
        <wd-button
          round block
          type="primary"
          custom-class="flex-1"
          @click="handleShare"
        >
          分享
        </wd-button>
      </view>
    </view>
  </view>
</template>
