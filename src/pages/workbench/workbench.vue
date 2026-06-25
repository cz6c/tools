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
  <view class="page-shell">
    <view class="workbench-header bg-primary pt-safe">
      <view class="pb-64rpx text-center text-white">
        <view class="text-34rpx font-500 leading-88rpx">
          工具工作台
        </view>
        <view class="-mt-8rpx text-26rpx opacity-85">
          更多实用工具入口
        </view>
      </view>
    </view>

    <view class="px-24rpx pb-24rpx -mt-24rpx">
      <wd-cell-group center border custom-class="card-rounded" :title-width="100">
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
