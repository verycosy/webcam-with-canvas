importScripts("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs");
importScripts("https://cdn.jsdelivr.net/npm/@tensorflow-models/posenet");

let videoCanvas, videoCtx, graphicCanvas, graphicCtx;
let model, width, height;
let glasses;

const GLASSES_WIDTH = 150;
const GLASSES_HEIGHT = 75;

async function predict() {
  try {
    const { keypoints } = await model.estimateSinglePose(videoCanvas, {
      flipHorizontal: false,
    });

    const leftEye = keypoints[1];
    const rightEye = keypoints[2];

    const mid = [
      (rightEye.position.x + leftEye.position.x) / 2,
      (rightEye.position.y + leftEye.position.y) / 2,
    ];

    const angle = Math.atan2(
      leftEye.position.y - rightEye.position.y,
      leftEye.position.x - rightEye.position.x
    );

    return [mid, angle];
  } catch (err) {
    console.error(err);
  }
}

async function render(imageBitmap) {
  try {
    tf.engine().startScope();
    const [mid, angle] = await predict();
    tf.engine().endScope();

    videoCtx.drawImage(imageBitmap, 0, 0, width, height);

    graphicCtx.clearRect(0, 0, width, height);
    graphicCtx.save();
    graphicCtx.translate(mid[0], mid[1]);
    graphicCtx.rotate(angle);
    graphicCtx.drawImage(
      glasses,
      -GLASSES_WIDTH / 2,
      -GLASSES_HEIGHT / 2,
      GLASSES_WIDTH,
      GLASSES_HEIGHT
    );

    graphicCtx.restore();
  } catch (err) {
    console.error(err);
  }
}

addEventListener("message", async (evt) => {
  switch (evt.data.cmd) {
    case "READY": {
      try {
        videoCanvas = evt.data.videoCanvas;
        videoCtx = videoCanvas.getContext("2d");

        graphicCanvas = evt.data.graphicCanvas;
        graphicCtx = graphicCanvas.getContext("2d");

        width = evt.data.width;
        height = evt.data.height;

        glasses = evt.data.glasses;

        model = await posenet.load({
          architecture: "MobileNetV1",
          outputStride: 16,
          inputResolution: { width, height },
          multiplier: 0.75,
        });

        console.log("model loaded");
      } catch (err) {
        console.error(err);
      }

      break;
    }

    case "RENDER": {
      if (model) render(evt.data.imageBitmap);
      break;
    }
  }
});
