let options = new FormData()
let infobox = null

/* free all ticked boxes on page load */
const uncheckInputs = () => {
  var inputs = document.getElementsByTagName('input');
    for (var i=0; i<inputs.length; i++)  {
      if (inputs[i].type == 'checkbox')   {
        inputs[i].checked = false;
      }
    }
}

/* clear file uploader on page re-load */
const unloadFiles = () => {
  document.querySelector("input[type=file]").value=""
}

/* load the vis.svg file AFTER new image is converted */
const showPreview = () => {
  document.querySelector("#previewIMG").style = "display:block;width:inherit"
  document.querySelector("#previewIMG").src = "http://localhost:8080/preview"
}

/* action triggered upon clicking the "convert" button */
const convertSVG = () => {
  // global "options"
  fetch('/convert',{ method: 'POST', body: options})
  .then((res)=> { return res.json() })
  .then((out)=> {
    if(out.stde.length > 0){ console.error("errors occurred in remote command")}
    if(out.stdo.length > 0){
      let arr = out.stdo.split("\n")
      updateInfo(arr[1]) // positional selection of stdout lines :(
      showPreview()
      document.querySelector("#uploadBtn").disabled = false;
    }
  })
}

const updateInfo = (text) => {
  infobox.innerHTML = text
}

/*
* triggered upon file uploader change
* gives feedback in the INFO section
* upon successful operation unlocks the convert button
*/
const uploadSVG = () => {
  console.log("uploading")
  document.querySelector("#uploadBtn").disabled = true;
  var input = document.querySelector("input[type=file]")
  console.log(input.files[0])
  const fd = new FormData()
  fd.append("file", input.files[0])
  fetch('/upload', {
    method: 'POST',
    body: fd
  }).then((res) => {
     if(res.status=="422"){
          updateInfo("the file extention is incorrect")
     } else if (res.status=="500"){
          updateInfo("ouh shit you broke the server")
     } else if (res.status=="200"){
          updateInfo("the image was successfully uploaded")
          document.querySelector("#convertBtn").disabled = false;
     } else if (res.status=="400"){
          updateInfo("no file loaded")
     } else {
          updateInfo("unknown error code")
     }
  });
}

// for some reason I have to do it with js despite attribute beign set in the html element
const disableButtons = () => {
  document.querySelector("#convertBtn").disabled = true;
  document.querySelector("#uploadBtn").disabled = true;
}

/*
* our "main" function
* forces inputs to blank
* allows checkboxes to update global state
* initialize the infobox reference
*/
window.addEventListener('load', () => {
  console.log("setup taking place")
  disableButtons()
  unloadFiles()
  const checkboxes = document.querySelectorAll("input[type=checkbox]")
  console.log(checkboxes)
  checkboxes.forEach(
	(input) => {
                isChecked = input.checked ? 1 : 0;
                options.append(input.id, isChecked);
		input.addEventListener('click',
			(item) => {
				options.set(item.target.id, 1 - options.get(item.target.id));
                	})
  })
  infobox = document.querySelector("#feedback")
});

