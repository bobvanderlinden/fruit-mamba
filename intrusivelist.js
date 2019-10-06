var BREAK = {};
var DELETE = {};
function IntrusiveList(name) {
  this.root = null;
  this._nextProp = "_next" + name;
}
var p = IntrusiveList.prototype;
p.push = function(o) {
  if (this._nextProp in o) {
    throw typeof o + " " + o.constructor + " already in list " + this._nextProp;
  }
  o[this._nextProp] = this.root;
  this.root = o;
};
p.pop = function() {
  if (!(this._nextProp in o)) {
    throw typeof o + " " + o.constructor + " not in list " + this._nextProp;
  }
  var o = this.root;
  this.root = o[this._nextProp];
  return o;
};
p.each = function(f) {
  var o = this.root;
  if (!o) {
    return;
  }
  var prev = null;
  var next;
  while (o) {
    next = o[this._nextProp];
    var r = f(o, BREAK, DELETE);
    if (r === DELETE) {
      if (prev) {
        prev[this._nextProp] = next;
      } else {
        this.root = next;
      }
      delete o[this._nextProp];
      o = next;
      continue;
    } else if (r === BREAK) {
      break;
    }
    prev = o;
    o = next;
  }
};
p.contains = function(findElement) {
  var result = false;
  this.each((element, BREAK) => {
    if (element === findElement) {
      result = true;
      return BREAK;
    }
  });
  return result;
};
export default IntrusiveList;
