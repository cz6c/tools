/** WiFi 二维码加密类型（UI 展示用） */
export type WifiEncryption = 'WPA' | 'WPA2' | 'WPA3' | 'WEP' | 'nopass'

export const ENCRYPTION_OPTIONS: { label: string, value: WifiEncryption }[] = [
  { label: 'WPA', value: 'WPA' },
  { label: 'WPA2', value: 'WPA2' },
  { label: 'WPA3', value: 'WPA3' },
  { label: 'WEP', value: 'WEP' },
  { label: '无密码', value: 'nopass' },
]

export interface WifiInfo {
  ssid: string
  password: string
  encryption: WifiEncryption
}

function escapeWifiField(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/"/g, '\\"')
}

function unescapeWifiField(value: string): string {
  return value.replace(/\\([\\;,":])/g, '$1')
}

/** 将 UI 加密类型映射为标准 WiFi 二维码 T 字段 */
export function toQrEncryption(encryption: WifiEncryption): string {
  if (encryption === 'WEP')
    return 'WEP'
  if (encryption === 'nopass')
    return 'nopass'
  return 'WPA'
}

/** 将二维码 T 字段映射为 UI 展示类型 */
export function fromQrEncryption(t: string): WifiEncryption {
  const upper = t.toUpperCase()
  if (upper === 'WEP')
    return 'WEP'
  if (upper === 'NOPASS' || upper === 'NONE')
    return 'nopass'
  if (upper === 'WPA3')
    return 'WPA3'
  if (upper === 'WPA')
    return 'WPA'
  return 'WPA2'
}

/** 按标准格式生成 WiFi 二维码文本 */
export function buildWifiQr(info: WifiInfo): string {
  const t = toQrEncryption(info.encryption)
  let text = `WIFI:T:${t};S:${escapeWifiField(info.ssid)};`
  if (t !== 'nopass' && info.password)
    text += `P:${escapeWifiField(info.password)};`
  text += ';'
  return text
}

/** 解析 WiFi 二维码文本，失败返回 null */
export function parseWifiQr(raw: string): WifiInfo | null {
  const trimmed = raw.trim()
  if (!/^WIFI:/i.test(trimmed))
    return null

  const content = trimmed.slice(5)
  const fields: Record<string, string> = {}
  let i = 0

  while (i < content.length) {
    const key = content[i]
    if (content[i + 1] !== ':') {
      i++
      continue
    }
    i += 2
    let value = ''
    while (i < content.length) {
      if (content[i] === '\\' && i + 1 < content.length) {
        value += content[i + 1]
        i += 2
      }
      else if (content[i] === ';') {
        break
      }
      else {
        value += content[i]
        i++
      }
    }
    fields[key] = unescapeWifiField(value)
    if (content[i] === ';')
      i++
  }

  const ssid = fields.S
  if (!ssid)
    return null

  return {
    ssid,
    password: fields.P ?? '',
    encryption: fromQrEncryption(fields.T ?? 'WPA'),
  }
}

export function encryptionLabel(encryption: WifiEncryption): string {
  const found = ENCRYPTION_OPTIONS.find(o => o.value === encryption)
  return found?.label ?? encryption
}
