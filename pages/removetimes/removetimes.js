const utils = require("../../public/settings.js")

Page({
  data: {
    headers: ['序号', '课程名称', '时间', '学生', '剩余课时', '执行时间'],
    removetimesData: [],
    lastRowIndex: 0,
    lastColIndex: 5,
  },

  onLoad(options) {
    wx.showLoading({
      title: '加载中...',
      mask: true // 不能再点击请求按钮, 防止请求多次
    })
    // 请求
    wx.request({
      url: `${utils.baseUrl}/removetimes/`,
      method: 'GET',
      data: {},
      header: {},
      success: (res) => {
        console.log(res.data)
        let removetimesData = []
        const lastRowIndex = res.data.length-1
        res.data.forEach((one, index) => {
          one.index = index
          removetimesData = [...removetimesData, one]
        })
        this.setData({
          removetimesData,
          lastRowIndex,
        })
      },
      fail: (error) => {
      },
      complete: (res) => {
        wx.hideLoading() // 隐藏加载框
      }
    })
  },
})
