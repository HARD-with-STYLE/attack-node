# 配置文件

## global
- processNumber：进程数量，填写 -1 进程数量为 CPU核心数x4
- delay：每个请求的间隔时间（每个进程独立计算）
- thread：线程数，具体请参考 [多线程](#多线程)
- maxMemory：每个进程可以使用的最大内存，超过最大内存会自动重启，设置为 -1 将不会限制最大内存，单位MB
- time：时长，单位秒，到时间后会自动停止
- status：数据可视化，具体请参看 [数据可视化](#可视化)

## Stream
- url：请求的链接（可以使用随机函数）
- check：填写正则表达式，与body部分匹配，用于检测是否成功
- method：请求方式，填写POST或GET
- referer：对应Header中的referer
- data：POST提交的数据（可以使用随机函数）

## 随机函数
### 格式
- 全部修改为 ${random.xxx()} 
### 可用函数
- random.qq() 随机QQ号
- random.phone() 随机电话号码
- random.number(长度) 随机指定长度的数字
- random.string(长度) 随机指定长度的字符串
- random.custom(自定义字符 , 长度) 从自定义字符中随机指定长度的字符（自定义字符串部分需要引号，在配置文件中需要使用 \ 进行转义

### 添加自己的函数
直接修改 `random.js` 即可

# 其他

## 多线程
由于nodejs并没有原生支持多线程，所以这里的多线程是 伪·多线程，实际上还是只用了一个核心
### 实现方法
循环创建时钟，由于js异步的特性，不同的时钟不会互相干扰，可以做到与多线程类似的效果

## 数据可视化
此功能会在本地开一个Web服务器，端口为8123，直接在浏览器中打开 [http://localhost:8123/](#http://localhost:8123/) 就可以看到

# 返回值
- total: 每秒上报的请求数总和
- fail：失败请求数
- success：成功请求数
- max success：最大并发数（只统计成功）
- ~~unknow：状态未知的返回（error为null且statusCode也为null）~~

# 警告
## 进程数
由于node的限制，无法使用真正的多线程，只能使用多进程，所以请不要把进程数量开太大。否则可能会导致以下结果
1. 电脑死机，严重可能会导致硬件损坏
2. 全家一起断网并且你的运营商给你打电话