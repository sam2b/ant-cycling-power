// ------------- Edit only these values below -------------
var sensorPin = 33; // Pin for cadence sensor.
var buttonUpPin = 35; // Pin button up.
var buttonDownPin = 37; // Pin button down.
var buttonAutoModePin = 32;
var resistanceUpPin = 5; // GPIO5 resistance up.
var resistanceDownPin = 6; // GPIO6 resistance down.
var startingLevel = 9; // If too easy, increase this value.  Else, decrease.
var adjustedLevel = startingLevel;
// -------------- Do not edit below this line --------------

var keypress = require('keypress');
var SpeedMeter = require('./SpeedMeter');
var speedmeter = new SpeedMeter.SpeedMeter(sensorPin, buttonUpPin, buttonDownPin, resistanceUpPin, resistanceDownPin);
var power_meter = require('./power-meter');
var pm = new power_meter.PowerMeter();
var Zwifter = require("./Zwifter");
var z = new Zwifter.Zwifter();
var autoMode = true;
var easyMode = false;
var counter = 0;
z.start();

function initialize() {
    // make `process.stdin` begin emitting "keypress" events
    keypress(process.stdin);

    // listen for the "keypress" event
    process.stdin.on('keypress', function(ch, key) {
        //console.log('got "keypress"', key);
        switch (key.name) {
            case 'q': // ctrl-q
            case 'Q':
                if (key && key.ctrl && (key.name == 'q' || key.name == 'Q')) {
                    pm.close(); // closes the stick.
                    process.exit(0);
                }
                break;
            case 'e':
            case 'E':
                if (easyMode) {
                    easyMode = false;
                    adjustedLevel = startingLevel; // Restore to original starting level value.
                    console.log("Easy mode OFF.");
                } else {
                    easyMode = true;
                    adjustedLevel -= 2; // Advantage by two levels less.
                    console.log("Easy mode ON.");
                }
                z.setEasyMode(easyMode);
                z.setLevelAtZeroPercentGrade(adjustedLevel);
                console.log("adjustedLevel = " + z.getLevelAtZeroPercentGrade());
                break;
            case 'space':
                if (autoMode) {
                    autoMode = false;
                    console.log("Auto mode OFF."); // Manual control of the resistance.
                } else {
                    autoMode = true;
                    adjustedLevel = startingLevel; // reset to default starting level.
                    console.log("Auto mode ON."); // Automatic control of the resistance.
                }
                speedmeter.setAutoMode(autoMode);
                break;
        }
    });

    process.stdin.setRawMode(true);
    process.stdin.resume();
    z.setMaxLevel(speedmeter.getMaxLevel());
    z.setLevelAtZeroPercentGrade(adjustedLevel);
    console.log("adjustedLevel = " + adjustedLevel);
    console.log("adjustedLevel = " + z.getLevelAtZeroPercentGrade());
    console.log("     maxLevel = " + speedmeter.getMaxLevel());
    console.log("     easyMode = " + easyMode);
    console.log("     autoMode = " + autoMode);
}

function run() {
    var power_instant;
    var cadence;
    var power_instant;

    // Runs asynchronously to prevent drops in RPM.
    setInterval(function() {
        //console.log("Broadcasting power and cadence...");
        power_instant = Math.round(speedmeter.getPower());
        cadence = Math.round(speedmeter.getSpeed());
        /*if (isNaN(power_instant)) {
            console.log("------------POWER NAN----------------"); // debugging, remove me.
        }
        if (isNaN(cadence)) {
            console.log("------------cadence NAN----------------"); // debugging, remove me.
        }*/
        power_instant = isNaN(power_instant) ? 0 : power_instant; //avoid NaN
        pm.broadcast(power_instant, cadence);
    }, 249);

    // Runs asynchronously to change the level. Most noticeable when suddenly encountering a steep grade, i.e. from 0% to 10%.
    var levelValue;
    setInterval(function() {
        goodLevelValue = z.getLevelRequested();
        if (!goodLevelValue) {
            console.log("Problem getting levelRequested, likely due");
            console.log("to an issue with the zwift-mobile-api");
            console.log(" ");
        }
        if (autoMode && goodLevelValue) {
            setResistance(z.getLevelRequested(), speedmeter.getLevel());
        }
    }, 2000);
}

// Logic for relays.
function setResistance(requestedLevel, currentLevel) {
    //console.log("requestedLevel = " + requestedLevel);
    //console.log("currentLevel   = " + currentLevel);
    var delta = requestedLevel - currentLevel;
    if (isNaN(delta)) delta = 0;

    // Bound the delta.  Can be positive or negative.
    if ((delta + currentLevel) > speedmeter.getMaxLevel()) {
        delta = speedmeter.getMaxLevel() - currentLevel;
    } else if ((delta + currentLevel) < 1) {
        delta = 1; // minimum of 1.
    }

    var relayDelay = 100; // Too low of delay value might be debounced in SpeedMeter.
    var i = delta;
    if (i < 0) i *= -1; // i must always be positive.

    // Conditions in order of highest frequency.
    if (delta == 0) {
        // nothing. Keep this code block for efficiency's sake.
    } else if (delta > 0) {
        //console.log("   RAISING RESISTANCE " + i + " TIMES     ^^^^^^^^");
        while (i > 0 && (z.getLevelRequested() <= speedmeter.getMaxLevel())) {
            speedmeter.toggleRelay(resistanceUpPin, relayDelay);
            speedmeter.incLevel();
            i--;
        }
        console.log("    Level " + speedmeter.getLevel() + " at " + z.getGrade() + "%");
    } else { //if (delta < 0) {
        //console.log("   vvvvvvvv    LOWERING RESISTANCE " + i + " TIMES");
        while (i > 0 && (speedmeter.getLevel() > 0)) {
            speedmeter.toggleRelay(resistanceDownPin, relayDelay);
            speedmeter.decLevel();
            i--;
        }
        console.log("    Level " + speedmeter.getLevel() + " at " + z.getGrade() + "%");
    }
}

//function msleep(delta) {
//    // Must use node.js 9.3 or higher to use Atomics.  
//    // Otherwise use system-sleep package.
//    // https://github.com/erikdubbelboer/node-sleep/blob/master/README.md
//    // Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, delta);
//}

initialize();
run();

