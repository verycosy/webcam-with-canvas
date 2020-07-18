const $video = document.getElementById("video");
const $canvas = document.getElementById("canvas");

const ctx = $canvas.getContext("2d");
let net = null;

const glasses = new Image();
glasses.src = "./glasses.webp";

const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;

const GLASSES_WIDTH = 150;
const GLASSES_HEIGHT = 75;

const getWebCam = async () => {
  try {
    net = await posenet.load({
      architecture: "MobileNetV1",
      outputStride: 16,
      inputResolution: { width: VIDEO_WIDTH, height: VIDEO_HEIGHT },
      multiplier: 0.75,
    });

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: VIDEO_WIDTH,
        height: VIDEO_HEIGHT,
      },
    });

    $video.addEventListener("loadeddata", () => requestAnimationFrame(render));
    $video.srcObject = stream;

    $video.width = VIDEO_WIDTH;
    $video.height = VIDEO_HEIGHT;
    $canvas.width = VIDEO_WIDTH;
    $canvas.height = VIDEO_HEIGHT;

    console.log("model loaded");
  } catch (err) {
    console.error(err);
  }
};

const render = async () => {
  try {
    const { keypoints } = await net.estimateSinglePose(video, {
      flipHorizontal: false,
    });
    requestAnimationFrame(render);

    const leftEye = keypoints[1];
    const rightEye = keypoints[2];

    const mid = [
      (rightEye.position.x + leftEye.position.x) / 2,
      (rightEye.position.y + leftEye.position.y) / 2,
    ];

    ctx.clearRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
    ctx.save();
    const angle = Math.atan2(
      leftEye.position.y - rightEye.position.y,
      leftEye.position.x - rightEye.position.x
    );

    ctx.translate(mid[0], mid[1]);
    ctx.rotate(angle);
    ctx.drawImage(
      glasses,
      -GLASSES_WIDTH / 2,
      -GLASSES_HEIGHT / 2,
      GLASSES_WIDTH,
      GLASSES_HEIGHT
    );

    ctx.restore();
  } catch (err) {
    console.error(err);
  }
};

getWebCam();
