'use strict';

var model, reverb;
var notes;

function setup() {
  createCanvas(window.innerWidth - 20, window.innerHeight - 20);
  frameRate(30);
  colorMode(HSB, 360, 170, 100, 15);
  ellipseMode(RADIUS);
  reverb = new p5.Reverb();
  reverb.set(1.7);
  reverb.connect(p5.soundOut);
  var shortestSide = (height < width ? height : width)
  model = new Model();
}

function draw() {
  background(30);
  model.populate()
  model.draw();
  model.cleanUp();
}

function touchStarted() {
  getAudioContext().resume();
  if (touches.length == 0) {
    var mX = constrain(mouseX, 0, width)
    var mY = constrain(mouseY, 0, height)
    model.addBall(mX, mY)
  } else {
    // iterate through touches
    for (var t = 0; t < touches.length; t++){
      var mX = constrain(touches[t].x, 0, width)
      var mY = constrain(touches[t].y, 0, height)
      model.addBall(mX, mY)
    }
  }
}

var Model = function() {
  this.balls = []
  this.minPopulation = 5
  this.maxPopulation = 10
  this.lastBallAddedTime = 0
  this.ballAddInterval = 1000
  this.frame = 0
  this.buildScale()
}

Model.prototype.buildScale = function() {
  this.scale = []
  var notes = ['A', 'Bb', 'C', 'D', 'E', 'F', 'G']
  var notesIndex = 6
  var octave = 2
  for (var index = 0; index <= 29; index++){
    this.scale.push(notes[notesIndex] + octave.toString())
    notesIndex++
    if (notesIndex == notes.length) {
      notesIndex = 0
      octave++
    }
  }
}

Model.prototype.addBall = function(x, y, dx, dy) {
  this.balls.push(new Ball(x, y, this.balls));
  this.lastBallAddedTime = Date.now();
}

Model.prototype.populate = function() {
  if (Date.now() > this.lastBallAddedTime + this.ballAddInterval &&
      this.balls.length < this.minPopulation
    ) {
    this.addBall()
  }
}

Model.prototype.draw = function(){
  this.gradient()
  for(var ball of this.balls){
    ball.draw()
  }
}

Model.prototype.gradient = function(){
  var gradientInterval = 10000
  var gradientTime = Date.now() % gradientInterval
  if(gradientTime > gradientInterval / 2){
    gradientTime -= gradientInterval / 2
    gradientTime = (gradientInterval / 2) - gradientTime
  }
  var gChange = 30 * gradientTime / (gradientInterval / 2)
  var c1 = color(240 + gChange, 100, 100)
  var c2 = color(300 + gChange, 100, 100)
  for (var x = 0; x < width; x++){
    var colour = lerpColor(c1, c2, x / width)
    stroke(colour)
    line(x, 0, x, height)
  }
}

Model.prototype.cleanUp = function(){
  for(var i = this.balls.length - 1; i >= 0 ; i--){
    var ball = this.balls[i]
    if (ball.level <= 0) {
      this.balls.splice(i, 1);
    }
  }
}

var Ball = function (x, y) {
  var xPos = x || random(width)
  var yPos = y || random(height)
  this.nextPlayTime = Date.now() + 5000
  this.level = 15
  this.setHue()
  this.radius = 1; 
  this.setPosition(x, y);
  this.synth = new p5.MonoSynth();
  this.synth.connect(reverb)
  this.playing = false
  this.play()
}

Ball.prototype.setHue = function(){
  var colorInterval = 10000
  var colorTime = Date.now() % 10000
  if (colorTime < colorInterval / 2) {
    this.hue = lerp(10, 180, colorTime / (colorInterval / 2))
  } else {
    colorTime -= colorInterval / 2
    this.hue = lerp(180, 10, colorTime / (colorInterval / 2))
  }
}

Ball.prototype.setPosition = function(x, y) {
  var r = this.radius
  if (x != null && y != null) {
    this.position =  createVector(constrain(x, r + 1, width - r - 1), constrain(y, r + 1, height - r - 1))
    return
  }
  var xPos, yPos
  var collision = false
  do {
    xPos = constrain(random(width), r + 1, width - r - 1)
    yPos = constrain(random(height), r + 1, height - r - 1)
  }
  while (collision === true);

  this.position = createVector(xPos, yPos)
}

Ball.prototype.draw = function() {
  var time = Date.now()
  if(time > this.nextPlayTime){
    this.play()
  }
  if (this.playing === true){
    var elapsedTime = time - this.playStarted
    var opacity = (3000 - elapsedTime) * this.level / 3000
    fill(this.hue, 100, 100, opacity)
    noStroke()
    ellipse(this.position.x, this.position.y, this.radius, this.radius);
    this.radius += 2;
    if (elapsedTime >= 3000 ) {
      this.level -= 1;
      this.radius = 0
      this.playing = false
    }
  }
}

Ball.prototype.play = function() {
  if(this.playing == false){
    this.nextPlayTime = Date.now() + 5000
    this.playStarted = Date.now()
    this.synth.oscillator.pan(this.position.x / (width / 2) - 1)
    var scaleIndex = Math.floor((height - this.position.y) * model.scale.length / height)
    this.synth.play(model.scale[scaleIndex], 0.1 * this.level / 15, 0.1, 0.1);
    this.playing = true
  }
}