function ParticleEmitter(
  image,
  max,
  spawnrate,
  initializeParticle,
  updateParticle,
  drawParticle
) {
  var particles = (this.particles = []);
  for (i = 0; i < max; i++) {
    particles.push({ active: false });
  }
  this.image = image;
  this.spawnrate = spawnrate;
  this.spawntime = spawnrate;
  this.initializeParticle = initializeParticle || this.initializeParticle;
  this.updateParticle =
    updateParticle || this.updateParticle || ParticleEmitter.defaultUpdate;
  this.drawParticle =
    drawParticle || this.drawParticle || ParticleEmitter.defaultDraw;
}
var p = ParticleEmitter.prototype;
p["updatable"] = true;
p["drawable"] = true;
p.update = function(dt) {
  var particles = this.particles;
  var initializeParticle = this.initializeParticle;
  var updateParticle = this.updateParticle;

  if (this.spawnrate !== null) {
    this.spawntime -= dt;
    if (this.spawntime < 0) {
      this.spawntime += this.spawnrate;
      this.spawn(1);
    }
  }
  for (i = 0; i < particles.length; i++) {
    var p = particles[i];
    if (!p.active) {
      continue;
    }
    updateParticle.call(this, p, dt);
  }
};
p.spawn = function(count) {
  var particles = this.particles;
  var initializeParticle = this.initializeParticle;
  var spawnCount = 0;
  for (i = 0; i < particles.length && spawnCount < count; i++) {
    if (!particles[i].active) {
      particles[i].active = true;
      initializeParticle.call(this, particles[i]);
      spawnCount++;
    }
  }
};
p.draw = function(g) {
  var particles = this.particles;
  for (i = 0; i < particles.length; i++) {
    var p = particles[i];
    if (!p.active) {
      continue;
    }
    this.drawParticle(p, g);
  }
};

ParticleEmitter.defaultUpdate = function(p, dt) {
  p.time -= dt;
  if (p.time < 0) {
    p.active = false;
  }
  p.posx += p.velx * dt;
  p.posy += p.vely * dt;
  p.rot += p.rotrate * dt;
};

ParticleEmitter.defaultDraw = function(p, g) {
  g.context.globalAlpha = Math.min(1, p.time) * 0.5;
  // g.context.globalAlpha = 1;
  g.context.save();
  g.context.translate(p.posx, p.posy);
  g.context.rotate(p.rot);
  var s = p.scale; //(2-p.time)*0.3;
  g.context.scale(s, s);
  g.drawCenteredImage(this.image, 0, 0);
  g.context.restore();
  g.context.globalAlpha = 1;
};

export default ParticleEmitter;
