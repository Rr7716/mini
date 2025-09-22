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
    selectedCourse: {},
    footerActive: true,
    selectedWeekday: {
      sumPrice: 0,
      sumHours: 0,
    },
    show: false,
    showStudentCheckbox: false,
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
          course.studentNames = course.students.map(item => item.cn_name).join(" ");
          course.totalCost = course.students.length * course.price
          course.timeRange = courseTable[course.course_time_id][0]
          course.hours = utils.TimeStrToHour(course.timeRange)
          // 在字典里通过时间段id找到对应的课程数组, 再通过星期几找到对应的课程对象
          courseTable[course.course_time_id][course.weekday] = course
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
    let arr = this.data.courseTable.map(row => row[col]).filter(value => value && typeof value === 'object'); // 只保留对象
    console.log(arr[0])
    const sumPrice = arr.reduce((acc, cur) => acc + cur.totalCost, 0);
    const sumHours = arr.reduce((acc, cur) => acc + cur.hours, 0);
    this.setData({
      selected: { row, col },
      footerActive: !this.fatherActive,
      selectedCourse: this.data.courseTable[row][col],
      selectedWeekday: {
        sumPrice,
        sumHours,
      }
    })
    this.setData({
      show: true,
    })
  },

  onClick(e) {
    this.setData({
      show: true,
    })
  },
  onClose(e) {
    this.setData({
      show: false,
    })
  },

  onClickCheckBox(e) {
    this.setData({
      showStudentCheckbox: true,
    })
  },
  onCloseCheckbox(e) {
    this.setData({
      showStudentCheckbox: false,
    })
  },
  onChangeCheckbox(e) {
    this.setData({
      checked: e.detail,
    });
  },
})
