<template>
 <div class="container">
   <van-sticky>
    <van-nav-bar
      title="MarkCat"
      right-text="快速收藏"
      left-text="自定义收藏"
      @click-right="handleAdd"
      @click-left="()=>{alert('暂未开放')}"
    />
   </van-sticky>
   <div class="content--container">
    <van-sticky offset-top="48">
    <div class="content--sidebar">
      <van-sidebar>
        <van-sidebar-item v-for="(list, index) in lists" :title="list.label" :key="index" @click="handleSwitch(list)" />
      </van-sidebar>
    </div>
    </van-sticky>
    <div class="content">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
      >
        <van-cell
          v-for="(item, index) in currentLists"
          :key="index"
          @click="handleLink(item)"
          :icon="item.favIconUrl"
          :title="item.title"
          :label="item.url">
            <div>
              <van-button size="mini" plain type="primary" @click.stop="handleUpdate(item)">更新</van-button>
              <van-button size="mini" plain type="success" @click.stop="handleEdit(item)">编辑</van-button>
              <van-button size="mini" plain type="danger" @click.stop="handleDel(item)">删除</van-button>
            </div>
        </van-cell>
      </van-list>
      <p class="clear" @click="handleClear">clear</p>
    </div>
   </div>
   <van-popup v-model:show="popupShow">
      <van-form @submit="onSubmit">
        <van-field
          v-model="password"
          type="password"
          name="密码"
          label="密码"
          placeholder="密码"
          :rules="[{ required: true, message: '请填写密码' }]"
        />
        <div style="margin: 16px;">
          <van-button  size="mini"  type="primary" native-type="submit">
            提交
          </van-button>
          <van-button  size="mini"  native-type="submit" @click="popupFlag = false">
            关闭
          </van-button>
        </div>
      </van-form>
   </van-popup>
 </div>
</template>

<script>
import { linkNewTab, getCurrentPageInfo, setStorage, getStorage, clearAllStorage, localMd5, encryptedMsg, decryptedMsg } from './util'
const APPKEY = 'MARK__CAT'
export default {
  name: 'App',
  data() {
    return {
      password: '',
      activeKey: 0,
      searchValue: '',
      loading: false,
      finished: true,
      kind: 'common',
      lists: [],
      popupFlag: false
    }
  },
  created() {
    this.getMarkLists()
  },
  computed: {
    popupShow() {
      return this.popupFlag && !this.currentKind.decrypted
    },
    currentKind() {
      let result = []
      this.lists.some(d => {
        if (d.key === this.kind) {
          result = d
          return true
        }
      })
      return result
    },
    currentLists() {
      let result = []
      this.lists.some(d => {
        if (d.key === this.kind) {
          result = d.value
          return true
        }
      })
      return result
    },
  },
  methods: {
    onSubmit() {
      // TODO:
      alert(localMd5(this.password))
      const pwd = localMd5(123123)
      console.log(pwd)
      const db = encryptedMsg(JSON.stringify({a:1}), pwd)
      const info = decryptedMsg(db, pwd)
      console.log(info)
    },
    handleSwitch(list) {
      this.kind = list.kind
      if (list.type === 'ee') {
        this.popupFlag = true
      }
    },
    async handleClear() {
      await clearAllStorage()
      this.getMarkLists()
    },
    handleEdit() {
      alert('EDIT')
    },
    handleLink({url}) {
      linkNewTab(url)
    },
    async handleUpdate(item) {
      const { url } = item
      const info = await getCurrentPageInfo()
      this.lists = this.lists.map(d => {
        if (d.key === this.kind) {
          const notOnlyFlag = d.value.some(d => {
            if (d.url === info.url) {
              this.$toast.fail('更新失败！'+ d.title + '__已存在的收藏地址')
              return true
            }
          })
          if (!notOnlyFlag) {
            d.value = d.value.map(v => {
              if (v.url === url && url !== info.url) {
                v = info
              }
              return v
            })
          }
        }
        return d
      })
      const DB = {}
      DB[APPKEY] = this.lists
      await setStorage(DB)
      this.getMarkLists()
    },
    async handleDel({ url }) {
      this.lists = this.lists.map(d => {
        if (d.key === this.kind) {
          d.value = d.value.map(v => {
            if (v.url === url) {
              return null
            }
            return v
          }).filter(Boolean)
        }
        return d
      })
      const DB = {}
      DB[APPKEY] = this.lists
      await setStorage(DB)
      this.getMarkLists()
    },
    async handleAdd() {
      const info = await getCurrentPageInfo()
      this.lists = this.lists.map(d => {
        if (d.key === this.kind) {
          if (!d.value) {
            d.value = []
          }
          const notOnlyFlag = d.value.some(d => {
            if (d.url === info.url) {
              this.$toast.fail('添加失败！'+ d.title + '__已存在的收藏地址')
              return true
            }
          })
          if (!notOnlyFlag) {
            d.value.push(info)
          }
        }
        return d
      })
      const DB = {}
      DB[APPKEY] = this.lists
      await setStorage(DB)
      this.getMarkLists()
    },
    async getMarkLists() {
      try {
        const DB = await getStorage(APPKEY)
        if(DB.length) {
          this.lists = DB
        } else {
          this.lists = [
            {
              key: 'common',
              label: '常用收藏',
              type: 'text',
              value: [],
            },
            {
              key: 'pwd',
              type: 'ee',
              label: '加密收藏',
              decrypted: false,
              value: [],
            }
          ]
        }
      } catch (error) {
        console.error(error)
      }
    },
  },
}
</script>

<style lang="scss">
html {
  overflow-y: scroll;
  -webkit-overflow-scrolling: touch;
  ::-webkit-scrollbar {
    display: none;
  }
}
.container {
  width: 666px;
  margin: 0 auto;
}
.content--sidebar {
  position: relative;
  z-index: 99;
}
.content--container {
  position: relative;
}
.van-cell__value {
  flex-shrink: 0;
}
.van-cell__title {
  flex-basis: 52%;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  & > span {
    width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  & > div {
    width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
.content {
  width: 100%;
  box-sizing: border-box;
  position: absolute;
  z-index: 100;
  top: 0;
  left: 0;
  padding: 10px;
  padding-top: 4px;
  padding-left: 72px;
}
.clear {
  font-weight: 500;
  padding: 2px;
  cursor: pointer;
  position: relative;
  z-index: 99;
}
</style>
