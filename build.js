const helper = require('think-helper');
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const name = process.argv[2];
assert(helper.isString(name), 'use `node build.js [20160731]` to build');
const filepath = path.join(__dirname, `${name}/data.txt`);
if (!helper.isFile(filepath)) {
  throw new Error(`${filepath} not exist`);
}
const templatePath = path.join(__dirname, 'template/');
const files = helper.getdirFiles(templatePath);
const templates = [];
files.forEach(item => {
  const content = fs.readFileSync(path.join(templatePath, item), 'utf8');
  templates.push({extname: path.extname(item), content});
});
const content = fs.readFileSync(filepath, 'utf8');
const data = [];
let province = {};
let city = {};
let tmp = '';
content.split('\n').forEach(item => {
  item = item.trim();
  if (!item) return;
  item = item.split(/\s+/);
  if (item.length === 1) {
    if (!tmp) {
      tmp = item[0];
      return;
    }
    item[1] = item[0];
    item[0] = tmp;
    tmp = '';
  }
  // 省
  if (/^\d{2}0{4}$/.test(item[0])) {
    if (!helper.isEmpty(city)) {
      province.children.push(city);
      city = {};
    }
    if (!helper.isEmpty(province)) {
      data.push(province);
      province = {};
    }
    province.name = item[1];
    province.code = item[0];
    province.children = [];
    return;
  }
  // 市
  if (/^\d{4}0{2}$/.test(item[0])) {
    if (!helper.isEmpty(city)) {
      province.children.push(city);
      city = {};
    }
    city.name = item[1];
    city.code = item[0];
    city.children = [];
    return;
  }
  city.children.push({
    name: item[1],
    code: item[0]
  });
});
if (!helper.isEmpty(province)) {
  data.push(province);
  province = {};
}
// 数组格式的数据
const jsonFile = path.join(__dirname, `${name}/data_array.json`);
fs.writeFileSync(jsonFile, JSON.stringify(data, undefined, 2));

templates.forEach(item => {
  const content = item.content.replace('DATA_STRING', JSON.stringify(data));
  const filepath = path.join(__dirname, `${name}/data_array${item.extname}`);
  fs.writeFileSync(filepath, content);
});

// 对象格式的数据
const dataObj = {};
data.forEach(item => {
  dataObj[item.name] = {};
  item.children.forEach(citem => {
    dataObj[item.name][citem.name] = {};
    citem.children.forEach(ccitem => {
      dataObj[item.name][citem.name][ccitem.name] = ccitem.code;
    });
  });
});

const jsonObjFile = path.join(path.join(__dirname, `${name}/data_object.json`));
fs.writeFileSync(jsonObjFile, JSON.stringify(dataObj, undefined, 2));
templates.forEach(item => {
  const content = item.content.replace('DATA_STRING', JSON.stringify(data));
  const filepath = path.join(__dirname, `${name}/data_object${item.extname}`);
  fs.writeFileSync(filepath, content);
});
