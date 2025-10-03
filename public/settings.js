const ip = '127.0.0.1'
const port = 8000
const baseUrl = `http://${ip}:${port}`;
const wssUrl = `ws://${ip}:${port}`;
const StudentMaxNumber = 4;
const GenderDic = {
  'boy': '男',
  'girl': '女',
}

const weekday = {
  '1': '星期一',
  '2': '星期二',
  '3': '星期三',
  '4': '星期四',
  '5': '星期五',
  '6': '星期六',
  '7': '星期日',
}

const weekMap = {
  '星期一': 1,
  '星期二': 2,
  '星期三': 3,
  '星期四': 4,
  '星期五': 5,
  '星期六': 6,
  '星期日': 7,
};

function parseTime(str) {
  // 例如 "星期一 08:00-09:00"
  const parts = str.split(' ');
  const weekStr = parts[0];
  const range = parts[1];

  const start = range.split('-')[0];
  const hm = start.split(':');
  const h = parseInt(hm[0], 10);
  const m = parseInt(hm[1], 10);

  return {
    week: weekMap[weekStr],
    minutes: h * 60 + m,
  };
}

function timeSort(data) {
  // 排序
  data.sort((a, b) => {
    const ta = parseTime(a.time);
    const tb = parseTime(b.time);
    if (ta.week !== tb.week) {
      return ta.week - tb.week;
    }
    return ta.minutes - tb.minutes;
  });
  return data
}

function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== "string") {
    return 0; // 没有 time 就返回 0，保证不报错
  }
  let start = timeStr.split('-')[0];  // 取开始时间 "08:00"
  let [hour, minute] = start.split(':').map(Number);
  return hour * 60 + minute;
}

function timeSort2(data) {
  data.sort(function (a, b) {
    return parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time);
  });
  return data
}

// 工具函数：把 "08:00" 转成分钟
function parseTimeToMinutes2(timeStr) {
  let [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

// 排序函数
function sortTimeRanges(arr) {
  return arr.sort((a, b) => {
    let [aStart, aEnd] = a[0].split("-");
    let [bStart, bEnd] = b[0].split("-");

    let aStartMin = parseTimeToMinutes2(aStart);
    let bStartMin = parseTimeToMinutes2(bStart);

    if (aStartMin !== bStartMin) {
      return aStartMin - bStartMin; // 先比较开始时间
    }

    // 如果开始时间相同，再比较结束时间
    let aEndMin = parseTimeToMinutes2(aEnd);
    let bEndMin = parseTimeToMinutes2(bEnd);
    return aEndMin - bEndMin;
  });
}

function TimeStrToHour(timeRange) {
  return (parseTimeToMinutes2(timeRange.split('-')[1]) - parseTimeToMinutes2(timeRange.split('-')[0]))/60
}

function getWeekRange(date = new Date()) {
  let current = new Date(date);
  let day = current.getDay();
  if (day === 0) day = 7;

  let monday = new Date(current);
  monday.setDate(current.getDate() - (day - 1));
  monday.setHours(0, 0, 0, 0);

  let sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { monday, sunday };
}

function getWeeksInYear(year = new Date().getFullYear()) {
  // 先找该年的最后一天
  let d = new Date(Date.UTC(year, 11, 31));

  // 往前找，直到找到星期四
  while (d.getUTCDay() !== 4) {
    d.setUTCDate(d.getUTCDate() - 1);
  }

  // 这一天所在的周就是该年的最后一周
  return getWeekNumber(d);
}

function getWeekNumber(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return weekNo;
}


module.exports = {
  StudentMaxNumber,
  baseUrl,
  weekday,
  timeSort,
  weekMap,
  timeSort2,
  sortTimeRanges,
  TimeStrToHour,
  wssUrl,
  getWeekRange,
  GenderDic,
  getWeekNumber,
  getWeeksInYear,
}