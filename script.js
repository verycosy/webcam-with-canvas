const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;

const $videoCanvas = document.getElementById("video-canvas");
$videoCanvas.width = VIDEO_WIDTH;
$videoCanvas.height = VIDEO_HEIGHT;

const $graphicCanvas = document.getElementById("graphic-canvas");
$graphicCanvas.width = VIDEO_WIDTH;
$graphicCanvas.height = VIDEO_HEIGHT;

const videoWorker = new Worker("./video-worker.js");

async function createVideoFromWebcam() {
  video = document.createElement("video");
  video.autoplay = true;
  video.controls = true;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: VIDEO_WIDTH,
        height: VIDEO_HEIGHT,
      },
    });

    video.addEventListener("canplay", () => {
      const imageCapture = new ImageCapture(stream.getVideoTracks()[0]);

      function sendToWorker() {
        imageCapture
          .grabFrame()
          .then((imageBitmap) => {
            videoWorker.postMessage({ cmd: "RENDER", imageBitmap }, [
              imageBitmap,
            ]);
          })
          .catch((err) => err && console.error(err));

        requestAnimationFrame(sendToWorker);
      }

      requestAnimationFrame(sendToWorker);
    });

    video.srcObject = stream;
  } catch (err) {
    console.error(err);
  }
}

async function init() {
  try {
    const videoOffscreen = $videoCanvas.transferControlToOffscreen();
    const graphicOffscreen = $graphicCanvas.transferControlToOffscreen();

    const glasses = new Image();

    glasses.onload = (e) => {
      createImageBitmap(glasses).then((bmp) => {
        videoWorker.postMessage(
          {
            cmd: "READY",
            videoCanvas: videoOffscreen,
            graphicCanvas: graphicOffscreen,
            width: VIDEO_WIDTH,
            height: VIDEO_HEIGHT,
            glasses: bmp,
          },
          [videoOffscreen, graphicOffscreen, bmp]
        );
      });
    };
    glasses.src = "./glasses.webp";

    await createVideoFromWebcam();
  } catch (err) {
    console.error(err);
  }
}

init();
