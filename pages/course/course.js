const utils = require("../../public/settings.js")

Page({
  data: {
    courses: [],
    students: {}, // key为学生id, value为学生对象
    showPopup: true, // 弹窗
    name: '',
    price: 100,

    weekdayOptions: Object.keys(utils.weekMap), // 星期下拉框选项
    selectedWeekday: 0,  // 星期下拉框索引

    timeRangeOptions: [], // 时间段下拉框选项
    selectedTimeRange: 0, // 时间段下拉框索引

    showDropdown: false, // 学生下拉多选框
    studentsOptions: [],
    selectedText: '', // 学生下拉多选框选中的文本显示
    selectedStudentsId: [], // 学生下拉多选框选中的学生id
  },

  onLoad(options) {
    wx.showLoading({
      title: '加载中...',
      mask: true // 不能再点击请求按钮, 防止请求多次
    })
    // 请求课程内容
    wx.request({
      url: `${utils.baseUrl}/course/`,
      method: 'GET',
      data: {},
      header: {},
      success: (res) => {
        console.log(res.data)
        // 1. int的weekday转化为星期几
        // 2. 拼接weekday、开始时间、结束时间
        for (let one_row of res.data) {
          one_row.time = `${utils.weekday[one_row.weekday]} ${one_row.course_time.start_time}-${one_row.course_time.end_time}`
        }
        // 3. 拼接学生名字
        for (let one_row of res.data) {
          one_row.students = one_row.students.map(item => item.cn_name).join(" ");
        }
        // 4. 按照时间排序
        res.data = utils.timeSort(res.data)
        this.setData({
          courses: res.data
        })
        console.log(res.data)
      },
      fail: (error) => {

      },
      complete: (res) => {
      }
    })
    // 请求时间段
    wx.request({
      url: `${utils.baseUrl}/course_time/`,
      method: 'GET',
      data: {},
      header: {},
      success: (res) => {
        console.log(res.data)
        let tmp = []
        // 1. 拼接开始时间、结束时间
        for (let one_row of res.data) {
          tmp = [...tmp, `${one_row.start_time}-${one_row.end_time}`]
        }
        tmp = utils.timeSort2(tmp)
        this.setData({
          timeRangeOptions: tmp
        })
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
        let studentsOptions = []
        res.data.forEach((student, _) => {
          studentsOptions = [...studentsOptions, {
            'value': student.id,
            'label': student.cn_name,
            'checked': false
          }]
          students[student.id] = student
        })
        console.log(students)
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

  OnClickAdd() {
    this.setData({ showPopup: !this.showPopup });
  },

  closePopup() {
    this.setData({ showPopup: false });
  },

  onInputName(e) {
    this.setData({ name: e.detail.value });
  },

  onInputPrice(e) {
    this.setData({ price: e.detail.value });
  },

  submitInfo() {
    // 通过id将字典转化数组
    let studentsArr = this.data.selectedStudentsId.map(id => this.data.students[id])
    // 删除掉id字段
    studentsArr = studentsArr.map(({ cn_name, en_name, age }) => ({ cn_name, en_name, age }));
    let req = {
      "students": studentsArr,
      "price": this.data.price,
      "weekday": +this.data.selectedWeekday + 1,
      "course_time": {
        "start_time": this.data.timeRangeOptions[this.data.selectedTimeRange].split('-')[0],
        "end_time": this.data.timeRangeOptions[this.data.selectedTimeRange].split('-')[1],
      },
      "Content": this.data.name,
    }
    console.log('提交信息:', req);
    wx.showLoading({
      title: '加载中...',
      mask: true // 不能再点击请求按钮, 防止请求多次
    })
    // 请求课程内容
    wx.request({
      url: `${utils.baseUrl}/course/`,
      method: 'POST',
      data: req,
      header: {
        "Content-Type": "application/json" // 一般用 application/json
      },
      success: (res) => {
        wx.showToast({
          title: '提交成功',
          icon: 'success'
        });
        this.closePopup();
      },
      fail: (error) => {

      },
      complete: (res) => {
        wx.hideLoading()
      }
    })
  },

  bindPickerChange(e) {
    console.log('picker选择改变，值为', e.detail.value)
    this.setData({
      selectedWeekday: e.detail.value
    })
  },
  bindPickerChange2(e) {
    console.log('picker2选择改变，值为', e.detail.value)
    this.setData({
      selectedTimeRange: e.detail.value
    })
  },

  toggleDropdown() {
    this.setData({ showDropdown: !this.data.showDropdown });
  },

  onCheckboxChange(e) {
    const values = e.detail.value; // 选中的值数组
    const studentsOptions = this.data.studentsOptions.map(item => ({
      ...item,
      checked: values.includes(item.value) // 在这里去修改checked的值
    }));
    const selectedText = studentsOptions
      .filter(item => item.checked)
      .map(item => item.label)
      .join(', ');
    // 选中的学生id数组
    const selectedStudentsId = studentsOptions
      .filter(item => item.checked)
      .map(item => item.value)

    this.setData({
      studentsOptions,
      selectedText,
      selectedStudentsId,
    });
  }
});
