let options = new FormData()
let infobox = null

const uncheckInputs = () => {
  var inputs = document.getElementsByTagName('input');
    for (var i=0; i<inputs.length; i++)  {
      if (inputs[i].type == 'checkbox')   {
        inputs[i].checked = false;
      }
    }
}

const unloadFiles = () => {
  document.querySelector("input[type=file]").value=""
}

const showPreview = () => {
  document.querySelector("#previewIMG").style = "display:block;width:inherit"
  document.querySelector("#previewIMG").src = "http://localhost:8080/preview"
}

const convertSVG = () => {
  console.log("you clicked convertSVG")
  console.log(options)
  // send all info accumulated
  fetch('/convert',{ method: 'POST', body: options})
  .then((res)=> { return res.json() })
  .then((out)=> {
    if(out.stde.length > 0){ console.error("errors occurred in remote command")}
    if(out.stdo.length > 0){
      let arr = out.stdo.split("\n") // retrieve stdout lines
      updateInfo(arr[1]) // update info box
      showPreview()
      document.querySelector("#uploadBtn").disabled = false;
    }
  })
  // activate upload of wild file
}

const updateInfo = (text) => {
  infobox.innerHTML = text
}

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
          updateInfo("we got it right!")
     } else if (res.status=="400"){
          updateInfo("no file loaded")
     }
     document.querySelector("#convertBtn").disabled = false;
  });
}

const disableButtons = () => {
  document.querySelector("#convertBtn").disabled = true;
  document.querySelector("#uploadBtn").disabled = true;
}

const uploadWild = () => {

}

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

