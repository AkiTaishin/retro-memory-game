import { createScreenController } from './ui/events.js';

const root = document.getElementById('app');
const controller = createScreenController(root);

controller.showStart();

window.addEventListener('beforeunload', () => {
  controller.cleanup();
});
