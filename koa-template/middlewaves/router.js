const Router = require('koa-router');

let router = new Router();

router.get('/', async ctx => {
  ctx.body = 'Hello Router';
});

module.exports = (app) => {
  app
    .use(router.allowedMethods())
    .use(router.routes());
}