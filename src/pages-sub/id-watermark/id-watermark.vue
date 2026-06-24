<script lang="ts" setup>
import type { ComponentPublicInstance } from 'vue'
import { getCurrentInstance, nextTick, ref, watch } from 'vue'

defineOptions({ name: 'IdWatermark' })

/** 小程序端 canvas API 需传入页面/组件实例 */
const canvasHost = getCurrentInstance()?.proxy as ComponentPublicInstance | undefined

definePage({
  style: {
    navigationBarTitleText: '证件照片加水印',
  },
})

const canvasId = 'idWatermarkCanvas'

const imagePath = ref('')
const imgW = ref(0)
const imgH = ref(0)

const watermarkText = ref('仅用于办理 XXX 使用')

type WatermarkColor = '#ffffff' | '#000000' | '#E53935'
const color = ref<WatermarkColor>('#000000')
const colors: { value: WatermarkColor, label: string }[] = [
  { value: '#ffffff', label: '白' },
  { value: '#000000', label: '黑' },
  { value: '#E53935', label: '红' },
]

/** 逆时针角度（与常见斜向水印一致） */
const anglePresets = [
  { deg: -30, title: '较缓' },
  { deg: -45, title: '常用' },
  { deg: -60, title: '较陡' },
] as const
const angleDeg = ref<-30 | -45 | -60>(-45)

const opacity = ref(20)
const spacing = ref(59)
const fontSize = ref(20)

const canvasStyle = ref<{ width: string, height: string }>({ width: '100%', height: '200px' })
const canvasW = ref(300)
const canvasH = ref(300)

const saving = ref(false)

let drawTimer: ReturnType<typeof setTimeout> | null = null

function scheduleDraw() {
  if (!imagePath.value)
    return
  if (drawTimer)
    clearTimeout(drawTimer)
  drawTimer = setTimeout(() => {
    drawTimer = null
    drawCanvas()
  }, 48)
}

watch(
  [watermarkText, color, opacity, spacing, fontSize, angleDeg],
  () => scheduleDraw(),
)

function pickColor(value: WatermarkColor) {
  color.value = value
}

function pickAngle(deg: -30 | -45 | -60) {
  angleDeg.value = deg
}

function choosePhoto() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const path = res.tempFilePaths[0]
      if (!path)
        return
      uni.getImageInfo({
        src: path,
        success: (info) => {
          imagePath.value = path
          imgW.value = info.width
          imgH.value = info.height
          nextTick(() => measureAndDraw())
        },
        fail: () => {
          uni.showToast({ title: '无法读取图片', icon: 'none' })
        },
      })
    },
  })
}

function measureAndDraw() {
  if (!imagePath.value || !imgW.value || !imgH.value)
    return
  const query = uni.createSelectorQuery()
  query
    .select('.preview-canvas-wrap')
    .boundingClientRect((rect) => {
      if (!rect || !('width' in rect) || rect.width <= 0)
        return
      const maxW = rect.width
      const ratio = imgH.value / imgW.value
      const w = maxW
      const h = maxW * ratio
      canvasW.value = w
      canvasH.value = h
      canvasStyle.value = { width: `${w}px`, height: `${h}px` }
      nextTick(() => drawCanvas())
    })
    .exec()
}

function drawCanvas() {
  if (!imagePath.value || !imgW.value || !imgH.value)
    return

  const ctx = uni.createCanvasContext(canvasId, canvasHost)
  const cw = canvasW.value
  const ch = canvasH.value
  const iw = imgW.value
  const ih = imgH.value

  const scale = Math.min(cw / iw, ch / ih)
  const dw = iw * scale
  const dh = ih * scale
  const ox = (cw - dw) / 2
  const oy = (ch - dh) / 2

  ctx.clearRect(0, 0, cw, ch)
  ctx.drawImage(imagePath.value, ox, oy, dw, dh)

  const text = (watermarkText.value || ' ').trim() || ' '
  const fs = Math.max(8, fontSize.value)
  const space = Math.max(4, spacing.value)

  ctx.save()
  ctx.setGlobalAlpha(Math.min(1, Math.max(0.05, opacity.value / 100)))
  ctx.setFillStyle(color.value)
  ctx.setFontSize(fs)

  const deg = angleDeg.value
  const rad = (deg * Math.PI) / 180
  ctx.translate(cw / 2, ch / 2)
  ctx.rotate(rad)

  let tw = fs * text.length * 0.65
  try {
    const m = ctx.measureText?.(text)
    if (m && typeof m.width === 'number' && m.width > 0)
      tw = m.width + space
  }
  catch {
    tw = fs * text.length * 0.65 + space
  }
  const th = fs + space * 0.45

  const R = Math.sqrt(cw * cw + ch * ch)
  for (let x = -R; x < R; x += tw) {
    for (let y = -R; y < R; y += th)
      ctx.fillText(text, x, y)
  }

  ctx.restore()
  ctx.draw()
}

function saveWatermarked() {
  if (!imagePath.value) {
    uni.showToast({ title: '请先选择照片', icon: 'none' })
    return
  }
  if (saving.value)
    return

  saving.value = true

  nextTick(() => {
    uni.canvasToTempFilePath(
      {
        canvasId,
        width: canvasW.value,
        height: canvasH.value,
        destWidth: canvasW.value,
        destHeight: canvasH.value,
        fileType: 'png',
        quality: 1,
        success: (res) => {
          const tempPath = res.tempFilePath
          uni.saveImageToPhotosAlbum({
            filePath: tempPath,
            success: () => {
              uni.showToast({ title: '已保存到相册' })
            },
            fail: (err) => {
              const msg = String(err.errMsg ?? '')
              if (msg.includes('auth deny') || msg.includes('authorize')) {
                uni.showModal({
                  title: '需要相册权限',
                  content: '请在设置中允许保存到相册后重试',
                  confirmText: '去设置',
                  success: (m) => {
                    if (m.confirm)
                      uni.openSetting()
                  },
                })
              }
              else {
                uni.showToast({ title: '保存失败', icon: 'none' })
              }
            },
            complete: () => {
              saving.value = false
            },
          })
        },
        fail: () => {
          uni.showToast({ title: '导出失败', icon: 'none' })
          saving.value = false
        },
      },
      canvasHost,
    )
  })
}
</script>

<template>
  <view class="page pb-safe">
    <wd-notice-bar
      text="小程序不会存储您的原始照片及加了水印后的照片，请放心使用！"
      prefix="notification"
      type="warning"
    />

    <view class="preview-outer">
      <view class="preview-canvas-wrap checkerboard">
        <canvas
          :id="canvasId"
          :canvas-id="canvasId"
          class="preview-canvas"
          :style="canvasStyle"
        />
        <view v-if="!imagePath" class="empty-wrap">
          <wd-empty tip="请先选择证件照片" />
        </view>
      </view>
    </view>

    <wd-cell-group border custom-class="panel-group">
      <wd-cell title="文字" :title-width="52" center>
        <wd-input
          v-model="watermarkText"
          align-right
          placeholder="输入水印内容"
          custom-class="panel-input"
        />
      </wd-cell>

      <wd-cell title="颜色" :title-width="52" center custom-class="tag-cell">
        <view class="tag-row">
          <wd-tag
            v-for="c in colors"
            :key="c.value"
            :type="color === c.value ? 'primary' : 'default'"
            variant="plain"
            round
            @click="pickColor(c.value)"
          >
            {{ c.label }}
          </wd-tag>
        </view>
      </wd-cell>

      <wd-cell title="透明度" :title-width="52">
        <wd-slider
          v-model="opacity"
          :min="8"
          :max="100"
          :step="1"
          active-color="#007aff"
        />
      </wd-cell>

      <wd-cell title="角度" :title-width="52" center custom-class="tag-cell">
        <view class="tag-row">
          <wd-tag
            v-for="a in anglePresets"
            :key="a.deg"
            :type="angleDeg === a.deg ? 'primary' : 'default'"
            variant="plain"
            round
            @click="pickAngle(a.deg)"
          >
            {{ a.title }}
          </wd-tag>
        </view>
      </wd-cell>

      <wd-cell title="间距" :title-width="52">
        <wd-slider
          v-model="spacing"
          :min="24"
          :max="120"
          :step="1"
          active-color="#007aff"
        />
      </wd-cell>

      <wd-cell title="字体大小" :title-width="64">
        <wd-slider
          v-model="fontSize"
          :min="12"
          :max="56"
          :step="1"
          active-color="#007aff"
        />
      </wd-cell>
    </wd-cell-group>

    <view class="actions">
      <wd-button plain round block custom-class="action-btn" @click="choosePhoto">
        选择照片
      </wd-button>
      <wd-button

        round block
        type="primary"
        :loading="saving"
        custom-class="action-btn"
        @click="saveWatermarked"
      >
        保存水印照片
      </wd-button>
    </view>
  </view>
</template>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #f5f7fa;
}

.preview-outer {
  padding: 12px 16px 0;
}

.preview-canvas-wrap {
  position: relative;
  width: 100%;
  min-height: 180px;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkerboard {
  background-color: #e8e8e8;
  background-image:
    linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
  background-size: 16px 16px;
  background-position:
    0 0,
    0 8px,
    8px -8px,
    -8px 0;
}

.preview-canvas {
  display: block;
  max-width: 100%;
}

.empty-wrap {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

:deep(.panel-group) {
  margin: 16px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.tag-row {
  display: inline-flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  width: 100%;
}

.actions {
  display: flex;
  gap: 12px;
  padding: 8px 16px 0;
}

:deep(.action-btn) {
  flex: 1;
}
</style>
