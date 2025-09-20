Page({
  data: {
    newTask: "",   // 输入框里的内容
    tasks: []      // 任务列表
  },

  // 输入框监听
  onInputChange(e) {
    this.setData({
      newTask: e.detail.value
    });
  },

  // 添加任务
  addTask() {
    const { newTask, tasks } = this.data;
    if (!newTask.trim()) {
      wx.showToast({
        title: '请输入任务',
        icon: 'none'
      });
      return;
    }

    const newItem = {
      id: Date.now(), // 简单生成唯一ID
      text: newTask
    };

    this.setData({
      tasks: [...tasks, newItem],
      newTask: ""
    });
  },

  // 删除任务
  deleteTask(e) {
    const id = e.currentTarget.dataset.id;
    const { tasks } = this.data;
    this.setData({
      tasks: tasks.filter(item => item.id !== id)
    });
  },

  // 编辑任务
  editTask(e) {
    const id = e.currentTarget.dataset.id;
    const { tasks } = this.data;
    const task = tasks.find(item => item.id === id);

    wx.showModal({
      title: '编辑任务',
      editable: true,        // 小程序支持的可编辑输入框
      placeholderText: task.text,
      success: (res) => {
        if (res.confirm && res.content.trim()) {
          const updatedTasks = tasks.map(item => 
            item.id === id ? { ...item, text: res.content } : item
          );
          this.setData({ tasks: updatedTasks });
        }
      }
    });
  }
});
