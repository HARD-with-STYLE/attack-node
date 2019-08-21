# 配置文件

| Key | Value | Type | Required |
| --- | ----- | ---- | --- |
| global | 全局配置 | `Object` | `true` |
| - processNumber| 进程数|`Int`| `true` |
| - thread| 线程数|`Int`| `true` |
| - delay| 每个请求的间隔时间|`Int`| `true` |
| - maxMemory| 最大内存，单位MB|`Int`| `true` |
| - time| 持续时间，单位秒|`Int`| `true` |
| - status| 具体请查看 [数据可视化](#数据可视化)|`Boolen`| `true` |
| - log | 日志配置 | `Object` | `true` |
| - - log| 日志记录 | `Boolen` | `true` |
| - - level | 日志输出等级 | `Int` | `true` |
| - proxy| Proxy配置，具体查看 [Proxy](#Proxy) | `Object` | `true` |
| - - proxy | 开启proxy | `Boolen` | `true` |
| - - type | 类型， `0` 或 `1` | `Int` | `true` |
| - - file| 指定一个文件，从文件中读取IP列表，当`type`为`0`时生效 | `String` | `false` |
| - - list| Proxy列表，当`type`为`1`时生效 | `Array` | `false` |
| Stream | 压测链路 | `Array` | `true` |
| - ip | 指定IP | `String` | `false` |
| - url | 请求链接，可以使用 [随机函数](#随机函数) | `String` | `true` |
| - check | 与body部分匹配，用于检测是否成功 | `Regular`|  `true` |
| - method | 请求方式，`POST` 或 `GET` | `String` | `true` |
| - refere | 对应 `header` 中的 `refere` | `String` | `true` |
| - data | POST发送的数据，可以使用 [随机函数](#随机函数) | `String` | `false` |

## 随机函数
### 格式
- ${Function}
### 可用函数
| Function | Description |
| --- | ---|
| random.qq() | QQ |
| random.phone() | 电话号码 |
| random.number( `长度` ) | 指定长度的数字 |
| random.string( `长度` ) | 指定长度的字符串 |
| random.custom( `自定义字符` , `长度` ) | 从指定的字符中返回指定长度的字符串，自定义字符部分需要引号 |

### 添加自己的函数
直接修改 `random.js` 即可

# 使用方法
1. clone本项目
2. 修改 `config.json` ，具体请参考 [配置文件](#配置文件)
3. 控制台/终端 输入 `node app.js`

# 其他

## 多线程
由于nodejs并没有原生支持多线程，所以这里的多线程是 伪·多线程，实际上还是只用了一个核心
### 实现方法
循环创建时钟，由于js异步的特性，不同的时钟不会互相干扰，可以做到与多线程类似的效果

## 数据可视化
此功能会在本地开一个Web服务器，端口为8123，直接在浏览器中打开 [http://localhost:8123/](#http://localhost:8123/) 就可以看到

## Proxy
目前只支持http请求，https有一些bug，只会返回statusCode，并且一直都是200

# 返回值
- total: 每秒上报的请求数总和
- fail：失败请求数
- success：成功请求数
- max success：最大并发数（只统计成功）

# 警告
## 进程数
由于node的限制，无法使用真正的多线程，只能使用多进程，所以请不要把进程数量开太大。否则可能会导致以下结果
1. 电脑死机，严重可能会导致硬件损坏
2. 全家一起断网并且你的运营商给你打电话