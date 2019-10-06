var DELETE = {};
var BREAK = {};

function DIntrusiveList(name) {
  this.root = null;
  this.tail = null;
  this._nextProp = "_next" + name;
  this._prevProp = "_prev" + name;
  this.listeners = {
    added: [],
    removed: []
  };
}
var p = DIntrusiveList.prototype;
p.push = function(o) {
  if (this._nextProp in o) {
    throw typeof o + " " + o.constructor + " already in list " + this._nextProp;
  }
  var next = this.root;
  if (next) {
    next[this._prevProp] = o;
  }
  o[this._nextProp] = next;
  o[this._prevProp] = null;
  this.root = o;
  if (!this.tail) {
    this.tail = o;
  }
  this.each(function(o) {
    if (o[this._nextProp] === o) {
      throw "koek";
    }
  });
  this.listeners["added"].forEach(f => {
    f(o);
  });
};
p.pop = function() {
  this.remove(this.root);
};
p.remove = function(o) {
  if (!(this._nextProp in o)) {
    throw typeof o + " " + o.constructor + " not in list " + this._nextProp;
  }
  var prev = o[this._prevProp];
  var next = o[this._nextProp];
  if (this.root === o) {
    this.root = next;
  } else {
    prev[this._nextProp] = next;
  }
  if (next) {
    this.tail = prev;
    next[this._prevProp] = prev;
  }
  delete o[this._nextProp];
  delete o[this._prevProp];
  this.listeners["removed"].forEach(f => {
    f(o);
  });
};
p.each = function(f) {
  var o = this.root;
  if (!o) {
    return;
  }
  var next;
  while (o) {
    next = o[this._nextProp];
    var r = f.call(this, o, BREAK, DELETE);
    if (r === DELETE) {
      this.remove(o);
      o = next;
      continue;
    } else if (r === BREAK) {
      break;
    } else {
      o = next;
    }
  }
};
p.eachReverse = function(f) {
  var o = this.tail;
  if (!o) {
    return;
  }
  var prev;
  while (o) {
    prev = o[this._prevProp];
    var r = f(o, BREAK, DELETE);
    if (r === DELETE) {
      this.remove(o);
      o = prev;
      continue;
    } else if (r === BREAK) {
      break;
    } else {
      o = prev;
    }
  }
};
p.insertBefore = function(after, o) {
  var prev = after && after[prevProp];
  var next = after;
  o[this._nextProp] = next;
  o[this._prevProp] = prev;
  if (next) {
    next[this._prevProp] = o;
  }
  if (prev) {
    prev[this._nextProp] = o;
  } else {
    me.root = o;
  }
  this.listeners["added"].forEach(f => {
    f(o);
  });
};
export default DIntrusiveList;
