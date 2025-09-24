Component({
  data: {
    now: ''
  },
  lifetimes: {
    attached() {
      this.updateTime();
      this._timer = setInterval(() => {
        this.updateTime();
      }, 1000);
    },
    detached() {
      if (this._timer) clearInterval(this._timer);
    }
  },
  methods: {
    updateTime() {
      const d = new Date();
      const month = String(d.getMonth() + 1).padStart(2, '0'); // 月份 0-11
      const day = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      const ss = String(d.getSeconds()).padStart(2, '0');

      this.setData({
        now: `${month}-${day} ${hh}:${mm}:${ss}`
      });
    }
  }
});
