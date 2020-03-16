const commander = require('commander');
const chalk = require('chalk');
const pckJson = require('./package.json');
const prompts = require('prompts');
const spawn = require('cross-spawn');
const fs = require('fs');
const path = require('path');

let project_name;
let mids = [],
  nonemid = false;

let program = new commander.Command('create-luo-koa')
  .version(pckJson.version)
  .arguments('<project-directory>')
  .usage(`${chalk.green('<project-directory>')} [options]`)
  .option('-s, --session', '启用Session')
  .option('-c, --compress', '启用压缩')
  .option('-b, --bodyparse', '启用报文解析')
  .option('-r, --router', '启用路由')
  .option('-S, --static', '启用静态资源')
  .option('-n, --nonemid', '不启用任何中间件')
  .action(name => {
    project_name = name;
  })
  .allowUnknownOption()
  .parse(process.argv);

if(!(nonemid = program.nonemid)) {
  if(program.session) mids.push('session');
  if(program.compress) mids.push('compress');
  if(program.bodyparse) mids.push('body');
  if(program.router) mids.push('router');
  if(program.static) mids.push('static');
}

create();

async function create() {
  let toPath = path.join(process.cwd(), project_name); //项目生成的新目录
  let srcPath = path.join(__dirname,'koa-template'); //源文件存放目录
  await checkAndCreateRoot(toPath);

  await promptsMiddlewave();
  // 拷贝文件
  if(mids.length) { // 如果有中间件，就先把中间件存的目录创建好
    let midFromDirPath = path.join(__dirname,'koa-template', 'middlewaves'),
      midToDirPath = path.join(toPath, 'middlewaves');
    if(!fs.existsSync(midToDirPath)){
      fs.mkdirSync(midToDirPath);
    }
    for (let i = 0; i < mids.length; i++) {
      const m = mids[i]+'.js';
      let fileFromPath = path.join(midFromDirPath, m);
      let fileToPath = path.join(midToDirPath, m);
      generateFile(fileFromPath, fileToPath);
    }
  }
  // app.js
  generate_app_js(toPath, mids);

  // package.json
  generate_package_json(toPath, project_name, mids);
  //安装依赖
  install_dependences(toPath);
  // 打印提示信息
  console.log(chalk.green('项目生成完。'));
  console.log('你可以输入下面的命令运行：');
  console.log(`${chalk.green('cd demo')} && ${chalk.green('node app.js')}`);
}

// 检查目录是否存在，如果不存在就新建一个目录
async function checkAndCreateRoot(rootName) {
  // let rootName = path.join(process.cwd(), project_name);
  if(fs.existsSync(project_name)) {
    let res =await prompts({
      type: 'select',
      name: 'opt',
      message: `文件夹${project_name}已经存在，请选择以何种操作继续!`,
      choices: [
        { title: '重新输入目录名称', value: '1' },
        { title: '删除己有的文件夹及其文件，并继续。', value: '2' },
        { title: '覆盖当前文件夹', value: '3' }
      ]
    });
    switch(res.opt) {
      case '1':
        project_name = (await prompts({
          type: 'text',
          message: '请输入一个新的目录名称',
          name: 'project_name'
        })).project_name;
        return await create();
      case '2':
        fs.rmdirSync(rootName, {
          recursive: true
        });
        break;
      default: 
        break;
    }
  }
  // 在覆盖下可能文件夹已经存在，所以要加一个检查
  if(!fs.existsSync(rootName)) {
    fs.mkdirSync(rootName);
  }
}

function generateFile(from, to) {
  console.log('生成文件:', chalk.green(to));
  if(fs.existsSync(to)) {
    fs.unlinkSync(to);
  }
  fs.copyFileSync(from, to);
}

// 如果没有在option中指定中间件，就在此询问
async function promptsMiddlewave() {
  if(!nonemid && mids.length === 0) {
    let res = await prompts([
      {
        type: 'multiselect',
        message: '请选择您要使用的中间件',
        name: 'mids',
        choices: [
          { title: '启用Session', value: 'session' },
          { title: '启用压缩', value: 'compress' },
          { title: '启用报文解析', value: 'body' },
          { title: '启用路由', value: 'router' },
          { title: '启用静态资源', value: 'static' }
        ]
      }
    ]);
    mids = res.mids;
  }
}

// 生成app.js的代码
function generate_app_js(toPath, mids) {
  console.log('正在生成'+chalk.green('app.js'));
  let midDic = {
    session: `require('./middlewaves/session')(app)`,
    compress: `require('./middlewaves/compress')(app)`,
    body: `require('./middlewaves/body')(app)`,
    router: `require('./middlewaves/router')(app)`,
    static: `require('./middlewaves/static')(app)`
  };
  let midCode = mids.map(m => midDic[m]).join(';\r\n\t\t');
  let template = `
    const Koa = require('koa');
    let app = new Koa();
    
    ${midCode}
    
    app.use(async ctx => {
      ctx.body = 'Hello world';
    })
    
    let port = process.env.port || 3000;
    app.listen(port, function() {
      console.log('server listen on port:', port);
    })
  `;
  fs.writeFileSync(path.join(toPath, 'app.js'), template, { encoding: 'utf-8' });
}
// 生成package.json
function generate_package_json(toPath, package_name, mids) {
  console.log('正在生成'+chalk.green('package.json'));
  let midDependences = {
    "koa-body": "^4.1.1",
    "koa-compress": "^3.0.0",
    "koa-router": "^8.0.8",
    "koa-session": "^5.13.1",
    "koa-static": "^5.0.0"
  };
  let deps = []; // 项目实际使用了的
  mids.map(m => {
    let depName = `koa-${m}`;
    deps.push(`"${depName}": "${midDependences[depName]}"`);
  });


  let template = `
    {
      "name": "${package_name}",
      "version": "1.0.0",
      "private": true,
      "license": "MIT",
      "dependencies": {
        "koa": "^2.11.0",
        ${deps.join(',\r\n')}
      }
    }
  `;
  let obj = JSON.parse(template);
  template = JSON.stringify(obj, null, 2);
  fs.writeFileSync(path.join(toPath, 'package.json'), template, { encoding: 'utf-8' });
}

function install_dependences(toPath) {
  console.log(chalk.green('正在安装依赖...'));
  spawn.sync('npm', ['install'], {
    cwd: toPath,
    stdio: 'inherit'
  });
}