// click to reset at end

let startTime;
let expandTime = 180; // time, 3 min
let maxBorderWidth;
let currBorderWidth;
let houseParts = []; // store house parts
let cracks = []; // store cracks
let dayNightAngle = 0; // angle for sun/moon rotation, start at 0
let skyColors = []; // store sky colors for day/night cycle

function setup() {
    createCanvas(windowWidth, windowHeight);
    background(0);
    startTime = millis(); // record start time
    
    // set max border width to be large enough to completely fill the screen
    maxBorderWidth = min(width, height) / 2; // half of the smallest dimension to reach center from both sides
    currBorderWidth = 0; // start with no border
    noCursor();
    
    skyColors = [
        color(149, 115, 158), // sunset
        color(30, 28, 66), // night
        color(114, 127, 133), // sunrise
        color(97, 203, 232) // daytime
    ];
    
    createHouseParts();
}

function createHouseParts() {
    // empty array to reset house parts
    houseParts = [];
    
    // relative positions of house parts, will change with draw()
    // use array with various parts to push each house part (see below)
        // shape, coords (relative to top left corner of visible area), color
                                // so this rect starts at 20% of visible area width across, 30% down, 60% for width, 50% for height
    houseParts.push(['rect', [0.2, 0.3, 0.6, 0.5], color(200, 180, 150)]); // main house body
    houseParts.push(['triangle', [[0.2, 0.3], [0.5, 0.1], [0.8, 0.3]], color(150, 100, 50)]); // roof
    houseParts.push(['rect', [0.425, 0.55, 0.15, 0.25], color(120, 80, 40)]); // door
    houseParts.push(['rect', [0.3, 0.4, 0.1, 0.1], color(200, 230, 255)]); // left window
    houseParts.push(['rect', [0.6, 0.4, 0.1, 0.1], color(200, 230, 255)]); // right window
}

function draw() {
    background(0);

    // calculate elapsed time in secs
    let elapsedTime = (millis() - startTime) / 1000;

    // calculate current border width based on elapsed time
    if (elapsedTime < expandTime) {
        currBorderWidth = map(elapsedTime, 0, expandTime, 0, maxBorderWidth); // map time to border width
    } else {
        currBorderWidth = maxBorderWidth; // fill screen when time is up
    }

    // squeeze factor (0-1), proportional to elapsed time %
    let squeezeFactor = currBorderWidth / maxBorderWidth;
    
    // calculate size of visible area
                            // subtract total border width from smallest dimension of the canvas
                            // ensures that the box will fit inside the canvas without the border overlapping edges
    let boxSize = max(0, min(width, height) - 2 * currBorderWidth);
    
    // if there's still visible area
    if (boxSize > 0) {
        // center visible area
        let boxX = (width-boxSize) / 2;
        let boxY = (height-boxSize) / 2;

        // calculate day/night cycle speed based on expandTime, gets faster as expandTime decreasess
        let cycleSpeed = 0.01 * (180 / expandTime);
        
        // update angle to determine time of day, basically a unit circle
        // cycleSpeed increases as squeezeFactor increases
        dayNightAngle += cycleSpeed + (squeezeFactor*cycleSpeed*5);
        
        // gat sky color based on point in day/night circle
        let skyColor = getSkyColor(dayNightAngle);

        // draw background for visible area with sky color
        fill(skyColor);
        rect(boxX, boxY, boxSize, boxSize);
        
        // draw sun, moon, grass
        drawSunAndMoon(boxX, boxY, boxSize, squeezeFactor);
        drawGrass(boxX, boxY, boxSize, boxSize);
        
        // draw house with distortion effects
        drawDistortedHouse(boxX, boxY, boxSize, boxSize, squeezeFactor);
        
        // dust particles as house breaks
        if (squeezeFactor > 0.4) {
            drawDustParticles(boxX, boxY, boxSize, boxSize, squeezeFactor);
        }
        
        // draw pressure bar
        drawPressureBar(boxX, boxY, boxSize, squeezeFactor);
        
        // confine cursor to visible area
        // reference: https://processing.org/reference/constrain_.html
        let ballX = constrain(mouseX, boxX, boxX + boxSize);
        let ballY = constrain(mouseY, boxY, boxY + boxSize);

        // turn cursor into circle
        fill(255, 255, 255, 80);
        noStroke();
        ellipse(ballX, ballY, 15, 15);
    }
}

function getSkyColor(angle) {
    let normAngle = angle % TWO_PI; // normalize angle so it "wraps" back into 0-360 range
    if (normAngle < 0) normAngle += TWO_PI;  // add 2pi if angle is negative

    // divide 2pi into 4 segments for 4 sky colors
    let segment = normAngle / (PI/2);

    // wrap segment value when >4
    let colorIndex = floor(segment) % 4;
    let nextColorIndex = (colorIndex+1) % 4;

    let lerpFactor = segment - floor(segment); // subtract integer part of segment from segment, lerpFactor will be some val 0-1

    return lerpColor(skyColors[colorIndex], skyColors[nextColorIndex], lerpFactor);
    //                ^ curr sky color       ^ next sky color (+1)      ^ how far along between colorIndex and nextColorIndex
}

function drawSunAndMoon(x, y, size, squeezeFactor) {
    // make circular path with origin at center of screen (x/y+size/2), radius is 45% of screen size
    let sunX = x+size/2 + cos(dayNightAngle) * (size*0.45);
    //                     ^ x/y-coords of point on this circle given value of dayNightAngle
    let sunY = y+size/2 + sin(dayNightAngle) * (size*0.45);

    // same for moon
    let moonX = x+size/2 + cos(dayNightAngle+PI) * (size*0.45);
    let moonY = y+size/2 + sin(dayNightAngle+PI) * (size*0.45);

    // draw sun
    fill(255, 238, 161);
    noStroke();
    ellipse(sunX, sunY, size*0.1, size*0.1);

    // draw moon
    fill(200, 200, 200);
    noStroke();
    ellipse(moonX, moonY, size*0.08, size*0.08);
}

function drawGrass(x, y, w, h) {
    fill(33, 69, 28);
    noStroke();
    rect(x, y+h*0.8, w, h*0.2);  // fill bottom 20% of screen

    // draw grass blades
    stroke(59, 133, 49);
    for (let i = 0; i < w; i += w/40) {  // 40 blades across entire screen
        let grassHeight = random(0.03, 0.08) * h;  // random height
        line(x+i, y+h*0.8, x+i, y+h*0.8 - grassHeight);  // draw each blade ("0"-grassHeight)
    }
    noStroke();
}

function drawPressureBar(x, y, size, squeezeFactor) {
    // dimensions
    let barWidth = size * 0.5;
    let barHeight = size * 0.03;
    let barX = x + (size - barWidth) / 2;  // center horizontally
    let barY = y + size * 0.05;  // 5% of the way down from the top

    stroke(100);
    strokeWeight(2);
    noFill();
    rect(barX, barY, barWidth, barHeight);  // bar outline

    // move from green to red based on squeezeFactor
    let gaugeColor = color(
        map(squeezeFactor, 0, 1, 0, 255), // red increases
        map(squeezeFactor, 0, 1, 255, 0), // green decreases
        0 // blue is 0
    );

    fill(gaugeColor);
    noStroke();
    rect(barX, barY, barWidth*squeezeFactor, barHeight); // fill width (progress) proportional to squeezeFactor
}

function drawDistortedHouse(x, y, w, h, squeezeFactor) {
    // add new cracks as squeeze increases
    // check if random # 0-1 is < than 0.05 * squeezeFactor
    // which is probability of a crack appearing during each frame
    // so more cracks will form as squeeze factor increases
    if (random() < 0.05 * squeezeFactor && cracks.length < 20 * squeezeFactor) {
        // using key-value pairs
        // each key (startX, startY, etc.) represents a property of the crack
        // and the corresponding value defines characteristic for that crack
        // i did these a lot in data structures, but let me know if i shouldn't use these for this project
        let newCrack = {
            startX: random(0.2, 0.8), // random start position within house
            startY: random(0.2, 0.7),
            length: random(0.05, 0.2), // random crack length
            angle: random(PI), // random crack angle (0-180)
            branches: floor(random(1, 4)) // random # of branches
        };
        cracks.push(newCrack); // add new crack to array
    }
    push();
    translate(x, y); // move origin to top-left corner of visible area
    
    // draw each house part
    for (let part of houseParts) {
        let partType = part[0]; // 'rect' or 'triangle'
        let coords = part[1]; // coords
        // rect array: [x, y, width, height]
        // triangle array: [[x1, y1], [x2, y2], [x3, y3]]
        let partColor = part[2]; // color
        
        let distortion = map(squeezeFactor, 0, 1, 0, 20); // calculate distortion amount by scaling squeeze factor (0-1) to distortion range of 0-20
        
        stroke(64, 52, 39);

        if (partType === 'rect') {
            // calculate actual position and size of the rectangle
            // eX, eY, eW, eH of rectangle are relative to visible area
            // so we scale relative x, y, width, height to visible width/height
            let [relX, relY, relWidth, relHeight] = coords;
            let eX = relX * w;
            let eY = relY * h;
            let eW = relWidth * w;
            let eH = relHeight * h;
            
            // apply distortion effect to house body (rect)
            fill(partColor);
            beginShape();
        
            // add random distortion to x and y coords based on distortion amount and squeeze factor
            // tl
            vertex(
                eX + random(-distortion, distortion) * squeezeFactor, // x coord w distortion
                eY + random(-distortion, distortion) * squeezeFactor  // y coord w distortion
            );
        
            // tr
            vertex(eX + eW + random(-distortion, distortion) * squeezeFactor, eY + random(-distortion, distortion) * squeezeFactor);
        
            // br
            vertex(eX + eW + random(-distortion, distortion) * squeezeFactor, eY + eH + random(-distortion, distortion) * squeezeFactor);
        
            // bl
            vertex(eX + random(-distortion, distortion) * squeezeFactor, eY + eH + random(-distortion, distortion) * squeezeFactor);
            endShape(CLOSE);
        } 
        else if (partType === 'triangle') {
            fill(partColor);
            beginShape();

            // loop through each point of triangle
            for (let point of coords) {
                let [relX, relY] = point;
                // add random distortion to x and y coords of each point
                vertex(relX * w + random(-distortion, distortion) * squeezeFactor, relY * h + random(-distortion, distortion) * squeezeFactor);
            }
            endShape(CLOSE);
        }
    }
    
    // draw cracks
    stroke(0,0,0,30);
    strokeWeight(1);
    for (let crack of cracks) {
        drawCrack(
            crack.startX * w, // starting x and y scaled to visible area
            crack.startY * h, 
            crack.length * w, // length scaled to visible area
            crack.angle, // angle at which crack is drawn
            crack.branches, // # branches
            squeezeFactor // crack intensity, increases as visible area shrinks
        );
    }
    pop();
}

function drawCrack(startX, startY, length, angle, branches, intensity) {
    strokeWeight(map(intensity, 0, 1, 0.5, 2)); // adjust stroke weight relative to intensity
    
    // main crack
    //reference: https://processing.org/reference/sin_.html and https://processing.org/reference/cos_.html
    let endX = startX + cos(angle) * length; // find end x and y
    let endY = startY + sin(angle) * length;
    line(startX, startY, endX, endY);
    
    // crack branches w high intensity
    if (branches > 0 && intensity > 0.5) {
        // add branches if crack has remaining branches to draw (branches > 0) and if crack intensity is greater than 0.5 (aka high distortion)
    
        let branchLength = length * 0.6; // branch length = 60% of parent crack length
    
        for (let i = 0; i < branches; i++) {
            // loop through # of branches to draw, each iteration creates 1 branch
    
            let branchAngle = angle + random(-PI/3, PI/3); // random branch angle between -60 and 60 dgs of parent angle
    
            drawCrack(
                endX, // start branch at the end of parent crack
                endY, 
                branchLength,
                branchAngle,
                branches - 1, // decrease remaining # of branches (will stop when branches = 0)
                intensity * 0.8 // lower intensity to 80% of initial intensity
            );
            // create smaller sub-branches for crackier cracks
        }
    }
}

function drawDustParticles(x, y, w, h, intensity) {
    let particleCount = floor(intensity * 50); // # of particles relative to intensity
    fill(200,200,200,80);
    noStroke();
    
    for (let i = 0; i < particleCount; i++) {
        let size = random(1,3);
        ellipse(x + random(w), y + random(h), size, size); // random x and y within visible area
    }
}

// to accomodate browser window being resized 
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    maxBorderWidth = min(width, height) / 2; // half of smallest window dimension
}

// reset everything when mouse clicked
function mousePressed() {
    startTime = millis();
    currBorderWidth = 0;
    cracks = [];
    dayNightAngle = 0;
    createHouseParts();
}
