const child_process = require("child_process");
const fs = require("fs");
const os = require("os");
const config = JSON.parse(fs.readFileSync("./config.json").toString());
const log = Number(config.global.log.level);
let startTime = new Date().getTime();

if (config.global.time > 0) {
    setTimeout(() => {
        main_exit();
    }, config.global.time * 1000);
}

const logger = (type, title, msg) => {
    let time = new Date();
    if (type == "DEBUG" && log >= 4) {
        console.debug(
            `\x1b[47m\x1b[34m ${time} \x1b[46m\x1b[37m ${title} \x1b[47m\x1b[32m ${msg} \x1b[0m`,
        );
    }

    if (type == "INFO" && log >= 3) {
        console.log(
            `\x1b[47m\x1b[34m ${time} \x1b[46m\x1b[37m ${title} \x1b[47m\x1b[32m ${msg} \x1b[0m`,
        );
    }

    if (type == "WARN" && log >= 2) {
        console.warn(
            `\x1b[47m\x1b[34m ${time} \x1b[46m\x1b[33m ${title} \x1b[47m\x1b[32m ${msg} \x1b[0m`,
        );
    }

    if (type == "ERROR" && log >= 1) {
        console.error(
            `\x1b[47m\x1b[34m ${time} \x1b[46m\x1b[31m ${title} \x1b[47m\x1b[32m ${msg} \x1b[0m`,
        );
    }

    if (config.global.log.log) {
        try {
            fs.statSync("./log");
        } catch (error) {
            fs.mkdirSync("./log");
        }

        let t = new Date();
        let date = `${t.getFullYear()}-${t.getMonth()}-${t.getDay()}`;

        if (!fs.existsSync(`./log/log-${date}.log`)) {
            fs.writeFileSync(`./log/log-${date}.log`, ``);
        }
        let data = fs.readFileSync(`./log/log-${date}.log`);
        fs.writeFileSync(
            `./log/log-${date}.log`,
            `${data}\n[${time}][${title}] ${msg}`,
        );
    }
};

const _code = code => {
    if (!code) {
        return true;
    } else {
        let a = String(code).substr(0, 1);
        if (a == "2" || a == "3") {
            return true;
        } else {
            return false;
        }
    }
};

let processNumber = 0;
let processes = new Array();
let restart = true;
let n_fail = 0;
let n_success = 0;
let n_total = 0;
let max_success = 0;
let aliveProcess = 0;
let memory = new Array();
let memoryAll = 0;
let net = new Array();
let netAll = {
    in: 0,
    out: 0,
};
let total = {
    total: 0,
    success: 0,
    fail: 0,
};
let codeList = new Object();
let status;

if (config.global.processNumber == -1) {
    processNumber = os.cpus().length * 4;
} else {
    processNumber = config.global.processNumber;
}

logger("INFO", `[INFO][Process-Main]`, `Starting...`);
logger("INFO", `[INFO][Process-Main]`, `Process: ${processNumber}`);
logger(
    "INFO",
    `[INFO][Process-Main]`,
    `Maximum Concurrency: ${(1e3 / config.global.delay) *
        processNumber *
        config.stream.length *
        config.global.thread}`,
);

setInterval(() => {
    if (n_success > max_success) {
        max_success = n_success;
    }

    memoryAll = 0;
    memory.forEach(e => {
        memoryAll += e;
    });

    netAll = {
        in: 0,
        out: 0,
    };
    net.forEach(e => {
        netAll.in += e.in;
        netAll.out += e.out;
    });
    net = new Array();

    logger(
        "INFO",
        `[INFO][Process-Main]`,
        `total: ${n_total}, fail: ${n_fail}, success: ${n_success}, max success: ${max_success}, in: ${netAll.in.toFixed(
            2,
        )}, out: ${netAll.out.toFixed(2)}`,
    );

    if (config.global.status) {
        status.send({
            type: "data",
            data: {
                total: n_total,
                success: n_success,
                fail: n_fail,
                maxSuccess: max_success,
                process: aliveProcess,
                memory: memoryAll,
                net: netAll,
            },
        });
    }

    n_total = 0;
    n_fail = 0;
    n_success = 0;
}, 1e3);

if (config.global.status) {
    status = child_process.fork("./statusWeb/app.js");
}

for (let i = 0; i < processNumber; i++) {
    setTimeout(() => {
        processes[i] = child_process.fork("./start.js");
        aliveProcess++;
        processes[i].on("message", m => {
            processEvent.msg(i, m);
        });
        processes[i].on("close", code => {
            processEvent.exit(i, code);
        });
    }, i * 50);
}

logger("INFO", `[INFO][Process-Main]`, `Started!`);

var processEvent = {
    msg: (i, msg) => {
        let type = msg.type;

        if (type == "request") {
            let err = msg.data[0];
            let code = msg.data[1];
            let body = msg.data[2];
            let url = msg.data[3];
            total.total++;
            n_total++;
            if (isNaN(codeList[String(code)])) {
                codeList[String(code)] = 1;
            } else {
                codeList[String(code)]++;
            }
            if (_code(code) && !err) {
                logger(
                    "DEBUG",
                    `[INFO][Process-${i}]`,
                    `Code：${code} Success ${url} ${body}`,
                );
                n_success++;
                total.success++;
            } else if (code != null) {
                n_fail++;
                total.fail++;
                logger("DEBUG", `[WARN][Process-${i}]`, `Code: ${code}`);
            }
        } else if (type == "console") {
            logger("INFO", `[INFO][Process-${i}]`, msg.data);
        } else if (type == "memory") {
            memory[i] = msg.data;
        } else if (type == "net") {
            net.push({
                in: msg.data.in / 1e3,
                out: msg.data.out / 1e3,
            });
        } else if (type == "error") {
            logger(
                "ERROR",
                `[ERROR][Process-${i}]`,
                `errno: ${msg.data.errno}, code: ${msg.data.code}, syscall: ${msg.data.syscall}`,
            );
        }
    },
    exit: (i, code) => {
        aliveProcess--;
        if (code == 0) {
            logger("WARN", `[WARN][Process-${i}]`, `exit ${code}`);
        } else if (code == 233) {
            logger("DEBUG", `[ERROR][Process-${i}]`, `exit`);
        } else {
            logger("ERROR", `[ERROR][Process-${i}]`, `exit ${code}`);
        }
        if (restart) {
            processes[i] = child_process.fork("./start.js");
            aliveProcess++;
            processes[i].on("message", m => {
                processEvent.msg(i, m);
            });
            processes[i].on("close", code => {
                processEvent.exit(i, code);
            });
            if (code == 233) {
                logger("DEBUG", `[INFO][Process-${i}]`, "restart");
            } else {
                logger("INFO", `[INFO][Process-${i}]`, "restart");
            }
        }
    },
};

function main_exit() {
    let t = new Date().getTime() - startTime;
    logger("INFO", `[INFO][Process-Main]`, `${t / 1000 / 60} min`);
    process.exit(0);
}

process.on("SIGINT", function() {
    main_exit();
});
