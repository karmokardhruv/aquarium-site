import * as PIXI from 'https://cdn.jsdelivr.net/npm/pixi.js@7.3.2/+esm';
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';

// --- CONFIGURATION ---
const APP_STATE = {
  theme: 'night', // 'day' or 'night'
};

const FISH_COUNT = 14;

// --- FISH TEXTURE PATHS ---
const DAY_FISH_PATHS = [
  'fish/fish_day.png',
  'fish/fish_day1.png',
  'fish/fish_day2.png',
  'fish/fish_day3.png',
  'fish/fish_day4.png',
  'fish/fish_day5.png',
  'fish/fish_day6.png',
  'fish/fish_day7.png',
];

const NIGHT_FISH_PATHS = [
  'fish/fish_night.png',
  'fish/fish_night1.png',
  'fish/fish_night2.png',
  'fish/fish_night3.png',
  'fish/fish_night4.png',
  'fish/fish_night5.png',
  'fish/fish_night6.png',
  'fish/fish_night7.png',
];

// --- FOOD TEXTURE PATHS ---
const FOOD_PATHS = [
  'food/food.png',
  'food/food1.png',
  'food/food2.png',
];

// Preload all textures
const dayTextures = DAY_FISH_PATHS.map(p => PIXI.Texture.from(p));
const nightTextures = NIGHT_FISH_PATHS.map(p => PIXI.Texture.from(p));
const foodTextures = FOOD_PATHS.map(p => PIXI.Texture.from(p));

// --- MATTER.JS SETUP ---
const engine = Matter.Engine.create();
engine.world.gravity.y = 0.3; // 3x faster food fall
const world = engine.world;

// --- PIXI.JS SETUP ---
const container = document.getElementById('aquarium-container');
const app = new PIXI.Application({
  resizeTo: window,
  backgroundAlpha: 0, // Transparent for video background
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
});
container.appendChild(app.view);

// Layers
const fishLayer = new PIXI.Container();
const foodLayer = new PIXI.Container();

app.stage.addChild(foodLayer);
app.stage.addChild(fishLayer); // fish on top of food

// --- BOUNDARIES & ENVIRONMENT ---
let floor, leftWall, rightWall;

function createBoundaries() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const thickness = 100;

  if (floor) {
    Matter.World.remove(world, [floor, leftWall, rightWall]);
  }

  // Floor is exactly 50px from bottom
  const floorY = h - 50;
  floor = Matter.Bodies.rectangle(w / 2, floorY + thickness / 2, w, thickness, { isStatic: true });
  leftWall = Matter.Bodies.rectangle(0 - thickness / 2, h / 2, thickness, h, { isStatic: true });
  rightWall = Matter.Bodies.rectangle(w + thickness / 2, h / 2, thickness, h, { isStatic: true });

  Matter.World.add(world, [floor, leftWall, rightWall]);
}
createBoundaries();
window.addEventListener('resize', createBoundaries);

// --- FISH ENTITY ---
const fishes = [];

class Fish {
  constructor(index) {
    // Each fish gets a unique texture index (wrapping around if more fish than textures)
    this.dayTextureIndex = index % dayTextures.length;
    this.nightTextureIndex = index % nightTextures.length;

    this.baseScale = (0.2 + Math.random() * 0.14) * 1.4; //bigger fish

    // Pixi Sprite
    const tex = APP_STATE.theme === 'day' ? dayTextures[this.dayTextureIndex] : nightTextures[this.nightTextureIndex];
    this.sprite = new PIXI.Sprite(tex);
    this.sprite.anchor.set(0.5);
    this.sprite.scale.set(this.baseScale);
    fishLayer.addChild(this.sprite);

    // Matter Body
    const bodyWidth = 120 * this.baseScale;
    const bodyHeight = 60 * this.baseScale;

    this.body = Matter.Bodies.rectangle(
      Math.random() * window.innerWidth,
      Math.random() * (window.innerHeight - 250) + 100,
      bodyWidth,
      bodyHeight,
      { isStatic: true, isSensor: true, label: 'fish', plugin: { fishInstance: this } }
    );
    Matter.World.add(world, this.body);

    // --- Unique speed per fish ---
    this.speed = 0.5 + Math.random() * 2.0; // range: 0.5 to 2.5
    this.vx = (Math.random() > 0.5 ? 1 : -1) * this.speed;
    this.vy = (Math.random() - 0.5) * 0.6;
    this.currentScaleX = this.vx > 0 ? this.baseScale : -this.baseScale;
    this.sprite.scale.x = this.currentScaleX;

    // --- State Machine ---
    this.state = 'move'; // 'move' or 'feed'
    this.targetFood = null;

    // Random direction change timer (each fish on its own schedule)
    this.directionTimer = Math.random() * 300 + 80;
    this.directionTick = 0;

    fishes.push(this);
  }

  updateTexture() {
    const tex = APP_STATE.theme === 'day' ? dayTextures[this.dayTextureIndex] : nightTextures[this.nightTextureIndex];
    this.sprite.texture = tex;
  }

  update() {
    this.directionTick++;

    // --- FEED STATE ---
    if (this.state === 'feed') {
      // Validate target still exists
      if (!this.targetFood || !foods.includes(this.targetFood)) {
        this.returnToMove();
      } else {
        const dx = this.targetFood.body.position.x - this.body.position.x;
        const dy = this.targetFood.body.position.y - this.body.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 15) {
          // Close enough, eat it
          this.targetFood.destroy();
          this.returnToMove();
        } else {
          // Move toward food at a moderate chase speed (not instant)
          const chaseSpeed = this.speed * 1.5;
          this.vx = (dx / dist) * chaseSpeed;
          this.vy = (dy / dist) * chaseSpeed;
        }
      }
    }

    // --- MOVE STATE: discover nearby floor food ---
    if (this.state === 'move' && foods.length > 0) {
      const discoveryRadius = 150;
      for (const f of foods) {
        const dx = f.body.position.x - this.body.position.x;
        const dy = f.body.position.y - this.body.position.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < discoveryRadius) {
          this.state = 'feed';
          this.targetFood = f;
          break;
        }
      }
    }

    // --- MOVE STATE ---
    if (this.state === 'move') {
      // Random direction changes on each fish's own timer
      if (this.directionTick >= this.directionTimer) {
        this.directionTick = 0;
        this.directionTimer = Math.random() * 300 + 80;

        // Randomly flip horizontal direction or keep it, randomize vertical
        if (Math.random() < 0.4) {
          this.vx = -this.vx; // flip direction
        }
        this.vy = (Math.random() - 0.5) * 1.2;
      }

      // Gentle vertical drift nudge to keep them in the swim zone
      if (this.body.position.y > window.innerHeight - 120) {
        this.vy -= 0.08;
      } else if (this.body.position.y < 80) {
        this.vy += 0.08;
      }

      // Cap vertical speed in move state
      this.vy = Math.max(-1.2, Math.min(1.2, this.vy));
    }

    // --- APPLY MOVEMENT ---
    Matter.Body.setPosition(this.body, {
      x: this.body.position.x + this.vx,
      y: this.body.position.y + this.vy
    });

    // Horizontal wrap
    const margin = 120;
    if (this.body.position.x > window.innerWidth + margin) {
      Matter.Body.setPosition(this.body, { x: -margin, y: this.body.position.y });
    } else if (this.body.position.x < -margin) {
      Matter.Body.setPosition(this.body, { x: window.innerWidth + margin, y: this.body.position.y });
    }

    // Sync sprite position
    this.sprite.x = this.body.position.x;
    this.sprite.y = this.body.position.y;

    // Smooth paper-flip animation
    // Fish always faces the direction it is moving (positive vx = face right)
    const targetScaleX = this.vx > 0 ? this.baseScale : -this.baseScale;
    this.currentScaleX += (targetScaleX - this.currentScaleX) * 0.08;
    this.sprite.scale.x = this.currentScaleX;

    // Prevent backward movement: ensure vx sign matches the facing direction
    // If the flip hasn't completed yet (sprite still facing old direction), don't move
    if (Math.sign(this.currentScaleX) !== Math.sign(this.vx) && this.state === 'move') {
      // Stall horizontal movement while flipping
      Matter.Body.setPosition(this.body, {
        x: this.body.position.x - this.vx * 0.7, // undo most of the horizontal move
        y: this.body.position.y
      });
    }
  }

  returnToMove() {
    this.state = 'move';
    this.targetFood = null;
    this.vx = (Math.random() > 0.5 ? 1 : -1) * this.speed;
    this.vy = (Math.random() - 0.5) * 0.6;
    this.directionTick = 0;
    this.directionTimer = Math.random() * 200 + 60;
  }
}

// Spawn initial fishes, each with a unique index for texture variety
for (let i = 0; i < FISH_COUNT; i++) {
  new Fish(i);
}

// --- FOOD ENTITY ---
const foods = [];

class Food {
  constructor(x, y) {
    const foodSize = 24; // visual size in pixels (20% bigger than before)

    // Pick a random food sprite
    const tex = foodTextures[Math.floor(Math.random() * foodTextures.length)];
    this.sprite = new PIXI.Sprite(tex);
    this.sprite.anchor.set(0.5);
    // Scale the sprite so its longest side is ~foodSize pixels
    const maxDim = Math.max(tex.width, tex.height) || 200;
    const scale = foodSize / maxDim;
    this.sprite.scale.set(scale);
    foodLayer.addChild(this.sprite);
    this.settled = false; // track if food has landed on the floor

    this.body = Matter.Bodies.circle(x, y, foodSize / 2, {
      restitution: 0.05,
      friction: 0.8,
      frictionAir: 0.04, // Reduced so food sinks 3x faster
      label: 'food',
      plugin: { foodInstance: this }
    });
    Matter.World.add(world, this.body);
    foods.push(this);
  }

  update() {
    this.sprite.x = this.body.position.x;
    this.sprite.y = this.body.position.y;
    this.sprite.rotation = this.body.angle; // rotate with physics
  }

  destroy() {
    Matter.World.remove(world, this.body);
    foodLayer.removeChild(this.sprite);
    const idx = foods.indexOf(this);
    if (idx > -1) {
      foods.splice(idx, 1);
    }
  }
}

// --- COLLISION LOGIC (EATING) ---
Matter.Events.on(engine, 'collisionStart', (event) => {
  event.pairs.forEach((pair) => {
    const { bodyA, bodyB } = pair;

    let fishBody = null, foodBody = null;

    if (bodyA.label === 'fish' && bodyB.label === 'food') {
      fishBody = bodyA; foodBody = bodyB;
    } else if (bodyB.label === 'fish' && bodyA.label === 'food') {
      fishBody = bodyB; foodBody = bodyA;
    }

    if (fishBody && foodBody && foodBody.plugin && foodBody.plugin.foodInstance) {
      const fish = fishBody.plugin.fishInstance;
      const food = foodBody.plugin.foodInstance;

      // Only destroy if it still exists in the array
      if (foods.includes(food)) {
        food.destroy();
      }

      // Return fish to move state
      fish.returnToMove();
    }
  });
});

// --- GAME LOOP ---
app.ticker.add((delta) => {
  Matter.Engine.update(engine, 1000 / 60);

  fishes.forEach(fish => fish.update());

  // Iterate safely (copy array since destroy modifies the original)
  const currentFoods = [...foods];
  currentFoods.forEach((food) => {
    food.update();
    // Mark as settled if on the floor (but don't destroy — let fish discover it)
    if (food.body.position.y > window.innerHeight - 60) {
      food.settled = true;
      // Stop it from falling further
      Matter.Body.setStatic(food.body, true);
    }
  });
});

// --- SYNC WITH SITE-WIDE THEME FROM main.js ---
// Read stored theme so aquarium starts with the correct textures
APP_STATE.theme = localStorage.getItem('site-theme') || 'night';
fishes.forEach(f => f.updateTexture());

// Register callback so main.js can notify us when theme changes
window._onThemeChange = function (newTheme) {
  APP_STATE.theme = newTheme;
  fishes.forEach(f => f.updateTexture());
};

// --- FEED FISH ---
window.feedFish = function () {
  const count = 10;
  for (let i = 0; i < count; i++) {
    const x = window.innerWidth * 0.2 + Math.random() * (window.innerWidth * 0.6);
    new Food(x, 80 + Math.random() * 40);
  }

  setTimeout(() => {
    fishes.forEach(fish => {
      if (foods.length === 0) return;
      let nearest = null, minDist = Infinity;
      foods.forEach(f => {
        const dx = f.body.position.x - fish.body.position.x;
        const dy = f.body.position.y - fish.body.position.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < minDist) { minDist = d; nearest = f; }
      });
      fish.state = 'feed';
      fish.targetFood = nearest;
    });
  }, 300);
};
