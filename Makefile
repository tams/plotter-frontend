all: wild_driver wild_driver_bin npm

.PHONY: all wild_driver wild_driver_bin npm

wild_driver:
	git submodule update --init

wild_driver_bin: wild_driver
	cd wild_driver && $(MAKE)

npm:
	npm i
