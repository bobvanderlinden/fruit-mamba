export default function(g) {
  g.level = null;
  g.changeLevel = function(level) {
    if (this.level) {
      this.objects.objects.each(c => {
        g.objects.remove(c);
      });
      if (this.level.disable) {
        this.level.disable();
      }
    }
    g.objects.handlePending();
    g.emit("levelunloaded");
    this.level = level;
    if (this.level) {
      this.level.objects.forEach(c => {
        g.objects.add(c);
      });
      if (this.level.enable) {
        this.level.enable();
      }
    }
    g.objects.handlePending();
    g.emit("levelchanged");
  };
  g.restartLevel = function() {
    g.changeLevel(g.level.clone());
  };
  g.hasNextLevel = function(level) {
    const _level = level || g.level;
    return _level && _level.nextLevel;
  };
  g.nextLevel = function(level) {
    var nextLevel = (level || g.level).nextLevel();
    g.changeLevel(nextLevel);
  };
}
