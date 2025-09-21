const utils = require("../../public/settings.js")

Page({
  data: {
    headers: ['  ', '周一', '周二', '周三', '周四', '周五', '周六', '周日',],
    courseTable: [
      // ['07:00-08:00', '', '', '', '', '', '', '']
    ],
    courseTimeDic: {}, // key
  },

  onLoad(options) {
    wx.showLoading({
      title: '加载中...',
      mask: true // 不能再点击请求按钮, 防止请求多次
    })
    let courseTale = {} // key为coure_time_id, value为['07:00-08:00', '', '', '', '', '', '', '']
    // 请求课程时间
    wx.request({
      url: `${utils.baseUrl}/course_time/`,
      method: 'GET',
      data: {},
      header: {},
      success: (res) => {
        console.log(res.data)
        for (let one of res.data) {
          courseTale[one.id] = [`${one.start_time}-${one.end_time}`, '', '', '', '', '', '', '']
        }
        console.log(courseTale)
      },
      fail: (error) => {},
      complete: (res) => {
      }
    })
    // 请求课程内容
    wx.request({
      url: `${utils.baseUrl}/course/`,
      method: 'GET',
      data: {},
      header: {},
      success: (res) => {
        console.log(res.data)
        for (let course of res.data) {
          courseTale[course.course_time_id][course.weekday] = course.content
        }
        this.setData({
          courseTimeDic: courseTale
        })
        courseTale = Object.values(courseTale) // 字典转数组, 不要key的id了
        console.log(utils.sortTimeRanges(courseTale)) // 按照时间段排序
        this.setData({
          courseTable
        })
        // 3. 拼接学生名字
        // for (let one_row of res.data) {
        //   one_row.students = one_row.students.map(item => item.cn_name).join(" ");
        // }
        // this.setData({
        //   courses: res.data
        // })
        // console.log(res.data)
      },
      fail: (error) => {

      },
      complete: (res) => {
        wx.hideLoading()
      }
    })
  }
})
