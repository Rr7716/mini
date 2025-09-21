const utils = require("../../public/settings.js")

Page({
  data: {
    headers: ['  ', '周一', '周二', '周三', '周四', '周五', '周六', '周日',],
    courseTable: [
      // ['07:00-08:00', '', '', '', '', '', '', '']
    ],
    lastRowIndex: 0,
    lastColIndex: 7,
    courseTimeDic: {}, // key
    selected: { row: -1, col: -1 }, // 选中的行号、列号
    footerActive: false,
  },

  onLoad(options) {
    wx.showLoading({
      title: '加载中...',
      mask: true // 不能再点击请求按钮, 防止请求多次
    })
    let courseTable = {} // key为coure_time_id, value为['07:00-08:00', '', '', '', '', '', '', '']
    // 请求课程时间
    wx.request({
      url: `${utils.baseUrl}/course_time/`,
      method: 'GET',
      data: {},
      header: {},
      success: (res) => {
        console.log(res.data)
        for (let one of res.data) {
          courseTable[one.id] = [`${one.start_time}-${one.end_time}`, '', '', '', '', '', '', '']
        }
        console.log(courseTable)
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
          courseTable[course.course_time_id][course.weekday] = course.content
        }
        this.setData({
          courseTimeDic: courseTable
        });
        courseTable = Object.values(courseTable) // 字典转数组, 不要key的id了
        console.log(utils.sortTimeRanges(courseTable)) // 按照时间段排序
        this.setData({
          courseTable,
          lastRowIndex: courseTable.length-1,
        })
        console.log(courseTable)
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
  },

  selectCell(e) {
    const { row, col } = e.currentTarget.dataset
    console.log(e.currentTarget.dataset)
    this.setData({
      selected: { row, col },
      footerActive: !this.fatherActive
    })
  },
})
