/**
 * 配置文件
 * User: chihuohuo
 * Date: 13-3-27
 */
 exports.config = {
     name: '小微吐槽',
     description: '这里没有节操可言',
     version: '0.0.1',
     domain: 'localhost',
     db: 'mongodb://127.0.0.1/chihuohuo',
     port: 3000,
     uploadDir: './public/upload/', // 图片上传目录
     uploadTempDir: './tmp', // 临时文件存放目录
     nopic: '/img/nopic.jpg', // 用户无头像图片
     limit: 15, // 每页数量
     pageRange: 2, // 分页范围(指当前页码两边个数)
     key: 'r9g4w3a2', // 密钥
     cookieSecret: 'chihuohuo',
     sessionSecret: 'chihuohuo'
 };