/**
 * 配置文件
 * User: chihuohuo
 * Date: 13-3-27
 * Time: 上午10:34
 */
 exports.config = {
     name: '小微吐槽',
     description: '这里没有节操可言',
     version: '0.0.1',
     db: 'mongodb://127.0.0.1/chihuohuo',
     port: 3000,
     uploadDir: './public/upload/', // 图片上传目录
     limit: 10, // 每页数量
     cookieSecret: 'chihuohuo',
     sessionSecret: 'chihuohuo'
 };