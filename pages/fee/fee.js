Page({
  data: {
    show: false
  },
  showPopup() {
    this.setData({ show: true })
  },
  hidePopup() {
    this.setData({ show: false })
  }
})
