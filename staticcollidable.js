import Vector from "./vector.js";
import LineSegment from "./linesegment.js";
function pointsToSegments(points) {
  // Create segments from points.
  var lineSegments = [];
  var prevPoint = points[points.length - 1];
  points.forEach(point => {
    lineSegments.push(
      new LineSegment(prevPoint.x, prevPoint.y, point.x, point.y)
    );
    prevPoint = point;
  });

  return lineSegments;
}

function StaticCollidable(points, inverted) {
  this.inverted = inverted;
  this.collisionlines = pointsToSegments(points);
  this.color = "white";
  function max(a, f) {
    var r = null;
    a.forEach(e => {
      if (!r || f(e, a)) {
        r = e;
      }
    });
    return r;
  }
  this.bounds = {
    left: max(points, (a, b) => {
      return a.x < b.x;
    }).x,
    right: max(points, (a, b) => {
      return a.x > b.x;
    }).x,
    top: max(points, (a, b) => {
      return a.y < b.y;
    }).y,
    bottom: max(points, (a, b) => {
      return a.y > b.y;
    }).y
  };
  this.position = new Vector(
    (this.bounds.left + this.bounds.right) / 2,
    (this.bounds.top + this.bounds.bottom) / 2
  );
}
StaticCollidable.prototype.draw = function(g) {
  g.context.beginPath();
  g.context.moveTo(
    this.collisionlines[0].start.x,
    this.collisionlines[0].start.y
  );
  this.collisionlines.forEach(line => {
    g.context.lineTo(line.end.x, line.end.y);
  });
  g.context.closePath();

  g.fillStyle(this.color);
  g.context.fill();
};
StaticCollidable.prototype["collidable"] = true;
StaticCollidable.prototype["drawable"] = true;
export default StaticCollidable;
