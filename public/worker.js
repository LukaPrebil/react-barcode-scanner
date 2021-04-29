const detector = new self.BarcodeDetector(); // eslint-disable-line no-restricted-globals

// eslint-disable-next-line no-restricted-globals
self.addEventListener("message", (image) => {
  if (!image) return;
  console.time("worker_message")
  detector
    .detect(image.data)
    .then((barcodes) => {
      if (!!barcodes.length) {
        console.log("success");
        console.timeEnd("worker_message");
        postMessage({ barcode: barcodes[0].rawValue, success: true });
      } else {
        console.log("fail");
        console.timeEnd("worker_message");
        postMessage({ barcode: null, success: false });
      }
    })
    .catch((err) => console.error(`Failure when detecting barcode, ${err}`));
});
