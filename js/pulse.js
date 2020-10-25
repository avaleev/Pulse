'use strict'

const PULSE_DEFAULT = Object.freeze({
  pulse: [1.0, -0.466, 0.733],
  author: [0.2, -0.333, 1.0, -0.333, 0.2, 0, 0, -0.2, 0.333, -1.0, 0.333, -0.2],
});

/**
 * Pulse Object Class - initiates a Pulse animated canvas image
 * @argument canvas - <canvas> DOM element to embed into
 * @argument config
 * {
 * 
 *   markup: number[] (default: PULSE_DEFAULT.pulse) - list of numbers in the range of -1.0 to 1.0 that defines positions of the graph spikes
 *   
 *   distribution: number (default: 2.5) - pixel distribution of the graph's points (the bigger the number the longer the graph will be)
 *   
 *   height: number (default: canvas.height) - pixel height of the graph
 * 
 *   repeat: number (default: 1) - number of markup repetitions through the graph
 * 
 *   trailed: boolean (default: false) - if the previous iteration should leave a trail ahead of the current iteration
 * 
 *   animated: boolean (default: false) - if the graph should have a pulsation animation
 * 
 *   speed: number (default: 50) - speed of the pulsation animation
 * 
 *   weight: number (default: 5) - pixel weight of the graph line
 * 
 *   color: string | HEX-string | RGB(A)-string | HLS(A)-string (default: 'rgba(0, 0, 0, 1)') - color of the graph line
 * 
 *   trailingColor: string | HEX-string | RGB(A)-string | HLS(A)-string (default: 'rgba(0, 0, 0, 0)') - color that the graph line gradients to
 * 
 *   interval: number (default: 4) - number of 0.0 points around the grapg and in between of markup repetitions if repeat > 1
 * 
 * }
 * @author Anton Valeev
 */
class Pulse {
  constructor(canvas, {
    markup = PULSE_DEFAULT.pulse,
    distribution = 2.5,
    height = undefined,
    repeat = 1,
    trailed = false,
    animated = false,
    speed = 50,
    weight = 5,
    color = 'rgba(0, 0, 0, 1)',
    trailingColor = 'rgba(0, 0, 0, 0)',
    interval = 4,
  }) {
    this.canvas = canvas;
    this.markup = markup;
    this.repeat = repeat;
    this.distribution = distribution;
    this.height = height;
    this.trailed = trailed;
    this.animated = animated;
    this.speed = speed;
    this.weigth = weight;
    this.color = color;
    this.trailingColor = trailingColor;
    this.interval = interval;

    this.onInit();
  }

  onInit() {
    this.markup = this.repeat > 1 ?
      Pulse.repeatAndSurround(this.markup, this.repeat, this.interval) :
      Pulse.surround(this.markup, this.interval);

    this.canvas.width = (this.markup.length - 1) * this.distribution;
    if (this.height !== undefined) this.canvas.height = this.height;

    if (this.animated) {
      this.animationStep = 0;
      this.firstIteration = true;

      this.startAnimation();
    } else {
      this.animationStep = this.markup.length - 1;
    }
    this.draw(); // draw first frame ahead of first interval emission
  }

  draw() {
    const ctx = this.canvas.getContext('2d');
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.animated) {
      const progress = (1 / this.markup.length) * this.animationStep;
      const gradient = ctx.createLinearGradient(0, 0, this.canvas.width, 0);
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
            gradient.addColorStop(progress, 'rgba(0, 0, 0, 1)');
  
      if (this.trailed && !this.firstIteration) {
        gradient.addColorStop(progress, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, `rgba(0, 0, 0, ${ 1 - progress })`);
      } else {
        gradient.addColorStop(progress, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }
  
      ctx.strokeStyle = gradient;
    } else {
      ctx.strokeStyle = this.color;
    }
    ctx.lineWidth = this.weigth;

    ctx.beginPath();
    let x, y;

    for (let i = 0; i < this.markup.length; ++i) {
      x = this.distribution * i;
      y = (this.canvas.height / 2) - ((this.canvas.height / 2) * this.markup[i]);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }

  setWidth(width) {
    this.distribution = width / (this.markup.length - 1);
    this.canvas.width = width;
  }

  setHeight(height) {
    this.canvas.height = height;
  }

  resize(width, height) {
    this.setWidth(width);
    this.setHeight(height);
  }

  pauseAnimation() {
    clearInterval(this.animation);
  }

  startAnimation() {
    const t = this;
    this.animation = setInterval(function() {
      t.animationStep = t.animationStep < t.markup.length - 1 ? ++t.animationStep : 0;
      t.draw();
      if (t.firstIteration && t.animationStep === t.markup.length - 1) t.firstIteration = false;
    }, this.speed);
  }

  static surround(graph, length) {
    let trailer, header;
    trailer = header = Array.from({ length: length }).map(function() { return 0; });
    return [].concat(trailer, graph, header);
  }
  
  static repeatAndSurround(graph, repeats, length) {
    const surroundBy = Math.floor(length / 2);
    const surrounded = Pulse.surround(graph, surroundBy);
    const repeated = new Array(repeats).fill(surrounded).flat();
    return Pulse.surround(repeated, surroundBy);
  }
}
