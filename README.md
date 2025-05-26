# Aion
A js RAF engine

# Usage
```javascript
import Aion from '@adoratorio/aion';

// Create the engine
const engine = new Aion({
  autostop: true // Set if the engine stop himself after last funciton removal
});
const fn = () => {
  // Awesome stuff executed each frame
};
// Add a function to the quee and take the id
const id = engine.add(fn);
// Add a function by manually setting the id
engine.add(fn, 'myId');
// Add a function and make it executed only every 2 frames, step is customizable
engine.add(fn, 'heavyId', 2);

// Time to start the engine
engine.start();

// Remove a function by id, if autostop is true the engine will auto-stop when the last function is removed
engine.remove(id);

// Or stop it manually
engine.stop();
// By passing true to force you can also cancel the last queed frame just to be sure
// it won't be executed, otherwise the already requested frames will be executed
engine.stop(true);

// Can check for an id using .has
engine.has('myId'); // true

// You can also check the running state by testing the .stopped property
if (!engine.stopped) {
  engine.stop();
}
```
