//导入模块
let express = require('express');
let svgCaptcha = require('svg-captcha');
let path = require('path');
let session =  require('express-session');
// 导入body-parser 格式化表单的数据
let bodyParser = require('body-parser');
//导入mongodb
const MongoClient = require('mongodb').MongoClient;


// Connection URL
const url = 'mongodb://localhost:27017';
 
// Database Name
const dbName = 'userName';




// 创建APP
let app = express();
//设置托管静态资源
 app.use(express.static('static'));
 // 使用 session中间件
 app.use(session({
    secret: 'keyboard cat',
  }))
  // 使用 bodyParser 中间件
app.use(bodyParser.urlencoded({
    extended: false
}))
//路由1
//使用get的方法 访问登录页时 直接读取登录页 并返回
app.get('/login',(req,res)=>{
    res.sendFile(path.join(__dirname,'static/views/login.html'));
})
//路由2
//使用post 提交数据过来 验证用户登陆
app.post('/login',(req,res)=>{
    // console.log(req);
    let userName = req.body.userName;
    let userPass = req.body.userPass;
    let code = req.body.code;
    if(code==req.session.captcha){
        req.session.userInfo = {
            userName,
            userPass
        }
        res.redirect('/index');
    }else{
        // console.log('验证码错误');
        res.setHeader('content-type','text/html');
        res.send('<script>alert("验证码错误");window.location.href="/login"</script>')
    }
})
//路由3
//生成图片功能
//把这个地址设置给登录页的图片src属性
app.get('/login/svgCaptcha',(req,res)=>{
    var captcha = svgCaptcha.create();
    console.log(captcha.text);
    req.session.captcha = captcha.text.toLocaleLowerCase();
    res.type('svg');
    res.status(200).send(captcha.data);
})

//路由4去首页
app.get('/index',(req,res)=>{
    if(req.session.userInfo){
        res.sendFile(path.join(__dirname,'static/views/index.html'));
    }else{
        res.setHeader('content-type','text/html');
        res.send('<script>alert("请登录");window.location.href="/login"</script>');
    }
})

//路由5登出
app.get('/logout',(req,res)=>{
    //删除session
    delete req.session.userInfo;
    res.redirect('/login');
})

//路由6跳到注册页
app.get('/register',(req,res)=>{
    //直接读取并返回注册页
    res.sendfile(path.join(__dirname,'static/views/register.html'));
})

//路由7
app.post('/register',(req,res)=>{
    //获取用户数据
    let userName = req.body.userName;
    let userPass = req.body.userPass;
    console.log(userPass);


    MongoClient.connect(url, function(err, client) {
       
        const db = client.db(dbName);

        //选择使用集合
        let collection = db.collection('userList');
        
        //查询数据库
        collection.find({
            userName
        }).toArray((err,doc)=>{
            if(doc.length==0){
                collection.insertOne({
                    userName,
                    userPass
                },(err,result)=>{
                    res.setHeader('content-type','text/html');
                    res.send('<script>alert("欢迎入坑");window.location="/login"</script>');
                    //关闭数据库
                    client.close();
                })
            }else{
                res.setHeader('content-type','text/html');
                res.send('<script>alert("用户名已存在");window.location="/register"</script>');
            }
        })


        
      });




})


//开启监听
app.listen(80,'127.0.0.1',()=>{
    console.log('success');
    
})
