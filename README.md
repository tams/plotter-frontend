# Wild TA-10 frontend
web interface to load images, configure and run the Wild TA-10 plotting machine through its pre-compiled driver, you can get a copy of its source code from [here](https://github.com/quinor/wild_driver), for further information on how to setup and connect the device, check out [the manual](https://wiki.techinc.nl/Wild_TA-10#Manual). The goal is to provide a transparent interface for a user to load an SVG image, convert it to the correct format and send it to the connected plotter just by clicking on buttons.

## pre-requisites
* npm: 8.4.0
* node: 14.19.3

## installation
* clone the repository on your device
* `cd` into the cloned directory
* install packages with `npm i`
* run `npm run server` 
* (optional) expose the port for external access

## usage
despite being fairly intuitive, there are things ot look out for: as the page loads, both buttons at the bottom will be disabled, until the user **loads** an SVG image with the file uploader at the top. The **convert** button will be enabled first and when clicked, it will collect the ticked options to build the command that will convert the SVG file into _.wild_ format. The server will execute the command and return the image measures, which will be displayed in the INFO section at the bottom. If everything went well, the **upload** button will enable the user to issue the final command, piping the converted file through the right socket.

## TODO
* add configuration file for custom ports/paths
* add explanations for optional parameters
* add further parameters for the "convert" command (e.g. scaling)
* have a queue for the print jobs
* verify RS232 connection
* improve styling of UI and possibly UX
