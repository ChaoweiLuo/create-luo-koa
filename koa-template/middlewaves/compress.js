const compress = require('koa-compress');

//compress
let compressConfig = {
  filter: function(content_type) {
      return /text/i.test(content_type) || content_type == 'application/javascript';
  },
  threshold: 2048,
  flush: require('zlib').Z_SYNC_FLUSH
};

module.exports = app => {
  app.use(compress(compressConfig));
}