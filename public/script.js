const defaultValues = {
  "input-scale": 1,
  "input-cut": false,
  "input-hatch": false,
  "input-hatch-density": 2,
}

let availableColors = []

const updateInfo = (text) => {
  document.getElementById("info").innerHTML = text
}

const renderColorPicker = () => {
  let table = document.querySelector("#settings tbody:nth-child(1)")
  table.replaceChildren(table.querySelector(":scope tr:nth-child(1)"));
  availableColors.forEach((color) => {
    let id = `input-color-${color.hex.substring(1)}`
    let tr = table.appendChild(document.querySelector("#dom-container>:nth-child(1) tr").cloneNode(true));
    let input = tr.querySelector(":scope td:nth-child(2) input");
    let square = tr.querySelector(":scope td:nth-child(2) label");
    let code = tr.querySelector(":scope td:nth-child(4) span");
    input.id = id;
    input.name = color.hex;
    square.htmlFor = id;
    square.style = `background-color: ${color.hex};`
    code.innerHTML = color.hex;
  });
}

const setAllColors = (state) => {
  document.querySelectorAll("#settings tbody:nth-child(1) input[type=checkbox]").forEach((input) => {
    input.checked = state;
  });
}

const uploadSVG = () => {
  var input = document.getElementById("load-svg")
  const fd = new FormData()
  fd.append("file", input.files[0])
  fetch('/upload', {
    method: 'POST',
    body: fd

  }).then((res) => {
    if(res.status=="422"){
      updateInfo("the file extention is incorrect")
    } else if (res.status=="500"){
      updateInfo("oh shit you broke the server")
    } else if (res.status=="200"){
      let elt = document.querySelector("#load-svg+.big-button-label p:nth-child(2)");
      elt.innerHTML = input.files[0].name
      showOriginal();
      document.getElementById("render").disabled = false;
      document.getElementById("show-original").disabled = true;
      document.getElementById("show-preview").disabled = true;
      document.getElementById("draw-box").disabled = true;
      document.getElementById("draw-dry-run").disabled = true;
      document.getElementById("draw-final").disabled = true;
      return true;
    } else if (res.status=="400"){
      updateInfo("no file loaded")
    } else {
      updateInfo("unknown error code " + res.status)
    }

  }).then((ok) => {
    if (!ok) {
      return;
    }
    let options = new FormData()
    options.append("colors_only", true)
    options.append("scale", 1)
    fetch('/render_svg',{ method: 'POST', body: options })
    .then((res) => {
      if (res.status != 200) {
        updateInfo("server error: " + res.status);
        return;
      }
      return res.json()
    }).then((out) => {
      if (out === undefined) { return; }
      if(!out.success){
        updateInfo("errors occurred in remote command (step: " + out.step + ", error: " + out.error + ")")
      } else {
        let json = JSON.parse(out.stdout);
        availableColors = json.colors;
      }
    }).then(() => {
      renderColorPicker();
    });
  });
}

const showOriginal = () => {
  document.getElementById("preview-img").style = "display:block"
  document.getElementById("preview-img").src = "/original/" + Math.floor(Math.random() * 1000).toString()
}

const showPreview = () => {
  document.getElementById("preview-img").style = "display:block"
  document.getElementById("preview-img").src = "/preview/" + Math.floor(Math.random() * 1000).toString()
}

const getInput = (field) => {
  if (field.type == "checkbox") {
    return Boolean(field.checked);
  } else {
    return field.value;
  }
}

const setInput = (field, value) => {
  if (field.type == "checkbox") {
    field.checked = value;
  } else {
    field.value = value;
  }
}

const resetField = (name) => {
  let field = document.getElementById(name)
  setInput(field, defaultValues[name]);
  changeRenderOptions();
}

const resetRenderOptions = () => {
  for (const [input, value] of Object.entries(defaultValues)) {
    let field = document.getElementById(input)
    setInput(field, value);
  }
  changeRenderOptions();
}

const changeRenderOptions = () => {
  for (const [input, value] of Object.entries(defaultValues)) {
    let field = document.getElementById(input)
    let resetButton = field.parentElement.parentElement.querySelector(":scope td:nth-child(3) button");
    resetButton.disabled = Boolean(getInput(field) == value);

    if (input == "input-cut")
    {
      let button = document.querySelector("#draw-final+label p");
      if (getInput(field)) {
        button.innerHTML = "Cut!";
      } else {
        button.innerHTML = "Draw!";
      }
    }
  }
}

const renderSVG = () => {
  let options = new FormData(document.getElementById("render-options"))
  let colors = Array.from(new FormData(document.getElementById("color-picker")).entries())
    .map(([color, state]) => {
      return state === "on" ? color : null;
    })
    .filter((val) => {
      return val !== null;
    })
    .join(" ");
  options.append("color_key", colors)
  fetch('/render_svg',{ method: 'POST', body: options })
  .then((res)=> {
    if (res.status != 200) {
      updateInfo("server error: " + res.status);
      return;
    }
    return res.json()
  }).then((out) => {
    if (out === undefined) { return; }
    if(!out.success){
      updateInfo("errors occurred in remote command (step: " + out.step + ", error: " + out.error + ")")
    } else {
      let json = JSON.parse(out.stdout);
      let size = json.transformed_size;
      updateInfo(`extents: (${size.begin.x}mm, ${size.begin.y}mm) to (${size.end.x}mm, ${size.end.y}mm)`);
      showPreview();
      document.getElementById("show-original").disabled = false;
      document.getElementById("show-preview").disabled = false;
      document.getElementById("draw-box").disabled = false;
      document.getElementById("draw-dry-run").disabled = false;
      document.getElementById("draw-final").disabled = false;
    }
  });
}

const draw = (what) => {
  if (!confirm("Are you sure you want to send commands to the plotter?")) {
    return;
  }

  var inputs = Array.from(document.getElementsByTagName('input'));

  inputs.forEach((input) => {
    input.disabled = true;
  });
  updateInfo("printing in progress...");

  fetch('/run/' + what).then((res) => { return res.json() }).then((res) => {
    if (!res.error) {
      updateInfo("printing successful");
    } else {
      updateInfo("printing failed!<br/>" + res.stdout + "<br/>" + res.stderr)
    }
    inputs.forEach((input) => {
      input.disabled = false;
    });
  });
}

window.addEventListener('load', () => {
  // unload files
  document.getElementById("load-svg").value="";
  // reset form
  resetRenderOptions();
  // disable buttons
  document.getElementById("render").disabled = true;
  document.getElementById("show-original").disabled = true;
  document.getElementById("show-preview").disabled = true;
  document.getElementById("draw-box").disabled = true;
  document.getElementById("draw-dry-run").disabled = true;
  document.getElementById("draw-final").disabled = true;
});
