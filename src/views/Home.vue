<template>
  <div class="app-wrapper">
    <div class="sidebar-container">
      <file-search
        v-model.trim="searchTitle"
        @clear="getFileList"
        @search="handleSearch"
        @keyup.enter.native="handleSearch"
        @input="handleChange"
        @create="fileCreate"
        clearable
      />
      <file-list :fileList="fileList" :active.sync="activeIndex" :selectedFile.sync="selectedFile">
        <template v-slot:menu>
          <li @click="handleFileTop">{{ selectedFile.isTop ? '取消置顶' : '置顶' }}</li>
          <li @click="fileDelete">删除</li>
        </template>
      </file-list>
    </div>
    <div class="main-container">
      <div class="placeholder" v-if="fileList.length === 0">暂无笔记</div>
      <file-edit
        v-else
        v-model="fileItem.content"
        :title.sync="fileItem.title"
        :boxShadow="false"
        :subfield="false"
        :shortCut="false"
        :autofocus="false"
        @change="updateContent"
        @titleBlur="updateTitle"
      />
    </div>
  </div>
</template>

<script>
// @ is an alias to /src
import FileSearch from '@/components/FileSearch'
import FileList from '@/components/FileList'
import FileEdit from '@/components/FileEdit'
import dayjs from 'dayjs'

export default {
  name: 'Home',
  components: { FileSearch, FileList, FileEdit },
  data() {
    return {
      selectedFile: null,
      timer: null,
      activeIndex: 0,
      searchTitle: '',
      fileList: [],
      fileItem: {
        _id: '',
        title: '',
        content: ''
      }
    }
  },
  watch: {
    activeIndex(newValue) {
      this.fileItem = this.fileList[newValue]
    }
  },
  mounted() {
    this.init()
  },
  methods: {
    async init(query = {}) {
      const list = await this.$db.markdown.find(query).sort({ isTop: -1, updatedAt: -1 })
      for (const item of list) {
        item.createdAt = dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss')
        item.updatedAt = dayjs(item.updatedAt).format('YYYY-MM-DD HH:mm:ss')
      }
      this.fileList = list
      // 如果没有数据，不重新赋值
      if (list.length === 0) return
      const [firstFileItem] = this.fileList
      this.fileItem = firstFileItem
    },
    // 获取笔记列表
    async getFileList() {
      const list = await this.$db.markdown.find({}).sort({ isTop: -1, updatedAt: -1 })
      for (const item of list) {
        item.createdAt = dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss')
        item.updatedAt = dayjs(item.updatedAt).format('YYYY-MM-DD HH:mm:ss')
      }
      this.fileList = list
    },
    // 置顶 取消置顶
    handleFileTop() {
      const { _id, isTop } = this.selectedFile
      this.$db.markdown.update({ _id }, { $set: { isTop: !isTop } }).then(async () => {
        await this.refreshList()
      })
    },
    // 删除笔记
    fileDelete() {
      if (!this.selectedFile) return
      this.$confirm('此操作将永久删除该笔记, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          const { _id } = this.selectedFile
          this.$db.markdown
            .remove({ _id })
            .then(async num => {
              this.$message.success(`删除了${num}个项目`)
              await this.refreshList()
            })
            .catch(() => {
              this.$message.error('删除失败')
            })
        })
        .catch(() => {})
    },
    // 更新标题
    updateTitle(title) {
      const { _id } = this.fileItem
      this.$db.markdown.update({ _id, title: { $ne: title } }, { $set: { title } }).then(async () => {
        await this.getFileList()
      })
    },
    // 新建笔记
    fileCreate() {
      const fileNew = { title: '无标题笔记', content: '', isTop: false }
      this.$db.markdown.insert(fileNew).then(async () => {
        await this.init()
        const [firstFileItem] = this.fileList
        this.fileItem = firstFileItem
        this.activeIndex = 0
      })
    },
    // 清空搜索内容时，重新获取笔记列表
    handleChange(value) {
      if (!value) {
        this.init()
      }
    },
    // 搜索笔记
    handleSearch() {
      if (!this.searchTitle) return
      // 构建正则表达式，忽略大小写
      const reg = new RegExp(`${this.searchTitle}`, 'i')
      this.init({ title: reg })
    },
    // 更新笔记内容
    updateContent(content) {
      const { _id } = this.fileItem
      if (this.timer) clearTimeout(this.timer)
      this.timer = setTimeout(() => {
        this.$db.markdown.update({ _id, content: { $ne: content } }, { $set: { content } }).then(async () => {
          this.getFileList()
        })
      }, 1000)
    },
    // 刷新笔记列表并高亮第一个笔记
    async refreshList() {
      await this.init()
      const [firstFileItem] = this.fileList
      this.fileItem = firstFileItem
      this.activeIndex = 0
    }
  }
}
</script>
<style lang="less" scoped>
.app-wrapper {
  display: flex;
  .sidebar-container {
    width: 300px;
    height: 100vh;
    border-right: 1px solid #eaeefb;
  }
  .main-container {
    flex: 1;
    overflow: hidden;

    .placeholder {
      color: #909399;
      text-align: center;
      line-height: 300px;
    }
  }
}
</style>
