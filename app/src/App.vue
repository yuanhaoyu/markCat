<template>
 <div class="container">
   <van-sticky>
    <van-nav-bar
      title="MarkCat"
      right-text="快速添加当前地址"
      left-text="自定义添加当前地址"
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
          :title="item.title"
          :label="item.url">
            <div>
              <van-button size="mini" type="primary" @click.stop="handleUpdate(item)">更新</van-button>
              <van-button size="mini" type="danger" @click.stop="handleDel(item)">删除</van-button>
            </div>
        </van-cell>
      </van-list>
      <p class="clear" @click="clearAllStorage">clear</p>
    </div>
   </div>
 </div>
</template>

<script>
const APPKEY = 'MARK__CAT'
export default {
  name: 'App',
  data() {
    return {
      activeKey: 0,
      searchValue: '',
      loading: false,
      finished: true,
      kind: 'common',
      lists: [],
    }
  },
  created() {
    this.getMarkLists()
  },
  computed: {
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
    handleSwitch() {
      // TODO: add
    },
    handleLink({url}) {
      window.chrome.tabs.getAllInWindow(null,(tabs) => {
        let index = 0
        tabs.some((tab, i) => {
          if (tab.active) {
            index = i
            return true
          }
        })
        window.chrome.tabs.create({
          windowId: null,
          index,
          url
        })
      })
    },
    async handleUpdate(item) {
      const { url } = item
      const info = await this.getCurrentPageInfo()
      this.lists = this.lists.map(d => {
        if (d.key === this.kind) {
          const notOnlyFlag = d.value.some(d => {
            if (d.url === info.url) {
              alert('更新失败！'+ d.title + '__已存在的收藏地址')
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
      DB[APPKEY] = JSON.parse(JSON.stringify(this.lists))
      await this.setStorage(DB)
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
      DB[APPKEY] = JSON.parse(JSON.stringify(this.lists))
      await this.setStorage(DB)
      this.getMarkLists()
    },
    async handleAdd() {
      const info = await this.getCurrentPageInfo()
      this.lists = this.lists.map(d => {
        if (d.key === this.kind) {
          if (!d.value) {
            d.value = []
          }
          const notOnlyFlag = d.value.some(d => {
            if (d.url === info.url) {
              alert('添加失败！'+ d.title + '__已存在的收藏地址')
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
      DB[APPKEY] = JSON.parse(JSON.stringify(this.lists))
      await this.setStorage(DB)
      this.getMarkLists()
    },
    async getCurrentPageInfo() {
      return new Promise(resolve => {
        window.chrome.tabs.getSelected(null, async (tab) => {
          resolve({
            url: tab.url,
            title: tab.title,
          })
        })
      })
    },
    async getMarkLists() {
      try {
        const DB = await this.getStorage(APPKEY)
        if(DB.length) {
          this.lists = DB
        } else {
          this.lists = [
            {
              key: 'common',
              label: '通用',
              value: [],
            }
          ]
        }
      } catch (error) {
        console.error(error)
      }
    },
    setStorage(obj) {
      return new Promise(resolve => {
        window.chrome.storage.sync.set(obj, async (d) => {
          resolve(d)
        })
      })
    },
    getStorage(key) {
      return new Promise(resolve => {
        window.chrome.storage.sync.get(key, (result) => {
          resolve(result[key] || [])
        })
      })
    },
    removeStorage(key) {
      return new Promise(resolve => {
        window.chrome.storage.sync.remove(key, (d) => {
          this.getMarkLists()
          resolve(d)
        })
      })
    },
    clearAllStorage() {
      return new Promise(resolve => {
        window.chrome.storage.sync.clear(async (d) => {
          this.getMarkLists()
          resolve(d)
        })
      })
    }
  },
}
</script>

<style lang="scss">

.container {
  width: 464px;
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
