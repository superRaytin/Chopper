/**
 * 配置文件
 * User: chihuohuo
 * Date: 13-3-27
 */
 exports.config = {
     name: '扯吧',
     description: ' ',
     version: 'Beta',
     domain: 'localhost',
     db: 'mongodb://127.0.0.1/chopper',
     port: 5000,
     uploadDir: './public/upload/', // 图片上传目录
     uploadTempDir: './tmp', // 临时文件存放目录
     nopic: '/img/nopic.jpg', // 用户无头像图片
     limit: 15, // 每页数量
     pageRange: 2, // 分页范围(指当前页码两边个数)
     key: 'r9g4w3a2', // 密钥
     cookieSecret: 'chopper',
     sessionSecret: 'chopper'
 };