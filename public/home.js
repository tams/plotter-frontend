let options = {
  "hatch":0,
  "box":0,
  "dry-run":0
}

const uncheck_inputs = () => {
  var inputs = document.getElementsByTagName('input');
    for (var i=0; i<inputs.length; i++)  {
      if (inputs[i].type == 'checkbox')   {
        inputs[i].checked = false;
      }
    }
}

window.addEventListener('load', () => {
  console.log("setup taking place")
  uncheck_inputs()
  const checkboxes = document.querySelectorAll("input[type=checkbox]")
  console.log(checkboxes)
  checkboxes.forEach(
	(input) => {
		input.addEventListener('click',
			(item) => {
				options[item.target.id] ^= 1;
                	})
         })
});

const convertSVG = () => {
  console.log("you clicked convertSVG")
  console.log(options)
}

const updateInfo = (text) => {
  document.querySelector("#feedback").innerHTML = text
}



const upload = () => {
  console.log("uploading")
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
     }
  });
}
