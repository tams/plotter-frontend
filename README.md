# Wild TA-10 frontend
web interface to load images, configure and run the Wild TA-10 plotting machine through its driver. For further information on how to setup and connect the device, check out [the manual](https://wiki.techinc.nl/Wild_TA-10#Manual). The goal is to provide a transparent interface for a user to load an SVG image, convert it to the correct format and send it to the connected plotter just by pressing buttons.

## pre-requisites
* npm: 8.4.0
* node: 14.19.3
* Make
* C++14-compatible version of gcc

## installation
* clone the repository on your device
* `cd` into the cloned directory
* run `make` to install depencencies and compile wild_driver
* run `npm run server`
* (optional) expose the port for external access

## usage
As the page loads, most buttons will be disabled, until the user **loads** an SVG image with the **Choose File** button at the top. The **Render** button will be enabled first and when clicked, it will convert the SVG file into plotter commands. If everything went well, the **Box**, **Dry Run** and **Draw** buttons will enable the user to issue the commands to the plotter. **Box** moves lifted plotting tool around bounding box of the image. **Dry Run** traces the entire image with the tool lifted. **Draw** draws the image.

## TODO
* robustify against multiple instances running at once (ie. sessions)
* add configuration file for custom ports/paths
* add explanations for optional parameters
* add further parameters for the "convert" command (e.g. scaling)
* have a queue for the print jobs
* verify RS232 connection
* improve styling of UI and possibly UX
