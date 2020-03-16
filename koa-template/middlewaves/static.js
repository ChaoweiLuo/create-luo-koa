const serve = require('koa-static');

// 静态文件存放目录
const staticFolder = '.';

module.exports = app => {
  app.use(serve(staticFolder));
};