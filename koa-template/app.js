const Koa = require('koa');
let app = new Koa();

// mid code in here

app.use(async ctx => {
  ctx.body = 'Hello world';
})

let port = process.env.port || 3000;
app.listen(port, function() {
  console.log(`server listen on port ${port}`);
})