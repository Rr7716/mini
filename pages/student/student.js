import Toast from '@vant/weapp/toast/toast';
import Dialog from '@vant/weapp/dialog/dialog';
import Notify from '@vant/weapp/notify/notify';

const utils = require("../../public/settings.js")

const StudentConst = {
  'id': 0,
}

Page({
  data: {
    headers: ['序号', '英文名', '中文名', '性别', '年龄', '年级'],
    students: [],
    lastRowIndex: 0,
    lastColIndex: 5,
    selectedStudent: StudentConst,
    showStudentDetail: false,
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
          student.gender_cn = utils.GenderDic[student.gender]
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


  // 新增按钮
  onClickAddBtn(e) {
    this.setData({
      showStudentDetail: true,
      selectedStudent: StudentConst,
    })
    console.log(this.data.selectedStudent.id)
  },
  onCloseStudentDetail(e) {
    this.setData({
      showStudentDetail: false,
      selectedStudent: StudentConst,
    })
  },


  // 选中行
  selectCell(e) {
    const { index } = e.currentTarget.dataset
    let selectedStudent = this.data.students[index]
    selectedStudent.index = index
    
    this.setData({
      selectedStudent,
      showStudentDetail: true,
    })
  },


  // 保存按钮
  onClickSave(e) {
    const student = this.data.selectedStudent
    delete student.id;
    student.age = Number(student.age)
    student.gender_cn = utils.GenderDic[student.gender]
    console.log(student)
    wx.request({
      url: `${utils.baseUrl}/student/`,
      method: 'POST',
      data: student,
      header: {
        "Content-Type": "application/json" // 一般用 application/json
      },
      success: (res) => {
        console.log(res.data)
        // 新增后得到的id要更新一下
        student.id = res.data.id
        this.setData({
          students: [...this.data.students, student],
          showStudentDetail: false,
          selectedStudent: StudentConst,
          lastRowIndex: this.data.lastRowIndex+1,
        })
        console.log(this.data.students)
      },
      fail: (error) => {

      },
      complete: (res) => {
        Toast.success('添加成功');
      }
    })
  },
  onClickUpdate(e) {},
  onClickDelete(e) {},


  onChangeEnName(e) {
    this.setData({
      'selectedStudent.en_name': e.detail,
    })
  },
  onChangeCnName(e) {
    this.setData({
      'selectedStudent.cn_name': e.detail,
    })},
  onChangeGender(e) {
    this.setData({
      'selectedStudent.gender': e.detail,
    })},
  onChangeAge(e) {
    this.setData({
      'selectedStudent.age': e.detail,
    })},
  onChangeGrade(e) {
    this.setData({
      'selectedStudent.grade': e.detail,
    })},
})
