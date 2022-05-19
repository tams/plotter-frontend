const express = require('express')
const bp = require('body-parser')
const app = express()

app.use(express.static('public'));
app.use(bp.json())

// getter
app.listen(8080, (err) => {
  if(err) throw err;
  console.log("listening on 8080");
})
