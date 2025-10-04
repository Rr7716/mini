import Toast from '@vant/weapp/toast/toast';
import Dialog from '@vant/weapp/dialog/dialog';
import Notify from '@vant/weapp/notify/notify';

const utils = require("../../public/settings.js")

Page({
  data: {
    headers: ['  ', '周一', '周二', '周三', '周四', '周五', '周六', '周日',],
    // ['07:00-08:00', '', '', '', '', '', '', '']
    // 二维数组, 展示课表, 行号为course的weekday, 第一列都展示时间段
    courseTable: [],
    lastRowIndex: 0,
    lastColIndex: 7,
    selectedHeaderCol: -1, // 选中的表头列号
    selected: { row: -1, col: -1 }, // 选中的行号、列号
    selectedCourse: {},
    isCourseEmpty: true,
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
    courseOptions: { // values为复制课程的下拉框源数据, src为字典, key为课程id, value为课程对象
      'values': [], // 课程名
    },
    socketOpen: false,
    messages: [],
    weekOptions: [],
    selectedWeek: 0,
  },

  onLoad(options) {
    const { monday, sunday } = utils.getWeekRange(new Date());
    console.log(`${monday}    ${sunday}`)

    // 周
    const yearWeekNums = utils.getWeeksInYear()
    let weekOptions = Array.from({ length: yearWeekNums }, (_, i) => ({
      text: `第${i + 1}周`,
      value: i + 1,
    }));
    this.setData({
      selectedWeek: utils.getWeekNumber(),
      weekOptions,
    })

    let courseTable = {} // key为时间段, value为['07:00-08:00', '', '', '', '', '', '', '']
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
      url: `${utils.baseUrl}/course/${this.data.selectedWeek}`,
      method: 'GET',
      data: {},
      header: {},
      success: (res) => {
        console.log(res.data)
        for (let course of res.data) {
          // 检查消课情况
          let target = new Date(course.last_expire_time);
          course.has_expire = target >= monday && target <= sunday;
          let timerange = `${course.course_time.start_time}-${course.course_time.end_time}`
          course.studentNames = course.students.map(item => item.en_name).join(" ");
          course.totalCost = course.students.length * course.price
          course.timeRange = courseTable[timerange][0]
          course.hours = utils.TimeStrToHour(course.timeRange)
          // 在字典里通过时间段找到对应的课程数组, 再通过星期几找到对应的课程对象
          courseTable[timerange][course.weekday] = course
        }
        courseTable = Object.values(courseTable) // 字典转数组, 不要key了
        console.log(utils.sortTimeRanges(courseTable)) // 按照时间段排序
        // 给所有course对象加上row和col
        courseTable.forEach((rowArr, rowNum) => {
          rowArr.forEach((course, colNum) => {
            if (colNum !== 0 && this.IsCourseExist(course)) {
              course.row = rowNum
              course.col = colNum
            }
          })
        })
        this.setData({
          courseTable,
          lastRowIndex: courseTable.length - 1,
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
      }
    })
    // 请求这一周的请假信息
    wx.request({
      url: `${utils.baseUrl}/takeleave/range`,
      method: 'GET',
      data: {},
      header: {},
      success: (res) => {
        console.log(res.data)
        for (let one of res.data) {
          const targetCourse = this.data.courseTable.flat().find(course => course.id === one.course_id);
          this.setData({
            [`courseTable[${targetCourse.row}][${targetCourse.col}].takeleave`]: true,
          })
        }
      },
      fail: (error) => { },
      complete: (res) => {
      }
    })


    // 建立 WebSocket 连接
    wx.connectSocket({
      url: `${utils.wssUrl}/ws`,  // 你的 FastAPI WebSocket 地址
    });
    // 绑定事件
    wx.onSocketOpen(() => {
      console.log('✅ WebSocket 已连接');
    });
    wx.onSocketMessage((res) => {
      console.log('📩 收到消息:', res.data);

      const updatedCourse = JSON.parse(res.data)
      const targetCourse = this.data.courseTable.flat().find(course => course.id === updatedCourse.id);
      this.setData({
        [`courseTable[${targetCourse.row}][${targetCourse.col}].course_left`]: updatedCourse.course_left,
        [`courseTable[${targetCourse.row}][${targetCourse.col}].has_expire`]: true,
      })
    });
    wx.onSocketClose(() => {
      console.log('❌ WebSocket 已关闭');
    });
    wx.onSocketError((err) => {
      console.error('⚠️ WebSocket 出错:', err);
    });
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
    console.log(this.data.courseTable)
    this.setData({
      selected: { row, col },
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
        isCourseEmpty: true,
      })
    }
    else {
      this.setData({
        isCourseEmpty: false,
      })
    }
  },

  onCloseCourseDetail(e) {
    this.UnselectedAction()
  },
  onClickExistCourse(e) {
    let values = this.data.courseTable.flat().filter((one) => typeof one === 'object').map((course) => course.content);
    values = ['无', ...values]
    values = [...new Set(values)];
    console.log(values)
    this.setData({
      showCoursePicker: true,
      courseOptions: {
        values,
      }
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

    // 学生变了, 总价也得跟着变, 但这里可能还没有填单价
    let price = typeof this.data.selectedCourse.price !== "undefined" ? this.data.selectedCourse.price : 0
    this.setData({
      'selectedCourse.totalCost': price * studentsNameArr.length
    })
  },
  onCoursePickerChange(e) {
    // 因为这里是从nameDic里取的, 修改了对象的值, 但最后没有对nameDic进行setData, 所以直接复制并不会改变nameDic中的对象
    const content = e.detail.value
    let selectedCourse = this.data.courseTable.flat().find((one) => one.content == content)
    selectedCourse.course_time = this.data.selectedCourse.course_time
    selectedCourse.weekday = this.data.selectedCourse.weekday
    selectedCourse.has_expire = false
    selectedCourse.course_left = 0 // 需要重新输入剩余课时
    this.setData({
      selectedCourse,
    })
  },

  onClickAdd(e) {
    let course = this.data.selectedCourse
    let { row, col } = this.data.selected
    console.log(course)
    console.log(course.id)
    if (!course.content) {
      Dialog.alert({
        message: '请输入课程名称',
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
        console.log(res.data)
        // 新增后得到的id要更新一下
        course.id = res.data.id
        course.row = row
        course.col = col
        this.setData({
          [`courseTable[${row}][${col}]`]: course,
        });
        console.log(`new: ${this.data.courseTable}`)
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
    let { row, col } = this.data.selected
    let course = this.data.selectedCourse
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
        Toast.success('修改成功');
      }
    })
  },
  onClickDelte(e) {
    let { row, col } = this.data.selected
    let course = this.data.selectedCourse
    console.log(course)
    Dialog.confirm({
      title: '删除课程',
      message: `确认要删除「${utils.weekday[course.weekday]}${course.timeRange} ${course.content}」课程吗`,
    })
      .then(() => {
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
            Toast.success('删除成功');
          }
        })
      })
      .catch(() => {
        // on cancel
      });
  },
  onClickSick(e) {
    let { row, col } = this.data.selected
    let course = this.data.selectedCourse
    console.log(course)
    if (course.has_expire) {
      Dialog.confirm({
        title: '请假',
        message: `「${utils.weekday[course.weekday]}${course.timeRange} ${course.content}」该课程的课时已消, 若请假则会返还课时, 确定要这样操作吗`,
      })
      course.last_expire_time = course.expire_time // 改了后在下次OnLoad的时候has_expire就不会为true了
      course.has_expire = false // 取消绿√
      course.course_left += 1 // 返还课时
      wx.request({
        url: `${utils.baseUrl}/takeleave/`,
        method: 'POST',
        data: {
          course_id: course.id,
        },
        header: {
          "Content-Type": "application/json" // 一般用 application/json
        },
        success: (res) => { },
        fail: (error) => { },
        complete: (res) => {
        }
      })
      wx.request({
        url: `${utils.baseUrl}/course/${course.id}`,
        method: 'PUT',
        data: course,
        header: {
          "Content-Type": "application/json" // 一般用 application/json
        },
        success: (res) => {
          course.takeleave = true
          this.setData({
            [`courseTable[${row}][${col}]`]: course,
          })
          this.UnselectedAction()
        },
        fail: (error) => {

        },
        complete: (res) => {
          Toast.success('请假成功');
        }
      })
    }
  },
  onClickClear(e) {
    const week = this.data.selectedWeek
    // Dialog.confirm({
    //   show: true,
    //   title: `一键清除第${week}周课程`,
    //   message: `确认要一键清除第${week}周的所有课程吗`,
    // })
    //   .then(() => {
    //   })
    //   .catch(() => {
    //   });
    let courseTable = this.data.courseTable
    courseTable.forEach((one_row, row_num) => {
      one_row.forEach((one, col_num) => {
        if (col_num !== 0 && typeof one === 'object') {
          courseTable[row_num][col_num] = ''
        }
      })
    })
    this.setData({
      courseTable,
      courseOptions: [],
    })
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
  IsCourseExist(course) {
    return course !== ''
  },


  // 发送消息给 FastAPI
  sendMessage() {
    if (this.data.socketOpen) {
      this.socket.send({
        data: "Hello from MiniProgram"
      });
    } else {
      wx.showToast({ title: '未连接服务器', icon: 'error' });
    }
  },

  onUnload() {
    if (this.socket) {
      this.socket.close();
    }
  },
})
