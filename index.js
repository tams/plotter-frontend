const express = require('express')
const bp = require('body-parser')
const app = express()
const { exec } = require("child_process");
const fileUpload = require("express-fileupload");
const path = require("path");
const morgan = require("morgan");
const { Z_NO_COMPRESSION } = require('zlib');
const Validator = require('validatorjs');

const validator = (body, rules, customMessages, callback) => {
  const validation = new Validator(body, rules, customMessages);
  validation.passes(() => callback(null, true));
  validation.fails(() => callback(validation.errors, false));
};

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


// cache bypass for updated preview/original
app.get('/original/:code', (req, res) => {
  res.redirect('/original');
})

app.get('/preview/:code', (req, res) => {
  res.redirect('/preview');
})


app.get('/original', (req, res) => {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.sendFile(__dirname + '/vis.svg');
})

app.get('/preview', (req, res) => {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.sendFile(__dirname + '/files/in/image.svg');
})


app.get('/run/:target', (req, res) => {
  let tgt = '';
  if(req.params.target === 'box'){ tgt = 'box.wild' }
  if(req.params.target === 'dry_run'){ tgt = 'dry_run.wild' }
  if(req.params.target === 'draw'){ tgt = 'draw.wild' }
  if(tgt === ''){ return res.status(404).send("Invalid endpoint") }

  exec("cat ./files/out/" + tgt + " > /dev/ttyS0", (error, stdout, stderr) => {
      res.json({ stdo: stdout, stde: stderr });
  });
});

app.post("/convert", (req, res) => {
  validator(
    req.body,
    {
      // validation goes there
      "hatch": "boolean|required"
    },
    {},
    (err, status) => {
      if (!status) {
        res.status(412).send(err);
      } else {
        let cmd = "./wild_driver";
        cmd += " --input " + __dirname + "/files/in/image.svg"

        // all the config options go there
        if (req.body.hatch) {cmd += " --hatch"}

        cmd += " --output " + __dirname + "/files/out/"

        exec(cmd + "box.wild --box", (error, stdout, stderr) => {
          if (error) { return res.json({"success": false, "step": 1, "error": error}) }

          exec(cmd + "dry_run.wild --dry_run", (error, stdout, stderr) => {
            if (error) { return res.json({"success": false, "step": 2, "error": error}) }

            exec(cmd + "draw.wild", (error, stdout, stderr) => {
              if (error) { return res.json({"success": false, "step": 3, "error": error}) }

              return res.json({"success": true, "stdout": stdout})
            });
          });
        });
      }
    }
  )
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
