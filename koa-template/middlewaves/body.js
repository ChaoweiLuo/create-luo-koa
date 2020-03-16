const Parse = require('koa-body');

let bodyParseConfig = {
  formidable: {
      uploadDir: '.'
  },
  multipart:true
};

let parse = Parse(bodyParseConfig);

module.exports = app => {
  app.use(parse);
}