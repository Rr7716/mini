const utils = require("../../public/settings.js")

Page({
  data: {
    courses: [],
    showPopup: true,
    name: '',
    price: '',
    weekdayList: Object.keys(utils.weekMap),
    selectedWeekday: 0,  // 星期下拉框索引
    timeRange: [],
    selectedTimeRange: 0, // 时间段下拉框索引
    showDropdown: false,
    selectedText: '',
    options: [
      { label: '选项1', value: '1', checked: false },
      { label: '选项2', value: '2', checked: false },
      { label: '选项3', value: '3', checked: false },
    ]
  },

  onLoad(options) {
    wx.showLoading({
      title: '加载中...',
      mask: true // 不能再点击请求按钮, 防止请求多次
    })
    wx.request({
      url: `${utils.baseUrl}/course/`,
      method: 'GET',
      data: {},
      header: {},
      success: (res)=> {
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
      fail: (error)=> {

      },
      complete: (res)=> {
      }
    })

    wx.request({
      url: `${utils.baseUrl}/course_time/`,
      method: 'GET',
      data: {},
      header: {},
      success: (res)=> {
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
      fail: (error)=> {

      },
      complete: (res)=> {
        wx.hideLoading() // 隐藏加载框
      }
    })
  },

  OnClickAdd(){
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
    const newOptions = this.data.options.map(item => ({
      ...item,
      checked: values.includes(item.value)
    }));
    const selectedText = newOptions
      .filter(item => item.checked)
      .map(item => item.label)
      .join(', ');

    this.setData({
      options: newOptions,
      selectedText
    });
  }
});
