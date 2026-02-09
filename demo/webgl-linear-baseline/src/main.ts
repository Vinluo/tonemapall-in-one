import { createLinearDemo } from './embed';

const root = document.getElementById('app');
if (!root) {
  throw new Error('Missing #app root container.');
}

createLinearDemo(root, {
  initialInput: 'ramp',
  initialView: 'srgbPreview',
  initialExposure: 0,
  showControls: true
});
