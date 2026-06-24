<script lang="ts" setup>
defineOptions({ name: 'Workbench' })

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '工具工作台',
    'mp-alipay': {
      defaultTitle: ' ',
      transparentTitle: 'always',
      titlePenetrate: 'YES',
    },
  },
})

interface ToolEntry {
  title: string
  desc: string
  icon: string
  url: string
}

const tools: ToolEntry[] = [
  {
    title: '税后工资计算',
    desc: '薪资测算、明细与历史记录',
    icon: 'money-circle',
    url: '/pages-sub/salary/calc',
  },
  {
    title: '证件照片加水印',
    desc: '为证件照添加防盗用水印',
    icon: 'picture',
    url: '/pages-sub/id-watermark/id-watermark',
  },
]

function openTool(url: string) {
  uni.navigateTo({ url })
}
</script>

<template>
  <view class="page">
    <view class="header header--gradient pt-safe">
      <view class="header-bar">
        <view class="header-bar__title">
          工具工作台
        </view>
        <view class="header-bar__desc">
          更多实用工具入口
        </view>
      </view>
    </view>

    <view class="content px-12px pb-12px -mt-12px">
      <wd-cell-group border custom-class="tool-group">
        <wd-cell
          v-for="item in tools"
          :key="item.url"
          :title="item.title"
          :label="item.desc"
          :prefix-icon="item.icon"
          is-link
          @click="openTool(item.url)"
        />
      </wd-cell-group>
    </view>
  </view>
</template>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #f5f7fa;
}

.header--gradient {
  background-image: linear-gradient(#007aff 10%, #007aff 100%);

  .header-bar {
    padding-bottom: 32px;
    text-align: center;
    color: #fff;
  }
}

.header-bar__title {
  font-size: 17px;
  font-weight: 500;
  line-height: 44px;
}

.header-bar__desc {
  margin-top: -4px;
  font-size: 13px;
  opacity: 0.85;
}

:deep(.tool-group) {
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}
</style>
