// @ts-nocheck
const http = require( "http" );
const https = require( "https" );
const Agent = require( 'agentkeepalive' );

const httpsKeepaliveAgent = new Agent.HttpsAgent();
const keepaliveAgent = new Agent( {
    maxSockets: 100,
    maxFreeSockets: 10,
    timeout: 60000,
    freeSocketTimeout: 30000,
} );

const request = ( options, cb , s) => {
    let url = options.url;
    let method = options.method.toUpperCase();
    let protocol = url.split( "/" )[ 0 ];
    let hostname = url.split( "/" )[ 2 ];
    let port = url.split( "/" )[ 2 ].split( ":" )[ 1 ];
    let path = encodeURI( url.substr( protocol.length + hostname.length + 2 ) );
    let q = http;
    let host,keepalive;

    if(options.ip){
        host = options.ip;
    }else{
        host = hostname;
    }

    if ( host.indexOf( ":" ) != -1 ) {
        host = host.split( ":" )[ 0 ];
    } else {
        if ( protocol.indexOf( "https" ) != -1 ) {
            if(!port){
                port = 443;
            }
            q = https;
            keepalive = httpsKeepaliveAgent;
        } else {
            if(!port){
                port = 80;
            }
            q = http;
            keepalive = keepaliveAgent;
        }
    }

    let opti = {
        host: host,
        port: port,
        path: path,
        method: method,
        agent: keepalive,
        setHost: false,
        headers: {
            referer: options.referer,
            host: hostname,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36"
        }
    }

    let req = q.request( opti, res => {
        let data = "";
        res.on( "data", ( chunk ) => {
            data += chunk.toString();
        } );
        res.on( "error", ( err ) => {
            cb(err,null)
        } )
        res.on( "end", () => {
            cb(null,[res.statusCode,data]);
        } )
    } )

    req.on("socket",(socket) => {
        s(socket)
    })

    if(method == "POST"){
        req.write(String(opti.data),(err) => {
            if(err){
                cb(err,null)
            }
        })
    }
    
    req.end()
}

const request_proxy = ( options, cb ,s) => {
    let url = options.url;
    let method = options.method.toUpperCase();
    let hostname = url.split( "/" )[ 2 ];

    let proxy = options.proxy;

    let opti = {
        host: proxy.ip,
        port: proxy.port,
        path: url,
        method: method,
        agent: keepaliveAgent,
        setHost: false,
        headers: {
            referer: options.referer,
            host: hostname,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36"
        }
    }

    let req = http.request( opti, res => {
        let data = "";
        res.on( "data", ( chunk ) => {
            data += chunk.toString();
        } );
        res.on( "error", ( err ) => {
            cb(err,null)
        } )
        res.on( "end", () => {
            cb(null,[res.statusCode,data]);
        } )
    } )

    req.on("socket",(socket) => {
        s(socket)
    })

    if(method == "POST"){
        req.write(String(opti.data),(err) => {
            if(err){
                cb(err,null)
            }
        })
    }
    
    req.end()
}
module.exports = request;
module.exports.proxy = request_proxy;