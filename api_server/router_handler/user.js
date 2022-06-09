/**
    在这里定义和用户相关的路由处理函数，供 /router/user.js 模块进行调用
**/

// 导入数据库操作模块
const db = require('../db/index')

// 导入加密模块
const bcrypt = require('bcryptjs')

// 导入生成token字符串的包
const jwt = require('jsonwebtoken')
// 导入加密和解密的密钥
// 导入配置文件
const config = require('../config')

// 注册用户的处理函数
exports.regUser = (req, res) => {
    // 获取客户端提交到服务器的用户信息
    const userinfo = req.body
    // 对表单中的数据进行合法性的校验
    // if (!userinfo.username || !userinfo.password) {
    //     // return res.send({
    //     //     status: 1,
    //     //     message: '用户名或密码为空'
    //     // })
    //     return res.cc('用户名或密码为空')
    // }
    const sql = 'select * from ev_users where username = ?'
    db.query(sql, [userinfo.username], (err, results) => {
        // sql语句执行失败
        if (err) {
            // return res.send({
            //     status: 1,
            //     message: err.message
            // })
            return res.cc(err)
        }
        // 用户名被占用
        if (results.length > 0) {
            // return res.send({
            //     status: 1,
            //     message: '用户名已存在'
            // })
            return res.cc('用户名已存在')
        }
        // 用户名可用,继续后续流程
        // 对密码进行加密
        userinfo.password = bcrypt.hashSync(userinfo.password, 10)

        // 插入新用户
        const sql = 'insert into ev_users set ?'
        db.query(sql, {
            username: userinfo.username,
            password: userinfo.password
        }, function (err, results) {
            // 执行 SQL 语句失败
            if (err) {
                // return res.send({
                //     status: 1,
                //     message: err.message
                // })
                return res.cc(err)
            }
            // SQL 语句执行成功，但影响行数不为 1
            if (results.affectedRows !== 1) {
                // return res.send({
                //     status: 1,
                //     message: '注册用户失败，请稍后再试！'
                // })
                return res.cc('注册用户失败，请稍后再试！')
            }
            // 注册成功
            // res.send({
            //     status: 0,
            //     message: '注册成功！'
            // })
            res.cc('注册成功！', 0)
        })
    })
}

// 登录的处理函数
exports.login = (req, res) => {
    const userinfo = req.body
    const sql = 'select * from ev_users where username=?'
    db.query(sql, userinfo.username, function (err, results) {
        // 执行 SQL 语句失败
        if (err) return res.cc(err)
        // 执行 SQL 语句成功，但是查询到数据条数不等于 1
        if (results.length !== 1) return res.cc('用户名不存在')
        // 判断用户输入的登录密码是否和数据库中的密码一致
        // 拿着用户输入的密码,和数据库中存储的密码进行对比
        const compareResult = bcrypt.compareSync(userinfo.password, results[0].password)
        // 如果对比的结果等于 false, 则证明用户输入的密码错误
        if (!compareResult) {
            return res.cc('登录失败！')
        }
        // 登录成功，生成 Token 字符串
        // 生成token字符串之前先把密码等重要信息给剔除
        // 剔除完毕之后，user 中只保留了用户的 id, username, nickname, email 这四个属性的值
        // 展开运算符展开数据,然后再赋空值实现剔除
        const user = {
            ...results[0],
            password: '',
            user_pic: ''
        }
        // 对用户信息进行加密,生成 Token 字符串
        const tokenStr = jwt.sign(user, config.jwtSecretKey, {
            expiresIn: config.expiresIn, // token 有效期为 10 个小时
        })
        // 将生产的token字符串响应给客户端
        res.send({
            status: 0,
            message: '登录成功！',
            // 为了方便客户端使用 Token，在服务器端直接拼接上 Bearer 的前缀
            token: 'Bearer ' + tokenStr,
        })
    })
}