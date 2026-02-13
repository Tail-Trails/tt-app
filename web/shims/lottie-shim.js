// Minimal shim for lottie-react-native on web builds.
// Exports a React component that renders nothing so native-only Lottie usage
// doesn't break web bundling.
const React = require('react');

function LottieView(_props) {
  return null;
}

module.exports = LottieView;
module.exports.default = LottieView;
