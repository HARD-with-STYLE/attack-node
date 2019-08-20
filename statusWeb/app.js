const express = require("express");
const app = express();

let data = new Object();
process.on("message",e=>{
    if(e.type == "data"){
        data = e.data;
    }else if(e.type == "exit"){
        process.exit(0);
    }
})

app.use(express.static("./statusWeb/www"));

app.get("/api/status",(req,res) => {
    res.status(200).send(JSON.stringify(data));
});

app.listen(8123);