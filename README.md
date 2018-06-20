# ANT+ Bicycle Power Profile

This is a simple implementation of an ANT+ profile for a virtual power meter.
It only broadcasts instant power and cadence, with no torque or pedal
measurements.

Augmented & extended document written by AndreasO1 
<BR>https://www.instructables.com/id/Using-Zwift-With-Nearly-Any-Fitness-Device/

##HARDWARE INSTALLATION
<instructions eta July 2018>

##SOFTWARE INSTALLATION
1) Plug in your Ant+ usb devices: one into your Raspberry Pi and one your computer running Zwift.
2) Do everything as root!  Otherwise, at your own risk of headache and horror.

```
sudo su -
```

3) cd /home/pi

4) From your home directory, type the following:

```
apt-get update -y
apt-get upgrade -y
apt-get install npm git build-essential libudev-dev -y
npm install -g n
npm install -g jspm
n 6.0.0
npm install -g npm@6.0.0
npm install -g typings typescript
git clone --recursive https://github.com/sam2b/ant-cycling-power
git clone --recursive https://github.com/sam2b/ZwiftVirtualPower
cp ZwiftVirtualPower/SpeedMeter.js ant-cycling-power/
cp ZwiftVirtualPower/Zwifter.js ant-cycling-power/
```

5) cd into folder ant-cycling-power

```
npm install
cd node_modules/ant-plus
npm install
cd ../..
jspm install npm:ant-plus
```

Accept all of the defaults by pressing enter at each prompt.

```
cp -r jspm_packages/npm/ant-plus@0.0.19/build node_modules/ant-plus/
```

6) Edit the following files:

```
nano Test.js
```

a. zwiftUsername = ""
<BR>b. zwiftPassword = ""
<BR>c. zwiftID = ""
<BR>1) You can locate your six digit zwift id number by browsing your Documents folder.  i.e. C:\Users\<your user name>\Documents\Zwift\cp\
<BR>2) In here, a folder exists for each user that has logged into zwift.  Find yours, and note the six digit number.
<BR>3) Edit the pin numbers for the physical connections you made.

```
nano Zwifter.js
```

a. username = ""
<BR>b. password = ""
<BR>c. riderID = ""
<BR>    1) Same as the zwiftID above.
7) Type exit to return to the pi user.
8) cd ant-cycling-power
9) Finally, run it!!

```
sudo node test.js
```

10) You should see:

```
pi@raspberrypi:~/ant-cycling-power $ sudo node test.js
OK FOUND ANT+
startingLevel = 8
startingLevel = 8
     maxLevel = 20
     easyMode = false
     autoMode = true
startup
Max channels: 8
cycling power meter initialized
```

11) To quit:
<BR>    a. Press ctrl-q
<BR>    b. You should see:

```
Closing stick now...
```
