import Toast from '@vant/weapp/toast/toast';
import Dialog from '@vant/weapp/dialog/dialog';
import Notify from '@vant/weapp/notify/notify';

const utils = require("../../public/settings.js")

Page({
  data: {
    headers: ['序号', '英文名', '中文名', '性别', '年龄', '年级'],
    students: [],
    lastRowIndex: 0,
    lastColIndex: 5,
    selected: { row: -1, col: -1 }, // 选中的行号、列号
    selectedCourse: {},
    footerActive: true,
    selectedWeekday: {
      sumPrice: 0,
      sumHours: 0,
    },
    showCourseDetail: false,
    showStudentPicker: false,
    studentsOptions: [], // picker的源数据
    showCoursePicker: false,
    courseOptions: { // values为复制课程的下拉框源数据, src为字典, key为课程id, value为课程对象
      'values': [], // 课程名
      'nameDic': {}, // key为课程名, value为课程对象
    },
    socketOpen: false,
    messages: [],
  },

  onLoad(options) {
    wx.showLoading({
      title: '加载中...',
      mask: true // 不能再点击请求按钮, 防止请求多次
    })
    // 请求学生内容
    wx.request({
      url: `${utils.baseUrl}/student/`,
      method: 'GET',
      data: {},
      header: {},
      success: (res) => {
        console.log(res.data)
        console.log(res.data.length)
        let students = []
        const lastRowIndex = res.data.length-1
        res.data.forEach((student, _) => {
          students = [...students, student]
        })
        this.setData({
          students,
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
