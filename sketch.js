'use strict';

var model, reverb;
var notes, radiusFactor, maxVelocity;

function setup() {
  createCanvas(window.innerWidth - 20, window.innerHeight - 20);
  frameRate(30);
  colorMode(HSB, 360, 170, 100, 15);
  ellipseMode(RADIUS);
  reverb = new p5.Reverb();
  reverb.set(1.7);
  reverb.connect(p5.soundOut);
  notes = shuffle(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'])
  var shortestSide = (height < width ? height : width)
  radiusFactor = shortestSide / 40
  maxVelocity = shortestSide / 80
  model = new Model();
}

function draw() {
  background(30);
  model.populate()
  model.draw();
}

function touchStarted() {
  getAudioContext().resume();
  var mX = constrain(mouseX, 0, width)
  var mY = constrain(mouseY, 0, height)
  model.addBall(mX, mY);
}

function randomNote() {
  return random(['C', 'D','F', 'G', 'A']) + random(["4","5","6"]);
}

var Model = function () {
  this.balls = [];
  this.minPopulation = 5;
  this.maxPopulation = 10;
  this.lastBallAddedTime = 0;
  this.ballAddInterval = 1000;
  this.frame = 0;
}

Model.prototype.addBall = function(x, y, dx, dy) {
  // if(this.balls.length < this.maxPopulation){
    this.balls.push(new Ball(x, y, this.balls));
    this.lastBallAddedTime = Date.now();
  // }
}

Model.prototype.populate = function() {
  if (Date.now() > this.lastBallAddedTime + this.ballAddInterval &&
      this.balls.length < this.minPopulation
    ) {
    this.addBall()
  }
}

Model.prototype.draw = function(){
  for(var ball of this.balls){
    ball.draw()
  }

  for(var i = this.balls.length - 1; i >= 0 ; i--){
    var ball = this.balls[i]
    if (ball.dead === true) {
      this.balls.splice(i, 1);
    }
  }
}

Model.prototype.move = function() {
  var dead = [];
  // calculate movements
  for (var b = 0; b < this.balls.length; b++){
    var ball = this.balls[b];
    ball.move();
    ball.play()
    if (ball.lifeSpan <= 0) {
      dead.push(b);
    }
  }
  // bring out your dead
  for(var i = dead.length - 1; i >= 0 ; i--){
    this.balls.splice(dead[i], 1);
    if (this.balls.length < this.minPopulation) {
      this.lastBallAddedTime = Date.now();
    }
  }
}

var Ball = function (x, y, balls) {
  var xPos = x || random(width)
  var yPos = y || random(height)
  this.birth = Date.now()
  this.level = 15
  this.playTime = Date.now() % 5000
  this.note = Math.floor(random(0, 11));
  this.octave = Math.floor(random(0, 3));
  this.radius = 1; 
  this.position = this.findPosition(x, y);
  this.velocity = createVector(random(0 - maxVelocity, maxVelocity), random(0 - maxVelocity, maxVelocity))
  this.nextVelocity = createVector(this.velocity.x, this.velocity.y);
  this.dead = false
  this.synth = new p5.MonoSynth();
  this.synth.connect(reverb)
  this.needsPlay = false;
}

Ball.prototype.findPosition = function(x, y) {
  var r = this.radius
  if (x != null && y != null) {
    return createVector(constrain(x, r + 1, width - r - 1), constrain(y, r + 1, height - r - 1))
  }
  var xPos, yPos
  var collision = false
  do {
    xPos = constrain(random(width), r + 1, width - r - 1)
    yPos = constrain(random(height), r + 1, height - r - 1)
  }
  while (collision === true);

  return createVector(xPos, yPos)
}

Ball.prototype.draw = function() {
  var loopTime = Date.now() % 5000
  var time = loopTime - this.playTime
  if(loopTime > this.playTime && loopTime < this.playTime + 5000){
    var hue = this.note * 360 / 12
    var opacity = (5000 - time) * 15 / 5000
    fill(hue, 100, 100, opacity)
    noStroke()
    ellipse(this.position.x, this.position.y, this.radius, this.radius);
    this.radius += 1;
  }
  else {
    this.level -= 1;
    this.radius = 0
  }
  if(this.playsRemaining == 0){
    this.dead = true;
  }
}

Ball.prototype.play = function() {
  if(this.needsPlay == true){
    this.synth.oscillator.pan(this.position.x / (width / 2) - 1)
    var note = notes[this.note]
    var octave = ['3', '4', '5', '6'][this.octave]
    this.synth.play(note + octave, 0.1, 0.1, 0.1);
    if(this.lifeSpan > 0 ){
      this.note += 1;
    }
    if(this.note == 12){
      this.note = 0;
    }
    this.needsPlay = false
  }
}