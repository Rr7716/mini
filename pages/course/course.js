const utils = require("../../public/settings.js")

Page({
  data: {
    courses: [],
    showPopup: true, // 弹窗
    name: '',
    price: '',
    weekdayList: Object.keys(utils.weekMap), // 星期下拉框选项
    selectedWeekday: 0,  // 星期下拉框索引
    timeRange: [], // 时间段下拉框选项
    selectedTimeRange: 0, // 时间段下拉框索引
    showDropdown: false, // 学生下拉多选框
    selectedText: '', // 学生下拉多选框选中的文本显示
    selectedStudentsId: [], // 学生下拉多选框选中的学生id
    students: [],
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
          timeRange: tmp
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
        let arr = []
        res.data.forEach((student, _) => {
          arr = [...arr, {
            'value': student.id,
            'label': student.cn_name,
            'checked': false
          }]
        })
        this.setData({
          students: arr
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
    console.log('提交信息:', this.data.name, this.data.phone);
    wx.showToast({
      title: '提交成功',
      icon: 'success'
    });
    this.closePopup();
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
    // 在这里students为更新前的值, 新的选中后, newOptions要去替换students
    const newOptions = this.data.students.map(item => ({
      ...item,
      checked: values.includes(item.value) // 在这里去修改checked的值
    }));
    const selectedText = newOptions
      .filter(item => item.checked)
      .map(item => item.label)
      .join(', ');
    // 选中的学生id数组
    const selectedStudentsId = newOptions
      .filter(item => item.checked)
      .map(item => item.value)

    this.setData({
      students: newOptions,
      selectedText,
      selectedStudentsId,
    });
  }
});
