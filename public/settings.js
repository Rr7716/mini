const baseUrl = 'http://127.0.0.1:8000';

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
  // 例如 "08:00-09:00"
  const range = timeStr.split('-');
  const start = range[0];
  const hm = start.split(':');
  const h = parseInt(hm[0], 10);
  const m = parseInt(hm[1], 10);
  return h * 60 + m;
}

function timeSort2(data) {
  data.sort(function (a, b) {
    return parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time);
  });
  return data
}

module.exports = {
  baseUrl,
  weekday,
  timeSort,
  weekMap,
  timeSort2,
}