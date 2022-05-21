const express = require('express')
const bp = require('body-parser')
const app = express()
const { exec } = require("child_process");
const fileUpload = require("express-fileupload");
const path = require("path");
const morgan = require("morgan")

app.use(express.static('public'));
app.use(bp.json())
app.use(express.urlencoded({extended: true}));
app.use(fileUpload({
    limits: {
        fileSize: 1024 * 1024 // 1 MB
    },
    abortOnLimit: true,
    createParentPath: true
}))
app.use(morgan("dev"))

// cache bypass for updated preview
app.get('/preview/:code', (req, res) => {
  res.redirect('/preview');
})

app.get('/preview', (req, res) => {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.sendFile(__dirname + '/vis.svg');
})

app.get('/run', (req, res) => {
  exec("cat ./files/out/image.wild > /dev/ttyS0", (error, stdout, stderr) => {
      res.json({ stdo: stdout, stde: stderr });
  });
});

app.post("/convert", (req, res) => {
  let _cmd = "./wild_driver"
  let boxed = false;
  if(req.body.box === '1'){ _cmd = _cmd.concat(" ", "--box"); boxed=true; }
  if(req.body.hatch === '1'){ _cmd = _cmd.concat(" ", "--hatch") }
  if(req.body.dryrun === '1'){  _cmd = _cmd.concat(" ", "--dry_run") }
  _cmd = _cmd.concat(" ", "-i ./files/in/image.svg -o ./files/out/image.wild");
  exec(_cmd, (error, stdout, stderr) => {
    stdout = boxed ? "boxed version -> " + stdout : "final version -> " + stdout;
    return res.json({stdo: stdout, stde: stderr})
  })
})

app.post("/upload", (req, res) => {
  if (!req.files) {
    return res.status(400).send("No files were uploaded.");
  }
  const filename = req.files.file.name;
  const filepath = __dirname + "/files/in/image.svg";
  const extensionName = filename.substring(filename.length - 4); // fetch the file extension
  const allowedExtension = ['.svg','.SVG'];
  if(!allowedExtension.includes(extensionName)){
    return res.status(422).send("Invalid Image");
  }

  req.files.file.mv(filepath, (err) => {
    if (err) {
      return res.status(500).send(err);
    }
    return res.send({ status: "success", path: filepath });
  });
});

app.listen(8080, (err) => {
  if(err) throw err;
  console.log("listening on port 8080");
})
