import UQRCode from 'uqrcodejs'

/** 在 canvas 上绘制二维码 */
export function drawQrCode(canvasId: string, text: string, size = 240): Promise<void> {
  const qr = new UQRCode()
  qr.data = text
  qr.size = size
  qr.margin = 10
  qr.make()

  const ctx = uni.createCanvasContext(canvasId)
  qr.canvasContext = ctx
  return qr.drawCanvas()
}

/** 将 canvas 导出为临时图片路径 */
export function canvasToTempFile(canvasId: string, size = 240): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.canvasToTempFilePath({
      canvasId,
      width: size,
      height: size,
      destWidth: size * 2,
      destHeight: size * 2,
      success: res => resolve(res.tempFilePath),
      fail: (err) => {
        uni.showToast({ title: '生成图片失败，请重试', icon: 'none' })
        reject(err)
      },
    })
  })
}
