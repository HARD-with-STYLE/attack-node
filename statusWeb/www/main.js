// @ts-nocheck
function getData(cb) {
    fetch( "./api/status" ).then( function ( e ) {
        e.json().then(function (data) {
            cb(data);
        })
    } ).catch( function ( err ) {
        cb({
            total: NaN,
            success: NaN,
            fail: NaN,
            maxSuccess: NaN,
            process: NaN,
        });
    } )
}

charts = new Object();
line_data_total = new Array();
line_data_success = new Array();
line_data_fail = new Array();
line_data_time = new Array();

window.onload = function () {
    charts.gauge_1 = echarts.init( document.getElementById( "gauge-1" ) );
    charts.gauge_2 = echarts.init( document.getElementById( "gauge-2" ) );
    charts.gauge_3 = echarts.init( document.getElementById( "gauge-3" ) );
    charts.line = echarts.init( document.getElementById( "line" ) );
    draw();

    setInterval(() => {
        updata();
    }, 1000);
}

function now() {
    var t = new Date();
    return `${t.getHours()}:${t.getMinutes()}:${t.getSeconds()}`;
}

function draw() {
    // 仪表盘 存活进程数
    var option = {
        tooltip: {
            formatter: "{a} <br/>{b} : {c}/s"
        },
        series: [ {
            name: '业务指标',
            type: 'gauge',
            max: 100,
            detail: {
                formatter: '{value}'
            },
            data: [ {
                value: 0,
                name: '存活进程数'
            } ]
        } ]
    };
    charts.gauge_1.setOption( option, true );

    // 仪表盘 当前并发
    option = {
        tooltip: {
            formatter: "{a} <br/>{b} : {c}/s"
        },
        series: [ {
            name: '业务指标',
            type: 'gauge',
            max: 5000,
            detail: {
                formatter: '{value}/s'
            },
            data: [ {
                value: 0,
                name: '当前并发'
            } ]
        } ]
    };
    charts.gauge_2.setOption( option, true );

    // 仪表盘 成功请求数
    option = {
        tooltip: {
            formatter: "{a} <br/>{b} : {c}/s"
        },
        series: [ {
            name: '业务指标',
            type: 'gauge',
            max: 5000,
            detail: {
                formatter: '{value}/s'
            },
            data: [ {
                value: 0,
                name: '成功请求数'
            } ]
        } ]
    };
    charts.gauge_3.setOption( option, true );

    // 图表 请求数
    option = {
        title: {
            text: 'Status'
        },
        tooltip: {
            trigger: 'axis'
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        legend: {
            data: [ 'total', 'success', 'fail' ]
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: line_data_time
        },
        yAxis: {
            type: 'value'
        },
        series: [ {
            name: 'total',
            type: 'line',
            stack: '总量',
            smooth: true,
            data: line_data_total,
            areaStyle: {}
        }, {
            name: 'success',
            type: 'line',
            stack: '总量',
            smooth: true,
            data: line_data_success,
            areaStyle: {}
        }, {
            name: 'fail',
            type: 'line',
            stack: '总量',
            smooth: true,
            data: line_data_fail,
            areaStyle: {}
        } ]
    };

    charts.line.setOption( option, true );
}

function updata() {
    getData(function (data) {
        // 仪表盘 存活进程数
        var option = {
            series: [ {
                type: 'gauge',
                max: 100,
                detail: {
                    formatter: '{value}'
                },
                data: [ {
                    value: data.process,
                    name: '存活进程数'
                } ]
            } ]
        };
        charts.gauge_1.setOption( option, true );
        // 仪表盘 当前并发
        option = {
            series: [ {
                type: 'gauge',
                max: 5000,
                detail: {
                    formatter: '{value}/s'
                },
                data: [ {
                    value: data.total,
                    name: '当前并发'
                } ]
            } ]
        }

        charts.gauge_2.setOption( option, true );
        // 仪表盘 成功请求
        var option = {
            series: [ {
                type: 'gauge',
                max: 5000,
                detail: {
                    formatter: '{value}/s'
                },
                data: [ {
                    value: data.success,
                    name: '成功请求'
                } ]
            } ]
        }
        charts.gauge_3.setOption( option, true );

        line_data_total.push(data.total)
        line_data_success.push(data.success)
        line_data_fail.push(data.fail);
        line_data_time.push(now());

        if(line_data_time.length > 60){
            line_data_total.shift()
            line_data_success.shift()
            line_data_fail.shift()
            line_data_time.shift();
        }

        //console.log(line_data_fail);

        option = {
            title: {
                text: 'Status'
            },
            tooltip: {
                trigger: 'axis'
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            legend: {
                data: [ 'total', 'success', 'fail' ]
            },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: line_data_time
            },
            yAxis: {
                type: 'value'
            },
            series: [ {
                name: 'total',
                type: 'line',
                stack: '总量',
                smooth: true,
                data: line_data_total,
                areaStyle: {}
            }, {
                name: 'success',
                type: 'line',
                stack: '总量',
                smooth: true,
                data: line_data_success,
                areaStyle: {}
            }, {
                name: 'fail',
                type: 'line',
                stack: '总量',
                smooth: true,
                data: line_data_fail,
                areaStyle: {}
            } ]
        };

        console.log(option)

        charts.line.setOption( option, true );
    });
}