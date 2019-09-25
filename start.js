const http = require("./http");
const random = require("./random");
const fs = require("fs");
const config = JSON.parse(fs.readFileSync("./config.json").toString());
const thread = Number(config.global.thread);
const maxMemory = Number(config.global.maxMemory);
const delay = Number(config.global.delay);
const proxy = config.global.proxy;
let net_in = 0;
let net_out = 0;
let proxyList = new Array();
let total_request = 0;

setInterval(() => {
    if (total_request > 500) {
        process.exit(233);
    }

    process.send({
        type: "memory",
        data: process.memoryUsage().heapUsed / 1048576,
    });
    process.send({
        type: "net",
        data: {
            in: net_in,
            out: net_out,
        },
    });

    net_in = 0;
    net_out = 0;
}, 100);

if (proxy.proxy) {
    if (proxy.type == 0) {
        let ip = fs.readFileSync(proxy.file).toString();
        ip.split("\n").forEach(e => {
            proxyList.push({
                ip: e.split(":")[0],
                port: e.split(":")[1],
            });
        });
    } else if (proxy.type == 1) {
        let ip = proxy.list;
        Object.keys(ip).forEach(e => {
            proxyList.push({
                ip: ip[e].split(":")[0],
                port: ip[e].split(":")[1],
            });
        });
    }
}

if (maxMemory > 0) {
    setInterval(() => {
        if (process.memoryUsage().heapUsed / 1048576 > maxMemory) {
            process.exit();
        }
    }, 100);
}

let timer = new Array();

const randonNum = (max, min) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
};

for (let i = 0; i < thread; i++) {
    timer[i] = setInterval(() => {
        config.stream.forEach(e => {
            let method = e.method;
            let url = e.url;
            let referer = e.referer;
            let data = e.data;
            let ip = null;
            if (e.ip) {
                ip = e.ip;
            }

            let dat = eval("`" + data + "`");
            let uri = eval("`" + url + "`");
            /*
            process.send( {
                type: "request",
                data: [ err, code, body, uri ]
            } );
            */

            if (proxy.proxy) {
                let n = randonNum(0, proxyList.length - 1);
                http.proxy(
                    {
                        url: uri,
                        method: method,
                        referer: referer,
                        proxy: {
                            ip: proxyList[n].ip,
                            port: proxyList[n].port,
                        },
                    },
                    (err, data) => {
                        total_request++;
                        if (err) {
                            process.send({
                                type: "request",
                                data: [err, null, null, uri],
                            });
                        } else {
                            let code = data[0];
                            let body = data[1];
                            process.send({
                                type: "request",
                                data: [err, code, body, uri],
                            });
                        }
                    },
                    socket => {
                        socket.on("error",(err) => {
                            process.send({
                                type: "error",
                                data: err,
                            });
                        })

                        let timer = setInterval(() => {
                            if (!socket.destroyed) {
                                net_in = socket.bytesRead - net_in;
                                net_out = socket.bytesWritten - net_out;
                            } else {
                                clearInterval(timer);
                            }
                        }, 1000);
                    },
                );
            } else {
                http(
                    {
                        ip: ip,
                        url: uri,
                        method: method,
                        data: dat,
                        referer: referer,
                    },
                    (err, data) => {
                        total_request++;
                        if (err) {
                            process.send({
                                type: "request",
                                data: [err, null, null, uri],
                            });
                        } else {
                            let code = data[0];
                            let body = data[1];
                            process.send({
                                type: "request",
                                data: [err, code, body, uri],
                            });
                        }
                    },
                    socket => {
                        socket.on("error",(err) => {
                            process.send({
                                type: "error",
                                data: err,
                            });
                        })

                        let timer = setInterval(() => {
                            if (!socket.destroyed) {
                                net_in = socket.bytesRead;
                                net_out = socket.bytesWritten;
                            } else {
                                clearInterval(timer);
                            }
                        }, 1000);
                    },
                );
            }
        });
    }, delay);
}