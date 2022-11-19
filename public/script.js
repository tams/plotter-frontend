const defaultValues = {
  "input-scale": 1,
  "input-cut": false,
  "input-hatch": false,
  "input-hatch-density": 2,
}

let availableColors = []
let drawButtonDisable = false
let currentId = ""

const updateInfo = (text) => {
  document.getElementById("info").innerHTML = text
}

const updatePrintInfo = (text) => {
  document.getElementById("print-info").innerHTML = text
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
  fetch(window.location.pathname + '/upload', {
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
      drawButtonDisable = true;
      setTimeout(refreshStatus, 0);
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
    fetch(window.location.pathname + '/render_svg',{ method: 'POST', body: options })
    .then((res) => {
      if (res.status != 200) {
        updateInfo("server error: " + res.status);
        return;
      }
      return res.json()
    }).then((out) => {
      if (out === undefined) { return; }
      if(!out.success){
        updateInfo("errors occurred in remote command (step: " + out.step + ", error: " + JSON.stringify(out.error) + ")")
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
  document.getElementById("preview-img").src = window.location.pathname + "/original/" + Math.floor(Math.random() * 1000).toString()
}

const showPreview = () => {
  document.getElementById("preview-img").style = "display:block"
  document.getElementById("preview-img").src = window.location.pathname + "/preview/" + Math.floor(Math.random() * 1000).toString()
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
  fetch(window.location.pathname + '/render_svg',{ method: 'POST', body: options })
  .then((res) => {
    if (res.status == 412) {
      updateInfo("invalid render options!");
      return;
    }
    else if (res.status != 200) {
      updateInfo("server error: " + res.status);
      return;
    }
    return res.json()
  }).then((out) => {
    if (out === undefined) { return; }
    if(!out.success){
      updateInfo("errors occurred in remote command (step: " + out.step + ", error: " + JSON.stringify(out.error) + ")")
    } else {
      let json = JSON.parse(out.stdout);
      let size = json.transformed_size;
      updateInfo(`extents: (${size.begin.x}mm, ${size.begin.y}mm) to (${size.end.x}mm, ${size.end.y}mm)`);
      showPreview();
      document.getElementById("show-original").disabled = false;
      document.getElementById("show-preview").disabled = false;
      drawButtonDisable = false;
      setTimeout(refreshStatus, 0);
    }
  });
}

const draw = (what) => {
  if (!confirm("Are you sure you want to send commands to the plotter?")) {
    return;
  }
  fetch(window.location.pathname + '/run/' + what)
  .then((res) => {
      refreshStatus();
  });
}

const stop = () => {
  if (!confirm("Are you sure you want to cancel the current drawing?")) {
    return;
  }
  fetch("/plotter/stop")
  .then((res) => {
      refreshStatus();
  });
}

const pause = () => {
  // No confirmation asked here,
  // you can resume at no cost.
  fetch("/plotter/pause")
  .then((res) => {
      refreshStatus();
  });
}

const resume = () => {
  if (!confirm("Are you sure you want to resume the current drawing?")) {
    return;
  }
  fetch("/plotter/resume")
  .then((res) => {
      refreshStatus();
  });
}

const refreshStatus = () => {
  fetch("/plotter/status").then((res) => {
    if (res.status != 200) {
      updateInfo("server error: " + res.status);
      return;
    }
    return res.json()
  }).then((out) => {
    if (out.author == currentId) {
        updatePrintInfo(out.last_output);
    } else if (out.busy) {
        updatePrintInfo("busy...");
    } else {
        updatePrintInfo("");
    }

    // Change draw buttons state
    var inputs = Array.from(document.querySelectorAll('#draw-buttons .draw-button'));
    inputs.forEach((input) => {
      input.disabled = drawButtonDisable || out.busy;
    });

    // Change control buttons state
    document.querySelector('#control-stop').disabled = !out.busy;
    document.querySelector('#control-pause').disabled = !out.busy || out.paused;
    document.querySelector('#control-resume').disabled = !out.busy || !out.paused;

    // Update progress bar
    var progress = document.querySelector('#progress-bar progress');
    progress.max = out.sizeTotal;
    progress.value = out.sizeCur;


  }).catch((error) => {
    console.error("fetch failed:", error)
  })
}

window.addEventListener('load', () => {
  // set current id
  currentId = window.location.pathname.split("/")[2];
  // unload files
  document.getElementById("load-svg").value="";
  // reset form
  resetRenderOptions();
  // disable buttons
  document.getElementById("render").disabled = true;
  document.getElementById("show-original").disabled = true;
  document.getElementById("show-preview").disabled = true;
  drawButtonDisable = true;

  // TODO remove test image
  const testSrc = "/static/techinc_flyer.svg";
  const previewContainer = document.getElementById("preview");
  const previewImg = document.getElementById("preview-img");
  const upImg = previewImg.getElementById("uploaded-img");
  const border = previewImg.getElementById("border");

  const resize = () => {
      const contStyle = getComputedStyle(previewContainer, null);
      const containerW = previewContainer.getBoundingClientRect().width 
        - parseInt(contStyle.getPropertyValue("padding-left"))
        - parseInt(contStyle.getPropertyValue("padding-right"));
      const containerH = previewContainer.getBoundingClientRect().height
        - parseInt(contStyle.getPropertyValue("padding-top"))
        - parseInt(contStyle.getPropertyValue("padding-bottom"));
      const containerA = containerW / containerH;

      const loadedSvg = upImg.children[0]
      const loadedSvgW = loadedSvg.getAttribute("width");
      const loadedSvgH = loadedSvg.getAttribute("height");
      const loadedSvgA = loadedSvgW / loadedSvgH;

      let scale = 1;
      if (loadedSvgA >= containerA) {
        scale = containerW / loadedSvgW;
      }
      else {
        scale = containerH / loadedSvgH;
      }
      upImg.setAttribute("width", loadedSvgW);
      upImg.setAttribute("height", loadedSvgH);
      border.setAttribute("width", loadedSvgW);
      border.setAttribute("height", loadedSvgH);
      previewImg.setAttribute("width", containerW);
      previewImg.setAttribute("height", containerH);
      upImg.setAttribute("transform", `scale(${scale})`)
      border.setAttribute("transform", `scale(${scale})`)
  }

  fetch(testSrc)
    .then(resp => resp.text())
    .then(svgData => upImg.innerHTML = svgData)
    .then(() => {
      resize();
    })
  
  window.addEventListener("resize", resize);

  setInterval(refreshStatus, 1000);
  refreshStatus();
});
