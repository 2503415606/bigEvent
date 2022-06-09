// 文章的处理函数模块
const path = require('path')
const db = require('../db/index')

// 发布新文章的处理函数
exports.addArticle = (req, res) => {
    // 手动判断是否上传了文章封面
    if (!req.file || req.file.fieldname !== 'cover_img') return res.cc('文章封面是必选参数！')
    const articleInfo = {
        // 标题、内容、状态、所属的分类Id
        ...req.body,
        // 文章封面在服务器端的存放路径
        cover_img: path.join('/uploads', req.file.filename),
        // 文章发布时间
        pub_date: new Date(),
        // 文章作者的Id
        author_id: req.auth.id,
    }
    const sql = `insert into ev_articles set ?`
    // 执行 SQL 语句
    db.query(sql, articleInfo, (err, results) => {
        // 执行 SQL 语句失败
        if (err) return res.cc(err)
        // 执行 SQL 语句成功，但是影响行数不等于 1
        if (results.affectedRows !== 1) return res.cc('发布文章失败！')
        // 发布文章成功
        res.cc('发布文章成功', 0)
    })
}

exports.listArticle = (req, res) => {
    // 查询数据便的数据总数
    const sql = 'SELECT COUNT(id) FROM ev_articles WHERE is_delete = 0'
    db.query(sql, (err, result) => {
        if (err) return res.cc(err)
        // 成功后将数据总量挂载到res对象上
        res.ev_total = result[0]['COUNT(id)']
    })
    // 为页码和每页显示的数量设置默认值
    req.query.pagesize = req.query.pagesize ? Number(req.query.pagesize) : 5
    req.query.pagenum = req.query.pagenum ? req.query.pagenum : 1
    // 计算页码的索引
    req.query.pagenum = Number((req.query.pagenum - 1) * req.query.pagesize)
    // 数据库分页查询
    // console.log(req.query);
    //  const sqlStr = 'SELECT id,title,content,cover_img,pub_date,state,is_delete,cate_id,author_id FROM ev_articles WHERE is_delete = 0 ORDER BY id LIMIT ?,? ';
    const sqlStr = 'select a.id, a.title, a.pub_date, a.state, b.name as cate_name from ev_articles as a, ev_article_cate as b where a.cate_id = b.id and a.cate_id = ifnull( ? , a.cate_id) and a.state = ifnull( ? , a.state) and a.is_delete = 0 limit ? , ?'
    db.query(sqlStr, [req.query.cate_id || null, req.query.state || null, req.query.pagenum, req.query.pagesize], (err, result) => {
        if (err) return res.cc(err)

        if (result.length < 1) return res.cc('获取文章列表失败！！！')
        res.send({
            status: 0,
            message: '获取文章列表成功！！',
            data: result,
            total: res.ev_total
        });
    })
}

exports.delArticle = (req, res) => {
    const sql = 'update ev_articles set is_delete = 1 where Id = ?'
    db.query(sql, req.params.id, (err, results) => {
        if (err) return res.cc(err)
        if (results.affectedRows !== 1) return res.cc('删除文章失败! ')
        res.cc('删除文章成功', 0)
    })
}

exports.editArticle = (req, res) => {
    if (!req.file || req.file.fieldname !== 'cover_img') return res.cc('文章封面是必选参数！')
    const articleInfo = {
        // 标题、内容、状态、所属的分类Id
        ...req.body,
        // 文章封面在服务器端的存放路径
        cover_img: path.join('/uploads', req.file.filename),
        // 文章发布时间
        pub_date: new Date(),
        // 文章作者的Id
        author_id: req.auth.id,
    }
    const sql = 'update ev_articles set ? where Id = ?'
    db.query(sql, [articleInfo, req.body.id], (err, results) => {
        if (err) return res.cc(err)
        if (results.affectedRows !== 1) return res.cc('更新文章失败! ')
        res.cc('更新文章成功', 0)
    })
}

exports.queryArticleDetail = (req, res) => {
    const sql = 'select * from ev_articles where is_delete = 0 and Id = ?'
    db.query(sql, req.params.id, (err, results) => {
        if (err) return res.cc(err)
        if (results.length !== 1) return res.cc('查询文章详情失败! ')
        res.send({
            status: 0,
            message: '查询文章详情成功',
            data: results[0],
        })
    })
}