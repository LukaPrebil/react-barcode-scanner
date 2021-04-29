import Webcam from "react-webcam";
import "./App.css";
import React from "react";
import styled from "styled-components";

const AppWrapper = styled.div`
  height: 100%;
  overflow: hidden;
`;

const ZoomSlider = styled.input`
  width: 80%;
  margin: 20px;
`;

const ButtonWrapper = styled.div`
  display: flex;
  flex-direction: row;
`;

const ScanButton = styled.button`
  margin: 20px;
  flex-grow: 1;
  height: 30px;
  background-color: black;
  color: white;
  border-radius: 15px;
`;

const TorchButton = styled.button`
  flex-grow: 0;
  margin: 20px;
  height: 30px;
  border-radius: 15px;
`;

const Wrapper = styled.div`
  position: fixed;
  bottom: 10px;
  top: calc(100% - 100px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const noop = () => null;

function App() {
  const webcamRef = React.useRef();

  const [barcode, setBarcode] = React.useState("");
  /**
   * @type [Worker, (worker: Worker) => void]
   */
  const [barcodeWorker, setBarcodeWorker] = React.useState();
  React.useEffect(() => {
    const worker = new Worker("/worker.js");
    setBarcodeWorker(worker);
    return () => {
      worker.terminate();
    };
  }, []);

  React.useEffect(() => {
    if (barcodeWorker) {
      barcodeWorker.onmessage = (e) => {
        scanningRef.current = false;
        console.log("worker response");
        if (e.data.success) {
          setBarcode(e.data.barcode);
          setScanning(false);
          setButtonText("Scan")
          console.log(`Barcode: ${e.data.barcode}`);
        }
      };
    }

    return () => {
      if (barcodeWorker) barcodeWorker.onmessage = noop;
    };
  }, [barcodeWorker]);

  const size = useWindowSize();
  const isLandscape = size.height <= size.width;
  const ratio = isLandscape
    ? size.width / size.height
    : size.height / size.width;

  const [buttonText, setButtonText] = React.useState("Scan");

  const scanningRef = React.useRef(false);
  const [scanning, setScanning] = React.useState(false);

  const scan = () => {
    setScanning(!scanning);
    setButtonText(buttonText === "Scan" ? "Scanning" : "Scan");
  };

  React.useEffect(() => {
    if (barcodeWorker && !barcode && scanning) {
      console.log({barcodeWorker, barcode, scanning})
      function findBarcode() {
        console.log(scanningRef.current);
        if (scanningRef.current) return;
        scanningRef.current = true;
        setButtonText("Scanning");
        createImageBitmap(webcamRef.current.video).then(image => barcodeWorker.postMessage(image));
      }

      const interval = setInterval(findBarcode, 300);
      return () => {
        console.log(`Clearing interval ${interval}`);
        clearInterval(interval);
      };
    }
  }, [barcode, barcodeWorker, scanning]);

  return (
    <AppWrapper>
      <Webcam
        audio={false}
        width={size.width}
        height={size.height}
        videoConstraints={{
          facingMode: "environment",
          aspectRatio: ratio,
          resizeMode: "crop-and-scale",
        }}
        ref={webcamRef}
        onUserMedia={(stream) => {
          console.log("onUserMedia")
          // setCameraCapabilities(stream.getVideoTracks()[0].getCapabilities());
          // setInitialSettings(stream.getVideoTracks()[0].getSettings());
        }}
      />
      <Wrapper>
        <ButtonWrapper>
          <ScanButton onClick={scan}>{buttonText}</ScanButton>
        </ButtonWrapper>
      </Wrapper>
    </AppWrapper>
  );
}

function useWindowSize() {
  // Initialize state with undefined width/height so server and client renders match
  // Learn more here: https://joshwcomeau.com/react/the-perils-of-rehydration/
  const [windowSize, setWindowSize] = React.useState({
    width: undefined,
    height: undefined,
  });

  React.useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      // Set window width/height to state
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Call handler right away so state gets updated with initial window size
    handleResize();

    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty array ensures that effect is only run on mount

  return windowSize;
}

export default App;
