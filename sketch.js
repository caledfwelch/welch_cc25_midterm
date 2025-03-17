// click to reset at end

let startTime;
let expandTime = 180; // time (should be 3 min but i'm using 30 secs because i'm impatient)
let maxBorderWidth;
let currBorderWidth;
let houseParts = []; // store house parts
let cracks = []; // store cracks
let quadrantColors = []; // store quadrant colors

function setup() {
    createCanvas(windowWidth, windowHeight);
    background(0);
    startTime = millis(); // record start time
    
    // set max border width to be large enough to completely fill the screen
    maxBorderWidth = min(width, height) / 2; // half of the smallest dimension to reach center from both sides
    currBorderWidth = 0; // start with no border
    noCursor();
    
    quadrantColors = [
        color(118, 202, 232), // tl: daytime
        color(191, 72, 29), // tr: sunset
        color(143, 179, 161), // bl: sunrise
        color(19, 38, 82) // br: midnight
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
        let boxX = (width - boxSize) / 2;
        let boxY = (height - boxSize) / 2;

        // determine which quadrant mouse is in
        let quadrantColor = getQuadrantColor(mouseX, mouseY);

        // draw background for visible area with quadrant color
        fill(quadrantColor);
        rect(boxX, boxY, boxSize, boxSize);
        
        // draw house with distortion effects
        drawDistortedHouse(boxX, boxY, boxSize, boxSize, squeezeFactor);
        
        // dust particles as house breaks
        if (squeezeFactor > 0.4) {
            drawDustParticles(boxX, boxY, boxSize, boxSize, squeezeFactor);
        }
        
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

function getQuadrantColor(x, y) {
    // determine which quadrant current position (x, y) is in
    if (x < width / 2 && y < height / 2) {
        return quadrantColors[0]; // tl
    } else if (x >= width / 2 && y < height / 2) {
        return quadrantColors[1]; // tr
    } else if (x < width / 2 && y >= height / 2) {
        return quadrantColors[2]; // bl
    } else {
        return quadrantColors[3]; // br
    }
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
    createHouseParts();
}

// TODO: add pressure gauge of some kind? 
// grass/clouds/stars? add more house parts
// text when screen fills black?
// sky color changing rapidly as intensity increases? get rid of quadrant and add sun/moon that spins faster and faster???