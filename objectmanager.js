import IntrusiveList from "./intrusivelist.js";
import DIntrusiveList from "./dintrusivelist.js";
function ObjectManager() {
  var me = this;
  this.lists = {};
  this.objects = new DIntrusiveList("object");
  this.named = {};
  this.pendingAdd = new IntrusiveList("pendingAdd");
  this.pendingRemove = new IntrusiveList("pendingRemove");
}
var p = ObjectManager.prototype;
p.add = function(o) {
  this.pendingAdd.push(o);
};
p.createIndexList = function(property) {
  var list = new DIntrusiveList(property);
  list.property = property;
  return list;
};
p.remove = function(o) {
  if (!this.pendingRemove.contains(o)) {
    this.pendingRemove.push(o);
  }
};
p.clear = function(o) {
  var me = this;
  me.handlePending();
  me.objects.each(o => {
    console.log(o);
    me.remove(o);
  });
  me.handlePending();
};
p.handlePending = function() {
  var me = this;
  if (me.pendingAdd.root) {
    // console.log('handlePending',me.pendingAdd.root);
  }
  me.pendingAdd.each((o, _, DELETE) => {
    console.assert(!o._objectmanager);
    o._objectmanager = me;
    me.objects.push(o);
    for (var n in me.lists) {
      if (o[me.lists[n].property] || o.constructor[me.lists[n].property]) {
        me.lists[n].push(o);
      }
    }
    if (o.name) {
      if (me.named[o.name]) {
        throw "Another object with the same name was already added.";
      }
      me.named[o.name] = o;
    }
    return DELETE;
  });
  me.pendingRemove.each((o, _, DELETE) => {
    delete o.__pendingRemove;
    console.assert(o._objectmanager === me);
    o._objectmanager = null;
    me.objects.remove(o);
    for (var n in me.lists) {
      if (o[me.lists[n].property] || o.constructor[me.lists[n].property]) {
        me.lists[n].remove(o);
      }
    }
    if (o.name) {
      delete me.named[o.name];
    }
    return DELETE;
  });
};
export default ObjectManager;
