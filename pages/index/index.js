import Toast from '@vant/weapp/toast/toast';
import Dialog from '@vant/weapp/dialog/dialog';
import Notify from '@vant/weapp/notify/notify';

const utils = require("../../public/settings.js")

Page({
  data: {
    headers: ['  ', '周一', '周二', '周三', '周四', '周五', '周六', '周日',],
    courseTable: [
      // ['07:00-08:00', '', '', '', '', '', '', '']
    ], // 展示课表的
    lastRowIndex: 0,
    lastColIndex: 7,
    selectedHeaderCol: -1, // 选中的表头列号
    selected: { row: -1, col: -1 }, // 选中的行号、列号
    selectedCourse: {},
    footerActive: true,
    selectedWeekday: {
      sumPrice: 0,
      sumHours: 0,
    },
    showCourseDetail: false,
    showStudentPicker: false,
    students: [], // 字典, key为学生id, value为学生对象
    /*
    [
      {
        'values': ['Tom', 'Jack'],
        'defaultIndex': 0,
      },
      {
        'values': ['Tom', 'Jack'],
        'defaultIndex': 0,
      },
    ]
    */
    studentsOptions: [], // picker的源数据
    showCoursePicker: false,
    courseOptions: [], // values为复制课程的下拉框源数据, src为字典, key为课程id, value为课程对象
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
          let timerange = `${one.start_time}-${one.end_time}`
          courseTable[timerange] = [timerange, '', '', '', '', '', '', '']
        }
        console.log(courseTable)
      },
      fail: (error) => { },
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
        let courseNamesArr = ['无']
        let courseDic = {}
        for (let course of res.data) {
          let timerange = `${course.course_time.start_time}-${course.course_time.end_time}`
          course.studentNames = course.students.map(item => item.en_name).join(" ");
          course.totalCost = course.students.length * course.price
          course.timeRange = courseTable[timerange][0]
          course.hours = utils.TimeStrToHour(course.timeRange)
          // 在字典里通过时间段找到对应的课程数组, 再通过星期几找到对应的课程对象
          courseTable[timerange][course.weekday] = course
          courseNamesArr = [...courseNamesArr, course.content]
          courseDic[course.content] = course
        }
        courseTable = Object.values(courseTable) // 字典转数组, 不要key的id了
        console.log(utils.sortTimeRanges(courseTable)) // 按照时间段排序
        this.setData({
          courseTable,
          lastRowIndex: courseTable.length - 1,
          courseOptions: {
            values: courseNamesArr,
            src: courseDic,
          }
        })
        console.log(courseTable)
      },
      fail: (error) => {
      },
      complete: (res) => {
      }
    })
    // 请求学生内容
    wx.request({
      url: `${utils.baseUrl}/student/`,
      method: 'GET',
      data: {},
      header: {},
      success: (res) => {
        console.log(res.data)
        let students = {}
        let enNames = []
        res.data.forEach((student, _) => {
          enNames = [...enNames, student.en_name]
          students[student.en_name] = student
        })
        let studentsOptions = []
        for (let i = 0; i < utils.StudentMaxNumber; i++) {
          studentsOptions = [...studentsOptions, {
            values: ['无', ...enNames]
          }]
        }
        this.setData({
          studentsOptions,
          students
        })
      },
      fail: (error) => {
      },
      complete: (res) => {
        wx.hideLoading() // 隐藏加载框
      }
    })
  },
  selectHeaderCol(e) {
    const selectedHeaderCol = e.currentTarget.dataset.col
    if (selectedHeaderCol === 0) return // 第一列为空, 不用管
    let arr = this.data.courseTable.map(row => row[selectedHeaderCol]).filter(value => value && typeof value === 'object'); // 只保留对象
    const sumPrice = arr.reduce((acc, cur) => acc + cur.totalCost, 0);
    const sumHours = arr.reduce((acc, cur) => acc + cur.hours, 0);
    this.setData({
      selected: { row: -1, col: -1 },
      selectedHeaderCol,
      selectedWeekday: {
        sumPrice,
        sumHours,
      }
    })
  },
  selectCell(e) {
    const { row, col } = e.currentTarget.dataset
    this.setData({
      selected: { row, col },
      footerActive: !this.fatherActive,
      selectedCourse: this.data.courseTable[row][col],
      selectedHeaderCol: -1,
      showCourseDetail: true,
    })
    // 空的课程
    if (typeof this.data.courseTable[row][col] !== 'object') {
      let timeRangeArr = this.data.courseTable[row][0].split('-')
      this.setData({
        'selectedCourse.course_time': {
          'start_time': timeRangeArr[0],
          'end_time': timeRangeArr[1],
        },
        'selectedCourse.weekday': col,
      })
    }
  },

  onCloseCourseDetail(e) {
    this.UnselectedAction()
  },
  onClickExistCourse(e) {
    this.setData({
      showCoursePicker: true,
    })
  },
  onCloseCoursePicker(e) {
    this.setData({
      showCoursePicker: false,
    })
  },
  onClickStudents(e) {
    this.setData({
      showStudentPicker: true,
    })
    // 选择空的课程会进入下面的if
    if (typeof this.data.selectedCourse.studentNames === 'undefined') {
      // 空课程每一列学生的选择都要改为默认值 -> '无'
      this.data.studentsOptions.forEach((_, index) => {
        this.setData({
          [`studentsOptions[${index}].defaultIndex`]: 0
        })
      })
      return
    }

    // 有内容的课程重新定位学生选中的index
    let arr = this.data.selectedCourse.studentNames.split(' ')
    arr.forEach((name, index) => {
      let i = this.data.studentsOptions[index].values.indexOf(name)
      this.setData({
        [`studentsOptions[${index}].defaultIndex`]: i
      })
    })
  },
  onCloseStudents(e) {
    this.setData({
      showStudentPicker: false,
    })
  },
  onStudentPickerChange(event) {
    // 去掉没选的列
    let studentsNameArr = event.detail.value.filter((v) => v !== '无')
    // 去重
    studentsNameArr = [...new Set(studentsNameArr)]
    let studentObjArr = []
    studentsNameArr.forEach((name) => {
      studentObjArr = [...studentObjArr, this.data.students[name]]
    })
    this.setData({
      'selectedCourse.studentNames': studentsNameArr.join(' '),
      'selectedCourse.students': studentObjArr,
    })
    console.log(studentObjArr)

    // 学生变了, 总价也得跟着变, 但这里可能还没有填单价
    let price = typeof this.data.selectedCourse.price !== "undefined" ? this.data.selectedCourse.price : 0
    this.setData({
      'selectedCourse.totalCost': price * studentsNameArr.length
    })
  },
  onCoursePickerChange(e) {
    const content = e.detail.value
    let selectedCourse = this.data.courseOptions.src[content]
    selectedCourse.course_time = this.data.selectedCourse.course_time
    selectedCourse.weekday = this.data.selectedCourse.weekday
    this.setData({
      selectedCourse
    })
  },
  onClickAdd(e) {
    let course = this.data.selectedCourse
    let { row, col } = this.data.selected
    console.log(course)
    if (!course.content) {
      Dialog.alert({
        message: '请输入课程名称',
      }).then(() => {
        // on close
      });
      return
    }
    if (this.IsCourseExist()) {
      Dialog.alert({
        message: '该时刻课程已存在, 不能新增, 只能修改',
      }).then(() => {
        // on close
      });
      return
    }
    wx.request({
      url: `${utils.baseUrl}/course/`,
      method: 'POST',
      data: course,
      header: {
        "Content-Type": "application/json" // 一般用 application/json
      },
      success: (res) => {
        this.setData({
          [`courseTable[${row}][${col}]`]: course,
        });
        this.UnselectedAction()
      },
      fail: (error) => {

      },
      complete: (res) => {
        Toast.success('添加成功');
      }
    })
  },
  onClickUpdate(e) {
    // 空的点更新按钮无效
    if (!this.IsCourseExist()) {
      Dialog.alert({
        message: '该时刻课程不存在, 请先添加',
      }).then(() => {
        // on close
      });
      return
    }
    let course = this.data.selectedCourse
    let { row, col } = this.data.selected
    console.log(course)

    wx.request({
      url: `${utils.baseUrl}/course/${course.id}`,
      method: 'PUT',
      data: course,
      header: {
        "Content-Type": "application/json" // 一般用 application/json
      },
      success: (res) => {
        this.setData({
          [`courseTable[${row}][${col}]`]: course,
        })
        this.UnselectedAction()
      },
      fail: (error) => {

      },
      complete: (res) => {
        // wx.hideLoading()
        Toast.success('删除成功');
      }
    })
  },
  onClickDelte(e) {
    // 空的点删除按钮无效
    if (!this.IsCourseExist()) {
      Dialog.alert({
        message: '该时刻课程不存在, 请先添加',
      }).then(() => {
        // on close
      });
      return
    }
    let course = this.data.selectedCourse
    let { row, col } = this.data.selected
    console.log(course)
    Dialog.confirm({
      title: '删除课程',
      message: `确认要删除「${utils.weekday[course.weekday]}${course.timeRange} ${course.content}」课程吗`,
    })
      .then(() => {
        // on confirm
        // wx.showLoading({
        //   title: '加载中...',
        //   mask: true // 不能再点击请求按钮, 防止请求多次
        // })
        wx.request({
          url: `${utils.baseUrl}/course/${course.id}`,
          method: 'DELETE',
          header: {
            "Content-Type": "application/json" // 一般用 application/json
          },
          success: (res) => {
            this.setData({
              [`courseTable[${row}][${col}]`]: '',
            })
            this.UnselectedAction()
          },
          fail: (error) => {

          },
          complete: (res) => {
            // wx.hideLoading()
            Toast.success('删除成功');
          }
        })
      })
      .catch(() => {
        // on cancel
      });
  },

  // 更新输入框value
  onChangePrice(e) {
    // 单价变了, 总价也得跟着变, 但这里可能还没有选学生
    let num = typeof this.data.selectedCourse.students !== "undefined" ? (this.data.selectedCourse.students.length ? this.data.selectedCourse.students.length : 0) : 0
    this.setData({
      'selectedCourse.totalCost': e.detail.value * num,
      'selectedCourse.price': e.detail.value,
    })
  },
  onChangePerHourCost(e) {
    this.setData({
      'selectedCourse.per_hour_cost': e.detail,
    })
  },
  onChangeCourseLeft(e) {
    this.setData({
      'selectedCourse.course_left': e.detail,
    })
  },
  onChangeContent(e) {
    this.setData({
      'selectedCourse.content': e.detail,
    })
  },

  UnselectedAction() {
    this.setData({
      selectedCourse: {},
      showCourseDetail: false,
      selected: { row: -1, col: -1 },
    })
  },
  IsCourseExist() {
    let { row, col } = this.data.selected
    return this.data.courseTable[row][col] !== ''
  }
})
