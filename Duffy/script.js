document.addEventListener('contextmenu', event => event.preventDefault());
var GAME_LEVELS = [
  `                                                    
###############################################################################################################################################
###############################################################################################################################################
###############################################################################################################################################
###############################################################################################################################################
##########################......########.....########.....#####################################################################################
#########################........######.......######.......####################################################################################
########################..........####.........####.........###################################################################################
########################..........####.........####.........###################################################################################
########################....................................###################################################################################
............................................................###################################################################################
............................................................###################################################################################
............................................................###################################################################################
............................................................###################################################################################
............................................................###################################################################################
.............................................................##################################################################################
..............##########.......................................................................................................................
..............##########.......................................................................................................................
.w...w....##############.......................................................................................................................
.q.@.q....##############.......................................................................................................................
########################.......................................................................................................................
########################.......................................................................................................................
########################........................................................=..#......................................................o....
########################...........................................................#...........................................................
###############################################################################################################################################
`,  
    `                                                    
......................................................................
......................................................................
......................................................................
......................................................................
......................................................................
......................................................................
......................................................................
......................##..............................................
......................................................................
...............##.....................................................
.............................##.......................................
..............................#.......................................
...................##.........#.......................................
..............................#.......................................
........................##....#..........#####........................
..............................#.....................................o.
.....@........................#.......................................
###############################...####################################
..............................#...#...................................
..............................#+++#...................................
..............................#+++#...................................
..............................#####...................................
......................................................................
......................................................................
`,
    `
......................................................................
......................................................................
......................................................................
......................................................................
......................................................................
......................................................................
.............................##.......................................
.............................##.......................................
...........................##..##.....................................
......................................................................
......................................................................
......................................................................
......................................................................
......................................................................
.........................................#####........................
....................................................................o.
.....@................................................................
######################################################################
......................................................................
......................................................................
......................................................................
......................................................................
......................................................................
......................................................................
`,


];

class Level {
  constructor(plan) {
    let rows = plan
      .trim()
      .split("\n")
      .map(l => [...l]);
    this.height = rows.length;
    this.width = rows[0].length;
    this.startActors = [];

    this.rows = rows.map((row, y) => {
      return row.map((ch, x) => {
        let type = levelChars[ch];
        if (typeof type == "string") return type;
        this.startActors.push(type.create(new Vec(x, y), ch));
        return "empty";
      });
    });
  }
}

class State {
  constructor(level, actors, status) {
    this.level = level;
    this.actors = actors;
    this.status = status;
  }

  static start(level) {
    return new State(level, level.startActors, "playing");
  }

  get player() {
    return this.actors.find(a => a.type == "player");
  }
}

class Vec {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  plus(other) {
    return new Vec(this.x + other.x, this.y + other.y);
  }
  tijden(factor) {
    return new Vec(this.x * factor, this.y * factor);
  }
}

class Player {
  constructor(pos, speed) {
    this.pos = pos;
    this.speed = speed;
  }

  get type() {
    return "player";
  }

  static create(pos) {
    return new Player(pos.plus(new Vec(0, -0.5)), new Vec(0, 0));
  }
}

Player.prototype.size = new Vec(1, 1);

class Lava {
  constructor(pos, speed, reset) {
    this.pos = pos;
    this.speed = speed;
    this.reset = reset;
  }

  get type() {
    return "lava";
  }

  static create(pos, ch) {
    if (ch == "=") {
      return new Lava(pos, new Vec(8, 0));
    } else if (ch == "|") {
      return new Lava(pos, new Vec(0, 20));
    } else if (ch == "v") {
      return new Lava(pos, new Vec(0, 3), pos);
    }
  }
}

Lava.prototype.size = new Vec(1.5, 2);

class Lightbulb {
  constructor(pos, basePos, wobble) {
    this.pos = pos;
    this.basePos = basePos;
    this.wobble = wobble;
  }

  get type() {
    return "lightbulb";
  }

  static create(pos) {
    let basePos = pos.plus(new Vec(0.2, 0.1));
    return new Lightbulb(basePos, basePos, Math.random() * Math.PI * 2);
  }
}

Lightbulb.prototype.size = new Vec(0.6, 0.6);

// levelchars is de term die gebruikt word om objecten aan te geven zoals een wall.

const levelChars = {
  ".": "empty",
  "#": "wall",
  "%": "ground",
  "q": "detail1",
  "w": "detail2",
  "c": "chain",
  "+": "lava",
  "@": Player,
  o: Lightbulb,
  "=": Lava,
  "|": Lava,
  "v": Lava
};

function elt(name, attrs, ...children) {
  let dom = document.createElement(name);
  for (let attr of Object.keys(attrs)) {
    dom.setAttribute(attr, attrs[attr]);
  }
  for (let child of children) {
    dom.appendChild(child);
  }
  return dom;
}

class DOMDisplay {
  constructor(parent, level) {
    this.dom = elt("div", { class: "game" }, drawGrid(level));
    this.actorLayer = null;
    parent.appendChild(this.dom);
  }

  clear() {
    this.dom.remove();
  }
}

const scale = 20;

function drawGrid(level) {
  return elt(
    "table",
    {
      class: "background",
      style: `width: ${level.width * scale}px`
    },
    ...level.rows.map(row =>
      elt(
        "tr",
        { style: `height: ${scale}px` },
        ...row.map(type => elt("td", { class: type }))
      )
    )
  );
}

function drawActors(actors) {
  return elt(
    "div",
    {},
    ...actors.map(actor => {
      let rect = elt("div", { class: `actor ${actor.type}` });
      rect.style.width = `${actor.size.x * scale}px`;
      rect.style.height = `${actor.size.y * scale}px`;
      rect.style.left = `${actor.pos.x * scale}px`;
      rect.style.top = `${actor.pos.y * scale}px`;
      return rect;
    })
  );
}

DOMDisplay.prototype.syncState = function(state) {
  if (this.actorLayer) this.actorLayer.remove();
  this.actorLayer = drawActors(state.actors);
  this.dom.appendChild(this.actorLayer);
  //  this.dom.className = `game ${state.status}`;
  this.scrollPlayerIntoView(state);
};

DOMDisplay.prototype.scrollPlayerIntoView = function(state) {
    let width = this.dom.clientWidth;
    let margin = width / 3;
  
    // The viewport
    let left = this.dom.scrollLeft,
      right = left + width;
  
    let player = state.player;
    let center = player.pos.plus(player.size.tijden(0.5)).tijden(scale);
  
    if (center.x < left + margin) {
      this.dom.scrollLeft = center.x - margin;
    } else if (center.x > right - margin) {
      this.dom.scrollLeft = center.x + margin - width;
    }
  };

Level.prototype.raakt = function(pos, size, type) {
  var xStart = Math.floor(pos.x);
  var xEnd = Math.ceil(pos.x + size.x);
  var yStart = Math.floor(pos.y);
  var yEnd = Math.ceil(pos.y + size.y);

  for (var y = yStart; y < yEnd; y++) {
    for (var x = xStart; x < xEnd; x++) {
      let isOutside = x < 0 || x >= this.width || y < 0 || y >= this.height;
      let here = isOutside ? "wall" : this.rows[y][x];
      if (here == type) return true;
    }
  }
  return false;
};

State.prototype.update = function(tijd, keys) {
  let actors = this.actors.map(actor => actor.update(tijd, this, keys));
  let nieweStatus = new State(this.level, actors, this.status);

  if (nieweStatus.status != "playing") return nieweStatus;

  let player = nieweStatus.player;
  if (this.level.raakt(player.pos, player.size, "lava")) {
    return new State(this.level, actors, "lost");
  }

  for (let actor of actors) {
    if (actor != player && overlap(actor, player)) {
        nieweStatus = actor.collide(nieweStatus);
    }
  }
  return nieweStatus;
};

function overlap(actor1, actor2) {
  return (
    actor1.pos.x + actor1.size.x > actor2.pos.x &&
    actor1.pos.x < actor2.pos.x + actor2.size.x &&
    actor1.pos.y + actor1.size.y > actor2.pos.y &&
    actor1.pos.y < actor2.pos.y + actor2.size.y
  );
}

Lava.prototype.collide = function(state) {
  return new State(state.level, state.actors, "lost");
};

Lightbulb.prototype.collide = function(state) {
  let filtered = state.actors.filter(a => a != this);
  let status = state.status;
  if (!filtered.some(a => a.type == "lightbulb")) status = "won";
  return new State(state.level, filtered, status);
};

Lava.prototype.update = function(tijd, state) {
  let newPos = this.pos.plus(this.speed.tijden(tijd));
  if (!state.level.raakt(newPos, this.size, "wall")) {
    return new Lava(newPos, this.speed, this.reset);
  } else if (this.reset) {
    return new Lava(this.reset, this.speed, this.reset);
  } else {
    return new Lava(this.pos, this.speed.tijden(-1));
  }
};

const wobbleSpeed = 6,
  wobbleDist = 0.15;

  Lightbulb.prototype.update = function(tijd) {
  let wobble = this.wobble + tijd * wobbleSpeed;
  let wobblePos = Math.sin(wobble) * wobbleDist;
  return new Lightbulb(
    this.basePos.plus(new Vec(0, wobblePos)),
    this.basePos,
    wobble
  );
};

const playerMovementSpeed  = 14;
const gravity = 35;
const jumpSpeed = 15;
const playerMovementSpeed2 = playerMovementSpeed + 10;

Player.prototype.update = function(tijd, state, keys) {
  let xSpeed = 0;
  if (keys.a) {
    xSpeed -= playerMovementSpeed;
  }
  if (keys.d) {
    xSpeed += playerMovementSpeed;
  }
  if (keys.c) {
    xSpeed += playerMovementSpeed2;
  }
  if (keys.z) {
    xSpeed -= playerMovementSpeed2;
  }

  let pos = this.pos;
  let movedX = pos.plus(new Vec(xSpeed * tijd, 0));
  if (!state.level.raakt(movedX, this.size, "wall")) {
    pos = movedX;
  }

  let ySpeed = this.speed.y + tijd * gravity;
  let movedY = pos.plus(new Vec(0, ySpeed * tijd));
  if (!state.level.raakt(movedY, this.size, "wall")) {
    pos = movedY;
  } else if (keys.w && ySpeed > 0) {
    ySpeed = -jumpSpeed;
  } else {
    ySpeed = 0;
  }

  return new Player(pos, new Vec(xSpeed, ySpeed));
  
};

function deKeys(keys) {
  let down = Object.create(null);
  function track(event) {
    if (keys.includes(event.key)) {
      down[event.key] = event.type == "keydown";
      event.preventDefault();
    }
  }
  window.addEventListener("keydown", track);
  window.addEventListener("keyup", track);
  return down;
}

const arrowKeys = deKeys(["a", "d", "w", "z", "c", "s"]);

function runAnimation(frameFunc) {
  let lastTime = null;
  function frame(tijd) {
    if (lastTime != null) {
      let tijdstap = Math.min(tijd - lastTime, 100) / 1000;
      if (frameFunc(tijdstap) === false) return;
    }
    lastTime = tijd;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function runLevel(level, Display) {
  let display = new Display(document.body, level);
  let state = State.start(level);
  let ending = 1;
  return new Promise(resolve => {
    runAnimation(tijd => {
      state = state.update(tijd, arrowKeys);
      display.syncState(state);
      if (state.status == "playing") {
        return true;
      } else if (ending > 0) {
        ending -= tijd;
        return true;
      } else {
        display.clear();
        resolve(state.status);
        return false;
      }
    });
  });
}

async function runGame(plans, Display) {
  for (let level = 0; level < plans.length; ) {
    let status = await runLevel(new Level(plans[level]), Display);
    if (status == "won") level++;
  }
  console.log("You've won!");
}
